"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AdminApi, Configuration } from "@bitloot/sdk";

// Initialize SDK client with base URL
const adminApiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

const adminApi = new AdminApi(adminApiConfig);

const LIMIT = 20;

export default function AdminReservationsPage(): React.ReactElement {
  const router = useRouter();

  // UI state
  const [offset, setOffset] = useState(0);
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "admin-reservations",
      offset,
      reservationFilter,
      statusFilter,
    ],
    queryFn: async () => {
      // Use SDK AdminApi to fetch reservations
      const response = await adminApi.adminControllerGetReservations({
        limit: LIMIT,
        offset,
        kinguinReservationId: reservationFilter !== "" ? reservationFilter : undefined,
        status: statusFilter !== "" ? statusFilter : undefined,
      });
      return response;
    },
    enabled: isAuthorized,
    staleTime: 30_000,
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Kinguin Reservations</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-500">Reservation ID</label>
          <input
            className="border rounded px-2 py-1"
            placeholder="res_..."
            value={reservationFilter}
            onChange={(e) => setReservationFilter(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-500">Status</label>
          <select
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
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => {
            setOffset(0);
            void refetch();
          }}
        >
          Apply
        </button>
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
              {(data?.data ?? []).map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{item.id}</td>
                  <td className="px-3 py-2">{item.email}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-gray-200 px-2 py-0.5">{item.status}</span>
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {item.kinguinReservationId ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {item.createdAt !== undefined && item.createdAt !== null 
                      ? new Date(item.createdAt).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setOffset(Math.max(0, offset - LIMIT))}
          disabled={offset === 0}
        >
          Previous
        </button>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setOffset(offset + LIMIT)}
          disabled={(data?.data?.length ?? 0) < LIMIT}
        >
          Next
        </button>
        <span className="text-xs text-gray-500">
          Showing {offset + 1} - {offset + (data?.data?.length ?? 0)} of {data?.total ?? 0}
        </span>
      </div>
    </div>
  );
}
