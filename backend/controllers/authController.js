const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    // check exists
    const [existing] = await pool.query('SELECT user_id FROM `user` WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ message: 'Email already used' });

    // hash
    const hash = await bcrypt.hash(password, 10);

    // insert user
    const [result] = await pool.query(
      'INSERT INTO `user` (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role || 'Passenger']
    );

    const userId = result.insertId;

    // create passenger/admin profile
    const lowerRole = (role || 'Passenger').toLowerCase();
    if (lowerRole === 'passenger') {
      await pool.query('INSERT INTO passenger (user_id) VALUES (?)', [userId]).catch(()=>{});
    } else if (lowerRole === 'admin') {
      await pool.query('INSERT INTO admin (user_id) VALUES (?)', [userId]).catch(()=>{});
    }

    return res.status(201).json({ message: 'Registered', user_id: userId });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const [rows] = await pool.query('SELECT * FROM `user` WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { user_id: user.user_id, role: user.role, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    return res.json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };
