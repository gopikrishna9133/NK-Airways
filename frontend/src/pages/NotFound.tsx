import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-16 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-xl mb-4">Sorry, that page doesn't exist.</p>
        <Link to="/" className="px-4 py-2 bg-sky-600 text-white rounded">Go home</Link>
      </div>
    </div>
  );
}
