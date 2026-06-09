import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";
import { hasPermission } from "../../permissions";

function EmployeeHistory() {
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Sidebar / Logs Drawer State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        const token = sessionStorage.getItem("authToken");
        const fetchPromises = [
          fetch(`${API_URL}/api/assignments/my-assignments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/requests/my-requests`, { headers: { Authorization: `Bearer ${token}` } })
        ];

        const canViewDamage = hasPermission("view_damage");
        if (canViewDamage) {
          fetchPromises.push(
            fetch(`${API_URL}/api/reports/my-reports`, { headers: { Authorization: `Bearer ${token}` } })
          );
        }

        const responses = await Promise.all(fetchPromises);
        const assignmentsData = await responses[0].json();
        const requestsData = await responses[1].json();
        let reportsData = { reports: [] };
        if (canViewDamage && responses[2]) {
          reportsData = await responses[2].json();
        }

        if (!mounted) return;

        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        setRequests(requestsData.requests ? requestsData.requests : []);
        setReports(reportsData.reports ? reportsData.reports : []);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  // Merge active/returned assignments, rejected requests, and damage reports
  const combinedHistory = useMemo(() => {
    const assignmentRecords = assignments.map((assignment) => {
      const asset = (typeof assignment.assetId === "object" && assignment.assetId !== null) ? assignment.assetId : {};
      return {
        ...assignment,
        asset,
        recordType: 'assignment',
        dateSort: new Date(assignment.assignedDate).getTime()
      };
    });

    const rejectedRecords = requests.filter(r => r.status === 'rejected').map((req) => {
      const asset = (typeof req.requestedAssetId === "object" && req.requestedAssetId !== null) ? req.requestedAssetId : { name: req.assetType };
      return {
        ...req,
        asset,
        recordType: 'rejected_request',
        dateSort: new Date(req.updatedAt || req.createdAt).getTime()
      };
    });

    const reportRecords = reports.map((report) => {
      const asset = (typeof report.assetId === "object" && report.assetId !== null) ? report.assetId : {};
      return {
        ...report,
        asset,
        recordType: 'damage_report',
        dateSort: new Date(report.createdAt).getTime()
      };
    });

    return [...assignmentRecords, ...rejectedRecords, ...reportRecords].sort((a, b) => b.dateSort - a.dateSort);
  }, [assignments, requests, reports]);

  const filteredHistory = useMemo(() => {
    const term = search.toLowerCase();
    return combinedHistory.filter((record) => {
      if (typeFilter !== "all") {
        if (typeFilter === "assigned" && (record.recordType !== "assignment" || !!record.returnedDate)) return false;
        if (typeFilter === "returned" && (record.recordType !== "assignment" || !record.returnedDate)) return false;
        if (typeFilter === "rejected" && record.recordType !== "rejected_request") return false;
        if (typeFilter === "reports" && record.recordType !== "damage_report") return false;
      }

      const name = record.asset?.name?.toLowerCase() || record.assetType?.toLowerCase() || "";
      const id = String(record.asset?.assetId || "");
      return name.includes(term) || id.includes(term);
    });
  }, [combinedHistory, search, typeFilter]);

  const stats = useMemo(() => {
    const total = combinedHistory.filter(r => r.recordType === 'assignment').length;
    const returned = combinedHistory.filter((r) => r.recordType === 'assignment' && !!r.returnedDate).length;
    const currentlyOwning = combinedHistory.filter((r) => r.recordType === 'assignment' && !r.returnedDate).length;
    const damageReports = combinedHistory.filter(r => r.recordType === 'damage_report').length;
    return { total, returned, currentlyOwning, damageReports };
  }, [combinedHistory]);

  const statusLabel = (record) => {
    if (record.recordType === 'rejected_request')
      return { text: "Rejected", classes: "bg-red-100 text-red-700 border-red-200" };
    if (record.recordType === 'damage_report') {
      if (record.status === 'open') return { text: "Report Open", classes: "bg-amber-100 text-amber-700 border-amber-200" };
      if (record.status === 'in_progress') return { text: "In Progress", classes: "bg-blue-100 text-blue-700 border-blue-200" };
      return { text: "Resolved", classes: "bg-green-100 text-green-700 border-green-200" };
    }
    if (record.returnedDate)
      return { text: "Returned", classes: "bg-green-100 text-green-700 border-green-200" };
    return { text: "Active", classes: "bg-blue-100 text-blue-700 border-blue-200" };
  };

  return (
    <div className="relative space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Asset History
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl">
            A complete log of your borrowed assets, approval histories, return records, and current statuses.
          </p>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 w-full lg:w-auto">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Borrowed
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-orange-400">
              {stats.total}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Returned
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-500">
              {stats.returned}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Currently Owning
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-500">
              {stats.currentlyOwning}
            </p>
          </div>
          {hasPermission("view_damage") && (
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                Damage Reports
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-yellow-500">
                {stats.damageReports}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Your History Logs
            </p>
            <p className="text-xs text-slate-500 max-w-2xl">
              Click any record row below to view detailed approval details and borrow logs.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row w-full lg:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-yellow-400"
            >
              <option value="all">All records</option>
              <option value="assigned">Assigned assets</option>
              <option value="returned">Returned assets</option>
              <option value="rejected">Requests declined</option>
              {hasPermission("view_damage") && (
                <option value="reports">Reported damages</option>
              )}
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets or IDs..."
              className="w-full lg:w-80 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl bg-slate-50 py-16 text-center text-slate-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
              <p className="mt-4 text-sm font-semibold text-slate-500">Loading history logs...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 py-16 text-center text-slate-500">
              <p className="font-semibold">No history records found.</p>
              <p className="text-xs text-slate-400 mt-1">Submit a borrow request or adjust your search filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                        Asset Name
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                        Asset ID
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                        Date
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                        Returned Date
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredHistory.map((record) => {
                      const status = statusLabel(record);
                      return (
                        <tr
                          key={record._id || record.assetId || record.asset?._id}
                          onClick={() => {
                            setSelectedRecord(record);
                            setSidebarOpen(true);
                          }}
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-slate-900">
                            {record.asset?.name || record.assetType || "Unknown asset"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {record.asset?.assetId || "—"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {record.recordType === 'assignment' && record.assignedDate
                              ? new Date(record.assignedDate).toLocaleDateString()
                              : record.recordType === 'rejected_request' || record.recordType === 'damage_report'
                                ? new Date(record.createdAt).toLocaleDateString() 
                                : "—"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {record.returnedDate
                              ? new Date(record.returnedDate).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${status.classes}`}
                            >
                              {status.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="grid gap-4 md:hidden">
                {filteredHistory.map((record) => {
                  const status = statusLabel(record);
                  return (
                    <div
                      key={record._id || record.assetId || record.asset?._id}
                      onClick={() => {
                        setSelectedRecord(record);
                        setSidebarOpen(true);
                      }}
                      className="cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm hover:border-yellow-400 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {record.asset?.name || record.assetType || "Unknown asset"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ID: {record.asset?.assetId || "—"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold border ${status.classes}`}
                        >
                          {status.text}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                          <p className="text-xs text-slate-400 font-medium">
                            {record.recordType === 'rejected_request' ? "Requested" : record.recordType === 'damage_report' ? "Reported" : "Borrowed"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-700">
                            {record.recordType === 'assignment' && record.assignedDate
                              ? new Date(record.assignedDate).toLocaleDateString()
                              : record.recordType === 'rejected_request' || record.recordType === 'damage_report'
                                ? new Date(record.createdAt).toLocaleDateString() 
                                : "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                          <p className="text-xs text-slate-400 font-medium">Return</p>
                          <p className="mt-1 text-xs font-bold text-slate-700">
                            {record.returnedDate
                              ? new Date(record.returnedDate).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Sidebar Drawer for Log Details */}
      {sidebarOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => {
              setSidebarOpen(false);
              setSelectedRecord(null);
            }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Drawer Body */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-lg">Borrow & Approval Log</h3>
                <p className="text-xs text-slate-400 mt-0.5">Detailed history trace of the asset</p>
              </div>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setSelectedRecord(null);
                }}
                className="text-slate-400 hover:text-white rounded-full p-1.5 hover:bg-slate-800 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Asset Snapshot Card */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Asset Information</p>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{selectedRecord.asset?.name || "Unknown Asset"}</h4>
                  <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">{selectedRecord.asset?.type || "General"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block">Asset ID</label>
                    <span className="text-xs font-bold text-slate-700">{selectedRecord.asset?.assetId || "—"}</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block">Current Status</label>
                    <span className="text-xs font-bold text-slate-700 capitalize">{selectedRecord.asset?.status || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Approval Details Log or Report Details */}
              {selectedRecord.recordType === 'damage_report' ? (
                <>
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Report Details</p>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Report Type</p>
                        <p className="text-sm font-bold text-slate-800 capitalize">{selectedRecord.type || "General"}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Message / Details</p>
                        <p className="text-sm text-slate-700">{selectedRecord.message || "No message specified."}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Logs & History Trace</p>
                    <div className="relative border-l border-slate-200 pl-5 ml-2 space-y-6">
                      <div className="relative">
                        <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-400 ring-4 ring-white"></span>
                        <p className="text-xs font-bold text-slate-800">Report Submitted</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Submitted by you on {new Date(selectedRecord.createdAt).toLocaleString()}.
                        </p>
                      </div>

                      {(selectedRecord.status === 'in_progress' || selectedRecord.status === 'resolved') && (
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white"></span>
                          <p className="text-xs font-bold text-blue-700">Maintenance In Progress</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Report is being reviewed and the asset is undergoing maintenance.
                          </p>
                        </div>
                      )}

                      {selectedRecord.status === 'resolved' && (
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white"></span>
                          <p className="text-xs font-bold text-emerald-700">Report Resolved</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Issue resolved. The asset has been set back to available.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approval Details</p>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700 text-sm font-bold">
                          {(selectedRecord.createdBy?.userId || "Admin").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Approved By</p>
                          <p className="text-sm font-bold text-slate-800">{selectedRecord.createdBy?.userId || "System Admin"}</p>
                        </div>
                      </div>
                      {selectedRecord.createdBy?.email && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Approver Email</p>
                          <p className="text-xs font-semibold text-slate-700 break-all">{selectedRecord.createdBy?.email}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Logs & History Trace</p>
                    <div className="relative border-l border-slate-200 pl-5 ml-2 space-y-6">
                      <div className="relative">
                        <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-400 ring-4 ring-white"></span>
                        <p className="text-xs font-bold text-slate-800">Borrow Request Submitted</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Submitted by you for approval on {new Date(selectedRecord.createdAt || selectedRecord.assignedDate).toLocaleDateString()}.
                        </p>
                      </div>

                      {selectedRecord.recordType === 'rejected_request' ? (
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-4 ring-white"></span>
                          <p className="text-xs font-bold text-red-700">Request Rejected</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            This request was rejected. The asset may no longer be available.
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white"></span>
                          <p className="text-xs font-bold text-emerald-700">Request Approved & Assigned</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Approved by <span className="font-semibold text-slate-700">{selectedRecord.createdBy?.userId || "System Admin"}</span> on{" "}
                            {selectedRecord.assignedDate ? new Date(selectedRecord.assignedDate).toLocaleString() : "—"}.
                          </p>
                          {selectedRecord.tentativeReturnDate && (
                            <p className="text-[11px] font-semibold text-amber-600 mt-1">
                              Tentative return date: {new Date(selectedRecord.tentativeReturnDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {selectedRecord.returnedDate && (
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white"></span>
                          <p className="text-xs font-bold text-blue-700">Asset Returned</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Returned and checked back in on{" "}
                            {new Date(selectedRecord.returnedDate).toLocaleString()}.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-6 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setSelectedRecord(null);
                }}
                className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Close Logs Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeHistory;
