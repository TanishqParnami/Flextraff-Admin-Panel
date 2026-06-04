import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuth = localStorage.getItem("auth");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // not logged in
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // corrupted/missing user data
  if (!currentUser?.role) {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const isAuth = localStorage.getItem("auth");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // not logged in
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // missing user object after logout
  if (!currentUser?.role) {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  // not admin
  if (currentUser.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
