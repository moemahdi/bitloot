"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AdminApi, Configuration } from "@bitloot/sdk";
import { convertToCSV, downloadCSV } from "@/utils/csv-export";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Download, RefreshCw } from 'lucide-react';

// Initialize SDK client with base URL
const adminApiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

const adminApi = new AdminApi(adminApiConfig);

const LIMIT = 20;

export default function AdminReservationsPage(): React.ReactElement {
  const router = useRouter();

  // UI state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT);
  const [reservationFilter, setReservationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Guarded route: check token in localStorage
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token === null || token === "") {
      void router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

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
    enabled: isAuthorized,
    staleTime: 30_000,
  });

  const { data, isLoading, error, refetch } = query;

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
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {((data?.data as unknown[]) ?? []).map((item: unknown) => {
                const res = item as Record<string, unknown>;
                return (
                  <tr key={res.id as string} className="border-t">
                    <td className="px-3 py-2 font-mono">{res.id as string}</td>
                    <td className="px-3 py-2">{res.email as string}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-gray-200 px-2 py-0.5">{res.status as string}</span>
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {(res.kinguinReservationId as string | null) ?? "—"}
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
