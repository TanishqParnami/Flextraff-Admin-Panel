// src/components/Sidebar.jsx
import {
  BarChart3,
  Table,
  Settings,
  LogOut,
  Moon,
  UserPlus,
  Users,
  GitBranch,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import flextraff_logo from "../../assets/flextraff_logo.png";

export default function Sidebar({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "ADMIN";

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/", { replace: true });
  };

  const linkCls = `flex items-center gap-2 p-2 rounded-lg transition-colors ${
    darkMode
      ? "hover:bg-gray-800 hover:text-yellow-400"
      : "hover:bg-blue-50 hover:text-blue-700"
  }`;
  const iconCls = darkMode ? "text-yellow-400" : "text-blue-500";
  const dividerCls = `my-3 border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`;

  return (
    <aside
      className={`w-64 border-r ${
        darkMode
          ? "bg-gray-900 border-gray-800 text-gray-100"
          : "bg-gray-100 border-gray-300 text-gray-900"
      } p-6 flex flex-col justify-between min-h-screen`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-10">
          <button
            aria-label="Toggle dark mode"
            className={`rounded-full p-2 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}
            onClick={toggleDarkMode}
          >
            <Moon
              size={22}
              color={darkMode ? "#facc15" : "#555"}
              fill={darkMode ? "#facc15" : "none"}
            />
          </button>
          <h1
            className={`text-xl font-bold tracking-wide ${darkMode ? "text-yellow-400" : "text-blue-600"}`}
          >
            <img
              src={flextraff_logo}
              alt="flextraff logo"
              className="w-10 h-10 flex items-center"
            />
            FlexTraff
          </h1>
        </div>

        {/* Nav Links */}
        <nav className="space-y-2">
          <Link to="/dashboard" className={linkCls}>
            <BarChart3 size={18} className={iconCls} />
            <span>Analytics</span>
          </Link>

          <Link to="/traffic-data" className={linkCls}>
            <Table size={18} className={iconCls} />
            <span>Traffic Data</span>
          </Link>

          <Link to="/controls" className={linkCls}>
            <Settings size={18} className={iconCls} />
            <span>Controls</span>
          </Link>

          <Link to="/logs" className={linkCls}>
            <Table size={18} className={iconCls} />
            <span>Logs</span>
          </Link>

          <Link to="/scanners" className={linkCls}>
            <Settings size={18} className={iconCls} />
            <span>Scanners</span>
          </Link>

          {/* ── Admin only ── */}
          {isAdmin && (
            <>
              <div className={dividerCls} />

              <Link to="/junctions" className={linkCls}>
                <GitBranch size={18} className={iconCls} />
                <span>Junctions</span>
              </Link>

              <Link to="/users" className={linkCls}>
                <Users size={18} className={iconCls} />
                <span>Users</span>
              </Link>

              <Link to="/create-user" className={linkCls}>
                <UserPlus size={18} className={iconCls} />
                <span>Create User</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Logout */}
      <button
        className="flex items-center gap-2 mt-6 text-gray-400 hover:text-red-500 transition"
        onClick={handleLogout}
      >
        <LogOut size={18} /> Logout
      </button>
    </aside>
  );
}
