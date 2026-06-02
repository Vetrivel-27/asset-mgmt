import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

function EmployeeStatus() {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      try {
        const [assignRes, assetRes] = await Promise.all([
          fetch(`${API_URL}/api/assignments`),
          fetch(`${API_URL}/api/assets`),
        ]);

        const [assignmentData, assetData] = await Promise.all([
          assignRes.json(),
          assetRes.json(),
        ]);

        if (!mounted) return;

        setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
        setAssets(Array.isArray(assetData) ? assetData : []);
      } catch (error) {
        console.error("Failed to load asset status", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const currentEmployeeEmail =
    localStorage.getItem("employeeEmail") || "employee@gmail.com";

  const currentEmployeeAssignments = useMemo(() => {
    const employeeAssignments = assignments.filter((assignment) => {
      if (!assignment.employee) return true;
      return assignment.employee.email === currentEmployeeEmail;
    });

    return employeeAssignments.map((assignment) => {
      const matchedAsset = assets.find((asset) => {
        if (assignment.assetId && asset.assetId != null) {
          return String(asset.assetId) === String(assignment.assetId);
        }
        return (
          assignment.asset && String(asset._id) === String(assignment.asset)
        );
      });

      return {
        ...assignment,
        asset: matchedAsset || assignment.asset || {},
      };
    });
  }, [assignments, assets, currentEmployeeEmail]);

  const getStatusLabel = (asset) => {
    const state = (asset.status || "").toLowerCase();

    if (state === "assigned" || state === "approved") {
      return { text: "Approved", classes: "bg-green-100 text-green-700" };
    }
    if (state === "available" || state === "pending") {
      return {
        text: "Pending approval",
        classes: "bg-yellow-100 text-yellow-700",
      };
    }
    if (state === "rejected" || state === "damaged") {
      return { text: "Needs attention", classes: "bg-red-100 text-red-700" };
    }
    return { text: "Under review", classes: "bg-slate-100 text-slate-700" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Asset Status</h2>
        <p className="text-sm text-slate-500">
          Review the approval status and current state of your assigned assets.
        </p>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
            Loading asset status...
          </div>
        ) : currentEmployeeAssignments.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
            No assigned assets found for {currentEmployeeEmail}.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {currentEmployeeAssignments.map((assignment) => {
                const asset = assignment.asset || {};
                const status = getStatusLabel(asset);

                return (
                  <div
                    key={assignment._id || assignment.assetId || asset.assetId}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Asset status
                        </p>
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">
                          {asset.name || `Asset ${asset.assetId || "#"}`}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          ID: {asset.assetId ?? assignment.assetId ?? "—"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
                      >
                        {status.text}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <span>Requested</span>
                        <span>
                          {assignment.assignedDate
                            ? new Date(
                                assignment.assignedDate,
                              ).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <span>Return Date</span>
                        <span>
                          {assignment.returnDate
                            ? new Date(
                                assignment.returnDate,
                              ).toLocaleDateString()
                            : "Pending"}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm text-slate-500">
                        <p className="font-medium text-slate-700">
                          Assigned by
                        </p>
                        <p>
                          {assignment.employee?.name || currentEmployeeEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeStatus;
