'use client';

import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Configuration,
  WatchlistApi,
  type WatchlistItemResponseDto,
  type PaginatedWatchlistResponseDto,
  type CheckWatchlistResponseDto,
} from '@bitloot/sdk';

// Query keys for React Query cache management
export const watchlistKeys = {
  all: ['watchlist'] as const,
  list: (page: number, limit: number) => [...watchlistKeys.all, 'list', { page, limit }] as const,
  count: () => [...watchlistKeys.all, 'count'] as const,
  check: (productId: string) => [...watchlistKeys.all, 'check', productId] as const,
};

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts[1];
    if (cookieValue !== undefined) {
      return cookieValue.split(';')[0] ?? null;
    }
  }
  return null;
}

// Helper to check if user is authenticated
function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = getCookie('accessToken');
  return token !== null && token !== '';
}

// Create API client with auth token
function createWatchlistApi(): WatchlistApi {
  const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: (): string => {
      if (typeof window !== 'undefined') {
        return getCookie('accessToken') ?? '';
      }
      return '';
    },
  });
  return new WatchlistApi(config);
}

/**
 * Hook to fetch the user's watchlist with pagination
 */
export function useWatchlist(page = 1, limit = 20): UseQueryResult<PaginatedWatchlistResponseDto> {
  return useQuery<PaginatedWatchlistResponseDto>({
    queryKey: watchlistKeys.list(page, limit),
    queryFn: async () => {
      const api = createWatchlistApi();
      return api.watchlistControllerGetWatchlist({ page, limit });
    },
    staleTime: 30_000, // 30 seconds
    enabled: isAuthenticated(),
  });
}

/**
 * Hook to get the watchlist count (for badge/indicator)
 */
export function useWatchlistCount(): UseQueryResult<{ count: number }> {
  return useQuery({
    queryKey: watchlistKeys.count(),
    queryFn: async () => {
      const api = createWatchlistApi();
      const response = await api.watchlistControllerGetWatchlistCount();
      return { count: response.count ?? 0 };
    },
    staleTime: 60_000, // 1 minute
    enabled: isAuthenticated(),
  });
}

/**
 * Hook to check if a specific product is in the watchlist
 */
export function useCheckWatchlist(productId: string): UseQueryResult<CheckWatchlistResponseDto> {
  return useQuery<CheckWatchlistResponseDto>({
    queryKey: watchlistKeys.check(productId),
    queryFn: async () => {
      const api = createWatchlistApi();
      return api.watchlistControllerCheckWatchlist({ productId });
    },
    staleTime: 30_000, // 30 seconds
    enabled: isAuthenticated() && productId !== '',
  });
}

/**
 * Hook to add a product to the watchlist
 */
export function useAddToWatchlist(): UseMutationResult<WatchlistItemResponseDto, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<WatchlistItemResponseDto, Error, string>({
    mutationFn: async (productId: string) => {
      // Check authentication before making API call
      if (!isAuthenticated()) {
        throw new Error('LOGIN_REQUIRED');
      }
      const api = createWatchlistApi();
      return api.watchlistControllerAddToWatchlist({
        addToWatchlistDto: { productId },
      });
    },
    onSuccess: (_data, productId) => {
      // Update the check query for this product
      queryClient.setQueryData<CheckWatchlistResponseDto>(
        watchlistKeys.check(productId),
        { isInWatchlist: true }
      );
      // Invalidate the list and count queries
      void queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

/**
 * Hook to remove a product from the watchlist
 */
export function useRemoveFromWatchlist(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (productId: string) => {
      // Check authentication before making API call
      if (!isAuthenticated()) {
        throw new Error('LOGIN_REQUIRED');
      }
      const api = createWatchlistApi();
      await api.watchlistControllerRemoveFromWatchlist({ productId });
    },
    onSuccess: (_data, productId) => {
      // Update the check query for this product
      queryClient.setQueryData<CheckWatchlistResponseDto>(
        watchlistKeys.check(productId),
        { isInWatchlist: false }
      );
      // Invalidate the list and count queries
      void queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

interface ToggleWatchlistResult {
  isInWatchlist: boolean;
  isLoading: boolean;
  toggle: () => Promise<void>;
  error: Error | null;
}

/**
 * Combined hook for toggling watchlist status (add/remove)
 */
export function useToggleWatchlist(productId: string): ToggleWatchlistResult {
  const { data: checkData, isLoading: isCheckLoading } = useCheckWatchlist(productId);
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  const isInWatchlist = checkData?.isInWatchlist ?? false;
  const isLoading = isCheckLoading || addMutation.isPending || removeMutation.isPending;

  const toggle = async (): Promise<void> => {
    if (isInWatchlist) {
      await removeMutation.mutateAsync(productId);
    } else {
      await addMutation.mutateAsync(productId);
    }
  };

  return {
    isInWatchlist,
    isLoading,
    toggle,
    error: addMutation.error ?? removeMutation.error,
  };
}
