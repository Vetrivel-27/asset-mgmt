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

const SIDEBAR_W = 272;

const ADMIN_NAV_ITEMS = [
  { to: "/dashboard", end: true, label: "Dashboard", permission: "view_dashboard" },
  { to: "/dashboard/assets", label: "Assets", permission: "manage_asset" },
  { to: "/dashboard/employees", label: "Employees", permission: "view_users" },
  { to: "/dashboard/requests", label: "Requests", permission: "approve_borrow" },
  { to: "/dashboard/assignments", label: "Assignments", permission: "assign_asset" },
  { to: "/dashboard/reports", label: "Reports", permission: ["view_report", "manage_maintenance"] },
  { to: "/dashboard/roles", label: "Roles", permission: "manage_roles" },
];

const EMPLOYEE_NAV_ITEMS = [
  { to: "/dashboard/my-assets", label: "Assets", permission: "view_asset", employeeOnly: true },
  { to: "/dashboard/status", label: "Status", permission: "return_asset", employeeOnly: true },
  { to: "/dashboard/requests", label: "Requests", permission: "approve_borrow" },
  { to: "/dashboard/assignments", label: "Assignments", permission: "assign_asset" },
  { to: "/dashboard/report", label: "Report Damage", permission: "report_damage", employeeOnly: true },
  { to: "/dashboard/reports", label: "Reports", permission: ["view_report", "manage_maintenance"] },
  { to: "/dashboard/history", label: "History", permission: "view_asset", employeeOnly: true },
  
  // Fallbacks if a non-admin role is granted other admin-level permissions
  { to: "/dashboard", end: true, label: "Dashboard", permission: "view_dashboard" },
  { to: "/dashboard/assets", label: "Asset Mgmt", permission: "manage_asset" },
  { to: "/dashboard/employees", label: "Employees", permission: "view_users" },
  { to: "/dashboard/roles", label: "Roles", permission: "manage_roles" },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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

  const adminUser = isAdmin();

  // Dynamically filter nav items based on permissions
  const navItems = useMemo(() => {
    const sourceArray = adminUser ? ADMIN_NAV_ITEMS : EMPLOYEE_NAV_ITEMS;

    return sourceArray.filter((item) => {
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
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map(({ to, end, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                     ${isActive
                       ? "bg-yellow-400 text-slate-900"
                       : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <button
              onClick={() => {
                sessionStorage.clear();
                navigate("/login", { replace: true });
              }}
              className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Top bar */}
          <header className="flex flex-shrink-0 items-center gap-4 bg-white px-6 py-4 shadow-sm">
            <button
              onClick={() => setOpen(prev => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-slate-100"
              aria-label="Toggle sidebar"
            >
              <HamburgerIcon open={open} />
            </button>

            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {adminUser ? "Admin Panel" : "Employee Portal"}
              </p>
              <h1 className="text-lg font-semibold leading-tight text-slate-900">
                {profile.name}
              </h1>
            </div>

            {/* Avatar pill with dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition hover:bg-slate-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white">
                  {initials || "U"}
                </div>
                <span className="hidden text-xs font-medium capitalize text-slate-700 sm:block">
                  {profile.name}
                </span>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <button
                    onClick={() => {
                      sessionStorage.clear();
                      navigate("/login", { replace: true });
                    }}
                    className="flex w-full items-center rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    Logout
                  </button>
                </div>
              )}
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
