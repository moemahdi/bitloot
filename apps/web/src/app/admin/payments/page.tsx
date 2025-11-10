'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface Payment {
  id: string;
  orderId: string;
  externalId: string;
  status: string;
  provider: string;
  priceAmount: number;
  priceCurrency: string;
  payAmount: number;
  payCurrency: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentsListResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

const LIMIT = 20;

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token === null || token === '') {
      void router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // Fetch payments list
  const {
    data: paymentsList,
    isLoading,
    error,
    refetch,
  } = useQuery<PaymentsListResponse>({
    queryKey: ['admin-payments', page, statusFilter, providerFilter, orderIdFilter],
    queryFn: async (): Promise<PaymentsListResponse> => {
      const token = localStorage.getItem('jwt_token');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });

      // Add filters only if they have values
      if (statusFilter !== '') {
        params.append('status', statusFilter);
      }
      if (providerFilter !== '') {
        params.append('provider', providerFilter);
      }
      if (orderIdFilter !== '') {
        params.append('orderId', orderIdFilter);
      }

      const response = await fetch(`http://localhost:4000/payments/admin/list?${params}`, {
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.statusText}`);
      }

      const data = (await response.json()) as PaymentsListResponse;
      return data;
    },
    staleTime: 30_000, // 30 seconds
    enabled: isAuthorized,
  });

  // Handle filter changes
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleProviderFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProviderFilter(e.target.value);
    setPage(1);
  };

  const handleOrderIdFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderIdFilter(e.target.value);
    setPage(1);
  };

  // Apply filters
  const applyFilters = () => {
    void refetch();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
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

  if (!isAuthorized) {
    return null; // Prevent rendering until redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">[ADMIN] Payments Dashboard</h1>
          <p className="text-gray-600">Monitor all payments and payment statuses</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="finished">Finished</option>
                <option value="confirming">Confirming</option>
                <option value="waiting">Waiting</option>
                <option value="failed">Failed</option>
                <option value="underpaid">Underpaid</option>
              </select>
            </div>

            {/* Provider Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
              <select
                value={providerFilter}
                onChange={handleProviderFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Providers</option>
                <option value="nowpayments">NOWPayments</option>
              </select>
            </div>

            {/* Order ID Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
              <input
                type="text"
                value={orderIdFilter}
                onChange={handleOrderIdFilterChange}
                placeholder="Enter order ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Apply Button */}
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        )}

        {/* Error State */}
        {error !== null && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              <strong>Error:</strong>{' '}
              {error instanceof Error ? error.message : 'Failed to fetch payments'}
            </p>
          </div>
        )}

        {/* Data Table */}
        {paymentsList !== null && paymentsList !== undefined && !isLoading && (
          <>
            {paymentsList.data.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No payments found</p>
              </div>
            ) : (
              <>
                {/* Table Summary */}
                <div className="mb-4 text-sm text-gray-600">
                  Showing {(page - 1) * LIMIT + 1} to {Math.min(page * LIMIT, paymentsList.total)}{' '}
                  of {paymentsList.total} payments
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Payment ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paymentsList.data.map((payment) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            // Future: Navigate to payment detail page
                          }}
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                            {payment.externalId.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                            {payment.orderId.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {payment.priceAmount.toFixed(8)} {payment.priceCurrency}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.provider}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(payment.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {paymentsList.page} of {paymentsList.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!paymentsList.hasNextPage}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
