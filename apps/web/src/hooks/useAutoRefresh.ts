import { useEffect, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseAutoRefreshOptions {
  enableAutoRefresh?: boolean;
  refetchInterval?: number; // milliseconds
  staleTime?: number; // milliseconds
}

/**
 * Hook for managing auto-refresh and manual refresh of TanStack Query data
 * Provides toggle for auto-refresh and immediate refetch capability
 * 
 * @param query - TanStack Query result object
 * @param options - Configuration options
 * @returns Object with isAutoRefreshEnabled, setIsAutoRefreshEnabled, and handleRefresh
 */
export function useAutoRefresh<T>(
  query: UseQueryResult<T>,
  options: UseAutoRefreshOptions = {}
): {
  isAutoRefreshEnabled: boolean;
  setIsAutoRefreshEnabled: (enabled: boolean) => void;
  handleRefresh: () => Promise<void>;
  lastRefreshTime: Date | null;
} {
  const {
    enableAutoRefresh = false,
    refetchInterval = 30_000, // 30 seconds default
  } = options;

  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(enableAutoRefresh);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const interval = setInterval(() => {
      void query.refetch();
      setLastRefreshTime(new Date());
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled, refetchInterval, query]);

  // Manual refresh handler
  const handleRefresh = async (): Promise<void> => {
    await query.refetch();
    setLastRefreshTime(new Date());
  };

  return {
    isAutoRefreshEnabled,
    setIsAutoRefreshEnabled,
    handleRefresh,
    lastRefreshTime,
  };
}
