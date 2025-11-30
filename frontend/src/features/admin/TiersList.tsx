import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import TierForm from "./TierForm";
import Modal from "../../components/Modal";

export default function TiersList() {
  const qc = useQueryClient();

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["admin:tiers"],
    queryFn: async () => {
      const r = await api.get("/admin/tiers");
      return Array.isArray(r.data) ? r.data : r.data?.tiers ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/tiers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin:tiers"] }),
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // filter / sort 
  const [qText, setQText] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [sortBy, setSortBy] = useState<"seat_class" | "seat_type">("seat_class");

  const classes = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach((t: any) => { if (t.seat_class) s.add(t.seat_class); });
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const out = (data as any[]).filter((t) => {
      if (qText) {
        const s = `${t.seat_class ?? ""} ${t.seat_type ?? ""}`.toLowerCase();
        if (!s.includes(qText.toLowerCase())) return false;
      }
      if (filterClass && (t.seat_class ?? "") !== filterClass) return false;
      return true;
    });

    const cmp = (a: any, b: any) => {
      if (sortBy === "seat_type") return String(a.seat_type ?? "").localeCompare(String(b.seat_type ?? ""));
      return String(a.seat_class ?? "").localeCompare(String(b.seat_class ?? ""));
    };

    out.sort(cmp);
    return out;
  }, [data, qText, filterClass, sortBy]);

  if (isLoading) return <div>Loading tiers.</div>;
  if (isError) return <div>Failed to load tiers.</div>;

  const handleDelete = (id: number, label = "this tier") => {
    const ok = window.confirm(`Are you sure you want to delete ${label}? This action cannot be undone.`);
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Seat Tiers</h3>
        <div><button className="btn-primary" onClick={() => { setEditing(null); setShowCreate(true); }}>Create tier</button></div>
      </div>

      {/* filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <input className="input" placeholder="Search class or type" value={qText} onChange={(e) => setQText(e.target.value)} />
        <select className="input" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="">All classes</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="seat_class">Sort by class</option>
          <option value="seat_type">Sort by type</option>
        </select>
        <button className="pill-btn" onClick={() => { setQText(""); setFilterClass(""); setSortBy("seat_class"); }}>Clear</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 && <div>No tiers found.</div>}
        {filtered.map((t: any) => (
          <div key={t.tier_id} style={{ background: "#fff", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800 }}>{t.seat_class}</div>
              <div style={{ color: "#64748b" }}>{t.seat_type ?? ""}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pill-btn" onClick={() => { setEditing(t); setShowCreate(true); }}>Edit</button>
              <button className="pill-btn" onClick={() => handleDelete(t.tier_id, t.seat_class ?? "tier")}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h3 style={{ margin: 0 }}>{editing ? "Edit tier" : "Create tier"}</h3>
          <TierForm
            initial={editing}
            onDone={() => { setShowCreate(false); setEditing(null); qc.invalidateQueries({ queryKey: ["admin:tiers"] }); }}
            onCancel={() => { setShowCreate(false); setEditing(null); }}
          />
        </div>
      </Modal>
    </div>
  );
}
