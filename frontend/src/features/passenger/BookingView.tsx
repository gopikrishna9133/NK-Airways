import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";

function parseFlexibleDate(val: any): Date | null {
  if (val == null) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : new Date(val.getTime());
  if (typeof val === "number") {
    if (val > 0 && val < 1e12) return new Date(val * 1000);
    return new Date(val);
  }
  if (typeof val === "string") {
    const s = val.trim();
    const iso = Date.parse(s);
    if (!isNaN(iso)) return new Date(iso);
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (m) {
      const [, Y, M, D, h, mm, ss] = m;
      const local = new Date(Number(Y), Number(M) - 1, Number(D), Number(h), Number(mm), Number(ss || 0));
      if (!isNaN(local.getTime())) return local;
    }
    const asNum = Number(s);
    if (!Number.isNaN(asNum)) return parseFlexibleDate(asNum);
  }
  return null;
}
function fmtDate(val: any) {
  const d = parseFlexibleDate(val);
  return d ? d.toLocaleString() : "—";
}
function computeDurationString(depVal: any, arrVal: any) {
  const d1 = parseFlexibleDate(depVal);
  const d2 = parseFlexibleDate(arrVal);
  if (!d1 || !d2) return "—";
  const diff = d2.getTime() - d1.getTime();
  if (isNaN(diff) || diff <= 0) return "—";
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hrs}h ${mins}m`;
}

export default function BookingView() {
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id || 0);
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) { setLoading(false); return; }
    setLoading(true);
    api.get(`/bookings/${bookingId}`)
      .then(r => {
        const data = r.data?.booking ?? r.data ?? null;
        setBooking(data);
      })
      .catch(e => { console.error(e); setBooking(null); })
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) return <div>Loading booking...</div>;
  if (!booking) return (
    <div>
      <div>Booking not found.</div>
    </div>
  );


  const depCandidate = booking.departure_iso ?? booking.departure_datetime ?? booking.schedule?.departure_datetime ?? booking.schedule?.departure ?? null;
  const arrCandidate = booking.arrival_iso ?? booking.arrival_datetime ?? booking.schedule?.arrival_datetime ?? booking.schedule?.arrival ?? null;

  const departure = fmtDate(depCandidate);
  const arrival = fmtDate(arrCandidate);
  const duration = computeDurationString(depCandidate, arrCandidate);

  const flightNo = booking.flight_no ?? booking.flight?.flight_no ?? booking.flight?.flight_name ?? "—";
  const flightName = booking.flight_name ?? booking.flight?.flight_name ?? null;
  const origin = booking.origin_location ?? booking.route?.origin_location ?? booking.schedule?.origin_location ?? "—";
  const destination = booking.destination_location ?? booking.route?.destination_location ?? booking.schedule?.destination_location ?? "—";
  const seatNumber = booking.seat_number ?? booking.seat ?? booking.schedule_seat?.seat_number ?? "—";
  const tier = booking.tier_name ?? booking.tier ?? booking.seat_class ?? booking.seat_tier ?? "—";
  const pnr = booking.PNR ?? booking.pnr ?? booking.reference ?? booking.ref ?? "—";
  const status = booking.booking_status ?? booking.status ?? "—";
  const amountVal = booking.total_amount ?? booking.amount ?? booking.price ?? booking.total ?? booking.fare;
  const amountStr = amountVal != null && !Number.isNaN(Number(amountVal)) ? `$${Number(amountVal).toFixed(2)}` : "—";

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ background: "#fff", padding: 18, borderRadius: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{flightNo} {flightName ? <span style={{ fontWeight: 500, marginLeft: 8 }}>{flightName}</span> : null}</div>
            <div style={{ color: "#64748b", marginTop: 6 }}>
              {origin} → {destination}
            </div>

            <div style={{ marginTop: 12 }}>
              <div><strong>Departure:</strong> {departure}</div>
              <div><strong>Arrival:</strong> {arrival}</div>
              <div><strong>Duration:</strong> {duration}</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div><strong>Status:</strong> {status}</div>
              <div style={{ marginTop: 6 }}><strong>Booked at:</strong> {booking.booking_date ? fmtDate(booking.booking_date) : "—"}</div>
            </div>
          </div>

          <div style={{ textAlign: "right", minWidth: 220 }}>
            <div><strong>Seat</strong></div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{seatNumber}</div>

            <div style={{ marginTop: 12 }}><strong>Tier / Class</strong></div>
            <div>{tier}</div>

            <div style={{ marginTop: 12 }}><strong>PNR:</strong> {pnr}</div>
            <div style={{ marginTop: 12 }}><strong>Amount:</strong> {amountStr}</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <button className="pill-btn" onClick={() => navigate("/bookings")}>Back to My Bookings</button>
        </div>
      </div>
    </div>
  );
}
