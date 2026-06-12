import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../config";

// ── icons (inline SVG so no extra dependency) ──────────────────────────────
const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       className="h-6 w-6 text-yellow-500">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 17m8 4V11"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       className="h-4 w-4 text-slate-400">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

function StatusBadge({ isReturned }) {
  if (isReturned)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        ✓ Returned
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
      ● Active
    </span>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
function EmployeeStatus() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null); // tracking returning state for spinner/button disable
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [sortConfig, setSortConfig] = useState({ key: "returnedDate", direction: "desc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    const isAsc = isActive && sortConfig.direction === "asc";
    const isDesc = isActive && sortConfig.direction === "desc";

    return (
      <svg className="ml-1.5 w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L8 10H16L12 4Z" fill="currentColor" className={isAsc ? "text-slate-800" : "text-slate-300"} />
        <path d="M12 20L16 14H8L12 20Z" fill="currentColor" className={isDesc ? "text-slate-800" : "text-slate-300"} />
      </svg>
    );
  };

  const loadMyAssignments = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assignments/my-assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadMyAssignments();
      setLoading(false);
    }
    init();
  }, []);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [assetToReturn, setAssetToReturn] = useState(null);

  const handleReturnClick = (assignment) => {
    setAssetToReturn(assignment);
    setReturnModalOpen(true);
  };

  const confirmReturnAsset = async () => {
    if (!assetToReturn) return;
    setReturningId(assetToReturn._id);
    setErrorMsg("");
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assignments/return/${assetToReturn._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to return asset.");
      }
      setSuccessMsg("Asset returned successfully! It is now available again.");
      setReturnModalOpen(false);
      setAssetToReturn(null);
      await loadMyAssignments();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setReturningId(null);
    }
  };

  // Split into active vs returned for cleaner UX
  const activeAssignments = assignments.filter((a) => !a.returnedDate);
  const returnedAssignments = useMemo(() => {
    let items = assignments.filter((a) => !!a.returnedDate);
    if (sortConfig.key) {
      items.sort((a, b) => {
        let aValue;
        let bValue;
        const getAsset = (asg) => typeof asg.assetId === 'object' && asg.assetId !== null ? asg.assetId : {};

        switch(sortConfig.key) {
          case 'assetName':
            aValue = getAsset(a).name || "";
            bValue = getAsset(b).name || "";
            break;
          case 'assignedDate':
            aValue = new Date(a.assignedDate || 0).getTime();
            bValue = new Date(b.assignedDate || 0).getTime();
            break;
          case 'returnedDate':
            aValue = new Date(a.returnedDate || 0).getTime();
            bValue = new Date(b.returnedDate || 0).getTime();
            break;
          default:
            aValue = "";
            bValue = "";
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [assignments, sortConfig]);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">My Assets</h2>
        <p className="text-sm text-slate-500">
          Assets currently assigned to you and your return history.
        </p>
      </div>

      {/* Success/Error toasts */}
      {successMsg && (
        <div className="rounded-2xl bg-green-100 px-5 py-4 text-sm font-medium text-green-700">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl bg-red-100 px-5 py-4 text-sm font-medium text-red-700">
          ⚠ {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-slate-500">
          Loading your assets…
        </div>
      ) : (
        <>
          {/* ── Active assignments ─────────────────────────────────────── */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Currently Assigned
            </h3>

            {activeAssignments.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-8 py-12 text-center text-slate-400">
                No active assignments right now.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {activeAssignments.map((assignment) => {
                  const asset =
                    (typeof assignment.assetId === "object" && assignment.assetId !== null)
                      ? assignment.assetId
                      : {};
                  return (
                    <div
                      key={assignment._id}
                      className="group relative flex flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                    >
                      {/* Asset name + badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-yellow-50">
                            <BoxIcon />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">
                              {asset.name || "Unknown asset"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {asset.type || "—"} • {asset.assetId || "—"}
                            </p>
                          </div>
                        </div>
                        <StatusBadge isReturned={false} />
                      </div>

                      {/* Dates */}
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <CalendarIcon /> Assigned
                          </span>
                          <span className="font-medium text-slate-800 text-right">
                            <span className="block">
                              {assignment.assignedDate
                                ? new Date(assignment.assignedDate).toLocaleDateString()
                                : "—"}
                            </span>
                            {assignment.assignedDate && (
                              <span className="block text-[10px] text-slate-400 mt-0.5">
                                {new Date(assignment.assignedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <CalendarIcon /> Due
                          </span>
                          <span className="font-medium text-slate-800 text-right">
                            <span className="block">
                              {assignment.tentativeReturnDate
                                ? new Date(assignment.tentativeReturnDate).toLocaleDateString()
                                : "No due date"}
                            </span>
                            {assignment.tentativeReturnDate && (
                              <span className="block text-[10px] text-slate-400 mt-0.5">
                                {new Date(assignment.tentativeReturnDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Return button */}
                      <button
                        onClick={() => handleReturnClick(assignment)}
                        disabled={returningId === assignment._id}
                        className="mt-5 w-full rounded-2xl border-2 border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white disabled:opacity-50"
                      >
                        {returningId === assignment._id ? "Returning..." : "Return this asset →"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Return history ─────────────────────────────────────────── */}
          {returnedAssignments.length > 0 && (
            <section>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                Return History
              </h3>
              <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th 
                        onClick={() => handleSort("assetName")}
                        className="px-5 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      >
                        Asset <SortIcon columnKey="assetName" />
                      </th>
                      <th 
                        onClick={() => handleSort("assignedDate")}
                        className="px-5 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      >
                        Assigned <SortIcon columnKey="assignedDate" />
                      </th>
                      <th 
                        onClick={() => handleSort("returnedDate")}
                        className="px-5 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      >
                        Returned <SortIcon columnKey="returnedDate" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {returnedAssignments.map((assignment) => {
                      const asset =
                        (typeof assignment.assetId === "object" && assignment.assetId !== null)
                          ? assignment.assetId
                          : {};
                      return (
                        <tr key={assignment._id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 text-sm">
                            <div className="font-medium text-slate-900">
                              {asset.name || "—"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {asset.assetId || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            <div>
                              {assignment.assignedDate
                                ? new Date(assignment.assignedDate).toLocaleDateString()
                                : "—"}
                            </div>
                            {assignment.assignedDate && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(assignment.assignedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            <div>
                              {assignment.returnedDate
                                ? new Date(assignment.returnedDate).toLocaleDateString()
                                : "—"}
                            </div>
                            {assignment.returnedDate && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(assignment.returnedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Custom Return Confirmation Modal */}
      {returnModalOpen &&
        assetToReturn &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-backdrop-in">
            <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl overflow-hidden border border-slate-200 flex flex-col animate-modal-in">
              <div className="p-8 pb-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 mb-6">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Confirm Return</h3>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                  Are you sure you want to return the <span className="font-semibold text-slate-700">{assetToReturn.assetId?.name || "Asset"}</span>? This will log the return date and make the asset available for other employees.
                </p>
              </div>
              <div className="flex gap-3 p-6 pt-2 bg-slate-50">
                <button
                  onClick={() => {
                    setReturnModalOpen(false);
                    setAssetToReturn(null);
                  }}
                  disabled={returningId !== null}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReturnAsset}
                  disabled={returningId !== null}
                  className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500 disabled:opacity-50"
                >
                  {returningId !== null ? "Returning..." : "Confirm Return"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default EmployeeStatus;
