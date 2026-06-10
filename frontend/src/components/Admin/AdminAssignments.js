import { useEffect, useState } from "react";
import { API_URL } from "../../config";
import CanAccess from "../CanAccess";
import { useMemo } from "react";

function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loadingFormOptions, setLoadingFormOptions] = useState(false);

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [tentativeReturnDate, setTentativeReturnDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const loadAssignments = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
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
    setLoadingFormOptions(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${token}` };
      const [assetsRes, employeesRes] = await Promise.all([
        fetch(`${API_URL}/api/assets`, { headers }),
        fetch(`${API_URL}/api/employees`, { headers }),
      ]);
      const assetsData = await assetsRes.json();
      const employeesData = await employeesRes.json();

      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error("Failed to load assignment options", error);
    } finally {
      setLoadingFormOptions(false);
    }
  };

  const handleToggleForm = () => {
    if (!showForm) {
      loadFormOptions();
    }
    setShowForm((prev) => !prev);
    resetForm();
  };

  const resetForm = () => {
    setSelectedAssetId("");
    setSelectedEmployeeId("");
    setTentativeReturnDate("");
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAssetId || !selectedEmployeeId) {
      setSubmitError("Asset and Employee are required fields.");
      return;
    }
    if (tentativeReturnDate) {
      const selectedDate = new Date(tentativeReturnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setSubmitError("Return date cannot be in the past.");
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assignments/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assetId: selectedAssetId,
          employeeId: selectedEmployeeId,
          tentativeReturnDate: tentativeReturnDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to assign asset.",
        );
      }

      setSubmitSuccess("Asset assigned successfully!");
      resetForm();
      setShowForm(false);
      await loadAssignments();
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err) {
      setSubmitError(err.message || "Failed to create assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Only show assets that are 'available' for assignment
  const availableAssets = assets.filter(
    (asset) => asset.status === "available",
  );

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const asset = typeof assignment.assetId === "object" ? assignment.assetId : null;
      const employee = typeof assignment.employeeId === "object" ? assignment.employeeId : null;

      const assetName = asset ? asset.name : assignment.assetName || "";
      const employeeName = employee ? employee.name : assignment.assignedTo || "";
      const assetCode = asset ? asset.assetId : "";

      const text = `${assetName} ${employeeName} ${assetCode}`.toLowerCase();
      const textMatches = text.includes(filter.toLowerCase());

      const isReturned = !!assignment.returnedDate;
      const status = isReturned ? "returned" : "active";

      const statusMatches = statusFilter === "all" ? true : status === statusFilter;

      return textMatches && statusMatches;
    });
  }, [assignments, filter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const currentPageAssignments = filteredAssignments.slice((page - 1) * pageSize, page * pageSize);
  
  // reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filter, statusFilter]);

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
          <button
            onClick={handleToggleForm}
            className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-yellow-350 transition"
          >
            {showForm ? "Cancel" : "New Assignment"}
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
            Create New Assignment
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Assign an available inventory asset to an employee.
          </p>

          {submitError && (
            <div className="mt-4 rounded-2xl bg-red-100 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {loadingFormOptions ? (
            <div className="mt-6 text-sm text-slate-500">
              Loading form options...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Select Asset
                </span>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                >
                  <option value="">Choose an available asset</option>
                  {availableAssets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name} ({asset.assetId})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Assign To (Employee)
                </span>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} (
                      {emp.employeeId || emp.userId?.userId || "No ID"})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Tentative Return Date (Optional)
                </span>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={tentativeReturnDate}
                  onChange={(e) => setTentativeReturnDate(e.target.value)}
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-yellow-350 disabled:opacity-50"
                >
                  {submitting ? "Assigning..." : "Assign Asset"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  disabled={submitting}
                  className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </form>
          )}
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
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-1/5 px-4 py-4 text-left text-sm font-semibold text-slate-700">
                    Asset
                  </th>
                  <th className="w-1/5 px-4 py-4 text-left text-sm font-semibold text-slate-700">
                    Assigned To
                  </th>
                  <th className="w-1/5 px-4 py-4 text-center text-sm font-semibold text-slate-700">
                    Assigned Date
                  </th>
                  <th className="w-1/5 px-4 py-4 text-center text-sm font-semibold text-slate-700">
                    Due Date
                  </th>
                  <th className="w-1/5 px-4 py-4 text-center text-sm font-semibold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentPageAssignments.map((assignment) => {
                  const asset =
                    typeof assignment.assetId === "object"
                      ? assignment.assetId
                      : null;
                  const employee =
                    typeof assignment.employeeId === "object"
                      ? assignment.employeeId
                      : null;

                  const assetName = asset
                    ? asset.name
                    : assignment.assetName || "—";
                  const assetCode = asset ? asset.assetId : "";
                  const employeeName = employee
                    ? employee.name
                    : assignment.assignedTo || "—";
                  const department = employee ? employee.department : "";

                  const isReturned = !!assignment.returnedDate;
                  const dueDate = assignment.tentativeReturnDate;

                  let statusText = "Active";
                  let badgeClass = "bg-blue-100 text-blue-700";
                  if (isReturned) {
                    statusText = "Returned";
                    badgeClass = "bg-green-100 text-green-700";
                  }

                  return (
                    <tr key={assignment._id || assignment.id}>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-semibold text-slate-900">
                          {assetName}
                        </div>
                        {assetCode && (
                          <div className="text-xs text-slate-500">
                            ID: {assetCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-medium text-slate-900">
                          {employeeName}
                        </div>
                        {department && (
                          <div className="text-xs text-slate-500">
                            {department}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-500">
                        {assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-500">
                        {dueDate ? new Date(dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                        >
                          {statusText}
                        </span>
                        {isReturned && (
                          <div className="mt-1 text-[10px] text-slate-400 font-medium">
                            {new Date(assignment.returnedDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {currentPageAssignments.length} of {filteredAssignments.length} assignments
            </p>

            <div className="flex items-center gap-2">
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index + 1)}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                    page === index + 1
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
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

export default AdminAssignments;
