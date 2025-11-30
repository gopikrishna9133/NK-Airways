import React from "react";
import { useNavigate } from "react-router-dom";

export default function Search() {
  const navigate = useNavigate();
  const [origin, setOrigin] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [date, setDate] = React.useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (origin) q.set("origin", origin);
    if (destination) q.set("destination", destination);
    if (date) q.set("date", date);
    navigate(`/search/results?${q.toString()}`);
  }

  return (
    <div>
      <form onSubmit={onSearch}>
        <div style={{ maxWidth: 860 }}>
          <label className="label">Origin (IATA or City)</label>
          <input className="input" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="MIA or Miami" />

          <label className="label">Destination (IATA or City)</label>
          <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="DFW or Dallas" />

          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn-primary">Search</button>
          </div>
        </div>
      </form>
    </div>
  );
}
