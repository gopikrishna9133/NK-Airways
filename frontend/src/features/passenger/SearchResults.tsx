import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/client";

function parseFlexibleDate(val: any): Date | null {
  if (val === null || val === undefined) return null;
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
function computeDurationString(depVal: any, arrVal: any) {
  const d1 = parseFlexibleDate(depVal);
  const d2 = parseFlexibleDate(arrVal);
  if (!d1 || !d2) return null;
  const diff = d2.getTime() - d1.getTime();
  if (isNaN(diff) || diff <= 0) return null;
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hrs}h ${mins}m`;
}

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [rawResp, setRawResp] = useState<any>(null);

  const qs = new URLSearchParams(location.search);
  const origin = qs.get("origin") ?? undefined;
  const destination = qs.get("destination") ?? undefined;
  const date = qs.get("date") ?? undefined;

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (origin) params.origin = origin;
    if (destination) params.destination = destination;
    if (date) params.date = date;

    api.get("/schedules", { params })
      .then((r) => {
        setRawResp(r.data);
        const data = Array.isArray(r.data) ? r.data : r.data?.schedules ?? r.data?.results ?? [];
        setSchedules(data);
      })
      .catch((e) => {
        console.error("[SearchResults] fetch error", e);
        setRawResp({ error: String(e) });
        setSchedules([]);
      })
      .finally(() => setLoading(false));
  }, [origin, destination, date]);

  if (loading) return <div>Searching flights...</div>;
  if (!schedules || schedules.length === 0) {
    return (
      <div>
        <div>No flights found.</div>
        <details style={{ marginTop: 12 }}>
          <summary>Raw response (debug)</summary>
          <pre style={{ maxHeight: 300, overflow: "auto", background: "#fff", padding: 8 }}>{JSON.stringify(rawResp, null, 2)}</pre>
        </details>
      </div>
    );
  }

  return (
    <div>
      <h1>Search Results</h1>
      <div style={{ display: "grid", gap: 12 }}>
        {schedules.map((s: any) => {

          const originLabel = s.origin_display ?? s.origin_location ?? s.route?.origin_location ?? "—";
          const destLabel = s.destination_display ?? s.destination_location ?? s.route?.destination_location ?? "—";

          const dep = s.departure_iso ?? s.departure_datetime ?? s.departure ?? s.schedule?.departure_datetime ?? s.schedule?.departure;
          const arr = s.arrival_iso ?? s.arrival_datetime ?? s.arrival ?? s.schedule?.arrival_datetime ?? s.schedule?.arrival;
          const duration = computeDurationString(dep, arr) ?? (s.duration ?? s.travel_time ?? null);


          const dist = s.distance ?? s.route?.distance ?? null;
          const distStr = dist != null ? `${Number(dist).toLocaleString(undefined, { maximumFractionDigits: 1 })} mi` : null;

          const priceCandidate = s.min_price ?? s.economy_price ?? s.economy?.price ?? s.price ?? s.minEconomyPrice ?? s.min_economy_price ?? null;
          const price = (priceCandidate !== null && priceCandidate !== undefined && !Number.isNaN(Number(priceCandidate)))
            ? `$${Number(priceCandidate).toFixed(2)}`
            : "—";

          const flightNo = s.flight_no ?? s.flight?.flight_no ?? s.schedule?.flight_no ?? "Flight";

          return (
            <div key={s.schedule_id ?? s.id ?? Math.random()} style={{ background: "#fff", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800 }}>{flightNo}</div>
                <div style={{ color: "#64748b", marginTop: 6 }}>{originLabel} → {destLabel}</div>

                <div style={{ color: "#64748b", marginTop: 6, display: "flex", gap: 12, alignItems: "center" }}>
                  {duration ? <div><strong>Duration:</strong> {duration}</div> : null}
                  {distStr ? <div style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: 999 }}>{distStr}</div> : null}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{price}</div>
                <button className="btn-primary" onClick={() => navigate(`/schedule/${s.schedule_id ?? s.id}`)}>Select Flight</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
