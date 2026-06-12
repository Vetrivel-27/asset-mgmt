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

  const [sortConfig, setSortConfig] = useState({ key: "assignedDate", direction: "desc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    const isAsc = isActive && sortConfig.direction === "asc";
    const isDesc = isActive && sortConfig.direction === "desc";

    return (
      <svg className="ml-1.5 w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L8 10H16L12 4Z" fill="currentColor" className={isAsc ? "text-slate-800" : "text-slate-300"} />
        <path d="M12 20L16 14H8L12 20Z" fill="currentColor" className={isDesc ? "text-slate-800" : "text-slate-300"} />
      </svg>
    );
  };

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

  const heatmapData = useMemo(() => {
    const today = new Date();
    const days = [];
    const dayOfWeek = today.getDay();
    const totalDays = 26 * 7; // Approx 6 months
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1 + (6 - dayOfWeek));

    const counts = {};
    assignments.forEach((asg) => {
      const dateStr = asg.assignedDate 
        ? asg.assignedDate.split("T")[0] 
        : (asg.createdAt ? asg.createdAt.split("T")[0] : "");
      if (dateStr) {
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });

    for (let i = 0; i < totalDays; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const dd = String(current.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const count = counts[dateStr] || 0;
      days.push({
        date: dateStr,
        count,
        dayOfWeek: current.getDay(),
      });
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [assignments]);

  const monthsGrouped = useMemo(() => {
    const groups = [];
    let currentGroup = null;
    heatmapData.forEach((week) => {
      if (week.length === 0) return;
      const firstDayDate = new Date(week[0].date);
      const yearMonthKey = `${firstDayDate.getFullYear()}-${firstDayDate.getMonth()}`;
      const monthName = firstDayDate.toLocaleDateString(undefined, { month: "short" });
      
      if (!currentGroup || currentGroup.key !== yearMonthKey) {
        currentGroup = {
          key: yearMonthKey,
          monthName,
          weeks: []
        };
        groups.push(currentGroup);
      }
      currentGroup.weeks.push(week);
    });
    return groups;
  }, [heatmapData]);

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

  const sortedAssignments = useMemo(() => {
    let sortableItems = [...filteredAssignments];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue;
        let bValue;
        const getAsset = (asg) => typeof asg.assetId === 'object' ? asg.assetId : null;
        const getEmp = (asg) => typeof asg.employeeId === 'object' ? asg.employeeId : null;
        const getCreator = (asg) => typeof asg.createdBy === 'object' && asg.createdBy !== null ? (asg.createdBy.name || asg.createdBy.email || asg.createdBy.userId) : "";

        switch (sortConfig.key) {
          case 'assetName':
            aValue = getAsset(a) ? getAsset(a).name : a.assetName || "";
            bValue = getAsset(b) ? getAsset(b).name : b.assetName || "";
            break;
          case 'assignedTo':
            aValue = getEmp(a) ? getEmp(a).name : a.assignedTo || "";
            bValue = getEmp(b) ? getEmp(b).name : b.assignedTo || "";
            break;
          case 'assignedBy':
            aValue = getCreator(a);
            bValue = getCreator(b);
            break;
          case 'assignedDate':
            aValue = new Date(a.assignedDate || 0).getTime();
            bValue = new Date(b.assignedDate || 0).getTime();
            break;
          case 'dueDate':
            aValue = new Date(a.tentativeReturnDate || 0).getTime();
            bValue = new Date(b.tentativeReturnDate || 0).getTime();
            break;
          case 'status':
            aValue = !!a.returnedDate ? "Returned" : "Active";
            bValue = !!b.returnedDate ? "Returned" : "Active";
            break;
          default:
            aValue = "";
            bValue = "";
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredAssignments, sortConfig]);

  const pageCount = Math.max(1, Math.ceil(sortedAssignments.length / pageSize));
  const currentPageAssignments = sortedAssignments.slice((page - 1) * pageSize, page * pageSize);
  
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left panel: Form */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Create New Assignment
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Assign an available inventory asset to an employee.
              </p>

              {submitError && (
                <div className="mt-4 rounded-2xl bg-red-100 p-4 text-sm text-red-700 animate-shake">
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
          </div>

          {/* Right panel: Heatmap */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Assignment Frequency
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Visualizing asset distribution patterns over the past 6 months.
              </p>
              
              <div className="mt-6 flex flex-col gap-3">
                {/* Heatmap Grid (Split by Month) */}
                <div className="flex gap-4 overflow-x-auto pb-3 pt-2">
                  {monthsGrouped.map((group, gIndex) => (
                    <div key={group.key || gIndex} className="flex flex-col gap-1.5 flex-shrink-0">
                      {/* Month Label */}
                      <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                        {group.monthName}
                      </span>
                      {/* Weeks in this Month */}
                      <div className="flex gap-[3px]">
                        {group.weeks.map((week, wIndex) => (
                          <div key={wIndex} className="flex flex-col gap-[3px]">
                            {week.map((day, dIndex) => {
                              let colorClass = "bg-slate-100 hover:bg-slate-200";
                              if (day.count === 1) colorClass = "bg-green-200 hover:bg-green-300";
                              else if (day.count === 2) colorClass = "bg-green-400 hover:bg-green-500";
                              else if (day.count === 3) colorClass = "bg-green-600 hover:bg-green-700";
                              else if (day.count >= 4) colorClass = "bg-green-800 hover:bg-green-900";

                              return (
                                <div
                                  key={dIndex}
                                  className={`w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-[2px] transition-colors cursor-pointer ${colorClass}`}
                                  title={`${day.count} assignment${day.count === 1 ? "" : "s"} on ${new Date(day.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 mt-2">
                  <div className="flex gap-4">
                    <span>{assignments.length} total assignments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Less</span>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-green-200" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-green-400" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-green-600" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-green-800" />
                    <span>More</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
              Hover over cells to see assignment volume on specific dates.
            </div>
          </div>
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
                  <th 
                    onClick={() => handleSort("assetName")}
                    className="w-1/6 px-4 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  >
                    Asset <SortIcon columnKey="assetName" />
                  </th>
                  <th 
                    onClick={() => handleSort("assignedTo")}
                    className="w-1/6 px-4 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  >
                    Assigned To <SortIcon columnKey="assignedTo" />
                  </th>
                  <th 
                    onClick={() => handleSort("assignedBy")}
                    className="w-1/6 px-4 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  >
                    Assigned By <SortIcon columnKey="assignedBy" />
                  </th>
                  <th 
                    onClick={() => handleSort("assignedDate")}
                    className="w-1/6 px-4 py-4 text-center text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  >
                    Assigned Date <SortIcon columnKey="assignedDate" />
                  </th>
                  <th 
                    onClick={() => handleSort("dueDate")}
                    className="w-1/6 px-4 py-4 text-center text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  >
                    Due Date <SortIcon columnKey="dueDate" />
                  </th>
                  <th 
                    onClick={() => handleSort("status")}
                    className="w-1/6 px-4 py-4 text-center text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  >
                    Status <SortIcon columnKey="status" />
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
                  const assignedBy = typeof assignment.createdBy === "object" && assignment.createdBy !== null
                    ? (assignment.createdBy.name || assignment.createdBy.email || assignment.createdBy.userId)
                    : "—";

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
                      <td className="px-4 py-4 text-sm overflow-hidden">
                        <div className="font-semibold text-slate-900 truncate" title={assetName}>
                          {assetName}
                        </div>
                        {assetCode && (
                          <div className="text-xs text-slate-500 truncate" title={`ID: ${assetCode}`}>
                            ID: {assetCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm overflow-hidden">
                        <div className="font-medium text-slate-900 truncate" title={employeeName}>
                          {employeeName}
                        </div>
                        {department && (
                          <div className="text-xs text-slate-500 truncate" title={department}>
                            {department}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500 font-medium overflow-hidden">
                        <div className="truncate" title={assignedBy}>
                          {assignedBy}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-500">
                        <div>{assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString() : "—"}</div>
                        {assignment.assignedDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(assignment.assignedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-500">
                        <div>{dueDate ? new Date(dueDate).toLocaleDateString() : "—"}</div>
                        {dueDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-center">
                        <div className="relative inline-block group">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass} cursor-default`}
                          >
                            {statusText}
                          </span>
                          {isReturned && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-none group-hover:transition-all group-hover:duration-300 group-hover:delay-500 w-max bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl z-10 pointer-events-none">
                              {new Date(assignment.returnedDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          )}
                        </div>
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
