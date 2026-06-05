import { Navigate, Outlet } from "react-router-dom";
import { canAccess, canAccessAny } from "../permissions";

function PermissionRoute({ permission, redirectPath = "/dashboard" }) {
  const hasAccess = Array.isArray(permission) 
    ? canAccessAny(permission) 
    : canAccess(permission);

  if (!hasAccess) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}

export default PermissionRoute;
