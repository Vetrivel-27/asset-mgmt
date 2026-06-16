import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../config";
import SortableHeader from "../SortableHeader";
import Pagination from "../Pagination";
import { useTableSort } from "../../hooks/useTableSort";
import { usePagination } from "../../hooks/usePagination";

// ── icons (inline SVG so no extra dependency) ──────────────────────────────
const BoxIcon = ({ color = "text-yellow-500" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       className={`h-6 w-6 ${color}`}>
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

function RequestStatusBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
      ● Requested
    </span>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
function EmployeeStatus() {
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null); // tracking returning state for spinner/button disable
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [assignmentToReturn, setAssignmentToReturn] = useState(null);

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

  const loadMyRequests = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(data && Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      console.error("Failed to load requests", err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadMyAssignments(), loadMyRequests()]);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (returnModalOpen) {
          setReturnModalOpen(false);
          setAssignmentToReturn(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [returnModalOpen]);

  const handleReturnClick = (assignment) => {
    setAssignmentToReturn(assignment);
    setReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!assignmentToReturn) return;
    const assignment = assignmentToReturn;
    setReturningId(assignment._id);
    setErrorMsg("");
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assignments/return/${assignment._id}`, {
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
      await Promise.all([loadMyAssignments(), loadMyRequests()]);
      setTimeout(() => setSuccessMsg(""), 4000);
      setReturnModalOpen(false);
      setAssignmentToReturn(null);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setReturningId(null);
    }
  };

  // Split into active vs returned for cleaner UX
  const activeAssignments = assignments.filter((a) => !a.returnedDate);
  const returnedAssignments = assignments.filter((a) => !!a.returnedDate);
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const { items: sortedReturnedAssignments, requestSort, sortConfig } = useTableSort(returnedAssignments, { key: 'returnedDate', direction: 'desc' });

  const {
    page, pageCount, pageItems: paginatedReturns, setPage,
    canPrev, canNext, prev, next,
  } = usePagination({ data: sortedReturnedAssignments, pageSize: 6 });

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
                          <span className="font-medium text-slate-800">
                            {assignment.assignedDate
                              ? new Date(
                                  assignment.assignedDate
                                ).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <CalendarIcon /> Due
                          </span>
                          <span
                            className="font-medium text-slate-800"
                          >
                            {assignment.tentativeReturnDate
                              ? new Date(
                                  assignment.tentativeReturnDate
                                ).toLocaleDateString()
                              : "No due date"}
                          </span>
                        </div>
                      </div>

                      {/* Return button */}
                      <button
                        onClick={() => handleReturnClick(assignment)}
                        disabled={returningId !== null}
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

          {/* ── Pending Requests ───────────────────────────────────────── */}
          {pendingRequests.length > 0 && (
            <section>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                Requested Assets
              </h3>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pendingRequests.map((request) => {
                  const asset = request.requestedAssetId || {};
                  const name = asset.name || `${request.assetType} (Category Request)`;
                  return (
                    <div
                      key={request._id}
                      className="group relative flex flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                    >
                      {/* Asset name + badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50">
                            <BoxIcon color="text-amber-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">
                              {name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {asset.type || request.assetType || "—"} • {asset.assetId || "Category"}
                            </p>
                          </div>
                        </div>
                        <RequestStatusBadge />
                      </div>

                      {/* Dates & Details */}
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <CalendarIcon /> Requested On
                          </span>
                          <span className="font-medium text-slate-800">
                            {request.createdAt
                              ? new Date(request.createdAt).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <CalendarIcon /> Return Target
                          </span>
                          <span className="font-medium text-slate-800">
                            {request.tentativeReturnDate
                              ? new Date(request.tentativeReturnDate).toLocaleDateString()
                              : "No target date"}
                          </span>
                        </div>
                      </div>

                      {/* Awaiting status button */}
                      <div className="mt-5 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-2.5 text-center text-sm font-semibold text-slate-400">
                        Awaiting Approval
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Return history ─────────────────────────────────────────── */}
          {returnedAssignments.length > 0 && (
            <section>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                Return History
              </h3>
              <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="min-w-full table-fixed divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <SortableHeader label="Asset" sortKey="assetId.name" currentSort={sortConfig} requestSort={requestSort} className="w-1/3" />
                      <SortableHeader label="Assigned on" sortKey="assignedDate" currentSort={sortConfig} requestSort={requestSort} className="w-1/3" />
                      <SortableHeader label="Returned on" sortKey="returnedDate" currentSort={sortConfig} requestSort={requestSort} className="w-1/3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedReturns.map((assignment) => {
                      const asset =
                        (typeof assignment.assetId === "object" && assignment.assetId !== null)
                          ? assignment.assetId
                          : {};
                      return (
                        <tr key={assignment._id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 text-sm text-center w-1/3 truncate">
                            <div className="font-medium text-slate-900 truncate">
                              {asset.name || "—"}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {asset.assetId || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-center text-slate-500 w-1/3 truncate">
                            {assignment.assignedDate
                              ? new Date(
                                  assignment.assignedDate
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-sm text-center text-slate-500 w-1/3 truncate">
                            {assignment.returnedDate
                              ? new Date(
                                  assignment.returnedDate
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={page} pageCount={pageCount} setPage={setPage}
                canPrev={canPrev} canNext={canNext} prev={prev} next={next}
                showing={paginatedReturns.length} total={returnedAssignments.length}
                label="returns"
              />
            </section>
          )}
        </>
      )}

      {/* Return Confirmation Modal */}
      {returnModalOpen &&
        assignmentToReturn &&
        createPortal(
          <div
            onClick={() => {
              setReturnModalOpen(false);
              setAssignmentToReturn(null);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-yellow-400 animate-fade-in"
            >
              {/* Header */}
              <div className="bg-yellow-400 px-6 py-5 flex items-center justify-between text-black">
                <div>
                  <h3 className="font-bold text-lg">Return Asset</h3>
                  <p className="text-xs font-bold text-black mt-0.5">
                    Confirm return request
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReturnModalOpen(false);
                    setAssignmentToReturn(null);
                  }}
                  className="text-black hover:opacity-75 rounded-full p-1 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-slate-800">
                  <svg
                    className="w-10 h-10 text-yellow-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-slate-800">
                    Are you sure you want to return this asset? It will become available for others.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-500">Asset Name: </span>
                    <span className="font-bold text-slate-800">
                      {assignmentToReturn.assetId?.name || "Unknown Asset"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Asset Type: </span>
                    <span className="font-bold text-slate-800 capitalize">
                      {assignmentToReturn.assetId?.type || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Asset ID: </span>
                    <span className="font-mono font-bold text-slate-800">
                      {assignmentToReturn.assetId?.assetId || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Assigned Date: </span>
                    <span className="font-bold text-slate-800">
                      {assignmentToReturn.assignedDate
                        ? new Date(assignmentToReturn.assignedDate).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmReturn}
                    disabled={returningId !== null}
                    className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-black transition hover:bg-yellow-500 shadow-sm disabled:opacity-50"
                  >
                    {returningId === assignmentToReturn._id ? "Returning..." : "Yes, Return"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnModalOpen(false);
                      setAssignmentToReturn(null);
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default EmployeeStatus;
