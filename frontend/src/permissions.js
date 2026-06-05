export const getPermissions = () => {
  try {
    const perms = sessionStorage.getItem("userPermissions");
    return perms ? JSON.parse(perms) : [];
  } catch (e) {
    return [];
  }
};

export const isAdmin = () => {
  return sessionStorage.getItem("userRole") === "admin";
};

export const hasPermission = (permission) => {
  if (isAdmin()) return true;
  const perms = getPermissions();
  return perms.includes(permission);
};

export const hasAnyPermission = (permissions) => {
  if (isAdmin()) return true;
  if (!permissions || permissions.length === 0) return true;
  const perms = getPermissions();
  return permissions.some((p) => perms.includes(p));
};

export const canAccess = (permission) => {
  if (isAdmin()) return true;
  if (!permission) return true;
  return hasPermission(permission);
};

export const canAccessAny = (permissions) => {
  if (isAdmin()) return true;
  if (!permissions || permissions.length === 0) return true;
  return hasAnyPermission(permissions);
};
