// src/pages/Users.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, RefreshCw } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8001"
  : "https://flextraff-backend-production-186c.up.railway.app";

// const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
// const isAdmin = currentUser.role === "ADMIN";

export default function Users({ darkMode, toggleDarkMode }) {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "ADMIN";
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const PAGE_SIZE = 10;
  const navigate = useNavigate();

  const headerText = darkMode ? "text-yellow-400" : "text-blue-600";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-100";
  const divider = darkMode ? "border-gray-700" : "border-gray-200";
  const trHover = darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50";
  const thCls = darkMode
    ? "bg-gray-800 text-yellow-400"
    : "bg-blue-50 text-blue-700";

  // ── Fetch users ───────────────────────────────────────────────────────
  const fetchUsers = async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const offset = (pageNum - 1) * PAGE_SIZE;
      const res = await fetch(
        `${API_URL}/api/v1/admin/?limit=${PAGE_SIZE}&offset=${offset}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch users");
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Role badge ────────────────────────────────────────────────────────
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

  // ── Status badge ──────────────────────────────────────────────────────
  const StatusBadge = ({ isActive }) => (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
        isActive
          ? "bg-green-900 text-green-300 border border-green-700"
          : "bg-red-900  text-red-300  border border-red-700"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-400" : "bg-red-400"}`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  return (
    <div
      className={`h-screen flex ${darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}
    >
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-3xl font-semibold ${headerText}`}>Users</h2>
            <p className={`text-sm mt-1 ${subText}`}>
              {total} registered operator{total !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers(page)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition ${
                darkMode
                  ? "border-gray-700 text-gray-400 hover:bg-gray-800"
                  : "border-gray-300 text-gray-500 hover:bg-gray-100"
              }`}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate("/create-user")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <UserPlus size={14} />
                Create User
              </button>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-900 border border-red-600 text-red-300 text-sm px-5 py-3 rounded-xl">
            <span className="font-bold">✕</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Table ── */}
        <div
          className={`${cardBg} rounded-2xl shadow-lg border ${divider} overflow-hidden`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={thCls}>
                  <th className="py-3 px-5 text-left font-semibold">ID</th>
                  <th className="py-3 px-5 text-left font-semibold">
                    Full Name
                  </th>
                  <th className="py-3 px-5 text-left font-semibold">
                    Username
                  </th>
                  <th className="py-3 px-5 text-left font-semibold">Email</th>
                  <th className="py-3 px-5 text-left font-semibold">Role</th>
                  <th className="py-3 px-5 text-left font-semibold">Status</th>
                  <th className="py-3 px-5 text-left font-semibold">
                    Last Login
                  </th>
                  <th className="py-3 px-5 text-left font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className={`py-16 text-center text-sm ${subText}`}
                    >
                      Loading users…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className={`py-16 text-center text-sm ${subText}`}
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-t ${divider} ${trHover} transition cursor-pointer`}
                      onClick={() => navigate(`/users/${u.id}`)}
                    >
                      <td className={`py-3 px-5 font-mono text-xs ${subText}`}>
                        #{u.id}
                      </td>
                      <td className="py-3 px-5 font-medium">{u.full_name}</td>
                      <td className={`py-3 px-5 font-mono text-xs ${subText}`}>
                        {u.username}
                      </td>
                      <td className={`py-3 px-5 ${subText}`}>
                        {u.email || "—"}
                      </td>
                      <td className="py-3 px-5">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="py-3 px-5">
                        <StatusBadge isActive={u.is_active} />
                      </td>
                      <td className={`py-3 px-5 text-xs ${subText}`}>
                        {u.last_login
                          ? new Date(u.last_login).toLocaleString()
                          : "Never"}
                      </td>
                      <td className={`py-3 px-5 text-xs ${subText}`}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div
              className={`flex items-center justify-between px-5 py-3 border-t ${divider}`}
            >
              <span className={`text-xs ${subText}`}>
                Page {page} of {totalPages} — {total} total users
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition disabled:opacity-40 ${
                    darkMode
                      ? "border-gray-700 text-gray-400 hover:bg-gray-800"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition disabled:opacity-40 ${
                    darkMode
                      ? "border-gray-700 text-gray-400 hover:bg-gray-800"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
