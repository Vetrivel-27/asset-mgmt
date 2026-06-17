import React from 'react';

/**
 * Reusable Alert component for displaying success/error messages.
 *
 * @param {{ type: 'success' | 'error' | 'info' | 'warning', message: string, className?: string }} props
 */
function Alert({ type = 'info', message, className = "" }) {
  if (!message) return null;

  const styles = {
    success: "bg-green-50 text-green-700 border-green-200",
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    info: "bg-blue-50 text-blue-700 border-blue-200"
  };

  return (
    <div className={`p-4 rounded-2xl border text-sm font-medium ${styles[type]} ${className}`}>
      {message}
    </div>
  );
}

export default Alert;
