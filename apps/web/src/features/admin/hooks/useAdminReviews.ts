import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminReviewsApi,
  type PaginatedAdminReviewsDto,
  type AdminReviewResponseDto,
  type ReviewStatsDto,
  type AdminReviewsControllerGetReviewsStatusEnum,
  type AdminCreateReviewDto,
  type AdminReviewsControllerBulkApprove200Response,
} from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { TableState } from './useAdminTableState';

const adminReviewsApi = new AdminReviewsApi(apiConfig);

export interface ReviewFilters {
  search?: string;
  status?: string;
  minRating?: number;
  maxRating?: number;
  displayOnHomepage?: boolean;
  productId?: string;
  userId?: string;
}

export interface UseAdminReviewsResult {
  reviews: AdminReviewResponseDto[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
  error: Error | null;
}

export function useAdminReviews(state: TableState): UseAdminReviewsResult {
  const { page, limit, filters } = state;
  const search = (filters?.search as string) ?? '';
  const statusFilter = (filters?.status as string) ?? '';
  const minRating = filters?.minRating as number | undefined;
  const maxRating = filters?.maxRating as number | undefined;
  const displayOnHomepage = filters?.displayOnHomepage as boolean | undefined;

  const query = useQuery<PaginatedAdminReviewsDto>({
    queryKey: ['admin-reviews', page, limit, search, statusFilter, minRating, maxRating, displayOnHomepage],
    queryFn: () =>
      adminReviewsApi.adminReviewsControllerGetReviews({
        page,
        limit,
        search: search.length > 0 ? search : undefined,
        status:
          statusFilter.length > 0 && statusFilter !== 'all'
            ? (statusFilter as AdminReviewsControllerGetReviewsStatusEnum)
            : undefined,
        minRating,
        maxRating,
        displayOnHomepage,
      }),
  });

  return {
    reviews: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
  };
}

export function useAdminReviewStats(): ReturnType<typeof useQuery<ReviewStatsDto>> {
  return useQuery<ReviewStatsDto>({
    queryKey: ['admin-review-stats'],
    queryFn: () => adminReviewsApi.adminReviewsControllerGetStats(),
  });
}

export function useModerateReview(): ReturnType<typeof useMutation<AdminReviewResponseDto, Error, { id: string; status: 'approved' | 'rejected'; adminNotes?: string }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: 'approved' | 'rejected'; adminNotes?: string }) =>
      adminReviewsApi.adminReviewsControllerModerateReview({
        id,
        moderateReviewDto: { status, adminNotes },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-review-stats'] });
    },
  });
}

export function useToggleHomepageDisplay(): ReturnType<typeof useMutation<AdminReviewResponseDto, Error, string>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      adminReviewsApi.adminReviewsControllerToggleHomepageDisplay({ id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}

export function useDeleteReview(): ReturnType<typeof useMutation<void, Error, string>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      adminReviewsApi.adminReviewsControllerDeleteReview({ id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-review-stats'] });
    },
  });
}

export function useBulkApproveReviews(): ReturnType<typeof useMutation<AdminReviewsControllerBulkApprove200Response, Error, void>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminReviewsApi.adminReviewsControllerBulkApprove(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-review-stats'] });
    },
  });
}

export function useBulkRejectReviews(): ReturnType<typeof useMutation<AdminReviewsControllerBulkApprove200Response, Error, void>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminReviewsApi.adminReviewsControllerBulkReject(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-review-stats'] });
    },
  });
}

export function useBulkDeleteReviews(): ReturnType<typeof useMutation<AdminReviewsControllerBulkApprove200Response, Error, void>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminReviewsApi.adminReviewsControllerBulkDelete(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-review-stats'] });
    },
  });
}

export function useAdminCreateReview(): ReturnType<typeof useMutation<AdminReviewResponseDto, Error, AdminCreateReviewDto>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminCreateReviewDto) =>
      adminReviewsApi.adminReviewsControllerCreateReview({
        adminCreateReviewDto: data,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-review-stats'] });
    },
  });
}
