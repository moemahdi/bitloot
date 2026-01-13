'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminApi, type AdminControllerGetPayments200Response } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { TableState } from './useAdminTableState';

const adminApi = new AdminApi(apiConfig);

/**
 * Extended Payment interface with full NOWPayments data
 * Includes transaction details, customer info, and computed fields
 */
export interface Payment {
  // Core identifiers
  id: string;
  externalId: string;
  orderId: string;
  
  // Status and provider
  status: string;
  provider: string;
  
  // Price amounts (fiat)
  priceAmount: string;
  priceCurrency: string;
  
  // Payment amounts (crypto)
  payAmount: string;
  payCurrency: string;
  actuallyPaid?: string;
  
  // Transaction details
  payAddress?: string;
  txHash?: string;
  networkConfirmations?: number;
  requiredConfirmations?: number;
  
  // Customer info
  customerEmail?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  
  // Computed fields for underpayment/overpayment detection
  isUnderpaid?: boolean;
  underpaidAmount?: string;
  isOverpaid?: boolean;
  overpaidAmount?: string;
  
  // Refund info
  refundedAmount?: string;
  refundedAt?: string;
}

/**
 * Payment statistics for dashboard analytics
 * These are returned from the API as aggregate stats for ALL payments
 */
export interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalRevenue: string;
  successRate: number;
}

/**
 * Extended filters for payment queries
 */
export interface PaymentFilters {
  status?: string;
  provider?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  currency?: string;
}

interface PaymentsResponse {
  payments: Payment[];
  total: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
  error: Error | null;
  stats?: PaymentStats;
  /** Whether auto-refresh is active (for pending payments) */
  isAutoRefreshing: boolean;
}

/**
 * Hook for fetching admin payments with auto-refresh for pending payments
 * Auto-refreshes every 10 seconds when there are pending/waiting/confirming payments
 */
export function useAdminPayments(state: TableState & { autoRefresh?: boolean }): PaymentsResponse {
  const { page, limit, filters, autoRefresh = true } = state;
  const statusFilter = (filters?.status ?? '') as string;
  const providerFilter = (filters?.provider ?? '') as string;
  const searchFilter = (filters?.search ?? '') as string;
  const dateFromFilter = (filters?.dateFrom ?? '') as string;
  const dateToFilter = (filters?.dateTo ?? '') as string;

  const query = useQuery<AdminControllerGetPayments200Response>({
    queryKey: ['admin-payments', page, limit, statusFilter, providerFilter, searchFilter, dateFromFilter, dateToFilter],
    queryFn: async () => {
      return await adminApi.adminControllerGetPayments({
        limit,
        offset: (page - 1) * limit,
        status: statusFilter.length > 0 && statusFilter !== 'all' ? statusFilter : undefined,
        provider: providerFilter.length > 0 && providerFilter !== 'all' ? providerFilter : undefined,
        // Note: search, dateFrom, dateTo will need backend support
        // For now, these are passed but may not be used by the API
      });
    },
    // Auto-refresh every 10 seconds when autoRefresh is enabled
    // This is useful for monitoring pending payments in real-time
    refetchInterval: autoRefresh ? 10_000 : false,
    // Only refetch when window is focused
    refetchIntervalInBackground: false,
  });

  const payments: Payment[] = (query.data?.data ?? []).map((item) => {
    // Format timestamps
    const formatDate = (date: Date | string | undefined): string | undefined => {
      if (date === undefined || date === null) return undefined;
      return date instanceof Date ? date.toISOString() : String(date);
    };
    
    const createdAtStr = formatDate(item.createdAt) ?? new Date().toISOString();
    const updatedAtStr = formatDate(item.updatedAt);
    const expiresAtStr = formatDate(item.expiresAt);
    
    // Calculate underpayment/overpayment from SDK data
    const expectedAmount = parseFloat(item.payAmount ?? '0');
    const actualAmount = parseFloat(item.actuallyPaid ?? item.payAmount ?? '0');
    const isUnderpaid = actualAmount < expectedAmount && actualAmount > 0;
    const isOverpaid = actualAmount > expectedAmount;
    
    return {
      id: item.id ?? '',
      externalId: item.externalId ?? '',
      orderId: item.orderId ?? '',
      status: item.status ?? '',
      provider: item.provider ?? '',
      priceAmount: item.priceAmount ?? '0',
      priceCurrency: item.priceCurrency ?? '',
      payAmount: item.payAmount ?? '0',
      payCurrency: item.payCurrency ?? '',
      actuallyPaid: item.actuallyPaid,
      payAddress: item.payAddress,
      txHash: item.txHash,
      networkConfirmations: item.networkConfirmations,
      requiredConfirmations: item.requiredConfirmations,
      customerEmail: item.order?.email ?? undefined,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
      expiresAt: expiresAtStr,
      isUnderpaid,
      underpaidAmount: isUnderpaid ? (expectedAmount - actualAmount).toFixed(8) : undefined,
      isOverpaid,
      overpaidAmount: isOverpaid ? (actualAmount - expectedAmount).toFixed(8) : undefined,
      refundedAmount: undefined, // Not yet available from backend
      refundedAt: undefined, // Not yet available from backend
    };
  });

  // Apply client-side search filter (until backend supports it)
  const filteredPayments = searchFilter.length > 0
    ? payments.filter(p => 
        p.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.externalId.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.orderId.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.customerEmail?.toLowerCase().includes(searchFilter.toLowerCase()) ?? false) ||
        (p.txHash?.toLowerCase().includes(searchFilter.toLowerCase()) ?? false) ||
        (p.payAddress?.toLowerCase().includes(searchFilter.toLowerCase()) ?? false)
      )
    : payments;

  // Extract stats from API response (aggregate stats for ALL payments, not just paginated)
  // Stats come directly from the SDK response - map to our interface with defaults
  const apiStats: PaymentStats | undefined = query.data?.stats !== null && query.data?.stats !== undefined ? {
    totalPayments: query.data.stats.totalPayments ?? 0,
    successfulPayments: query.data.stats.successfulPayments ?? 0,
    failedPayments: query.data.stats.failedPayments ?? 0,
    pendingPayments: query.data.stats.pendingPayments ?? 0,
    totalRevenue: query.data.stats.totalRevenue ?? '0',
    successRate: query.data.stats.successRate ?? 0,
  } : undefined;

  // Determine if auto-refresh is active based on having pending payments
  const hasPendingPayments = (apiStats?.pendingPayments ?? 0) > 0;
  const isAutoRefreshing = autoRefresh && hasPendingPayments;

  return {
    payments: filteredPayments,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: async () => {
      await query.refetch();
    },
    error: query.error ?? null,
    stats: apiStats,
    isAutoRefreshing,
  };
}
