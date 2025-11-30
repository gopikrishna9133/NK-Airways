import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useMutation } from "@tanstack/react-query";

export default function PriceForm({ initial = null, onDone, onCancel }: any) {
  const [tierId, setTierId] = useState(initial?.tier_id ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [tiers, setTiers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/tiers").then(r => {
      const d = Array.isArray(r.data) ? r.data : r.data?.tiers ?? [];
      setTiers(d);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    setTierId(initial?.tier_id ?? "");
    setPrice(initial?.price ?? "");
  }, [initial]);

  const createMut = useMutation({
    mutationFn: async (payload: any) => api.post("/admin/prices", payload),
    onSuccess: () => onDone && onDone(),
  });

  const updateMut = useMutation({
    mutationFn: async (payload: any) => api.put(`/admin/prices/${initial.price_id}`, payload),
    onSuccess: () => onDone && onDone(),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { tier_id: Number(tierId), price: Number(price) };
      if (initial && initial.price_id) await updateMut.mutateAsync(payload);
      else await createMut.mutateAsync(payload);
    } catch (err) {
      console.error(err);
      alert("Failed to save price");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
      <label className="label">Tier</label>
      <select className="input" value={tierId} onChange={(e)=>setTierId(e.target.value)} required>
        <option value="">Select tier</option>
        {tiers.map(t => <option key={t.tier_id} value={t.tier_id}>{t.seat_class}</option>)}
      </select>

      <label className="label">Price (USD)</label>
      <input className="input" type="number" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)} required />

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        <button type="button" className="pill-btn" onClick={()=>onCancel && onCancel()}>Cancel</button>
      </div>
    </form>
  );
}
