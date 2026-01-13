'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminApi = new AdminApi(apiConfig);

/**
 * Webhook log entry for IPN History tab
 */
export interface WebhookLogEntry {
  id: string;
  externalId: string;
  webhookType: string;
  paymentStatus: string;
  processed: boolean;
  signatureValid: boolean;
  orderId?: string;
  paymentId?: string;
  error?: string;
  createdAt: string;
}

interface UsePaymentWebhookLogsOptions {
  paymentId: string;
  enabled?: boolean;
}

interface UsePaymentWebhookLogsReturn {
  logs: WebhookLogEntry[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch webhook logs for a specific payment
 * Used in the IPN History tab of PaymentDetailModal
 */
export function usePaymentWebhookLogs(options: UsePaymentWebhookLogsOptions): UsePaymentWebhookLogsReturn {
  const { paymentId, enabled = true } = options;

  const query = useQuery({
    queryKey: ['payment-webhook-logs', paymentId],
    queryFn: async () => {
      const response = await adminApi.adminControllerGetWebhookLogs({
        paymentId,
        limit: 50, // Get all logs for this payment (usually < 10)
        offset: 0,
      });

      return response;
    },
    enabled: enabled && paymentId.length > 0,
    staleTime: 10_000, // Refresh every 10 seconds for pending payments
  });

  const logs: WebhookLogEntry[] = (query.data?.data ?? []).map((item) => ({
    id: (item as Record<string, unknown>).id as string ?? '',
    externalId: (item as Record<string, unknown>).externalId as string ?? '',
    webhookType: (item as Record<string, unknown>).webhookType as string ?? '',
    paymentStatus: (item as Record<string, unknown>).paymentStatus as string ?? 'unknown',
    processed: (item as Record<string, unknown>).processed as boolean ?? false,
    signatureValid: (item as Record<string, unknown>).signatureValid as boolean ?? false,
    orderId: (item as Record<string, unknown>).orderId as string | undefined,
    paymentId: (item as Record<string, unknown>).paymentId as string | undefined,
    error: (item as Record<string, unknown>).error as string | undefined,
    createdAt: (item as Record<string, unknown>).createdAt as string ?? new Date().toISOString(),
  }));

  return {
    logs,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
