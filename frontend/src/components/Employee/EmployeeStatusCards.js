import { BoxIcon, CalendarIcon } from "../ui/Icons";
import Button from "../ui/Button";
import SortableHeader from "../ui/SortableHeader";

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

/**
 * Renders a single active assignment card with asset details,
 * dates, and a return button.
 */
export function ActiveAssignmentCard({ assignment, returningId, onReturnClick }) {
  const asset =
    (typeof assignment.assetId === "object" && assignment.assetId !== null)
      ? assignment.assetId
      : {};
  return (
    <div
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
              ? new Date(assignment.assignedDate).toLocaleDateString()
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
          <span className="flex items-center gap-1.5 text-slate-500">
            <CalendarIcon /> Due
          </span>
          <span className="font-medium text-slate-800">
            {assignment.tentativeReturnDate
              ? new Date(assignment.tentativeReturnDate).toLocaleDateString()
              : "No due date"}
          </span>
        </div>
      </div>

      {/* Return button */}
      <Button
        variant="secondary"
        onClick={() => onReturnClick(assignment)}
        disabled={returningId !== null}
        className="mt-5 w-full"
      >
        {returningId === assignment._id ? "Returning..." : "Return this asset →"}
      </Button>
    </div>
  );
}

/**
 * Renders a single pending borrow-request card.
 */
export function PendingRequestCard({ request }) {
  const asset = request.requestedAssetId || {};
  const name = asset.name || `${request.assetType} (Category Request)`;
  return (
    <div
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
}

/**
 * Renders the return-history table rows within EmployeeStatus.
 */
export function ReturnHistoryTable({ paginatedReturns, sortConfig, requestSort }) {
  return (
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
                    ? new Date(assignment.assignedDate).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-5 py-4 text-sm text-center text-slate-500 w-1/3 truncate">
                  {assignment.returnedDate
                    ? new Date(assignment.returnedDate).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
