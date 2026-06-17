import React from 'react';

/**
 * Reusable Card component for layout wrappers.
 */
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl bg-white shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export default Card;
