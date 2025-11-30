import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { useMutation } from "@tanstack/react-query";

type Props = {
  initial?: any | null;
  onDone?: () => void;
  onCancel?: () => void;
};

export default function FlightForm({ initial = null, onDone, onCancel }: Props) {
  const [flightNo, setFlightNo] = useState(initial?.flight_no ?? "");
  const [flightName, setFlightName] = useState(initial?.flight_name ?? "");
  const [totalSeats, setTotalSeats] = useState(initial?.total_seats ?? 150);
  const [aircraftType, setAircraftType] = useState(initial?.aircraft_type ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFlightNo(initial?.flight_no ?? "");
    setFlightName(initial?.flight_name ?? "");
    setTotalSeats(initial?.total_seats ?? 150);
    setAircraftType(initial?.aircraft_type ?? "");
  }, [initial]);

  const mutateCreate = useMutation({
    mutationFn: async (payload: any) => api.post("/admin/flights", payload),
    onSuccess: () => onDone && onDone(),
  });

  const mutateUpdate = useMutation({
    mutationFn: async (payload: any) => api.put(`/admin/flights/${initial.flight_id}`, payload),
    onSuccess: () => onDone && onDone(),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = { flight_no: flightNo, flight_name: flightName, total_seats: Number(totalSeats), aircraft_type: aircraftType };
    try {
      if (initial && initial.flight_id) await mutateUpdate.mutateAsync(payload);
      else await mutateCreate.mutateAsync(payload);
    } catch (err) {
      alert("Failed to save flight");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <label className="label">Flight No</label>
        <input required className="input" placeholder="e.g. NK 101" value={flightNo} onChange={(e) => setFlightNo(e.target.value)} />

        <label className="label">Flight name</label>
        <input className="input" placeholder="e.g. NK Airways 101" value={flightName} onChange={(e) => setFlightName(e.target.value)} />

        <label className="label">Total seats</label>
        <input className="input" type="number" min={1} placeholder="150" value={totalSeats} onChange={(e) => setTotalSeats(Number(e.target.value))} />

        <label className="label">Aircraft type</label>
        <input className="input" placeholder="e.g. A123" value={aircraftType} onChange={(e) => setAircraftType(e.target.value)} />

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Saving..." : "Save flight"}</button>
          <button type="button" className="pill-btn" onClick={() => onCancel && onCancel()}>Cancel</button>
        </div>
      </div>
    </form>
  );
}
