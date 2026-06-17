import React from 'react';

/**
 * Reusable Input component.
 */
function Input({ label, type = "text", error, className = "", ...props }) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-yellow-200 ${
          error ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-yellow-400"
        }`}
        {...props}
      />
      {error && <p className="mt-1 ml-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default Input;
