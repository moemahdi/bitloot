'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AdminApi, Configuration } from '@bitloot/sdk';
import { convertToCSV, downloadCSV } from '@/utils/csv-export';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Download, RefreshCw } from 'lucide-react';

// Initialize SDK admin client
const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});
const adminApi = new AdminApi(apiConfig);

// Type definitions
interface WebhookLog {
  id: string;
  externalId: string;
  webhookType: string;
  payload: string;
  signature?: string;
  signatureValid: boolean;
  processed: boolean;
  orderId?: string;
  paymentId?: string;
  result?: string;
  paymentStatus?: string;
  error?: string;
  sourceIp?: string;
  attemptCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface WebhooksListResponse {
  data: WebhookLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

const LIMIT = 20;

export default function AdminWebhooksPage(): React.ReactElement {
  const router = useRouter();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT);
  const [webhookTypeFilter, setWebhookTypeFilter] = useState('');
  const [processedFilter, setProcessedFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [externalIdFilter, setExternalIdFilter] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Authorization check
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token === null || token === '') {
      void router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // Fetch webhooks
  const query = useQuery<WebhooksListResponse>({
    queryKey: [
      'admin-webhooks',
      page,
      limit,
      webhookTypeFilter,
      processedFilter,
      paymentStatusFilter,
      externalIdFilter,
    ],
    queryFn: async (): Promise<WebhooksListResponse> => {
      const response = await adminApi.adminControllerGetWebhookLogs({
        limit,
        offset: (page - 1) * limit,
        webhookType: webhookTypeFilter !== '' ? webhookTypeFilter : undefined,
        paymentStatus: paymentStatusFilter !== '' ? paymentStatusFilter : undefined,
      });

      // Map API response to our interface
      return {
        data: (response.data as unknown as WebhookLog[]) ?? [],
        total: response.total ?? 0,
        page,
        limit,
        totalPages: Math.ceil((response.total ?? 0) / limit),
        hasNextPage: page < Math.ceil((response.total ?? 0) / limit),
      };
    },
    staleTime: 30_000,
    enabled: isAuthorized,
  });

  const { data: webhooksList, isLoading, error, refetch } = query;

  // Auto-refresh hook
  const { isAutoRefreshEnabled, setIsAutoRefreshEnabled, handleRefresh, lastRefreshTime } =
    useAutoRefresh(query, { enableAutoRefresh: false, refetchInterval: 30_000 });

  // Filter handlers
  const handleWebhookTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setWebhookTypeFilter(e.target.value);
    setPage(1);
  };

  const handleProcessedFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setProcessedFilter(e.target.value);
    setPage(1);
  };

  const handlePaymentStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setPaymentStatusFilter(e.target.value);
    setPage(1);
  };

  const handleExternalIdFilterChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setExternalIdFilter(e.target.value);
    setPage(1);
  };

  const applyFilters = (): void => {
    void refetch();
  };

  // Export to CSV
  const handleExportCSV = (): void => {
    const webhooks = webhooksList?.data ?? [];
    if (webhooks.length === 0) return;

    const csvData = webhooks.map((webhook) => ({
      ID: webhook.id,
      'External ID': webhook.externalId,
      Type: webhook.webhookType,
      'Payment Status': webhook.paymentStatus ?? 'N/A',
      Processed: webhook.processed ? 'Yes' : 'No',
      'Signature Valid': webhook.signatureValid ? 'Yes' : 'No',
      'Order ID': webhook.orderId ?? 'N/A',
      'Created At': formatDate(webhook.createdAt),
    }));

    const csv = convertToCSV(csvData, [
      'ID',
      'External ID',
      'Type',
      'Payment Status',
      'Processed',
      'Signature Valid',
      'Order ID',
      'Created At',
    ]);

    const filename = `webhooks-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
  };

  // Utility functions
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProcessedColor = (processed: boolean): string => {
    return processed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getSignatureValidColor = (valid: boolean): string => {
    return valid ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
  };

  const getPaymentStatusColor = (status?: string): string => {
    switch (status) {
      case 'finished':
        return 'bg-green-100 text-green-800';
      case 'confirming':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'underpaid':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Webhook Logs</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage all webhook events from payment providers
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => void handleRefresh()}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Manually refresh data"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAutoRefreshEnabled}
                  onChange={(e) => setIsAutoRefreshEnabled(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                Auto-refresh (30s)
              </label>
              {lastRefreshTime !== null && (
                <span className="text-xs text-gray-500">
                  Last refresh: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          {/* First Row: Limit, Webhook Type, Processed, Payment Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="limit-selector" className="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
              <select
                id="limit-selector"
                aria-label="Select number of items per page"
                value={limit.toString()}
                onChange={(e): void => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="10">10 items</option>
                <option value="25">25 items</option>
                <option value="50">50 items</option>
                <option value="100">100 items</option>
              </select>
            </div>

            <div>
              <label htmlFor="webhook-type-filter" className="block text-sm font-medium text-gray-700 mb-2">Webhook Type</label>
              <select
                id="webhook-type-filter"
                aria-label="Filter webhooks by type"
                value={webhookTypeFilter}
                onChange={handleWebhookTypeFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="nowpayments_ipn">NOWPayments IPN</option>
                <option value="kinguin_webhook">Kinguin Webhook</option>
              </select>
            </div>

            <div>
              <label htmlFor="processed-filter" className="block text-sm font-medium text-gray-700 mb-2">Processed</label>
              <select
                id="processed-filter"
                aria-label="Filter webhooks by processed status"
                value={processedFilter}
                onChange={handleProcessedFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Processed</option>
                <option value="false">Pending</option>
              </select>
            </div>

            <div>
              <label htmlFor="payment-status-filter" className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                id="payment-status-filter"
                aria-label="Filter webhooks by payment status"
                value={paymentStatusFilter}
                onChange={handlePaymentStatusFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="confirming">Confirming</option>
                <option value="finished">Finished</option>
                <option value="failed">Failed</option>
                <option value="underpaid">Underpaid</option>
              </select>
            </div>
          </div>

          {/* Second Row: External ID, Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="external-id-filter" className="block text-sm font-medium text-gray-700 mb-2">External ID</label>
              <input
                id="external-id-filter"
                type="text"
                value={externalIdFilter}
                onChange={handleExternalIdFilterChange}
                placeholder="Filter by ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleExportCSV}
                disabled={isLoading || (webhooksList?.data?.length ?? 0) === 0}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading webhooks...</p>
          </div>
        )}

        {/* Error State */}
        {error !== null && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              <strong>Error:</strong>{' '}
              {error instanceof Error ? error.message : 'Failed to fetch webhooks'}
            </p>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && webhooksList !== undefined && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {webhooksList.data.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <p>No webhooks found matching your filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          External ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Webhook Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Processed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Signature
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {webhooksList.data.map((webhook) => (
                        <tr key={webhook.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {webhook.externalId.substring(0, 16)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {webhook.webhookType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(webhook.paymentStatus)}`}
                            >
                              {webhook.paymentStatus ?? 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getProcessedColor(webhook.processed)}`}
                            >
                              {webhook.processed ? '✅ Processed' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getSignatureValidColor(webhook.signatureValid)}`}
                            >
                              {webhook.signatureValid ? '✅ Valid' : '❌ Invalid'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(webhook.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {webhooksList.page} of {webhooksList.totalPages} (Total:{' '}
                    {webhooksList.total})
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!webhooksList.hasNextPage}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
