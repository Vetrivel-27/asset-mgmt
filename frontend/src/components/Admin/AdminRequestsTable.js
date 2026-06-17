import React from "react";
import SortableHeader from "../ui/SortableHeader";
import { REQUEST_STATUS } from "../../constants/assetStatus";
import Button from "../ui/Button";

export default function AdminRequestsTable({
  paginatedRequests,
  sortConfig,
  requestSort,
  setSelectedRequest,
  setSelectedAssetId,
  setApproveModalOpen,
  setRequestToReject,
  setRejectModalOpen,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <SortableHeader label="User" sortKey="userId.displayName" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Requested Info" sortKey="assetType" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Reason" sortKey="reason" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Dates" sortKey="requestDate" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <th className="w-1/6 px-4 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {paginatedRequests.map((req) => (
            <tr key={req._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4 text-sm text-center w-1/6 truncate">
                <div className="font-medium text-slate-900 truncate">{req.userId?.displayName || "Unknown"}</div>
                <div className="text-xs text-slate-500 truncate">
                  ID: {req.userId?.employeeProfile?.employeeId || "—"}
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-center w-1/6 truncate">
                <div className="capitalize font-semibold text-slate-800 truncate">{req.assetType || "General"}</div>
                {req.requestedAssetId && (
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    Specific: {req.requestedAssetId.name} ({req.requestedAssetId.assetId})
                  </div>
                )}
              </td>
              <td className="px-4 py-4 text-sm text-center text-slate-500 w-1/6 truncate" title={req.reason}>
                {req.reason || "—"}
              </td>
              <td className="px-4 py-4 text-sm text-center text-slate-500 w-1/6 truncate">
                <div className="text-xs truncate">
                  <span className="font-medium text-slate-400">Request:</span>{" "}
                  {new Date(req.createdAt).toLocaleDateString()}
                </div>
                {req.tentativeReturnDate && (
                  <div className="text-xs mt-0.5 truncate">
                    <span className="font-medium text-slate-400">Due:</span>{" "}
                    {new Date(req.tentativeReturnDate).toLocaleDateString()}
                  </div>
                )}
              </td>
              <td className="px-4 py-4 text-center w-1/6 truncate">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                    req.status === REQUEST_STATUS.PENDING
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : req.status === REQUEST_STATUS.APPROVED
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {req.status}
                </span>
              </td>
              <td className="px-4 py-4 text-right text-sm w-1/6 truncate">
                {req.status === REQUEST_STATUS.PENDING ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => {
                        setSelectedRequest(req);
                        // Auto select requestedAssetId if it exists
                        if (req.requestedAssetId?._id) {
                          setSelectedAssetId(req.requestedAssetId._id);
                        } else {
                          setSelectedAssetId("");
                        }
                        setApproveModalOpen(true);
                      }}
                      className="!bg-green-100 !border-none !text-green-700 hover:!bg-green-200"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setRequestToReject(req);
                        setRejectModalOpen(true);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Processed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
