// src/pages/Junctions.jsx
import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8001"
  : "https://flextraff-backend-production-186c.up.railway.app";

export default function Junctions({ darkMode, toggleDarkMode }) {
  const [junctions, setJunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState(null);
  const [serverErr, setServerErr] = useState(null);
  const [form, setForm] = useState({
    junction_name: "",
    city: "",
    latitude: "",
    longitude: "",
    algorithm_config: "",
  });

  // ✅ Fresh token on every call
  const getHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const labelText = darkMode ? "text-yellow-400" : "text-blue-700";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-100";
  const divider = darkMode ? "border-gray-700" : "border-gray-200";
  const inputCls = `w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
    darkMode
      ? "bg-gray-800 text-white placeholder-gray-400 border-gray-600 focus:ring-yellow-400"
      : "bg-white text-gray-900 placeholder-gray-400 border-gray-300 focus:ring-blue-500"
  }`;

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchJunctions = async () => {
    setLoading(true);
    setServerErr(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/junctions?limit=100`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch junctions");
      setJunctions(data.junctions || []);
    } catch (err) {
      setServerErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJunctions();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      junction_name: "",
      city: "",
      latitude: "",
      longitude: "",
      algorithm_config: "",
    });
    setSuccess(null);
    setServerErr(null);
  };

  const openEdit = (j) => {
    setEditing(j.id);
    setForm({
      junction_name: j.junction_name || "",
      city: j.location || "",
      latitude: j.latitude ?? "",
      longitude: j.longitude ?? "",
      algorithm_config: j.algorithm_config || "",
    });
    setSuccess(null);
    setServerErr(null);
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setServerErr(null);

    const payload = {
      junction_name: form.junction_name,
      city: form.city,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      algorithm_config: form.algorithm_config || null,
    };

    try {
      if (editing) {
        const res = await fetch(
          `${API_URL}/api/v1/admin/junctions/${editing}`,
          {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.detail || "Failed to update junction");
        setSuccess("Junction updated successfully");
      } else {
        const res = await fetch(`${API_URL}/api/v1/admin/junctions`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.detail || "Failed to create junction");
        setSuccess("Junction created successfully");
      }
      await fetchJunctions();
      resetForm();
    } catch (err) {
      setServerErr(err.message);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("Delete this junction? This is permanent.")) return;
    setSuccess(null);
    setServerErr(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/junctions/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to delete junction");
      setSuccess("Junction deleted successfully");
      await fetchJunctions();
    } catch (err) {
      setServerErr(err.message);
    }
  };

  return (
    <div
      className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}
    >
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-3xl font-semibold ${labelText}`}>
              Junction Management
            </h2>
            <p className={`text-sm mt-1 ${subText}`}>
              Create, edit and delete traffic junctions
            </p>
          </div>
          <button
            onClick={resetForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            + New Junction
          </button>
        </div>

        {/* ── Banners ── */}
        {success && (
          <div className="max-w-2xl mb-5 flex items-center gap-3 bg-green-900 border border-green-600 text-green-300 text-sm px-5 py-3 rounded-xl">
            <span className="font-bold">✓</span>
            <span>{success}</span>
          </div>
        )}
        {serverErr && (
          <div className="max-w-2xl mb-5 flex items-center gap-3 bg-red-900 border border-red-600 text-red-300 text-sm px-5 py-3 rounded-xl">
            <span className="font-bold">✕</span>
            <span>{serverErr}</span>
          </div>
        )}

        {/* ── Form ── */}
        <form
          onSubmit={handleSave}
          className={`max-w-2xl mb-8 p-6 rounded-2xl shadow border ${divider} ${cardBg}`}
        >
          <h3
            className={`text-sm font-semibold uppercase tracking-wide mb-4 ${subText}`}
          >
            {editing ? `Editing Junction #${editing}` : "New Junction"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Junction name *"
              required
              value={form.junction_name}
              onChange={(e) =>
                setForm((s) => ({ ...s, junction_name: e.target.value }))
              }
              className={inputCls}
            />
            <input
              placeholder="City / Area *"
              required
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              className={inputCls}
            />
            <input
              placeholder="Latitude *"
              required
              value={form.latitude}
              onChange={(e) =>
                setForm((s) => ({ ...s, latitude: e.target.value }))
              }
              className={inputCls}
            />
            <input
              placeholder="Longitude *"
              required
              value={form.longitude}
              onChange={(e) =>
                setForm((s) => ({ ...s, longitude: e.target.value }))
              }
              className={inputCls}
            />
            <textarea
              placeholder="Algorithm config (optional)"
              rows={2}
              value={form.algorithm_config}
              onChange={(e) =>
                setForm((s) => ({ ...s, algorithm_config: e.target.value }))
              }
              className={`${inputCls} md:col-span-2`}
            />
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-5 rounded-lg transition"
            >
              {editing ? "Update Junction" : "Create Junction"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className={`py-2 px-4 border rounded-lg text-sm transition ${
                  darkMode
                    ? "border-gray-600 text-gray-400 hover:bg-gray-800"
                    : "border-gray-300 text-gray-500 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* ── Table ── */}
        <div className={`rounded-2xl overflow-hidden shadow border ${divider}`}>
          <table className="min-w-full text-sm">
            <thead
              className={
                darkMode
                  ? "bg-gray-800 text-yellow-400"
                  : "bg-blue-100 text-blue-800"
              }
            >
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Lat, Lng</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : junctions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No junctions found.
                  </td>
                </tr>
              ) : (
                junctions.map((j) => (
                  <tr
                    key={j.id}
                    className={
                      darkMode
                        ? "border-t border-gray-800 hover:bg-gray-800"
                        : "border-t hover:bg-gray-50"
                    }
                  >
                    <td className="p-3 font-mono text-xs text-gray-500">
                      {j.id}
                    </td>
                    <td className="p-3 font-medium">{j.junction_name}</td>
                    <td className="p-3">{j.location || "—"}</td>
                    <td className="p-3 font-mono text-xs">
                      {j.latitude ?? "-"}, {j.longitude ?? "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          j.status === "active"
                            ? "bg-green-900 text-green-300 border border-green-700"
                            : j.status === "maintenance"
                              ? "bg-yellow-900 text-yellow-300 border border-yellow-700"
                              : "bg-gray-800 text-gray-400 border border-gray-600"
                        }`}
                      >
                        {j.status || "active"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openEdit(j)}
                        className={`text-sm px-3 py-1 rounded-lg border transition ${
                          darkMode
                            ? "border-gray-600 hover:bg-gray-700"
                            : "border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(j.id)}
                        className="text-sm px-3 py-1 rounded-lg border border-red-800 text-red-400 hover:bg-red-900 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
