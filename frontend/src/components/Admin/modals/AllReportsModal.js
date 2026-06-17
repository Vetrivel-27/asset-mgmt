import Modal from "../../ui/Modal";
import { REPORT_STATUS } from "../../../constants/assetStatus";

/**
 * Modal for viewing and managing all employee damage/incident reports.
 * Extracted from AdminReports.js — no logic or design changes.
 */
export default function AllReportsModal({
  isOpen,
  onClose,
  filedReports,
  modalStatusFilter,
  setModalStatusFilter,
  modalTypeFilter,
  setModalTypeFilter,
  filteredModalReports,
  reportsBySelectedType,
  statusColor,
  handleStatusChange,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="All Employee Reports"
      subtitle="Review and manage employee incident reports"
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col max-h-[60vh]">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: REPORT_STATUS.OPEN, label: 'Open' },
                { id: REPORT_STATUS.IN_PROGRESS, label: 'In Progress' },
                { id: REPORT_STATUS.RESOLVED, label: 'Closed' }
              ].map(f => {
                const count = f.id === 'all' ? reportsBySelectedType.length : reportsBySelectedType.filter(r => r.status === f.id).length;
                const isActive = modalStatusFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setModalStatusFilter(f.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive
                          ? "bg-white/20 text-slate-100"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <select
              value={modalTypeFilter}
              onChange={(e) => setModalTypeFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="damage">Damage</option>
              <option value="lost">Lost</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {filteredModalReports.map((r) => (
              <div
                key={r._id}
                className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 hover:bg-slate-50 p-2 rounded-xl transition-colors"
              >
                <div className="min-w-0 pr-4">
                  <div className="text-base font-semibold text-slate-900">
                    {r.assetId?.name || r.assetId?.assetId || "Unknown Asset"}
                  </div>
                  <div className="text-sm text-slate-700 mt-1">
                    <span className="font-semibold text-slate-900">{r.employeeId?.name || "Unknown user"}</span>
                    {(r.employeeId?.employeeId) && <span className="text-xs text-slate-500 ml-2">ID: {r.employeeId?.employeeId}</span>}
                    <span className="ml-2">reported:</span>
                    <span className="italic ml-1">"{r.message}"</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Filed on: {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-2">
                  <div className={`text-center text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md whitespace-nowrap ${r.type === 'damage' ? 'bg-red-100 text-red-700' : r.type === 'lost' ? 'bg-purple-100 text-purple-700' : r.type === 'maintenance' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.type}
                  </div>
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r._id, e.target.value)}
                    disabled={r.status === REPORT_STATUS.RESOLVED}
                    className={`text-center text-xs font-medium uppercase tracking-wider px-2 py-1 rounded-md outline-none border-none appearance-none ${statusColor(r.status)} ${r.status === REPORT_STATUS.RESOLVED ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <option value={REPORT_STATUS.OPEN}>Open</option>
                    <option value={REPORT_STATUS.IN_PROGRESS}>In Progress</option>
                    <option value={REPORT_STATUS.RESOLVED}>Closed</option>
                  </select>
                </div>
              </div>
            ))}
            {filteredModalReports.length === 0 && (
              <div className="text-center text-slate-500 py-12">No reports found matching your filters.</div>
            )}
          </div>
      </div>
    </Modal>
  );
}
