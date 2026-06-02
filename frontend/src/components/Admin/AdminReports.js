import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

function AdminReports() {
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [assetsRes, assignmentsRes] = await Promise.all([
          fetch(`${API_URL}/api/assets`),
          fetch(`${API_URL}/api/assignments`),
        ]);
        const [assetsData, assignmentsData] = await Promise.all([
          assetsRes.json(),
          assignmentsRes.json(),
        ]);
        if (mounted) {
          setAssets(Array.isArray(assetsData) ? assetsData : []);
          setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        }
      } catch (err) {
        console.error("Failed to load reports data", err);
        if (mounted) {
          setAssets([]);
          setAssignments([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const damagedAssets = useMemo(
    () =>
      assets.filter(
        (a) => (a.status || a.condition || "").toLowerCase() === "damaged",
      ),
    [assets],
  );

  const availableAssets = useMemo(
    () => assets.filter((a) => (a.status || "").toLowerCase() === "available"),
    [assets],
  );

  const recentlyAssigned = useMemo(() => {
    return assignments
      .slice()
      .sort((a, b) => {
        const da = a.assignedAt ? new Date(a.assignedAt) : new Date(0);
        const db = b.assignedAt ? new Date(b.assignedAt) : new Date(0);
        return db - da;
      })
      .slice(0, 6);
  }, [assignments]);

  if (loading) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">
            Overview: recent assignments, damaged items, availability.
          </p>
        </div>
        <button className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900">
          Export CSV
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div
          className="p-6 bg-white rounded-xl shadow-md cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:-translate-y-2 hover:scale-105 hover:shadow-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Recently Assigned
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Latest asset assignments (top 6)
          </p>

          {recentlyAssigned.length === 0 ? (
            <div className="mt-6 text-sm text-slate-500">
              No recent assignments.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentlyAssigned.map((r) => (
                <li
                  key={r._id || r.id || `${r.assetId}-${r.assignedTo}`}
                  className="flex items-start justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {r.assetName || r.assetId || "Unknown asset"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.assignedTo || "—"} •{" "}
                      {r.assignedAt
                        ? new Date(r.assignedAt).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 rounded-full bg-slate-100 px-3 py-1">
                    {r.returned ? "Returned" : "Active"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="p-6 bg-white rounded-xl shadow-md cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:-translate-y-2 hover:scale-105 hover:shadow-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Damaged Assets
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Items flagged as damaged
          </p>

          <div className="mt-6">
            <div className="text-3xl font-semibold text-slate-900 text-red-500">
              {damagedAssets.length}
            </div>
            <p className="text-sm text-slate-500 mt-1">Total damaged assets</p>

            <div className="mt-4 space-y-2">
              {damagedAssets.slice(0, 4).map((a) => (
                <div
                  key={a._id || a.assetId}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {a.name || a.assetId}
                    </div>
                    <div className="text-xs text-slate-500">
                      {a.category || "—"}
                    </div>
                  </div>
                  <div className="text-xs text-red-600">Damaged</div>
                </div>
              ))}
              {damagedAssets.length > 4 && (
                <div className="text-xs text-slate-500">
                  +{damagedAssets.length - 4} more
                </div>
              )}
              {damagedAssets.length === 0 && (
                <div className="text-sm text-slate-500">No damaged assets.</div>
              )}
            </div>
          </div>
        </div>

        <div
          className="p-6 bg-white rounded-xl shadow-md cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:-translate-y-2 hover:scale-105 hover:shadow-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Available Assets
          </h3>
          <p className="mt-2 text-sm text-slate-500">Ready for assignment</p>

          <div className="mt-6">
            <div className="text-3xl font-semibold text-slate-900 text-green-500">
              {availableAssets.length}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Total available assets
            </p>

            <div className="mt-4 space-y-2">
              {availableAssets.slice(0, 4).map((a) => (
                <div
                  key={a._id || a.assetId}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {a.name || a.assetId}
                    </div>
                    <div className="text-xs text-slate-500">
                      {a.category || "—"}
                    </div>
                  </div>
                  <div className="text-xs text-green-600">Available</div>
                </div>
              ))}
              {availableAssets.length > 4 && (
                <div className="text-xs text-slate-500">
                  +{availableAssets.length - 4} more
                </div>
              )}
              {availableAssets.length === 0 && (
                <div className="text-sm text-slate-500">
                  No available assets.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 mt-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Quick Insights
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>
              Total assets:{" "}
              <span className="font-medium text-slate-900">
                {assets.length}
              </span>
            </li>
            <li>
              Total assignments:{" "}
              <span className="font-medium text-slate-900">
                {assignments.length}
              </span>
            </li>
            <li>
              Damaged:{" "}
              <span className="font-medium text-red-600">
                {damagedAssets.length}
              </span>
            </li>
            <li>
              Available:{" "}
              <span className="font-medium text-green-600">
                {availableAssets.length}
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Actions</h3>
          <div className="mt-4 flex flex-col gap-3">
            <button className="w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-slate-900">
              Create export
            </button>
            <button className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
              View full report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
