import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../config";
import CanAccess from "../CanAccess";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeEmployee = (employee) => ({
  ...employee,
  email: employee.email || employee.userId?.email || "",
  employeeId: employee.employeeId || employee.userId?.userId || "",
  roleId: employee.roleId || employee.userId?.role?._id || "",
  roleName: employee.roleName || employee.userId?.role?.name || "",
});

function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formCustomDepartment, setFormCustomDepartment] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Edit Employee States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editCustomDepartment, setEditCustomDepartment] = useState("");
  const [editRoleId, setEditRoleId] = useState("");

  const dbDepartments = useMemo(() => {
    const deps = new Set(employees.map((emp) => emp.department).filter(Boolean));
    return Array.from(deps).sort();
  }, [employees]);

  const pageSize = 8;

  const avatarColors = [
    "bg-sky-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-rose-500",
    "bg-orange-500",
    "bg-cyan-500",
    "bg-fuchsia-500",
    "bg-lime-500",
  ];

  const getAvatarColor = (employee) => {
    if (employee.avatarColor) return employee.avatarColor;
    const seed = employee.email || employee.name || "unknown";
    const hash = Array.from(seed).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    );
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  useEffect(() => {
    let mounted = true;

    async function loadEmployees() {
      try {
        const headers = getAuthHeaders();
        const [employeesRes, rolesRes] = await Promise.all([
          fetch(`${API_URL}/api/employees`, { headers }),
          fetch(`${API_URL}/api/roles`, { headers }),
        ]);
        const data = await employeesRes.json();
        const rolesData = await rolesRes.json();
        if (mounted) {
          setEmployees(Array.isArray(data) ? data.map(normalizeEmployee) : []);
          if (Array.isArray(rolesData)) {
            setRoles(rolesData);
            setFormRoleId(
              rolesData.find((role) => role.name === "employee")?._id ||
                rolesData[0]?._id ||
                "",
            );
          }
        }
      } catch (error) {
        console.error("Failed to load employees", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEmployees();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const term = filter.toLowerCase();
    return employees.filter((employee) => {
      return (
        employee.name?.toLowerCase().includes(term) ||
        employee.email?.toLowerCase().includes(term) ||
        employee.employeeId?.toLowerCase().includes(term)
      );
    });
  }, [employees, filter]);

  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const pageItems = filteredEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [pageCount, page]);

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormEmployeeId("");
    setFormDepartment("");
    setFormCustomDepartment("");
    setFormRoleId(
      roles.find((role) => role.name === "employee")?._id ||
        roles[0]?._id ||
        "",
    );
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const finalDepartment = formDepartment === "CUSTOM" ? formCustomDepartment.trim() : formDepartment.trim();

    if (
      !formName.trim() ||
      !formEmail.trim() ||
      !formEmployeeId.trim() ||
      !finalDepartment ||
      !formRoleId
    ) {
      setSubmitError("All fields are required.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const payload = {
        name: formName.trim(),
        email: formEmail.trim(),
        employeeId: formEmployeeId.trim(),
        department: finalDepartment,
        roleId: formRoleId,
      };

      const res = await fetch(`${API_URL}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to create employee.",
        );
      }

      const newEmployee = normalizeEmployee(await res.json());
      setEmployees((currentEmployees) => [newEmployee, ...currentEmployees]);
      resetForm();
      setSubmitSuccess(
        `Employee ${formName} created successfully! A welcome email has been sent.`,
      );
      setShowForm(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (error) {
      console.error("Error creating employee:", error);
      setSubmitError(error.message || "Failed to create employee.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (employee) => {
    setEditEmployee(employee);
    setEditName(employee.name || "");
    setEditEmail(employee.email || "");
    setEditEmployeeId(employee.employeeId || "");
    setEditDepartment(employee.department || "");
    setEditCustomDepartment("");
    setEditRoleId(employee.roleId || "");
    setEditModalOpen(true);
  };

  const hasEmployeeChanges = useMemo(() => {
    if (!editEmployee) return false;
    const finalEditDept = editDepartment === "CUSTOM" ? editCustomDepartment.trim() : editDepartment.trim();
    return (
      editName.trim() !== (editEmployee.name || "") ||
      editEmail.trim() !== (editEmployee.email || "") ||
      editEmployeeId.trim() !== (editEmployee.employeeId || "") ||
      finalEditDept !== (editEmployee.department || "") ||
      editRoleId !== (editEmployee.roleId || "")
    );
  }, [editEmployee, editName, editEmail, editEmployeeId, editDepartment, editCustomDepartment, editRoleId]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const finalEditDept = editDepartment === "CUSTOM" ? editCustomDepartment.trim() : editDepartment.trim();

    if (
      !editName.trim() ||
      !editEmail.trim() ||
      !editEmployeeId.trim() ||
      !finalEditDept ||
      !editRoleId
    ) {
      setSubmitError("All fields are required.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const payload = {
        name: editName.trim(),
        email: editEmail.trim(),
        employeeId: editEmployeeId.trim(),
        department: finalEditDept,
        roleId: editRoleId,
      };

      const res = await fetch(`${API_URL}/api/employees/${editEmployee._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to update employee.",
        );
      }

      const updated = normalizeEmployee(await res.json());
      setEmployees((prev) =>
        prev.map((emp) => (emp._id === updated._id ? updated : emp)),
      );
      setEditModalOpen(false);
      setEditEmployee(null);
      setSubmitSuccess(`Employee ${updated.name} updated successfully!`);
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating employee:", error);
      setSubmitError(error.message || "Failed to update employee.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;
    try {
      const res = await fetch(`${API_URL}/api/employees/${employeeId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete employee");
      }
      setEmployees(employees.filter((item) => item._id !== employeeId));
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.message || "Failed to delete employee.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Employees</h2>
          <p className="text-sm text-slate-500">
            Manage employee profiles and assignments.
          </p>
        </div>
        <CanAccess permission="manage_users">
          <button
            onClick={() => {
              setShowForm((current) => !current);
              resetForm();
            }}
            className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900"
          >
            {showForm ? "Cancel" : "New Employee"}
          </button>
        </CanAccess>
      </div>

      {submitSuccess && (
        <div className="rounded-2xl bg-green-100 p-4 text-sm text-green-700">
          {submitSuccess}
        </div>
      )}

      {showForm && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Add New Employee
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Enter employee details. A welcome email with account setup link will
            be sent automatically.
          </p>

          {submitError && (
            <div className="mt-4 rounded-2xl bg-red-100 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Employee full name"
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="employee@example.com"
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Employee ID
              </span>
              <input
                value={formEmployeeId}
                onChange={(e) => setFormEmployeeId(e.target.value)}
                placeholder="e.g., EMP-001"
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Department
              </span>
              <select
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              >
                <option value="">Select Department</option>
                {dbDepartments.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
                <option value="CUSTOM">Custom department...</option>
              </select>
              {formDepartment === "CUSTOM" && (
                <input
                  required
                  value={formCustomDepartment}
                  onChange={(e) => setFormCustomDepartment(e.target.value)}
                  placeholder="e.g., Data Science"
                  disabled={submitting}
                  className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              )}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <select
                value={formRoleId}
                onChange={(e) => setFormRoleId(e.target.value)}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Add employee"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                disabled={submitting}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="search"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Search employees by name, email or ID"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 md:max-w-md"
          />
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2 mr-2">
              {/* <button className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900">
                All
              </button>
              <button className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900">
                Active
              </button>
              <button className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900">
                On Leave
              </button> */}
            </div>
            <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 text-sm rounded-2xl ${viewMode === "grid" ? "bg-yellow-400 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-100"}`}
                aria-pressed={viewMode === "grid"}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`ml-1 px-3 py-2 text-sm rounded-2xl ${viewMode === "list" ? "bg-yellow-400 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-100"}`}
                aria-pressed={viewMode === "list"}
              >
                List
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
              Loading employees...
            </div>
          ) : pageItems.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
              No employees found.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {pageItems.map((employee) => (
                <div
                  key={employee._id || employee.employeeId || employee.email}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm min-w-0 transition hover:shadow-md"
                >
                  {/* Grid Edit Button on Hover */}
                  <CanAccess permission="manage_users">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(employee)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl bg-yellow-100 p-2 text-xs font-bold text-yellow-800 hover:bg-yellow-200 shadow-sm"
                      title="Edit Employee"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </CanAccess>

                  <div
                    className={`mx-auto h-16 w-16 rounded-full ${getAvatarColor(employee)} flex items-center justify-center text-white font-semibold text-xl`}
                  >
                    {employee.name
                      ? employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                      : "—"}
                  </div>
                  <div className="mt-3 min-w-0 text-center">
                    <div
                      className="text-sm font-semibold text-slate-900 truncate"
                      title={employee.name || ""}
                    >
                      {employee.name || "—"}
                    </div>
                    <div
                      className="text-xs text-slate-500 truncate"
                      title={employee.department || ""}
                    >
                      {employee.department || "—"}
                    </div>
                    <div
                      className="text-xs capitalize text-slate-500 truncate"
                      title={employee.roleName || ""}
                    >
                      {employee.roleName || "—"}
                    </div>
                    <div
                      className="text-xs text-slate-400 mt-1 truncate"
                      title={employee.employeeId || ""}
                    >
                      ID: {employee.employeeId || "—"}
                    </div>
                    <div
                      className="text-xs text-slate-400 mt-1 truncate"
                      title={employee.email || ""}
                    >
                      {employee.email || "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Name
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Email
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Employee ID
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Department
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Role
                    </th>
                    <th className="px-4 py-4 text-right text-sm font-semibold text-slate-700">
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
                      <td className="px-4 py-4 text-sm text-slate-900">
                        {employee.name || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {employee.email || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {employee.employeeId || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {employee.department || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm capitalize text-slate-500">
                        {employee.roleName || "—"}
                      </td>
                      <td className="px-4 py-4 text-right text-sm">
                        <CanAccess permission="manage_users">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(employee)}
                              className="rounded-xl bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-800 hover:bg-yellow-200 transition"
                            >
                              Edit
                            </button>
                            {employee.email?.toLowerCase() !==
                              "admin@test.com" && (
                              <button
                                type="button"
                                onClick={() => handleDelete(employee._id)}
                                className="rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-200"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </CanAccess>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {pageItems.length} of {filteredEmployees.length} employees
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index + 1)}
                  className={`rounded-2xl px-4 py-2 text-sm ${page === index + 1 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {editModalOpen &&
        editEmployee &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-black">
              {/* Header */}
              <div className="bg-black px-6 py-5 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-lg">Edit Employee</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modify profile details and user permissions
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditEmployee(null);
                    setSubmitError("");
                  }}
                  className="text-slate-400 hover:text-white rounded-full p-1 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                {submitError && (
                  <div className="rounded-2xl bg-red-100 p-4 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Name
                  </span>
                  <input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Employee full name"
                    disabled={submitting}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Email
                  </span>
                  {editEmployee.email?.toLowerCase() === "admin@test.com" ? (
                    <input
                      disabled
                      value={editEmail}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 px-4 py-2 text-sm cursor-not-allowed outline-none"
                    />
                  ) : (
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="employee@example.com"
                      disabled={submitting}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                    />
                  )}
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Employee ID
                  </span>
                  {editEmployee.email?.toLowerCase() === "admin@test.com" ? (
                    <input
                      disabled
                      value={editEmployeeId}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 px-4 py-2 text-sm cursor-not-allowed outline-none"
                    />
                  ) : (
                    <input
                      required
                      value={editEmployeeId}
                      onChange={(e) => setEditEmployeeId(e.target.value)}
                      placeholder="e.g., EMP-001"
                      disabled={submitting}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                    />
                  )}
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Department
                  </span>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    disabled={submitting}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                  >
                    <option value="">Select Department</option>
                    {dbDepartments.map((dep) => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                    {!dbDepartments.includes(editDepartment) && editDepartment !== "CUSTOM" && editDepartment !== "" && (
                      <option value={editDepartment}>{editDepartment}</option>
                    )}
                    <option value="CUSTOM">Custom department...</option>
                  </select>
                  {editDepartment === "CUSTOM" && (
                    <input
                      required
                      value={editCustomDepartment}
                      onChange={(e) => setEditCustomDepartment(e.target.value)}
                      placeholder="e.g., Data Science"
                      disabled={submitting}
                      className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                    />
                  )}
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Role
                  </span>
                  {editEmployee.email?.toLowerCase() === "admin@test.com" ? (
                    <div className="mt-2">
                      <select
                        disabled
                        value={editRoleId}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 px-4 py-2.5 text-sm cursor-not-allowed outline-none"
                      >
                        <option value={editRoleId}>
                          {editEmployee.roleName || "Admin"}
                        </option>
                      </select>
                      <p className="mt-1 text-[10px] text-red-400 font-medium">
                        Seeded Admin role cannot be demoted directly.
                      </p>
                    </div>
                  ) : (
                    <select
                      required
                      value={editRoleId}
                      onChange={(e) => setEditRoleId(e.target.value)}
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
                  )}
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !hasEmployeeChanges}
                    className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditEmployee(null);
                      setSubmitError("");
                    }}
                    disabled={submitting}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default AdminEmployees;
