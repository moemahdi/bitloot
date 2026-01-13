'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { toast } from 'sonner';

const adminApi = new AdminApi(apiConfig);

/**
 * Valid payment statuses for admin override
 */
export const OVERRIDE_STATUSES = ['confirmed', 'finished', 'underpaid', 'failed'] as const;
export type OverrideStatusType = (typeof OVERRIDE_STATUSES)[number];

/**
 * Status labels for display
 */
export const STATUS_LABELS: Record<OverrideStatusType, string> = {
  confirmed: 'Confirmed',
  finished: 'Finished (Complete)',
  underpaid: 'Underpaid',
  failed: 'Failed',
};

/**
 * Status descriptions for confirmation dialog
 */
export const STATUS_DESCRIPTIONS: Record<OverrideStatusType, string> = {
  confirmed: 'Mark payment as confirmed. Use when blockchain confirms but IPN is delayed.',
  finished: 'Mark payment as complete. Order fulfillment will be triggered.',
  underpaid: 'Mark as underpaid. Customer sent less than required amount.',
  failed: 'Mark payment as failed. This cannot be undone.',
};

interface UpdatePaymentStatusRequest {
  paymentId: string;
  status: OverrideStatusType;
  reason: string;
}

interface UpdatePaymentStatusResponse {
  success: boolean;
  paymentId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
}

/**
 * Hook for manually updating payment status (admin override)
 */
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdatePaymentStatusRequest): Promise<UpdatePaymentStatusResponse> => {
      const response = await adminApi.adminControllerUpdatePaymentStatus({
        id: request.paymentId,
        updatePaymentStatusDto: {
          status: request.status,
          reason: request.reason,
        },
      });
      return response as unknown as UpdatePaymentStatusResponse;
    },
    onSuccess: (data) => {
      toast.success(`Payment status updated to "${data.newStatus}"`, {
        description: `Previous status: ${data.previousStatus}`,
      });
      // Invalidate relevant queries to refresh the data
      void queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      void queryClient.invalidateQueries({ queryKey: ['payment-webhook-logs', data.paymentId] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update payment status', {
        description: error.message,
      });
    },
  });
}
