import { useEffect, useState } from "react";
import { assignmentService } from "../../services/assignmentService";
import { assetService } from "../../services/assetService";
import { employeeService } from "../../services/employeeService";
import CanAccess from "../../components/common/CanAccess";
import { useMemo } from "react";
import { useTableSort } from "../../hooks/useTableSort";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import AssignmentForm from "../../components/Admin/forms/AssignmentForm";
import AdminAssignmentsTable from "../../components/Admin/AdminAssignmentsTable";

function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadAssignments = async () => {
    try {
      const data = await assignmentService.getAll();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load assignments", error);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadAssignments();
      setLoading(false);
    }
    init();
  }, []);

  const loadFormOptions = async () => {
    try {
      const [assetsData, usersData] = await Promise.all([
        assetService.getAvailable(),
        employeeService.getAll(),
      ]);

      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error("Failed to load assignment options", error);
    }
  };

  const handleToggleForm = () => {
    if (!showForm) {
      loadFormOptions();
    }
    setShowForm((prev) => !prev);
  };

  const handleCreateSubmit = async (formData) => {
    setSubmitSuccess("");

    try {
      await assignmentService.create(formData);
      setSubmitSuccess("Asset successfully assigned!");
      setShowForm(false);
      loadAssignments();
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err) {
      throw err;
    }
  };

  // Assets fetched via getAvailable() are already available.
  const availableAssets = assets;

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const asset = typeof assignment.assetId === "object" ? assignment.assetId : null;
      const user = typeof assignment.userId === "object" ? assignment.userId : null;

      const assetName = asset ? asset.name : assignment.assetName || "";
      const employeeName = user ? user.displayName : assignment.assignedTo || "";
      const assetCode = asset ? asset.assetId : "";

      const text = `${assetName} ${employeeName} ${assetCode}`.toLowerCase();
      const textMatches = text.includes(filter.toLowerCase());

      const isReturned = !!assignment.returnedDate;
      const status = isReturned ? "returned" : "active";

      const statusMatches = statusFilter === "all" ? true : status === statusFilter;

      return textMatches && statusMatches;
    });
  }, [assignments, filter, statusFilter]);

  const { items: sortedAssignments, requestSort, sortConfig } = useTableSort(filteredAssignments, { key: 'assignedDate', direction: 'desc' });

  const {
    page, pageCount, pageItems: currentPageAssignments, setPage,
    canPrev, canNext, prev, next,
  } = usePagination({ data: sortedAssignments, pageSize: 6, resetDeps: [filter, statusFilter] });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Assignments</h2>
          <p className="text-sm text-slate-500">
            View current asset assignments and return status.
          </p>
        </div>
        <CanAccess permission="assign_asset">
          <Button onClick={handleToggleForm}>
            {showForm ? "Cancel" : "New Assignment"}
          </Button>
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
            Create New Assignment
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Assign an available inventory asset to an employee.
          </p>

            <AssignmentForm
              availableAssets={availableAssets}
              users={users}
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowForm(false)}
            />
        </div>
      )}

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search assignments by asset or employee..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 md:max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "returned", label: "Returned" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`rounded-2xl border px-4 py-2.5 text-xs font-semibold tracking-wider transition ${
                  statusFilter === btn.id
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
            Loading assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
            No assignments found.
          </div>
        ) : (
          <AdminAssignmentsTable 
            currentPageAssignments={currentPageAssignments}
            sortConfig={sortConfig}
            requestSort={requestSort}
          />
        )}

        {/* Pagination */}
        <Pagination
          page={page} pageCount={pageCount} setPage={setPage}
          canPrev={canPrev} canNext={canNext} prev={prev} next={next}
          showing={currentPageAssignments.length} total={filteredAssignments.length}
          label="assignments"
        />
      </div>
    </div>
  );
}

export default AdminAssignments;
