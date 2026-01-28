import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";

function parseFlexibleDate(val: any): Date | null {
  if (val == null) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function computeDurationString(depVal: any, arrVal: any) {
  const d1 = parseFlexibleDate(depVal);
  const d2 = parseFlexibleDate(arrVal);
  if (!d1 || !d2) return null;
  const diff = d2.getTime() - d1.getTime();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  return `${h}h ${m}m`;
}

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const qs = new URLSearchParams(location.search);
  const origin = qs.get("origin");
  const destination = qs.get("destination");
  const date = qs.get("date");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["schedules", origin, destination, date],
    enabled: !!origin && !!destination && !!date,
    queryFn: async () => {
      const res = await api.get("/schedules", {
        params: { origin, destination, date },
      });
      return Array.isArray(res.data)
        ? res.data
        : res.data?.schedules ?? [];
    },
  });

  if (isLoading) return <div>Searching flights...</div>;
  if (isError || !data || data.length === 0) {
    return <div>No flights found.</div>;
  }

  return (
    <div>
      <h1>Search Results</h1>

      <div style={{ display: "grid", gap: 12 }}>
        {data.map((s: any) => {
          const dep = s.departure_datetime;
          const arr = s.arrival_datetime;
          const duration = computeDurationString(dep, arr);
          const price = s.min_price ? `$${Number(s.min_price).toFixed(2)}` : "—";

          return (
            <div
              key={s.schedule_id}
              style={{
                background: "#fff",
                padding: 12,
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>{s.flight_no}</strong>
                <div>
                  {s.origin_location} → {s.destination_location}
                </div>
                {duration && <div>Duration: {duration}</div>}
              </div>

              <div style={{ textAlign: "right" }}>
                <div>{price}</div>
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/schedule/${s.schedule_id}`)}
                >
                  Select Flight
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
