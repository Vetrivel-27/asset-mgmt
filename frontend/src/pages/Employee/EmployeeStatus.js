import { useEffect, useState } from "react";
import { assignmentService } from "../../services/assignmentService";
import { requestService } from "../../services/requestService";
import { REQUEST_STATUS } from "../../constants/assetStatus";
import Pagination from "../../components/ui/Pagination";
import { useTableSort } from "../../hooks/useTableSort";
import { usePagination } from "../../hooks/usePagination";
import { ActiveAssignmentCard, PendingRequestCard, ReturnHistoryTable } from "../../components/Employee/EmployeeStatusCards";
import ReturnConfirmModal from "../../components/Employee/ReturnConfirmModal";

// Main page
function EmployeeStatus() {
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null); // tracking returning state for spinner/button disable
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [assignmentToReturn, setAssignmentToReturn] = useState(null);

  const loadMyAssignments = async () => {
    try {
      const data = await assignmentService.getMyAssignments();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  const loadMyRequests = async () => {
    try {
      const data = await requestService.getMyRequests();
      setRequests(data && Array.isArray(data.requests) ? data.requests : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load requests", err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadMyAssignments(), loadMyRequests()]);
      setLoading(false);
    }
    init();

    const intervalId = setInterval(() => {
      loadMyAssignments();
      loadMyRequests();
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);



  const handleReturnClick = (assignment) => {
    setAssignmentToReturn(assignment);
    setReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!assignmentToReturn) return;
    const assignment = assignmentToReturn;
    setReturningId(assignment._id);
    setErrorMsg("");
    try {
      await assignmentService.returnAsset(assignment._id);
      setSuccessMsg("Asset returned successfully! It is now available again.");
      await Promise.all([loadMyAssignments(), loadMyRequests()]);
      setTimeout(() => setSuccessMsg(""), 4000);
      setReturnModalOpen(false);
      setAssignmentToReturn(null);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setReturningId(null);
    }
  };

  // Split into active vs returned for cleaner UX
  const activeAssignments = assignments.filter((a) => !a.returnedDate);
  const returnedAssignments = assignments.filter((a) => !!a.returnedDate);
  const pendingRequests = requests.filter((r) => r.status === REQUEST_STATUS.PENDING);

  const { items: sortedReturnedAssignments, requestSort, sortConfig } = useTableSort(returnedAssignments, { key: 'returnedDate', direction: 'desc' });

  const {
    page, pageCount, pageItems: paginatedReturns, setPage,
    canPrev, canNext, prev, next,
  } = usePagination({ data: sortedReturnedAssignments, pageSize: 6 });

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">My Assets</h2>
        <p className="text-sm text-slate-500">
          Assets currently assigned to you and your return history.
        </p>
      </div>

      {/* Success/Error toasts */}
      {successMsg && (
        <div className="rounded-2xl bg-green-100 px-5 py-4 text-sm font-medium text-green-700">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl bg-red-100 px-5 py-4 text-sm font-medium text-red-700">
          ⚠ {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-slate-500">
          Loading your assets…
        </div>
      ) : (
        <>
          {/* Active assignments */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Currently Assigned
            </h3>

            {activeAssignments.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-8 py-12 text-center text-slate-400">
                No active assignments right now.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {activeAssignments.map((assignment) => (
                  <ActiveAssignmentCard
                    key={assignment._id}
                    assignment={assignment}
                    returningId={returningId}
                    onReturnClick={handleReturnClick}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <section>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                Requested Assets
              </h3>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pendingRequests.map((request) => (
                  <PendingRequestCard key={request._id} request={request} />
                ))}
              </div>
            </section>
          )}

          {/* Return history */}
          {returnedAssignments.length > 0 && (
            <section>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                Return History
              </h3>
              <ReturnHistoryTable
                paginatedReturns={paginatedReturns}
                sortConfig={sortConfig}
                requestSort={requestSort}
              />

              <Pagination
                page={page} pageCount={pageCount} setPage={setPage}
                canPrev={canPrev} canNext={canNext} prev={prev} next={next}
                showing={paginatedReturns.length} total={returnedAssignments.length}
                label="returns"
              />
            </section>
          )}
        </>
      )}

      {/* Return Confirmation Modal */}
      <ReturnConfirmModal
        isOpen={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setAssignmentToReturn(null);
        }}
        assignment={assignmentToReturn}
        returningId={returningId}
        onConfirm={handleConfirmReturn}
      />
    </div>
  );
}

export default EmployeeStatus;
