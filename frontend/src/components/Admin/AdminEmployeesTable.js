import React from "react";
import SortableHeader from "../ui/SortableHeader";
import CanAccess from "../common/CanAccess";
import Button from "../ui/Button";

export default function AdminEmployeesTable({
  pageItems,
  sortConfig,
  requestSort,
  handleOpenEdit,
  handleDeleteClick,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <SortableHeader label="Name" sortKey="name" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Email" sortKey="email" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Employee ID" sortKey="employeeId" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Department" sortKey="department" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <SortableHeader label="Role" sortKey="userId.role.name" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
            <th className="w-1/6 px-4 py-4 text-right text-sm font-semibold text-slate-700">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {pageItems.map((employee) => (
            <tr
              key={
                employee._id || employee.employeeId || employee.email
              }
            >
              <td className="px-4 py-4 text-sm text-center text-slate-900 w-1/6 truncate">
                {employee.name || "—"}
              </td>
              <td className="px-4 py-4 text-sm text-center text-slate-500 w-1/6 truncate">
                {employee.email || "—"}
              </td>
              <td className="px-4 py-4 text-sm text-center text-slate-500 w-1/6 truncate">
                {employee.employeeId || "—"}
              </td>
              <td className="px-4 py-4 text-sm text-center text-slate-500 w-1/6 truncate">
                {employee.department || "—"}
              </td>
              <td className="px-4 py-4 text-sm text-center capitalize text-slate-500 w-1/6 truncate">
                {employee.roleName || "—"}
              </td>
              <td className="px-4 py-4 text-right text-sm w-1/6 truncate">
                <CanAccess permission="manage_users">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => handleOpenEdit(employee)}
                      className="!bg-yellow-100 !border-none !text-yellow-800 hover:!bg-yellow-200"
                    >
                      Edit
                    </Button>
                    {employee.email?.toLowerCase() !==
                      "admin@test.com" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(employee)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CanAccess>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
