import { useEffect, useState } from "react";
import { API_URL } from "../../config";

function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAssignments() {
      try {
        const res = await fetch(`${API_URL}/api/assignments`);
        const data = await res.json();
        if (mounted) setAssignments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load assignments", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAssignments();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Assignments</h2>
          <p className="text-sm text-slate-500">
            View current asset assignments and return status.
          </p>
        </div>
        <button className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900">
          New Assignment
        </button>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
            Loading assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow text-center text-slate-500">
            No assignments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                    Asset
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                    Assigned To
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assignments.map((assignment) => (
                  <tr
                    key={assignment._id || assignment.id || assignment.assetId}
                  >
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {assignment.assetName || assignment.assetId || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {assignment.assignedTo || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {assignment.returned
                        ? "Returned"
                        : assignment.needsReturn
                          ? "Pending Return"
                          : "Active"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {assignment.dueDate
                        ? new Date(assignment.dueDate).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAssignments;
