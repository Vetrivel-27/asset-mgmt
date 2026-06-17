import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      setPermissions([]);
      return;
    }

    try {
      const data = await authService.getProfile();
      
      const name = data.name || data.userId?.displayName || data.userId?.email || "User";
      const role = data.userId?.role?.name || sessionStorage.getItem("userRole") || "";
      const permissionNames = data.userId?.role?.permissions?.map(p => p.name) || [];

      setUser({ name, role, email: data.userId?.email, department: data.department });
      setPermissions(permissionNames);
      setIsAuthenticated(true);
      
      // Update sessionStorage as a fallback if needed
      sessionStorage.setItem("userPermissions", JSON.stringify(permissionNames));
      sessionStorage.setItem("userName", name);
      sessionStorage.setItem("userRole", role.toLowerCase());
    } catch (err) {
      console.error("Auth check failed:", err);
      // Don't auto-logout on network error, but if 401/403, clear session
      if (err.message && err.message.includes("Token")) {
        sessionStorage.clear();
        setIsAuthenticated(false);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    sessionStorage.setItem("authToken", data.token);
    if (data.user) {
      sessionStorage.setItem("userRole", (data.user.roleName || "").toLowerCase());
      sessionStorage.setItem("userName", data.user.displayName || data.user.email);
      const perms = data.user.permissions || [];
      sessionStorage.setItem("userPermissions", JSON.stringify(perms));
    }
    await checkAuth();
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permsArray) => {
    return permsArray.some((p) => permissions.includes(p));
  };

  const value = {
    user,
    permissions,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
