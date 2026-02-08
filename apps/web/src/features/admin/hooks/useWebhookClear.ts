/**
 * Webhook Clear Hook
 * Handles clearing/deleting webhook logs via admin API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminApi = new AdminApi(apiConfig);

interface ClearResult {
  deleted: number;
}

export interface UseWebhookClearReturn {
  clearLogs: (type?: string) => void;
  clearLogsAsync: (type?: string) => Promise<ClearResult>;
  isClearing: boolean;
  result: ClearResult | undefined;
  error: Error | null;
}

export function useWebhookClear(): UseWebhookClearReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation<ClearResult, Error, string | undefined>({
    mutationFn: async (type?: string) => {
      const response = await adminApi.adminControllerClearWebhookLogs({
        type: type !== undefined && type !== '' ? type : undefined,
      });
      return response as unknown as ClearResult;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhook-logs-enhanced'] });
      void queryClient.invalidateQueries({ queryKey: ['webhook-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['webhook-timeline'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] });
    },
  });

  return {
    clearLogs: (type?: string) => mutation.mutate(type),
    clearLogsAsync: (type?: string) => mutation.mutateAsync(type),
    isClearing: mutation.isPending,
    result: mutation.data,
    error: mutation.error,
  };
}
