// src/pages/controls.jsx
import { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import Sidebar from "../../components/layout/Sidebar";

const API_URL = import.meta.env.DEV
  ? ""
  : "https://flextraff-backend-production-186c.up.railway.app";

export default function Controls({ darkMode, toggleDarkMode }) {
  const [junctions, setJunctions] = useState([]);
  const [selectedJunction, setSelectedJunction] = useState(null);
  const [mode, setMode] = useState("automatic");

  // Auto config
  const [minLaneTime, setMinLaneTime] = useState(15);
  const [maxLaneTime, setMaxLaneTime] = useState(90);

  // Manual config
  const [greenTimes, setGreenTimes] = useState({
    north: 30,
    south: 30,
    east: 30,
    west: 30,
  });
  const [yellowTime, setYellowTime] = useState(5);
  const [totalGreen, setTotalGreen] = useState(120); // default 30x4

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [serverErr, setServerErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const lanes = ["north", "south", "east", "west"];

  // ── Style helpers ─────────────────────────────────────────────────────
  const labelText = darkMode ? "text-yellow-400" : "text-blue-700";
  const inputBg = darkMode ? "bg-gray-800" : "bg-gray-100";
  const inputBorder = darkMode
    ? "border border-gray-700"
    : "border border-gray-300";
  const inputText = darkMode ? "text-white" : "text-gray-900";
  const inputFocusRing = darkMode
    ? "focus:ring-yellow-400"
    : "focus:ring-blue-500";
  const helperText = darkMode ? "text-yellow-300" : "text-blue-500";
  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-100";
  const divider = darkMode ? "border-gray-700" : "border-gray-200";
  const inputCls = `${inputBg} ${inputBorder} ${inputText} w-full p-3 rounded-lg focus:outline-none focus:ring-2 ${inputFocusRing}`;

  const getHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // ── Fetch junctions from Supabase ─────────────────────────────────────
  useEffect(() => {
    async function fetchJunctions() {
      const { data, error } = await supabase
        .from("traffic_junctions")
        .select("id, junction_name")
        .order("id", { ascending: true });
      if (error) console.error(error);
      else {
        setJunctions(data ?? []);
        if (data && data.length) setSelectedJunction(data[0].id);
      }
    }
    fetchJunctions();
  }, []);

  // ── Load existing config when junction changes ─────────────────────────
  useEffect(() => {
    if (selectedJunction) loadConfig(selectedJunction);
  }, [selectedJunction]);

  const loadConfig = async (junctionId) => {
    setLoading(true);
    setSuccess(null);
    setServerErr(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/controls/${junctionId}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load config");

      const manual = data.manual_config;
      const auto = data.auto_config;

      if (manual?.is_manual_mode) {
        setMode("manual");
        const n = manual.lane_1_green_time ?? 30;
        const s = manual.lane_2_green_time ?? 30;
        const e = manual.lane_3_green_time ?? 30;
        const w = manual.lane_4_green_time ?? 30;

        // ✅ Only trust DB values if they look reasonable
        const total = n + s + e + w;
        const safeTotal = total > 0 && total <= 600 ? total : 120;
        const safeN = n <= safeTotal ? n : 30;
        const safeS = s <= safeTotal ? s : 30;
        const safeE = e <= safeTotal ? e : 30;
        const safeW = safeTotal - safeN - safeS - safeE;

        setTotalGreen(safeTotal);
        setGreenTimes({ north: safeN, south: safeS, east: safeE, west: safeW });
        setYellowTime(manual.yellow_time ?? 5);
      } else {
        setMode("automatic");
        // ✅ Reset manual to clean defaults when switching to auto
        setTotalGreen(120);
        setGreenTimes({ north: 30, south: 30, east: 30, west: 30 });
        if (auto) {
          setMinLaneTime(auto.min_lane_time ?? 15);
          setMaxLaneTime(auto.max_lane_time ?? 90);
        }
      }
    } catch (err) {
      setServerErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Manual green time logic ────────────────────────────────────────────
  const handleGreenTimeChange = (lane, value) => {
    if (lane === "west") return;
    const val = Math.max(0, Number(value));
    const updated = { ...greenTimes, [lane]: val };

    // west = total - sum of other three
    const sumThree = updated.north + updated.south + updated.east;
    const west = totalGreen - sumThree;

    if (west < 0) {
      setError("Lane times exceed total. Reduce other lanes.");
      return;
    }
    updated.west = west;
    setGreenTimes(updated);
    setError("");
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJunction) {
      setError("Select a junction first.");
      return;
    }

    setSubmitting(true);
    setSuccess(null);
    setServerErr(null);
    setError("");

    try {
      if (mode === "manual") {
        // Validate
        const total =
          greenTimes.north +
          greenTimes.south +
          greenTimes.east +
          greenTimes.west;
        if (total <= 0) {
          setError("Lane times must be greater than 0.");
          setSubmitting(false);
          return;
        }

        const res = await fetch(
          `${API_URL}/api/v1/controls/${selectedJunction}/manual`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              lane_1_green_time: greenTimes.north,
              lane_2_green_time: greenTimes.south,
              lane_3_green_time: greenTimes.east,
              lane_4_green_time: greenTimes.west,
              yellow_time: yellowTime,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.detail || "Failed to save manual config");
        setSuccess(
          `Manual override saved for junction — N:${greenTimes.north}s S:${greenTimes.south}s E:${greenTimes.east}s W:${greenTimes.west}s`,
        );
      } else {
        // Auto mode
        if (minLaneTime >= maxLaneTime) {
          setError("Min lane time must be less than max lane time.");
          setSubmitting(false);
          return;
        }
        const res = await fetch(
          `${API_URL}/api/v1/controls/${selectedJunction}/auto`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              min_lane_time: minLaneTime,
              max_lane_time: maxLaneTime,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.detail || "Failed to save auto config");
        setSuccess(
          `Automatic mode saved — Min: ${minLaneTime}s, Max: ${maxLaneTime}s per lane`,
        );
      }
    } catch (err) {
      setServerErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"} transition-colors duration-300`}
    >
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className={`text-3xl font-semibold mb-6 ${labelText}`}>
          Traffic Light Controls
        </h2>

        {/* ── Banners ── */}
        {success && (
          <div className="max-w-lg mb-5 flex items-center gap-3 bg-green-900 border border-green-600 text-green-300 text-sm px-5 py-3 rounded-xl">
            <span className="font-bold">✓</span>
            <span>{success}</span>
          </div>
        )}
        {serverErr && (
          <div className="max-w-lg mb-5 flex items-center gap-3 bg-red-900 border border-red-600 text-red-300 text-sm px-5 py-3 rounded-xl">
            <span className="font-bold">✕</span>
            <span>{serverErr}</span>
          </div>
        )}

        {/* ── Junction selector ── */}
        <div className="mb-6 max-w-lg">
          <label className={`block mb-2 font-semibold ${labelText}`}>
            Select Junction
          </label>
          <select
            value={selectedJunction ?? ""}
            onChange={(e) => setSelectedJunction(Number(e.target.value))}
            className={inputCls}
          >
            <option value="">-- select junction --</option>
            {junctions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.junction_name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Loading config…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
            {/* ── Mode selector ── */}
            <div>
              <label className={`block mb-2 font-semibold ${labelText}`}>
                Select Mode
              </label>
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setError("");
                  setSuccess(null);

                  if (e.target.value === "manual") {
                    setTotalGreen(120);
                    setGreenTimes({ north: 30, south: 30, east: 30, west: 30 });
                  }
                }}
                className={inputCls}
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual Override</option>
              </select>
            </div>

            {/* ── Automatic mode ── */}
            {mode === "automatic" && (
              <div
                className={`${cardBg} border ${divider} p-6 rounded-2xl shadow space-y-4`}
              >
                <h3
                  className={`text-base font-semibold pb-2 border-b ${divider} ${labelText}`}
                >
                  Automatic Mode Settings
                </h3>
                <div>
                  <label className={`block mb-1 font-medium ${labelText}`}>
                    Min Lane Time (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={minLaneTime}
                    onChange={(e) => setMinLaneTime(Number(e.target.value))}
                    className={inputCls}
                    required
                  />
                  <p className={`text-xs mt-1 ${helperText}`}>
                    Minimum green time per lane the algorithm can assign.
                  </p>
                </div>
                <div>
                  <label className={`block mb-1 font-medium ${labelText}`}>
                    Max Lane Time (seconds)
                  </label>
                  <input
                    type="number"
                    min={minLaneTime + 1}
                    value={maxLaneTime}
                    onChange={(e) => setMaxLaneTime(Number(e.target.value))}
                    className={inputCls}
                    required
                  />
                  <p className={`text-xs mt-1 ${helperText}`}>
                    Maximum green time per lane the algorithm can assign.
                  </p>
                </div>
              </div>
            )}

            {/* ── Manual mode ── */}
            {mode === "manual" && (
              <div
                className={`${cardBg} border ${divider} p-6 rounded-2xl shadow space-y-5`}
              >
                <h3
                  className={`text-base font-semibold pb-2 border-b ${divider} ${labelText}`}
                >
                  Manual Override Settings
                </h3>

                {/* ── Total Green Time ── */}
                <div>
                  <label className={`block mb-1 font-medium ${labelText}`}>
                    Total Green Time (seconds)
                  </label>
                  <input
                    type="number"
                    min="20"
                    value={totalGreen}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTotalGreen(val); // ← just set directly, no Math.max
                      const sumThree =
                        greenTimes.north + greenTimes.south + greenTimes.east;
                      const west = val - sumThree;
                      setGreenTimes((g) => ({
                        ...g,
                        west: west < 0 ? 0 : west,
                      }));
                      setError(
                        west < 0
                          ? "Lane times exceed total. Reduce other lanes."
                          : "",
                      );
                    }}
                    onBlur={(e) => {
                      // ← validate only when user leaves the field
                      const val = Number(e.target.value);
                      if (val < 20) {
                        setTotalGreen(20);
                        const sumThree =
                          greenTimes.north + greenTimes.south + greenTimes.east;
                        const west = 20 - sumThree;
                        setGreenTimes((g) => ({
                          ...g,
                          west: west < 0 ? 0 : west,
                        }));
                      }
                    }}
                    className={inputCls}
                    required
                  />
                  <p className={`text-xs mt-1 ${helperText}`}>
                    Sum of all four lane green times. West lane is
                    auto-calculated.
                  </p>
                </div>

                {/* ── Lane Green Times ── */}
                <div className="grid grid-cols-2 gap-5">
                  {["north", "south", "east"].map((lane) => (
                    <div key={lane}>
                      <label
                        className={`block mb-1 capitalize font-medium ${labelText}`}
                      >
                        {lane.charAt(0).toUpperCase() + lane.slice(1)} Lane
                        (seconds)
                      </label>
                      <input
                        type="number"
                        min="5"
                        value={greenTimes[lane]}
                        onChange={(e) =>
                          handleGreenTimeChange(lane, e.target.value)
                        }
                        className={inputCls}
                        required
                      />
                    </div>
                  ))}

                  {/* ── West Lane (auto-filled) ── */}
                  <div>
                    <label className="block mb-1 font-medium text-gray-400">
                      West Lane (Auto-Filled)
                    </label>
                    <input
                      type="number"
                      value={greenTimes.west}
                      readOnly
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-500 text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1 italic">
                      Auto-calculated: Total − (N + S + E)
                    </p>
                  </div>
                </div>

                {/* ── Yellow Time ── */}
                <div>
                  <label className={`block mb-1 font-medium ${labelText}`}>
                    Yellow Time (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={yellowTime}
                    onChange={(e) => setYellowTime(Number(e.target.value))}
                    className={inputCls}
                  />
                  <p className={`text-xs mt-1 ${helperText}`}>
                    Yellow signal duration per lane.
                  </p>
                </div>

                {error && (
                  <p className="text-red-500 text-sm font-semibold">{error}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Settings"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
