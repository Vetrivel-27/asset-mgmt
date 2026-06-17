import { useAuth } from "../../context/AuthContext";

/**
 * Conditionally renders children if the user has the required permission.
 * If 'permission' is an array, renders if the user has ANY of them.
 *
 * @param {{ permission: string|string[], children: React.ReactNode, fallback?: React.ReactNode }} props
 */
function CanAccess({ permission, children, fallback = null }) {
  const { hasPermission, hasAnyPermission, loading } = useAuth();

  if (loading) return null;

  if (Array.isArray(permission)) {
    return hasAnyPermission(permission) ? children : fallback;
  }
  return hasPermission(permission) ? children : fallback;
}

export default CanAccess;
