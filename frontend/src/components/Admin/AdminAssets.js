import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";
import { createPortal } from "react-dom";
import CanAccess from "../CanAccess";
import BulkUploadForm from "./BulkUploadForm";
import SortableHeader from "../SortableHeader";
import Pagination from "../Pagination";
import { useTableSort } from "../../hooks/useTableSort";
import { usePagination } from "../../hooks/usePagination";

const SEED_CATEGORIES = [
  "Laptop",
  "Mobile",
  "Tablet",
  "Desktop",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Printer",
];

function AdminAssets({ onReturnToCatalogue }) {
  const [assets, setAssets] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  // Form states (Add Asset)
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [formAssetId, setFormAssetId] = useState("");
  const [formPurchaseDate, setFormPurchaseDate] = useState("");

  // Form states (Edit Asset)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editCustomType, setEditCustomType] = useState("");
  const [editAssetId, setEditAssetId] = useState("");
  const [editPurchaseDate, setEditPurchaseDate] = useState("");
  const [editStatus, setEditStatus] = useState("available");

  // Form states (Delete Confirmation Modal)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => setSubmitError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => setSubmitSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  const categoriesList = useMemo(() => {
    return Array.from(new Set([...SEED_CATEGORIES, ...dbCategories]));
  }, [dbCategories]);

  const loadCategories = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assets/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDbCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const loadAssets = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
    loadCategories();
  }, []);

  // Filter assets by search text and status buttons
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const textMatches =
        asset.name.toLowerCase().includes(filter.toLowerCase()) ||
        asset.assetId.toLowerCase().includes(filter.toLowerCase());

      const statusMatches =
        statusFilter === "all" ? true : asset.status === statusFilter;

      return textMatches && statusMatches;
    });
  }, [assets, filter, statusFilter]);

  const { items: sortedAssets, requestSort, sortConfig } = useTableSort(filteredAssets, { key: 'name', direction: 'asc' });

  const {
    page, pageCount, pageItems: currentPageAssets, setPage,
    canPrev, canNext, prev, next,
  } = usePagination({ data: sortedAssets, pageSize: 6, resetDeps: [filter, statusFilter] });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (editModalOpen) {
          setEditModalOpen(false);
          setEditAsset(null);
        }
        if (deleteModalOpen) {
          setDeleteModalOpen(false);
          setAssetToDelete(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editModalOpen, deleteModalOpen]);

  const resetForm = () => {
    setFormName("");
    setFormCategory("");
    setCustomCategory("");
    setFormAssetId("");
    setFormPurchaseDate("");
    setSubmitError("");
  };

  // Create new asset
  const handleSubmit = async (event) => {
    event.preventDefault();
    const finalCategory =
      formCategory === "CUSTOM_OPTION" ? customCategory.trim() : formCategory;

    if (!formName.trim() || !finalCategory || !formPurchaseDate) {
      setSubmitError("Name, category, and purchase date are required.");
      return;
    }

    if (new Date(formPurchaseDate) > new Date()) {
      setSubmitError("Purchase date cannot be in the future.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName.trim(),
          type: finalCategory,
          assetId: formAssetId.trim(),
          purchaseDate: formPurchaseDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to create asset.",
        );
      }

      setAssets((prevAssets) => [data, ...prevAssets]);
      resetForm();
      setShowForm(false);
      setSubmitSuccess("Asset created successfully!");
      loadCategories(); // Refresh dynamic category list
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err) {
      setSubmitError(err.message || "Failed to create asset.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete asset (soft delete confirmation open)
  const handleDeleteAsset = (asset) => {
    setAssetToDelete(asset);
    setDeleteModalOpen(true);
  };

  // Submit Delete Request
  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    setSubmitError("");
    setSubmitSuccess("");
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assets/${assetToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a._id !== assetToDelete._id));
        setSubmitSuccess(`Asset "${assetToDelete.name}" removed successfully.`);
        setTimeout(() => setSubmitSuccess(""), 3500);
      } else {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete asset");
      }
    } catch (err) {
      setSubmitError(err.message || "Error deleting asset.");
      setTimeout(() => setSubmitError(""), 5000);
    } finally {
      setDeleteModalOpen(false);
      setAssetToDelete(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (asset) => {
    setEditAsset(asset);
    setEditName(asset.name);
    setEditType(
      categoriesList.includes(asset.type) ? asset.type : "CUSTOM_OPTION",
    );
    setEditCustomType(categoriesList.includes(asset.type) ? "" : asset.type);
    setEditAssetId(asset.assetId);
    setEditStatus(asset.status || "available");

    // Format date string to YYYY-MM-DD
    if (asset.purchaseDate) {
      const dateObj = new Date(asset.purchaseDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      setEditPurchaseDate(`${year}-${month}-${day}`);
    } else {
      setEditPurchaseDate("");
    }

    setEditModalOpen(true);
  };

  const hasAssetChanges = useMemo(() => {
    if (!editAsset) return false;
    
    let originalPurchaseDate = "";
    if (editAsset.purchaseDate) {
      const dateObj = new Date(editAsset.purchaseDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      originalPurchaseDate = `${year}-${month}-${day}`;
    }

    const finalEditType = editType === "CUSTOM_OPTION" ? editCustomType.trim() : editType;
    
    return (
      editName.trim() !== (editAsset.name || "") ||
      finalEditType !== (editAsset.type || "") ||
      editAssetId.trim() !== (editAsset.assetId || "") ||
      editPurchaseDate !== originalPurchaseDate ||
      editStatus !== (editAsset.status || "available")
    );
  }, [editAsset, editName, editType, editCustomType, editAssetId, editPurchaseDate, editStatus]);

  // Submit Edit Asset
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const finalType =
      editType === "CUSTOM_OPTION" ? editCustomType.trim() : editType;

    if (
      !editName.trim() ||
      !finalType ||
      !editAssetId.trim() ||
      !editPurchaseDate
    ) {
      setSubmitError("All fields are required for editing.");
      return;
    }

    if (new Date(editPurchaseDate) > new Date()) {
      setSubmitError("Purchase date cannot be in the future.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assets/${editAsset._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          type: finalType,
          assetId: editAssetId.trim(),
          purchaseDate: editPurchaseDate,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update asset.");
      }

      setAssets((prev) => prev.map((a) => (a._id === data._id ? data : a)));
      setEditModalOpen(false);
      setEditAsset(null);
      setSubmitSuccess(`Asset "${data.name}" updated successfully!`);
      loadCategories();
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err) {
      setSubmitError(err.message || "Error updating asset.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Assets Management
          </h2>
          <p className="text-sm text-slate-500">
            Browse, search, edit, delete, and add new assets to the inventory
            catalog.
          </p>
        </div>
        <CanAccess permission="manage_asset">
          <div className="flex items-center gap-3">
            {onReturnToCatalogue && (
              <button
                type="button"
                onClick={onReturnToCatalogue}
                className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition"
              >
                ← Return to Catalogue
              </button>
            )}
            <button
              onClick={() => {
                setShowBulkUpload((prev) => !prev);
                setShowForm(false);
                resetForm();
              }}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {showBulkUpload ? "Cancel" : "Bulk Upload"}
            </button>
            <button
              onClick={() => {
                setShowForm((prev) => !prev);
                setShowBulkUpload(false);
                resetForm();
              }}
              className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-yellow-500 transition"
            >
              {showForm ? "Cancel" : "New Asset"}
            </button>
          </div>
        </CanAccess>
      </div>

      <BulkUploadForm 
        open={showBulkUpload} 
        onClose={() => setShowBulkUpload(false)} 
        onSuccess={() => {
          loadAssets();
          loadCategories();
        }} 
        type="assets" 
      />

      {submitSuccess && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 shadow-sm">
          ✓ {submitSuccess}
        </div>
      )}

      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm">
          ⚠ {submitError}
        </div>
      )}

      {/* Add New Asset Form */}
      {showForm && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Add New Asset</h3>
          <p className="mt-1 text-sm text-slate-500">
            Enter the details below. Asset ID is optional and will be
            auto-generated based on category if left blank.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Asset Name
                </span>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. MacBook Pro 16"
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Asset ID{" "}
                  <span className="text-slate-400 font-normal">
                    (Optional: Auto-generated)
                  </span>
                </span>
                <input
                  value={formAssetId}
                  onChange={(e) => setFormAssetId(e.target.value)}
                  placeholder="e.g. LAP-001 (or leave blank)"
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Category
                </span>
                <select
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                >
                  <option value="">Select category</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="CUSTOM_OPTION">
                    Custom (Type new category...)
                  </option>
                </select>
              </label>

              {formCategory === "CUSTOM_OPTION" && (
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    New Category Name
                  </span>
                  <input
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Server, Router, UPS"
                    disabled={submitting}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Purchase Date
                </span>
                <input
                  required
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={formPurchaseDate}
                  onChange={(e) => setFormPurchaseDate(e.target.value)}
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-yellow-500 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Asset"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                disabled={submitting}
                className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assets List Filter & Table */}
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="search"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Search assets by name or ID..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 md:max-w-md"
          />

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All" },
              { id: "available", label: "Available" },
              { id: "assigned", label: "Assigned" },
              { id: "damaged", label: "Damaged" },
              { id: "repair", label: "Under Repair" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setStatusFilter(btn.id);
                  setPage(1);
                }}
                className={`rounded-2xl border px-4 py-2.5 text-xs font-semibold tracking-wider transition ${
                  statusFilter === btn.id
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <SortableHeader label="Asset Name" sortKey="name" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
                <SortableHeader label="Asset ID" sortKey="assetId" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
                <SortableHeader label="Category" sortKey="type" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
                <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} requestSort={requestSort} className="w-1/6 text-center" />
                <SortableHeader label="Assigned To" sortKey="assignedToName" currentSort={sortConfig} requestSort={requestSort} className="w-1/6" />
                <th className="w-1/6 px-4 py-4 text-right text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Loading assets...
                  </td>
                </tr>
              ) : currentPageAssets.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No assets found matching the search or status.
                  </td>
                </tr>
              ) : (
                currentPageAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td className="px-4 py-4 text-sm text-center font-semibold text-slate-900">
                      {asset.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-center text-slate-500 font-mono">
                      {asset.assetId}
                    </td>
                    <td className="px-4 py-4 text-sm text-center text-slate-500 capitalize">
                      {asset.type}
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold border ${
                          asset.status === "available"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : asset.status === "assigned"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : asset.status === "damaged"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : asset.status === "repair"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {asset.status === "damaged"
                          ? "Damaged"
                          : asset.status === "repair"
                            ? "Under Repair"
                            : asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-center text-slate-900">
                      {asset.status === "assigned" && asset.assignedTo ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {asset.assignedTo.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            ID: {asset.assignedTo.employeeId || "—"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <CanAccess permission="manage_asset">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(asset)}
                            className="rounded-xl bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-800 hover:bg-yellow-200 transition animate-fade-in"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </CanAccess>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page} pageCount={pageCount} setPage={setPage}
          canPrev={canPrev} canNext={canNext} prev={prev} next={next}
          showing={currentPageAssets.length} total={filteredAssets.length}
          label="assets"
        />
      </div>

      {/* Edit Asset Modal */}
      {editModalOpen &&
        editAsset &&
        createPortal(
          <div
            onClick={() => {
              setEditModalOpen(false);
              setEditAsset(null);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-black"
            >
              {/* Header */}
              <div className="bg-black px-6 py-5 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-lg">Edit Asset</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modify asset details in inventory catalog
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditAsset(null);
                  }}
                  className="text-slate-400 hover:text-white rounded-full p-1 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Asset Name
                  </span>
                  <input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Asset ID
                  </span>
                  <input
                    required
                    value={editAssetId}
                    onChange={(e) => setEditAssetId(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Category
                  </span>
                  <select
                    required
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="CUSTOM_OPTION">
                      Custom (Type new category...)
                    </option>
                  </select>
                </label>

                {editType === "CUSTOM_OPTION" && (
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      New Category Name
                    </span>
                    <input
                      required
                      value={editCustomType}
                      onChange={(e) => setEditCustomType(e.target.value)}
                      placeholder="e.g. Server"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Purchase Date
                  </span>
                  <input
                    required
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={editPurchaseDate}
                    onChange={(e) => setEditPurchaseDate(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Status
                  </span>
                  {editAsset.status === "assigned" ? (
                    <div className="mt-2">
                      <select
                        disabled
                        value="assigned"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 px-4 py-2.5 text-sm cursor-not-allowed outline-none"
                      >
                        <option value="assigned">Assigned</option>
                      </select>
                      <p className="mt-1.5 text-xs font-medium text-red-400">
                        Status cannot be changed directly while assigned. Use
                        the Assignments page to return/reassign.
                      </p>
                    </div>
                  ) : (
                    <select
                      required
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                    >
                      <option value="available">Available</option>
                      <option value="damaged">Damaged</option>
                      <option value="repair">Under Repair</option>
                    </select>
                  )}
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !hasAssetChanges}
                    className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditAsset(null);
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen &&
        assetToDelete &&
        createPortal(
          <div
            onClick={() => {
              setDeleteModalOpen(false);
              setAssetToDelete(null);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-yellow-400 animate-fade-in"
            >
              {/* Header */}
              <div className="bg-yellow-400 px-6 py-5 flex items-center justify-between text-black">
                <div>
                  <h3 className="font-bold text-lg">Delete Asset</h3>
                  <p className="text-xs font-bold text-black mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setAssetToDelete(null);
                  }}
                  className="text-yellow-400 hover:text-white rounded-full p-1 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-red-500">
                  <svg
                    className="w-10 h-10 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-slate-800">
                    Are you sure you want to permanently delete this asset?
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-500">
                      Asset Name:{" "}
                    </span>
                    <span className="font-bold text-slate-800">
                      {assetToDelete.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">
                      Asset ID:{" "}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {assetToDelete.assetId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-black transition hover:bg-yellow-500 shadow-sm"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setAssetToDelete(null);
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default AdminAssets;
