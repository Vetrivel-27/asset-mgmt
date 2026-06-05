import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";
import CanAccess from "../CanAccess";

const SEED_CATEGORIES = [
  "Laptop",
  "Mobile",
  "Tablet",
  "Desktop",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Printer"
];

function AdminAssets() {
  const [assets, setAssets] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6); // Pagination limit set to 6 per page
  const [loading, setLoading] = useState(true);

  // Form states (Add Asset)
  const [showForm, setShowForm] = useState(false);
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

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

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

  const pageCount = Math.ceil(filteredAssets.length / pageSize);
  const currentPageAssets = filteredAssets.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

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
    const finalCategory = formCategory === "CUSTOM_OPTION" ? customCategory.trim() : formCategory;

    if (!formName.trim() || !finalCategory || !formPurchaseDate) {
      setSubmitError("Name, category, and purchase date are required.");
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
        throw new Error(data.message || data.error || "Failed to create asset.");
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

  // Delete asset (soft delete)
  const handleDeleteAsset = async (asset) => {
    if (!window.confirm(`Are you sure you want to delete ${asset.name} (${asset.assetId})?`)) {
      return;
    }
    setSubmitError("");
    setSubmitSuccess("");
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assets/${asset._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a._id !== asset._id));
        setSubmitSuccess(`Asset "${asset.name}" removed successfully.`);
        setTimeout(() => setSubmitSuccess(""), 3500);
      } else {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete asset");
      }
    } catch (err) {
      setSubmitError(err.message || "Error deleting asset.");
      setTimeout(() => setSubmitError(""), 5000);
    }
  };

  // Open Edit Modal
  const openEditModal = (asset) => {
    setEditAsset(asset);
    setEditName(asset.name);
    setEditType(categoriesList.includes(asset.type) ? asset.type : "CUSTOM_OPTION");
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

  // Submit Edit Asset
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const finalType = editType === "CUSTOM_OPTION" ? editCustomType.trim() : editType;

    if (!editName.trim() || !finalType || !editAssetId.trim() || !editPurchaseDate) {
      setSubmitError("All fields are required for editing.");
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName.trim(),
          type: finalType,
          assetId: editAssetId.trim(),
          purchaseDate: editPurchaseDate,
          status: editStatus
        })
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Assets Management</h2>
          <p className="text-sm text-slate-500">
            Browse, search, edit, delete, and add new assets to the inventory catalog.
          </p>
        </div>
        <CanAccess permission="manage_asset">
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              resetForm();
            }}
            className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-yellow-500 transition"
          >
            {showForm ? "Cancel" : "New Asset"}
          </button>
        </CanAccess>
      </div>

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
          <h3 className="text-lg font-bold text-slate-900">
            Add New Asset
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Enter the details below. Asset ID is optional and will be auto-generated based on category if left blank.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Asset Name</span>
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
                <span className="text-xs font-semibold text-slate-600">Asset ID <span className="text-slate-400 font-normal">(Optional: Auto-generated)</span></span>
                <input
                  value={formAssetId}
                  onChange={(e) => setFormAssetId(e.target.value)}
                  placeholder="e.g. LAP-001 (or leave blank)"
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Category</span>
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
                  <option value="CUSTOM_OPTION">Custom (Type new category...)</option>
                </select>
              </label>

              {formCategory === "CUSTOM_OPTION" && (
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">New Category Name</span>
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
                <span className="text-xs font-semibold text-slate-600">Purchase Date</span>
                <input
                  required
                  type="date"
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
              { id: "maintenance", label: "Maintenance" }
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
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Asset Name</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Asset ID</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Category</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading assets...
                  </td>
                </tr>
              ) : currentPageAssets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                    No assets found matching the search or status.
                  </td>
                </tr>
              ) : (
                currentPageAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                      {asset.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 font-mono">
                      {asset.assetId}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 capitalize">
                      {asset.type}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold border ${
                          asset.status === "available"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : asset.status === "assigned"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {asset.status}
                      </span>
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
        {pageCount > 1 && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {currentPageAssets.length} of {filteredAssets.length} assets
            </p>

            <div className="flex items-center gap-2">
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index + 1)}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                    page === index + 1
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Asset Modal */}
      {editModalOpen && editAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-lg">Edit Asset</h3>
                <p className="text-xs text-slate-400 mt-0.5">Modify asset details in inventory catalog</p>
              </div>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditAsset(null);
                }}
                className="text-slate-400 hover:text-white rounded-full p-1 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Asset Name</span>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Asset ID</span>
                <input
                  required
                  value={editAssetId}
                  onChange={(e) => setEditAssetId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Category</span>
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
                  <option value="CUSTOM_OPTION">Custom (Type new category...)</option>
                </select>
              </label>

              {editType === "CUSTOM_OPTION" && (
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">New Category Name</span>
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
                <span className="text-xs font-semibold text-slate-600">Purchase Date</span>
                <input
                  required
                  type="date"
                  value={editPurchaseDate}
                  onChange={(e) => setEditPurchaseDate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Status</span>
                <select
                  required
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                >
                  <option value="available">Available</option>
                  <option value="assigned">Assigned</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500 disabled:opacity-50"
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
        </div>
      )}
    </div>
  );
}

export default AdminAssets;
