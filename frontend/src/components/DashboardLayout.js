import { useEffect, useState, useMemo } from "react";
import { requestService } from "../services/requestService";
import { REQUEST_STATUS } from "../constants/assetStatus";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HamburgerIcon, SidebarIcon } from "./layout/LayoutIcons";
import ProfileModal from "./layout/ProfileModal";


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
  const { user, hasPermission, hasAnyPermission, logout, checkAuth } = useAuth();

  const [open, setOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const profile = {
    name: user?.name || "User",
    role: user?.role || "",
  };

  // Fetch pending requests count for the badge
  useEffect(() => {
    if (!hasPermission("approve_borrow")) return;

    let mounted = true;
    async function fetchRequestsCount() {
      try {
        const data = await requestService.getAll();
        if (mounted && Array.isArray(data)) {
          const count = data.filter(r => r.status === REQUEST_STATUS.PENDING).length;
          setPendingRequestsCount(count);
        }
      } catch (err) {
        console.error("Failed to load requests count", err);
      }
    }
    fetchRequestsCount();
    
    // Refresh count periodically (every 30 seconds)
    const intervalId = setInterval(fetchRequestsCount, 2000);

    window.addEventListener("request_status_changed", fetchRequestsCount);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener("request_status_changed", fetchRequestsCount);
    };
  }, [location.pathname, hasPermission]); // Re-fetch when navigating to keep it up to date

  const adminUser = user?.role === "admin";

  // Dynamically filter nav items based on permissions
  const navItems = useMemo(() => {
    const filtered = ALL_NAV_ITEMS.filter((item) => {
      // Hide employee-specific items from core admin
      if (adminUser && item.employeeOnly) return false;

      // Hide employee Assets tab if they have manage_asset permission (to avoid duplicates)
      if (item.to === "/dashboard/my-assets" && hasPermission("manage_asset")) {
        return false;
      }

      // Normal permission check
      if (Array.isArray(item.permission)) {
        return hasAnyPermission(item.permission);
      }
      return hasPermission(item.permission);
    });

    // Move Dashboard item to the first row if present
    const dashboardIndex = filtered.findIndex((item) => item.to === "/dashboard" && item.end);
    if (dashboardIndex > 0) {
      const [dashboardItem] = filtered.splice(dashboardIndex, 1);
      filtered.unshift(dashboardItem);
    }

    return filtered;
  }, [adminUser, hasPermission, hasAnyPermission]);

  // If user hits the base `/dashboard` but doesn't have `view_dashboard`, redirect them
  useEffect(() => {
    if (location.pathname === "/dashboard" && !hasPermission("view_dashboard")) {
      const firstPermitted = navItems.find(item => item.to !== "/dashboard");
      if (firstPermitted) {
        navigate(firstPermitted.to, { replace: true });
      } else {
        // Stop infinite loop: do not redirect to /login if already authenticated, just stay here.
        // User will see "Access Denied" or empty dashboard.
      }
    }
  }, [location.pathname, navItems, navigate, hasPermission]);

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
              onClick={async () => {
                await logout();
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
                    await logout();
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
        onUpdate={() => {
          checkAuth();
        }}
      />
    </div>
  );
}


export default DashboardLayout;
