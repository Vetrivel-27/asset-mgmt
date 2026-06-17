import { useEffect, useMemo, useState } from "react";
import { ASSET_STATUS, REPORT_STATUS, REQUEST_STATUS } from "../../constants/assetStatus";
import { assignmentService } from "../../services/assignmentService";
import { requestService } from "../../services/requestService";
import { reportService } from "../../services/reportService";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/ui/Pagination";
import EmployeeHistoryTable from "../../components/Employee/EmployeeHistoryTable";
import HistoryLogModal from "../../components/Employee/HistoryLogModal";
import { useTableSort } from "../../hooks/useTableSort";
import { usePagination } from "../../hooks/usePagination";

function EmployeeHistory() {
  const { hasPermission } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const canBorrow = hasPermission("borrow_asset");
  const canReturn = hasPermission("return_asset");
  const isReturnOnly = !canBorrow && canReturn;

  // Sidebar / Logs Drawer State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        const canViewDamage = hasPermission("view_my_damage");
        const fetchPromises = [
          assignmentService.getMyAssignments(),
          requestService.getMyRequests()
        ];

        if (canViewDamage) {
          fetchPromises.push(reportService.getMyReports());
        }

        const responses = await Promise.all(fetchPromises);
        const assignmentsData = responses[0];
        const requestsData = responses[1];
        let reportsData = { reports: [] };
        
        if (canViewDamage && responses[2]) {
          reportsData = responses[2];
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
  }, [hasPermission]);



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

    const rejectedRecords = requests.filter(r => r.status === REQUEST_STATUS.REJECTED).map((req) => {
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
        if (typeFilter === ASSET_STATUS.ASSIGNED && (record.recordType !== "assignment" || !!record.returnedDate)) return false;
        if (typeFilter === "returned" && (record.recordType !== "assignment" || !record.returnedDate)) return false;
        if (typeFilter === REQUEST_STATUS.REJECTED && record.recordType !== "rejected_request") return false;
        if (typeFilter === "reports" && record.recordType !== "damage_report") return false;
      }

      const name = record.asset?.name?.toLowerCase() || record.assetType?.toLowerCase() || "";
      const id = String(record.asset?.assetId || "");
      return name.includes(term) || id.includes(term);
    });
  }, [combinedHistory, search, typeFilter]);

  const { items: sortedHistory, requestSort, sortConfig } = useTableSort(filteredHistory, { key: 'dateSort', direction: 'desc' });

  const {
    page, pageCount, pageItems: paginatedHistory, setPage,
    canPrev, canNext, prev, next,
  } = usePagination({ data: sortedHistory, pageSize: 8, resetDeps: [search, typeFilter] });

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
      if (record.status === REPORT_STATUS.IN_PROGRESS) return { text: "In Progress", classes: "bg-blue-100 text-blue-700 border-blue-200" };
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
            A complete log of your {isReturnOnly ? "assigned" : "borrowed"} assets, approval histories, return records, and current statuses.
          </p>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 w-full lg:w-auto">
          {!hasPermission("view_my_damage") && (
            <div className="hidden sm:block"></div>
          )}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isReturnOnly ? "Assigned" : "Borrowed"}
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
          {hasPermission("view_my_damage") && (
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
              <option value={ASSET_STATUS.ASSIGNED}>Assigned assets</option>
              <option value="returned">Returned assets</option>
              <option value={REQUEST_STATUS.REJECTED}>Requests declined</option>
              {hasPermission("view_my_damage") && (
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
              <EmployeeHistoryTable
                paginatedHistory={paginatedHistory}
                sortConfig={sortConfig}
                requestSort={requestSort}
                setSelectedRecord={setSelectedRecord}
                setSidebarOpen={setSidebarOpen}
                statusLabel={statusLabel}
                isReturnOnly={isReturnOnly}
              />

              <Pagination
                page={page} pageCount={pageCount} setPage={setPage}
                canPrev={canPrev} canNext={canNext} prev={prev} next={next}
                showing={paginatedHistory.length} total={filteredHistory.length}
                label="records"
              />
            </div>
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      <HistoryLogModal
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          setSelectedRecord(null);
        }}
        selectedRecord={selectedRecord}
      />
    </div>
  );
}

export default EmployeeHistory;
