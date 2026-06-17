import React from "react";
import SortableHeader from "../ui/SortableHeader";
import { ASSET_STATUS } from "../../constants/assetStatus";
import CanAccess from "../common/CanAccess";
import Button from "../ui/Button";

export default function AdminAssetsTable({
  loading,
  assets,
  sortConfig,
  requestSort,
  openEditModal,
  handleDeleteAsset,
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full table-fixed divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <SortableHeader label="Asset Name" sortKey="name" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Asset ID" sortKey="assetId" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Category" sortKey="type" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} requestSort={requestSort} className="w-1/6 text-center" />
            <SortableHeader label="Assigned To" sortKey="assignedTo.name" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <th className="w-1/6 px-4 py-4 text-right text-sm font-semibold text-slate-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? (
            <tr>
              <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                Loading assets...
              </td>
            </tr>
          ) : assets.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                No assets found matching the search or status.
              </td>
            </tr>
          ) : (
            assets.map((asset) => (
              <tr key={asset._id}>
                <td className="px-4 py-4 text-sm text-center font-semibold text-slate-900">
                  {asset.name}
                </td>
                <td className="px-4 py-4 text-sm text-center text-slate-500 font-mono">
                  {asset.assetId}
                </td>
                <td className="px-4 py-4 text-sm text-center text-slate-500 capitalize">
                  {asset.type}
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold border ${
                      asset.status === ASSET_STATUS.AVAILABLE
                        ? "bg-green-50 text-green-700 border-green-200"
                        : asset.status === ASSET_STATUS.ASSIGNED
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : asset.status === "damaged"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : asset.status === "repair"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {asset.status === "damaged"
                      ? "Damaged"
                      : asset.status === "repair"
                        ? "Under Repair"
                        : asset.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-center text-slate-900">
                  {asset.status === ASSET_STATUS.ASSIGNED && asset.assignedTo ? (
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">
                        {asset.assignedTo.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        ID: {asset.assignedTo.employeeId || "—"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right text-sm">
                  <CanAccess permission="manage_asset">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => openEditModal(asset)}
                        className="!bg-yellow-100 !border-none !text-yellow-800 hover:!bg-yellow-200 animate-fade-in"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteAsset(asset)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CanAccess>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
