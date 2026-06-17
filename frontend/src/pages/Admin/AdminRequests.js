import { useEffect, useState, useCallback } from "react";
import { requestService } from "../../services/requestService";
import { assetService } from "../../services/assetService";
import Pagination from "../../components/ui/Pagination";
import AdminRequestsTable from "../../components/Admin/AdminRequestsTable";
import { ApproveRequestModal, RejectRequestModal } from "../../components/Admin/modals/RequestModals";
import { useTableSort } from "../../hooks/useTableSort";
import { usePagination } from "../../hooks/usePagination";
import { REQUEST_STATUS } from "../../constants/assetStatus";

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(REQUEST_STATUS.PENDING);
  const [search, setSearch] = useState("");

  // Approval Modal State
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);

  // Success / Error Feedback
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load requests
  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await requestService.getAll();
      setRequests(Array.isArray(data) ? data : []);
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
      const assetsList = await assetService.getAvailable();
      setAvailableAssets(Array.isArray(assetsList) ? assetsList : []);
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
    }, 2000); // Poll every 2 seconds

    return () => {
      window.removeEventListener("request_status_changed", handleStatusChange);
      clearInterval(intervalId);
    };
  }, [refreshData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (approveModalOpen) {
          setApproveModalOpen(false);
          setSelectedRequest(null);
          setSelectedAssetId("");
        }
        if (rejectModalOpen) {
          setRejectModalOpen(false);
          setRequestToReject(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [approveModalOpen, rejectModalOpen]);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const statusMatches = statusFilter ? req.status === statusFilter : true;
    
    const term = search.toLowerCase();
    const empName = req.userId?.displayName?.toLowerCase() || "";
    const empId = req.userId?.employeeProfile?.employeeId?.toLowerCase() || "";
    const empDept = req.userId?.employeeProfile?.department?.toLowerCase() || "";
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
      await requestService.updateStatus(selectedRequest._id, REQUEST_STATUS.APPROVED, { assignedAssetId: selectedAssetId });

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

  // Handle Reject Request Confirm
  const confirmRejectRequest = async () => {
    if (!requestToReject) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await requestService.updateStatus(requestToReject._id, REQUEST_STATUS.REJECTED, {});

      setSuccessMsg("Request has been rejected.");
      window.dispatchEvent(new Event("request_status_changed"));
      setRejectModalOpen(false);
      setRequestToReject(null);
      loadRequests();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg(err.message || "Error rejecting request.");
      setRejectModalOpen(false);
      setRequestToReject(null);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setSubmitting(false);
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
              placeholder="Search by user name, department, or category..."
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
              <option value={REQUEST_STATUS.PENDING}>Pending Requests</option>
              <option value={REQUEST_STATUS.APPROVED}>Approved</option>
              <option value={REQUEST_STATUS.REJECTED}>Rejected</option>
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
          <AdminRequestsTable 
            paginatedRequests={paginatedRequests}
            sortConfig={sortConfig}
            requestSort={requestSort}
            setSelectedRequest={setSelectedRequest}
            setSelectedAssetId={setSelectedAssetId}
            setApproveModalOpen={setApproveModalOpen}
            setRequestToReject={setRequestToReject}
            setRejectModalOpen={setRejectModalOpen}
          />

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
      <ApproveRequestModal
        isOpen={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setSelectedRequest(null);
          setSelectedAssetId("");
        }}
        selectedRequest={selectedRequest}
        selectedAssetId={selectedAssetId}
        setSelectedAssetId={setSelectedAssetId}
        matchingAssets={matchingAssets}
        submitting={submitting}
        onSubmit={handleApproveSubmit}
      />

      {/* Reject Confirmation Modal */}
      <RejectRequestModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRequestToReject(null);
        }}
        requestToReject={requestToReject}
        submitting={submitting}
        onConfirm={confirmRejectRequest}
      />
    </div>
  );
}

export default AdminRequests;
