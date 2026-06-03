import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute
 * - requiredRole: "admin" | "employee"
 *   "employee" means: any authenticated non-admin role (manager, staff, etc.)
 *
 * Redirects to /login if no token.
 * Redirects to the correct dashboard if the user's role doesn't match the section.
 */
function ProtectedRoute({ requiredRole }) {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole"); // e.g. "admin", "manager", "employee"

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = role === "admin";

  // Admin trying to access /employee section → go to /admin
  if (requiredRole === "employee" && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Non-admin trying to access /admin section → go to /employee
  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/employee" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

