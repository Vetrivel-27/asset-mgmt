import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

function EmployeeReport() {
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("damage");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [comment, setComment] = useState("");
  const [severity, setSeverity] = useState(60);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await fetch(`${API_URL}/api/assignments/my-assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!mounted) return;
        // Only show active (not yet returned) assignments for reporting
        const active = (Array.isArray(data) ? data : []).filter((a) => !a.returnedDate);
        setMyAssignments(active);
      } catch (err) {
        console.error("Failed to load report assets", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // Build list of assets from my active assignments
  const borrowedAssets = useMemo(() => {
    return myAssignments.map((assignment) => {
      const asset = (typeof assignment.assetId === "object" && assignment.assetId !== null)
        ? assignment.assetId
        : {};
      return {
        ...asset,
        assignmentId: assignment._id,
        assetId: asset.assetId || assignment._id,
      };
    }).filter((a) => a.assignmentId);
  }, [myAssignments]);

  const selectedAsset = useMemo(
    () =>
      borrowedAssets.find(
        (asset) => String(asset.assignmentId) === String(selectedAssignmentId),
      ),
    [borrowedAssets, selectedAssignmentId],
  );

  const reportOptions = [
    { value: "damage", label: "Damaged" },
    // { value: "request_return", label: "Request early return" },
    { value: "missing", label: "Missing / Lost" },
    { value: "other", label: "Other issue" },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!selectedAssignmentId) {
      setError("Please choose the asset you want to report.");
      return;
    }
    if (!comment.trim()) {
      setError("Please describe the issue in the comment box.");
      return;
    }

    const assetToReport = borrowedAssets.find(
      (a) => String(a.assignmentId) === String(selectedAssignmentId)
    );

    if (!assetToReport || !assetToReport._id) {
      setError("Invalid asset selection.");
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assetId: assetToReport._id,
          type: reportType,
          message: comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to submit report.");
      }
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Create a report
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl">
              Choose the asset, select the report category, and send a
              high-impact feedback signal to your admin team.
            </p>
          </div>
          {/* <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Pro tip
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Use the severity slider to highlight urgent issues like damage or
              missing equipment.
            </p>
          </div> */}
        </div>
      </div>

      <div>
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-100 bg-black p-5">
              <div className="flex items-center justify-between gap-4 bg-black">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white">
                    Reporting channel
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
                Loading your borrowed assets...
              </div>
            ) : borrowedAssets.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
                No active borrowed assets found. Assets must be currently assigned
                to you before you can report them.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Report type
                    </label>
                    <div className="grid gap-3">
                      {reportOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setReportType(option.value)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                            reportType === option.value
                              ? "border-yellow-400 bg-yellow-50 text-slate-900 shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="asset"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Select borrowed asset
                    </label>
                    <select
                      id="asset"
                      value={selectedAssignmentId}
                      onChange={(e) => setSelectedAssignmentId(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                    >
                      <option value="">Choose an asset</option>
                      {borrowedAssets.map((asset) => (
                        <option key={asset.assignmentId} value={asset.assignmentId}>
                          {asset.name} — {asset.assetId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                

                <div className="space-y-2">
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Describe the issue
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="6"
                    placeholder="Describe what happened, when it happened, and what you need."
                    className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-3xl bg-gradient-to-r from-yellow-400 to-yellow-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:from-yellow-500 hover:to-yellow-400 transition"
                >
                  Send cosmic report
                </button>

                {sent && (
                  <div className="rounded-3xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700">
                    <p className="font-semibold">Report sent!</p>
                    <p>
                      Your signal has been delivered and the admin team will
                      review it shortly.
                    </p>
                  </div>
                )}
              </form>
            )}
          </div>
        </section>

        {/* <aside className="space-y-6 rounded-[32px] border border-slate-200 bg-slate-950 p-6 shadow-sm text-slate-100">
          <div className="rounded-[32px] border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Report dashboard
            </p>
            <h3 className="mt-3 text-lg font-semibold text-white">
              Signal preview
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Your report will arrive as a bright pulse in the asset operations
              feed.
            </p>
          </div>

          <div className="space-y-4 rounded-[32px] border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Selected asset</span>
              <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-300">
                {selectedAsset ? selectedAsset.name : "None"}
              </span>
            </div>
            <div className="rounded-3xl bg-slate-950 p-4 text-sm text-slate-400">
              <p className="font-semibold text-slate-200">Report type</p>
              <p className="mt-2 text-slate-300">
                {
                  reportOptions.find((option) => option.value === reportType)
                    ?.label
                }
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-4 text-sm text-slate-400">
              <p className="font-semibold text-slate-200">Impact pulse</p>
              <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                  style={{ width: `${severity}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Mission control
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-950 p-3">
                <p className="font-semibold">Current user</p>
                <p className="text-slate-500">{employeeEmail}</p>
              </div>
              <div className="rounded-2xl bg-slate-950 p-3">
                <p className="font-semibold">Assets available</p>
                <p className="text-slate-500">
                  {borrowedAssets.length} borrowed
                </p>
              </div>
            </div>
          </div>
        </aside> */}
      </div>
    </div>
  );
}

export default EmployeeReport;
