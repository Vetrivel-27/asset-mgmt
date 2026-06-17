import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { REPORT_STATUS } from "../../constants/assetStatus";

/**
 * Modal for displaying detailed approval/rejection/damage logs.
 * Extracted from EmployeeHistory.js — no logic or design changes.
 */
export default function HistoryLogModal({
  isOpen,
  onClose,
  selectedRecord,
}) {
  return (
    <Modal
      isOpen={isOpen && !!selectedRecord}
      onClose={onClose}
      title="Borrow & Approval Log"
      subtitle="Detailed history trace of the asset"
      headerTheme="dark"
    >
      {selectedRecord && (
        <>
          <div className="flex flex-col max-h-[70vh] overflow-y-auto pr-2 space-y-6">
            {/* Asset Snapshot Card */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Asset Information</p>
              <div>
                <h4 className="font-bold text-slate-800 text-base">{selectedRecord?.asset?.name || "Unknown Asset"}</h4>
                <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">{selectedRecord?.asset?.type || "General"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block">Asset ID</label>
                  <span className="text-xs font-bold text-slate-700">{selectedRecord?.asset?.assetId || "—"}</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block">Current Status</label>
                  <span className="text-xs font-bold text-slate-700 capitalize">{selectedRecord?.asset?.status || "—"}</span>
                </div>
              </div>
            </div>

            {/* Approval Details Log or Report Details */}
            {selectedRecord.recordType === 'damage_report' ? (
              <DamageReportDetails record={selectedRecord} />
            ) : (
              <ApprovalDetails record={selectedRecord} />
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose} className="w-full">
              Close Logs Panel
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

/** Sub-component for damage report log details */
function DamageReportDetails({ record }) {
  return (
    <>
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Report Details</p>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Report Type</p>
            <p className="text-sm font-bold text-slate-800 capitalize">{record.type || "General"}</p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Message / Details</p>
            <p className="text-sm text-slate-700">{record.message || "No message specified."}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Logs & History Trace</p>
        <div className="relative border-l border-slate-200 pl-5 ml-2 space-y-6">
          <div className="relative">
            <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-400 ring-4 ring-white"></span>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold text-slate-800">Report Submitted</p>
              <span className="text-[10px] text-slate-400 font-medium">
                {new Date(record.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Submitted by you.
            </p>
          </div>

          {(record.status === REPORT_STATUS.IN_PROGRESS || record.status === REPORT_STATUS.RESOLVED) && (
            <div className="relative">
              <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white"></span>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold text-blue-700">Maintenance In Progress</p>
                <span className="text-[10px] text-slate-400 font-medium">
                  {record.status === REPORT_STATUS.IN_PROGRESS ? new Date(record.updatedAt).toLocaleString() : '—'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Report is being reviewed and the asset is undergoing maintenance.
              </p>
            </div>
          )}

          {record.status === REPORT_STATUS.RESOLVED && (
            <div className="relative">
              <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white"></span>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold text-emerald-700">Report Resolved</p>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(record.updatedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Issue resolved. The asset has been set back to available.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Sub-component for approval/rejection log details */
function ApprovalDetails({ record }) {
  const isRejected = record.recordType === 'rejected_request';
  const actionUser = isRejected ? record.statusChangedBy : record.createdBy;
  const actorName = actionUser?.displayName || (actionUser?.email ? actionUser.email.split('@')[0] : "Admin");
  const actorNameFull = actionUser?.displayName || (actionUser?.email ? actionUser.email.split('@')[0] : "System Admin");
  const initials = actorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {isRejected ? "Rejection Details" : "Approval Details"}
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700 text-sm font-bold">
              {initials}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {isRejected ? "Rejected By" : "Approved By"}
              </p>
              <p className="text-sm font-bold text-slate-800">
                {actorNameFull}
              </p>
            </div>
          </div>
          {actionUser?.email && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {isRejected ? "Rejecter Email" : "Approver Email"}
              </p>
              <p className="text-xs font-semibold text-slate-700 break-all">{actionUser.email}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Logs & History Trace</p>
        <div className="relative border-l border-slate-200 pl-5 ml-2 space-y-6">
          <div className="relative">
            <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-400 ring-4 ring-white"></span>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold text-slate-800">Borrow Request Submitted</p>
              <span className="text-[10px] text-slate-400 font-medium">
                {new Date(record.createdAt || record.assignedDate).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Submitted by you for approval.
            </p>
          </div>

          {isRejected ? (
            <div className="relative">
              <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-4 ring-white"></span>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold text-red-700">Request Rejected</p>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(record.updatedAt || record.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Rejected by <span className="font-semibold text-slate-700">{record.statusChangedBy?.displayName || (record.statusChangedBy?.email ? record.statusChangedBy.email.split('@')[0] : "System Admin")}</span>.
              </p>
            </div>
          ) : (
            <div className="relative">
              <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white"></span>

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold text-emerald-700">Request Approved & Assigned</p>
                <span className="text-[10px] text-slate-400 font-medium">
                  {record.assignedDate ? new Date(record.assignedDate).toLocaleString() : "—"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Approved by <span className="font-semibold text-slate-700">{record.createdBy?.displayName || (record.createdBy?.email ? record.createdBy.email.split('@')[0] : "System Admin")}</span>.
              </p>
              {record.tentativeReturnDate && (
                <p className="text-[11px] font-semibold text-amber-600 mt-1">
                  Tentative return date: {new Date(record.tentativeReturnDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {record.returnedDate && (
            <div className="relative">
              <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white"></span>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold text-blue-700">Asset Returned</p>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(record.returnedDate).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Returned and checked back in.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
