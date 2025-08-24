import { Routes, Route, Link } from "react-router";

export default function App() {
  return (
    <div className="p-6">
      <nav className="flex gap-4 mb-6">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route
          path="/"
          element={<h1 className="text-2xl font-bold">Home Page</h1>}
        />
        <Route
          path="/about"
          element={<h1 className="text-2xl">About Page</h1>}
        />
      </Routes>
    </div>
  );
}
