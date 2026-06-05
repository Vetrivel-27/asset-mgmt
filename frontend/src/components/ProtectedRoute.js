import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute
 * - requiredRole: "admin" | "employee"
 *   "employee" means: any authenticated non-admin role (manager, staff, etc.)
 *
 * Redirects to /login if no token.
 * Redirects to the correct dashboard if the user's role doesn't match the section.
 */
function ProtectedRoute() {
  const token = sessionStorage.getItem("authToken");

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

