/**
 * Shared lightweight SVG icon components used across the application.
 * These replace inline SVG definitions previously scattered across page files.
 */

export const BoxIcon = ({ color = "text-yellow-500" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       className={`h-6 w-6 ${color}`}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 17m8 4V11"/>
  </svg>
);

export const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       className="h-4 w-4 text-slate-400">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export const WarningIcon = () => (
  <svg
    className="w-10 h-10 text-yellow-500 shrink-0"
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
);

export const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const EmptyBoxIcon = ({ className = "mx-auto h-12 w-12 text-slate-300 mb-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 17m8 4V11"
    />
  </svg>
);

/**
 * Generic small icon wrapper used in AdminDashboard stat cards and quick actions.
 */
export const SmallIcon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d={d} />
  </svg>
);
