import React, { useState, useEffect } from "react";
import Button from "../../ui/Button";

export default function EmployeeForm({
  initialData = null,
  departments = [],
  roles = [],
  layout = "stack",
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isEmployee, setIsEmployee] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setEmployeeId(initialData.employeeId || "");
      setRoleId(initialData.roleId || "");
      setIsEmployee(initialData.employeeId && initialData.employeeId !== "—" ? true : false);

      if (departments.includes(initialData.department)) {
        setDepartment(initialData.department);
        setCustomDepartment("");
      } else if (initialData.department && initialData.department !== "—") {
        setDepartment("CUSTOM");
        setCustomDepartment(initialData.department);
      }
    }
  }, [initialData, departments]); // Removed roleId to prevent reverting user selection

  // Separate effect to handle default role for NEW users
  useEffect(() => {
    if (!initialData && roles && roles.length > 0 && !roleId) {
      const defaultRole = roles.find((r) => r.name.toLowerCase() === "employee") || roles[0];
      setRoleId(defaultRole._id);
    }
  }, [initialData, roles, roleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDepartment = department === "CUSTOM" ? customDepartment.trim() : department.trim();

    if (!name.trim() || !email.trim() || !roleId) {
      setError("Name, email, and role are required.");
      return;
    }

    let formattedId = "";
    if (isEmployee) {
      if (!employeeId.trim() || !finalDepartment) {
        setError("Employee ID and department are required when creating an employee.");
        return;
      }

      formattedId = employeeId.trim();
      if (/^\d{1,4}$/.test(formattedId)) {
        formattedId = formattedId.padStart(4, "0");
      }

      if (!/^\d{4}$/.test(formattedId)) {
        setError("Employee ID must be a number up to 4 digits.");
        return;
      }
    }

    setError("");
    setSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        employeeId: isEmployee ? formattedId : undefined,
        department: isEmployee ? finalDepartment : undefined,
        roleId,
        isEmployee,
      });
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm animate-shake">
          {error}
        </div>
      )}

      {/* Account Type Toggle */}
      {!initialData && (
        <div className="flex gap-4 p-1 bg-slate-100 rounded-xl mb-2 w-fit">
          <button
            type="button"
            onClick={() => setIsEmployee(false)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              !isEmployee
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Create User Only
          </button>
          <button
            type="button"
            onClick={() => setIsEmployee(true)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              isEmployee
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Create Employee Profile
          </button>
        </div>
      )}

      <div className={layout === "grid" ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="User full name"
            disabled={submitting}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          {initialData?.email?.toLowerCase() === "admin@test.com" ? (
            <input
              disabled
              value={email}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 px-4 py-2 text-sm cursor-not-allowed outline-none"
            />
          ) : (
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={submitting}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
            />
          )}
        </label>

        {isEmployee && (
          <>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Employee ID</span>
              {initialData?.email?.toLowerCase() === "admin@test.com" ? (
                <input
                  disabled
                  value={employeeId}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 px-4 py-2 text-sm cursor-not-allowed outline-none"
                />
              ) : (
                <input
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g., 0001"
                  disabled={submitting || initialData} // Cannot change once created
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Department</span>
              <select
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              >
                <option value="">Select Department</option>
                {departments.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
                <option value="CUSTOM">Custom department...</option>
              </select>
            </label>

            {department === "CUSTOM" && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">New Department Name</span>
                <input
                  required
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  placeholder="e.g., Data Science"
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </label>
            )}
          </>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Role</span>
          <select
            required
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            disabled={submitting || roles.length === 0}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm capitalize outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${layout === "grid" ? "pt-2" : "pt-4"}`}>
        <Button type="submit" loading={submitting}>
          {initialData ? "Save Changes" : "Add User"}
        </Button>
        <Button type="button" variant="subtle" onClick={onCancel} disabled={submitting}>
          Close
        </Button>
      </div>
    </form>
  );
}
