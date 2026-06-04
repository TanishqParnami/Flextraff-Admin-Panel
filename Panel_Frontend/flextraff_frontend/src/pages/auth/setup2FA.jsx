import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 


const API_URL = import.meta.env.DEV
  ? "http://localhost:8001"
  : "https://flextraff-backend-production-186c.up.railway.app";

export default function Setup2FA() {
  const [qrCode, setQrCode] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const token = localStorage.getItem("temp_token");

  // =========================================
  // GET QR CODE
  // =========================================
  useEffect(() => {
    fetch(`${API_URL}/auth/2fa/setup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setQrCode(data.qr_code);
      })
      .catch(() => {
        setError("Failed to load QR Code");
      });
  }, []);

  // =========================================
  // VERIFY OTP
  // =========================================
  const verifyOTP = async () => {
    try {
      const res = await fetch(
        `${API_URL}/auth/2fa/verify?code=${otp}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Verification failed");
      }

      navigate("/verify-2fa");

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl w-[400px] border border-gray-700">

        <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
          Setup Two-Factor Authentication
        </h1>

        {qrCode && (
          <img
            src={qrCode}
            alt="QR Code"
            className="w-64 h-64 mx-auto mb-6 bg-white p-2 rounded-lg"
          />
        )}

        <p className="text-gray-300 text-sm mb-4 text-center">
          Scan QR using Google Authenticator
        </p>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 mb-4"
        />

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={verifyOTP}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg"
        >
          Verify & Enable 2FA
        </button>

      </div>
    </div>
  );
}