'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminApi, Configuration, type OrderAnalyticsDto } from '@bitloot/sdk';

/**
 * Create a fresh API config that reads the current token from cookies
 * This ensures the token is read at call-time, not module-load time
 */
function createAdminApi(): AdminApi {
  const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: (): string => {
      if (typeof window !== 'undefined') {
        const value = `; ${document.cookie}`;
        const parts = value.split('; accessToken=');
        if (parts.length === 2) {
          return parts[1]?.split(';')[0] ?? '';
        }
      }
      return '';
    },
  });
  return new AdminApi(config);
}

// Types - align with SDK's OrderAnalyticsDto
export interface OrderAnalytics {
  byStatus: Array<{ status: string; count: number }>;
  bySourceType: Array<{ sourceType: string; count: number }>;
  dailyVolume: Array<{ date: string; count: number; revenue: number }>;
  averageOrderValue: number;
  totalOrders: number;
  totalRevenue: number;
  fulfillmentRate: number;
  failedRate: number;
}

export interface BulkUpdateParams {
  orderIds: string[];
  status: string;
  reason?: string;
}

export interface BulkUpdateResult {
  updated: number;
  failed: string[];
  total: number;
}

export interface ExportParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  sourceType?: string;
}

/**
 * Helper to get access token from cookies
 */
function getAccessTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split('; accessToken=');
  if (parts.length === 2) {
    return parts[1]?.split(';')[0] ?? null;
  }
  return null;
}

/**
 * Hook for fetching order analytics
 * Uses SDK with proper cookie-based authentication
 */
export function useOrderAnalytics(days: number = 30) {
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchAnalytics = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Debug: Log the token being used
      const tokenForDebug = getAccessTokenFromCookies();
      console.info('[useOrderAnalytics] Token available:', tokenForDebug !== null && tokenForDebug !== undefined && tokenForDebug.length > 0 ? `${tokenForDebug.slice(0, 20)}...` : 'NONE');
      
      // Create fresh API client to ensure we get the current token
      const adminApi = createAdminApi();
      const data: OrderAnalyticsDto = await adminApi.adminControllerGetOrderAnalytics({ days });
      
      // Debug: Log the response
      console.info('[useOrderAnalytics] Response received:', {
        totalOrders: data.totalOrders,
        totalRevenue: data.totalRevenue,
        fulfillmentRate: data.fulfillmentRate,
        byStatusCount: data.byStatus?.length ?? 0,
      });
      
      // Map SDK response to our interface
      setAnalytics({
        byStatus: data.byStatus ?? [],
        bySourceType: data.bySourceType ?? [],
        dailyVolume: data.dailyVolume ?? [],
        averageOrderValue: data.averageOrderValue ?? 0,
        totalOrders: data.totalOrders ?? 0,
        totalRevenue: data.totalRevenue ?? 0,
        fulfillmentRate: data.fulfillmentRate ?? 0,
        failedRate: data.failedRate ?? 0,
      });
      setError(null);
    } catch (err) {
      console.error('[useOrderAnalytics] Failed to fetch analytics:', err);
      // Check if it's an authentication error
      if (err instanceof Error && err.message.includes('401')) {
        console.error('[useOrderAnalytics] Authentication error - token may be missing or invalid');
      }
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // On error, set analytics to null to show proper loading states
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics, refreshTrigger]);

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { analytics, isLoading, error, refetch };
}

/**
 * Hook for bulk status updates
 * Uses cookie-based authentication
 */
export function useBulkUpdateStatus() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const bulkUpdate = useCallback(async (params: BulkUpdateParams): Promise<BulkUpdateResult> => {
    setIsUpdating(true);
    setError(null);

    try {
      const token = getAccessTokenFromCookies();
      if (token === null || token === undefined || token === '') {
        throw new Error('No access token - please log in');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/admin/orders/bulk-status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? 'Bulk update failed');
      }

      const result = await response.json() as BulkUpdateResult;
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return { bulkUpdate, isUpdating, error };
}

/**
 * Hook for exporting orders
 * Uses cookie-based authentication
 */
export function useExportOrders() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportOrders = useCallback(async (params: ExportParams): Promise<unknown[]> => {
    setIsExporting(true);
    setError(null);

    try {
      const token = getAccessTokenFromCookies();
      if (token === null || token === undefined || token === '') {
        throw new Error('No access token - please log in');
      }

      const queryParams = new URLSearchParams();
      if (params.startDate !== null && params.startDate !== undefined && params.startDate !== '') queryParams.append('startDate', params.startDate);
      if (params.endDate !== null && params.endDate !== undefined && params.endDate !== '') queryParams.append('endDate', params.endDate);
      if (params.status !== null && params.status !== undefined && params.status !== '') queryParams.append('status', params.status);
      if (params.sourceType !== null && params.sourceType !== undefined && params.sourceType !== '') queryParams.append('sourceType', params.sourceType);

      const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/admin/orders/export?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json() as unknown[];
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportOrders, isExporting, error };
}
