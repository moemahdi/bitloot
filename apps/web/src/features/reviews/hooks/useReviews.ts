'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { ReviewsApi, Configuration } from '@bitloot/sdk';

// ============ Local Type Definitions ============
// Define local types to avoid SDK 'any' type issues with ESLint
interface LocalCanReviewResponse {
  canReview: boolean;
  reason?: string;
}

interface LocalReviewResponse {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  authorName: string;
  isVerifiedPurchase: boolean;
  productName?: string | null;
  createdAt: Date;
}

interface LocalPaginatedReviews {
  data: LocalReviewResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LocalCreateReviewDto {
  orderId: string;
  productId?: string;
  rating: number;
  title?: string;
  content: string;
  authorName?: string;
}

interface LocalUpdateReviewDto {
  rating?: number;
  title?: string;
  content?: string;
}

// Create SDK configuration
const config = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

const reviewsApi = new ReviewsApi(config);

// ============ Query Keys ============
export const reviewsKeys = {
  all: ['reviews'] as const,
  canReview: (orderId: string) => [...reviewsKeys.all, 'canReview', orderId] as const,
  myReviews: (page: number, limit: number) =>
    [...reviewsKeys.all, 'myReviews', { page, limit }] as const,
  publicReviews: (productId: string, page: number, limit: number) =>
    [...reviewsKeys.all, 'public', productId, { page, limit }] as const,
  homepage: (limit: number) => [...reviewsKeys.all, 'homepage', limit] as const,
};

// ============ Check if User Can Review Order ============
export function useCanReviewOrder(
  orderId: string | undefined
): UseQueryResult<LocalCanReviewResponse, Error> {
  const isValidOrderId =
    orderId !== undefined && orderId !== null && orderId !== '';
  return useQuery({
    queryKey: isValidOrderId ? reviewsKeys.canReview(orderId) : ['disabled'],
    queryFn: async (): Promise<LocalCanReviewResponse> => {
      if (orderId === undefined || orderId === null || orderId === '') {
        return { canReview: false };
      }
      const response = await reviewsApi.reviewsControllerCanReviewOrder({ orderId });
      // Cast SDK response to local type
      return response as LocalCanReviewResponse;
    },
    enabled: isValidOrderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============ Get User's Own Reviews ============
export function useMyReviews(
  page = 1,
  limit = 10
): UseQueryResult<LocalPaginatedReviews, Error> {
  return useQuery({
    queryKey: reviewsKeys.myReviews(page, limit),
    queryFn: async (): Promise<LocalPaginatedReviews> => {
      const response =
        await reviewsApi.reviewsControllerGetMyReviews({ page, limit });
      return response as LocalPaginatedReviews;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============ Get Public Reviews for Product ============
export function usePublicReviews(
  productId: string | undefined,
  page = 1,
  limit = 10
): UseQueryResult<LocalPaginatedReviews, Error> {
  const isValidProductId =
    productId !== undefined && productId !== null && productId !== '';
  return useQuery({
    queryKey: isValidProductId
      ? reviewsKeys.publicReviews(productId, page, limit)
      : ['disabled'],
    queryFn: async (): Promise<LocalPaginatedReviews> => {
      if (productId === undefined || productId === null || productId === '') {
        return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      }
      const response =
        await reviewsApi.reviewsControllerGetPublicReviews({
          productId,
          page,
          limit,
        });
      return response as LocalPaginatedReviews;
    },
    enabled: isValidProductId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============ Get Homepage Reviews ============
export function useHomepageReviews(
  limit = 6
): UseQueryResult<LocalReviewResponse[], Error> {
  return useQuery({
    queryKey: reviewsKeys.homepage(limit),
    queryFn: async (): Promise<LocalReviewResponse[]> => {
      const response: LocalReviewResponse[] = (
        await reviewsApi.reviewsControllerGetHomepageReviews({ limit })
      ) as LocalReviewResponse[];
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - homepage reviews change rarely
  });
}

// ============ Create Review Mutation ============
export function useCreateReview(): UseMutationResult<
  LocalReviewResponse,
  Error,
  LocalCreateReviewDto,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LocalCreateReviewDto): Promise<LocalReviewResponse> => {
      const response: LocalReviewResponse = (await reviewsApi.reviewsControllerCreateReview({
        createReviewDto: data,
      })) as LocalReviewResponse;
      return response;
    },
    onSuccess: (_, variables: LocalCreateReviewDto) => {
      // Invalidate related queries
      void queryClient.invalidateQueries({ queryKey: reviewsKeys.all });
      // Specifically invalidate can-review for this order
      void queryClient.invalidateQueries({
        queryKey: reviewsKeys.canReview(variables.orderId),
      });
    },
  });
}

// ============ Update Own Review Mutation ============
export function useUpdateOwnReview(): UseMutationResult<
  LocalReviewResponse,
  Error,
  { id: string; data: LocalUpdateReviewDto },
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: LocalUpdateReviewDto;
    }): Promise<LocalReviewResponse> => {
      const response: LocalReviewResponse = (await reviewsApi.reviewsControllerUpdateOwnReview({
        id,
        updateReviewDto: data,
      })) as LocalReviewResponse;
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewsKeys.all });
    },
  });
}

// ============ Delete Own Review Mutation ============
export function useDeleteOwnReview(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await reviewsApi.reviewsControllerDeleteOwnReview({ id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewsKeys.all });
    },
  });
}

// ============ Combined Hook for Review Form ============
interface UseReviewFormResult {
  canReview: boolean;
  isCheckingEligibility: boolean;
  eligibilityError: Error | null;
  submitReview: (data: LocalCreateReviewDto) => Promise<LocalReviewResponse>;
  isSubmitting: boolean;
  submitError: Error | null;
  submitSuccess: boolean;
  reset: () => void;
}

export function useReviewForm(orderId: string | undefined): UseReviewFormResult {
  const canReviewQuery = useCanReviewOrder(orderId);
  const createReviewMutation = useCreateReview();

  return {
    canReview: Boolean(canReviewQuery.data?.canReview),
    isCheckingEligibility: canReviewQuery.isLoading,
    eligibilityError: canReviewQuery.error,
    submitReview: createReviewMutation.mutateAsync,
    isSubmitting: createReviewMutation.isPending,
    submitError: createReviewMutation.error,
    submitSuccess: createReviewMutation.isSuccess,
    reset: createReviewMutation.reset,
  };
}
