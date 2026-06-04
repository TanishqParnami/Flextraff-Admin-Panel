// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import supabase from "../../lib/supabaseClient";
import Sidebar from "../../components/layout/Sidebar";

export default function Dashboard({ darkMode, toggleDarkMode }) {
  const [trafficData, setTrafficData] = useState([]);
  const [lightDist, setLightDist] = useState([]);
  const [logs, setLogs] = useState([]);
  const [junctionFilter, setJunctionFilter] = useState(null);
  const [junctions, setJunctions] = useState([]);
  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  const headerText = darkMode ? "text-yellow-400" : "text-blue-600";
  const sideMainBg = darkMode ? "bg-gray-900" : "bg-gray-100";

  useEffect(() => {
    fetchJunctionList();
    fetchRecentData();
  }, []);

  useEffect(() => {
    fetchRecentData();
  }, [junctionFilter]);

  async function fetchJunctionList() {
    const { data } = await supabase
      .from("traffic_junctions")
      .select("id,junction_name")
      .order("id");
    if (data) setJunctions(data);
    if (data && data.length && !junctionFilter) setJunctionFilter(data[0].id);
  }

  async function fetchRecentData() {
  // get last 500 vehicle detections (optional filter by junction)
  let query = supabase
    .from("vehicle_detections")
    .select("*")
    .order("detection_timestamp", { ascending: false })
    .limit(500);

  if (junctionFilter) {
    query = query.eq("junction_id", junctionFilter);
  }

  const { data: detections, error } = await query;
  if (error) {
    console.error(error);
    return;
  }

  // aggregate counts per lane
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  (detections || []).forEach((d) => {
    const lane = Number(d.lane_number) || 0;
    if (lane >= 1 && lane <= 4) counts[lane]++;
  });

  const mapped = [
    { lane: "North", cars: counts[1] },
    { lane: "South", cars: counts[2] },
    { lane: "East", cars: counts[3] },
    { lane: "West", cars: counts[4] },
  ];
  setTrafficData(mapped);

  // ✅ Only query traffic_cycles if junctionFilter exists
  if (junctionFilter) {
    const { data: cycles, error: cycleErr } = await supabase
      .from("traffic_cycles")
      .select("*")
      .eq("junction_id", junctionFilter)
      .order("id", { ascending: false })
      .limit(1);

    if (cycleErr) console.error(cycleErr);

    const cycle = cycles?.[0];
    if (cycle?.total_cycle_time) {
      const green = [
        cycle.lane_1_green_time || 0,
        cycle.lane_2_green_time || 0,
        cycle.lane_3_green_time || 0,
        cycle.lane_4_green_time || 0,
      ];
      const total = green.reduce((a, b) => a + b, 0) || 1;

      setLightDist([
        { name: "Green", value: Math.round((total / total) * 100) },
        { name: "Yellow", value: 10 },
        { name: "Red", value: 90 },
      ]);
    }
  } else {
    // fallback if no junction selected yet
    setLightDist([
      { name: "Green", value: 45 },
      { name: "Yellow", value: 15 },
      { name: "Red", value: 40 },
    ]);
  }

  const { data: logsData } = await supabase
    .from("vehicle_detections")
    .select("detection_timestamp, lane_number, vehicle_type")
    .order("detection_timestamp", { ascending: false })
    .limit(10);

  setLogs(logsData || []);
}


  return (
    <div
      className={`h-screen flex ${
        darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"
      }`}
    >
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-3xl font-semibold ${headerText}`}>
            Admin Dashboard
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={junctionFilter || ""}
              onChange={(e) => setJunctionFilter(Number(e.target.value))}
              className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 ${
                darkMode
                  ? "bg-gray-800 text-gray-200 border border-gray-700 focus:ring-yellow-400"
                  : "bg-white text-gray-900 border border-gray-300 focus:ring-blue-500"
              }`}
            >
              <option value="">All junctions</option>
              {junctions.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.junction_name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchRecentData}
              className="bg-blue-600 text-white px-3 py-2 rounded"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`${sideMainBg} p-6 rounded-2xl shadow-lg border border-gray-200`}
          >
            <h3 className="text-lg mb-4 font-semibold">Car Count per Lane</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trafficData}>
                <XAxis
                  stroke={darkMode ? "#facc15" : "#3b82f6"}
                  dataKey="lane"
                />
                <YAxis stroke={darkMode ? "#facc15" : "#3b82f6"} />
                <Tooltip />
                <Bar
                  dataKey="cars"
                  fill={darkMode ? "#facc15" : "#3b82f6"}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className={`${sideMainBg} p-6 rounded-2xl shadow-lg border border-gray-200`}
          >
            <h3 className="text-lg mb-4 font-semibold">
              Light Time Distribution
            </h3>
            <ResponsiveContainer width="100%" height={255}>
              <PieChart>
                <Pie
                  data={lightDist}
                  outerRadius={100}
                  label
                  dataKey="value"
                  nameKey="name"
                >
                  {lightDist.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`${sideMainBg} mt-8 p-6 rounded-2xl shadow-lg border border-gray-200`}
        >
          <h3 className="text-lg mb-4 font-semibold">Recent Traffic Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                className={
                  darkMode
                    ? "bg-gray-800 text-yellow-400"
                    : "bg-blue-200 text-blue-800"
                }
              >
                <tr>
                  <th className="py-2 px-4 text-left">Time</th>
                  <th className="py-2 px-4 text-left">Lane</th>
                  <th className="py-2 px-4 text-left">Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((r, i) => (
                  <tr
                    key={i}
                    className={
                      darkMode
                        ? "border-t border-gray-800"
                        : "border-t border-blue-300"
                    }
                  >
                    <td className="py-2 px-4">
                      {new Date(r.detection_timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-4">
                      {["", "North", "South", "East", "West"][r.lane_number] ??
                        r.lane_number}
                    </td>
                    <td className="py-2 px-4">{r.vehicle_type ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
