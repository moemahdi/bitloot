/**
 * Webhook Statistics Hook
 * Fetches dashboard stats for webhook overview
 */

import { useQuery } from '@tanstack/react-query';
import {
  AdminApi,
  AdminControllerGetWebhookStatsPeriodEnum,
} from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminApi = new AdminApi(apiConfig);

export interface WebhookStats {
  total: number;
  processed: number;
  pending: number;
  failed: number;
  invalidSignature: number;
  duplicates: number;
  successRate: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

// SDK only supports these periods
export type StatsPeriod = '24h' | '7d' | '30d';

export interface UseWebhookStatsOptions {
  period?: StatsPeriod;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseWebhookStatsReturn {
  stats: WebhookStats | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Map period string to SDK enum
function getPeriodEnum(period: StatsPeriod): AdminControllerGetWebhookStatsPeriodEnum {
  switch (period) {
    case '24h':
      return AdminControllerGetWebhookStatsPeriodEnum._24h;
    case '7d':
      return AdminControllerGetWebhookStatsPeriodEnum._7d;
    case '30d':
      return AdminControllerGetWebhookStatsPeriodEnum._30d;
    default:
      return AdminControllerGetWebhookStatsPeriodEnum._24h;
  }
}

export function useWebhookStats(options: UseWebhookStatsOptions = {}): UseWebhookStatsReturn {
  const { period = '24h', enabled = true, refetchInterval } = options;

  const query = useQuery<WebhookStats>({
    queryKey: ['webhook-stats', period],
    queryFn: async () => {
      const response = await adminApi.adminControllerGetWebhookStats({
        period: getPeriodEnum(period),
      });
      
      // Transform arrays to Records for component compatibility
      interface ApiStatsResponse {
        total: number;
        processed: number;
        pending: number;
        failed: number;
        byType?: { type: string; count: number }[];
        byStatus?: { status: string; count: number }[];
      }
      const apiResponse = response as unknown as ApiStatsResponse;
      
      // Convert byType array to Record
      const byType: Record<string, number> = {};
      if (Array.isArray(apiResponse.byType)) {
        apiResponse.byType.forEach((item: { type: string; count: number }) => {
          byType[item.type] = item.count;
        });
      }
      
      // Convert byStatus array to Record
      const byStatus: Record<string, number> = {};
      if (Array.isArray(apiResponse.byStatus)) {
        apiResponse.byStatus.forEach((item: { status: string; count: number }) => {
          byStatus[item.status] = item.count;
        });
      }
      
      return {
        ...apiResponse,
        byType,
        byStatus,
      } as WebhookStats;
    },
    enabled,
    staleTime: 30_000, // 30 seconds
    refetchInterval,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
