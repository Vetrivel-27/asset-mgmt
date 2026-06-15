import { useEffect, useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import { canAccess, canAccessAny, isAdmin } from "../permissions";

/* ─── Animated hamburger icon ───────────────────────────────────────────────── */
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
  { to: "/dashboard/employees", label: "Employees", permission: "view_users", icon: "employees" },
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
          const name = data.name || data.userId?.userId || "User";
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

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
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

            {/* Logout */}
            <button
              onClick={() => {
                sessionStorage.clear();
                navigate("/login", { replace: true });
              }}
              className="mt-4 w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
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

            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-black">
                {adminUser ? "Admin Panel" : "Employee Portal"}
              </p>
              <h1 className="text-lg font-semibold leading-tight text-slate-900">
                {profile.name}
              </h1>
            </div>

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
                  onClick={() => {
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
    </div>
  );
}

export default DashboardLayout;
