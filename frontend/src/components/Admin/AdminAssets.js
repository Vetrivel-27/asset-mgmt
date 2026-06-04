import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

function AdminAssets() {
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      try {
        const token = localStorage.getItem("authToken");
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
  }, []);

  const handleDelete = async (assetId) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/assets/${assetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete asset");
      }
      setAssets(assets.filter((item) => item._id !== assetId));
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.message || "Failed to delete asset.");
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Assets</h2>
          <p className="text-sm text-slate-500">
            Browse and manage all assets.
          </p>
        </div>
        <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          New Asset
        </button>
      </div>

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
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {asset.status}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {asset.assignedTo || "—"}
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <button className="rounded-2xl bg-yellow-400 px-3 py-2 text-slate-900">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(asset._id)}
                        className="ml-2 rounded-2xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                      >
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
