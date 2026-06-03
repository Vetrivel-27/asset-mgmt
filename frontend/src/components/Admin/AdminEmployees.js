import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeEmployee = (employee) => ({
  ...employee,
  email: employee.email || employee.userId?.email || "",
  employeeId: employee.employeeId || employee.userId?.username || "",
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
  const [formRoleId, setFormRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
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
    if (
      !formName.trim() ||
      !formEmail.trim() ||
      !formEmployeeId.trim() ||
      !formDepartment.trim() ||
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
        department: formDepartment.trim(),
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

  const handleDelete = (employeeId) => {
    setEmployees(employees.filter((item) => item._id !== employeeId));
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
        <button
          onClick={() => {
            setShowForm((current) => !current);
            resetForm();
          }}
          className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900"
        >
          {showForm ? "Cancel" : "New Employee"}
        </button>
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
              <input
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                placeholder="e.g., IT, HR, Finance"
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              />
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
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {pageItems.map((employee) => (
                <div
                  key={employee._id || employee.employeeId || employee.email}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                >
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
                  <div className="mt-3">
                    <div className="text-sm font-medium text-slate-900">
                      {employee.name || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {employee.department || "—"}
                    </div>
                    <div className="text-xs capitalize text-slate-500">
                      {employee.roleName || "—"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      ID: {employee.employeeId || "—"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
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
                        <button
                          type="button"
                          onClick={() => handleDelete(employee._id)}
                          className="rounded-2xl bg-red-100 px-3 py-2 text-red-700 transition hover:bg-red-200"
                        >
                          Delete
                        </button>
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
    </div>
  );
}

export default AdminEmployees;
