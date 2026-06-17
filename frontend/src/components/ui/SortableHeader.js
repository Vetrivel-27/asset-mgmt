import React from 'react';

/**
 * Sortable table header component.
 * Renders a clickable <th> that toggles sort direction.
 *
 * @param {{ label: string, sortKey: string, currentSort: { key: string, direction: string },
 *           requestSort: function, className?: string }} props
 */
function SortableHeader({ label, sortKey, currentSort, requestSort, className = "" }) {
  const isActive = currentSort?.key === sortKey;
  const isAsc = isActive && currentSort.direction === 'asc';
  const isDesc = isActive && currentSort.direction === 'desc';

  return (
    <th 
      className={`px-4 py-4 text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors ${className}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className={`flex items-center gap-1.5 ${className.includes('text-left') ? 'justify-start' : className.includes('text-right') ? 'justify-end' : 'justify-center'}`}>
        {label}
        <div className="flex flex-col opacity-60">
          <svg className={`w-[10px] h-[10px] -mb-[2px] transition-colors ${isAsc ? 'text-slate-900 opacity-100' : 'text-slate-400 hover:text-slate-600'}`} fill="currentColor" viewBox="0 0 24 24">
             <path d="M12 8l6 6H6z" />
          </svg>
          <svg className={`w-[10px] h-[10px] transition-colors ${isDesc ? 'text-slate-900 opacity-100' : 'text-slate-400 hover:text-slate-600'}`} fill="currentColor" viewBox="0 0 24 24">
             <path d="M12 16l-6-6h12z" />
          </svg>
        </div>
      </div>
    </th>
  );
}

export default SortableHeader;
