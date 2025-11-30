import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import ScheduleForm from "./ScheduleForm";
import Modal from "../../components/Modal";

function dbStringToLocalDate(val: any): Date | null {
  if (!val && val !== 0) return null;
  const s = String(val).trim();

  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m1) return new Date(Number(m1[1]), Number(m1[2]) - 1, Number(m1[3]), Number(m1[4]), Number(m1[5]), Number(m1[6] ?? "0"));

  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m2) return new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]), Number(m2[4]), Number(m2[5]), Number(m2[6] ?? "0"));

  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function durationMinutes(dep?: Date | null, arr?: Date | null) {
  if (!dep || !arr) return null;
  const diff = arr.getTime() - dep.getTime();
  if (isNaN(diff)) return null;
  return Math.round(diff / 60000);
}

export default function SchedulesList() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["admin:schedules"],
    queryFn: async () => {
      const r = await api.get("/admin/schedules");
      return Array.isArray(r.data) ? r.data : r.data?.schedules ?? [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/schedules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin:schedules"] })
  });

  async function generateSeatsForSchedule(id: number) {
    if (!id) return window.alert("Missing schedule id");
    setBusyId(id);
    try {
      const res = await api.post(`/schedule-seats/generate/${id}`);
      qc.invalidateQueries({ queryKey: ["admin:schedules"] });
      window.alert(res?.data?.message || "Seats generation completed.");
    } catch (err: any) {
      console.error(err);
      window.alert("Failed to generate seats: " + (err?.response?.data?.message || err?.message || String(err)));
    } finally {
      setBusyId(null);
    }
  }

  // Filter & Sort state 
  const [qText, setQText] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterDestination, setFilterDestination] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"departure" | "duration" | "flight_no">("departure");

  const origins = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach((it: any) => { if (it.origin_location) s.add(it.origin_location); });
    return Array.from(s).sort();
  }, [data]);
  const destinations = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach((it: any) => { if (it.destination_location) s.add(it.destination_location); });
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const tf = (it: any) => {
      const flightNo = (it.flight_no ?? "").toString().toLowerCase();
      const origin = (it.origin_location ?? "").toString().toLowerCase();
      const dest = (it.destination_location ?? "").toString().toLowerCase();
      const fulltext = `${flightNo} ${origin} ${dest}`.trim();
      if (qText && !fulltext.includes(qText.toLowerCase())) return false;
      if (filterOrigin && (it.origin_location ?? "") !== filterOrigin) return false;
      if (filterDestination && (it.destination_location ?? "") !== filterDestination) return false;

      if ((dateFrom || dateTo) && (it.departure_datetime || it.departure)) {
        const dep = dbStringToLocalDate(it.departure_datetime ?? it.departure);
        if (!dep) return false;
        const depDateISO = dep.toISOString().slice(0, 10);
        if (dateFrom && depDateISO < dateFrom) return false;
        if (dateTo && depDateISO > dateTo) return false;
      } else {
        if ((dateFrom || dateTo) && !(it.departure_datetime || it.departure)) return false;
      }

      return true;
    };

    const list = data.filter(tf);

    const cmp = (a: any, b: any) => {
      if (sortBy === "flight_no") {
        const A = (a.flight_no ?? "").toString().localeCompare((b.flight_no ?? "").toString(), undefined, { numeric: true });
        return A;
      }
      if (sortBy === "duration") {
        const da = durationMinutes(dbStringToLocalDate(a.departure_datetime ?? a.departure), dbStringToLocalDate(a.arrival_datetime ?? a.arrival)) ?? 0;
        const dbt = durationMinutes(dbStringToLocalDate(b.departure_datetime ?? b.departure), dbStringToLocalDate(b.arrival_datetime ?? b.arrival)) ?? 0;
        return da - dbt;
      }
      const adep = dbStringToLocalDate(a.departure_datetime ?? a.departure);
      const bdep = dbStringToLocalDate(b.departure_datetime ?? b.departure);
      if (!adep && !bdep) return 0;
      if (!adep) return 1;
      if (!bdep) return -1;
      return adep.getTime() - bdep.getTime();
    };

    list.sort(cmp);
    return list;
  }, [data, qText, filterOrigin, filterDestination, dateFrom, dateTo, sortBy]);

  if (isLoading) return <div>Loading schedules.</div>;
  if (isError) return <div>Failed to load schedules.</div>;

  const handleDelete = (id: number, label?: string) => {
    const itemLabel = label ?? "this schedule";
    const ok = window.confirm(`Are you sure you want to delete ${itemLabel}? This action cannot be undone.`);
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Schedules</h3>
        <div>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowCreate(true); }}>
            Create schedule
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 160px", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <input
          placeholder="Search flight no / origin / destination"
          className="input"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
        />

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
            <option value="departure">Sort by departure</option>
            <option value="duration">Sort by duration</option>
            <option value="flight_no">Sort by flight no</option>
          </select>
          <button className="pill-btn" onClick={() => { setQText(""); setFilterOrigin(""); setFilterDestination(""); setDateFrom(""); setDateTo(""); setSortBy("departure"); }}>Clear</button>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#475569", marginRight: 6 }}>Departure from</label>
          <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <label style={{ fontSize: 13, color: "#475569" }}>to</label>
          <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 && <div>No schedules found.</div>}
        {filtered.map((s: any) => {
          const id = s.schedule_id ?? s.id;
          const depDate = dbStringToLocalDate(s.departure_datetime ?? s.departure);
          const arrDate = dbStringToLocalDate(s.arrival_datetime ?? s.arrival);
          const duration = durationMinutes(depDate, arrDate);
          const durationDisplay = duration !== null ? `${Math.floor(duration / 60)}h ${duration % 60}m` : "—";
          const dist = s.distance ?? (s.route && s.route.distance) ?? null;
          const distanceStr = (dist !== null && dist !== undefined && dist !== "") ? `${Number(dist).toLocaleString(undefined, { maximumFractionDigits: 1 })} mi` : null;

          return (
            <div key={id} style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{s.flight_no}{s.flight_name ? ` - ${s.flight_name}` : ""}</div>

                  <div style={{ color: "#64748b", marginTop: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontWeight: 700 }}>{s.origin_location}</div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 110 }}>
                        {distanceStr ? (
                          <div style={{
                            background: "#f1f5f9",
                            color: "#0f172a",
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontSize: 13,
                            marginBottom: 6
                          }}>
                            {distanceStr}
                          </div>
                        ) : null}
                        <div style={{ fontSize: 18, color: "#64748b" }}>→</div>
                      </div>

                      <div style={{ fontWeight: 700 }}>{s.destination_location}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div><strong>Departure:</strong> {depDate ? depDate.toLocaleString() : "—"}</div>
                    <div><strong>Arrival:</strong> {arrDate ? arrDate.toLocaleString() : "—"}</div>
                    <div><strong>Duration:</strong> {durationDisplay}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <button
                    className="pill-btn"
                    onClick={() => { setEditing(s); setShowCreate(true); }}
                  >
                    Edit
                  </button>

                  <button
                    className="pill-btn"
                    onClick={() => handleDelete(id, `${s.flight_no ?? "schedule"}`)}
                  >
                    Delete
                  </button>

                  <button
                    className="pill-btn"
                    onClick={() => generateSeatsForSchedule(id)}
                    disabled={busyId === id}
                  >
                    {busyId === id ? "Generating..." : "Generate seats"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} width={820}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={{ margin: 0 }}>{editing ? "Edit schedule" : "Create schedule"}</h3>
          <ScheduleForm
            initial={editing}
            onDone={() => { setShowCreate(false); setEditing(null); qc.invalidateQueries({ queryKey: ["admin:schedules"] }); }}
            onCancel={() => { setShowCreate(false); setEditing(null); }}
          />
        </div>
      </Modal>
    </div>
  );
}
