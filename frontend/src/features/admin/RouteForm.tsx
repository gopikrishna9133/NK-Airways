import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useMutation } from "@tanstack/react-query";

type Props = {
  initial?: any | null;
  onDone?: () => void;
  onCancel?: () => void;
};

export default function RouteForm({ initial = null, onDone, onCancel }: Props) {
  const [origin, setOrigin] = useState(initial?.origin_location ?? "");
  const [destination, setDestination] = useState(initial?.destination_location ?? "");
  const [distance, setDistance] = useState(initial?.distance ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOrigin(initial?.origin_location ?? "");
    setDestination(initial?.destination_location ?? "");
    setDistance(initial?.distance ?? "");
  }, [initial]);

  const createMut = useMutation({
    mutationFn: async (payload: any) => api.post("/admin/routes", payload),
    onSuccess: () => onDone && onDone(),
  });

  const updateMut = useMutation({
    mutationFn: async (payload: any) => {
      if (!initial || !initial.route_id) throw new Error("Missing route id");
      return api.put(`/admin/routes/${initial.route_id}`, payload);
    },
    onSuccess: () => onDone && onDone(),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { origin_location: origin, destination_location: destination };
      if (distance !== null && distance !== "") {
        const n = Number(distance);
        if (!Number.isNaN(n)) payload.distance = n;
      }
      if (initial && initial.route_id) {
        await updateMut.mutateAsync(payload);
      } else {
        await createMut.mutateAsync(payload);
      }
    } catch (err) {
      console.error("Failed to save route", err);
      alert("Failed to save route. See console for details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
      <label className="label">Origin (IATA / City)</label>
      <input className="input" value={origin} onChange={(e) => setOrigin(e.target.value)} required placeholder="e.g. JFK or New York" />

      <label className="label" style={{ marginTop: 8 }}>Destination (IATA / City)</label>
      <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} required placeholder="e.g. LAX or Los Angeles" />

      <label className="label" style={{ marginTop: 8 }}>Distance (mi) — optional</label>
      <input className="input" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="e.g. 1375.4" inputMode="decimal" />

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save route"}</button>
        <button type="button" className="pill-btn" onClick={() => onCancel && onCancel()}>Cancel</button>
      </div>
    </form>
  );
}
