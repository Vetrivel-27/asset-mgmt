import { useEffect, useState } from "react";
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

function StatusBadge({ isReturned, isOverdue }) {
  if (isReturned)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        ✓ Returned
      </span>
    );
  if (isOverdue)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        ⚠ Overdue
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

  const handleReturnAsset = async (assignment) => {
    if (!window.confirm(`Are you sure you want to return this asset (${assignment.assetId?.name || "Asset"})?`)) {
      return;
    }
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
  const returnedAssignments = assignments.filter((a) => !!a.returnedDate);

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
                    typeof assignment.assetId === "object"
                      ? assignment.assetId
                      : {};
                  const isOverdue =
                    assignment.tentativeReturnDate &&
                    new Date(assignment.tentativeReturnDate) < new Date();

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
                        <StatusBadge isReturned={false} isOverdue={isOverdue} />
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
                            className={`font-medium ${
                              isOverdue ? "text-red-600" : "text-slate-800"
                            }`}
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
                        onClick={() => handleReturnAsset(assignment)}
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
                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                        Asset
                      </th>
                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                        Assigned
                      </th>
                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                        Returned
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {returnedAssignments.map((assignment) => {
                      const asset =
                        typeof assignment.assetId === "object"
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
                            {assignment.assignedDate
                              ? new Date(
                                  assignment.assignedDate
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
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
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default EmployeeStatus;
