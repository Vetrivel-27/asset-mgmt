import { NavLink, Outlet, useNavigate } from "react-router-dom";

function EmployeeLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 border-4 border-slate-200 bg-white px-5 py-6 flex flex-col">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center text-white font-semibold">
                EM
              </div>

              <div>
                <div className="text-base font-semibold text-slate-900">
                  Employee
                </div>
                <p className="text-xs text-slate-500">user@gmail.com</p>
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
            onClick={() => navigate("/login")}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 mt-auto w-max flex justify-center items-center"
          >
            Logout
          </button>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default EmployeeLayout;
