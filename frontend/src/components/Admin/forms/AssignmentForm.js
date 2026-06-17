import React, { useState } from "react";
import Button from "../../ui/Button";

export default function AssignmentForm({
  availableAssets = [],
  users = [],
  onSubmit,
  onCancel,
}) {
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [tentativeReturnDate, setTentativeReturnDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAssetId || !selectedUserId) {
      setError("Please select both an asset and a user.");
      return;
    }

    if (tentativeReturnDate && new Date(tentativeReturnDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
      setError("Tentative return date cannot be in the past.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await onSubmit({
        assetId: selectedAssetId,
        userId: selectedUserId,
        tentativeReturnDate: tentativeReturnDate || undefined,
      });
    } catch (err) {
      setError(err.message || "Failed to create assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm animate-shake">
          {error}
        </div>
      )}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Select Asset</span>
        <select
          value={selectedAssetId}
          onChange={(e) => setSelectedAssetId(e.target.value)}
          disabled={submitting}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
        >
          <option value="">Choose an available asset</option>
          {availableAssets.map((asset) => (
            <option key={asset._id} value={asset._id}>
              {asset.name} ({asset.assetId})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Assign To (User)</span>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          disabled={submitting}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
        >
          <option value="">Select user</option>
          {users.map((user) => {
            const empId = user.employeeProfile ? user.employeeProfile.employeeId : "No ID";
            return (
              <option key={user._id} value={user._id}>
                {user.displayName} ({empId})
              </option>
            );
          })}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Tentative Return Date (Optional)
        </span>
        <input
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={tentativeReturnDate}
          onChange={(e) => setTentativeReturnDate(e.target.value)}
          disabled={submitting}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-2">
        <Button type="submit" loading={submitting}>
          Assign Asset
        </Button>
        <Button type="button" variant="subtle" onClick={onCancel} disabled={submitting}>
          Close
        </Button>
      </div>
    </form>
  );
}
