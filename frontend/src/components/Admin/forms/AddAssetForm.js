import { useEffect, useState } from "react";
import { assetService } from "../../../services/assetService";
import Button from "../../ui/Button";

const ASSET_CATEGORIES = [
  "Laptop", "Mobile", "Tablet", "Desktop",
  "Monitor", "Keyboard", "Mouse", "Printer",
];

/**
 * Quick-action form for adding a new asset from the Admin Dashboard.
 * Extracted from AdminDashboard.js — no logic or design changes.
 */
export default function AddAssetForm({ onSuccess, onCancel }) {
  const [name, setName] = useState("");
  const [assetId, setAssetId] = useState("");
  const [category, setCategory] = useState("");
  const [customCat, setCustomCat] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCat = category === "CUSTOM" ? customCat.trim() : category;
    if (!name.trim() || !finalCat || !purchaseDate) {
      setError("Name, Category, and Purchase Date are required."); return;
    }
    setSubmitting(true); setError("");
    try {
      const data = await assetService.create({ name: name.trim(), assetId: assetId.trim(), type: finalCat, purchaseDate });
      
      // Reset form states
      setName("");
      setAssetId("");
      setCategory("");
      setCustomCat("");
      setPurchaseDate("");
      
      onSuccess(`Asset "${data.name}" added successfully!`);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleCancel = () => {
    setName("");
    setAssetId("");
    setCategory("");
    setCustomCat("");
    setPurchaseDate("");
    setError("");
    onCancel();
  };

  const inputCls = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100";
  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Asset Name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="MacBook Pro 16" disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Asset ID <span className="text-slate-400 font-normal">(Optional: Auto-generated)</span></span>
          <input value={assetId} onChange={e => setAssetId(e.target.value)} placeholder="e.g. LAP-001 (or leave blank)" disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Category</span>
          <select value={category} onChange={e => setCategory(e.target.value)} disabled={submitting} className={`mt-1 ${inputCls}`}>
            <option value="">Select…</option>
            {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="CUSTOM">Custom…</option>
          </select>
        </label>
        {category === "CUSTOM" && (
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Custom Category</span>
            <input value={customCat} onChange={e => setCustomCat(e.target.value)} placeholder="e.g. Server" disabled={submitting} className={`mt-1 ${inputCls}`} />
          </label>
        )}
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Purchase Date</span>
          <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={submitting} size="sm">
          Add Asset
        </Button>
        <Button type="button" variant="subtle" onClick={handleCancel} disabled={submitting} size="sm">
          Cancel
        </Button>
      </div>
    </form>
  );
}
