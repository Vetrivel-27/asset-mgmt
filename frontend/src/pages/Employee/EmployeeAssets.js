import { useEffect, useMemo, useState, useCallback } from "react";
import { assetService } from "../../services/assetService";
import { requestService } from "../../services/requestService";
import { ASSET_STATUS } from "../../constants/assetStatus";
import Button from "../../components/ui/Button";
import AdminAssets from "../Admin/AdminAssets";
import Pagination from "../../components/ui/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";
import AssetCatalogCard from "../../components/Employee/AssetCatalogCard";
import BorrowRequestModal from "../../components/Employee/BorrowRequestModal";


function EmployeeAssets() {
  const { hasPermission } = useAuth();
  const [assets, setAssets] = useState([]);
  const [types, setTypes] = useState([]);
  const [viewMode, setViewMode] = useState("borrow"); // "borrow" or "manage"

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState(6);
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
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Load unique asset types/categories for filter dropdown
  useEffect(() => {
    async function loadTypes() {
      try {
        const data = await assetService.getCategories();
        setTypes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load asset categories", err);
      }
    }
    loadTypes();
  }, []);

  // Fetch all Assets from server
  const fetchAssets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await assetService.getAll();
      setAssets(Array.isArray(data) ? data : (data.assets || []));
    } catch (err) {
      console.error(err);
      setErrorMsg("Error loading assets. Please try again.");
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const filteredAssets = useMemo(() => {
    const term = search.toLowerCase();
    return assets.filter((asset) => {
      const textMatches =
        asset.name?.toLowerCase().includes(term) ||
        asset.assetId?.toLowerCase().includes(term);

      const statusMatches =
        statusFilter === "" ? true : asset.status?.toLowerCase() === statusFilter.toLowerCase();

      const typeMatches =
        typeFilter === "" ? true : asset.type?.toLowerCase() === typeFilter.toLowerCase();

      return textMatches && statusMatches && typeMatches;
    });
  }, [assets, search, statusFilter, typeFilter]);

  const {
    page, pageCount, pageItems: currentPageAssets, setPage,
    canPrev, canNext, prev, next,
  } = usePagination({ data: filteredAssets, pageSize: limit, resetDeps: [search, statusFilter, typeFilter, limit] });

  useEffect(() => {
    fetchAssets(false);

    const intervalId = setInterval(() => {
      fetchAssets(true);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [fetchAssets]);



  // Handle Borrow Submission
  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    if (tentativeReturnDate) {
      const selectedDate = new Date(tentativeReturnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setErrorMsg("Return date cannot be in the past.");
        setTimeout(() => setErrorMsg(""), 5000);
        return;
      }
    }

    setSubmittingBorrow(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await requestService.create({
        requestedAssetId: selectedAsset._id,
        assetType: selectedAsset.type,
        reason: reason || `Requested to borrow ${selectedAsset.name}`,
        tentativeReturnDate: tentativeReturnDate || undefined,
      });
      setSuccessMsg("Borrow request submitted successfully!");
      setBorrowModalOpen(false);
      setSelectedAsset(null);
      setReason("");
      setTentativeReturnDate("");
      fetchAssets();
      window.dispatchEvent(new Event("request_status_changed"));
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg(err.message || "Error submitting request.");
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setSubmittingBorrow(false);
    }
  };

  if (viewMode === "manage" && hasPermission("manage_asset")) {
    return (
      <AdminAssets onReturnToCatalogue={() => setViewMode("borrow")} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Available Assets
          </h2>
          <p className="text-sm text-slate-500">
            Browse items in our inventory and request to borrow them instantly.
          </p>
        </div>
        {hasPermission("manage_asset") && (
          <Button onClick={() => setViewMode("manage")}>
            Manage Assets →
          </Button>
        )}
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Type
              </label>
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              >
                <option value="">All Statuses</option>
                <option value={ASSET_STATUS.AVAILABLE}>Available</option>
                <option value={ASSET_STATUS.ASSIGNED}>Borrowed</option>
                <option value="damaged">Damaged</option>
                <option value="repair">Under Repair</option>
              </select>
            </div>

            {/* Page Limit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Show
              </label>
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
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading inventory items...
            </p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400">
            <svg
              className="mx-auto h-12 w-12 text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 17m8 4V11"
              />
            </svg>
            <p className="font-semibold text-slate-600">
              No assets found matching the criteria.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your keyword searches or filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {currentPageAssets.map((asset) => (
              <AssetCatalogCard
                key={asset._id}
                asset={asset}
                onBorrow={(a) => {
                  setSelectedAsset(a);
                  setBorrowModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <Pagination
          page={page}
          pageCount={pageCount}
          setPage={setPage}
          canPrev={canPrev}
          canNext={canNext}
          prev={prev}
          next={next}
          showing={currentPageAssets.length}
          total={filteredAssets.length}
          label="assets"
        />
      )}

      {/* Borrow Confirmation Modal */}
      <BorrowRequestModal
        isOpen={borrowModalOpen}
        onClose={() => {
          setBorrowModalOpen(false);
          setSelectedAsset(null);
          setTentativeReturnDate("");
          setReason("");
        }}
        selectedAsset={selectedAsset}
        reason={reason}
        setReason={setReason}
        tentativeReturnDate={tentativeReturnDate}
        setTentativeReturnDate={setTentativeReturnDate}
        submitting={submittingBorrow}
        onSubmit={handleBorrowSubmit}
      />
    </div>
  );
}

export default EmployeeAssets;
