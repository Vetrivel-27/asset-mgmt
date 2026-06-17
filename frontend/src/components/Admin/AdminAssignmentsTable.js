import React from "react";
import SortableHeader from "../ui/SortableHeader";
import Tooltip from "../ui/Tooltip";

export default function AdminAssignmentsTable({
  currentPageAssignments,
  sortConfig,
  requestSort,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <SortableHeader label="Asset" sortKey="assetId.name" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Assigned To" sortKey="userId.displayName" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Assigned By" sortKey="createdBy.displayName" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Assigned Date" sortKey="assignedDate" currentSort={sortConfig} requestSort={requestSort} className="w-1/6 text-center" />
            <SortableHeader label="Due Date" sortKey="tentativeReturnDate" currentSort={sortConfig} requestSort={requestSort} className="w-1/6 text-center" />
            <SortableHeader label="Status" sortKey="returnedDate" currentSort={sortConfig} requestSort={requestSort} className="w-1/6 text-center" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {currentPageAssignments.map((assignment) => {
            const asset =
              typeof assignment.assetId === "object"
                ? assignment.assetId
                : null;
                
            const user = typeof assignment.userId === "object" ? assignment.userId : null;
            const employeeProfile = user ? user.employeeProfile : null;

            const assetName = asset ? asset.name : "—";
            const assetCode = asset ? asset.assetId : "";
            
            const employeeName = user ? user.displayName : "—";
            const empUserId = employeeProfile ? employeeProfile.employeeId : "-";

            const isReturned = !!assignment.returnedDate;
            const dueDate = assignment.tentativeReturnDate;

            let statusText = "Active";
            let badgeClass = "bg-blue-100 text-blue-700";
            if (isReturned) {
              statusText = "Returned";
              badgeClass = "bg-green-100 text-green-700";
            }

            const createdByObj = typeof assignment.createdBy === "object" ? assignment.createdBy : null;
            const assignerProfile = createdByObj ? createdByObj.employeeProfile : null;
            
            const assignedBy = createdByObj ? createdByObj.displayName : "—";
            const assignedBySubtext = assignerProfile ? assignerProfile.employeeId : "-";

            return (
              <tr key={assignment._id || assignment.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 text-sm text-center w-1/6 truncate">
                  <div className="font-semibold text-slate-900 truncate">
                    {assetName}
                  </div>
                  {assetCode && (
                    <div className="text-xs text-slate-500 truncate">
                      ID: {assetCode}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-center w-1/6 truncate">
                  <div className="font-medium text-slate-900 truncate">
                    {employeeName}
                  </div>
                  {empUserId && (
                    <div className="text-xs text-slate-500 truncate">
                      ID: {empUserId}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-center w-1/6 truncate">
                  <div className="font-medium text-slate-900 truncate">
                    {assignedBy}
                  </div>
                  {assignedBySubtext && (
                    <div className="text-xs text-slate-500 truncate">
                      ID: {assignedBySubtext}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-center text-sm text-slate-500 w-1/6 whitespace-nowrap">
                  {assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-4 text-center text-sm text-slate-500 w-1/6 whitespace-nowrap">
                  {dueDate ? new Date(dueDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-4 text-sm text-center w-1/6">
                  {isReturned ? (
                    <Tooltip content={`Returned on ${new Date(assignment.returnedDate).toLocaleDateString()}`}>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                        {statusText}
                      </span>
                    </Tooltip>
                  ) : (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      {statusText}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
