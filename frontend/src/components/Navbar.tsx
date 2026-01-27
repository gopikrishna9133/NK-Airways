import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const user = readUser();

  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";
  const isPassenger = user && !isAdmin;

  const isProfilePage = path === "/profile" || path.startsWith("/profile");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("nk_token");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("passeneger_token");
    localStorage.removeItem("user");
    localStorage.removeItem("nk_login_at");
    localStorage.removeItem("nk_expires_at");
    navigate("/auth/login", { replace: true });

  };

  useEffect(() => {
    try {
      const exp = Number(localStorage.getItem("nk_expires_at") || "0");
      const now = Date.now();
      if (!exp) return;
      if (now >= exp) {
        logout();
        return;
      }
      const t = setTimeout(() => logout(), exp - now);
      return () => clearTimeout(t);
    } catch {}
  }, []);
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === "nk_token" && e.newValue === null) {
        navigate("/auth/login", { replace: true });

      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);


  const pricingPaths = ["/admin/tiers", "/admin/prices", "/admin/reports"];

  function showPricingSubtabs() {
    return pricingPaths.some(p => path === p || path.startsWith(p + "/") || path.startsWith(p));
  }

  const showPricing = isAdmin && !isProfilePage && showPricingSubtabs();
  const showManage = isAdmin && !isProfilePage && !showPricing;

  const headerStyle: React.CSSProperties = { background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 60 };
  const containerStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" };
  const leftStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 14 };
  const actionsStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12 };

  return (
    <header style={headerStyle}>
      <div className="app-container" style={containerStyle}>
        <div style={leftStyle}>
          <NavLink
            to={location.pathname}
            style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit", cursor: "pointer" }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(180deg,#2b6ef6,#0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}>
              <i className="fa-solid fa-plane-departure" />
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#07132a" }}>NK Airlines</div>
          </NavLink>

          {isAdmin ? (
            <>
              <NavLink to="/admin/flights" className={({ isActive }) => (isActive ? "pill-btn pill-active" : "pill-btn")}>
                <i className="fa-solid fa-plane" /> Manage Flights
              </NavLink>

              <NavLink to="/admin/tiers" className={({ isActive }) => (isActive ? "pill-btn pill-active" : "pill-btn")}>
                <i className="fa-solid fa-dollar-sign" /> Set Pricing
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/search" className="pill-btn">
                <i className="fa-solid fa-magnifying-glass" /> Search Flights
              </NavLink>

              {isPassenger && (
                <NavLink to="/bookings" className="pill-btn">
                  <i className="fa-solid fa-calendar-check" /> My Bookings
                </NavLink>
              )}
            </>
          )}
        </div>

        <div style={actionsStyle}>
          {user ? (
            <>
              <NavLink to="/profile" className="pill-btn"><i className="fa-solid fa-user" /> Profile</NavLink>
              <button className="pill-btn" onClick={logout}><i className="fa-solid fa-arrow-right-from-bracket" /> Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/auth/login" className="pill-btn"><i className="fa-solid fa-right-to-bracket" /> Login</NavLink>
              <NavLink to="/auth/register" className="pill-btn"><i className="fa-solid fa-user-plus" /> Register</NavLink>
            </>
          )}
        </div>
      </div>

      {showManage && (
        <div style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          <div className="app-container" style={{ padding: "12px 0 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <NavLink to="/admin/flights" className={({ isActive }) => (isActive ? "subtab active" : "subtab")}><i className="fa-solid fa-plane" /> Flights</NavLink>
            <NavLink to="/admin/routes" className={({ isActive }) => (isActive ? "subtab active" : "subtab")}><i className="fa-solid fa-route" /> Routes</NavLink>
            <NavLink to="/admin/schedules" className={({ isActive }) => (isActive ? "subtab active" : "subtab")}><i className="fa-solid fa-calendar-days" /> Schedules</NavLink>
          </div>
        </div>
      )}

      {showPricing && (
        <div style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          <div className="app-container" style={{ padding: "12px 0 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <NavLink to="/admin/tiers" className={({ isActive }) => (isActive ? "subtab active" : "subtab")}><i className="fa-solid fa-layer-group" /> Tiers</NavLink>
            <NavLink to="/admin/prices" className={({ isActive }) => (isActive ? "subtab active" : "subtab")}><i className="fa-solid fa-tag" /> Prices</NavLink>
            <NavLink to="/admin/reports" className={({ isActive }) => (isActive ? "subtab active" : "subtab")}><i className="fa-solid fa-chart-line" /> Reports</NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
