import React, { useState, useEffect } from "react";
import Button from "../../ui/Button";
import { ASSET_STATUS } from "../../../constants/assetStatus";

export default function AssetForm({
  initialData = null,
  categories = [],
  layout = "grid",
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState("");
  const [assetId, setAssetId] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [status, setStatus] = useState(ASSET_STATUS.AVAILABLE);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setAssetId(initialData.assetId || "");
      setStatus(initialData.status || ASSET_STATUS.AVAILABLE);

      if (categories.includes(initialData.type)) {
        setCategory(initialData.type);
        setCustomCategory("");
      } else if (initialData.type) {
        setCategory("CUSTOM_OPTION");
        setCustomCategory(initialData.type);
      }

      if (initialData.purchaseDate) {
        const dateObj = new Date(initialData.purchaseDate);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const d = String(dateObj.getDate()).padStart(2, "0");
        setPurchaseDate(`${y}-${m}-${d}`);
      }
    }
  }, [initialData, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = category === "CUSTOM_OPTION" ? customCategory.trim() : category;

    if (!name.trim() || !finalCategory || !purchaseDate || (initialData && !assetId.trim())) {
      setError("Please fill in all required fields.");
      return;
    }

    if (new Date(purchaseDate) > new Date()) {
      setError("Purchase date cannot be in the future.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        type: finalCategory,
        assetId: assetId.trim(),
        purchaseDate,
        status,
      });
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm animate-shake">
          {error}
        </div>
      )}

      <div className={layout === "grid" ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Asset Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MacBook Pro 16"
            disabled={submitting}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">
            Asset ID{" "}
            {!initialData && (
              <span className="text-slate-400 font-normal">(Optional: Auto-generated)</span>
            )}
          </span>
          <input
            required={!!initialData}
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="e.g. LAP-0015 (or leave blank)"
            disabled={submitting}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Category</span>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="CUSTOM_OPTION">Custom (Type new category...)</option>
          </select>
        </label>

        {category === "CUSTOM_OPTION" && (
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
            max={new Date().toISOString().split("T")[0]}
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            disabled={submitting}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
          />
        </label>

        {initialData && (
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Status</span>
            {initialData.status === ASSET_STATUS.ASSIGNED ? (
              <div className="mt-2">
                <select
                  disabled
                  value={ASSET_STATUS.ASSIGNED}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 px-4 py-2.5 text-sm cursor-not-allowed outline-none"
                >
                  <option value={ASSET_STATUS.ASSIGNED}>Assigned</option>
                </select>
                <p className="mt-1 text-[10px] text-slate-400">
                  Assigned assets cannot have their status changed manually.
                </p>
              </div>
            ) : (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
              >
                <option value={ASSET_STATUS.AVAILABLE}>Available</option>
                <option value="damaged">Damaged</option>
                <option value="repair">Under Repair</option>
              </select>
            )}
          </label>
        )}
      </div>

      <div className={`flex items-center gap-3 ${layout === "grid" ? "pt-2" : "pt-4"}`}>
        <Button type="submit" loading={submitting}>
          {initialData ? "Save Changes" : "Create Asset"}
        </Button>
        <Button type="button" variant="subtle" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
