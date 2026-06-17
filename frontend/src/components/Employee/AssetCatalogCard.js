import Button from "../ui/Button";
import AssetThumbnail from "../ui/AssetThumbnail";
import { ASSET_STATUS } from "../../constants/assetStatus";

/**
 * A single catalog asset card used in the Employee borrow view.
 * Shows thumbnail, name, ID, status badge, and borrow/disabled button.
 * Extracted from EmployeeAssets.js — no logic or design changes.
 */
export default function AssetCatalogCard({ asset, onBorrow }) {
  const isAssigned = asset.status?.toLowerCase() === ASSET_STATUS.ASSIGNED;
  const isMaintenance =
    asset.status?.toLowerCase() === "damaged" ||
    asset.status?.toLowerCase() === "repair";

  return (
    <div
      className={`group relative flex flex-col rounded-3xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border
        ${isMaintenance ? "border-2 border-red-500 ring-1 ring-red-400" : "border-slate-200 hover:border-slate-300"}
        ${isAssigned ? "opacity-60" : "opacity-100"}
      `}
    >
      {/* Card Image Container */}
      <div className="relative h-44 bg-gradient-to-tr from-slate-50 to-slate-100 flex items-center justify-center border-b border-slate-100 p-6">
        <AssetThumbnail type={asset.type} />

        {/* Absolute Badges on Image */}
        <div className="absolute top-4 right-4">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              asset.status?.toLowerCase() === ASSET_STATUS.AVAILABLE
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isAssigned
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : asset.status?.toLowerCase() === "damaged"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : asset.status?.toLowerCase() === "repair"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            {asset.status === "damaged"
              ? "Damaged"
              : asset.status === "repair"
                ? "Under Repair"
                : asset.status}
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-base text-slate-900 group-hover:text-yellow-600 transition-colors line-clamp-1">
            {asset.name || "—"}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>ID: {asset.assetId || "—"}</span>
            <span>•</span>
            <span className="capitalize">{asset.type || "—"}</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {asset.status?.toLowerCase() === ASSET_STATUS.AVAILABLE ? (
            <Button
              onClick={() => onBorrow(asset)}
              className="w-full"
            >
              Borrow Asset
            </Button>
          ) : (
            <Button
              disabled
              variant="secondary"
              className="w-full"
            >
              {asset.status?.toLowerCase() === "repair"
                ? "Under Repair"
                : isMaintenance
                  ? "Unavailable (Damaged)"
                  : "Borrowed"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
