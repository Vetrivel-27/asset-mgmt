import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { roleService } from "../../services/roleService";
import { RoleCard, PermissionSelector } from "../../components/Admin/RoleComponents";

const PERMISSION_DEPENDENCIES = {
  borrow_asset: ["view_asset", "return_asset", "report_damage"],
  return_asset: ["view_asset"],
  report_damage: ["view_asset", "view_my_damage"],
  view_my_damage: ["view_asset"],
  manage_asset: ["view_asset"],
  assign_asset: ["view_assignments"],
  view_assignments: ["view_asset", "view_users"],
  approve_borrow: ["view_asset", "view_users"],
  manage_maintenance: ["view_my_damage"],
  manage_users: ["view_users"],
  manage_roles: ["view_users"],
  view_dashboard: ["view_asset", "view_users", "view_assignments"],
  view_report: ["view_asset"]
};

function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const permissionGroups = useMemo(() => {
    return permissions.reduce((groups, permission) => {
      const group = permission.group || "Other";
      return {
        ...groups,
        [group]: [...(groups[group] || []), permission],
      };
    }, {});
  }, [permissions]);

  useEffect(() => {
    let mounted = true;

    async function loadRoleData() {
      try {
        const [rolesData, permissionsData] = await Promise.all([
          roleService.getAll(),
          roleService.getPermissions(),
        ]);

        if (mounted) {
          setRoles(Array.isArray(rolesData) ? rolesData : []);
          setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
        }
      } catch (err) {
        setError(err.message || "Failed to load roles.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRoleData();
    return () => {
      mounted = false;
    };
  }, []);

  const togglePermission = (permissionId) => {
    const targetPerm = permissions.find((p) => p._id === permissionId);
    if (!targetPerm) return;

    const isSelecting = !selectedPermissions.includes(permissionId);

    setSelectedPermissions((current) => {
      let result = [...current];

      if (isSelecting) {
        // SELECTING: add target and all its dependencies recursively
        const toAdd = new Set();

        const collectDeps = (permName) => {
          const deps = PERMISSION_DEPENDENCIES[permName] || [];
          deps.forEach((depName) => {
            const depPerm = permissions.find((p) => p.name === depName);
            if (depPerm && !toAdd.has(depPerm._id) && !result.includes(depPerm._id)) {
              toAdd.add(depPerm._id);
              collectDeps(depName);
            }
          });
        };

        toAdd.add(permissionId);
        collectDeps(targetPerm.name);

        toAdd.forEach((id) => {
          if (!result.includes(id)) {
            result.push(id);
          }
        });
      } else {
        // DESELECTING: remove target and all its dependents recursively
        const toRemove = new Set();

        const collectDependents = (permName) => {
          Object.entries(PERMISSION_DEPENDENCIES).forEach(([parentName, deps]) => {
            if (deps.includes(permName)) {
              const parentPerm = permissions.find((p) => p.name === parentName);
              if (
                parentPerm &&
                !toRemove.has(parentPerm._id) &&
                (result.includes(parentPerm._id) || parentPerm._id === permissionId)
              ) {
                toRemove.add(parentPerm._id);
                collectDependents(parentName);
              }
            }
          });
        };

        toRemove.add(permissionId);
        collectDependents(targetPerm.name);

        result = result.filter((id) => !toRemove.has(id));
      }

      return result;
    });
  };

  const toggleGroupPermissions = (groupPermissions, shouldSelect) => {
    setSelectedPermissions((current) => {
      let result = [...current];

      if (shouldSelect) {
        const toAdd = new Set();

        const collectDeps = (permName) => {
          const deps = PERMISSION_DEPENDENCIES[permName] || [];
          deps.forEach((depName) => {
            const depPerm = permissions.find((p) => p.name === depName);
            if (depPerm && !toAdd.has(depPerm._id) && !result.includes(depPerm._id)) {
              toAdd.add(depPerm._id);
              collectDeps(depName);
            }
          });
        };

        groupPermissions.forEach((permission) => {
          if (!result.includes(permission._id)) {
            toAdd.add(permission._id);
            collectDeps(permission.name);
          }
        });

        toAdd.forEach((id) => {
          if (!result.includes(id)) {
            result.push(id);
          }
        });
      } else {
        const toRemove = new Set();

        const collectDependents = (permName) => {
          Object.entries(PERMISSION_DEPENDENCIES).forEach(([parentName, deps]) => {
            if (deps.includes(permName)) {
              const parentPerm = permissions.find((p) => p.name === parentName);
              if (parentPerm && !toRemove.has(parentPerm._id)) {
                if (result.includes(parentPerm._id)) {
                  toRemove.add(parentPerm._id);
                  collectDependents(parentName);
                }
              }
            }
          });
        };

        groupPermissions.forEach((permission) => {
          if (result.includes(permission._id)) {
            toRemove.add(permission._id);
            collectDependents(permission.name);
          }
        });

        result = result.filter((id) => !toRemove.has(id));
      }

      return result;
    });
  };

  const handleEditInit = (role) => {
    setEditingRoleId(role._id);
    setRoleName(role.name);
    setSelectedPermissions((role.permissions || []).map(p => p._id || p));
    setError("");
    setMessage("");
  };

  const handleCancelEdit = () => {
    setEditingRoleId(null);
    setRoleName("");
    setSelectedPermissions([]);
    setError("");
    setMessage("");
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    
    setError("");
    setMessage("");
    try {
      await roleService.delete(roleToDelete._id);
      
      setRoles(current => current.filter(r => r._id !== roleToDelete._id));
      setMessage(`Role "${roleToDelete.name}" deleted successfully.`);
      if (editingRoleId === roleToDelete._id) handleCancelEdit();
      setDeleteModalOpen(false);
      setRoleToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete role.");
      setDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!roleName.trim() || selectedPermissions.length === 0) {
      setError("Role name and at least one permission are required.");
      return;
    }

    setSubmitting(true);
    try {
      const isEditing = !!editingRoleId;
      let data;
      if (isEditing) {
        data = await roleService.update(editingRoleId, { name: roleName.trim(), permissions: selectedPermissions });
      } else {
        data = await roleService.create({ name: roleName.trim(), permissions: selectedPermissions });
      }

      if (isEditing) {
        setRoles(current => current.map(r => r._id === data._id ? data : r));
        setMessage(`Role ${data.name} updated successfully.`);
        handleCancelEdit();
      } else {
        setRoles((current) => [...current, data]);
        setRoleName("");
        setSelectedPermissions([]);
        setMessage(`Role ${data.name} created successfully.`);
      }
    } catch (err) {
      setError(err.message || "Failed to save role.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Roles</h2>
        <p className="text-sm text-slate-500">
          Create roles by selecting permissions from the seeded permission list.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-2xl bg-green-100 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Existing Roles
          </h3>
          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading roles...</p>
            ) : roles.length === 0 ? (
              <p className="text-sm text-slate-500">No roles found.</p>
            ) : (
              roles.map((role) => (
                <RoleCard
                  key={role._id}
                  role={role}
                  onEdit={handleEditInit}
                  onDelete={(r) => {
                    setRoleToDelete(r);
                    setDeleteModalOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingRoleId ? "Edit Role" : "Create Role"}
          </h3>
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Role Name
              </span>
              <input
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                placeholder="e.g., asset manager"
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              />
            </label>

            <PermissionSelector
              permissionGroups={permissionGroups}
              selectedPermissions={selectedPermissions}
              togglePermission={togglePermission}
              toggleGroupPermissions={toggleGroupPermissions}
              submitting={submitting}
            />

            <div className="flex gap-3">
              <Button
                type="submit"
                loading={submitting}
                className="flex-1"
              >
                {editingRoleId ? "Update Role" : "Create Role"}
              </Button>
              {editingRoleId && (
                <Button
                  type="button"
                  variant="subtle"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen && !!roleToDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setRoleToDelete(null);
        }}
        title="Delete Role"
        message="Are you sure you want to permanently delete this role?"
        details={roleToDelete ? [
          { label: "Role Name", value: roleToDelete.name, capitalize: true },
        ] : []}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default AdminRoles;
