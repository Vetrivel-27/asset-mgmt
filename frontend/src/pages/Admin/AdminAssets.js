import { useEffect, useMemo, useState } from "react";
import { assetService } from "../../services/assetService";
import { ASSET_STATUS } from "../../constants/assetStatus";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import CanAccess from "../../components/common/CanAccess";
import BulkUploadForm from "../../components/Admin/BulkUploadForm";
import AssetForm from "../../components/Admin/forms/AssetForm";
import Pagination from "../../components/ui/Pagination";
import AdminAssetsTable from "../../components/Admin/AdminAssetsTable";
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

  // Form states (Edit Asset)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  // Form states (Delete Confirmation Modal)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

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
      const data = await assetService.getCategories();
      setDbCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await assetService.getAll();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load assets", error);
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

  const handleCreateSubmit = async (formData) => {
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const data = await assetService.create(formData);
      setAssets((prevAssets) => [data, ...prevAssets]);
      setShowForm(false);
      setSubmitSuccess("Asset created successfully!");
      loadCategories(); // Refresh dynamic category list
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err) {
      throw err;
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
      await assetService.delete(assetToDelete._id);
      setAssets((prev) => prev.filter((a) => a._id !== assetToDelete._id));
      setSubmitSuccess(`Asset "${assetToDelete.name}" removed successfully.`);
      setTimeout(() => setSubmitSuccess(""), 3500);
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
    setEditModalOpen(true);
  };

  // Submit Edit Asset
  const handleEditSubmit = async (formData) => {
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const data = await assetService.update(editAsset._id, formData);
      setAssets((prev) => prev.map((a) => (a._id === data._id ? data : a)));
      setEditModalOpen(false);
      setEditAsset(null);
      setSubmitSuccess(`Asset "${data.name}" updated successfully!`);
      loadCategories();
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err) {
      throw err;
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
              <Button
                type="button"
                variant="secondary"
                onClick={onReturnToCatalogue}
              >
                ← Return to Catalogue
              </Button>
            )}
            <Button
              type="button"
              variant="subtle"
              onClick={() => {
                setShowBulkUpload((prev) => !prev);
                setShowForm(false);
              }}
            >
              {showBulkUpload ? "Cancel" : "Bulk Upload"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowForm((prev) => !prev);
                setShowBulkUpload(false);
              }}
            >
              {showForm ? "Cancel" : "New Asset"}
            </Button>
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

          <div className="mt-5">
            <AssetForm
              categories={categoriesList}
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowForm(false)}
              layout="grid"
            />
          </div>
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
              { id: ASSET_STATUS.AVAILABLE, label: "Available" },
              { id: ASSET_STATUS.ASSIGNED, label: "Assigned" },
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

        <AdminAssetsTable
          loading={loading}
          assets={currentPageAssets}
          sortConfig={sortConfig}
          requestSort={requestSort}
          openEditModal={openEditModal}
          handleDeleteAsset={handleDeleteAsset}
        />

        {/* Pagination */}
        <Pagination
          page={page} pageCount={pageCount} setPage={setPage}
          canPrev={canPrev} canNext={canNext} prev={prev} next={next}
          showing={currentPageAssets.length} total={filteredAssets.length}
          label="assets"
        />
      </div>

      {/* Edit Asset Modal */}
      <Modal
        isOpen={editModalOpen && !!editAsset}
        onClose={() => {
          setEditModalOpen(false);
          setEditAsset(null);
        }}
        title="Edit Asset"
        subtitle="Modify asset details in inventory catalog"
        headerTheme="dark"
      >
        <div className="p-1">
          <AssetForm
            initialData={editAsset}
            categories={categoriesList}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setEditModalOpen(false);
              setEditAsset(null);
            }}
            layout="stack"
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen && !!assetToDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setAssetToDelete(null);
        }}
        title="Delete Asset"
        message="Are you sure you want to permanently delete this asset?"
        details={assetToDelete ? [
          { label: "Asset Name", value: assetToDelete.name },
          { label: "Asset ID", value: assetToDelete.assetId, mono: true },
        ] : []}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default AdminAssets;
