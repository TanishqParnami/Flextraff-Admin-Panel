import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"; // 👈 Added Navigate here
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Controls from "./pages/traffic/controls";
import { ThemeProvider, ThemeContext } from "./context/ThemeContext";
import TrafficData from "./pages/dashboard/Traffic_data";
import Logs from "./pages/traffic/logs";
import Scanners from "./pages/traffic/Scanners";
import { useContext } from "react";
import Verify2FA from "./pages/auth/Verify2fa";
import Setup2FA from "./pages/auth/setup2FA";
import CreateUser from "./pages/users/CreateUser";
import { AdminRoute } from "./components/auth/ProtectedRoute";
import Users from "./pages/users/Users";
import UserDetail from "./pages/users/UserDetail";
import Junctions from "./pages/traffic/Junctions";

function AppRoutes() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <Router>
      <Routes>
        {/* 👇 FIX: Handles the root "/" path. If a user loads your site, it forces them to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/controls"
          element={
            <ProtectedRoute>
              <Controls darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/traffic-data"
          element={
            <ProtectedRoute>
              <TrafficData
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <Logs darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scanners"
          element={
            <ProtectedRoute>
              <Scanners darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </ProtectedRoute>
          }
        />
        <Route path="/verify-2fa" element={<Verify2FA />} />
        <Route path="/setup-2fa" element={<Setup2FA />} />
        <Route
          path="/create-user"
          element={
            <AdminRoute>
              <CreateUser darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </AdminRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Users darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </AdminRoute>
          }
        />
        <Route
          path="/users/:user_id"
          element={
            <AdminRoute>
              <UserDetail darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </AdminRoute>
          }
        />
        <Route
          path="/junctions"
          element={
            <AdminRoute>
              <Junctions darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </AdminRoute>
          }
        />

        {/* 💡 OPTIONAL BONUS CATCH-ALL: Handles any typos or invalid URLs */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
