import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../hooks/useAuth";

type Seat = any;

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
    const n = Number(s);
    if (!Number.isNaN(n)) return parseFlexibleDate(n);
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

export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const scheduleId = Number(id || 0);
  const navigate = useNavigate();
  const location = useLocation();
  const authState = (useAuth() as any) || {};
  const authUser = authState?.user ?? null;

  const [schedule, setSchedule] = useState<any>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [bookingBusy, setBookingBusy] = useState(false);

  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [passenger, setPassenger] = useState({ name: "", phone: "", dob: "", passport: "", email: "" });

  const [resolvedPrice, setResolvedPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const resume = qs.get("resume");
    const seatIdParam = qs.get("seatId");
    if (resume === "passenger") {
      if (seatIdParam) {
        const n = Number(seatIdParam);
        if (!Number.isNaN(n)) setSelectedSeatId(n);
      }
      setShowPassengerForm(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!scheduleId) return;
    setLoading(true);
    Promise.all([
      api.get(`/schedules/${scheduleId}`).catch(() => ({ data: null })),
      api.get(`/schedule-seats/schedule/${scheduleId}`).catch(() => ({ data: [] })),
    ])
      .then(([sResp, seatsResp]) => {
        const sdata = sResp?.data?.schedule ?? sResp?.data ?? null;
        setSchedule(sdata);
        const list = Array.isArray(seatsResp?.data) ? seatsResp.data : seatsResp?.data?.seats ?? seatsResp?.data ?? [];
        setSeats(list);
      })
      .catch((err) => {
        console.error("Error loading schedule or seats:", err);
        setSeats([]);
        setSchedule(null);
      })
      .finally(() => setLoading(false));
  }, [scheduleId]);

  useEffect(() => {
    async function resolveSeatPrice() {
      setResolvedPrice(null);
      if (!selectedSeatId) return;
      const seat = seats.find(s => (s.schedule_seat_id ?? s.id) === selectedSeatId) ?? null;
      if (!seat) return;

      const maybePrice = seat.price ?? seat.amount ?? seat.fare ?? seat._price ?? seat.tier_price ?? null;
      if (maybePrice != null && maybePrice !== "") {
        const n = Number(maybePrice);
        if (!Number.isNaN(n)) {
          setResolvedPrice(n);
          return;
        }
      }

      const tierId = seat.tier_id ?? seat.tierId ?? seat.tier?.tier_id ?? null;
      if (!tierId) return;

      setPriceLoading(true);
      try {
        const resp = await api.get("/prices", { params: { tier_id: tierId } }).catch(() => ({ data: null }));
        const data = resp?.data ?? null;
        const list = Array.isArray(data) ? data : data?.prices ? data.prices : (data ? [data] : []);
        if (list.length > 0) {
          const p = list[0].price ?? list[0].amount ?? list[0].value ?? null;
          if (p != null) {
            const pn = Number(p);
            if (!Number.isNaN(pn)) setResolvedPrice(pn);
          }
        }
      } catch (e) {
        console.warn("resolveSeatPrice failed", e);
      } finally {
        setPriceLoading(false);
      }
    }
    resolveSeatPrice();
  }, [selectedSeatId, seats]);

  function selectSeat(seat: Seat) {
    const status = seat.seat_status ?? seat.status ?? "Available";
    if (status !== "Available") return;
    const thisId = seat.schedule_seat_id ?? seat.id ?? null;
    setSelectedSeatId(thisId);
  }

  function isUserLoggedIn(): boolean {
    try {
      const u = authUser;
      if (u && typeof u === "object") {
        if (u.user_id || u.id) return true;
        if (typeof u.email === "string" && u.email.includes("@")) return true;
      }
    } catch (e) {}
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const lu = JSON.parse(raw);
        if (lu && (lu.user_id || lu.id)) return true;
        if (typeof lu.email === "string" && lu.email.includes("@")) return true;
      }
    } catch (e) {}
    return false;
  }

  function handleContinueToPassenger() {
    if (!selectedSeatId) { alert("Please select an available seat first."); return; }
    if (!isUserLoggedIn()) {
      const nextPath = `/schedule/${scheduleId}?resume=passenger&seatId=${selectedSeatId}`;
      navigate(`/auth/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    setShowPassengerForm(true);
  }

  async function submitBooking() {
    if (!selectedSeatId || !scheduleId) { alert("Missing seat or schedule."); return; }
    if (!passenger.name || !passenger.phone || !passenger.email) { alert("Please enter name, phone and email."); return; }

    setBookingBusy(true);
    try {
      const payload: any = { schedule_id: scheduleId, schedule_seat_id: selectedSeatId };
      if (resolvedPrice != null && !Number.isNaN(resolvedPrice)) payload.total_amount = resolvedPrice;

      let passengerId: number | null = null;
      try {
        if (authUser && (authUser.passenger_id || authUser.user_id || authUser.id)) passengerId = authUser.passenger_id ?? authUser.user_id ?? authUser.id;
        else {
          const raw = localStorage.getItem("user");
          if (raw) {
            const lu = JSON.parse(raw);
            if (lu && (lu.passenger_id || lu.user_id || lu.id)) passengerId = lu.passenger_id ?? lu.user_id ?? lu.id;
          }
        }
      } catch (e) { }

      if (passengerId) payload.passenger_id = passengerId;
      else payload.passenger = { name: passenger.name, phone: passenger.phone, dob: passenger.dob || null, passport: passenger.passport || null, email: passenger.email };

      const resp = await api.post("/bookings", payload);
      const data = resp?.data ?? {};
      const bookingId =
        data.booking_id ?? data.insertId ?? data.insert_id ?? (data.booking && (data.booking.booking_id ?? data.booking.id)) ?? data.id;

      if (bookingId) { navigate(`/bookings/${bookingId}`); return; }

      alert("Booking created. Redirecting to My Bookings.");
      navigate("/bookings");
    } catch (err: any) {
      console.error("Create booking failed:", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Booking failed";
      alert(`Booking failed: ${msg}`);
    } finally {
      setBookingBusy(false);
    }
  }

  if (loading) return <div className="loading">Loading schedule & seats...</div>;
  if (!schedule) return <div className="not-found">Schedule not found.</div>;

  const flightNo = schedule.flight_no ?? schedule.flight?.flight_no ?? schedule.flight?.flight_name ?? "—";
  const flightName = schedule.flight_name ?? schedule.flight?.flight_name ?? null;
  const origin = schedule.origin_location ?? schedule.route?.origin_location ?? "—";
  const destination = schedule.destination_location ?? schedule.route?.destination_location ?? "—";
  const depCandidate = schedule.departure_datetime ?? schedule.departure_iso ?? schedule.departure ?? null;
  const arrCandidate = schedule.arrival_datetime ?? schedule.arrival_iso ?? schedule.arrival ?? null;
  const departure = fmtDate(depCandidate);
  const arrival = fmtDate(arrCandidate);
  const duration = computeDurationString(depCandidate, arrCandidate);

  function computeEconomyPrice(): number | null {
    const cand = schedule?.min_price ?? schedule?.economy_price ?? schedule?.min_economy_price ?? schedule?.minEconomyPrice ?? null;
    if (cand !== null && cand !== undefined && !Number.isNaN(Number(cand))) return Number(cand);
    const seatPrices = seats.map(s => {
      const p = s.price ?? s.amount ?? s.fare ?? s._price ?? null;
      return (p !== null && p !== undefined && !Number.isNaN(Number(p))) ? Number(p) : null;
    }).filter(v => v !== null) as number[];
    if (seatPrices.length) return Math.min(...seatPrices);
    return null;
  }
  const economyPriceVal = computeEconomyPrice();
  const economyPriceStr = economyPriceVal != null ? `$${Number(economyPriceVal).toFixed(2)}` : "—";

  function seatClassLabel(s: Seat): "Business" | "Economy" | "Other" {
    const clsRaw =
      (s.cabin ?? s.class ?? s.seat_class ?? s.cabin_class ?? s.tier_name ?? s.tier?.name ?? s.section ?? "") + "";
    const cls = clsRaw.toLowerCase();
    if (cls.includes("business") || cls.includes("biz") || cls.includes("first") || cls.includes("premium")) return "Business";
    if (cls.includes("econ") || cls.includes("coach") || cls.includes("standard") || cls.includes("economy")) return "Economy";
    const tierId = s.tier_id ?? s.tierId ?? s.tier?.tier_id ?? null;
    if (tierId && Number(tierId) <= 2) return "Business";
    return "Other";
  }

  const sections: Record<string, Record<string, Seat[]>> = {};
  seats.forEach((s) => {
    const sec = seatClassLabel(s);
    if (!sections[sec]) sections[sec] = {};
    const seatNumber = s.seat_number ?? s.seat_no ?? s.number ?? s.label ?? "";
    const m = String(seatNumber).match(/^(\d+)/);
    const r = m ? m[1] : "0";
    if (!sections[sec][r]) sections[sec][r] = [];
    sections[sec][r].push(s);
  });

  const sectionOrder = ["Business", "Economy", "Other"];
  const selectedSeatObj = seats.find(s => (s.schedule_seat_id ?? s.id) === selectedSeatId) ?? null;
  const seatNumberLabel = selectedSeatObj ? (selectedSeatObj.seat_number ?? selectedSeatObj.seat_no ?? selectedSeatObj.number) : "—";

  return (
    <div className="seatmap-page">
      <div className="seatmap-left">
        <div className="flight-header">
          <div className="flight-title">
            <h2>{flightNo} {flightName ? <span className="flight-sub">{flightName}</span> : null}</h2>
            <div className="flight-route">{origin} → {destination}</div>
            <div className="flight-meta">Departure: {departure} • Arrival: {arrival} • Duration: {duration}</div>
          </div>
        </div>

        <div className="seatmap-card">
          <div className="seatmap-legend">
            <div className="legend-left">
              <div className="legend-item"><span className="legend-badge business" /> Business</div>
              <div className="legend-item"><span className="legend-badge economy" /> Economy</div>
              <div className="legend-item"><span className="legend-badge unavailable" /> Unavailable</div>
            </div>
            <div className="legend-right">Price: <strong>{resolvedPrice != null ? `$${resolvedPrice.toFixed(2)}` : economyPriceStr}</strong></div>
          </div>

          {sectionOrder.map((secKey) => {
            const secRows = sections[secKey];
            if (!secRows) return null;
            const rowKeys = Object.keys(secRows).sort((a, b) => Number(a) - Number(b));
            const totalSeats = rowKeys.reduce((acc, r) => acc + (secRows[r]?.length ?? 0), 0);

            return (
              <div key={secKey} className="seat-section">
                <div className="section-header">
                  <div className="section-title">{secKey}</div>
                  <div className="section-count">{totalSeats} seats</div>
                </div>

                {rowKeys.map((rk) => (
                  <div key={rk} className="seat-row">
                    <div className="row-number">{rk}</div>
                    <div className="row-seats">
                      {secRows[rk].sort((a, b) => String(a.seat_number ?? a.seat_no ?? "").localeCompare(String(b.seat_number ?? b.seat_no ?? ""))).map((ss: any) => {
                        const status = ss.seat_status ?? ss.status ?? "Available";
                        const isAvailable = status === "Available";
                        const thisId = ss.schedule_seat_id ?? ss.id;
                        const isSelected = selectedSeatId === thisId;
                        const cls = seatClassLabel(ss);
                        const seatLabel = ss.seat_number ?? ss.seat_no ?? ss.number ?? "";
                        return (
                          <button
                            key={thisId ?? `${rk}-${seatLabel}`}
                            onClick={() => selectSeat(ss)}
                            disabled={!isAvailable}
                            className={`seat ${cls === "Business" ? "seat-business" : cls === "Economy" ? "seat-economy" : "seat-other"} ${!isAvailable ? "seat-unavailable" : ""} ${isSelected ? "seat-selected" : ""}`}
                            title={`${seatLabel} — ${status}`}
                          >
                            <div className="seat-num">{seatLabel}</div>
                            <div className="seat-meta">{ss.price ? `$${Number(ss.price).toFixed(0)}` : (ss.tier_name ?? ss.tier?.name ?? "")}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="seatmap-right">
        <div className="booking-card">
          <h3>Booking</h3>
          <div className="booking-row">Selected seat: <strong>{seatNumberLabel}</strong></div>

          <div className="booking-price">
            <div>Price:</div>
            <div className="booking-price-value">{priceLoading ? "Loading…" : (resolvedPrice != null ? <strong>${resolvedPrice.toFixed(2)}</strong> : <span>{selectedSeatObj ? "—" : economyPriceStr}</span>)}</div>
          </div>

          {!showPassengerForm ? (
            <>
              <button className="btn-primary" onClick={handleContinueToPassenger} disabled={!selectedSeatId}>Continue</button>
              <div className="booking-note">You will enter passenger details and confirm payment on the next step.</div>
            </>
          ) : (
            <div className="passenger-form">
              <h4>Passenger details</h4>
              <label className="label">Full name</label>
              <input className="input" value={passenger.name} onChange={(e) => setPassenger({ ...passenger, name: e.target.value })} />

              <label className="label">Phone</label>
              <input className="input" value={passenger.phone} onChange={(e) => setPassenger({ ...passenger, phone: e.target.value })} />

              <label className="label">Email</label>
              <input className="input" value={passenger.email} onChange={(e) => setPassenger({ ...passenger, email: e.target.value })} />

              <label className="label">DOB</label>
              <input className="input" type="date" value={passenger.dob} onChange={(e) => setPassenger({ ...passenger, dob: e.target.value })} />

              <label className="label">Passport / ID</label>
              <input className="input" value={passenger.passport} onChange={(e) => setPassenger({ ...passenger, passport: e.target.value })} />

              <div className="total-row">Total: <span className="total-amount">{resolvedPrice != null ? `$${resolvedPrice.toFixed(2)}` : (selectedSeatObj ? "—" : economyPriceStr)}</span></div>

              <div className="form-actions">
                <button className="btn-primary" onClick={submitBooking} disabled={bookingBusy}>{bookingBusy ? "Processing..." : "Pay / Book"}</button>
                <button className="pill-btn" onClick={() => setShowPassengerForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
