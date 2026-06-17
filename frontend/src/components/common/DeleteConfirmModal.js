import Modal from "../ui/Modal";
import Button from "../ui/Button";

/**
 * Generic delete/destructive-action confirmation modal.
 * Accepts an array of detail rows [{label, value}] to display context about
 * the item being deleted. Reusable across Admin pages.
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  title = "Delete Item",
  subtitle = "This action cannot be undone",
  message = "Are you sure you want to permanently delete this item?",
  details = [],
  confirmLabel = "Confirm Delete",
  submitting = false,
  onConfirm,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      headerTheme="warning"
    >
      <div className="space-y-4">
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
            {message}
          </p>
        </div>

        {details.length > 0 && (
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1 text-sm text-slate-700">
            {details.map((detail, idx) => (
              <div key={idx}>
                <span className="font-semibold text-slate-500">
                  {detail.label}:{" "}
                </span>
                <span className={`font-bold text-slate-800 ${detail.capitalize ? "capitalize" : ""} ${detail.mono ? "font-mono" : ""}`}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}

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
            {submitting ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
