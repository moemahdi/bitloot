'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
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
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Download, RefreshCw, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminTableState } from '@/features/admin/hooks/useAdminTableState';
import { useAdminPayments, type Payment } from '@/features/admin/hooks/useAdminPayments';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';

export default function AdminPaymentsPage(): React.ReactElement {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
  const state = useAdminTableState({
    initialFilters: {
      status: 'all',
      provider: 'all',
    },
  });

  const {
    payments,
    total,
    isLoading,
    refetch,
    error,
  } = useAdminPayments(state);

  const handleExportCSV = (): void => {
    if ((payments?.length ?? 0) === 0) return;

    const headers = ['ID', 'Order ID', 'Price Amount', 'Price Currency', 'Status', 'Provider', 'Date'];
    const rows = payments.map((payment: Payment): string[] => [
      payment.id,
      payment.orderId,
      payment.priceAmount,
      payment.priceCurrency,
      payment.status,
      payment.provider,
      payment.createdAt,
    ]);

    const csvContent: string =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r: string[]): string => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string): React.ReactElement => {
    switch (status) {
      case 'finished':
        return <Badge className="bg-green-500 hover:bg-green-600">Finished</Badge>;
      case 'waiting':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Waiting</Badge>;
      case 'failed':
      case 'expired':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isGuardLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Monitor and manage cryptocurrency payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={(payments?.length ?? 0) === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View all payment transactions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="w-[200px]">
                <Select
                  value={state.filters.status as string}
                  onValueChange={(value) => state.handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[200px]">
                <Select
                  value={state.filters.provider as string}
                  onValueChange={(value) => state.handleFilterChange('provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="nowpayments">NOWPayments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error !== null ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-red-500">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Failed to load payments: {error instanceof Error ? error.message : 'Unknown error'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment: Payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">{payment.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-mono text-xs">{payment.orderId.slice(0, 8)}...</TableCell>
                        <TableCell>
                          {payment.priceAmount} {payment.priceCurrency.toUpperCase()}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="capitalize">{payment.provider}</TableCell>
                        <TableCell>
                          {format(new Date(payment.createdAt), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {payments.length} of {total} payments
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-muted-foreground">Rows per page</span>
                  <Select
                    value={state.limit.toString()}
                    onValueChange={(value) => state.setLimit(Number(value))}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="20" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => state.setPage(Math.max(1, state.page - 1))}
                  disabled={state.page <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {state.page} of {Math.ceil(total / state.limit)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => state.setPage(Math.min(Math.ceil(total / state.limit), state.page + 1))}
                  disabled={state.page >= Math.ceil(total / state.limit) || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
