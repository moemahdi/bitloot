/**
 * Webhook Timeline Hook
 * Fetches time-series data for activity charts
 */

import { useQuery } from '@tanstack/react-query';
import {
  AdminApi,
  AdminControllerGetWebhookTimelinePeriodEnum,
  AdminControllerGetWebhookTimelineIntervalEnum,
} from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminApi = new AdminApi(apiConfig);

export interface TimelineDataPoint {
  timestamp: string;
  total: number;
  processed: number;
  failed: number;
  pending: number;
}

// SDK only supports these periods
export type TimelinePeriod = '24h' | '7d' | '30d';
// SDK only supports hour and day intervals
export type TimelineInterval = 'hour' | 'day';

export interface UseWebhookTimelineOptions {
  period?: TimelinePeriod;
  interval?: TimelineInterval;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseWebhookTimelineReturn {
  data: TimelineDataPoint[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Map period string to SDK enum
function getPeriodEnum(period: TimelinePeriod): AdminControllerGetWebhookTimelinePeriodEnum {
  switch (period) {
    case '24h':
      return AdminControllerGetWebhookTimelinePeriodEnum._24h;
    case '7d':
      return AdminControllerGetWebhookTimelinePeriodEnum._7d;
    case '30d':
      return AdminControllerGetWebhookTimelinePeriodEnum._30d;
    default:
      return AdminControllerGetWebhookTimelinePeriodEnum._24h;
  }
}

// Map interval string to SDK enum
function getIntervalEnum(interval: TimelineInterval): AdminControllerGetWebhookTimelineIntervalEnum {
  switch (interval) {
    case 'hour':
      return AdminControllerGetWebhookTimelineIntervalEnum.Hour;
    case 'day':
      return AdminControllerGetWebhookTimelineIntervalEnum.Day;
    default:
      return AdminControllerGetWebhookTimelineIntervalEnum.Hour;
  }
}

// Get default interval based on period
function getDefaultInterval(period: TimelinePeriod): TimelineInterval {
  switch (period) {
    case '24h':
      return 'hour';
    case '7d':
      return 'hour';
    case '30d':
      return 'day';
    default:
      return 'hour';
  }
}

export function useWebhookTimeline(options: UseWebhookTimelineOptions = {}): UseWebhookTimelineReturn {
  const { period = '24h', interval, enabled = true, refetchInterval } = options;

  // Auto-select interval based on period if not specified
  const effectiveInterval = interval ?? getDefaultInterval(period);

  const query = useQuery<TimelineDataPoint[]>({
    queryKey: ['webhook-timeline', period, effectiveInterval],
    queryFn: async () => {
      const response = await adminApi.adminControllerGetWebhookTimeline({
        period: getPeriodEnum(period),
        interval: getIntervalEnum(effectiveInterval),
      });
      return (response as unknown as { data: TimelineDataPoint[] }).data ?? [];
    },
    enabled,
    staleTime: 60_000, // 1 minute
    refetchInterval,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
