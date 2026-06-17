import React from 'react';

/**
 * Reusable Status Badge component.
 */
function Badge({ status, className = "" }) {
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'approved':
      case 'returned':
        return 'bg-green-100 text-green-700';
      case 'assigned':
      case 'pending':
        return 'bg-blue-100 text-blue-700';
      case 'repair':
        return 'bg-orange-100 text-orange-700';
      case 'damaged':
      case 'rejected':
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getBadgeStyle()} ${className}`}>
      {status}
    </span>
  );
}

export default Badge;
