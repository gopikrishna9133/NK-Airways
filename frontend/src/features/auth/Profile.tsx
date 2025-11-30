import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type UserProfile = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
};

export default function Profile() {
  const nav = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      nav("/auth/login");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setUser({
        id: parsed.user_id ?? parsed.userId ?? parsed.id ?? parsed._id,
        name: parsed.name ?? parsed.fullName ?? "",
        email: parsed.email ?? "",
        role: parsed.role ?? parsed.type ?? "Passenger",
      });
    } catch {
      nav("/auth/login");
    }
  }, [nav]);

  if (!user) return null;

  const isAdmin = (user.role || "").toLowerCase() === "admin";
  const isPassenger = (user.role || "").toLowerCase() === "passenger";

  const cardStyle: React.CSSProperties = { maxWidth: 760, margin: "8px auto", padding: 12 };
  const panelStyle: React.CSSProperties = { marginTop: 10, border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, padding: 12, background: "#fff" };
  const fieldStyle: React.CSSProperties = { padding: "8px 10px", background: "#f7fafc", borderRadius: 6, border: "1px solid rgba(0,0,0,0.04)" };

  return (
    <div className="app-container" style={{ paddingTop: 12 }}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0, marginBottom: 6, fontSize: 20 }}>My Profile</h1>

        <div style={panelStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="label" style={{ fontSize: 13 }}>Full Name</label>
              <div style={fieldStyle}>{user.name || "-"}</div>
            </div>

            <div>
              <label className="label" style={{ fontSize: 13 }}>Email</label>
              <div style={fieldStyle}>{user.email || "-"}</div>
            </div>

            {isAdmin && (
              <>
                <div>
                  <label className="label" style={{ fontSize: 13 }}>Role</label>
                  <div style={fieldStyle}>{user.role || "Admin"}</div>
                </div>
                <div />
              </>
            )}
          </div>

          <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
            This profile is read-only in the frontend. To update details use backend tools.
          </div>
        </div>
      </div>
    </div>
  );
}
