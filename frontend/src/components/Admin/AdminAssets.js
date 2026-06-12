import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";
import { createPortal } from "react-dom";
import CanAccess from "../CanAccess";
import * as XLSX from "xlsx";

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

function AdminAssets() {
  const [assets, setAssets] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6); // Pagination limit set to 6 per page
  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    const isAsc = isActive && sortConfig.direction === "asc";
    const isDesc = isActive && sortConfig.direction === "desc";

    return (
      <svg className="ml-1.5 w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L8 10H16L12 4Z" fill="currentColor" className={isAsc ? "text-slate-800" : "text-slate-300"} />
        <path d="M12 20L16 14H8L12 20Z" fill="currentColor" className={isDesc ? "text-slate-800" : "text-slate-300"} />
      </svg>
    );
  };

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

  // Form states (Delete Confirmation Modal)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Excel upload states
  const [showUpload, setShowUpload] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [excelError, setExcelError] = useState("");
  const [excelSuccess, setExcelSuccess] = useState("");
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleExcelFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const parsed = json.map((row) => {
          const keys = Object.keys(row);
          const getVal = (possibleNames) => {
            const foundKey = keys.find(k => possibleNames.includes(k.toLowerCase().trim()));
            return foundKey ? row[foundKey] : undefined;
          };

          let purchaseDate = getVal(["purchasedate", "purchase date", "date", "purchase_date"]);
          if (purchaseDate) {
            if (typeof purchaseDate === "number") {
              const dateObj = new Date((purchaseDate - 25569) * 86400 * 1000);
              purchaseDate = dateObj.toISOString().split("T")[0];
            } else {
              try {
                const dateObj = new Date(purchaseDate);
                if (!isNaN(dateObj.getTime())) {
                  purchaseDate = dateObj.toISOString().split("T")[0];
                }
              } catch (err) {}
            }
          }

          return {
            name: getVal(["name", "assetname", "asset name", "title"]),
            type: getVal(["type", "category", "assettype", "asset type", "class"]),
            assetId: getVal(["assetid", "asset id", "code", "id"]),
            purchaseDate: purchaseDate || "",
            status: getVal(["status", "assetstatus", "asset status", "condition"]) || "available",
          };
        });

        const validParsed = parsed.filter(item => item.name || item.type);

        if (validParsed.length === 0) {
          setExcelError("No valid rows containing Asset Name and Type/Category were found in the excel file.");
          setExcelData([]);
        } else {
          setExcelData(validParsed);
          setExcelError("");
        }
      } catch (err) {
        console.error(err);
        setExcelError("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.");
        setExcelData([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExcelSubmit = async (e) => {
    e.preventDefault();
    if (excelData.length === 0) return;

    setUploadingExcel(true);
    setExcelError("");
    setExcelSuccess("");

    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assets/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(excelData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join("\n"));
        }
        throw new Error(data.message || "Failed to bulk upload assets.");
      }

      setSubmitSuccess(data.message || `Successfully uploaded ${excelData.length} assets!`);
      setExcelData([]);
      setShowUpload(false);
      await loadAssets();
      await loadCategories();
    } catch (err) {
      setExcelError(err.message || "Failed to upload assets.");
    } finally {
      setUploadingExcel(false);
    }
  };

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

  const sortedAssets = useMemo(() => {
    let sortableItems = [...filteredAssets];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'assignedToName') {
          aValue = a.assignedToName || "";
          bValue = b.assignedToName || "";
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredAssets, sortConfig]);

  const pageCount = Math.max(1, Math.ceil(sortedAssets.length / pageSize));
  const currentPageAssets = sortedAssets.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [filter, statusFilter]);

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
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowForm((prev) => !prev);
                setShowUpload(false);
                resetForm();
              }}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                showForm
                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  : "bg-yellow-400 text-slate-900 hover:bg-yellow-500"
              }`}
            >
              {showForm ? "Cancel" : "New Asset"}
            </button>
            <button
              onClick={() => {
                setShowUpload((prev) => !prev);
                setShowForm(false);
                setExcelData([]);
                setExcelError("");
                setExcelSuccess("");
              }}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                showUpload
                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {showUpload ? "Cancel" : "Upload"}
            </button>
          </div>
        </CanAccess>
      </div>

      {submitSuccess && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 shadow-sm">
          ✓ {submitSuccess}
        </div>
      )}

      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm animate-shake">
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

      {showUpload && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Upload Assets via Excel</h3>
          <p className="mt-1 text-sm text-slate-500">
            Select or drag and drop an Excel file (.xlsx or .xls) to bulk import assets.
          </p>

          <form onSubmit={handleExcelSubmit} className="mt-5 space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive
                  ? "border-yellow-400 bg-yellow-50/50"
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100/70"
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => handleExcelFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
              <p className="mt-4 text-sm font-semibold text-slate-700">
                Drag and drop your Excel file here, or <span className="text-yellow-600 hover:text-yellow-700 underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Supports .xlsx and .xls formats</p>
            </div>

            {/* Error & Success Messages within the component */}
            {excelError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm animate-shake whitespace-pre-line">
                ⚠ {excelError}
              </div>
            )}

            {excelSuccess && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 shadow-sm">
                ✓ {excelSuccess}
              </div>
            )}

            {/* Data Preview */}
            {excelData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">
                    Preview: {excelData.length} Asset{excelData.length > 1 ? "s" : ""} detected
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setExcelData([]);
                      setExcelError("");
                    }}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Clear File
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs">
                  {excelData.map((asset, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100">
                      <div>
                        <div className="font-semibold text-slate-900">{asset.name || "—"}</div>
                        <div className="text-slate-500">Category: {asset.type || "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-700 font-medium">ID: {asset.assetId || "Auto-generated"}</div>
                        <div className="text-slate-400">Date: {asset.purchaseDate || "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={uploadingExcel || excelData.length === 0}
                className="rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-yellow-500 disabled:opacity-50 transition"
              >
                {uploadingExcel ? "Uploading..." : "Confirm Upload"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExcelData([]);
                  setExcelError("");
                  setShowUpload(false);
                }}
                disabled={uploadingExcel}
                className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
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
                <th 
                  onClick={() => handleSort("name")}
                  className="w-1/6 px-4 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  Asset Name <SortIcon columnKey="name" />
                </th>
                <th 
                  onClick={() => handleSort("assetId")}
                  className="w-1/6 px-4 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  Asset ID <SortIcon columnKey="assetId" />
                </th>
                <th 
                  onClick={() => handleSort("type")}
                  className="w-1/6 px-4 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  Category <SortIcon columnKey="type" />
                </th>
                <th 
                  onClick={() => handleSort("status")}
                  className="w-1/6 px-4 py-4 text-center text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  Status <SortIcon columnKey="status" />
                </th>
                <th 
                  onClick={() => handleSort("assignedToName")}
                  className="w-1/6 px-4 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  Assigned To <SortIcon columnKey="assignedToName" />
                </th>
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
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                      {asset.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 font-mono">
                      {asset.assetId}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 capitalize">
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
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {asset.status === "assigned" && asset.assignedTo ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {asset.assignedTo.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            ID: {asset.assignedTo.userId?.userId || "—"}
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
        {pageCount > 1 && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {currentPageAssets.length} of {filteredAssets.length}{" "}
              assets
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
      {editModalOpen &&
        editAsset &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-black animate-modal-in">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-yellow-400 animate-modal-in">
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
