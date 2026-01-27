import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/client";
import { setSession } from "../../utils/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const data = res?.data ?? {};
      const token = data.token ?? data.accessToken ?? data.authToken ?? null;
      let user = data.user ?? data.userInfo ?? data.data ?? null;

      if (token && !user) {
        localStorage.setItem("token", token);
        localStorage.setItem("nk_token", token);
        try {
          const me = await api.get("/auth/me");
          user = me.data?.user ?? me.data ?? null;
        } catch {
        }
      }

      if (!token) {
        setErr("Login failed: no token returned");
        setLoading(false);
        return;
      }

      if (!user) user = { email, name: email, role: "Passenger" };

      if (user.role && typeof user.role === "string") {
        const r = user.role.toLowerCase();
        user.role = r === "admin" ? "Admin" : (r === "passenger" ? "Passenger" : user.role);
      }

      try {
        setSession(token, user);
      } catch {
        const now = Date.now();
        localStorage.setItem("nk_token", token);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("nk_login_at", String(now));
        localStorage.setItem("nk_expires_at", String(now + 30 * 60 * 1000));
      }

      const next = searchParams.get("next");
      if (next) {
        navigate(next);
        setTimeout(() => window.location.reload(), 40);
        return;
      }

      if (user.role === "Admin") navigate("/admin");
      else navigate("/bookings");

      setTimeout(() => window.location.reload(), 50);
    } catch (error: any) {
      console.error("Login error:", error);
      setErr(error?.response?.data?.message ?? error?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container" style={{ display: "flex", justifyContent: "center", paddingTop: 28 }}>
      <div className="card" style={{ width: 520, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <p className="sub">Sign in to manage bookings or continue to book your flight.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" />

          <label className="label" style={{ marginTop: 8 }}>Password</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Enter your password" />

          {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
          </div>

          <div className="helper" style={{ marginTop: 12 }}>
            New here? <a href="/auth/register" className="link">Create an account</a>
          </div>
        </form>
      </div>
    </div>
  );
}
