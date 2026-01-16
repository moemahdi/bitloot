/**
 * Webhook Detail Hook
 * Fetches full details of a single webhook including payload and result
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminApi = new AdminApi(apiConfig);

export interface WebhookLogDetail {
  id: string;
  externalId: string | null;
  webhookType: string;
  payload: Record<string, unknown> | null;
  signature: string | null;
  signatureValid: boolean | null;
  processed: boolean;
  orderId: string | null;
  paymentId: string | null;
  result: Record<string, unknown> | null;
  paymentStatus: string | null;
  error: string | null;
  sourceIp: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookAdjacent {
  previousId: string | null;
  nextId: string | null;
}

export interface UseWebhookDetailOptions {
  id: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseWebhookDetailReturn {
  webhook: WebhookLogDetail | undefined;
  adjacent: WebhookAdjacent | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useWebhookDetail(optionsOrId: UseWebhookDetailOptions | string): UseWebhookDetailReturn {
  // Support both string ID and options object
  const options = typeof optionsOrId === 'string' ? { id: optionsOrId } : optionsOrId;
  const { id, enabled = true, refetchInterval } = options;

  const detailQuery = useQuery<WebhookLogDetail>({
    queryKey: ['webhook-detail', id],
    queryFn: async () => {
      const response = await adminApi.adminControllerGetWebhookLogDetail({ id });
      return response as unknown as WebhookLogDetail;
    },
    enabled: enabled && id !== '',
    staleTime: 30_000,
    refetchInterval,
  });

  const adjacentQuery = useQuery<WebhookAdjacent>({
    queryKey: ['webhook-adjacent', id],
    queryFn: async () => {
      const response = await adminApi.adminControllerGetAdjacentWebhooks({ id });
      return response as unknown as WebhookAdjacent;
    },
    enabled: enabled && id !== '',
    staleTime: 60_000,
  });

  return {
    webhook: detailQuery.data,
    adjacent: adjacentQuery.data,
    isLoading: detailQuery.isLoading || adjacentQuery.isLoading,
    error: detailQuery.error ?? adjacentQuery.error,
    refetch: () => {
      void detailQuery.refetch();
      void adjacentQuery.refetch();
    },
  };
}
