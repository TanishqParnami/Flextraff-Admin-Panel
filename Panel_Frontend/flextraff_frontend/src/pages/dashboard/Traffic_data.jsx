// src/pages/Traffic_data.jsx
import { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import Sidebar from "../../components/layout/Sidebar";

export default function TrafficData({ darkMode, toggleDarkMode }) {
  const [junctions, setJunctions] = useState([]);
  const [loading, setLoading] = useState(false);

  const labelText = darkMode ? "text-yellow-400" : "text-blue-700";
  const divider = darkMode ? "border-gray-700" : "border-gray-200";

  useEffect(() => {
    fetchJunctions();
  }, []);

  async function fetchJunctions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("traffic_junctions")
      .select("*")
      .order("id", { ascending: false });
    if (error) console.error(error);
    else setJunctions(data ?? []);
    setLoading(false);
  }

  return (
    <div
      className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}
    >
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-3xl font-semibold ${labelText}`}>
            Traffic Junctions
          </h2>
          <button
            onClick={fetchJunctions}
            className={`text-sm px-4 py-2 rounded-lg border transition ${
              darkMode
                ? "border-gray-700 text-gray-400 hover:bg-gray-800"
                : "border-gray-300 text-gray-500 hover:bg-gray-100"
            }`}
          >
            Refresh
          </button>
        </div>

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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : junctions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
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
