import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import RouteForm from "./RouteForm";
import Modal from "../../components/Modal";

export default function RoutesList() {
  const qc = useQueryClient();

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["admin:routes"],
    queryFn: async () => {
      const r = await api.get("/admin/routes");
      return Array.isArray(r.data) ? r.data : r.data?.routes ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/routes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin:routes"] }),
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // --- filter/sort state (note: min/max distance and asc/desc removed)
  const [qText, setQText] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterDestination, setFilterDestination] = useState("");
  const [sortBy, setSortBy] = useState<"distance" | "origin" | "destination">("distance");

  const origins = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach((it: any) => it.origin_location && s.add(it.origin_location));
    return Array.from(s).sort();
  }, [data]);
  const destinations = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach((it: any) => it.destination_location && s.add(it.destination_location));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const res = (data as any[]).filter((r) => {
      if (qText) {
        const s = `${r.origin_location ?? ""} ${r.destination_location ?? ""} ${r.route_id ?? r.id ?? ""}`.toLowerCase();
        if (!s.includes(qText.toLowerCase())) return false;
      }
      if (filterOrigin && r.origin_location !== filterOrigin) return false;
      if (filterDestination && r.destination_location !== filterDestination) return false;
      return true;
    });

    const cmp = (a: any, b: any) => {
      if (sortBy === "distance") {
        const A = Number.isFinite(Number(a.distance)) ? Number(a.distance) : Number.POSITIVE_INFINITY;
        const B = Number.isFinite(Number(b.distance)) ? Number(b.distance) : Number.POSITIVE_INFINITY;
        return A - B; // fixed ascending order
      }
      if (sortBy === "origin") {
        return String(a.origin_location ?? "").localeCompare(String(b.origin_location ?? ""));
      }
      return String(a.destination_location ?? "").localeCompare(String(b.destination_location ?? ""));
    };

    res.sort(cmp); // always ascending
    return res;
  }, [data, qText, filterOrigin, filterDestination, sortBy]);

  if (isLoading) return <div>Loading routes.</div>;
  if (isError) return <div>Failed to load routes.</div>;

  const handleDelete = (id: number, label = "this route") => {
    const ok = window.confirm(`Are you sure you want to delete ${label}? This action cannot be undone.`);
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Routes</h3>
        <div>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowCreate(true); }}>Create route</button>
        </div>
      </div>

      {/* Filter / Sort UI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 200px", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <input placeholder="Search origin / destination" className="input" value={qText} onChange={(e) => setQText(e.target.value)} />

        <div style={{ display: "flex", gap: 8 }}>
          <select className="input" value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)}>
            <option value="">All origins</option>
            {origins.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="input" value={filterDestination} onChange={(e) => setFilterDestination(e.target.value)}>
            <option value="">All destinations</option>
            {destinations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="distance">Sort by distance</option>
            <option value="origin">Sort by origin</option>
            <option value="destination">Sort by destination</option>
          </select>
          <button className="pill-btn" onClick={() => { setQText(""); setFilterOrigin(""); setFilterDestination(""); setSortBy("distance"); }}>Clear</button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 && <div>No routes found.</div>}
        {filtered.map((r: any) => {
          const distanceStr = (r.distance !== null && r.distance !== undefined && r.distance !== "") ? `${Number(r.distance).toLocaleString(undefined, { maximumFractionDigits: 1 })} mi` : null;
          return (
            <div key={r.route_id ?? r.id} style={{
              background: "#fff",
              padding: 12,
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ minWidth: 220 }}>
                  <div style={{ fontWeight: 800 }}>{r.origin_location}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 110 }}>
                  {distanceStr ? (
                    <div style={{
                      background: "#f1f5f9",
                      color: "#0f172a",
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 13,
                      marginBottom: 6,
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.03) inset"
                    }}>{distanceStr}</div>
                  ) : null}
                  <div style={{ fontSize: 18, color: "#64748b" }}>→</div>
                </div>

                <div style={{ minWidth: 220 }}>
                  <div style={{ fontWeight: 800 }}>{r.destination_location}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="pill-btn" onClick={() => { setEditing(r); setShowCreate(true); }}>Edit</button>
                <button className="pill-btn" onClick={() => handleDelete(r.route_id ?? r.id, `${r.origin_location} → ${r.destination_location}`)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} width={640}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h3 style={{ margin: 0 }}>{editing ? "Edit route" : "Create route"}</h3>
          <RouteForm
            initial={editing}
            onDone={() => { setShowCreate(false); setEditing(null); qc.invalidateQueries({ queryKey: ["admin:routes"] }); }}
            onCancel={() => { setShowCreate(false); setEditing(null); }}
          />
        </div>
      </Modal>
    </div>
  );
}
