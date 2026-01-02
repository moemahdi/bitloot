"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminApi, KinguinApi } from "@bitloot/sdk";
import type { KinguinControllerGetStatus200Response } from "@bitloot/sdk";
import { apiConfig } from '@/lib/api-config';
import { convertToCSV, downloadCSV } from "@/utils/csv-export";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { Download, RefreshCw, Eye, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const adminApi = new AdminApi(apiConfig);
const kinguinApi = new KinguinApi(apiConfig);

const LIMIT = 20;

// Interface for Kinguin status response
interface KinguinStatusInfo {
  reservationId: string;
  status: 'completed' | 'pending' | 'error';
  message: string;
  checkedAt: Date;
}

export default function AdminReservationsPage(): React.ReactElement {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();

  // UI state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT);
  const [reservationFilter, setReservationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kinguinStatuses, setKinguinStatuses] = useState<Record<string, KinguinStatusInfo>>({});
  const [checkingReservationId, setCheckingReservationId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: [
      "admin-reservations",
      page,
      limit,
      reservationFilter,
      statusFilter,
    ],
    queryFn: async () => {
      // Use SDK AdminApi to fetch reservations
      const response = await adminApi.adminControllerGetReservations({
        limit,
        offset: (page - 1) * limit,
        kinguinReservationId: reservationFilter !== "" ? reservationFilter : undefined,
        status: statusFilter !== "" ? statusFilter : undefined,
      });
      return response;
    },
    enabled: !guardLoading && isAdmin,
    staleTime: 30_000,
  });

  const { data, isLoading, error, refetch } = query;

  // Mutation to check Kinguin order status (orderId = kinguinReservationId from our system)
  const checkKinguinStatusMutation = useMutation<KinguinControllerGetStatus200Response, Error, string>({
    mutationFn: async (reservationId: string) => {
      setCheckingReservationId(reservationId);
      // Note: The SDK now uses 'orderId' parameter to match Kinguin eCommerce API v2
      const response = await kinguinApi.kinguinControllerGetStatus({ orderId: reservationId });
      return response;
    },
    onSuccess: (data, reservationId) => {
      const statusInfo: KinguinStatusInfo = {
        reservationId,
        status: 'completed',
        message: (data as { message?: string }).message ?? 'Status retrieved successfully',
        checkedAt: new Date(),
      };
      setKinguinStatuses(prev => ({ ...prev, [reservationId]: statusInfo }));
      setCheckingReservationId(null);
      toast.success(`Kinguin status for ${reservationId}: ${statusInfo.message}`);
    },
    onError: (err, reservationId) => {
      const statusInfo: KinguinStatusInfo = {
        reservationId,
        status: 'error',
        message: err.message,
        checkedAt: new Date(),
      };
      setKinguinStatuses(prev => ({ ...prev, [reservationId]: statusInfo }));
      setCheckingReservationId(null);
      toast.error(`Failed to check Kinguin status: ${err.message}`);
    },
  });

  const handleCheckKinguinStatus = (reservationId: string): void => {
    checkKinguinStatusMutation.mutate(reservationId);
  };

  // Auto-refresh hook
  const { isAutoRefreshEnabled, setIsAutoRefreshEnabled, handleRefresh, lastRefreshTime } =
    useAutoRefresh(query, { enableAutoRefresh: false, refetchInterval: 30_000 });

  // Format date helper
  const formatDate = (dateValue: string | Date | null | undefined): string => {
    if (dateValue === null || dateValue === undefined) return "—";
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export to CSV
  const handleExportCSV = (): void => {
    const reservations = (data?.data as unknown[]) ?? [];
    if (reservations.length === 0) return;

    const csvData = reservations.map((reservation: unknown) => {
      const res = reservation as Record<string, unknown>;
      return {
        "Order ID": (res.id as string) ?? "",
        Email: (res.email as string) ?? "",
        Status: (res.status as string) ?? "",
        "Reservation ID": (res.kinguinReservationId as string | null) ?? "N/A",
        "Created At": formatDate(res.createdAt as string | Date | null | undefined),
      };
    });

    const csv = convertToCSV(csvData, [
      "Order ID",
      "Email",
      "Status",
      "Reservation ID",
      "Created At",
    ]);

    const filename = `reservations-${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(csv, filename);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Kinguin Reservations</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleRefresh()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
              title="Manually refresh data"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isAutoRefreshEnabled}
                onChange={(e) => setIsAutoRefreshEnabled(e.target.checked)}
                className="w-3 h-3 rounded"
              />
              Auto (30s)
            </label>
            {lastRefreshTime !== null && (
              <span className="text-xs text-gray-500">
                {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div className="flex flex-col">
            <label htmlFor="limit-selector" className="text-sm text-gray-500 mb-1">Items Per Page</label>
            <select
              id="limit-selector"
              aria-label="Select number of items per page"
              className="border rounded px-2 py-1"
              value={limit.toString()}
              onChange={(e): void => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
            >
              <option value="10">10 items</option>
              <option value="25">25 items</option>
              <option value="50">50 items</option>
              <option value="100">100 items</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="res-filter" className="text-sm text-gray-500 mb-1">Reservation ID</label>
            <input
              id="res-filter"
              className="border rounded px-2 py-1"
              placeholder="res_..."
              value={reservationFilter}
              onChange={(e) => setReservationFilter(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="status-filter" className="text-sm text-gray-500 mb-1">Status</label>
            <select
              id="status-filter"
              aria-label="Filter reservations by status"
              className="border rounded px-2 py-1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Any</option>
              <option value="created">created</option>
              <option value="waiting">waiting</option>
              <option value="confirming">confirming</option>
              <option value="paid">paid</option>
              <option value="fulfilled">fulfilled</option>
              <option value="failed">failed</option>
              <option value="underpaid">underpaid</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              className="flex-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              onClick={() => {
                setPage(1);
                void refetch();
              }}
            >
              Apply
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isLoading || (data?.data?.length ?? 0) === 0}
              className="flex-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div>Loading...</div>
      ) : error instanceof Error ? (
        <div className="text-red-600">{error.message}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Order ID</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Reservation ID</th>
                <th className="px-3 py-2 text-left">Kinguin Status</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {((data?.data as unknown[]) ?? []).map((item: unknown) => {
                const res = item as Record<string, unknown>;
                const reservationId = res.kinguinReservationId as string | null;
                const kinguinStatus = reservationId !== null ? kinguinStatuses[reservationId] : undefined;
                const isChecking = checkingReservationId === reservationId;
                
                return (
                  <tr key={res.id as string} className="border-t">
                    <td className="px-3 py-2 font-mono">{res.id as string}</td>
                    <td className="px-3 py-2">{res.email as string}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-gray-200 px-2 py-0.5">{res.status as string}</span>
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {reservationId ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {reservationId !== null ? (
                        <div className="flex items-center gap-2">
                          {kinguinStatus !== undefined ? (
                            <div className="flex items-center gap-1">
                              {kinguinStatus.status === 'completed' && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              {kinguinStatus.status === 'pending' && (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              )}
                              {kinguinStatus.status === 'error' && (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-xs text-gray-500">
                                {kinguinStatus.message}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCheckKinguinStatus(reservationId)}
                              disabled={isChecking}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                              {isChecking ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                              {isChecking ? 'Checking...' : 'Check Status'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {res.createdAt !== undefined && res.createdAt !== null
                        ? new Date(res.createdAt as string).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-4">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(page + 1)}
          disabled={(data?.data?.length ?? 0) < limit}
        >
          Next
        </button>
        <span className="text-xs text-gray-500">
          Page {page} of {Math.ceil((data?.total ?? 0) / limit)} ({data?.total ?? 0} total)
        </span>
      </div>
    </div>
  );
}
