import { useQuery } from '@tanstack/react-query';
import { AdminApi, Configuration, type AdminControllerGetOrders200Response } from '@bitloot/sdk';
import type { TableState } from './useAdminTableState';

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});
const adminApi = new AdminApi(apiConfig);

export interface Order {
  id: string;
  email: string;
  total: string;
  status: string;
  createdAt: string;
}

export function useAdminOrders(state: TableState): { orders: Order[]; total: number; isLoading: boolean; refetch: () => Promise<unknown>; error: Error | null } {
  const { page, limit, filters } = state;
  const search = (filters?.search as string) ?? '';
  const statusFilter = (filters?.status as string) ?? '';

  const query = useQuery<AdminControllerGetOrders200Response>({
    queryKey: ['admin-orders', page, limit, search, statusFilter],
    queryFn: () =>
      adminApi.adminControllerGetOrders({
        limit,
        offset: (page - 1) * limit,
        email: search.length > 0 ? search : undefined,
        status: statusFilter.length > 0 && statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  // Transform API response to our Order type (convert Date to string)
  const orders: Order[] = (query.data?.data ?? []).map((item) => {
    const createdAtDate = item.createdAt ?? new Date();
    return {
      id: item.id ?? '',
      email: item.email ?? '',
      total: item.total ?? '0',
      status: item.status ?? '',
      createdAt: createdAtDate instanceof Date ? createdAtDate.toISOString() : String(createdAtDate),
    };
  });

  return {
    orders,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
  };
}
