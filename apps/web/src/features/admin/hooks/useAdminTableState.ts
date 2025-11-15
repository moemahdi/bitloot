'use client';

import { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface TableState {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  filters?: Record<string, string | Date | undefined>;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
}

export interface UseAdminTableStateReturn {
  page: number;
  limit: number;
  sortBy: string | undefined;
  sortDirection: SortDirection;
  filters: Record<string, string | Date | undefined>;
  handleSort: (columnKey: string) => void;
  handleFilterChange: (key: string, value: string | Date | undefined) => void;
  goToPage: (pageNum: number) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetState: () => void;
  buildQueryParams: () => string;
}

/**
 * Hook for managing admin table state (pagination, sorting, filtering)
 * Provides consistent behavior across all admin data tables
 */
export function useAdminTableState(defaultLimit: number = 50): UseAdminTableStateReturn {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<Record<string, string | Date | undefined>>({});

  // Handle column header click for sorting
  const handleSort = useCallback((columnKey: string) => {
    setSortBy((prev) => {
      if (prev === columnKey) {
        // Toggle direction if clicking same column
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return columnKey;
      }
      // Reset to desc when switching columns
      setSortDirection('desc');
      return columnKey;
    });
    // Reset to first page when sorting
    setPage(1);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string | Date | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Reset to first page when filtering
    setPage(1);
  }, []);

  // Jump to specific page
  const goToPage = useCallback((pageNum: number) => {
    setPage(Math.max(1, pageNum));
  }, []);

  // Clear all filters and sorting
  const resetState = useCallback(() => {
    setPage(1);
    setLimit(defaultLimit);
    setSortBy(undefined);
    setSortDirection('desc');
    setFilters({});
  }, [defaultLimit]);

  // Build query parameters from state
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', ((page - 1) * limit).toString());

    if (sortBy != null && sortBy.length > 0) {
      params.set('sortBy', sortBy);
      params.set('sortDirection', sortDirection);
    }

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && value !== '') {
        if (value instanceof Date) {
          params.set(`${key}`, value.toISOString());
        } else {
          params.set(key, value);
        }
      }
    });

    return params.toString();
  }, [page, limit, sortBy, sortDirection, filters]);

  return {
    // State
    page,
    limit,
    sortBy,
    sortDirection,
    filters,

    // Actions
    handleSort,
    handleFilterChange,
    goToPage,
    setPage,
    setLimit,
    resetState,

    // Utils
    buildQueryParams,
  };
}
