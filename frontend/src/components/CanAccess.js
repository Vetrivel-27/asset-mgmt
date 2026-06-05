import { canAccess, canAccessAny } from "../permissions";

/**
 * Conditionally renders children if the user has the required permission.
 * If 'permission' is an array, renders if the user has ANY of them.
 */
function CanAccess({ permission, children, fallback = null }) {
  if (Array.isArray(permission)) {
    return canAccessAny(permission) ? children : fallback;
  }
  return canAccess(permission) ? children : fallback;
}

export default CanAccess;
