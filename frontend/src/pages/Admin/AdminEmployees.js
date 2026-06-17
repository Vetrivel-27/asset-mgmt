import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { employeeService } from "../../services/employeeService";
import CanAccess from "../../components/common/CanAccess";
import BulkUploadForm from "../../components/Admin/BulkUploadForm";
import EmployeeForm from "../../components/Admin/forms/EmployeeForm";
import Pagination from "../../components/ui/Pagination";
import AdminEmployeesTable from "../../components/Admin/AdminEmployeesTable";
import { useTableSort } from "../../hooks/useTableSort";
import { usePagination } from "../../hooks/usePagination";

const normalizeUser = (user) => {
  const profile = user.employeeProfile || {};
  return {
    ...user,
    _id: user._id,
    name: user.displayName || "—",
    email: user.email || "",
    roleId: user.role?._id || "",
    roleName: user.role?.name || "",
    employeeId: profile.employeeId || "—",
    department: profile.department || "—",
    assetsBorrowedCount: user.assetsBorrowedCount || 0
  };
};

function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [roles, setRoles] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => setSubmitError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => setSubmitSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  // Edit Employee States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);

  // Delete Employee States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const dbDepartments = useMemo(() => {
    const deps = new Set(employees.map((emp) => emp.department).filter(Boolean));
    return Array.from(deps).sort();
  }, [employees]);



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

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const [data, rolesData] = await Promise.all([
        employeeService.getAll(),
        employeeService.getRoles(),
      ]);
      setEmployees(Array.isArray(data) ? data.map(normalizeUser) : []);
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
      }
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (editModalOpen) {
          setEditModalOpen(false);
          setEditEmployee(null);
          setSubmitError("");
        }
        if (deleteModalOpen) {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editModalOpen, deleteModalOpen]);

  const filteredEmployees = useMemo(() => {
    const term = filter.toLowerCase();
    return employees.filter((employee) => {
      return (
        employee.name?.toLowerCase().includes(term) ||
        employee.email?.toLowerCase().includes(term) ||
        employee.employeeId?.toLowerCase().includes(term) ||
        employee.roleName?.toLowerCase().includes(term)
      );
    });
  }, [employees, filter]);

  const { items: sortedEmployees, requestSort, sortConfig } = useTableSort(filteredEmployees, { key: 'name', direction: 'asc' });

  const {
    page, pageCount, pageItems, setPage,
    canPrev, canNext, prev, next,
  } = usePagination({ data: sortedEmployees, pageSize: 8, resetDeps: [filter] });

  const handleCreateSubmit = async (formData) => {
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const data = await employeeService.create(formData);
      const newEmployee = normalizeUser(data);
      setEmployees((currentEmployees) => [newEmployee, ...currentEmployees]);
      setSubmitSuccess(
        `User/Employee ${formData.name} created successfully! A welcome email has been sent.`,
      );
      setShowForm(false);
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (error) {
      throw error;
    }
  };

  const handleOpenEdit = (employee) => {
    setEditEmployee(employee);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (formData) => {
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const data = await employeeService.update(editEmployee._id, formData);
      const updated = normalizeUser(data);
      setEmployees((prev) =>
        prev.map((emp) => (emp._id === updated._id ? updated : emp)),
      );
      setEditModalOpen(false);
      setEditEmployee(null);
      setSubmitSuccess(`Employee ${updated.name} updated successfully!`);
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await employeeService.delete(employeeToDelete._id);
      setEmployees(employees.filter((item) => item._id !== employeeToDelete._id));
      setSubmitSuccess(`Employee "${employeeToDelete.name}" removed successfully.`);
      setTimeout(() => setSubmitSuccess(""), 3000);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      setSubmitError(error.message || "Failed to delete employee.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Users</h2>
          <p className="text-sm text-slate-500">
            Manage user profiles and assignments.
          </p>
        </div>
        <CanAccess permission="manage_users">
          <div className="flex items-center gap-3">
            <Button
              variant="subtle"
              onClick={() => {
                setShowBulkUpload((prev) => !prev);
                setShowForm(false);
              }}
            >
              {showBulkUpload ? "Cancel" : "Bulk Upload"}
            </Button>
            <Button
              onClick={() => {
                setShowForm((current) => !current);
                setShowBulkUpload(false);
              }}
            >
              {showForm ? "Cancel" : "New User"}
            </Button>
          </div>
        </CanAccess>
      </div>

      <BulkUploadForm 
        open={showBulkUpload} 
        onClose={() => setShowBulkUpload(false)} 
        onSuccess={() => {
          loadEmployees();
        }} 
        type="employees" 
      />

      {submitSuccess && (
        <div className="rounded-2xl bg-green-100 p-4 text-sm text-green-700">
          {submitSuccess}
        </div>
      )}

      {submitError && !showForm && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm">
          ⚠ {submitError}
        </div>
      )}

      {showForm && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Add New User
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Enter user details. A welcome email with account setup link will
            be sent automatically.
          </p>

          {submitError && (
            <div className="mt-4 rounded-2xl bg-red-100 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="mt-5">
            <EmployeeForm
              departments={dbDepartments}
              roles={roles}
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowForm(false)}
              layout="grid"
            />
          </div>
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
            placeholder="Search users by name, email, ID or role"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 md:max-w-md"
          />
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2 mr-2">
              {/* Filter tags could go here */}
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
              Loading Users...
            </div>
          ) : pageItems.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
              No Users found.
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
                    >
                      {employee.name || "—"}
                    </div>
                    <div
                      className="text-xs text-slate-500 truncate"
                    >
                      {employee.department || "—"}
                    </div>
                    <div
                      className="text-xs capitalize text-slate-500 truncate"
                    >
                      {employee.roleName || "—"}
                    </div>
                    <div
                      className="text-xs text-slate-400 mt-1 truncate"
                    >
                      ID: {employee.employeeId || "—"}
                    </div>
                    <div
                      className="text-xs text-slate-400 mt-1 truncate"
                    >
                      {employee.email || "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmployeesTable 
              pageItems={pageItems}
              sortConfig={sortConfig}
              requestSort={requestSort}
              handleOpenEdit={handleOpenEdit}
              handleDeleteClick={handleDeleteClick}
            />
          )}
        </div>

        {!loading && (
          <Pagination
            page={page} pageCount={pageCount} setPage={setPage}
            canPrev={canPrev} canNext={canNext} prev={prev} next={next}
            showing={pageItems.length} total={filteredEmployees.length}
            label="user"
          />
        )}
      </div>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={editModalOpen && !!editEmployee}
        onClose={() => {
          setEditModalOpen(false);
          setEditEmployee(null);
          setSubmitError("");
        }}
        title="Edit Employee"
        subtitle="Modify profile details and user permissions"
        headerTheme="dark"
      >
        <div className="p-1">
          <EmployeeForm
            initialData={editEmployee}
            departments={dbDepartments}
            roles={roles}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setEditModalOpen(false);
              setEditEmployee(null);
            }}
            layout="stack"
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen && !!employeeToDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
        title="Delete Employee"
        message="Are you sure you want to permanently delete this employee?"
        details={employeeToDelete ? [
          { label: "Name", value: employeeToDelete.name },
          { label: "Email", value: employeeToDelete.email },
          { label: "Employee ID", value: employeeToDelete.employeeId, mono: true },
          { label: "Department", value: employeeToDelete.department || "—", capitalize: true },
        ] : []}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default AdminEmployees;
