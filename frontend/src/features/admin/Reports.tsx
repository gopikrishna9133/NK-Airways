import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";

function parseToLocalDate(value: any): Date | null {
  if (value == null) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "number" && !Number.isNaN(value)) return new Date(value);
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;
    const iso = Date.parse(s);
    if (!Number.isNaN(iso)) return new Date(iso);
    const mysql = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (mysql) {
      const [, Y, M, D, hh, mm, ss] = mysql;
      const d = new Date(Number(Y), Number(M) - 1, Number(D), Number(hh || 0), Number(mm || 0), Number(ss || 0));
      if (!isNaN(d.getTime())) return d;
    }
    const asNum = Number(s);
    if (!Number.isNaN(asNum)) {
      const d = new Date(asNum);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function formatLocalNice(value: any): string {
  const d = parseToLocalDate(value);
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function parseCsvToRows(csvText: string): Record<string, any>[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== "");
  if (!lines.length) return [];
  const headerLine = lines.shift()!;
  const headerRegex = /("([^"]|"")*"|[^,]+)/g;
  const headers: string[] = (headerLine.match(headerRegex) || []).map(h => {
    let v = h;
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
    return v;
  });
  const rows = lines.map(line => {
    const matches = line.match(headerRegex) || [];
    const cells = matches.map((c: string) => {
      let v = c;
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
      return v;
    });
    const obj: any = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i] ?? `col${i}`] = cells[i] ?? "";
    return obj;
  });
  return rows;
}

export default function Reports() {
  const [revenueRows, setRevenueRows] = useState<any[] | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewScheduleId, setViewScheduleId] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRows, setViewRows] = useState<any[] | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);

  const [scheduleFilter, setScheduleFilter] = useState<number | "">("");
  const [qFilter, setQFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"revenue_desc" | "revenue_asc" | "schedule_asc" | "schedule_desc">("revenue_desc");

  const schedulesQ = useQuery({
    queryKey: ["admin:schedules:list"],
    queryFn: async () => {
      const res = await api.get("/admin/schedules");
      return Array.isArray(res.data) ? res.data : res.data?.schedules ?? [];
    },
    staleTime: 1000 * 60 * 5
  });
  const schedules = schedulesQ.data ?? [];

  async function loadRevenue() {
    setLoadingRevenue(true);
    setRevenueRows(null);
    setError(null);
    try {
      const params: any = {};
      if (scheduleFilter) params.schedule_id = scheduleFilter;
      if (qFilter) params.q = qFilter;
      if (sortBy) params.sort = sortBy;
      const res = await api.get("/admin/reports/revenue-by-schedule", { params });
      const rows = Array.isArray(res.data) ? res.data : res.data?.revenue ?? [];
      setRevenueRows(rows);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load revenue");
    } finally {
      setLoadingRevenue(false);
    }
  }

  function resetFilters() {
    setScheduleFilter("");
    setQFilter("");
    setSortBy("revenue_desc");
    setRevenueRows(null);
    setError(null);
  }

  function exportRevenuePdf() {
    if (!revenueRows || revenueRows.length === 0) {
      alert("No revenue data to export. Load revenue first.");
      return;
    }
    const headers = Object.keys(revenueRows[0] ?? {});
    const rowsHtml = revenueRows
      .map(r => `<tr>${headers.map(h => `<td style="padding:6px;border:1px solid #ddd">${String(r[h] ?? "")}</td>`).join("")}</tr>`)
      .join("");
    const metaParts = [];
    if (scheduleFilter) {
      const s = schedules.find(sch => Number(sch.schedule_id ?? sch.id) === Number(scheduleFilter));
      if (s) metaParts.push(`Schedule: ${s.schedule_id ?? s.id}`);
    }
    if (qFilter) metaParts.push(`Filter: ${qFilter}`);
    metaParts.push(`Sort: ${sortBy}`);
    const html = `
      <html>
        <head>
          <title>Revenue Report</title>
          <style>
            body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial; margin: 20px; color: #0b1220; }
            h1 { font-size: 18px; margin-bottom: 8px; }
            .meta { color: #475569; font-size: 13px; margin-bottom: 12px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
            th { background: #f1f5f9; padding: 8px; border: 1px solid #ddd; text-align: left; }
            td { padding: 6px; border: 1px solid #ddd; vertical-align: top; }
          </style>
        </head>
        <body>
          <h1>Revenue Report</h1>
          <div class="meta">${metaParts.join(" • ")} • Generated: ${new Date().toLocaleString()}</div>
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(()=>window.close(), 700);
              }, 300);
            }
          </script>
        </body>
      </html>
    `;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return alert("Popup blocked. Allow popups for this site to export PDF.");
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  async function openView(scheduleId: number) {
    setViewScheduleId(scheduleId);
    setViewOpen(true);
    setViewLoading(true);
    setViewRows(null);
    setViewError(null);
    try {
      const res = await api.get(`/admin/reports/manifest/${scheduleId}`, { responseType: "blob" });
      const contentType = (res.headers?.["content-type"] ?? "").toLowerCase();
      const blob = new Blob([res.data], { type: contentType || "application/json" });
      if (contentType.includes("application/json")) {
        const text = await blob.text();
        const parsed = JSON.parse(text);
        setViewRows(Array.isArray(parsed) ? parsed : []);
      } else {
        const text = await blob.text();
        const rows = parseCsvToRows(text);
        setViewRows(rows);
      }
    } catch (err: any) {
      setViewError(err?.response?.data?.message ?? err?.message ?? "Failed to load booking details");
    } finally {
      setViewLoading(false);
    }
  }

  function closeView() {
    setViewOpen(false);
    setViewScheduleId(null);
    setViewRows(null);
    setViewError(null);
  }

  const totalRevenue = useMemo(() => {
    if (!revenueRows || revenueRows.length === 0) return 0;
    return revenueRows.reduce((acc: number, r: any) => {
      const v = Number(r.revenue ?? r.total_amount ?? r.amount ?? 0);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [revenueRows]);

  function renderCell(key: string, value: any) {
    const lower = key.toLowerCase();
    if (lower.includes("date") || lower.includes("time") || lower.includes("departure") || lower.includes("arrival")) {
      return formatLocalNice(value);
    }
    return String(value ?? "");
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Revenue Reports</h3>
      </div>

      <section style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={loadRevenue} disabled={loadingRevenue}>
              {loadingRevenue ? "Loading…" : "Load revenue"}
            </button>

            <button className="pill-btn" onClick={resetFilters} disabled={loadingRevenue}>
              Reset
            </button>

            <button className="pill-btn" onClick={exportRevenuePdf} disabled={!revenueRows || revenueRows.length === 0}>
              Export PDF
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {error && <div style={{ color: "crimson" }}>{error}</div>}

          {!revenueRows && !loadingRevenue && <div style={{ color: "#64748b" }}>Choose filters and click “Load revenue”.</div>}

          {revenueRows && revenueRows.length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div><strong>Rows: {revenueRows.length}</strong></div>
                <div style={{ color: "#0b1220" }}><strong>Total:</strong> ${totalRevenue.toFixed(2)}</div>
              </div>

              <div style={{ overflow: "auto", background: "#fff", borderRadius: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead style={{ background: "#f1f5f9" }}>
                    <tr>
                      {Object.keys(revenueRows[0]).map((k) => (
                        <th key={k} style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {revenueRows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                        {Object.keys(revenueRows[0]).map((k) => (
                          <td key={k} style={{ padding: 8 }}>{renderCell(k, r[k])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {loadingRevenue && <div style={{ marginTop: 8 }}>Loading revenue…</div>}
        </div>
      </section>

      <section style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
        <h4 style={{ marginTop: 0 }}>Context</h4>
        <div style={{ color: "#64748b" }}>
          {schedules.length ? (
            <div>{schedules.length} schedules in system — use filters to narrow revenue results.</div>
          ) : (
            <div>No schedules loaded (network may be slow).</div>
          )}
        </div>
      </section>

      {viewOpen && (
        <div
          aria-modal="true"
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            zIndex: 2000
          }}
          onClick={closeView}
        >
          <div
            role="document"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(980px, 95%)",
              maxHeight: "85vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 10,
              padding: 14,
              position: "relative"
            }}
          >
            <button
              aria-label="Close"
              onClick={closeView}
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                border: "none",
                background: "transparent",
                fontSize: 20,
                cursor: "pointer"
              }}
            >
              ✕
            </button>

            <h3 style={{ marginTop: 0 }}>Booking details — Schedule {viewScheduleId}</h3>

            {viewLoading && <div>Loading bookings…</div>}
            {viewError && <div style={{ color: "crimson" }}>{viewError}</div>}

            {!viewLoading && !viewError && viewRows && viewRows.length === 0 && (
              <div style={{ color: "#64748b" }}>No bookings found for this schedule.</div>
            )}

            {!viewLoading && viewRows && viewRows.length > 0 && (
              <div>
                <div style={{ marginBottom: 8, color: "#111827" }}><strong>{viewRows.length}</strong> bookings</div>

                <div style={{ overflow: "auto", background: "#fff", borderRadius: 6 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                    <thead style={{ background: "#f1f5f9" }}>
                      <tr>
                        {Object.keys(viewRows[0]).map((k) => (
                          <th key={k} style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viewRows.map((row: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                          {Object.keys(viewRows[0]).map((k) => (
                            <td key={k} style={{ padding: 8 }}>
                              {String(k).toLowerCase().includes("date") || String(k).toLowerCase().includes("time")
                                ? formatLocalNice(row[k])
                                : String(row[k] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
