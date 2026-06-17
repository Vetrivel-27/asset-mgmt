import { useState, useMemo, useCallback, useEffect } from "react";

/**
 * Reusable pagination hook.
 *
 * @param {Object}  options
 * @param {Array}   options.data        – The full sorted / filtered dataset.
 * @param {number}  [options.pageSize=8] – Items per page.
 * @param {Array}   [options.resetDeps] – When any of these values change, page resets to 1.
 * @returns {{ page, pageCount, pageItems, setPage, canPrev, canNext, prev, next }}
 */
export function usePagination({ data = [], pageSize = 8, resetDeps = [] } = {}) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever any resetDep changes (search, filter, sort, etc.)
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(data.length / pageSize)),
    [data.length, pageSize]
  );

  // Clamp page if data shrinks (e.g. deletion pushes us past the last page)
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize]
  );

  const canPrev = page > 1;
  const canNext = page < pageCount;

  const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const next = useCallback(
    () => setPage((p) => Math.min(pageCount, p + 1)),
    [pageCount]
  );

  return { page, pageCount, pageItems, setPage, canPrev, canNext, prev, next };
}
