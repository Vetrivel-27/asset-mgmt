/**
 * Dynamic Asset Thumbnail Finder.
 * Renders a category-specific SVG icon based on the asset type string.
 * Extracted from EmployeeAssets.js for reusability.
 */

const AssetThumbnail = ({ type }) => {
  const t = type?.toLowerCase() || "";
  const cls = "w-16 h-16 text-yellow-500 transition-transform duration-300 group-hover:scale-105";

  if (t.includes("laptop") || t.includes("macbook") || t.includes("computer")) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="1" y1="20" x2="23" y2="20" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="20" />
      </svg>
    );
  }
  if (t.includes("phone") || t.includes("mobile") || t.includes("iphone") || t.includes("android")) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <circle cx="12" cy="18" r="1" strokeWidth="2" />
        <line x1="9" y1="5" x2="15" y2="5" strokeLinecap="round" />
      </svg>
    );
  }
  if (t.includes("monitor") || t.includes("screen") || t.includes("display")) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="13" rx="2" />
        <path d="M12 16v4M8 20h8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (t.includes("keyboard")) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 10h2M11 10h2M16 10h2M6 14h12" strokeLinecap="round" />
      </svg>
    );
  }
  if (t.includes("mouse") || t.includes("trackpad")) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="6" y="2" width="12" height="20" rx="6" />
        <path d="M12 2v6M6 9h12" />
      </svg>
    );
  }
  if (t.includes("printer") || t.includes("scanner")) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="6" y="14" width="12" height="8" rx="1" />
      </svg>
    );
  }
  if (t.includes("tablet") || t.includes("ipad")) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <circle cx="12" cy="19" r="1" strokeWidth="2" />
      </svg>
    );
  }
  // Default generic box
  return (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 17m8 4V11" />
    </svg>
  );
};

export default AssetThumbnail;
