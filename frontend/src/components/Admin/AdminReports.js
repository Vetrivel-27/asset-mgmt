import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../config";

function AdminReports() {
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filedReports, setFiledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllReportsModal, setShowAllReportsModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const token = sessionStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };
        const [assetsRes, assignmentsRes, reportsRes] = await Promise.all([
          fetch(`${API_URL}/api/assets`, { headers }),
          fetch(`${API_URL}/api/assignments`, { headers }),
          fetch(`${API_URL}/api/reports`, { headers }),
        ]);
        const [assetsData, assignmentsData, reportsData] = await Promise.all([
          assetsRes.json(),
          assignmentsRes.json(),
          reportsRes.json()
        ]);
        if (mounted) {
          setAssets(Array.isArray(assetsData) ? assetsData : []);
          setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
          setFiledReports(Array.isArray(reportsData) ? reportsData : []);
        }
      } catch (err) {
        console.error("Failed to load reports data", err);
        if (mounted) {
          setAssets([]);
          setAssignments([]);
          setFiledReports([]);
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
        (a) =>
          (a.status || a.condition || "").toLowerCase() === "damaged" ||
          (a.status || "").toLowerCase() === "maintenance" ||
          (a.status || "").toLowerCase() === "damage" ||
          (a.status || "").toLowerCase() === "repair",
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
        const da = a.assignedDate ? new Date(a.assignedDate) : new Date(0);
        const db = b.assignedDate ? new Date(b.assignedDate) : new Date(0);
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
            Latest asset assignments
          </p>

          {recentlyAssigned.length === 0 ? (
            <div className="mt-6 text-sm text-slate-500">
              No recent assignments.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentlyAssigned.map((r) => {
                const asset = typeof r.assetId === "object" ? r.assetId : null;
                const employee = typeof r.employeeId === "object" ? r.employeeId : null;
                
                const assetName = asset ? asset.name : (r.assetName || "Unknown asset");
                const employeeName = employee ? employee.name : (r.assignedTo || "—");
                const isReturned = !!r.returnedDate;

                return (
                  <li
                    key={r._id || r.id}
                    className="flex items-start justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {assetName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {employeeName} •{" "}
                        {r.assignedDate
                          ? new Date(r.assignedDate).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                    <div className="text-xs text-slate-700 rounded-full bg-slate-100 px-3 py-1">
                      {isReturned ? "Returned" : "Active"}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          onClick={() => setShowAllReportsModal(true)}
          className="p-6 bg-white rounded-xl shadow-md cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:-translate-y-2 hover:scale-105 hover:shadow-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Employee Reports
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Damage & incident reports filed by borrowers
          </p>

          <div className="mt-6 flex-1 overflow-hidden">
            <div className="text-3xl font-semibold text-slate-900 text-red-500">
              {filedReports.length}
            </div>
            <p className="text-sm text-slate-500 mt-1">Total active reports</p>

            <div className="mt-4 space-y-3">
              {filedReports.slice(0, 4).map((r) => (
                <div
                  key={r._id}
                  className="flex items-start justify-between border-b border-slate-100 pb-2 last:border-0"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {r.assetId?.name || r.assetId?.assetId || "Unknown Asset"}
                    </div>
                    <div className="text-xs text-slate-500 truncate" title={r.message}>
                      {r.employeeId?.name || "Unknown user"} • {r.message}
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap ${r.type === 'damage' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.type}
                  </div>
                </div>
              ))}
              {filedReports.length > 4 && (
                <div className="text-xs text-slate-500 text-center font-medium mt-2">
                  +{filedReports.length - 4} more reports
                </div>
              )}
              {filedReports.length === 0 && (
                <div className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 text-center">No reports filed.</div>
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
                      {a.type || "—"}
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

        {/* <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Actions</h3>
          <div className="mt-4 flex flex-col gap-3">
            <button className="w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-slate-900">
              Create export
            </button>
            <button className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
              View full report
            </button>
          </div>
        </div> */}
      </div>

      {/* Modal for All Reports */}
      {showAllReportsModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[32px] bg-white p-6 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
              <h3 className="text-2xl font-bold text-slate-900">All Employee Reports</h3>
              <button 
                onClick={() => setShowAllReportsModal(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {filedReports.map((r) => (
                <div
                  key={r._id}
                  className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <div className="text-base font-semibold text-slate-900">
                      {r.assetId?.name || r.assetId?.assetId || "Unknown Asset"}
                    </div>
                    <div className="text-sm text-slate-700 mt-1">
                      <span className="font-semibold text-slate-900">{r.employeeId?.name || "Unknown user"}</span> reported: 
                      <span className="italic ml-1">"{r.message}"</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Filed on: {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md whitespace-nowrap ${r.type === 'damage' ? 'bg-red-100 text-red-700' : r.type === 'lost' ? 'bg-purple-100 text-purple-700' : r.type === 'maintenance' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.type}
                    </div>
                    <div className={`text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-md whitespace-nowrap ${r.status === 'open' ? 'bg-blue-100 text-blue-700' : r.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {r.status}
                    </div>
                  </div>
                </div>
              ))}
              {filedReports.length === 0 && (
                <div className="text-center text-slate-500 py-12">No reports have been filed yet.</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminReports;
