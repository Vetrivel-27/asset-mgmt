import React from "react";

/**
 * Reusable Button component standardizing buttons across the app.
 *
 * @param {Object} props
 * @param {string} [props.variant="primary"] - 'primary' | 'secondary' | 'danger' | 'subtle'
 * @param {boolean} [props.loading=false] - Shows loading state if true
 * @param {string} [props.className=""] - Additional custom classes
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}) {
  const sizeStyles = {
    sm: "rounded-xl py-1.5 px-3 text-xs",
    md: "rounded-2xl py-3 px-5 text-sm",
  };

  const baseStyle =
    `font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${sizeStyles[size] || sizeStyles.md}`;

  const variants = {
    primary: "bg-yellow-400 text-slate-900 hover:bg-yellow-500 shadow-sm",
    secondary:
      "border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white",
    danger: "bg-red-100 text-red-700 hover:bg-red-200",
    subtle: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
