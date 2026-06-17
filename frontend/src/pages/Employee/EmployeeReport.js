import { useEffect, useMemo, useState } from "react";
import { assignmentService } from "../../services/assignmentService";
import { reportService } from "../../services/reportService";
import Button from "../../components/ui/Button";

function EmployeeReport() {
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("damage");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (sent) {
      const timer = setTimeout(() => setSent(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [sent]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const data = await assignmentService.getMyAssignments();
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


  const reportOptions = [
    { value: "damage", label: "Damaged" },
    { value: "lost", label: "Missing / Lost" },
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
    try {
      await reportService.create({
        assetId: assetToReport._id,
        type: reportType,
        message: comment,
      });
      setSent(true);
      setComment("");
      setSelectedAssignmentId("");
      setReportType("damage");
    } catch (err) {
      setError(err.message || "Something went wrong.");
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
                        <Button
                          key={option.value}
                          type="button"
                          onClick={() => setReportType(option.value)}
                          className={`w-full text-left justify-start !border ${
                            reportType === option.value
                              ? "!border-yellow-400 !bg-yellow-50 !text-slate-900 shadow-sm hover:!bg-yellow-100"
                              : "!border-slate-200 !bg-white !text-slate-700 hover:!border-slate-300 hover:!bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </Button>
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

                <Button
                  type="submit"
                  className="w-full"
                >
                  Send your report
                </Button>

                {sent && (
                  <div className="rounded-3xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700">
                    <p className="font-semibold">Report sent!</p>
                    <p>
                      Your report has been delivered and the admin team will
                      review it shortly.
                    </p>
                  </div>
                )}
              </form>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

export default EmployeeReport;
