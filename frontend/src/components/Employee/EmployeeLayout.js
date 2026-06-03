import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { API_URL } from "../../config";

function EmployeeLayout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: localStorage.getItem("userName") || "Employee",
    role: localStorage.getItem("userRole") || "",
  });

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("authToken");

    async function loadProfile() {
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/employees/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (mounted && res.ok) {
          const name = data.name || "Employee";
          const role = data.userId?.role?.name || localStorage.getItem("userRole") || "";
          setProfile({ name, role });
          localStorage.setItem("userName", name);
          localStorage.setItem("userRole", role);
        }
      } catch (error) {
        console.error("Failed to load employee profile", error);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 border-4 border-slate-200 bg-white px-5 py-6 flex flex-col">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center text-white font-semibold">
                {initials || "EM"}
              </div>

              <div>
                <div className="text-base font-semibold text-slate-900">
                  {profile.name}
                </div>
                <p className="text-xs capitalize text-slate-500">
                  {profile.role || "employee"}
                </p>
              </div>
            </div>
            <nav className="space-y-2">
              <NavLink
                to="/employee"
                end
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-yellow-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                Assets
              </NavLink>
              <NavLink
                to="/employee/status"
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-yellow-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                Status
              </NavLink>
              <NavLink
                to="/employee/report"
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-yellow-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                Report
              </NavLink>
              <NavLink
                to="/employee/history"
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-yellow-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                History
              </NavLink>
            </nav>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("authToken");
              localStorage.removeItem("userRole");
              localStorage.removeItem("userEmail");
              localStorage.removeItem("employeeEmail");
              localStorage.removeItem("userName");
              navigate("/login", { replace: true });
            }}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 mt-auto w-max flex justify-center items-center"
          >
            Logout
          </button>
        </aside>
        <main className="flex-1 py-8 pl-8 pr-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default EmployeeLayout;
