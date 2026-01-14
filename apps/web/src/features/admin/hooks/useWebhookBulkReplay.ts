/**
 * Webhook Bulk Replay Hook
 * Handles replaying multiple webhooks at once
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminApi = new AdminApi(apiConfig);

export interface BulkReplayResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

export interface UseWebhookBulkReplayReturn {
  replay: (ids: string[]) => void;
  replayAsync: (ids: string[]) => Promise<BulkReplayResult>;
  isReplaying: boolean;
  result: BulkReplayResult | undefined;
  error: Error | null;
  reset: () => void;
}

export function useWebhookBulkReplay(): UseWebhookBulkReplayReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation<BulkReplayResult, Error, string[]>({
    mutationFn: async (ids: string[]) => {
      const response = await adminApi.adminControllerBulkReplayWebhooks({
        adminControllerBulkReplayWebhooksRequest: { ids },
      });
      return response as unknown as BulkReplayResult;
    },
    onSuccess: () => {
      // Invalidate all webhook-related queries
      void queryClient.invalidateQueries({ queryKey: ['webhook-logs-enhanced'] });
      void queryClient.invalidateQueries({ queryKey: ['webhook-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['webhook-timeline'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] });
    },
  });

  return {
    replay: (ids: string[]) => mutation.mutate(ids),
    replayAsync: (ids: string[]) => mutation.mutateAsync(ids),
    isReplaying: mutation.isPending,
    result: mutation.data,
    error: mutation.error,
    reset: () => mutation.reset(),
  };
}

/**
 * Single webhook replay hook
 */
export interface UseWebhookReplayReturn {
  replay: (id: string) => void;
  replayAsync: (id: string) => Promise<void>;
  isReplaying: boolean;
  error: Error | null;
}

export function useWebhookReplay(): UseWebhookReplayReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await adminApi.adminControllerReplayWebhook({ id });
    },
    onSuccess: (_, id) => {
      // Invalidate specific webhook and lists
      void queryClient.invalidateQueries({ queryKey: ['webhook-detail', id] });
      void queryClient.invalidateQueries({ queryKey: ['webhook-logs-enhanced'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] });
    },
  });

  return {
    replay: (id: string) => mutation.mutate(id),
    replayAsync: (id: string) => mutation.mutateAsync(id),
    isReplaying: mutation.isPending,
    error: mutation.error,
  };
}
