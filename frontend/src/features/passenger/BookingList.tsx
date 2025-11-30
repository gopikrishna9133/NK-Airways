import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
import * as authMod from "../../hooks/useAuth";
import { Link } from "react-router-dom";

function getUser() {
  try {
    if (typeof authMod === "function") {
      const ctx = (authMod as any)();
      return ctx?.user ?? ctx;
    }
    if ((authMod as any).useAuth) {
      const ctx = (authMod as any).useAuth();
      return ctx?.user ?? ctx;
    }
    return (authMod as any).user ?? JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return JSON.parse(localStorage.getItem("user") || "null");
  }
}

export default function BookingList() {
  const user = getUser();

  const q = useQuery({
    queryKey: ["bookings", user?.passenger_id ?? user?.user_id ?? "me"],
    queryFn: async () => {
      const res = await api.get("/bookings");
      return Array.isArray(res.data) ? res.data : res.data?.bookings ?? res.data?.results ?? [];
    },
    enabled: !!user,
  });

  if (!user) return <div>Please login to view bookings.</div>;
  if (q.isLoading) return <div>Loading bookings...</div>;
  if (q.isError) return <div>Failed to load bookings.</div>;

  const bookings = q.data as any[];

  return (
    <div>
      {bookings.length === 0 && <div>No bookings found.</div>}
      <div style={{ display: "grid", gap: 12 }}>
        {bookings.map((b: any) => {
          const id = b.booking_id ?? b.id;
          const pnr = b.PNR ?? b.pnr ?? b.reference ?? b.ref ?? "—";
          const amount = b.total_amount ?? b.amount ?? b.price ?? b.total ?? b.fare;
          return (
            <div key={id} style={{ background: "#fff", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800 }}>{pnr} — {b.flight_no ?? b.flight?.flight_no ?? "-"}</div>
                <div style={{ color: "#64748b" }}>{b.origin_location ?? b.route?.origin_location ?? "-"} → {b.destination_location ?? b.route?.destination_location ?? "-"}</div>
                <div style={{ marginTop: 6 }}>Seat: {b.seat_number ?? b.seat_no ?? b.seat ?? "-"}</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Status: {b.booking_status ?? b.status ?? "Confirmed"}</div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ textAlign: "right", minWidth: 90 }}>
                  <div style={{ fontWeight: 700 }}>{ amount != null ? (typeof amount === "number" ? `$${Number(amount).toFixed(2)}` : amount) : "-" }</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Total</div>
                </div>

                <Link to={`/bookings/${id}`} className="btn-primary" style={{ background: "#0b1220", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>View</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
