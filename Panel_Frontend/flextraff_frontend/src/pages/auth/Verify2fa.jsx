import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8001"
  : "https://flextraff-backend-production-186c.up.railway.app";

export default function Verify2FA() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const username = localStorage.getItem("temp_username");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/auth/2fa/login?username=${username}&code=${otp}`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Invalid OTP");
      }

      // ✅ Save session
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("auth", "true");

      localStorage.removeItem("temp_username");

      navigate("/dashboard");

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <form
        onSubmit={handleVerify}
        className="bg-gray-900 p-8 rounded-xl"
      >
        <h2 className="text-white mb-4">Enter OTP</h2>

        <input
          type="text"
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="p-2 mb-3 w-full"
        />

        {error && <p className="text-red-400">{error}</p>}

        <button className="bg-yellow-500 p-2 w-full">
          Verify
        </button>
      </form>
    </div>
  );
}