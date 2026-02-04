'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminUsersApi,
  type AdminUserListItemDto,
  type AdminUserDetailDto,
  type AdminUserStatsDto,
  type AdminUserSessionDto,
  type AdminUserOrderDto,
  type AdminUserReviewDto,
  type AdminUserPromoDto,
  type AdminUserWatchlistItemDto,
  type AdminUserActivityDto,
  type PaginatedAdminUsersDto,
  type PaginatedUserSessionsDto,
  type PaginatedUserOrdersDto,
  type PaginatedUserReviewsDto,
  type PaginatedUserPromosDto,
  type PaginatedUserWatchlistDto,
  type PaginatedUserActivityDto,
  type UpdateAdminUserDto,
  type SuspendUserDto,
  type ChangeUserRoleDto,
  AdminUsersControllerListUsersRoleEnum,
  AdminUsersControllerListUsersStatusEnum,
  AdminUsersControllerListUsersSortByEnum,
  AdminUsersControllerListUsersSortOrderEnum,
} from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { TableState } from './useAdminTableState';

const adminUsersApi = new AdminUsersApi(apiConfig);

// Re-export SDK types for convenience
export type {
  AdminUserListItemDto,
  AdminUserDetailDto,
  AdminUserStatsDto,
  AdminUserSessionDto,
  AdminUserOrderDto,
  AdminUserReviewDto,
  AdminUserPromoDto,
  AdminUserWatchlistItemDto,
  AdminUserActivityDto,
};

export {
  AdminUsersControllerListUsersRoleEnum as UserRoleEnum,
  AdminUsersControllerListUsersStatusEnum as UserStatusEnum,
  AdminUsersControllerListUsersSortByEnum as UserSortByEnum,
  AdminUsersControllerListUsersSortOrderEnum as UserSortOrderEnum,
};

// ============================================================================
// LIST USERS HOOK
// ============================================================================

export interface UseAdminUsersReturn {
  users: AdminUserListItemDto[];
  total: number;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => Promise<unknown>;
  error: Error | null;
}

export function useAdminUsers(state: TableState): UseAdminUsersReturn {
  const { page, limit, filters, sortBy, sortDirection } = state;
  const search = (filters?.search as string) ?? '';
  const roleFilter = (filters?.role as string) ?? '';
  const statusFilter = (filters?.status as string) ?? '';
  const emailConfirmedFilter = filters?.emailConfirmed as string | undefined;

  const query = useQuery<PaginatedAdminUsersDto>({
    queryKey: ['admin-users', page, limit, search, roleFilter, statusFilter, emailConfirmedFilter, sortBy, sortDirection],
    queryFn: () =>
      adminUsersApi.adminUsersControllerListUsers({
        limit,
        offset: (page - 1) * limit,
        search: search.length > 0 ? search : undefined,
        role: roleFilter.length > 0 && roleFilter !== 'all' 
          ? roleFilter as AdminUsersControllerListUsersRoleEnum
          : undefined,
        status: statusFilter.length > 0 && statusFilter !== 'all'
          ? statusFilter as AdminUsersControllerListUsersStatusEnum
          : undefined,
        emailConfirmed: emailConfirmedFilter === 'true' ? true : emailConfirmedFilter === 'false' ? false : undefined,
        sortBy: sortBy != null && sortBy.length > 0
          ? sortBy as AdminUsersControllerListUsersSortByEnum
          : undefined,
        sortOrder: sortDirection as AdminUsersControllerListUsersSortOrderEnum,
      }),
  });

  return {
    users: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    error: query.error,
  };
}

// ============================================================================
// USER STATS HOOK
// ============================================================================

export interface UseUserStatsReturn {
  stats: AdminUserStatsDto | null;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export function useUserStats(): UseUserStatsReturn {
  const query = useQuery<AdminUserStatsDto>({
    queryKey: ['admin-users-stats'],
    queryFn: () => adminUsersApi.adminUsersControllerGetStats(),
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ============================================================================
// USER DETAIL HOOK
// ============================================================================

export interface UseUserDetailReturn {
  user: AdminUserDetailDto | null;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
  error: Error | null;
}

export function useUserDetail(userId: string): UseUserDetailReturn {
  const query = useQuery<AdminUserDetailDto>({
    queryKey: ['admin-user', userId],
    queryFn: () => adminUsersApi.adminUsersControllerGetUser({ id: userId }),
    enabled: userId.length > 0,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
  };
}

// ============================================================================
// USER SESSIONS HOOK
// ============================================================================

export interface UseUserSessionsReturn {
  sessions: AdminUserSessionDto[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export function useUserSessions(userId: string, limit = 20, offset = 0): UseUserSessionsReturn {
  const query = useQuery<PaginatedUserSessionsDto>({
    queryKey: ['admin-user-sessions', userId, limit, offset],
    queryFn: () => adminUsersApi.adminUsersControllerGetUserSessions({ id: userId, limit, offset }),
    enabled: userId.length > 0,
  });

  return {
    sessions: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ============================================================================
// USER ORDERS HOOK
// ============================================================================

export interface UseUserOrdersReturn {
  orders: AdminUserOrderDto[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export function useUserOrders(userId: string, limit = 20, offset = 0): UseUserOrdersReturn {
  const query = useQuery<PaginatedUserOrdersDto>({
    queryKey: ['admin-user-orders', userId, limit, offset],
    queryFn: () => adminUsersApi.adminUsersControllerGetUserOrders({ id: userId, limit, offset }),
    enabled: userId.length > 0,
  });

  return {
    orders: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ============================================================================
// USER REVIEWS HOOK
// ============================================================================

export interface UseUserReviewsReturn {
  reviews: AdminUserReviewDto[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export function useUserReviews(userId: string, limit = 20, offset = 0): UseUserReviewsReturn {
  const query = useQuery<PaginatedUserReviewsDto>({
    queryKey: ['admin-user-reviews', userId, limit, offset],
    queryFn: () => adminUsersApi.adminUsersControllerGetUserReviews({ id: userId, limit, offset }),
    enabled: userId.length > 0,
  });

  return {
    reviews: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ============================================================================
// USER PROMOS HOOK
// ============================================================================

export interface UseUserPromosReturn {
  promos: AdminUserPromoDto[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export function useUserPromos(userId: string, limit = 20, offset = 0): UseUserPromosReturn {
  const query = useQuery<PaginatedUserPromosDto>({
    queryKey: ['admin-user-promos', userId, limit, offset],
    queryFn: () => adminUsersApi.adminUsersControllerGetUserPromos({ id: userId, limit, offset }),
    enabled: userId.length > 0,
  });

  return {
    promos: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ============================================================================
// USER WATCHLIST HOOK
// ============================================================================

export interface UseUserWatchlistReturn {
  items: AdminUserWatchlistItemDto[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export function useUserWatchlist(userId: string, limit = 20, offset = 0): UseUserWatchlistReturn {
  const query = useQuery<PaginatedUserWatchlistDto>({
    queryKey: ['admin-user-watchlist', userId, limit, offset],
    queryFn: () => adminUsersApi.adminUsersControllerGetUserWatchlist({ id: userId, limit, offset }),
    enabled: userId.length > 0,
  });

  return {
    items: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ============================================================================
// USER ACTIVITY HOOK
// ============================================================================

export interface UseUserActivityReturn {
  activities: AdminUserActivityDto[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export function useUserActivity(userId: string, limit = 50, offset = 0): UseUserActivityReturn {
  const query = useQuery<PaginatedUserActivityDto>({
    queryKey: ['admin-user-activity', userId, limit, offset],
    queryFn: () => adminUsersApi.adminUsersControllerGetUserActivity({ id: userId, limit, offset }),
    enabled: userId.length > 0,
  });

  return {
    activities: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ============================================================================
// USER MUTATIONS
// ============================================================================

export interface UseUpdateUserReturn {
  updateUser: (userId: string, data: UpdateAdminUserDto) => Promise<AdminUserDetailDto>;
  isUpdating: boolean;
}

export function useUpdateUser(): UseUpdateUserReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateAdminUserDto }) =>
      adminUsersApi.adminUsersControllerUpdateUser({ id: userId, updateAdminUserDto: data }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] });
    },
  });

  return {
    updateUser: async (userId: string, data: UpdateAdminUserDto) => {
      return await mutation.mutateAsync({ userId, data });
    },
    isUpdating: mutation.isPending,
  };
}

export interface UseChangeRoleReturn {
  changeRole: (userId: string, role: 'user' | 'admin') => Promise<AdminUserDetailDto>;
  isChanging: boolean;
}

export function useChangeRole(): UseChangeRoleReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'user' | 'admin' }) =>
      adminUsersApi.adminUsersControllerChangeRole({ 
        id: userId, 
        changeUserRoleDto: { role } as ChangeUserRoleDto 
      }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
    },
  });

  return {
    changeRole: async (userId: string, role: 'user' | 'admin') => {
      return await mutation.mutateAsync({ userId, role });
    },
    isChanging: mutation.isPending,
  };
}

export interface UseSuspendUserReturn {
  suspendUser: (userId: string, reason: string) => Promise<AdminUserDetailDto>;
  isSuspending: boolean;
}

export function useSuspendUser(): UseSuspendUserReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminUsersApi.adminUsersControllerSuspendUser({ 
        id: userId, 
        suspendUserDto: { reason } as SuspendUserDto 
      }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
    },
  });

  return {
    suspendUser: async (userId: string, reason: string) => {
      return await mutation.mutateAsync({ userId, reason });
    },
    isSuspending: mutation.isPending,
  };
}

export interface UseUnsuspendUserReturn {
  unsuspendUser: (userId: string) => Promise<AdminUserDetailDto>;
  isUnsuspending: boolean;
}

export function useUnsuspendUser(): UseUnsuspendUserReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (userId: string) =>
      adminUsersApi.adminUsersControllerUnsuspendUser({ id: userId }),
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
    },
  });

  return {
    unsuspendUser: async (userId: string) => {
      return await mutation.mutateAsync(userId);
    },
    isUnsuspending: mutation.isPending,
  };
}

export interface UseForceLogoutReturn {
  forceLogout: (userId: string) => Promise<void>;
  isLoggingOut: boolean;
}

export function useForceLogout(): UseForceLogoutReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (userId: string) =>
      adminUsersApi.adminUsersControllerForceLogout({ id: userId }),
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-user-sessions', userId] });
    },
  });

  return {
    forceLogout: async (userId: string) => {
      await mutation.mutateAsync(userId);
    },
    isLoggingOut: mutation.isPending,
  };
}

export interface UseRevokeSessionReturn {
  revokeSession: (userId: string, sessionId: string) => Promise<void>;
  isRevoking: boolean;
}

export function useRevokeSession(): UseRevokeSessionReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: ({ userId, sessionId }: { userId: string; sessionId: string }) =>
      adminUsersApi.adminUsersControllerRevokeSession({ id: userId, sessionId }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-user-sessions', variables.userId] });
    },
  });

  return {
    revokeSession: async (userId: string, sessionId: string) => {
      await mutation.mutateAsync({ userId, sessionId });
    },
    isRevoking: mutation.isPending,
  };
}

export interface UseDeleteUserReturn {
  deleteUser: (userId: string) => Promise<void>;
  isDeleting: boolean;
}

export function useDeleteUser(): UseDeleteUserReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (userId: string) =>
      adminUsersApi.adminUsersControllerDeleteUser({ id: userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
    },
  });

  return {
    deleteUser: async (userId: string) => {
      await mutation.mutateAsync(userId);
    },
    isDeleting: mutation.isPending,
  };
}

export interface UseRestoreUserReturn {
  restoreUser: (userId: string) => Promise<AdminUserDetailDto>;
  isRestoring: boolean;
}

export function useRestoreUser(): UseRestoreUserReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (userId: string) =>
      adminUsersApi.adminUsersControllerRestoreUser({ id: userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
    },
  });

  return {
    restoreUser: async (userId: string) => {
      return await mutation.mutateAsync(userId);
    },
    isRestoring: mutation.isPending,
  };
}

export interface UseHardDeleteUserReturn {
  hardDeleteUser: (userId: string) => Promise<void>;
  isDeleting: boolean;
}

export function useHardDeleteUser(): UseHardDeleteUserReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (userId: string) =>
      adminUsersApi.adminUsersControllerHardDeleteUser({ id: userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
    },
  });

  return {
    hardDeleteUser: async (userId: string) => {
      await mutation.mutateAsync(userId);
    },
    isDeleting: mutation.isPending,
  };
}

// ============================================================================
// EXPORT USERS HOOK
// ============================================================================

export interface UseExportUsersReturn {
  exportUsers: (options?: { role?: 'user' | 'admin'; status?: 'active' | 'suspended' | 'deleted' }) => Promise<Blob>;
  isExporting: boolean;
}

export function useExportUsers(): UseExportUsersReturn {
  const mutation = useMutation({
    mutationFn: async (options?: { role?: 'user' | 'admin'; status?: 'active' | 'suspended' | 'deleted' }) => {
      const response = await adminUsersApi.adminUsersControllerExportUsersRaw({
        role: options?.role as AdminUsersControllerListUsersRoleEnum | undefined,
        status: options?.status as AdminUsersControllerListUsersStatusEnum | undefined,
      });
      return await response.raw.blob();
    },
  });

  return {
    exportUsers: async (options) => {
      return await mutation.mutateAsync(options);
    },
    isExporting: mutation.isPending,
  };
}
