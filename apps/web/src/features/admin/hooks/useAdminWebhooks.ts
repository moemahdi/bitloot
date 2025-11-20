import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminApi, Configuration } from '@bitloot/sdk';
import type { TableState } from './useAdminTableState';

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});
const adminApi = new AdminApi(apiConfig);

export interface WebhookLog {
  id: string;
  externalId: string;
  webhookType: string;
  payload: string;
  signature?: string;
  signatureValid: boolean;
  processed: boolean;
  orderId?: string;
  paymentId?: string;
  result?: string;
  paymentStatus?: string;
  error?: string;
  sourceIp?: string;
  attemptCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhooksListResponse {
  data: WebhookLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface UseAdminWebhooksOptions extends TableState {
  enabled?: boolean;
}

export interface UseAdminWebhooksReturn {
  query: ReturnType<typeof useQuery<WebhooksListResponse>>;
  replayMutation: ReturnType<typeof useMutation>;
}

export function useAdminWebhooks(state: UseAdminWebhooksOptions): UseAdminWebhooksReturn {
  const queryClient = useQueryClient();

  const query = useQuery<WebhooksListResponse>({
    queryKey: ['admin-webhooks', state],
    queryFn: async () => {
      const response = await adminApi.adminControllerGetWebhookLogs({
        limit: state.limit,
        offset: (state.page - 1) * state.limit,
        webhookType: state.filters?.webhookType as string | undefined,
        paymentStatus: state.filters?.paymentStatus as string | undefined,
      });
      
      // Map the response to our WebhooksListResponse interface
      // Assuming response has data and total properties
      const data = (response.data as unknown as WebhookLog[]) ?? [];
      const total = response.total ?? 0;
      
      return {
        data,
        total,
        page: state.page,
        limit: state.limit,
        totalPages: Math.ceil(total / state.limit),
        hasNextPage: state.page < Math.ceil(total / state.limit),
      };
    },
    enabled: state.enabled !== false,
    staleTime: 30_000,
  });

  const replayMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.adminControllerReplayWebhook({ id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] });
    },
  });

  return {
    query,
    replayMutation,
  };
}
