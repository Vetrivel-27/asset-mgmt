import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../config";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (deleteModalOpen) {
          setDeleteModalOpen(false);
          setRoleToDelete(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteModalOpen]);

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
        const headers = getAuthHeaders();
        const [rolesRes, permissionsRes] = await Promise.all([
          fetch(`${API_URL}/api/roles`, { headers }),
          fetch(`${API_URL}/api/roles/permissions`, { headers }),
        ]);
        const rolesData = await rolesRes.json();
        const permissionsData = await permissionsRes.json();

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
        // SELECTING ALL in group: add all and their dependencies recursively
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
        // DESELECTING ALL in group: remove all and their dependents recursively
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
      const res = await fetch(`${API_URL}/api/roles/${roleToDelete._id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to delete role.");
      
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
      const url = isEditing 
        ? `${API_URL}/api/roles/${editingRoleId}` 
        : `${API_URL}/api/roles`;
        
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          name: roleName.trim(),
          permissions: selectedPermissions,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || `Failed to ${isEditing ? 'update' : 'create'} role.`);
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
              roles.map((role) => {
                const isCore = role.name.toLowerCase() === "admin";
                return (
                  <div
                    key={role._id}
                    className="rounded-2xl border border-slate-200 p-4 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold capitalize text-slate-900">
                        {role.name}
                        {isCore && <span className="ml-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">Core</span>}
                      </div>
                      
                      {!isCore && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditInit(role)}
                            className="text-xs font-semibold text-yellow-600 hover:text-yellow-700 bg-yellow-50 px-2 py-1 rounded-md"
                          >
                            Edit
                          </button>
                           <button
                            onClick={() => {
                              setRoleToDelete(role);
                              setDeleteModalOpen(true);
                            }}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md"
                          >
                            Delete
                          </button>
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
              })
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

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingRoleId ? "Update Role" : "Create Role"}
              </button>
              {editingRoleId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen &&
        roleToDelete &&
        createPortal(
          <div
            onClick={() => {
              setDeleteModalOpen(false);
              setRoleToDelete(null);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-yellow-400 animate-fade-in"
            >
              {/* Header */}
              <div className="bg-yellow-400 px-6 py-5 flex items-center justify-between text-black">
                <div>
                  <h3 className="font-bold text-lg">Delete Role</h3>
                  <p className="text-xs font-bold text-black mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setRoleToDelete(null);
                  }}
                  className="text-black hover:text-white rounded-full p-1 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-red-500">
                  <svg
                    className="w-10 h-10 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-slate-800">
                    Are you sure you want to permanently delete this role?
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-500">
                      Role Name:{" "}
                    </span>
                    <span className="font-bold text-slate-800 capitalize">
                      {roleToDelete.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-black transition hover:bg-yellow-500 shadow-sm"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setRoleToDelete(null);
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default AdminRoles;
