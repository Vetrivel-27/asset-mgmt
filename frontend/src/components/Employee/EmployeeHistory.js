import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

function EmployeeHistory() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await fetch(`${API_URL}/api/assignments/my-assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!mounted) return;
        setAssignments(
          (Array.isArray(data) ? data : []).sort(
            (a, b) => new Date(b.assignedDate) - new Date(a.assignedDate)
          )
        );
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

  // Flatten asset data from populated assetId field
  const borrowedAssets = useMemo(() => {
    return assignments.map((assignment) => {
      const asset = typeof assignment.assetId === "object" ? assignment.assetId : {};
      return {
        ...assignment,
        asset,
      };
    });
  }, [assignments]);

  const filteredHistory = useMemo(() => {
    const term = search.toLowerCase();
    return borrowedAssets.filter((record) => {
      const name = record.asset?.name?.toLowerCase() || "";
      const id = String(record.asset?.assetId || "");
      return name.includes(term) || id.includes(term);
    });
  }, [borrowedAssets, search]);

  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const returned = filteredHistory.filter((r) => !!r.returnedDate).length;
    const pending = total - returned;
    return { total, returned, pending };
  }, [filteredHistory]);

  const statusLabel = (record) => {
    if (record.returnedDate)
      return { text: "Returned", classes: "bg-green-100 text-green-700" };
    const dueDate = record.tentativeReturnDate;
    if (dueDate && new Date(dueDate) < new Date())
      return { text: "Overdue", classes: "bg-red-100 text-red-700" };
    return { text: "Active", classes: "bg-blue-100 text-blue-700" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Asset history
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl">
            A complete log of your borrowed assets, approvals, returns, and
            current status.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Borrowed
            </p>
            <p className="mt-3 text-3xl font-semibold text-orange-300">
              {stats.total}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Returned
            </p>
            <p className="mt-3 text-3xl font-semibold text-green-500">
              {stats.returned}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Pending
            </p>
            <p className="mt-3 text-3xl font-semibold text-red-500">
              {stats.pending}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Your history log
            </p>
            <p className="text-sm text-slate-500">
              Search by asset name or ID to quickly find any record.
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets or IDs"
            className="w-full md:w-80 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
          />
        </div>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
              Loading history...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
              No history records found. Borrow an asset first or adjust your
              search.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                        Asset
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                        Asset ID
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                        Borrowed
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                        Return
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
                          key={
                            record._id || record.assetId || record.asset?._id
                          }
                        >
                          <td className="px-4 py-4 text-sm text-slate-900">
                            {record.asset?.name || "Unknown asset"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {record.asset?.assetId || "—"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {record.assignedDate
                              ? new Date(
                                  record.assignedDate,
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {record.returnedDate
                              ? new Date(record.returnedDate).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
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

              <div className="grid gap-4 md:hidden">
                {filteredHistory.map((record) => {
                  const status = statusLabel(record);
                  return (
                    <div
                      key={record._id || record.assetId || record.asset?._id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {record.asset?.name || "Unknown asset"}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: {record.asset?.assetId || record.assetId || "—"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
                        >
                          {status.text}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                          <p className="text-xs text-slate-500">Borrowed</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {record.assignedDate
                              ? new Date(
                                  record.assignedDate,
                                ).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                          <p className="text-xs text-slate-500">Return</p>
                          <p className="mt-1 text-sm text-slate-700">
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
    </div>
  );
}

export default EmployeeHistory;
