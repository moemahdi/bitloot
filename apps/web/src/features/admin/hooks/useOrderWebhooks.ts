/**
 * Order Webhooks Hook
 * Fetches all webhooks related to a specific order
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminApi = new AdminApi(apiConfig);

export interface OrderWebhookHistoryItem {
  id: string;
  webhookType: string;
  createdAt: string;
  processed: boolean;
  signatureValid: boolean | null;
  paymentStatus: string | null;
  error: string | null;
  externalId: string | null;
}

export interface UseOrderWebhooksOptions {
  orderId: string;
  enabled?: boolean;
}

export interface UseOrderWebhooksReturn {
  webhooks: OrderWebhookHistoryItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useOrderWebhooks(options: UseOrderWebhooksOptions): UseOrderWebhooksReturn {
  const { orderId, enabled = true } = options;

  const query = useQuery<OrderWebhookHistoryItem[]>({
    queryKey: ['order-webhooks', orderId],
    queryFn: async () => {
      const response = await adminApi.adminControllerGetOrderWebhooks({ orderId });
      // API returns array directly, map to our interface
      return (response as unknown as OrderWebhookHistoryItem[]) ?? [];
    },
    enabled: enabled && orderId !== '',
    staleTime: 30_000,
  });

  return {
    webhooks: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
