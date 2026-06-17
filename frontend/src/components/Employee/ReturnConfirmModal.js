import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { WarningIcon } from "../ui/Icons";

/**
 * Modal for confirming an asset return action.
 * Extracted from EmployeeStatus.js — no logic or design changes.
 */
export default function ReturnConfirmModal({
  isOpen,
  onClose,
  assignment,
  returningId,
  onConfirm,
}) {
  return (
    <Modal
      isOpen={isOpen && !!assignment}
      onClose={onClose}
      title="Return Asset"
      subtitle="Confirm return request"
      headerTheme="warning"
    >
      {assignment && (
        <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-800">
                <WarningIcon />
                <p className="text-sm font-semibold text-slate-800">
                  Are you sure you want to return this asset? It will become available for others.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1 text-sm text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500">Asset Name: </span>
                  <span className="font-bold text-slate-800">
                    {assignment?.assetId?.name || "Unknown Asset"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Asset Type: </span>
                  <span className="font-bold text-slate-800 capitalize">
                    {assignment?.assetId?.type || "—"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Asset ID: </span>
                  <span className="font-mono font-bold text-slate-800">
                    {assignment?.assetId?.assetId || "—"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Assigned Date: </span>
                  <span className="font-bold text-slate-800">
                    {assignment?.assignedDate
                      ? new Date(assignment.assignedDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={onConfirm}
                  disabled={returningId !== null}
                  className="flex-1"
                >
                  {returningId === assignment._id ? "Returning..." : "Yes, Return"}
                </Button>
                <Button
                  type="button"
                  variant="subtle"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
        </div>
      )}
    </Modal>
  );
}
