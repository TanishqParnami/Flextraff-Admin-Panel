// src/pages/CreateUser.jsx
import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import supabase from "../../lib/supabaseClient";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8001"
  : "https://flextraff-backend-production-186c.up.railway.app";

export default function CreateUser({ darkMode, toggleDarkMode }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    is_active: true,
  });
  const [selectedJunctions, setSelectedJunctions] = useState([]);
  const [errors, setErrors] = useState({});
  const [junctions, setJunctions] = useState([]);
  const [loadingJ, setLoadingJ] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [serverErr, setServerErr] = useState(null);

  // ── Fetch junctions from Supabase ─────────────────────────────────────
  useEffect(() => {
    async function fetchJunctions() {
      const { data, error } = await supabase
        .from("traffic_junctions")
        .select("id, junction_name")
        .order("id");
      if (!error) setJunctions(data || []);
      setLoadingJ(false);
    }
    fetchJunctions();
  }, []);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
    setServerErr(null);
  };

  const toggleJunction = (id) => {
    setSelectedJunctions((prev) =>
      prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id],
    );
    setErrors((e) => ({ ...e, junctions: null }));
  };

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.password.trim()) e.password = "Temporary password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (selectedJunctions.length === 0)
      e.junctions = "Select at least one junction";
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setSubmitting(true);
    setServerErr(null);

    try {
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // ── Step 1: Create the user ───────────────────────────────────────
      const rawEmail = form.email.trim();
      const safeEmail = rawEmail === "" ? null : rawEmail;

      const userRes = await fetch(`${API_URL}/api/v1/admin/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          email: safeEmail,
          role: "OPERATOR",
        }),
      });

      const userData = await userRes.json();

      if (!userRes.ok) {
        let errMsg = "Failed to create user";
        if (userData.detail) {
          if (Array.isArray(userData.detail)) {
            errMsg = userData.detail
              .map((e) => `${e.loc[e.loc.length - 1]}: ${e.msg}`)
              .join(" | ");
          } else if (typeof userData.detail === "string") {
            errMsg = userData.detail;
          } else {
            errMsg = JSON.stringify(userData.detail);
          }
        }
        throw new Error(errMsg);
      }

      const newUserId = userData.id;

      // ── Step 2: Assign junctions one by one ──────────────────────────

      for (const junctionId of selectedJunctions) {
        const junctionRes = await fetch(
          `${API_URL}/api/v1/admin/users/${newUserId}/junctions/`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              user_id: newUserId,
              junction_id: Number(junctionId),
              access_level: "OPERATOR",
            }),
          },
        );
        const junctionData = await junctionRes.json();
        if (!junctionRes.ok) {
          throw new Error(
            junctionData.detail ||
              "User created but junction assignment failed",
          );
        }
      }

      // ── Success ───────────────────────────────────────────────────────
      setSuccess(
        `User "${form.username}" created and assigned to ${selectedJunctions.length} junction${selectedJunctions.length > 1 ? "s" : ""}!`,
      );
      setForm({
        full_name: "",
        email: "",
        username: "",
        password: "",
        is_active: true,
      });
      setSelectedJunctions([]);
    } catch (err) {
      console.error(err);
      setServerErr(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setForm({
      full_name: "",
      email: "",
      username: "",
      password: "",
      is_active: true,
    });
    setSelectedJunctions([]);
    setErrors({});
    setSuccess(null);
    setServerErr(null);
  };

  // ── Style helpers ─────────────────────────────────────────────────────
  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-100";
  const headerText = darkMode ? "text-yellow-400" : "text-blue-600";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const divider = darkMode ? "border-gray-700" : "border-gray-200";
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1 ${subText}`;

  const inputCls = (field) =>
    `w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 ${
      darkMode
        ? "bg-gray-800 text-gray-200 border border-gray-700 focus:ring-yellow-400"
        : "bg-white text-gray-900 border focus:ring-blue-500"
    } ${errors[field] ? "border-red-500" : ""}`;

  const junctionCardCls = (id) => {
    const selected = selectedJunctions.includes(id);
    if (selected)
      return darkMode
        ? "border-yellow-400 bg-gray-800 ring-1 ring-yellow-400"
        : "border-blue-500 bg-blue-50 ring-1 ring-blue-500";
    return darkMode
      ? "border-gray-700 bg-gray-800 hover:border-gray-500"
      : "border-gray-200 bg-white hover:border-gray-400";
  };

  return (
    <div
      className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}
    >
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h2 className={`text-3xl font-semibold ${headerText}`}>
            Create User
          </h2>
          <p className={`text-sm mt-1 ${subText}`}>
            Add a new operator and assign them to junctions
          </p>
        </div>

        {/* ── Success banner ── */}
        {success && (
          <div className="max-w-3xl mb-6 flex items-center gap-3 bg-green-900 border border-green-600 text-green-300 text-sm px-5 py-3 rounded-xl">
            <span className="text-lg font-bold">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* ── Error banner ── */}
        {serverErr && (
          <div className="max-w-3xl mb-6 flex items-center gap-3 bg-red-900 border border-red-600 text-red-300 text-sm px-5 py-3 rounded-xl">
            <span className="text-lg font-bold">✕</span>
            <span>{serverErr}</span>
          </div>
        )}

        <div className="max-w-3xl space-y-6">
          {/* ── Card 1: Personal Information ── */}
          <div
            className={`${cardBg} p-6 rounded-2xl shadow-lg border ${divider}`}
          >
            <h3
              className={`text-base font-semibold mb-4 pb-3 border-b ${divider}`}
            >
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Arjun Mehta"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  className={inputCls("full_name")}
                />
                {errors.full_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.full_name}
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Email Address *</label>
                <input
                  type="email"
                  placeholder="name@flextraff.gov"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Username *</label>
                <input
                  type="text"
                  placeholder="e.g. arjun_mehta"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  className={inputCls("username")}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Temporary Password *</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className={inputCls("password")}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Card 2: Assign Junctions ── */}
          <div
            className={`${cardBg} p-6 rounded-2xl shadow-lg border ${divider}`}
          >
            <div
              className={`flex items-center justify-between mb-4 pb-3 border-b ${divider}`}
            >
              <div>
                <h3 className="text-base font-semibold">Assign Junctions *</h3>
                <p className={`text-xs mt-0.5 ${subText}`}>
                  {selectedJunctions.length === 0
                    ? "No junctions selected"
                    : `${selectedJunctions.length} junction${selectedJunctions.length > 1 ? "s" : ""} selected`}
                </p>
              </div>
              {errors.junctions && (
                <p className="text-red-500 text-xs">{errors.junctions}</p>
              )}
            </div>

            {loadingJ ? (
              <p className={`text-sm ${subText}`}>Loading junctions…</p>
            ) : junctions.length === 0 ? (
              <p className={`text-sm ${subText}`}>No junctions found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {junctions.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => toggleJunction(j.id)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${junctionCardCls(j.id)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`text-xs font-mono ${darkMode ? "text-yellow-400" : "text-blue-500"}`}
                      >
                        JCT-{String(j.id).padStart(3, "0")}
                      </div>
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedJunctions.includes(j.id)
                            ? darkMode
                              ? "bg-yellow-400 border-yellow-400"
                              : "bg-blue-500 border-blue-500"
                            : darkMode
                              ? "border-gray-600"
                              : "border-gray-300"
                        }`}
                      >
                        {selectedJunctions.includes(j.id) && (
                          <span className="text-gray-900 text-xs font-bold leading-none">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-semibold mt-1">
                      {j.junction_name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pb-10">
            <button
              type="button"
              onClick={handleCancel}
              className={`px-5 py-2 rounded-lg text-sm border transition ${
                darkMode
                  ? "border-gray-600 text-gray-400 hover:bg-gray-800"
                  : "border-gray-300 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating…" : "Create User"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
