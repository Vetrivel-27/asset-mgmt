import React, { useEffect } from 'react';
import Button from './Button';

/**
 * Reusable Confirmation Dialog component.
 */
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl animate-slide-up"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={isDestructive ? "danger" : "primary"} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
