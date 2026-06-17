import Modal from "../../ui/Modal";
import Button from "../../ui/Button";

/**
 * Modal for approving a borrow request and assigning an asset.
 * Extracted from AdminRequests.js — no logic or design changes.
 */
export function ApproveRequestModal({
  isOpen,
  onClose,
  selectedRequest,
  selectedAssetId,
  setSelectedAssetId,
  matchingAssets,
  submitting,
  onSubmit,
}) {
  return (
    <Modal
      isOpen={isOpen && !!selectedRequest}
      onClose={onClose}
      title="Approve Request"
      subtitle="Assign an available asset to complete approval"
      headerTheme="dark"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {selectedRequest && (
          <>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">User</span>
                <span className="font-bold text-slate-800">{selectedRequest.userId?.displayName}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Category</span>
                  <span className="font-semibold text-slate-700 capitalize">{selectedRequest.assetType}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Due Date</span>
                  <span className="font-semibold text-slate-700">
                    {selectedRequest.tentativeReturnDate
                      ? new Date(selectedRequest.tentativeReturnDate).toLocaleDateString()
                      : "No due date"}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Select Asset to Assign <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              >
                <option value="">-- Choose Asset --</option>
                {/* Prioritize requested specific asset if matches */}
                {selectedRequest.requestedAssetId && (
                  <option value={selectedRequest.requestedAssetId._id}>
                    [Requested Asset] {selectedRequest.requestedAssetId.name} ({selectedRequest.requestedAssetId.assetId})
                  </option>
                )}
                {/* Matching category assets */}
                {matchingAssets
                  .filter((a) => a._id !== selectedRequest.requestedAssetId?._id)
                  .map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name} ({asset.assetId})
                    </option>
                  ))}
              </select>
              {matchingAssets.length === 0 && !selectedRequest.requestedAssetId && (
                <p className="text-xs text-red-500 font-semibold mt-1">
                  ⚠ No available assets found for category "{selectedRequest.assetType}".
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="subtle"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || (!selectedAssetId)}
                className="flex-1"
              >
                {submitting ? "Approving..." : "Confirm Approval"}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

/**
 * Modal for confirming rejection of a borrow request.
 * Extracted from AdminRequests.js — no logic or design changes.
 */
export function RejectRequestModal({
  isOpen,
  onClose,
  requestToReject,
  submitting,
  onConfirm,
}) {
  return (
    <Modal
      isOpen={isOpen && !!requestToReject}
      onClose={onClose}
      title="Reject Request"
      subtitle="This action cannot be undone"
      headerTheme="warning"
    >
      <div className="space-y-4">
        {requestToReject && (
          <>
            <div className="flex items-center gap-3 text-red-500">
              <svg
                className="w-10 h-10 shrink-0"
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
                Are you sure you want to reject this request?
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1 text-sm text-slate-700">
              <div>
                <span className="font-semibold text-slate-500">
                  User Name:{" "}
                </span>
                <span className="font-bold text-slate-800">
                  {requestToReject.userId?.displayName || "Unknown"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">
                  Asset Requested:{" "}
                </span>
                <span className="font-bold text-slate-800 capitalize">
                  {requestToReject.assetType}
                </span>
              </div>
              {requestToReject.reason && (
                <div>
                  <span className="font-semibold text-slate-500">
                    Reason:{" "}
                  </span>
                  <span className="font-bold text-slate-800">
                    "{requestToReject.reason}"
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="subtle"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={submitting}
                className="flex-1 !bg-red-600 hover:!bg-red-700 !text-white"
              >
                {submitting ? "Rejecting..." : "Yes, Reject"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
