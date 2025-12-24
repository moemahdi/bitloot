import { useQuery } from '@tanstack/react-query';
import type { AdminApi as _AdminApi } from '@bitloot/sdk';
import { AdminApi as AdminApiImpl, Configuration } from '@bitloot/sdk';
import type { TableState } from './useAdminTableState';

export function useAdminReservations(state: TableState): {
  reservations: unknown[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
  error: Error | null;
} {
  const { page, limit, filters } = state;
  const statusFilter = (filters?.status ?? '') as string;
  const reservationFilter = (filters?.reservationId ?? '') as string;

  const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  });
  const adminApi = new AdminApiImpl(apiConfig);

  const query = useQuery({
    queryKey: ['admin-reservations', page, limit, reservationFilter, statusFilter],
    queryFn: async () => {
      return await adminApi.adminControllerGetReservations({
        limit,
        offset: (page - 1) * limit,
        kinguinReservationId: reservationFilter !== '' ? reservationFilter : undefined,
        status: statusFilter !== '' ? statusFilter : undefined,
      });
    },
  });

  return {
    reservations: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
  };
}
