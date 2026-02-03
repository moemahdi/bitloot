/**
 * Enhanced Webhook List Hook
 * Fetches paginated webhook logs with advanced filtering
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminApi,
  AdminControllerGetWebhookLogsEnhancedSignatureValidEnum,
  AdminControllerGetWebhookLogsEnhancedSortByEnum,
  AdminControllerGetWebhookLogsEnhancedSortOrderEnum,
  type PaginatedWebhookLogsDto,
  type WebhookLogListItemDto,
} from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { WebhookFiltersState } from '../components/webhooks/WebhookFilters';

const adminApi = new AdminApi(apiConfig);

// Helper to convert signatureValid filter to SDK enum
function getSignatureValidEnum(
  value: string,
): AdminControllerGetWebhookLogsEnhancedSignatureValidEnum | undefined {
  if (value === 'true') return AdminControllerGetWebhookLogsEnhancedSignatureValidEnum.True;
  if (value === 'false') return AdminControllerGetWebhookLogsEnhancedSignatureValidEnum.False;
  return undefined; // 'all' or other values
}

// Helper to convert sortBy filter to SDK enum
function getSortByEnum(
  value: string,
): AdminControllerGetWebhookLogsEnhancedSortByEnum {
  switch (value) {
    case 'paymentStatus':
      return AdminControllerGetWebhookLogsEnhancedSortByEnum.PaymentStatus;
    case 'webhookType':
      return AdminControllerGetWebhookLogsEnhancedSortByEnum.WebhookType;
    case 'createdAt':
    default:
      return AdminControllerGetWebhookLogsEnhancedSortByEnum.CreatedAt;
  }
}

// Helper to convert sortOrder filter to SDK enum
function getSortOrderEnum(
  value: 'asc' | 'desc',
): AdminControllerGetWebhookLogsEnhancedSortOrderEnum {
  return value === 'asc'
    ? AdminControllerGetWebhookLogsEnhancedSortOrderEnum.Asc
    : AdminControllerGetWebhookLogsEnhancedSortOrderEnum.Desc;
}

// Re-export SDK types for convenience
export type { PaginatedWebhookLogsDto, WebhookLogListItemDto };

// Legacy type aliases for backward compatibility
export type WebhookLogListItem = WebhookLogListItemDto;
export type PaginatedWebhookLogs = PaginatedWebhookLogsDto;

export interface UseWebhookLogsEnhancedOptions {
  filters: WebhookFiltersState;
  page: number;
  limit: number;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseWebhookLogsEnhancedReturn {
  webhooks: PaginatedWebhookLogsDto | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
  invalidate: () => void;
}

export function useWebhookLogsEnhanced(options: UseWebhookLogsEnhancedOptions): UseWebhookLogsEnhancedReturn {
  const { filters, page, limit, enabled = true, refetchInterval } = options;
  const queryClient = useQueryClient();

  const query = useQuery<PaginatedWebhookLogsDto>({
    queryKey: ['webhook-logs-enhanced', filters, page, limit],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      const response = await adminApi.adminControllerGetWebhookLogsEnhanced({
        limit,
        offset,
        search: filters.search !== '' ? filters.search : undefined,
        webhookType: filters.webhookType !== 'all' ? filters.webhookType : undefined,
        signatureValid:
          filters.signatureValid !== 'all' ? getSignatureValidEnum(filters.signatureValid) : undefined,
        paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        sortBy: getSortByEnum(filters.sortBy),
        sortOrder: getSortOrderEnum(filters.sortOrder),
      });
      return response;
    },
    enabled,
    staleTime: 15_000, // 15 seconds
    placeholderData: (previousData) => previousData,
    refetchInterval,
  });

  return {
    webhooks: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: () => void query.refetch(),
    invalidate: () => void queryClient.invalidateQueries({ queryKey: ['webhook-logs-enhanced'] }),
  };
}
