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
        {pageCount <= 3 ? (
          <>
            {/* Page 1 */}
            <button
              onClick={() => setPage(1)}
              className={`min-w-[32px] rounded-2xl px-3 py-2 text-xs font-bold transition-colors duration-100 ${
                page === 1
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              1
            </button>

            {/* Page 2 (only if pageCount is 3) */}
            {pageCount === 3 && (
              <button
                onClick={() => setPage(2)}
                className={`min-w-[32px] rounded-2xl px-3 py-2 text-xs font-bold transition-colors duration-100 ${
                  page === 2
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                2
              </button>
            )}

            {/* Page Last (if pageCount is 2 or 3) */}
            {pageCount >= 2 && (
              <button
                onClick={() => setPage(pageCount)}
                className={`min-w-[32px] rounded-2xl px-3 py-2 text-xs font-bold transition-colors duration-100 ${
                  page === pageCount
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {pageCount}
              </button>
            )}
          </>
        ) : (
          <>
            {/* 1st Page */}
            <button
              onClick={() => setPage(1)}
              className={`min-w-[32px] rounded-2xl px-3 py-2 text-xs font-bold transition-colors duration-100 ${
                page === 1
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              1
            </button>

            {/* Current Page Middle Indicator (curr) */}
            {page === 1 || page === pageCount ? (
              <span className="min-w-[32px] px-2 text-center text-xs font-bold text-slate-400 select-none flex items-center justify-center">
                …
              </span>
            ) : (
              <button
                onClick={() => setPage(page)}
                className="min-w-[32px] rounded-2xl px-3 py-2 text-xs font-bold bg-slate-900 text-white shadow-sm transition-colors duration-100"
              >
                {page}
              </button>
            )}

            {/* Last Page */}
            <button
              onClick={() => setPage(pageCount)}
              className={`min-w-[32px] rounded-2xl px-3 py-2 text-xs font-bold transition-colors duration-100 ${
                page === pageCount
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {pageCount}
            </button>
          </>
        )}

        {/* Next */}
        <button
          onClick={next}
          disabled={!canNext}
          className={`flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-bold transition-colors duration-100 ${
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

export default Pagination;
