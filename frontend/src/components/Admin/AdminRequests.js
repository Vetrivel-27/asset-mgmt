import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../config";
import { createPortal } from "react-dom";
import SortableHeader from "../SortableHeader";
import Pagination from "../Pagination";
import { useTableSort } from "../../hooks/useTableSort";
import { usePagination } from "../../hooks/usePagination";

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");

  // Approval Modal State
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Success / Error Feedback
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load requests
  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load requests.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Load available assets for assignment when approving
  const loadAvailableAssets = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assets?status=available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        // Backend /api/assets returns { assets: [...] }
        const assetsList = data.assets || data;
        setAvailableAssets(Array.isArray(assetsList) ? assetsList : []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const refreshData = useCallback(async (silent = false) => {
    await Promise.all([loadRequests(silent), loadAvailableAssets()]);
  }, [loadRequests, loadAvailableAssets]);

  useEffect(() => {
    refreshData(false);

    const handleStatusChange = () => {
      refreshData(true);
    };

    window.addEventListener("request_status_changed", handleStatusChange);

    const intervalId = setInterval(() => {
      refreshData(true);
    }, 30000); // Poll every 30 seconds

    return () => {
      window.removeEventListener("request_status_changed", handleStatusChange);
      clearInterval(intervalId);
    };
  }, [refreshData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && approveModalOpen) {
        setApproveModalOpen(false);
        setSelectedRequest(null);
        setSelectedAssetId("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [approveModalOpen]);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const statusMatches = statusFilter ? req.status === statusFilter : true;
    
    const term = search.toLowerCase();
    const empName = req.employeeId?.name?.toLowerCase() || "";
    const empId = req.employeeId?.employeeId?.toLowerCase() || "";
    const empDept = req.employeeId?.department?.toLowerCase() || "";
    const type = req.assetType?.toLowerCase() || "";
    const searchMatches = empName.includes(term) || empId.includes(term) || empDept.includes(term) || type.includes(term);

    return statusMatches && searchMatches;
  });

  const { items: sortedRequests, requestSort, sortConfig } = useTableSort(filteredRequests, { key: 'requestDate', direction: 'desc' });

  const {
    page, pageCount, pageItems: paginatedRequests, setPage,
    canPrev, canNext, prev, next,
  } = usePagination({ data: sortedRequests, pageSize: 8, resetDeps: [statusFilter, search] });

  // Handle Approve Request Submit
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !selectedAssetId) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/requests/${selectedRequest._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "approved",
          assignedAssetId: selectedAssetId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to approve request");
      }

      setSuccessMsg("Request approved and asset assigned successfully!");
      window.dispatchEvent(new Event("request_status_changed"));
      setApproveModalOpen(false);
      setSelectedRequest(null);
      setSelectedAssetId("");
      loadRequests();
      loadAvailableAssets();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg(err.message || "Error approving request.");
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reject Request Direct
  const handleRejectRequest = async (request) => {
    if (!window.confirm(`Are you sure you want to reject ${request.employeeId?.name || "this"}'s request?`)) {
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/requests/${request._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "rejected",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reject request");
      }

      setSuccessMsg("Request has been rejected.");
      window.dispatchEvent(new Event("request_status_changed"));
      loadRequests();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg(err.message || "Error rejecting request.");
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  // Filter available assets to only those of matching category/type
  const matchingAssets = availableAssets.filter((asset) => {
    if (!selectedRequest) return true;
    const reqType = selectedRequest.assetType?.toLowerCase() || "";
    return asset.type?.toLowerCase() === reqType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Requests Management</h2>
        <p className="text-sm text-slate-500">
          Review, approve, and assign assets for employee borrowing requests.
        </p>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-800 shadow-sm">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800 shadow-sm">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name, department, or category..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:mr-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            >
              <option value="pending">Pending Requests</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All Requests</option>
            </select>
          </div>
        </div>
      </div>

      {/* List / Table of Requests */}
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
            <p className="mt-4 text-sm font-semibold text-slate-500">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-semibold text-slate-600">No requests found.</p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <SortableHeader label="Employee" sortKey="employeeId.name" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
                  <SortableHeader label="Requested Info" sortKey="assetType" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
                  <SortableHeader label="Reason" sortKey="reason" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
                  <SortableHeader label="Dates" sortKey="requestDate" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
                  <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
                  <th className="w-1/6 px-4 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-center w-1/6 truncate">
                      <div className="font-medium text-slate-900 truncate">{req.employeeId?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500 truncate">
                        ID: {req.employeeId?.employeeId || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-center w-1/6 truncate">
                      <div className="capitalize font-semibold text-slate-800 truncate">{req.assetType || "General"}</div>
                      {req.requestedAssetId && (
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          Specific: {req.requestedAssetId.name} ({req.requestedAssetId.assetId})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-center text-slate-500 w-1/6 truncate" title={req.reason}>
                      {req.reason || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-center text-slate-500 w-1/6 truncate">
                      <div className="text-xs truncate">
                        <span className="font-medium text-slate-400">Request:</span>{" "}
                        {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                      {req.tentativeReturnDate && (
                        <div className="text-xs mt-0.5 truncate">
                          <span className="font-medium text-slate-400">Due:</span>{" "}
                          {new Date(req.tentativeReturnDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center w-1/6 truncate">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold border ${
                          req.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : req.status === "approved"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm w-1/6 truncate">
                      {req.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              // Auto select requestedAssetId if it exists
                              if (req.requestedAssetId?._id) {
                                setSelectedAssetId(req.requestedAssetId._id);
                              } else {
                                setSelectedAssetId("");
                              }
                              setApproveModalOpen(true);
                            }}
                            className="rounded-xl bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-200 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req)}
                            className="rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page} pageCount={pageCount} setPage={setPage}
            canPrev={canPrev} canNext={canNext} prev={prev} next={next}
            showing={paginatedRequests.length} total={filteredRequests.length}
            label="requests"
          />
          </>
        )}
      </div>

      {/* Approval Assignment Modal */}
      {approveModalOpen && selectedRequest && createPortal(
        <div
          onClick={() => {
            setApproveModalOpen(false);
            setSelectedRequest(null);
            setSelectedAssetId("");
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-black"
          >
            {/* Header */}
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-lg">Approve Request</h3>
                <p className="text-xs text-slate-400 mt-0.5">Assign an available asset to complete approval</p>
              </div>
              <button
                onClick={() => {
                  setApproveModalOpen(false);
                  setSelectedRequest(null);
                  setSelectedAssetId("");
                }}
                className="text-slate-400 hover:text-white rounded-full p-1 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Employee</span>
                  <span className="font-bold text-slate-800">{selectedRequest.employeeId?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Category</span>
                    <span className="font-semibold text-slate-700 capitalize">{selectedRequest.assetType}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Due Date</span>
                    <span className="font-semibold text-slate-700">
                      {selectedRequest.tentativeReturnDate
                        ? new Date(selectedRequest.tentativeReturnDate).toLocaleDateString()
                        : "No due date"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Select Asset to Assign <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                >
                  <option value="">-- Choose Asset --</option>
                  {/* Prioritize requested specific asset if matches */}
                  {selectedRequest.requestedAssetId && (
                    <option value={selectedRequest.requestedAssetId._id}>
                      [Requested Asset] {selectedRequest.requestedAssetId.name} ({selectedRequest.requestedAssetId.assetId})
                    </option>
                  )}
                  {/* Matching category assets */}
                  {matchingAssets
                    .filter((a) => a._id !== selectedRequest.requestedAssetId?._id)
                    .map((asset) => (
                      <option key={asset._id} value={asset._id}>
                        {asset.name} ({asset.assetId})
                      </option>
                    ))}
                </select>
                {matchingAssets.length === 0 && !selectedRequest.requestedAssetId && (
                  <p className="text-xs text-red-500 font-semibold mt-1">
                    ⚠ No available assets found for category "{selectedRequest.assetType}".
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setApproveModalOpen(false);
                    setSelectedRequest(null);
                    setSelectedAssetId("");
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!selectedAssetId)}
                  className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Approving..." : "Confirm Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminRequests;
