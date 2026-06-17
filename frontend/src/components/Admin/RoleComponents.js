import Button from "../ui/Button";
import { ROLES } from "../../constants/roles";

/**
 * Displays a single role with its permission badges and edit/delete actions.
 * Extracted from AdminRoles.js — no logic or design changes.
 */
export function RoleCard({ role, onEdit, onDelete }) {
  const isCore = role.name.toLowerCase() === ROLES.ADMIN;
  return (
    <div className="rounded-2xl border border-slate-200 p-4 relative group">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold capitalize text-slate-900">
          {role.name}
          {isCore && <span className="ml-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">Core</span>}
        </div>
        
        {!isCore && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="subtle"
              onClick={() => onEdit(role)}
              className="!bg-yellow-50 !border-none !text-yellow-600 hover:!text-yellow-700 !px-2 !py-1"
            >
              Edit
            </Button>
             <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(role)}
              className="!bg-red-50 !border-none !text-red-600 hover:!text-red-700 !px-2 !py-1"
            >
              Delete
            </Button>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(role.permissions || []).map((permission) => (
          <span
            key={permission._id || permission}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
          >
            {permission.name || permission}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders grouped permission checkboxes with select-all and dependency logic.
 * Extracted from AdminRoles.js — no logic or design changes.
 */
export function PermissionSelector({
  permissionGroups,
  selectedPermissions,
  togglePermission,
  toggleGroupPermissions,
  submitting,
}) {
  return (
    <div className="space-y-4">
      {Object.entries(permissionGroups).map(([group, groupPermissions]) => (
        <fieldset
          key={group}
          className="rounded-2xl border border-slate-200 p-4"
        >
          <legend className="px-1.5 text-sm font-semibold text-slate-800 flex items-center gap-2">
            <input
              type="checkbox"
              checked={groupPermissions.every(p => selectedPermissions.includes(p._id))}
              ref={(el) => {
                if (el) {
                  const allSelected = groupPermissions.every(p => selectedPermissions.includes(p._id));
                  const someSelected = groupPermissions.some(p => selectedPermissions.includes(p._id));
                  el.indeterminate = someSelected && !allSelected;
                }
              }}
              onChange={() => {
                const allSelected = groupPermissions.every(p => selectedPermissions.includes(p._id));
                toggleGroupPermissions(groupPermissions, !allSelected);
              }}
              disabled={submitting}
              className="h-4 w-4 rounded border-slate-300 text-yellow-400 focus:ring-yellow-300"
            />
            <span>{group}</span>
          </legend>
          <div className="mt-3 space-y-2">
            {groupPermissions.map((permission) => (
              <label
                key={permission._id}
                className="flex items-center gap-3 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission._id)}
                  onChange={() => togglePermission(permission._id)}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-slate-300 text-yellow-400 focus:ring-yellow-300"
                />
                <span>{permission.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
