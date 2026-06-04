// src/pages/Scanners.jsx
import { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import Sidebar from "../../components/layout/Sidebar";

export default function Scanners({ darkMode, toggleDarkMode }) {
  const [scanners, setScanners] = useState([]);

  useEffect(() => {
    fetchScanners();
  }, []);

  async function fetchScanners() {
    const { data, error } = await supabase.from("scanners").select("*").order("id");
    if (error) console.error(error);
    else setScanners(data ?? []);
  }

  async function toggleScannerStatus(id, currentStatus) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase.from("scanners").update({ status: newStatus }).eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    fetchScanners();
  }

  return (
    <div className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}>
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className={darkMode ? "text-3xl font-semibold text-yellow-400" : "text-3xl font-semibold text-blue-600"}>Scanners</h2>

        <div className="mt-6 rounded-lg overflow-hidden shadow">
          <table className="w-full text-sm">
            <thead className={darkMode ? "bg-gray-800 text-yellow-400" : "bg-blue-200 text-blue-800"}>
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">MAC</th>
                <th className="p-3 text-left">Position</th>
                <th className="p-3 text-left">Last Heartbeat</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {scanners.map(s => (
                <tr key={s.id} className={darkMode ? "border-t border-gray-800" : "border-t"}>
                  <td className="p-3">{s.id}</td>
                  <td className="p-3">{s.scanner_mac_address}</td>
                  <td className="p-3">{s.scanner_position}</td>
                  <td className="p-3">{s.last_heartbeat ? new Date(s.last_heartbeat).toLocaleString() : "-"}</td>
                  <td className="p-3">{s.status}</td>
                  <td className="p-3">
                    <button onClick={() => toggleScannerStatus(s.id, s.status)} className="px-3 py-1 rounded border">
                      {s.status === "active" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
