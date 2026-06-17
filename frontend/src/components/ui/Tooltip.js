import React, { useState } from 'react';

/**
 * Tooltip component that displays on hover.
 *
 * @param {{ children: React.ReactNode, content: string, position?: 'top'|'bottom'|'left'|'right' }} props
 */
function Tooltip({ children, content, position = "top" }) {
  const [isVisible, setIsVisible] = useState(false);

  // Exclude disabled empty content tooltips
  if (!content) return <>{children}</>;

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2 origin-bottom",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2 origin-top",
    left: "right-full top-1/2 -translate-y-1/2 mr-2 origin-right",
    right: "left-full top-1/2 -translate-y-1/2 ml-2 origin-left",
  };

  const arrowClasses = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 border-t-slate-800 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "top-[-4px] left-1/2 -translate-x-1/2 border-b-slate-800 border-l-transparent border-r-transparent border-t-transparent",
    left: "right-[-4px] top-1/2 -translate-y-1/2 border-l-slate-800 border-t-transparent border-b-transparent border-r-transparent",
    right: "left-[-4px] top-1/2 -translate-y-1/2 border-r-slate-800 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <div 
        className={`absolute z-[100] whitespace-nowrap rounded-lg bg-slate-800/95 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-200 pointer-events-none
          ${positionClasses[position]}
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
      >
        {content}
        <div className={`absolute border-4 w-0 h-0 ${arrowClasses[position]}`}></div>
      </div>
    </div>
  );
}

export default Tooltip;
