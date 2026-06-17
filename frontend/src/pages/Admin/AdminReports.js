import { useEffect, useMemo, useState, useCallback } from "react";
import { assetService } from "../../services/assetService";
import { assignmentService } from "../../services/assignmentService";
import { reportService } from "../../services/reportService";
import { useAuth } from "../../context/AuthContext";
import { REPORT_STATUS, ASSET_STATUS } from "../../constants/assetStatus";
import AllReportsModal from "../../components/Admin/modals/AllReportsModal";

function AdminReports() {
  const { hasPermission } = useAuth();
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filedReports, setFiledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllReportsModal, setShowAllReportsModal] = useState(false);
  const [modalStatusFilter, setModalStatusFilter] = useState("all");
  const [modalTypeFilter, setModalTypeFilter] = useState("all");

  const fetchLatestData = useCallback(async (mounted = true) => {
    try {
      const canViewAssignments = hasPermission("view_assignments");
      const canManageMaintenance = hasPermission("manage_maintenance");

      const [assetsData, assignmentsData, reportsData] = await Promise.all([
        assetService.getAll(),
        canViewAssignments
          ? assignmentService.getAll()
          : Promise.resolve([]),
        canManageMaintenance
          ? reportService.getAll()
          : Promise.resolve([]),
      ]);

      if (mounted) {
        setAssets(Array.isArray(assetsData) ? assetsData : []);
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        setFiledReports(Array.isArray(reportsData) ? reportsData : []);
      }
    } catch (err) {
      console.error("Failed to load reports data", err);
      if (mounted) {
        setAssets([]);
        setAssignments([]);
        setFiledReports([]);
      }
    } finally {
      if (mounted) setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    let mounted = true;
    fetchLatestData(mounted);
    return () => {
      mounted = false;
    };
  }, [fetchLatestData]);



  const handleStatusChange = async (reportId, newStatus) => {
    // newStatus is the actual backend value: REPORT_STATUS.OPEN | REPORT_STATUS.IN_PROGRESS | REPORT_STATUS.RESOLVED
    const previousReports = [...filedReports];
    // Optimistic UI update immediately
    setFiledReports(prev => prev.map(r => r._id === reportId ? { ...r, status: newStatus } : r));

    try {
      const data = await reportService.updateStatus(reportId, { status: newStatus });
      // Final sync from server truth
      setFiledReports(prev => prev.map(r => r._id === reportId ? { ...r, status: data.report.status } : r));
      // Refresh all derived data (available counts, assignments, etc.)
      fetchLatestData(true);
    } catch (err) {
      console.error(err);
      setFiledReports(previousReports);
    }
  };

  const statusColor = (status) => {
    if (status === REPORT_STATUS.OPEN) return 'bg-orange-100 text-orange-700';
    if (status === REPORT_STATUS.IN_PROGRESS) return 'bg-yellow-100 text-yellow-700';
    if (status === REPORT_STATUS.RESOLVED) return 'bg-green-100 text-green-700';
    return 'bg-slate-100 text-slate-600';
  };

  const damagedAssets = useMemo(
    () =>
      assets.filter((a) => {
        const s = (a.status || "").toLowerCase();
        return s === "damaged" || s === "repair";
      }),
    [assets],
  );

  const availableAssets = useMemo(
    () => assets.filter((a) => (a.status || "").toLowerCase() === ASSET_STATUS.AVAILABLE),
    [assets],
  );

  const activeReportsCount = useMemo(() => {
    return filedReports.filter(r => r.status !== REPORT_STATUS.RESOLVED).length;
  }, [filedReports]);

  const activeAssignmentsCount = useMemo(() => {
    return assignments.filter(a => !a.returnedDate).length;
  }, [assignments]);

  const reportsBySelectedType = useMemo(() => {
    return filedReports.filter(r => {
      const rType = r.type?.toLowerCase();
      const isOther = rType !== 'damage' && rType !== 'lost';
      return modalTypeFilter === 'all' || (modalTypeFilter === 'other' ? isOther : rType === modalTypeFilter);
    });
  }, [filedReports, modalTypeFilter]);

  const filteredModalReports = useMemo(() => {
    return reportsBySelectedType.filter(r => 
      modalStatusFilter === 'all' || r.status === modalStatusFilter
    );
  }, [reportsBySelectedType, modalStatusFilter]);

  const recentlyAssigned = useMemo(() => {
    return assignments
      .slice()
      .sort((a, b) => {
        const da = a.assignedDate ? new Date(a.assignedDate) : new Date(0);
        const db = b.assignedDate ? new Date(b.assignedDate) : new Date(0);
        return db - da;
      })
      .slice(0, 6);
  }, [assignments]);

  if (loading) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">
            Overview: recent assignments, damaged items, availability.
          </p>
        </div>

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 w-full lg:w-auto">
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Assets
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-orange-400">
              {assets.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Active Assignments
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-500">
              {activeAssignmentsCount}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Damaged Assets
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-yellow-500">
              {damagedAssets.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {hasPermission("view_assignments") && (
          <div
            className="p-6 bg-white rounded-xl shadow-md cursor-default
                      transition-all duration-300 ease-in-out
                      hover:-translate-y-2 hover:scale-105 hover:shadow-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              Recently Assigned
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Latest asset assignments
            </p>

            {recentlyAssigned.length === 0 ? (
              <div className="mt-6 text-sm text-slate-500">
                No recent assignments.
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {recentlyAssigned.map((r) => {
                  const asset = typeof r.assetId === "object" ? r.assetId : null;
                  const user = typeof r.userId === "object" ? r.userId : null;
                  
                  const assetName = asset ? asset.name : (r.assetName || "Unknown asset");
                  const employeeName = user ? (user.displayName || user.email) : (r.assignedTo || "—");
                  const isReturned = !!r.returnedDate;

                  return (
                    <li
                      key={r._id || r.id}
                      className="flex items-start justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {assetName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employeeName} •{" "}
                          {r.assignedDate
                            ? new Date(r.assignedDate).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </div>
                      </div>
                      <div className="text-xs text-slate-700 rounded-full bg-slate-100 px-3 py-1">
                        {isReturned ? "Returned" : "Active"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {hasPermission("manage_maintenance") && (
          <div
            onClick={() => setShowAllReportsModal(true)}
            className="p-6 bg-white rounded-xl shadow-md cursor-pointer
                      transition-all duration-300 ease-in-out
                      hover:-translate-y-2 hover:scale-105 hover:shadow-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              Employee Reports
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Damage & incident reports filed by borrowers
            </p>

            <div className="mt-6 flex-1 overflow-hidden">
              <div className="text-3xl font-semibold text-slate-900 text-red-500">
                {activeReportsCount}
              </div>
              <p className="text-sm text-slate-500 mt-1">Total active reports</p>

              <div className="mt-4 space-y-3">
                {filedReports.slice(0, 4).map((r) => (
                  <div
                    key={r._id}
                    className="flex items-start justify-between border-b border-slate-100 pb-2 last:border-0"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {r.assetId?.name || r.assetId?.assetId || "Unknown Asset"}
                      </div>
                      <div className="text-xs text-slate-500 truncate" title={r.message}>
                        {r.employeeId?.name || "Unknown user"} {(r.employeeId?.employeeId) ? `(ID: ${r.employeeId?.employeeId})` : ''} • {r.message}
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap ${r.type === 'damage' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.type}
                    </div>
                  </div>
                ))}
                {filedReports.length > 4 && (
                  <div className="text-xs text-slate-500 text-center font-medium mt-2">
                    +{filedReports.length - 4} more reports
                  </div>
                )}
                {filedReports.length === 0 && (
                  <div className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 text-center">No reports filed.</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className="p-6 bg-white rounded-xl shadow-md cursor-default
                    transition-all duration-300 ease-in-out
                    hover:-translate-y-2 hover:scale-105 hover:shadow-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Available Assets
          </h3>
          <p className="mt-2 text-sm text-slate-500">Ready for assignment</p>

          <div className="mt-6">
            <div className="text-3xl font-semibold text-slate-900 text-green-500">
              {availableAssets.length}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Total available assets
            </p>

            <div className="mt-4 space-y-2">
              {availableAssets.slice(0, 4).map((a) => (
                <div
                  key={a._id || a.assetId}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {a.name || a.assetId}
                    </div>
                    <div className="text-xs text-slate-500">
                      {a.type || "—"}
                    </div>
                  </div>
                </div>
              ))}
              {availableAssets.length > 4 && (
                <div className="text-xs text-slate-500">
                  +{availableAssets.length - 4} more
                </div>
              )}
              {availableAssets.length === 0 && (
                <div className="text-sm text-slate-500">
                  No available assets.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Modal for All Reports */}
      <AllReportsModal
        isOpen={showAllReportsModal}
        onClose={() => setShowAllReportsModal(false)}
        filedReports={filedReports}
        modalStatusFilter={modalStatusFilter}
        setModalStatusFilter={setModalStatusFilter}
        modalTypeFilter={modalTypeFilter}
        setModalTypeFilter={setModalTypeFilter}
        filteredModalReports={filteredModalReports}
        reportsBySelectedType={reportsBySelectedType}
        statusColor={statusColor}
        handleStatusChange={handleStatusChange}
      />
    </div>
  );
}

export default AdminReports;
