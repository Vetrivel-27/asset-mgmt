import { useEffect, useState } from "react";
import { API_URL } from "../../config";

function AdminDashboard() {
  const [stats, setStats] = useState({
    assets: 0,
    employees: 0,
    activeAssignments: 0,
    pendingReturns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const assetsRes = await fetch(`${API_URL}/api/assets`);
        const employeesRes = await fetch(`${API_URL}/api/employees`);
        const assignmentsRes = await fetch(`${API_URL}/api/assignments`);

        const assets = await assetsRes.json();
        const employees = await employeesRes.json();
        const assignments = await assignmentsRes.json();

        setStats({
          assets: assets.length,
          employees: employees.length,
          activeAssignments: assignments.filter((a) => !a.returned).length,
          pendingReturns: assignments.filter((a) => a.needsReturn).length,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading)
    return (
      <div className="rounded-3xl bg-white p-8 shadow">
        Loading dashboard...
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Assets", value: stats.assets },
          { label: "Employees", value: stats.employees },
          { label: "Active Assignments", value: stats.activeAssignments },
          { label: "Pending Returns", value: stats.pendingReturns },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Recent Activity
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            Latest asset assignments, returns, and updates.
          </p>
          {/* Add a smaller activity feed component here */}
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Quick actions
          </h2>
          <div className="mt-5 space-y-3">
            <button className="w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-slate-900">
              Add new asset
            </button>
            <button className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
              Register employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
