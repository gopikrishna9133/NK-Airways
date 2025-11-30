import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import FlightForm from "./FlightForm";
import Modal from "../../components/Modal";

export default function FlightsList() {
  const qc = useQueryClient();

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["admin:flights"],
    queryFn: async () => {
      const r = await api.get("/admin/flights");
      return Array.isArray(r.data) ? r.data : r.data?.flights ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/flights/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin:flights"] }),
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // --- filter / sort 
  const [qText, setQText] = useState("");
  const [aircraftFilter, setAircraftFilter] = useState("");
  const [sortBy, setSortBy] = useState<"flight_no" | "seats">("flight_no");

  const aircraftTypes = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach((f: any) => { if (f.aircraft_type) s.add(f.aircraft_type); });
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const out = (data as any[]).filter((f) => {
      if (qText) {
        const txt = `${f.flight_no ?? ""} ${f.flight_name ?? ""}`.toLowerCase();
        if (!txt.includes(qText.toLowerCase())) return false;
      }
      if (aircraftFilter && (f.aircraft_type ?? "") !== aircraftFilter) return false;
      return true;
    });

    const cmp = (a: any, b: any) => {
      if (sortBy === "seats") {
        const A = Number(a.total_seats ?? a.seat_count ?? 0);
        const B = Number(b.total_seats ?? b.seat_count ?? 0);
        return A - B;
      }
      return String(a.flight_no ?? "").localeCompare(String(b.flight_no ?? ""), undefined, { numeric: true });
    };

    out.sort(cmp);
    return out;
  }, [data, qText, aircraftFilter, sortBy]);

  if (isLoading) return <div>Loading flights.</div>;
  if (isError) return <div>Failed to load flights.</div>;

  const handleDelete = (id: number, label = "this flight") => {
    const ok = window.confirm(`Are you sure you want to delete ${label}? This action cannot be undone.`);
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Flights</h3>
        <div>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowCreate(true); }}>Create flight</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <input className="input" placeholder="Search flight no or name" value={qText} onChange={(e) => setQText(e.target.value)} />

        <div style={{ display: "flex", gap: 8 }}>
          <select className="input" value={aircraftFilter} onChange={(e) => setAircraftFilter(e.target.value)}>
            <option value="">All aircraft</option>
            {aircraftTypes.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="flight_no">Sort by flight no</option>
              <option value="seats">Sort by seats</option>
            </select>
            <button className="pill-btn" onClick={() => { setQText(""); setAircraftFilter(""); setSortBy("flight_no"); }}>Clear</button>
          </div>
        </div>
      </div>

      <div style={{ color: "#64748b", marginBottom: 8 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 && <div>No flights found.</div>}
        {filtered.map((f: any) => (
          <div key={f.flight_id} style={{ background: "#fff", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800 }}>{f.flight_no} {f.flight_name ? `— ${f.flight_name}` : null}</div>
              <div style={{ color: "#64748b" }}>Seats: {f.total_seats ?? f.seat_count ?? "-"} • Aircraft: {f.aircraft_type ?? "-"}</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="pill-btn" onClick={() => { setEditing(f); setShowCreate(true); }}>Edit</button>
              <button className="pill-btn" onClick={() => handleDelete(f.flight_id, `${f.flight_no ?? "flight"}`)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} width={700}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h3 style={{ margin: 0 }}>{editing ? "Edit flight" : "Create flight"}</h3>
          <FlightForm
            initial={editing}
            onDone={() => { setShowCreate(false); setEditing(null); qc.invalidateQueries({ queryKey: ["admin:flights"] }); }}
            onCancel={() => { setShowCreate(false); setEditing(null); }}
          />
        </div>
      </Modal>
    </div>
  );
}
