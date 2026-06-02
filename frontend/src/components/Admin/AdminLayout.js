import { NavLink, Outlet, useNavigate } from "react-router-dom";

function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r-4 border-slate-350 bg-white px-5 py-6 flex flex-col">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center text-white font-semibold">
                AU
              </div>

              <div>
                <div className="text-base font-semibold text-slate-900">
                  Admin User
                </div>
                <p className="text-xs text-slate-500">Administrator</p>
                <p className="text-xs text-slate-400">admin@gmail.com</p>
              </div>
            </div>
            <nav className="space-y-2">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-yellow-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/assets"
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-yellow-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                Assets
              </NavLink>
              <NavLink
                to="/admin/employees"
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-yellow-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                Employees
              </NavLink>
              <NavLink
                to="/admin/assignments"
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-yellow-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                Assignments
              </NavLink>
              <NavLink
                to="/admin/reports"
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-yellow-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                Reports
              </NavLink>
            </nav>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 mt-auto w-max flex justify-center items-center"
          >
            Logout
          </button>
        </aside>
        <main className="flex-1 p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Admin Panel</h1>
              <p className="text-slate-500">
                Manage assets, employees, assignments, and reports.
              </p>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
