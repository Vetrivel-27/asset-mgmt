import { useEffect, useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import { canAccess, canAccessAny, isAdmin } from "../permissions";

/* Animated hamburger icon */
function HamburgerIcon({ open }) {
  const bar = "block h-[2px] w-5 rounded-full bg-slate-800 transition-all duration-300 ease-in-out";
  return (
    <span className="flex h-9 w-9 flex-col items-center justify-center gap-[5px]">
      <span className={bar} style={{ transform: open ? "translateY(7px) rotate(45deg)" : "none" }} />
      <span className={bar} style={{ opacity: open ? 0 : 1, transform: open ? "scaleX(0)" : "scaleX(1)" }} />
      <span className={bar} style={{ transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }} />
    </span>
  );
}

// Central helper registry of lightweight, brand-consistent outline icons
function SidebarIcon({ name, className = "h-5 w-5" }) {
  const icons = {
    dashboard: (
      <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zM14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zM14 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6z" />
    ),
    assets: (
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" />
    ),
    employees: (
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
    ),
    requests: (
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 M9 14l2 2 4-4" />
    ),
    assignments: (
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    ),
    reports: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8M16 17H8M10 9H8" />
    ),
    roles: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
    status: (
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    ),
    damage: (
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
    ),
    history: (
      <path d="M12 8v4l3 3 M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5" />
    )
  };

  const path = icons[name] || <path d="M12 2v20M2 12h20" />;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {path}
    </svg>
  );
}

const SIDEBAR_W = 272;

const ALL_NAV_ITEMS = [
  { to: "/dashboard", end: true, label: "Dashboard", permission: "view_dashboard", icon: "dashboard" },
  { to: "/dashboard/assets", label: "Assets", permission: "manage_asset", icon: "assets" },
  { to: "/dashboard/my-assets", label: "Assets", permission: "view_asset", employeeOnly: true, icon: "assets" },
  { to: "/dashboard/employees", label: "Users", permission: "view_users", icon: "employees" },
  { to: "/dashboard/assignments", label: "Assignments", permission: "view_assignments", icon: "assignments" },
  { to: "/dashboard/status", label: "Status", permission: "return_asset", employeeOnly: true, icon: "status" },
  { to: "/dashboard/requests", label: "Requests", permission: "approve_borrow", icon: "requests" },
  { to: "/dashboard/reports", label: "Reports", permission: ["view_report", "manage_maintenance"], icon: "reports" },
  { to: "/dashboard/report", label: "Report Damage", permission: "report_damage", employeeOnly: true, icon: "damage" },
  { to: "/dashboard/roles", label: "Roles", permission: "manage_roles", icon: "roles" },
  { to: "/dashboard/history", label: "History", permission: "view_asset", employeeOnly: true, icon: "history" },
];


function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [profile, setProfile] = useState({
    name: sessionStorage.getItem("userName") || "User",
    role: sessionStorage.getItem("userRole") || "",
  });
  const [permissions, setPermissions] = useState(() => {
    try {
      const p = sessionStorage.getItem("userPermissions");
      return p ? JSON.parse(p) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let mounted = true;
    const token = sessionStorage.getItem("authToken");

    async function loadProfile() {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/employees/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (mounted && res.ok) {
          const name = data.name || data.userId?.displayName || data.userId?.email || "User";
          const role = data.userId?.role?.name || sessionStorage.getItem("userRole") || "";
          const permissionNames = data.userId?.role?.permissions?.map(p => p.name) || [];

          setProfile({ name, role });
          if (permissionNames.length > 0) {
            setPermissions(permissionNames);
            sessionStorage.setItem("userPermissions", JSON.stringify(permissionNames));
          }
          sessionStorage.setItem("userName", name);
          sessionStorage.setItem("userRole", role.toLowerCase());
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
      }
    }

    loadProfile();
    return () => { mounted = false; };
  }, []);

  // Fetch pending requests count for the badge
  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    if (!token || !canAccess("approve_borrow")) return;

    let mounted = true;
    async function fetchRequestsCount() {
      try {
        const res = await fetch(`${API_URL}/api/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (mounted && res.ok && Array.isArray(data)) {
          const count = data.filter(r => r.status === "pending").length;
          setPendingRequestsCount(count);
        }
      } catch (err) {
        console.error("Failed to load requests count", err);
      }
    }
    fetchRequestsCount();
    
    // Refresh count periodically (every 30 seconds)
    const intervalId = setInterval(fetchRequestsCount, 30000);

    window.addEventListener("request_status_changed", fetchRequestsCount);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener("request_status_changed", fetchRequestsCount);
    };
  }, [location.pathname]); // Re-fetch when navigating to keep it up to date

  const adminUser = isAdmin();

  // Dynamically filter nav items based on permissions
  const navItems = useMemo(() => {
    const filtered = ALL_NAV_ITEMS.filter((item) => {
      // Hide employee-specific items from core admin
      if (adminUser && item.employeeOnly) return false;

      // Hide employee Assets tab if they have manage_asset permission (to avoid duplicates)
      if (item.to === "/dashboard/my-assets" && canAccess("manage_asset")) {
        return false;
      }

      // Normal permission check
      if (Array.isArray(item.permission)) {
        return canAccessAny(item.permission);
      }
      return canAccess(item.permission);
    });

    // Move Dashboard item to the first row if present
    const dashboardIndex = filtered.findIndex((item) => item.to === "/dashboard" && item.end);
    if (dashboardIndex > 0) {
      const [dashboardItem] = filtered.splice(dashboardIndex, 1);
      filtered.unshift(dashboardItem);
    }

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUser, permissions]);

  // If user hits the base `/dashboard` but doesn't have `view_dashboard`, redirect them
  useEffect(() => {
    if (location.pathname === "/dashboard" && !canAccess("view_dashboard")) {
      const firstPermitted = navItems.find(item => item.to !== "/dashboard");
      if (firstPermitted) {
        navigate(firstPermitted.to, { replace: true });
      } else {
        // Fallback if no permissions at all (very rare)
        navigate("/login", { replace: true });
      }
    }
  }, [location.pathname, navItems, navigate]);

  const initials = profile.name
    .split(" ")
    .map(p => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div
        className="flex h-full"
        style={{ transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >

        {/* Sidebar */}
        <aside
          style={{
            width: open ? SIDEBAR_W : 0,
            minWidth: open ? SIDEBAR_W : 0,
            opacity: open ? 1 : 0,
            transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1), min-width 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease",
            overflow: "hidden",
          }}
          className="flex-shrink-0 border-r border-slate-200 bg-white"
        >
          {/* Inner wrapper keeps content at full width so it doesn't squash */}
          <div
            style={{ width: SIDEBAR_W }}
            className="flex h-full flex-col px-5 py-6"
          >
            {/* Profile */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-sm font-bold text-white">
                {initials || "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{profile.name}</p>
                <p className="truncate text-xs capitalize text-slate-400">{profile.role || "user"}</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 overflow-y-auto border-b">
              {navItems.map(({ to, end, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors border-b whitespace-nowrap
                     ${isActive
                       ? "bg-yellow-400 text-slate-900"
                       : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                  }
                >
                  <div className="flex items-center gap-3">
                    <SidebarIcon name={icon} className="h-5 w-5 opacity-80" />
                    <span>{label}</span>
                  </div>
                  {to === "/dashboard/requests" && pendingRequestsCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                      {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Profile */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                sessionStorage.clear();
                navigate("/login", { replace: true });
              }}
              className="mt-2 w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Top bar */}
          <header className="flex flex-shrink-0 items-center gap-4 bg-yellow-400 px-6 py-4 shadow-sm">
            <button
              onClick={() => setOpen(prev => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-yellow-500"
              aria-label="Toggle sidebar"
            >
              <HamburgerIcon open={open} />
            </button>

            <div className="flex-1 flex items-center">
              <img 
                src="/ESAB.png" 
                alt="ESAB Logo" 
                className="h-9 w-auto object-contain select-none filter drop-shadow-sm" 
              />
            </div>

            {/* User Role Tile */}
            {profile.role && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-white/20 bg-white/20 backdrop-blur-md text-xs font-semibold text-slate-800 capitalize shrink-0 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                <span>{profile.role}</span>
              </div>
            )}

            {/* Avatar pill with dropdown */}
            <div className="relative min-w-[140px]">
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition hover:bg-slate-100 justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white shrink-0">
                    {initials || "U"}
                  </div>
                  <span className="hidden text-xs font-medium capitalize text-slate-700 sm:block truncate max-w-[80px]">
                    {profile.name}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div 
                className={`absolute right-0 mt-2 w-full origin-top rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 transition-all duration-200 ease-out ${
                  profileDropdownOpen 
                    ? "opacity-100 translate-y-0 pointer-events-auto scale-100" 
                    : "opacity-0 -translate-y-2 pointer-events-none scale-95"
                }`}
              >
                <button
                  onClick={async () => {
                    try {
                      await fetch(`${API_URL}/api/auth/logout`, {
                        method: 'POST',
                        credentials: 'include'
                      });
                    } catch (e) {
                      console.error("Logout failed", e);
                    }
                    sessionStorage.clear();
                    navigate("/login", { replace: true });
                  }}
                  className="flex w-full items-center justify-center rounded-xl py-2 text-sm font-bold bg-yellow-400 text-slate-900 transition hover:bg-yellow-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Page */}
          <main className="flex-1 overflow-y-auto p-6 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={(newProfile) => {
          setProfile(newProfile);
          sessionStorage.setItem("userName", newProfile.name);
        }}
      />
    </div>
  );
}

function ProfileModal({ isOpen, onClose, onUpdate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
    
    const token = sessionStorage.getItem("authToken");
    fetch(`${API_URL}/api/employees/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setName(data.name || data.userId?.displayName || "");
        setDepartment(data.department || "");
        setEmployeeId(data.employeeId || "");
        if (data.userId) {
          setEmail(data.userId.email || "");
          setRole(data.userId.role?.name || "");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load profile details.");
      });
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const body = { name, email, department };
      if (password) body.password = password;

      const res = await fetch(`${API_URL}/api/employees/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      setSuccess("Profile updated successfully!");
      onUpdate({
        name: data.name || data.userId?.displayName || "User",
        role: data.userId?.role?.name || "",
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div 
        className="w-full max-w-md rounded-[32px] bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">User Profile</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-600">
              {success}
            </div>
          )}

          {/* Employee ID & Role (Read-only) */}
          <div className={`grid gap-3 ${employeeId ? "grid-cols-2" : "grid-cols-1"}`}>
            {employeeId && (
              <div>
                <label className="text-xs font-semibold text-slate-500">Employee ID</label>
                <div className="mt-1.5 w-full rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200">
                  {employeeId}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500">Role</label>
              <div className="mt-1.5 w-full rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 capitalize border border-slate-200">
                {role || "—"}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-500">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-semibold text-slate-500">Department</label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
            />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Change Password (Optional)</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Min 6 characters"
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Repeat new password"
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500 shadow-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DashboardLayout;
