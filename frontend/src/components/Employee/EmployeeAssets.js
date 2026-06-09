import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

// --- Dynamic Asset Thumbnail Finder ---
const getThumbnail = (type) => {
  const t = type?.toLowerCase() || "";
  if (t.includes("laptop") || t.includes("macbook") || t.includes("computer")) {
    return (
      <svg className="w-16 h-16 text-yellow-500 transition-transform duration-300 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="1" y1="20" x2="23" y2="20" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="20" />
      </svg>
    );
  }
  if (t.includes("phone") || t.includes("mobile") || t.includes("iphone") || t.includes("android")) {
    return (
      <svg className="w-16 h-16 text-yellow-500 transition-transform duration-300 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <circle cx="12" cy="18" r="1" strokeWidth="2" />
        <line x1="9" y1="5" x2="15" y2="5" strokeLinecap="round" />
      </svg>
    );
  }
  if (t.includes("monitor") || t.includes("screen") || t.includes("display")) {
    return (
      <svg className="w-16 h-16 text-yellow-500 transition-transform duration-300 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="13" rx="2" />
        <path d="M12 16v4M8 20h8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (t.includes("keyboard")) {
    return (
      <svg className="w-16 h-16 text-yellow-500 transition-transform duration-300 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 10h2M11 10h2M16 10h2M6 14h12" strokeLinecap="round" />
      </svg>
    );
  }
  if (t.includes("mouse") || t.includes("trackpad")) {
    return (
      <svg className="w-16 h-16 text-yellow-500 transition-transform duration-300 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="6" y="2" width="12" height="20" rx="6" />
        <path d="M12 2v6M6 9h12" />
      </svg>
    );
  }
  if (t.includes("printer") || t.includes("scanner")) {
    return (
      <svg className="w-16 h-16 text-yellow-500 transition-transform duration-300 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="6" y="14" width="12" height="8" rx="1" />
      </svg>
    );
  }
  if (t.includes("tablet") || t.includes("ipad")) {
    return (
      <svg className="w-16 h-16 text-yellow-500 transition-transform duration-300 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <circle cx="12" cy="19" r="1" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg className="w-16 h-16 text-yellow-500 transition-transform duration-300 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 17m8 4V11"/>
    </svg>
  );
};

function EmployeeAssets() {
  const [assets, setAssets] = useState([]);
  const [types, setTypes] = useState([]);
  
  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Borrow Dialog Modal State
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [tentativeReturnDate, setTentativeReturnDate] = useState("");
  const [reason, setReason] = useState("");
  const [submittingBorrow, setSubmittingBorrow] = useState(false);

  // Success / Error Feedback
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Debounce Search query
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchQuery);
      setPage(1);
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Load unique asset types/categories for filter dropdown
  useEffect(() => {
    async function loadTypes() {
      try {
        const token = sessionStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_URL}/api/assets/categories`, { headers });
        if (res.ok) {
          const data = await res.json();
          setTypes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load asset categories", err);
      }
    }
    loadTypes();
  }, []);

  // Fetch Assets based on status, type, search, page and limit
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);
      if (search) params.append("search", search);
      params.append("page", page);
      params.append("limit", limit);

      const res = await fetch(`${API_URL}/api/assets?${params.toString()}`, { headers });
      const data = await res.json();

      if (res.ok) {
        if (data.assets && Array.isArray(data.assets)) {
          setAssets(data.assets);
          setTotalPages(data.pagination?.pages || 1);
          setTotalCount(data.pagination?.total || 0);
        } else if (Array.isArray(data)) {
          setAssets(data);
          setTotalPages(1);
          setTotalCount(data.length);
        }
      } else {
        throw new Error(data.message || "Failed to fetch assets");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error loading assets. Please try again.");
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, typeFilter, search, page, limit]);

  // Handle Borrow Submission
  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    setSubmittingBorrow(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestedAssetId: selectedAsset._id,
          reason: reason || `Requested to borrow ${selectedAsset.name}`,
          tentativeReturnDate: tentativeReturnDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit borrow request");
      }

      setSuccessMsg(`Borrow request for ${selectedAsset.name} submitted successfully!`);
      setBorrowModalOpen(false);
      setSelectedAsset(null);
      setTentativeReturnDate("");
      setReason("");
      fetchAssets(); // Refresh asset lists
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg(err.message || "Error submitting request.");
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setSubmittingBorrow(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Available Assets</h2>
        <p className="text-sm text-slate-500">
          Browse items in our inventory and request to borrow them instantly.
        </p>
      </div>

      {/* Success/Error Feedback */}
      {successMsg && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-800 shadow-sm transition duration-300">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800 shadow-sm transition duration-300">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Filters Panel */}
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          {/* Search Box */}
          <div className="relative lg:col-span-6">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets by name or ID..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          {/* Filters: Type, Status, Limit */}
          <div className="grid grid-cols-3 gap-3 lg:col-span-6">
            {/* Type Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              >
                <option value="">All Categories</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="assigned">Borrowed</option>
                <option value="maintenance">Damaged</option>
              </select>
            </div>

            {/* Page Limit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Show</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              >
                <option value={6}>6 items</option>
                <option value={12}>12 items</option>
                <option value={24}>24 items</option>
                <option value={48}>48 items</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Display (Flipkart Card Style Layout) */}
      <div>
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
            <p className="mt-4 text-sm font-semibold text-slate-500">Loading inventory items...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400">
            <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 17m8 4V11"/>
            </svg>
            <p className="font-semibold text-slate-600">No assets found matching the criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your keyword searches or filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
              const isAssigned = asset.status?.toLowerCase() === "assigned";
              const isMaintenance = asset.status?.toLowerCase() === "maintenance"; // Damaged

              return (
                <div
                  key={asset._id}
                  className={`group relative flex flex-col rounded-3xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border
                    ${isMaintenance ? "border-2 border-red-500 ring-1 ring-red-400" : "border-slate-200 hover:border-slate-300"}
                    ${isAssigned ? "opacity-60" : "opacity-100"}
                  `}
                >
                  {/* Flipkart Card Image Container */}
                  <div className="relative h-44 bg-gradient-to-tr from-slate-50 to-slate-100 flex items-center justify-center border-b border-slate-100 p-6">
                    {getThumbnail(asset.type)}

                    {/* Absolute Badges on Image */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                          asset.status?.toLowerCase() === "available"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isAssigned
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {asset.status === "maintenance" ? "Damaged" : asset.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base text-slate-900 group-hover:text-yellow-600 transition-colors line-clamp-1">
                        {asset.name || "—"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <span>ID: {asset.assetId || "—"}</span>
                        <span>•</span>
                        <span className="capitalize">{asset.type || "—"}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {asset.status?.toLowerCase() === "available" ? (
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setBorrowModalOpen(true);
                          }}
                          className="w-full rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-500 focus:outline-none"
                        >
                          Borrow Asset
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed border border-slate-200"
                        >
                          {isMaintenance ? "Unavailable (Damaged)" : "Borrowed"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Showing page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{totalPages}</span> ({totalCount} total assets)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, index) => {
                const p = index + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-9 w-9 rounded-xl text-sm font-bold transition ${
                      page === p
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Borrow Confirmation Modal */}
      {borrowModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all">
            {/* Modal Header */}
            <div className="bg-yellow-400 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Borrow Request</h3>
                <p className="text-xs text-slate-800 mt-0.5">Please confirm details below.</p>
              </div>
              <button
                onClick={() => {
                  setBorrowModalOpen(false);
                  setSelectedAsset(null);
                  setTentativeReturnDate("");
                  setReason("");
                }}
                className="text-slate-900 hover:bg-yellow-500 rounded-full p-1 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBorrowSubmit} className="p-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Asset Name</label>
                  <p className="text-sm font-bold text-slate-800">{selectedAsset.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Asset ID</label>
                    <p className="text-xs font-bold text-slate-700">{selectedAsset.assetId}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category / Type</label>
                    <p className="text-xs font-bold text-slate-700 capitalize">{selectedAsset.type}</p>
                  </div>
                </div>
              </div>

              {/* Reason for Request */}
              <div className="space-y-2">
                <label htmlFor="reason" className="block text-sm font-semibold text-slate-700">
                  Reason for Request <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reason"
                  rows="3"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why do you need to borrow this asset?"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 resize-none"
                />
              </div>

              {/* Tentative Return Date */}
              <div className="space-y-2">
                <label htmlFor="returnDate" className="block text-sm font-semibold text-slate-700">
                  Tentative Return Date <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="returnDate"
                  type="date"
                  value={tentativeReturnDate}
                  onChange={(e) => setTentativeReturnDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBorrowModalOpen(false);
                    setSelectedAsset(null);
                    setTentativeReturnDate("");
                    setReason("");
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBorrow}
                  className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingBorrow ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeAssets;
