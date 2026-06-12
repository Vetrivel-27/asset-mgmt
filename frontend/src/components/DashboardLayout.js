import { useEffect, useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import { canAccess, canAccessAny, isAdmin } from "../permissions";

/* ─── Animated hamburger icon ───────────────────────────────────────────────── */
function HamburgerIcon({ open }) {
  const bar = "block h-[2px] w-5 rounded-full bg-slate-700 transition-all duration-300 ease-in-out";
  return (
    <span className="flex h-9 w-9 flex-col items-center justify-center gap-[5px]">
      <span className={bar} style={{ transform: open ? "translateY(7px) rotate(45deg)" : "none" }} />
      <span className={bar} style={{ opacity: open ? 0 : 1, transform: open ? "scaleX(0)" : "scaleX(1)" }} />
      <span className={bar} style={{ transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }} />
    </span>
  );
}

const SIDEBAR_W = 272;

const MASTER_NAV_ITEMS = [
  { to: "/dashboard", end: true, label: "Dashboard", permission: "view_dashboard" },
  { to: "/dashboard/assets", label: "Assets", permission: "view_asset" },
  { to: "/dashboard/employees", label: "Employees", permission: "view_users" },
  { to: "/dashboard/assignments", label: "Assignments", permission: "assign_asset" },
  { to: "/dashboard/status", label: "Status", permission: "return_asset", employeeOnly: true },
  { to: "/dashboard/requests", label: "Requests", permission: "approve_borrow" },
  { to: "/dashboard/reports", label: "Reports", permission: ["view_report", "manage_maintenance"] },
  { to: "/dashboard/report", label: "Report Damage", permission: "report_damage", employeeOnly: true },
  { to: "/dashboard/roles", label: "Roles", permission: "manage_roles" },
  { to: "/dashboard/history", label: "History", permission: "view_asset", employeeOnly: true },
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
          setProfile({ name, role });
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
    return MASTER_NAV_ITEMS.filter((item) => {
      // Hide employee-specific items from admin
      if (adminUser && item.employeeOnly) return false;

      // Normal permission check
      if (Array.isArray(item.permission)) {
        return canAccessAny(item.permission);
      }
      return canAccess(item.permission);
    });
  }, [adminUser]);

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
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div
        className="flex h-full"
        style={{ transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside
          className="flex-shrink-0"
          style={{
            width: open ? SIDEBAR_W : 0,
            minWidth: open ? SIDEBAR_W : 0,
            opacity: open ? 1 : 0,
            transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1), min-width 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease",
            overflow: "hidden",
            background: "#ffffff",
            borderRight: "1px solid #e2e8f0",
          }}
        >
          <div style={{ width: SIDEBAR_W }} className="flex h-full flex-col">

            {/* ── Brand header ── */}
            <div className="px-6 pt-7 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 shadow-lg shadow-yellow-400/30">
                  <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 tracking-wide">AMS</p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{adminUser ? "Admin Panel" : "Employee Portal"}</p>
                </div>
              </div>
            </div>

            {/* ── Nav ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {navItems.map(({ to, end, label }, idx) => {
                const icons = {
                  "Dashboard": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  ),
                  "Assets": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
                    </svg>
                  ),
                  "Asset Mgmt": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                    </svg>
                  ),
                  "Employees": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                  ),
                  "Requests": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  ),
                  "Assignments": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                  ),
                  "Reports": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  ),
                  "Roles": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  ),
                  "Status": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  ),
                  "Report Damage": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                  ),
                  "History": (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  ),
                };
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => {}}
                    style={{ animationDelay: `${idx * 55}ms` }}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap animate-slide-left
                       ${isActive
                         ? "bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/25"
                         : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                    }
                    style={({ isActive }) => isActive ? {} : {}}
                  >
                    {({ isActive }) => (
                      <>
                        {!isActive && (
                          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        )}
                        <div className="flex items-center gap-3 relative">
                          <span className={`transition-colors duration-200 ${isActive ? "text-slate-900" : "text-slate-500 group-hover:text-yellow-400"}`}>
                            {icons[label] || (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="4"/>
                              </svg>
                            )}
                          </span>
                          <span>{label}</span>
                        </div>
                        {to === "/dashboard/requests" && pendingRequestsCount > 0 && (
                          <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-sm ${isActive ? "bg-slate-900 text-yellow-400" : "bg-red-500 text-white"}`}>
                            {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* ── Profile + Logout ── */}
            <div className="px-3 pb-5 pt-4 border-t border-slate-200">
              <div className="mb-3 flex items-center gap-3 px-1">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-xs font-bold text-slate-900 shadow-md shadow-yellow-400/20">
                  {initials || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{profile.name}</p>
                  <p className="truncate text-[11px] capitalize text-slate-500">{profile.role || "user"}</p>
                </div>
              </div>
              <button
                onClick={() => { sessionStorage.clear(); navigate("/login", { replace: true }); }}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Top bar */}
          <header className="flex flex-shrink-0 items-center gap-4 bg-white border-b border-slate-200/80 px-6 py-3.5 shadow-sm">
            <button
              onClick={() => setOpen(prev => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Toggle sidebar"
            >
              <HamburgerIcon open={open} />
            </button>

            {/* Brand pill when sidebar is closed */}
            {!open && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400">
                  <svg className="w-3.5 h-3.5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-800 tracking-wide">AMS</span>
              </div>
            )}

            <div className="flex-1" />

            {/* Role badge */}
            <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {adminUser ? "Admin" : "Employee"}
            </span>

            {/* Avatar pill with dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition hover:bg-slate-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 text-xs font-bold text-slate-900 shrink-0">
                  {initials || "U"}
                </div>
                <span className="hidden text-xs font-semibold text-slate-700 sm:block max-w-[90px] truncate">
                  {profile.name}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              <div
                className={`absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 transition-all duration-200 ease-out ${
                  profileDropdownOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto scale-100"
                    : "opacity-0 -translate-y-2 pointer-events-none scale-95"
                }`}
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{profile.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">{profile.role || "user"}</p>
                </div>
                <button
                  onClick={() => { sessionStorage.clear(); navigate("/login", { replace: true }); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          {/* Page — keyed on location so each route change triggers the entrance animation */}
          <main className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-8">
            <div key={location.key} className="animate-page-enter h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;


