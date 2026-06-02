import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

function EmployeeAssets() {
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    let mounted = true;

    async function loadAssets() {
      try {
        const res = await fetch(`${API_URL}/api/assets`);
        const data = await res.json();
        if (mounted) setAssets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load assets", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAssets();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesKeyword =
        asset.name?.toLowerCase().includes(filter.toLowerCase()) ||
        asset.assetId?.toLowerCase().includes(filter.toLowerCase());
      const matchesType =
        !typeFilter ||
        asset.category?.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus =
        !statusFilter ||
        asset.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesKeyword && matchesType && matchesStatus;
    });
  }, [assets, filter, typeFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const currentPageAssets = filteredAssets.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [pageCount, page]);

  const uniqueTypes = [
    ...new Set(assets.map((a) => a.category).filter(Boolean)),
  ];
  const uniqueStatuses = [
    ...new Set(assets.map((a) => a.status).filter(Boolean)),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Assets</h2>
          <p className="text-sm text-slate-500">
            Search and apply for available assets.
          </p>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <input
            type="search"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or asset ID"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
          />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              >
                <option value="">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              >
                <option value="">All Status</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
              Loading assets...
            </div>
          ) : currentPageAssets.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
              No assets found.
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {currentPageAssets.map((asset) => (
                <div
                  key={asset._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-3 h-32 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <span className="text-xs text-slate-500">Asset Image</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {asset.name || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      ID: {asset.assetId || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      Category: {asset.category || "—"}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          asset.status?.toLowerCase() === "available"
                            ? "bg-green-100 text-green-700"
                            : asset.status?.toLowerCase() === "assigned"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {asset.status || "—"}
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={asset.status?.toLowerCase() !== "available"}
                    className={`w-full mt-4 rounded-2xl px-4 py-2 text-sm font-semibold ${
                      asset.status?.toLowerCase() === "available"
                        ? "bg-yellow-400 text-slate-900 hover:bg-yellow-500"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {asset.status?.toLowerCase() === "available"
                      ? "Apply for Asset"
                      : "Not Available"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && filteredAssets.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {currentPageAssets.length} of {filteredAssets.length}{" "}
              assets
            </p>
            <div className="flex flex-wrap gap-2">
              {pageCount <= 5 ? (
                Array.from({ length: pageCount }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setPage(index + 1)}
                    className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                      page === index + 1
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                      page === 1
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    1
                  </button>
                  {page > 3 && (
                    <span className="px-2 py-2 text-slate-500">...</span>
                  )}
                  {page > 2 && (
                    <button
                      onClick={() => setPage(page - 1)}
                      className="rounded-2xl px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      {page - 1}
                    </button>
                  )}
                  {page !== 1 && page !== pageCount && (
                    <button
                      onClick={() => setPage(page)}
                      className="rounded-2xl px-3 py-2 text-sm font-medium bg-slate-900 text-white"
                    >
                      {page}
                    </button>
                  )}
                  {page < pageCount - 1 && (
                    <button
                      onClick={() => setPage(page + 1)}
                      className="rounded-2xl px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      {page + 1}
                    </button>
                  )}
                  {page < pageCount - 2 && (
                    <span className="px-2 py-2 text-slate-500">...</span>
                  )}
                  <button
                    onClick={() => setPage(pageCount)}
                    disabled={page === pageCount}
                    className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                      page === pageCount
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {pageCount}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeAssets;
