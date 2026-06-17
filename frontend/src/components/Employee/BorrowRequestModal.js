import Modal from "../ui/Modal";
import Button from "../ui/Button";

/**
 * Modal for submitting a borrow request for a specific asset.
 * Shows asset details and collects reason + tentative return date.
 * Extracted from EmployeeAssets.js — no logic or design changes.
 */
export default function BorrowRequestModal({
  isOpen,
  onClose,
  selectedAsset,
  reason,
  setReason,
  tentativeReturnDate,
  setTentativeReturnDate,
  submitting,
  onSubmit,
}) {
  return (
    <Modal
      isOpen={isOpen && !!selectedAsset}
      onClose={onClose}
      title="Borrow Request"
      subtitle="Please confirm details below."
      headerTheme="warning"
    >
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Asset Name
                </label>
                <p className="text-sm font-bold text-slate-800">
                  {selectedAsset?.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Asset ID
                  </label>
                  <p className="text-xs font-bold text-slate-700">
                    {selectedAsset?.assetId}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Category / Type
                  </label>
                  <p className="text-xs font-bold text-slate-700 capitalize">
                    {selectedAsset?.type}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason for Request */}
            <div className="space-y-2">
              <label
                htmlFor="reason"
                className="block text-sm font-semibold text-slate-700"
              >
                Reason for Request <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                rows="3"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you need to borrow this asset?"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 resize-none"
              />
            </div>

            {/* Tentative Return Date */}
            <div className="space-y-2">
              <label
                htmlFor="returnDate"
                className="block text-sm font-semibold text-slate-700"
              >
                Tentative Return Date{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="returnDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={tentativeReturnDate}
                onChange={(e) => setTentativeReturnDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                loading={submitting}
                className="flex-1"
              >
                Submit Request
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
          </form>
    </Modal>
  );
}
