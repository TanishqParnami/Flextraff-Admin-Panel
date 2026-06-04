// src/pages/UserDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Key } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import supabase from "../../lib/supabaseClient";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8001"
  : "https://flextraff-backend-production-186c.up.railway.app";

const ROLES = ["ADMIN", "OPERATOR", "OBSERVER"];

export default function UserDetail({ darkMode, toggleDarkMode }) {
  const { user_id } = useParams();
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "ADMIN";
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // ── State ─────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [allJunctions, setAllJunctions] = useState([]);
  const [userJunctions, setUserJunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit info
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    role: "",
    is_active: true,
  });
  const [editSuccess, setEditSuccess] = useState(null);
  const [editErr, setEditErr] = useState(null);
  const [savingInfo, setSavingInfo] = useState(false);

  // Change password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSuccess, setPwSuccess] = useState(null);
  const [pwErr, setPwErr] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  // Junctions
  const [junctionSuccess, setJunctionSuccess] = useState(null);
  const [junctionErr, setJunctionErr] = useState(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // ── Style helpers ─────────────────────────────────────────────────────
  const headerText = darkMode ? "text-yellow-400" : "text-blue-600";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-100";
  const divider = darkMode ? "border-gray-700" : "border-gray-200";
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1 ${subText}`;
  const inputCls = `w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 ${
    darkMode
      ? "bg-gray-800 text-gray-200 border border-gray-700 focus:ring-yellow-400"
      : "bg-white text-gray-900 border focus:ring-blue-500"
  }`;

  // ── Fetch user ────────────────────────────────────────────────────────
  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/${user_id}`, {
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch user");
      setUser(data);
      setEditForm({
        full_name: data.full_name || "",
        email: data.email || "",
        role: data.role || "",
        is_active: data.is_active,
      });
      setUserJunctions(data.junctions?.map((j) => j.junction_id) || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch all junctions ───────────────────────────────────────────────
  const fetchAllJunctions = async () => {
    const { data } = await supabase
      .from("traffic_junctions")
      .select("id, junction_name")
      .order("id");
    setAllJunctions(data || []);
  };

  useEffect(() => {
    fetchUser();
    fetchAllJunctions();
  }, [user_id]);

  // ── Save user info ────────────────────────────────────────────────────
  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setEditSuccess(null);
    setEditErr(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/${user_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
          is_active: editForm.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update user");
      setUser(data);
      setEditSuccess("User information updated successfully");
    } catch (err) {
      setEditErr(err.message);
    } finally {
      setSavingInfo(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwSuccess(null);
    setPwErr(null);
    if (!newPassword.trim()) {
      setPwErr("Password is required");
      return;
    }
    if (newPassword.length < 8) {
      setPwErr("Minimum 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr("Passwords do not match");
      return;
    }

    setSavingPw(true);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/admin/${user_id}/change-password`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: parseInt(user_id),
            new_password: newPassword,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to change password");
      setPwSuccess("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwErr(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  // ── Add junction ──────────────────────────────────────────────────────
  const handleAddJunction = async (junctionId) => {
    setAdding(true);
    setJunctionSuccess(null);
    setJunctionErr(null);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/admin/users/${user_id}/junctions`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: parseInt(user_id),
            junction_id: junctionId,
            access_level: "OPERATOR",
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add junction");
      setUserJunctions((prev) => [...prev, junctionId]);
      setJunctionSuccess("Junction added successfully");
    } catch (err) {
      setJunctionErr(err.message);
    } finally {
      setAdding(false);
    }
  };

  // ── Remove junction ───────────────────────────────────────────────────
  const handleRemoveJunction = async (junctionId) => {
    setRemovingId(junctionId);
    setJunctionSuccess(null);
    setJunctionErr(null);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/admin/users/${user_id}/junctions/${junctionId}`,
        { method: "DELETE", headers },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to remove junction");
      setUserJunctions((prev) => prev.filter((id) => id !== junctionId));
      setJunctionSuccess("Junction removed successfully");
    } catch (err) {
      setJunctionErr(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const junctionName = (id) =>
    allJunctions.find((j) => j.id === id)?.junction_name || `Junction ${id}`;

  const unassignedJunctions = allJunctions.filter(
    (j) => !userJunctions.includes(j.id),
  );

  const RoleBadge = ({ role }) => {
    const colors = {
      ADMIN: "bg-purple-900 text-purple-300 border border-purple-700",
      OPERATOR: "bg-blue-900 text-blue-300 border border-blue-700",
      OBSERVER: "bg-gray-800 text-gray-400 border border-gray-600",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[role] || colors.OBSERVER}`}
      >
        {role}
      </span>
    );
  };

  if (loading)
    return (
      <div
        className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}
      >
        <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className={subText}>Loading user…</p>
        </main>
      </div>
    );

  if (error)
    return (
      <div
        className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}
      >
        <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-red-400">{error}</p>
        </main>
      </div>
    );

  return (
    <div
      className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}
    >
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* ── Back + Header ── */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/users")}
            className={`flex items-center gap-2 text-sm mb-4 ${subText} hover:text-white transition`}
          >
            <ArrowLeft size={16} /> Back to Users
          </button>
          <h2 className={`text-3xl font-semibold ${headerText}`}>
            {user.full_name}
          </h2>
          <p className={`text-sm mt-1 ${subText}`}>
            User ID #{user.id} · <RoleBadge role={user.role} />
          </p>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* ── Card 1: Edit User Info ── */}
          <div
            className={`${cardBg} p-6 rounded-2xl shadow-lg border ${divider}`}
          >
            <h3
              className={`text-base font-semibold mb-4 pb-3 border-b ${divider}`}
            >
              User Information
            </h3>

            {editSuccess && (
              <div className="mb-4 flex items-center gap-3 bg-green-900 border border-green-600 text-green-300 text-sm px-4 py-3 rounded-xl">
                <span className="font-bold">✓</span>
                <span>{editSuccess}</span>
              </div>
            )}
            {editErr && (
              <div className="mb-4 flex items-center gap-3 bg-red-900 border border-red-600 text-red-300 text-sm px-4 py-3 rounded-xl">
                <span className="font-bold">✕</span>
                <span>{editErr}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, role: e.target.value }))
                  }
                  className={inputCls}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Account Status</label>
                <select
                  value={editForm.is_active}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      is_active: e.target.value === "true",
                    }))
                  }
                  className={inputCls}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={handleSaveInfo}
                disabled={savingInfo}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save size={14} />
                {savingInfo ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* ── Card 2: Change Password ── */}
          <div
            className={`${cardBg} p-6 rounded-2xl shadow-lg border ${divider}`}
          >
            <h3
              className={`text-base font-semibold mb-4 pb-3 border-b ${divider} flex items-center gap-2`}
            >
              <Key size={16} /> Change Password
            </h3>

            {pwSuccess && (
              <div className="mb-4 flex items-center gap-3 bg-green-900 border border-green-600 text-green-300 text-sm px-4 py-3 rounded-xl">
                <span className="font-bold">✓</span>
                <span>{pwSuccess}</span>
              </div>
            )}
            {pwErr && (
              <div className="mb-4 flex items-center gap-3 bg-red-900 border border-red-600 text-red-300 text-sm px-4 py-3 rounded-xl">
                <span className="font-bold">✕</span>
                <span>{pwErr}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>New Password</label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={handleChangePassword}
                disabled={savingPw}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Key size={14} />
                {savingPw ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>

          {/* ── Card 3: Manage Junctions ── */}
          <div
            className={`${cardBg} p-6 rounded-2xl shadow-lg border ${divider}`}
          >
            <div
              className={`flex items-center justify-between mb-4 pb-3 border-b ${divider}`}
            >
              <div>
                <h3 className="text-base font-semibold">Assigned Junctions</h3>
                <p className={`text-xs mt-0.5 ${subText}`}>
                  {userJunctions.length} junction
                  {userJunctions.length !== 1 ? "s" : ""} assigned
                </p>
              </div>
            </div>

            {junctionSuccess && (
              <div className="mb-4 flex items-center gap-3 bg-green-900 border border-green-600 text-green-300 text-sm px-4 py-3 rounded-xl">
                <span className="font-bold">✓</span>
                <span>{junctionSuccess}</span>
              </div>
            )}
            {junctionErr && (
              <div className="mb-4 flex items-center gap-3 bg-red-900 border border-red-600 text-red-300 text-sm px-4 py-3 rounded-xl">
                <span className="font-bold">✕</span>
                <span>{junctionErr}</span>
              </div>
            )}

            {/* Assigned junctions */}
            {userJunctions.length === 0 ? (
              <p className={`text-sm ${subText} mb-4`}>
                No junctions assigned yet.
              </p>
            ) : (
              <div className="space-y-2 mb-6">
                {userJunctions.map((jId) => (
                  <div
                    key={jId}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${divider} ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <div>
                      <span
                        className={`text-xs font-mono ${darkMode ? "text-yellow-400" : "text-blue-500"}`}
                      >
                        JCT-{String(jId).padStart(3, "0")}
                      </span>
                      <p className="text-sm font-semibold mt-0.5">
                        {junctionName(jId)}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveJunction(jId)}
                        disabled={removingId === jId}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                      >
                        <Trash2 size={12} />
                        {removingId === jId ? "Removing…" : "Remove"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add junction */}
            {isAdmin && unassignedJunctions.length > 0 && (
              <div className={`border-t ${divider} pt-4`}>
                <p
                  className={`text-xs font-semibold uppercase tracking-wide mb-3 ${subText}`}
                >
                  Add Junction
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unassignedJunctions.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => handleAddJunction(j.id)}
                      disabled={adding}
                      className={`flex items-center justify-between text-left px-4 py-3 rounded-xl border transition disabled:opacity-40 ${
                        darkMode
                          ? "border-gray-700 bg-gray-800 hover:border-yellow-400"
                          : "border-gray-200 bg-white hover:border-blue-400"
                      }`}
                    >
                      <div>
                        <span
                          className={`text-xs font-mono ${darkMode ? "text-yellow-400" : "text-blue-500"}`}
                        >
                          JCT-{String(j.id).padStart(3, "0")}
                        </span>
                        <p className="text-sm font-semibold mt-0.5">
                          {j.junction_name}
                        </p>
                      </div>
                      <Plus
                        size={16}
                        className={
                          darkMode ? "text-yellow-400" : "text-blue-500"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
