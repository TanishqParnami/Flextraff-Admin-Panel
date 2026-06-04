// src/pages/Logs.jsx
import { useEffect, useRef, useState } from "react";
import supabase from "../../lib/supabaseClient";
import Sidebar from "../../components/layout/Sidebar";

export default function Logs({ darkMode, toggleDarkMode }) {
  const [logs, setLogs] = useState([]);
  const [junctionFilter, setJunctionFilter] = useState(null);
  const [junctions, setJunctions] = useState([]);
  const wsRef = useRef(null);

  // read WS url from env (Vite)
  const WS_URL = import.meta.env.VITE_WS_URL || (window.location.hostname === "localhost" ? "ws://localhost:3000/ws/logs" : `wss://${window.location.host}/ws/logs`);

  useEffect(() => {
    fetchJunctions();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [junctionFilter]);

  useEffect(() => {
    // connect to websocket
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Logs WS connected to", WS_URL);
        // optional: send a ping to server
        ws.send("ping");
      };

      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          // Normalize different message types into a log shape:
          const normalized = normalizeIncoming(payload);
          // Apply junction filter if present
          if (junctionFilter && normalized.junction_id && normalized.junction_id !== junctionFilter) {
            return;
          }
          // prepend to logs
          setLogs(prev => [normalized, ...prev].slice(0, 500)); // cap at 500
        } catch (err) {
          console.error("Invalid WS message", err, ev.data);
        }
      };

      ws.onerror = (err) => console.error("Logs WS error", err);
      ws.onclose = () => console.warn("Logs WS closed");

      return () => {
        try {
          ws.close();
        } catch (e) {}
      };
    } catch (e) {
      console.error("Failed to open logs websocket", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [WS_URL, junctionFilter]);

  function normalizeIncoming(payload) {
    /**
     * Convert incoming payloads to table row shape:
     * { id, timestamp, log_level, component, message, junction_id }
     */
    if (!payload) return { id: Date.now(), timestamp: new Date().toISOString(), log_level: "INFO", component: "ws", message: "empty payload" };

    // If payload is an array (batch), take first item or create composite
    if (Array.isArray(payload)) {
      return {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        log_level: "INFO",
        component: "ws.batch",
        message: JSON.stringify(payload),
      };
    }

    // payload types you created in backend:
    const t = payload.type || payload.event || "message";

    if (t === "mqtt_car_counts") {
      return {
        id: Date.now(),
        timestamp: payload.timestamp || new Date().toISOString(),
        log_level: "INFO",
        component: `MQTT - junction:${payload.junction_id ?? "-"}`,
        message: `Car counts: ${JSON.stringify(payload.lane_counts ?? payload.raw ?? {})}`,
        junction_id: payload.junction_id ?? null,
      };
    }

    if (t === "calculation_result") {
      return {
        id: Date.now(),
        timestamp: payload.timestamp || new Date().toISOString(),
        log_level: "INFO",
        component: `Calculator - junction:${payload.junction_id ?? "-"}`,
        message: `Green times: ${JSON.stringify(payload.green_times)} | cycle: ${payload.cycle_time}s`,
        junction_id: payload.junction_id ?? null,
      };
    }

    // generic fallback
    return {
      id: payload.id || Date.now(),
      timestamp: payload.timestamp || new Date().toISOString(),
      log_level: payload.level || payload.log_level || "INFO",
      component: payload.component || payload.source || "ws",
      message: payload.message ? (typeof payload.message === "string" ? payload.message : JSON.stringify(payload.message)) : JSON.stringify(payload),
      junction_id: payload.junction_id ?? null,
    };
  }

  async function fetchJunctions() {
    const { data } = await supabase.from("traffic_junctions").select("id,junction_name").order("id");
    if (data) setJunctions(data);
  }

  async function fetchLogs() {
    let q = supabase.from("system_logs").select("*").order("timestamp", { ascending: false }).limit(200);
    if (junctionFilter) q = q.eq("junction_id", junctionFilter);
    const { data, error } = await q;
    if (error) console.error(error);
    else {
      // normalize Supabase rows (keep same shape as WS)
      const normalized = (data ?? []).map(d => ({
        id: d.id,
        timestamp: d.timestamp,
        log_level: d.log_level ?? "INFO",
        component: d.component ?? "db",
        message: d.message ?? JSON.stringify(d),
        junction_id: d.junction_id ?? null,
      }));
      setLogs(normalized);
    }
  }

  return (
    <div className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}>
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className={darkMode ? "text-3xl font-semibold text-yellow-400" : "text-3xl font-semibold text-blue-600"}>
            System Logs
          </h2>
          <div>
            <select
              value={junctionFilter ?? ""}
              onChange={(e) => setJunctionFilter(e.target.value ? Number(e.target.value) : null)}
              className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 ${darkMode ? "bg-gray-800 text-gray-200 border border-gray-700 focus:ring-yellow-400" : "bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"}`}
            >
              <option value="">All junctions</option>
              {junctions.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.junction_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`rounded-lg shadow overflow-hidden ${darkMode ? "bg-gray-900 border border-gray-800" : "bg-gray-50 border border-gray-200"}`}>
          <table className="w-full text-sm">
            <thead className={darkMode ? "bg-gray-800 text-yellow-400" : "bg-gray-100 text-blue-700"}>
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Time</th>
                <th className="px-4 py-3 text-left font-semibold">Level</th>
                <th className="px-4 py-3 text-left font-semibold">Component</th>
                <th className="px-4 py-3 text-left font-semibold">Message</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className={darkMode ? "border-t border-gray-800" : "border-t"}>
                  <td className="p-2">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-2">{l.log_level}</td>
                  <td className="p-2">{l.component}</td>
                  <td className="p-2 break-words max-w-xl">{l.message}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">No logs yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
