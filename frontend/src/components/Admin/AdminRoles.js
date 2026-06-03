import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    setSelectedPermissions((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    );
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
      const res = await fetch(`${API_URL}/api/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          name: roleName.trim(),
          permissions: selectedPermissions,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create role.");
      }

      setRoles((current) => [...current, data]);
      setRoleName("");
      setSelectedPermissions([]);
      setMessage(`Role ${data.name} created successfully.`);
    } catch (err) {
      setError(err.message || "Failed to create role.");
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
                <div
                  key={role._id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="text-sm font-semibold capitalize text-slate-900">
                    {role.name}
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
              ))
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Create Role
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
                  <legend className="px-1 text-sm font-semibold text-slate-800">
                    {group}
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

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create role"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default AdminRoles;
