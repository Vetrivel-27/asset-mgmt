import { Navigate, Outlet } from "react-router-dom";

/**
 * PublicRoute
 * Only accessible when NOT logged in.
 * If the user already has a valid token, redirect them to their dashboard.
 * This prevents back-navigation to /login after a successful login.
 */
function PublicRoute() {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");

  if (token) {
    const isAdmin = role === "admin";
    const home = isAdmin ? "/admin" : "/employee";
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
