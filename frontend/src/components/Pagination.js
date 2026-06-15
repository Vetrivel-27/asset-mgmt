/**
 * Reusable Pagination component.
 *
 * Props:
 *   page       – current 1-based page number
 *   pageCount  – total number of pages
 *   setPage    – setter for page number
 *   canPrev    – boolean, true when Previous is clickable
 *   canNext    – boolean, true when Next is clickable
 *   prev       – handler for Previous button
 *   next       – handler for Next button
 *   showing    – number of items currently displayed
 *   total      – total number of items (after filtering)
 *   label      – noun (e.g. "assets", "employees")
 */
function Pagination({
  page,
  pageCount,
  setPage,
  canPrev,
  canNext,
  prev,
  next,
  showing,
  total,
  label = "items",
}) {
  if (pageCount <= 1) return null;

  /** Build the list of page numbers / ellipses to render. */
  const pages = buildPageNumbers(page, pageCount);

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {showing} of {total} {label}
      </p>

      <div className="flex items-center gap-1.5">
        {/* Previous */}
        <button
          onClick={prev}
          disabled={!canPrev}
          className={`flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-bold transition ${
            canPrev
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-slate-50 text-slate-300 cursor-not-allowed"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Numbers */}
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-xs font-bold text-slate-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-[32px] rounded-2xl px-3 py-2 text-xs font-bold transition ${
                page === p
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={next}
          disabled={!canNext}
          className={`flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-bold transition ${
            canNext
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-slate-50 text-slate-300 cursor-not-allowed"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Produce an array like [1,2,3,'…',8,9,10] for the pagination bar.
 * Rules (when pageCount > 7):
 *   - Always show first 3 and last 3 pages.
 *   - Insert '…' between the two groups when there is a gap.
 *   - When the current page bridges the gap, expand to show it.
 */
function buildPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set();

  // Always include first 3 and last 3
  for (let i = 1; i <= 3; i++) pages.add(i);
  for (let i = total - 2; i <= total; i++) pages.add(i);

  // Include current page and neighbours for context
  pages.add(current);
  if (current > 1) pages.add(current - 1);
  if (current < total) pages.add(current + 1);

  const sorted = [...pages].sort((a, b) => a - b);

  // Insert ellipses where there are gaps
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("…");
    }
    result.push(sorted[i]);
  }

  return result;
}

export default Pagination;
