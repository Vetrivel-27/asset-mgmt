import { useState, useMemo } from 'react';

/**
 * A hook for managing table sorting state and performing client-side sorting.
 * Structured to allow easy migration to server-side sorting: simply use
 * the returned `sortConfig` state to trigger API calls if needed, and ignore `items`.
 */
export function useTableSort(data = [], initialSort = null) {
  const [sortConfig, setSortConfig] = useState(initialSort);

  const requestSort = (key, customSortFn = null) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction, customSortFn });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    // Use a fresh copy to avoid mutating the original array
    const sortableItems = [...data];
    
    sortableItems.sort((a, b) => {
      let aValue = a;
      let bValue = b;

      // Handle nested keys like 'assetId.name'
      const keyParts = sortConfig.key.split('.');
      for (const part of keyParts) {
        aValue = aValue ? aValue[part] : null;
        bValue = bValue ? bValue[part] : null;
      }

      // If a custom sorting function was provided, use it
      if (sortConfig.customSortFn) {
        return sortConfig.customSortFn(aValue, bValue, sortConfig.direction);
      }

      // Default sorting logic
      if (aValue === bValue) return 0;
      
      // Handle nulls/undefined to always push them to the end
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aLower = aValue.toLowerCase();
        const bLower = bValue.toLowerCase();
        if (aLower < bLower) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aLower > bLower) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      // Number/Date comparison
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortableItems;
  }, [data, sortConfig]);

  return { items: sortedData, requestSort, sortConfig };
}
