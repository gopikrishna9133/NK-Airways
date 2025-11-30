import React from "react";
import { Outlet } from "react-router-dom";

export default function AdminShell() {
  return (
    <div>
      <div style={{ marginTop: 18 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 6px 18px rgba(11,37,69,0.03)" }}>
          <Outlet />
          <div style={{ color: "#64748b", marginTop: 12 }}>
            Use the tabs above to manage Flights, Routes, Schedules, Tiers, Prices and Reports.
          </div>
        </div>
      </div>
    </div>
  );
}
