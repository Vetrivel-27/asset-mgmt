import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [formAssetId, setFormAssetId] = useState("");
  const [formPurchaseDate, setFormPurchaseDate] = useState("");
  
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

  useEffect(() => {
    async function loadAssets() {
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
    }
    loadAssets();
    loadCategories();
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(filter.toLowerCase()) ||
        asset.assetId.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [assets, filter]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const finalCategory = formCategory === "CUSTOM_OPTION" ? customCategory.trim() : formCategory;

    if (!formName.trim() || !finalCategory || !formAssetId.trim() || !formPurchaseDate) {
      setSubmitError("All fields are required.");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Assets</h2>
          <p className="text-sm text-slate-500">
            Browse and manage all assets.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm((prev) => !prev);
            resetForm();
          }}
          className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-yellow-350 transition"
        >
          {showForm ? "Cancel" : "New Asset"}
        </button>
      </div>

      {submitSuccess && (
        <div className="rounded-2xl bg-green-100 p-4 text-sm text-green-700">
          {submitSuccess}
        </div>
      )}

      {showForm && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Add New Asset
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Enter the asset details to add it to the inventory database.
          </p>

          {submitError && (
            <div className="mt-4 rounded-2xl bg-red-100 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Asset Name</span>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. MacBook Pro 16"
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Asset ID</span>
              <input
                value={formAssetId}
                onChange={(e) => setFormAssetId(e.target.value)}
                placeholder="e.g. LAP-001"
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
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
                <span className="text-sm font-medium text-slate-700">New Category Name</span>
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Server, Router, UPS"
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Purchase Date</span>
              <input
                type="date"
                value={formPurchaseDate}
                onChange={(e) => setFormPurchaseDate(e.target.value)}
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-yellow-350 disabled:opacity-50"
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
                className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="search"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Search assets by name or ID"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 md:max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <button className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900">
              All
            </button>
            <button className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900">
              Assigned
            </button>
            <button className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900">
              Available
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                  Asset
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                  Type
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                  Assigned To
                </th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Loading assets...
                  </td>
                </tr>
              ) : currentPageAssets.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No assets found.
                  </td>
                </tr>
              ) : (
                currentPageAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {asset.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {asset.type}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 capitalize">
                      {asset.status}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {asset.assignedTo || "—"}
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <button className="rounded-2xl bg-yellow-400 px-3 py-2 text-slate-900">
                        Edit
                      </button>
                      <button className="ml-2 rounded-2xl border border-slate-300 px-3 py-2 text-slate-700">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {currentPageAssets.length} of {filteredAssets.length} assets
          </p>

          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                onClick={() => setPage(index + 1)}
                className={`rounded-2xl px-4 py-2 text-sm ${page === index + 1 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAssets;
