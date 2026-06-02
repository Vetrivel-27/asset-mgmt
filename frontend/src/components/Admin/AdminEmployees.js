import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("Staff");
  const [editingId, setEditingId] = useState(null);
  const pageSize = 8;

  useEffect(() => {
    let mounted = true;

    async function loadEmployees() {
      try {
        const res = await fetch(`${API_URL}/api/employees`);
        const data = await res.json();
        if (mounted) setEmployees(Array.isArray(data) ? data : []);
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
    setFormRole("Staff");
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const updatedEmployees = [...employees];
    const employeeData = {
      _id: editingId || Date.now().toString(),
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      assetsBorrowed: 0,
    };

    if (editingId) {
      const index = updatedEmployees.findIndex(
        (item) => item._id === editingId,
      );
      if (index >= 0) {
        updatedEmployees[index] = {
          ...updatedEmployees[index],
          ...employeeData,
        };
      }
    } else {
      updatedEmployees.unshift(employeeData);
    }

    setEmployees(updatedEmployees);
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (employee) => {
    setEditingId(employee._id);
    setFormName(employee.name || "");
    setFormEmail(employee.email || "");
    setFormRole(employee.role || "Staff");
    setShowForm(true);
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

      {showForm && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit Employee" : "Add New Employee"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Enter a name and contact email to create an employee profile.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Employee full name"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="employee@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              >
                <option>Staff</option>
                <option>Manager</option>
                <option>Support</option>
                <option>Administrator</option>
              </select>
            </label>
            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900"
              >
                {editingId ? "Save changes" : "Add employee"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
                  <div className="mx-auto h-16 w-16 rounded-full bg-yellow-400 flex items-center justify-center text-white font-semibold text-xl">
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
                      {employee.role || "Staff"}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
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
                      Role
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Assets Borrowed
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
                        {employee.role || "Staff"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {employee.assetsBorrowed ??
                          employee.assets?.length ??
                          0}
                      </td>
                      <td className="px-4 py-4 text-right text-sm space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(employee)}
                          className="rounded-2xl border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
                        >
                          Edit
                        </button>
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
