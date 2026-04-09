'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiConfig } from '@/lib/api-config';
import {
  CreditsApi,
  type CreditBalanceDto,
  type CreditTransactionListDto,
  type ExpiringCreditsDto,
  type TopupResponseDto,
  type CreditsControllerGetTransactionsCreditTypeEnum,
} from '@bitloot/sdk';

// Re-export types for consumers
export type { CreditBalanceDto as CreditBalance };
export type { CreditTransactionListDto as CreditTransactionList };
export type { ExpiringCreditsDto as ExpiringCredits };
export type { TopupResponseDto as TopupResponse };

// ── SDK client factory ─────────────────────────────────────────────

function getCreditsApi(): CreditsApi {
  return new CreditsApi(getApiConfig());
}

// ── Hooks ──────────────────────────────────────────────────────────

export function useCreditBalance() {
  return useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: () => getCreditsApi().creditsControllerGetBalance(),
    staleTime: 30 * 1000, // 30 seconds - balance changes with orders
  });
}

export function useCreditTransactions(
  page: number = 1,
  limit: number = 20,
  creditType?: CreditsControllerGetTransactionsCreditTypeEnum,
) {
  return useQuery({
    queryKey: ['credits', 'transactions', page, limit, creditType],
    queryFn: () =>
      getCreditsApi().creditsControllerGetTransactions({
        page,
        limit,
        creditType,
      }),
    staleTime: 30 * 1000,
  });
}

export function useExpiringCredits() {
  return useQuery({
    queryKey: ['credits', 'expiring'],
    queryFn: () => getCreditsApi().creditsControllerGetExpiring(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) =>
      getCreditsApi().creditsControllerCreateTopup({
        createTopupDto: { amount },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
  });
}
