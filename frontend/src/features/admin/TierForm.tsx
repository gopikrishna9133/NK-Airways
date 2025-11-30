import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useMutation } from "@tanstack/react-query";

export default function TierForm({ initial = null, onDone, onCancel }: any) {
  const [seatClass, setSeatClass] = useState(initial?.seat_class ?? "");
  const [seatType, setSeatType] = useState(initial?.seat_type ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSeatClass(initial?.seat_class ?? "");
    setSeatType(initial?.seat_type ?? "");
  }, [initial]);

  const createMut = useMutation({
    mutationFn: async (payload: any) => api.post("/admin/tiers", payload),
    onSuccess: () => onDone && onDone(),
  });

  const updateMut = useMutation({
    mutationFn: async (payload: any) => api.put(`/admin/tiers/${initial.tier_id}`, payload),
    onSuccess: () => onDone && onDone(),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { seat_class: seatClass, seat_type: seatType };
      if (initial && initial.tier_id) await updateMut.mutateAsync(payload);
      else await createMut.mutateAsync(payload);
    } catch (err) {
      console.error(err);
      alert("Failed to save tier");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
      <label className="label">Seat class (e.g. Business, Economy)</label>
      <input className="input" value={seatClass} onChange={(e) => setSeatClass(e.target.value)} required />

      <label className="label">Seat type (optional)</label>
      <input className="input" value={seatType} onChange={(e) => setSeatType(e.target.value)} />

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        <button type="button" className="pill-btn" onClick={() => onCancel && onCancel()}>Cancel</button>
      </div>
    </form>
  );
}
