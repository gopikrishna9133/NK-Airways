import React from "react";
import { useLocation, Link } from "react-router-dom";

function useQuery() {
  return Object.fromEntries(new URLSearchParams(useLocation().search));
}

function extractPnr(obj: any) {
  if (!obj) return null;
  return obj.pnr ?? obj.PNR ?? obj.reference ?? obj.ref ?? null;
}

export default function BookingConfirmation() {
  const q = useQuery();
  const pnr = q.pnr as string | undefined;
  const bookingId = q.booking_id as string | undefined;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl mb-4">Booking confirmed</h1>

      {pnr ? (
        <>
          <p className="mb-2">Your PNR: <strong>{pnr}</strong></p>
        </>
      ) : (
        <p className="mb-2">Your booking was created. PNR is not provided by the backend for this booking.</p>
      )}

      <p className="mb-4">Booking ID: {bookingId ?? "—"}</p>

      <div className="space-x-3">
        <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded">My Bookings</Link>
        <Link to="/" className="px-4 py-2 border rounded">Home</Link>
      </div>
    </div>
  );
}
