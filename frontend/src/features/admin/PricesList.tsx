import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import PriceForm from "./PriceForm";
import Modal from "../../components/Modal";

export default function PricesList() {
  const qc = useQueryClient();

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["admin:prices"],
    queryFn: async () => {
      const r = await api.get("/admin/prices");
      return Array.isArray(r.data) ? r.data : r.data?.prices ?? [];
    },
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["admin:tiers"],
    queryFn: async () => {
      const r = await api.get("/admin/tiers");
      return Array.isArray(r.data) ? r.data : r.data?.tiers ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/prices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin:prices"] }),
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [qText, setQText] = useState("");
  const [filterTier, setFilterTier] = useState<string | "">("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price" | "tier">("price");

  const tierMap = useMemo(() => {
    const m: Record<string, any> = {};
    (tiers || []).forEach((t: any) => { m[String(t.tier_id)] = t; });
    return m;
  }, [tiers]);

  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const out = (data as any[]).filter((p) => {
      if (qText) {
        const s = `${tierMap[String(p.tier_id)]?.seat_class ?? ""} ${p.price ?? ""}`.toLowerCase();
        if (!s.includes(qText.toLowerCase())) return false;
      }
      if (filterTier && String(p.tier_id) !== String(filterTier)) return false;
      const pr = Number(p.price);
      if (minPrice && (!Number.isFinite(pr) || pr < Number(minPrice))) return false;
      if (maxPrice && (!Number.isFinite(pr) || pr > Number(maxPrice))) return false;
      return true;
    });

    const cmp = (a: any, b: any) => {
      if (sortBy === "tier") {
        const A = String(tierMap[String(a.tier_id)]?.seat_class ?? "");
        const B = String(tierMap[String(b.tier_id)]?.seat_class ?? "");
        return A.localeCompare(B);
      }
      return Number(a.price) - Number(b.price);
    };

    out.sort(cmp);
    return out;
  }, [data, qText, filterTier, minPrice, maxPrice, sortBy, tierMap]);

  if (isLoading) return <div>Loading prices.</div>;
  if (isError) return <div>Failed to load prices.</div>;

  const handleDelete = (id: number, label = "this price") => {
    const ok = window.confirm(`Are you sure you want to delete ${label}? This action cannot be undone.`);
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Prices</h3>
        <div><button className="btn-primary" onClick={() => { setEditing(null); setShowCreate(true); }}>Create price</button></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px 220px", gap: 8, marginBottom: 10 }}>
        <input className="input" placeholder="Search price or tier" value={qText} onChange={(e) => setQText(e.target.value)} />

        <select className="input" value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
          <option value="">All tiers</option>
          {tiers.map((t: any) => <option key={t.tier_id} value={t.tier_id}>{t.seat_class}</option>)}
        </select>

        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" placeholder="Min price" inputMode="numeric" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <input className="input" placeholder="Max price" inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ color: "#64748b" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="price">Sort by price</option>
              <option value="tier">Sort by tier</option>
            </select>
            <button className="pill-btn" onClick={() => { setQText(""); setFilterTier(""); setMinPrice(""); setMaxPrice(""); setSortBy("price"); }}>Clear</button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 && <div>No prices found.</div>}
        {filtered.map((p: any) => (
          <div key={p.price_id} style={{ background: "#fff", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800 }}>{tierMap[String(p.tier_id)]?.seat_class ?? ("Tier " + p.tier_id)}</div>
              <div style={{ color: "#64748b" }}>${Number(p.price).toFixed(2)}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pill-btn" onClick={() => { setEditing(p); setShowCreate(true); }}>Edit</button>
              <button className="pill-btn" onClick={() => handleDelete(p.price_id, tierMap[String(p.tier_id)]?.seat_class ?? `price ${p.price_id}`)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} width={540}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h3 style={{ margin: 0 }}>{editing ? "Edit price" : "Create price"}</h3>
          <PriceForm
            initial={editing}
            onDone={() => { setShowCreate(false); setEditing(null); qc.invalidateQueries({ queryKey: ["admin:prices"] }); }}
            onCancel={() => { setShowCreate(false); setEditing(null); }}
          />
        </div>
      </Modal>
    </div>
  );
}
