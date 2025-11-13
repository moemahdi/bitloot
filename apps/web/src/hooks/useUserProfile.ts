'use client';

import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Configuration, UsersApi } from '@bitloot/sdk';
import type { UpdatePasswordDto, UserResponseDto } from '@bitloot/sdk';

// Initialize SDK client with configuration
const getApiClient = (): UsersApi => {
  const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: () => {
      // Get token from localStorage if available
      if (typeof window !== 'undefined') {
        return Promise.resolve(localStorage.getItem('accessToken') ?? '');
      }
      return Promise.resolve('');
    },
  });
  return new UsersApi(config);
};

export type UserProfile = UserResponseDto;

export function useUserProfile(): UseQueryResult<UserProfile | undefined, unknown> {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const api = getApiClient();
      return api.usersControllerGetProfile();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdatePassword(): UseMutationResult<void, unknown, UpdatePasswordDto> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePasswordDto) => {
      const api = getApiClient();
      await api.usersControllerUpdatePassword({ updatePasswordDto: data });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

export function useUserOrders(): UseQueryResult<unknown[], unknown> {
  return useQuery({
    queryKey: ['user', 'orders'],
    queryFn: async (): Promise<unknown[]> => {
      const api = getApiClient();
      return (await api.usersControllerGetOrders()) ?? [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
