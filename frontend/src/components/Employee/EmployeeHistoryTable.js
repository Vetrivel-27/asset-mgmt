import React from "react";
import SortableHeader from "../ui/SortableHeader";

export default function EmployeeHistoryTable({
  paginatedHistory,
  sortConfig,
  requestSort,
  setSelectedRecord,
  setSidebarOpen,
  statusLabel,
  isReturnOnly,
}) {
  return (
    <div className="space-y-6">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader label="Asset Name" sortKey="asset.name" currentSort={sortConfig} requestSort={requestSort} className="w-1/5" />
              <SortableHeader label="Asset ID" sortKey="asset.assetId" currentSort={sortConfig} requestSort={requestSort} className="w-1/5" />
              <SortableHeader label="Date" sortKey="dateSort" currentSort={sortConfig} requestSort={requestSort} className="w-1/5" />
              <SortableHeader label="Returned Date" sortKey="returnedDate" currentSort={sortConfig} requestSort={requestSort} className="w-1/5" />
              <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} requestSort={requestSort} className="w-1/5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {paginatedHistory.map((record) => {
              const status = statusLabel(record);
              return (
                <tr
                  key={record._id || record.assetId || record.asset?._id}
                  onClick={() => {
                    setSelectedRecord(record);
                    setSidebarOpen(true);
                  }}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-4 text-sm text-center font-medium text-slate-900 w-1/5 truncate">
                    {record.asset?.name || record.assetType || "Unknown asset"}
                  </td>
                  <td className="px-4 py-4 text-sm text-center text-slate-500 font-mono w-1/5 truncate">
                    {record.asset?.assetId || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-center text-slate-500 w-1/5 truncate">
                    {record.recordType === 'assignment' && record.assignedDate
                      ? new Date(record.assignedDate).toLocaleDateString()
                      : record.recordType === 'rejected_request' || record.recordType === 'damage_report'
                        ? new Date(record.createdAt).toLocaleDateString() 
                        : "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-center text-slate-500 w-1/5 truncate">
                    {record.returnedDate
                      ? new Date(record.returnedDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-center w-1/5 truncate">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${status.classes}`}
                    >
                      {status.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {paginatedHistory.map((record) => {
          const status = statusLabel(record);
          return (
            <div
              key={record._id || record.assetId || record.asset?._id}
              onClick={() => {
                setSelectedRecord(record);
                setSidebarOpen(true);
              }}
              className="cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm hover:border-yellow-400 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {record.asset?.name || record.assetType || "Unknown asset"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID: {record.asset?.assetId || "—"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold border ${status.classes}`}
                >
                  {status.text}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium">
                    {record.recordType === 'rejected_request' ? "Requested" : record.recordType === 'damage_report' ? "Reported" : (isReturnOnly ? "Assigned" : "Borrowed")}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-700">
                    {record.recordType === 'assignment' && record.assignedDate
                      ? new Date(record.assignedDate).toLocaleDateString()
                      : record.recordType === 'rejected_request' || record.recordType === 'damage_report'
                        ? new Date(record.createdAt).toLocaleDateString() 
                        : "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium">Return</p>
                  <p className="mt-1 text-xs font-bold text-slate-700">
                    {record.returnedDate
                      ? new Date(record.returnedDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
