'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

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

export default function AdminWebhooksPage() {
  const router = useRouter();

  // State
  const [page, setPage] = useState(1);
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
  const {
    data: webhooksList,
    isLoading,
    error,
    refetch,
  } = useQuery<WebhooksListResponse>({
    queryKey: [
      'admin-webhooks',
      page,
      webhookTypeFilter,
      processedFilter,
      paymentStatusFilter,
      externalIdFilter,
    ],
    queryFn: async (): Promise<WebhooksListResponse> => {
      const token = localStorage.getItem('jwt_token');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });

      if (webhookTypeFilter !== '') {
        params.append('webhookType', webhookTypeFilter);
      }
      if (processedFilter !== '') {
        params.append('processed', processedFilter);
      }
      if (paymentStatusFilter !== '') {
        params.append('paymentStatus', paymentStatusFilter);
      }
      if (externalIdFilter !== '') {
        params.append('externalId', externalIdFilter);
      }

      const response = await fetch(`http://localhost:4000/webhooks/admin/list?${params}`, {
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
      }

      const data = (await response.json()) as WebhooksListResponse;
      return data;
    },
    staleTime: 30_000,
    enabled: isAuthorized,
  });

  // Filter handlers
  const handleWebhookTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWebhookTypeFilter(e.target.value);
    setPage(1);
  };

  const handleProcessedFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProcessedFilter(e.target.value);
    setPage(1);
  };

  const handlePaymentStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentStatusFilter(e.target.value);
    setPage(1);
  };

  const handleExternalIdFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExternalIdFilter(e.target.value);
    setPage(1);
  };

  const applyFilters = () => {
    void refetch();
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProcessedColor = (processed: boolean) => {
    return processed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getSignatureValidColor = (valid: boolean) => {
    return valid ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
  };

  const getPaymentStatusColor = (status?: string) => {
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Type</label>
              <select
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Processed</label>
              <select
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">External ID</label>
              <input
                type="text"
                value={externalIdFilter}
                onChange={handleExternalIdFilterChange}
                placeholder="Filter by ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply Filters
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
