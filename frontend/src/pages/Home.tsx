import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="py-8">
      <div className="bg-white rounded shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-1">Find your next flight</h2>
            <p className="text-slate-600">Quick search, clear fares, and comfy seats — welcome aboard.</p>
          </div>
          <div>
            <Link to="/search" className="inline-flex items-center px-4 py-2 bg-sky-600 text-white rounded shadow">
              Search flights
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Quick book</h3>
            <p className="text-sm text-slate-600">Search, pick a seat, and confirm in a few clicks.</p>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Manage bookings</h3>
            <p className="text-sm text-slate-600">View or download boarding passes for your trips.</p>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Admin tools</h3>
            <p className="text-sm text-slate-600">Create flights, generate seats, and export manifests (admins only).</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-6">
          <h4 className="font-semibold mb-2">Latest deals</h4>
          <p className="text-sm text-slate-600">No deals yet — this is a demo. Create a schedule and generate seats to try bookings.</p>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h4 className="font-semibold mb-2">Demo quicklinks</h4>
          <ul className="text-sm text-slate-700 space-y-1">
            <li><Link to="/search" className="text-sky-600">Search flights</Link></li>
            <li><Link to="/admin" className="text-sky-600">Admin dashboard</Link></li>
            <li><Link to="/bookings" className="text-sky-600">My bookings</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
