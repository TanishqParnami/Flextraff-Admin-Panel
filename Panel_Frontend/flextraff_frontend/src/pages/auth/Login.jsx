import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/flextraff_logo.png";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8001"
  : "https://flextraff-backend-production-186c.up.railway.app";

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ── Shared login logic ────────────────────────────────────────────────
  const doLogin = async () => {
    const res = await fetch(`${API_URL}/api/v1/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Invalid credentials");

    // 2FA setup required
    if (data.requires_2fa_setup) {
      localStorage.setItem("temp_username", data.username);
      localStorage.setItem("temp_token", data.temp_token);
      navigate("/setup-2fa");
      return;
    }

    // 2FA verify required
    if (data.requires_2fa) {
      localStorage.setItem("temp_username", data.username);
      navigate("/verify-2fa");
      return;
    }

    // ✅ Normal login — save real token
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("auth", "true");
    navigate("/dashboard");
  };

  // ── Normal login (form submit) ────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await doLogin();
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Admin login — hits real backend, gets real token ──────────────────
  // FIX: removed hardcoded credential bypass (was storing role: "ADMIN" which
  // caused 403 on all admin API calls since backend checks for lowercase "admin")
  const handleAdminLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await doLogin();
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 h-screen">
      {/* Left Side Logo */}
      <div className="flex items-center justify-center bg-white p-6">
        <img
          src={logo}
          alt="FlexTraff_Logo"
          className="max-h-[80%] object-contain drop-shadow-lg"
        />
      </div>

      {/* Right Side Login Form */}
      <div className="flex items-center justify-center bg-gray-950">
        <form
          onSubmit={handleLogin}
          className="bg-gray-900/90 backdrop-blur-md p-10 rounded-2xl shadow-xl w-96 border border-gray-700"
        >
          <h1 className="text-3xl font-bold text-yellow-400 mb-8 text-center tracking-wide">
            FlexTraff Login
          </h1>

          {/* Username */}
          <div className="mb-5">
            <label className="block text-sm text-gray-300 mb-2">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          {/* Error */}
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          {/* Normal Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg shadow-md transition duration-200 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700" />
            <span className="mx-3 text-xs text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-700" />
          </div>

          {/* Admin Login — hits real backend */}
          <button
            type="button"
            onClick={handleAdminLogin}
            disabled={loading}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg shadow-md transition duration-200 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Admin Login"}
          </button>

          <p className="text-xs text-gray-500 text-center mt-6">
            🚦 Authorized access only
          </p>
        </form>
      </div>
    </div>
  );
}