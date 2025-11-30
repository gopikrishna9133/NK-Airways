import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useMutation } from "@tanstack/react-query";

type Props = {
  initial?: any | null;
  onDone?: () => void;
  onCancel?: () => void;
};

function formatToMySQL(dt: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const YYYY = dt.getFullYear();
  const MM = pad(dt.getMonth() + 1);
  const DD = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  const ss = pad(dt.getSeconds());
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

function inputToMySQLDatetime(value: string): string | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, Y, Mo, D, hh, mm] = m;
  const dt = new Date(Number(Y), Number(Mo) - 1, Number(D), Number(hh), Number(mm), 0);
  if (isNaN(dt.getTime())) return null;
  return formatToMySQL(dt);
}

function toInputDateTime(val: any): string {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s;


  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::\d{2})?/);
  if (m1) {
    const [, Y, Mo, D, hh, mm] = m1;
    return `${Y}-${Mo}-${D}T${hh}:${mm}`;
  }

  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (m2) {
    const [, Y, Mo, D, hh, mm] = m2;
    return `${Y}-${Mo}-${D}T${hh}:${mm}`;
  }

  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

export default function ScheduleForm({ initial = null, onDone, onCancel }: Props) {
  const [flightId, setFlightId] = useState(initial?.flight_id ?? "");
  const [routeId, setRouteId] = useState(initial?.route_id ?? "");
  const [departure, setDeparture] = useState<string>(toInputDateTime(initial?.departure_datetime ?? initial?.departure ?? ""));
  const [arrival, setArrival] = useState<string>(toInputDateTime(initial?.arrival_datetime ?? initial?.arrival ?? ""));
  const [flights, setFlights] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get("/admin/flights").then(r => setFlights(Array.isArray(r.data) ? r.data : [])).catch(() => setFlights([]));
    api.get("/admin/routes").then(r => setRoutes(Array.isArray(r.data) ? r.data : [])).catch(() => setRoutes([]));
  }, []);

  useEffect(() => {
    setFlightId(initial?.flight_id ?? "");
    setRouteId(initial?.route_id ?? "");
    setDeparture(toInputDateTime(initial?.departure_datetime ?? initial?.departure ?? ""));
    setArrival(toInputDateTime(initial?.arrival_datetime ?? initial?.arrival ?? ""));
    setErrorMsg(null);
  }, [initial]);

  const createMut = useMutation({
    mutationFn: async (payload: any) => api.post("/admin/schedules", payload),
    onSuccess: () => onDone && onDone(),
  });

  const updateMut = useMutation({
    mutationFn: async (payload: any) => {
      const id = initial?.schedule_id ?? initial?.id ?? null;
      if (!id) throw new Error("Missing schedule id");
      return api.put(`/admin/schedules/${id}`, payload);
    },
    onSuccess: () => onDone && onDone(),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      if (!flightId || !routeId || !departure || !arrival) {
        setErrorMsg("Flight, route, departure and arrival are required.");
        setSaving(false);
        return;
      }

      const depMy = inputToMySQLDatetime(departure);
      const arrMy = inputToMySQLDatetime(arrival);
      if (!depMy || !arrMy) {
        setErrorMsg("Invalid departure/arrival datetime format.");
        setSaving(false);
        return;
      }

      const payload: any = {
        flight_id: Number(flightId),
        route_id: Number(routeId),
        departure_datetime: depMy,
        arrival_datetime: arrMy
      };

      if (initial && (initial.schedule_id || initial.id)) {
        await updateMut.mutateAsync(payload);
      } else {
        await createMut.mutateAsync(payload);
      }
    } catch (err: any) {
      console.error("Failed to save schedule", err);
      const msg = err?.response?.data?.message || err?.message || String(err);
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
      {errorMsg && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 8, borderRadius: 6, marginBottom: 12 }}>
          {errorMsg}
        </div>
      )}

      <label className="label">Flight</label>
      <select className="input" value={flightId} onChange={(e) => setFlightId(e.target.value)} required>
        <option value="">Select flight</option>
        {flights.map(f => (
          <option key={f.flight_id ?? f.id} value={f.flight_id ?? f.id}>
            {f.flight_no} {f.flight_name ? `- ${f.flight_name}` : ""}
          </option>
        ))}
      </select>

      <label className="label" style={{ marginTop: 8 }}>Route</label>
      <select className="input" value={routeId} onChange={(e) => setRouteId(e.target.value)} required>
        <option value="">Select route</option>
        {routes.map(r => {
          const rid = r.route_id ?? r.id;
          const distStr = r.distance !== undefined && r.distance !== null && r.distance !== "" ? ` (${Number(r.distance).toLocaleString(undefined, { maximumFractionDigits: 1 })} mi)` : "";
          return (
            <option key={rid} value={rid}>
              {r.origin_location} → {r.destination_location}{distStr}
            </option>
          );
        })}
      </select>

      <label className="label" style={{ marginTop: 8 }}>Departure datetime</label>
      <input
        className="input"
        type="datetime-local"
        value={departure}
        onChange={(e) => setDeparture(e.target.value)}
        required
      />

      <label className="label" style={{ marginTop: 8 }}>Arrival datetime</label>
      <input
        className="input"
        type="datetime-local"
        value={arrival}
        onChange={(e) => setArrival(e.target.value)}
        required
      />

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save schedule"}</button>
        <button type="button" className="pill-btn" onClick={() => onCancel && onCancel()}>Cancel</button>
      </div>
    </form>
  );
}
