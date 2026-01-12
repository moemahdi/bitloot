import { useQuery } from '@tanstack/react-query';
import { AdminApi, type AdminControllerGetOrders200Response } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { TableState } from './useAdminTableState';

const adminApi = new AdminApi(apiConfig);

/**
 * Payment information from the order
 */
export interface OrderPayment {
  id: string;
  provider: string;
  status: string;
}

/**
 * Enhanced Order interface with payment data
 */
export interface Order {
  id: string;
  email: string;
  total: string;
  status: string;
  sourceType: string;
  createdAt: string;
  /** Payment information (null if no payment created yet) */
  payment: OrderPayment | null;
}

export function useAdminOrders(state: TableState): { orders: Order[]; total: number; isLoading: boolean; isRefetching: boolean; refetch: () => Promise<unknown>; error: Error | null } {
  const { page, limit, filters } = state;
  const search = (filters?.search as string) ?? '';
  const statusFilter = (filters?.status as string) ?? '';
  const sourceTypeFilter = (filters?.sourceType as string) ?? '';
  const startDate = (filters?.startDate as string) ?? '';
  const endDate = (filters?.endDate as string) ?? '';

  const query = useQuery<AdminControllerGetOrders200Response>({
    queryKey: ['admin-orders', page, limit, search, statusFilter, sourceTypeFilter, startDate, endDate],
    queryFn: () =>
      adminApi.adminControllerGetOrders({
        limit,
        offset: (page - 1) * limit,
        // Search supports both email and order ID - the backend will handle OR condition
        search: search.length > 0 ? search : undefined,
        status: statusFilter.length > 0 && statusFilter !== 'all' ? statusFilter : undefined,
        sourceType: sourceTypeFilter.length > 0 && sourceTypeFilter !== 'all' ? sourceTypeFilter as 'custom' | 'kinguin' : undefined,
        startDate: startDate.length > 0 ? startDate : undefined,
        endDate: endDate.length > 0 ? endDate : undefined,
      }),
  });

  // Transform API response to our Order type (convert Date to string, map payment)
  const orders: Order[] = (query.data?.data ?? []).map((item) => {
    const createdAtDate = item.createdAt ?? new Date();
    
    // Map payment data if present
    const payment: OrderPayment | null = item.payment != null ? {
      id: item.payment.id ?? '',
      provider: item.payment.provider ?? 'unknown',
      status: item.payment.status ?? 'unknown',
    } : null;

    return {
      id: item.id ?? '',
      email: item.email ?? '',
      total: item.total ?? '0',
      status: item.status ?? '',
      sourceType: (item as { sourceType?: string }).sourceType ?? 'custom',
      createdAt: createdAtDate instanceof Date ? createdAtDate.toISOString() : String(createdAtDate),
      payment,
    };
  });

  return {
    orders,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    error: query.error,
  };
}
