import React from "react";
import { Navigate, useLocation } from "react-router-dom";

type Props = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePassenger?: boolean;
};

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (parsed && parsed.role) {
      parsed.role = typeof parsed.role === "string"
        ? (parsed.role.toLowerCase() === "admin" ? "Admin" : (parsed.role.toLowerCase() === "passenger" ? "Passenger" : parsed.role))
        : parsed.role;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

export default function ProtectedRoute({ children, requireAdmin = false, requirePassenger = false }: Props) {
  const location = useLocation();
  const user = getUserFromStorage();

  if (!user) {
    const next = encodeURIComponent(location.pathname + (location.search || ""));
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }

  if (requireAdmin && user.role !== "Admin") {
    return <Navigate to={`/auth/login`} replace />;
  }
  if (requirePassenger && user.role !== "Passenger") {
    return <Navigate to={`/auth/login`} replace />;
  }

  return <>{children}</>;
}
