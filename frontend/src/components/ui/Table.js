import React from 'react';

/**
 * Reusable Table components.
 * Exports a composite object: Table, Table.Head, Table.Body, Table.Row, Table.Header, Table.Cell
 */
export function Table({ children, className = "" }) {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white ${className}`}>
      <table className="w-full text-left border-collapse">
        {children}
      </table>
    </div>
  );
}

Table.Head = function TableHead({ children }) {
  return <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>;
};

Table.Body = function TableBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
};

Table.Row = function TableRow({ children, className = "", onClick }) {
  return (
    <tr 
      onClick={onClick}
      className={`transition-colors hover:bg-slate-50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

Table.Header = function TableHeader({ children, className = "" }) {
  return (
    <th className={`px-4 py-4 text-sm font-semibold text-slate-700 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
};

Table.Cell = function TableCell({ children, className = "" }) {
  return (
    <td className={`px-4 py-4 text-sm text-slate-600 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
};

export default Table;
