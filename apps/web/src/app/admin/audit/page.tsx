'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Input } from '@/design-system/primitives/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import { Badge } from '@/design-system/primitives/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { Download, RefreshCw, FileJson } from 'lucide-react';
import type { PaginatedAuditLogsDto } from '@bitloot/sdk';
import { AuditLogsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const auditLogsApi = new AuditLogsApi(apiConfig);

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  VIEW: 'bg-gray-100 text-gray-800',
  EXPORT: 'bg-purple-100 text-purple-800',
};

export default function AdminAuditPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('30');

  const limit = 50;

  const { data, isLoading, error, refetch } = useQuery<PaginatedAuditLogsDto>({
    queryKey: ['audit-logs', page, actionFilter, targetFilter, daysFilter],
    queryFn: async () => {
      return await auditLogsApi.auditLogControllerQuery({
        limit,
        offset: page * limit,
        action: actionFilter.length > 0 ? actionFilter : undefined,
        target: targetFilter.length > 0 ? targetFilter : undefined,
        // Calculate fromDate based on daysFilter if needed, or pass days if API supports it.
        // The SDK shows fromDate/toDate.
        fromDate: new Date(Date.now() - parseInt(daysFilter, 10) * 24 * 60 * 60 * 1000).toISOString(),
      });
    },
    staleTime: 30_000,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const responseData = await auditLogsApi.auditLogControllerExport({
        fromDate: new Date(Date.now() - parseInt(daysFilter, 10) * 24 * 60 * 60 * 1000).toISOString(),
        toDate: new Date().toISOString(),
      });

      // Download JSON file
      const blob = new Blob([JSON.stringify(responseData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  if (error != null) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">Failed to load audit logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Track all admin actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div>
              <label className="text-sm font-medium">Action</label>
              <Input
                placeholder="Filter by action..."
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Target</label>
              <Input
                placeholder="Filter by target..."
                value={targetFilter}
                onChange={(e) => {
                  setTargetFilter(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Date Range</label>
              <Select value={daysFilter} onValueChange={setDaysFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          ) : data != null && data.data.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.data ?? []).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {log.admin !== null && log.admin !== undefined && typeof log.admin === 'object' && 'email' in log.admin ? (log.admin as { email: string }).email : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action] ?? 'bg-gray-100 text-gray-800'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.target}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                          {log.details ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {(data?.pages ?? 0) > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page + 1} of {data?.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= (data?.pages ?? 1) - 1}
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-700">
                  Showing {page * limit + 1} to {Math.min((page + 1) * limit, data?.total ?? 0)} of{' '}
                  {data?.total} entries
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileJson className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
