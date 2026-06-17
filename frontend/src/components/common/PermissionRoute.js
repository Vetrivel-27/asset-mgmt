import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Route guard that checks user permissions before rendering child routes.
 * Supports both single permission string and array of permissions (any match).
 *
 * @param {{ permission: string|string[], redirectPath?: string }} props
 */
function PermissionRoute({ permission, redirectPath = "/dashboard" }) {
  const { hasPermission, hasAnyPermission, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const hasAccess = Array.isArray(permission) 
    ? hasAnyPermission(permission) 
    : hasPermission(permission);

  if (!hasAccess) {
    // Avoid infinite redirect loop if we're already at the fallback
    if (location.pathname === redirectPath) {
      return null;
    }
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}

export default PermissionRoute;
