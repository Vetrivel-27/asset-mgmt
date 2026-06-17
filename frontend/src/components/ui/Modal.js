import React, { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Reusable modal component standardizing layout and behavior across the app.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Function to call when modal closes
 * @param {string} props.title - The main title of the modal
 * @param {string} props.subtitle - Optional subtitle below the title
 * @param {string} [props.headerTheme="default"] - 'default' | 'dark' | 'warning'
 * @param {React.ReactNode} props.children - Modal body content
 * @param {string} [props.maxWidth="max-w-md"] - Width constraint class
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  headerTheme = "default",
  children,
  maxWidth = "max-w-md",
}) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      // Prevent scrolling on body when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const headerStyles = {
    dark: "bg-black text-white",
    warning: "bg-yellow-400 text-slate-900",
    default: "bg-white text-slate-900 border-b border-slate-100",
  };

  const closeButtonStyles = {
    dark: "text-slate-400 hover:text-white hover:bg-slate-800",
    warning: "text-slate-800 hover:bg-yellow-500 hover:text-slate-900",
    default: "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 transition-all animate-fade-in`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 flex items-center justify-between ${headerStyles[headerTheme]}`}
        >
          <div>
            <h3 className="font-bold text-lg leading-tight">{title}</h3>
            {subtitle && (
              <p
                className={`text-xs mt-0.5 ${
                  headerTheme === "default"
                    ? "text-slate-500"
                    : "opacity-80 font-medium"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition ${closeButtonStyles[headerTheme]}`}
            aria-label="Close modal"
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
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
