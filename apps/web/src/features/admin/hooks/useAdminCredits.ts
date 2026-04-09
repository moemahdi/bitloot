'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiConfig } from '@/lib/api-config';
import {
  AdminCreditsApi,
  type AdminCreditsStatsDto,
  type AdminUserBalancesResultDto,
  type AdminUserCreditsDetailDto,
  type AdminCreditsControllerGetUserBalancesSortByEnum,
  type AdminPendingTopupsResultDto,
} from '@bitloot/sdk';

// Re-export types for consumers
export type { AdminCreditsStatsDto as AdminCreditsStats };
export type { AdminUserBalancesResultDto as AdminUserBalancesResult };
export type { AdminUserCreditsDetailDto as AdminUserCreditsDetail };
export type { AdminPendingTopupsResultDto as AdminPendingTopupsResult };

// ── SDK client factory ─────────────────────────────────────────────

function getAdminCreditsApi(): AdminCreditsApi {
  return new AdminCreditsApi(getApiConfig());
}

// ── Hooks ──────────────────────────────────────────────────────────

export function useAdminCreditsStats() {
  return useQuery({
    queryKey: ['admin', 'credits', 'stats'],
    queryFn: () => getAdminCreditsApi().adminCreditsControllerGetStats(),
    staleTime: 60 * 1000,
  });
}

export function useAdminUserBalances(
  page: number = 1,
  limit: number = 20,
  email?: string,
  sortBy?: AdminCreditsControllerGetUserBalancesSortByEnum,
) {
  return useQuery({
    queryKey: ['admin', 'credits', 'users', page, limit, email, sortBy],
    queryFn: () =>
      getAdminCreditsApi().adminCreditsControllerGetUserBalances({
        page,
        limit,
        email,
        sortBy,
      }),
    staleTime: 30 * 1000,
  });
}

export function useAdminUserCredits(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'credits', 'user', userId],
    queryFn: () =>
      getAdminCreditsApi().adminCreditsControllerGetUserCredits({ userId: userId! }),
    enabled: userId !== null,
    staleTime: 30 * 1000,
  });
}

export function useAdminGrantCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; amount: number; reason: string; expiresInDays?: number }) =>
      getAdminCreditsApi().adminCreditsControllerGrantCredits({
        adminGrantCreditsDto: data,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'credits'] });
    },
  });
}

export function useAdminAdjustCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; amount: number; creditType: 'cash' | 'promo'; reason: string }) =>
      getAdminCreditsApi().adminCreditsControllerAdjustCredits({
        adminAdjustCreditsDto: data,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'credits'] });
    },
  });
}

export function useAdminPendingTopups() {
  return useQuery({
    queryKey: ['admin', 'credits', 'topups', 'pending'],
    queryFn: () => getAdminCreditsApi().adminCreditsControllerGetPendingTopups(),
    staleTime: 30 * 1000,
  });
}

export function useAdminConfirmTopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topupId: string) =>
      getAdminCreditsApi().adminCreditsControllerConfirmTopup({ id: topupId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'credits'] });
    },
  });
}
