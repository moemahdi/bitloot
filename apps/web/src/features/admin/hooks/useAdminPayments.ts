'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminApi, Configuration, type AdminControllerGetPayments200Response } from '@bitloot/sdk';
import type { TableState } from './useAdminTableState';

export interface Payment {
  id: string;
  externalId: string;
  status: string;
  provider: string;
  priceAmount: string;
  priceCurrency: string;
  payAmount: string;
  payCurrency: string;
  orderId: string;
  createdAt: string;
}

interface PaymentsResponse {
  payments: Payment[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
  error: Error | null;
}

export function useAdminPayments(state: TableState): PaymentsResponse {
  const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  });
  const adminApi = new AdminApi(apiConfig);

  const { page, limit, filters } = state;
  const statusFilter = (filters?.status ?? '') as string;
  const providerFilter = (filters?.provider ?? '') as string;

  const query = useQuery<AdminControllerGetPayments200Response>({
    queryKey: ['admin-payments', page, limit, statusFilter, providerFilter],
    queryFn: async () => {
      return await adminApi.adminControllerGetPayments({
        limit,
        offset: (page - 1) * limit,
        status: (statusFilter.length ?? 0) > 0 && statusFilter !== 'all' ? statusFilter : undefined,
        provider: (providerFilter.length ?? 0) > 0 && providerFilter !== 'all' ? providerFilter : undefined,
      });
    },
  });

  const payments: Payment[] = (query.data?.data ?? []).map((item) => {
    const createdAtDate = item.createdAt ?? new Date();
    return {
      id: item.id ?? '',
      externalId: item.externalId ?? '',
      status: item.status ?? '',
      provider: item.provider ?? '',
      priceAmount: item.priceAmount ?? '0',
      priceCurrency: item.priceCurrency ?? '',
      payAmount: item.payAmount ?? '0',
      payCurrency: item.payCurrency ?? '',
      orderId: item.order?.email ?? '',
      createdAt: createdAtDate instanceof Date ? createdAtDate.toISOString() : String(createdAtDate),
    };
  });

  return {
    payments,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: async () => {
      await query.refetch();
    },
    error: query.error ?? null,
  };
}
