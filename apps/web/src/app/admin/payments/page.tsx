'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Configuration, AdminApi } from '@bitloot/sdk';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { Loader2, ChevronLeft, ChevronRight, RefreshCw, ExternalLink, Download } from 'lucide-react';
import Link from 'next/link';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';

// Initialize SDK configuration
const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  accessToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || '';
    }
    return '';
  },
});

const adminClient = new AdminApi(apiConfig);

export default function AdminPaymentsPage() {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: paymentsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-payments', page, limit, statusFilter, providerFilter],
    queryFn: async () => {
      return await adminClient.adminControllerGetPayments({
        limit,
        offset: (page - 1) * limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        provider: providerFilter !== 'all' ? providerFilter : undefined,
      });
    },
    enabled: isAdmin,
  });

  const payments = paymentsResponse?.data || [];
  const totalItems = paymentsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  const exportToCSV = () => {
    if (!payments.length) return;

    const headers = ['Payment ID', 'External ID', 'Amount', 'Currency', 'Status', 'Provider', 'Date'];
    const rows = payments.map(payment => [
      payment.id ?? '',
      payment.externalId ?? '',
      payment.priceAmount ?? '0',
      payment.priceCurrency ?? '',
      payment.status ?? '',
      payment.provider ?? '',
      payment.createdAt ? new Date(payment.createdAt).toISOString() : new Date().toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isGuardLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments Management</h1>
          <p className="text-muted-foreground">Monitor and manage crypto payments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={exportToCSV} disabled={payments.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Total payments: {totalItems}</CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={providerFilter}
                onValueChange={(value) => {
                  setProviderFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Filter by Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="nowpayments">NOWPayments</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-muted-foreground">
              <p className="text-lg font-medium">No payments found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{(payment.id ?? '').slice(0, 8)}...</TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.externalId ? (
                          <span>{(payment.externalId ?? '').slice(0, 8)}...</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{payment.priceAmount ?? '0'}</TableCell>
                      <TableCell>{(payment.priceCurrency ?? '').toUpperCase()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === 'finished'
                              ? 'default'
                              : payment.status === 'waiting'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={
                            payment.status === 'finished'
                              ? 'bg-green-500 hover:bg-green-600'
                              : payment.status === 'waiting'
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : ''
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{payment.provider}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(payment.createdAt ?? new Date()).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
