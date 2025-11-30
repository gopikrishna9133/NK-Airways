const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");

    req.userId = payload.user_id || payload.userId || payload.id || payload.sub;
    if (!req.userId) return res.status(401).json({ message: "Invalid token payload (no user id)" });
    next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function getProfile(req, res) {
  try {
    const userId = req.userId;
    const [rows] = await pool.query(
      "SELECT user_id, name, email, role, phone, dob FROM `user` WHERE user_id = ?",
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.userId;
    const { name, email, phone, dob, role } = req.body;


    if (name !== undefined && (!name || name.trim() === "")) {
      return res.status(422).json({ message: "Name is required" });
    }
    if (email !== undefined && typeof email === "string" && !email.includes("@")) {
      return res.status(422).json({ message: "Invalid email" });
    }

    if (email) {
      const [eRows] = await pool.query("SELECT user_id FROM `user` WHERE email = ? AND user_id <> ?", [email, userId]);
      if (eRows.length) return res.status(400).json({ message: "Email already in use" });
    }

    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
    if (dob !== undefined) { updates.push("dob = ?"); params.push(dob); }
    if (role !== undefined) { updates.push("role = ?"); params.push(role); }

    if (updates.length === 0) return res.status(400).json({ message: "No fields to update" });

    params.push(userId);
    const sql = `UPDATE \`user\` SET ${updates.join(", ")} WHERE user_id = ?`;
    await pool.query(sql, params);

    const [rows] = await pool.query("SELECT user_id, name, email, role, phone, dob FROM `user` WHERE user_id = ?", [userId]);
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


async function changePassword(req, res) {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both currentPassword and newPassword required" });
    if (newPassword.length < 6) return res.status(422).json({ message: "New password must be ≥6 chars" });

    const [rows] = await pool.query("SELECT password_hash FROM `user` WHERE user_id = ?", [userId]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) return res.status(401).json({ message: "Current password incorrect" });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE `user` SET password_hash = ? WHERE user_id = ?", [hash, userId]);

    return res.json({ message: "Password changed" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { authMiddleware, getProfile, updateProfile, changePassword };
