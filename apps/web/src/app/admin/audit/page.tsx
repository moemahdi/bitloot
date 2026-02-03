'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/design-system/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import {
  Download,
  RefreshCw,
  FileJson,
  FileSpreadsheet,
  Eye,
  ClipboardList,
  Activity,
  UserCog,
  Target,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import type { PaginatedAuditLogsDto, AuditLogResponseDto } from '@bitloot/sdk';
import { AuditLogsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { formatDate, formatRelativeTime, formatDateForExport } from '@/utils/format-date';

const auditLogsApi = new AuditLogsApi(apiConfig);

// Action type configurations with neon cyberpunk colors
const actionConfig: Record<string, { bg: string; text: string; icon: string }> = {
  CREATE: { bg: 'bg-green-success/20', text: 'text-green-success', icon: '➕' },
  UPDATE: { bg: 'bg-cyan-glow/20', text: 'text-cyan-glow', icon: '✏️' },
  DELETE: { bg: 'bg-orange-warning/20', text: 'text-orange-warning', icon: '🗑️' },
  VIEW: { bg: 'bg-purple-neon/20', text: 'text-purple-neon', icon: '👁️' },
  EXPORT: { bg: 'bg-pink-featured/20', text: 'text-pink-featured', icon: '📤' },
  LOGIN: { bg: 'bg-cyan-glow/20', text: 'text-cyan-glow', icon: '🔐' },
  LOGOUT: { bg: 'bg-text-muted/20', text: 'text-text-secondary', icon: '🚪' },
  APPROVE: { bg: 'bg-green-success/20', text: 'text-green-success', icon: '✅' },
  REJECT: { bg: 'bg-orange-warning/20', text: 'text-orange-warning', icon: '❌' },
  SYNC: { bg: 'bg-purple-neon/20', text: 'text-purple-neon', icon: '🔄' },
  IMPORT: { bg: 'bg-cyan-glow/20', text: 'text-cyan-glow', icon: '📥' },
  PUBLISH: { bg: 'bg-green-success/20', text: 'text-green-success', icon: '🚀' },
  UNPUBLISH: { bg: 'bg-orange-warning/20', text: 'text-orange-warning', icon: '⏸️' },
  MODERATE: { bg: 'bg-purple-neon/20', text: 'text-purple-neon', icon: '⚖️' },
};

// Target type configurations
const targetConfig: Record<string, { color: string; label: string }> = {
  product: { color: 'text-cyan-glow', label: 'Product' },
  order: { color: 'text-green-success', label: 'Order' },
  payment: { color: 'text-purple-neon', label: 'Payment' },
  user: { color: 'text-pink-featured', label: 'User' },
  review: { color: 'text-orange-warning', label: 'Review' },
  promo: { color: 'text-cyan-glow', label: 'Promo' },
  webhook: { color: 'text-purple-neon', label: 'Webhook' },
  settings: { color: 'text-text-secondary', label: 'Settings' },
  catalog: { color: 'text-cyan-glow', label: 'Catalog' },
  group: { color: 'text-pink-featured', label: 'Group' },
};

export default function AdminAuditPage(): React.ReactElement {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('30');
  const [selectedLog, setSelectedLog] = useState<AuditLogResponseDto | null>(null);
  const [copied, setCopied] = useState(false);

  const limit = 50;

  const { data, isLoading, error, refetch, isFetching } = useQuery<PaginatedAuditLogsDto>({
    queryKey: ['audit-logs', page, actionFilter, targetFilter, adminFilter, daysFilter],
    queryFn: async () => {
      return await auditLogsApi.auditLogControllerQuery({
        limit,
        offset: page * limit,
        action: actionFilter.length > 0 ? actionFilter : undefined,
        target: targetFilter.length > 0 ? targetFilter : undefined,
        adminUserId: adminFilter.length > 0 ? adminFilter : undefined,
        fromDate: new Date(
          Date.now() - parseInt(daysFilter, 10) * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    },
    staleTime: 30_000,
  });

  // Export as JSON
  const exportJsonMutation = useMutation({
    mutationFn: async () => {
      const responseData = await auditLogsApi.auditLogControllerExport({
        fromDate: new Date(
          Date.now() - parseInt(daysFilter, 10) * 24 * 60 * 60 * 1000
        ).toISOString(),
        toDate: new Date().toISOString(),
      });

      const blob = new Blob([JSON.stringify(responseData, null, 2)], {
        type: 'application/json',
      });
      downloadFile(blob, `audit-logs-${new Date().toISOString().split('T')[0]}.json`);
    },
  });

  // Export as CSV
  const exportCsvMutation = useMutation({
    mutationFn: async () => {
      const responseData = await auditLogsApi.auditLogControllerExport({
        fromDate: new Date(
          Date.now() - parseInt(daysFilter, 10) * 24 * 60 * 60 * 1000
        ).toISOString(),
        toDate: new Date().toISOString(),
      });

      const csvContent = convertToCSV(responseData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    },
  });

  const clearFilters = () => {
    setActionFilter('');
    setTargetFilter('');
    setAdminFilter('');
    setDaysFilter('30');
    setPage(0);
  };

  const handleCopyJson = async (log: AuditLogResponseDto) => {
    await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasFilters =
    actionFilter.length > 0 ||
    targetFilter.length > 0 ||
    adminFilter.length > 0 ||
    daysFilter !== '30';

  // Calculate stats from current page data
  const stats = {
    total: data?.total ?? 0,
    actions: new Set((data?.data ?? []).map((l) => l.action)).size,
    targets: new Set((data?.data ?? []).map((l) => l.target)).size,
    admins: new Set((data?.data ?? []).map((l) => l.adminUserId)).size,
  };

  if (error != null) {
    return (
      <div className="p-8">
        <Alert variant="destructive" className="bg-orange-warning/10 border-orange-warning/30">
          <AlertCircle className="h-4 w-4 text-orange-warning" />
          <AlertTitle className="text-text-primary">Error</AlertTitle>
          <AlertDescription className="text-text-secondary">
            Failed to load audit logs. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Audit Logs</h1>
          <p className="text-text-secondary mt-1">
            Track all admin actions and system events for compliance and security
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isLoading || isFetching}
            className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsvMutation.mutate()}
            disabled={exportCsvMutation.isPending}
            className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportJsonMutation.mutate()}
            disabled={exportJsonMutation.isPending}
            className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow"
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-bg-secondary border-border-subtle hover:border-cyan-glow/30 transition-colors">
          <CardContent className="pt-6">
            <div className="text-center">
              <ClipboardList className="h-6 w-6 mx-auto mb-2 text-cyan-glow" />
              <div className="text-3xl font-bold text-text-primary">{stats.total.toLocaleString()}</div>
              <p className="text-sm text-text-secondary mt-1">Total Logs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-secondary border-border-subtle hover:border-purple-neon/30 transition-colors">
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-purple-neon" />
              <div className="text-3xl font-bold text-text-primary">{stats.actions}</div>
              <p className="text-sm text-text-secondary mt-1">Action Types</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-secondary border-border-subtle hover:border-green-success/30 transition-colors">
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-green-success" />
              <div className="text-3xl font-bold text-text-primary">{stats.targets}</div>
              <p className="text-sm text-text-secondary mt-1">Target Types</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-secondary border-border-subtle hover:border-pink-featured/30 transition-colors">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserCog className="h-6 w-6 mx-auto mb-2 text-pink-featured" />
              <div className="text-3xl font-bold text-text-primary">{stats.admins}</div>
              <p className="text-sm text-text-secondary mt-1">Active Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-bg-secondary border-border-subtle">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-text-primary">Filters</CardTitle>
              <CardDescription className="text-text-secondary">Narrow down audit logs by specific criteria</CardDescription>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-text-secondary hover:text-orange-warning"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Action Type
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="e.g., CREATE, UPDATE..."
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value.toUpperCase());
                    setPage(0);
                  }}
                  className="pl-10 bg-bg-tertiary border-border-subtle focus:border-cyan-glow text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Target Resource
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="e.g., product, order..."
                  value={targetFilter}
                  onChange={(e) => {
                    setTargetFilter(e.target.value.toLowerCase());
                    setPage(0);
                  }}
                  className="pl-10 bg-bg-tertiary border-border-subtle focus:border-cyan-glow text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Admin User ID
              </label>
              <div className="relative">
                <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Filter by admin..."
                  value={adminFilter}
                  onChange={(e) => {
                    setAdminFilter(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10 bg-bg-tertiary border-border-subtle focus:border-cyan-glow text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Date Range
              </label>
              <Select value={daysFilter} onValueChange={(v) => { setDaysFilter(v); setPage(0); }}>
                <SelectTrigger className="bg-bg-tertiary border-border-subtle focus:border-cyan-glow text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-secondary border-border-subtle">
                  <SelectItem value="1" className="text-text-primary hover:bg-bg-tertiary">Last 24 hours</SelectItem>
                  <SelectItem value="7" className="text-text-primary hover:bg-bg-tertiary">Last 7 days</SelectItem>
                  <SelectItem value="30" className="text-text-primary hover:bg-bg-tertiary">Last 30 days</SelectItem>
                  <SelectItem value="90" className="text-text-primary hover:bg-bg-tertiary">Last 90 days</SelectItem>
                  <SelectItem value="365" className="text-text-primary hover:bg-bg-tertiary">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="bg-bg-secondary border-border-subtle">
        <CardHeader>
          <CardTitle className="text-text-primary">Audit Trail</CardTitle>
          <CardDescription className="text-text-secondary">
            Complete history of administrative actions ({data?.total?.toLocaleString() ?? 0} total entries)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-bg-tertiary animate-pulse rounded-lg" />
              ))}
            </div>
          ) : data != null && data.data.length > 0 ? (
            <div className="space-y-4">
              <div className="border border-border-subtle rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-tertiary border-border-subtle hover:bg-bg-tertiary">
                      <TableHead className="text-text-secondary">Admin</TableHead>
                      <TableHead className="text-text-secondary">Action</TableHead>
                      <TableHead className="text-text-secondary">Target</TableHead>
                      <TableHead className="text-text-secondary">Details</TableHead>
                      <TableHead className="text-text-secondary">Date</TableHead>
                      <TableHead className="text-text-secondary text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.data ?? []).map((log) => {
                      const action = actionConfig[log.action] ?? {
                        bg: 'bg-text-muted/20',
                        text: 'text-text-secondary',
                        icon: '📋',
                      };
                      const target = getTargetType(log.target);
                      const targetStyle = targetConfig[target] ?? {
                        color: 'text-text-secondary',
                        label: target,
                      };

                      return (
                        <TableRow
                          key={log.id}
                          className="border-border-subtle hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell className="text-sm text-text-primary font-medium">
                            {getAdminEmail(log.admin)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${action.bg} ${action.text} border-0`}>
                              <span className="mr-1">{action.icon}</span>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${targetStyle.color}`}>
                              {log.target}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-text-secondary max-w-xs truncate">
                            {log.details ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-text-muted whitespace-nowrap">
                            {formatAuditDate(log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt))}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="text-text-secondary hover:text-cyan-glow hover:bg-cyan-glow/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                <p className="text-sm text-text-secondary">
                  Showing {page * limit + 1} to{' '}
                  {Math.min((page + 1) * limit, data?.total ?? 0)} of {data?.total?.toLocaleString()} entries
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="border-border-subtle hover:border-cyan-glow/50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center px-4 text-sm text-text-secondary bg-bg-tertiary rounded-md">
                    Page {page + 1} of {data?.pages ?? 1}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= (data?.pages ?? 1) - 1}
                    className="border-border-subtle hover:border-cyan-glow/50"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileJson className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No Audit Logs Found</h3>
              <p className="text-text-secondary mb-4">
                {hasFilters
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Admin actions will appear here once they occur.'}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="border-border-subtle hover:border-cyan-glow/50">
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-cyan-glow/5 border-cyan-glow/20">
        <CardHeader>
          <CardTitle className="text-sm text-cyan-glow flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Understanding Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-text-secondary space-y-2">
          <p>
            <strong className="text-text-primary">Purpose:</strong> Audit logs track all
            administrative actions for security, compliance, and troubleshooting.
          </p>
          <p>
            <strong className="text-text-primary">Retention:</strong> Logs are retained for 1
            year. Export regularly for long-term archival.
          </p>
          <p>
            <strong className="text-text-primary">Actions Tracked:</strong> Product changes, order
            modifications, user management, pricing updates, and more.
          </p>
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-bg-secondary border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-cyan-glow" />
              Audit Log Details
            </DialogTitle>
            <DialogDescription className="text-text-secondary">Complete information about this audit entry</DialogDescription>
          </DialogHeader>
          {selectedLog !== null && selectedLog !== undefined && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wide">
                    Log ID
                  </label>
                  <p className="text-sm text-text-primary font-mono mt-1 break-all">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wide">
                    Timestamp
                  </label>
                  <p className="text-sm text-text-primary mt-1">
                    {formatDate(selectedLog.createdAt, 'datetime-long')}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wide">Admin</label>
                  <p className="text-sm text-text-primary mt-1">
                    {getAdminEmail(selectedLog.admin)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wide">
                    Admin ID
                  </label>
                  <p className="text-sm text-text-primary font-mono mt-1 break-all">
                    {selectedLog.adminUserId}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wide">Action</label>
                  <div className="mt-1">
                    <Badge
                      className={`${actionConfig[selectedLog.action]?.bg ?? 'bg-text-muted/20'} ${actionConfig[selectedLog.action]?.text ?? 'text-text-secondary'} border-0`}
                    >
                      {actionConfig[selectedLog.action]?.icon ?? '📋'} {selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wide">Target</label>
                  <p className="text-sm text-text-primary mt-1">{selectedLog.target}</p>
                </div>
              </div>

              {selectedLog.details !== null && selectedLog.details !== undefined && selectedLog.details.length > 0 && (
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wide">
                    Details
                  </label>
                  <p className="text-sm text-text-secondary mt-1 p-3 bg-bg-tertiary rounded-lg border border-border-subtle">
                    {selectedLog.details}
                  </p>
                </div>
              )}

              {selectedLog.payload !== null && selectedLog.payload !== undefined && Object.keys(selectedLog.payload).length > 0 && (
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wide">
                    Payload
                  </label>
                  <pre className="text-sm text-cyan-glow mt-1 p-3 bg-bg-tertiary rounded-lg overflow-x-auto font-mono border border-border-subtle max-h-60">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopyJson(selectedLog)}
                  className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy JSON
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                  className="border-border-subtle"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper functions
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convertToCSV(logs: AuditLogResponseDto[]): string {
  const headers = ['ID', 'Admin Email', 'Admin ID', 'Action', 'Target', 'Details', 'Created At'];
  const rows = logs.map((log) => [
    log.id,
    getAdminEmail(log.admin),
    log.adminUserId,
    log.action,
    log.target,
    log.details ?? '',
    new Date(log.createdAt).toISOString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
}

function getAdminEmail(admin: unknown): string {
  if (admin !== null && admin !== undefined && typeof admin === 'object' && 'email' in admin) {
    return (admin as { email: string }).email;
  }
  return 'Unknown';
}

function getTargetType(target: string): string {
  const lowerTarget = target.toLowerCase();
  if (lowerTarget.includes('product')) return 'product';
  if (lowerTarget.includes('order')) return 'order';
  if (lowerTarget.includes('payment')) return 'payment';
  if (lowerTarget.includes('user')) return 'user';
  if (lowerTarget.includes('review')) return 'review';
  if (lowerTarget.includes('promo')) return 'promo';
  if (lowerTarget.includes('webhook')) return 'webhook';
  if (lowerTarget.includes('catalog')) return 'catalog';
  if (lowerTarget.includes('group')) return 'group';
  return 'settings';
}

/**
 * Format date for audit log display using centralized utility
 */
function formatAuditDate(dateString: string): string {
  return formatRelativeTime(dateString);
}
