'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import { Badge } from '@/design-system/primitives/badge';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/design-system/primitives/collapsible';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import {
  AlertCircle,
  RefreshCw,
  Loader,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  Pause,
  Zap,
  Server,
  Eye,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { AdminOperationsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { formatDate } from '@/utils/format-date';
import { toast } from 'sonner';

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
  paused: number;
  total: number;
}

interface FailedJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  failedReason: string;
  stacktrace: string[];
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
}

const adminOpsApi = new AdminOperationsApi(apiConfig);

/**
 * AdminQueuesPage - BullMQ Queue Monitoring
 * Complete implementation with all queue statistics
 * 
 * Real-time monitoring of asynchronous job queues:
 * - Payments Queue: Payment processing jobs
 * - Fulfillment Queue: Order fulfillment jobs
 * - Email Queue: Email notification jobs
 */
export default function AdminQueuesPage(): React.ReactElement {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [failedJobsDialog, setFailedJobsDialog] = useState<{ open: boolean; queueName: string }>({
    open: false,
    queueName: '',
  });
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch queue stats
  const queryResult = useQuery<QueueStats[]>({
    queryKey: ['admin', 'queues', 'stats'],
    queryFn: async (): Promise<QueueStats[]> => {
      try {
        const response = await adminOpsApi.adminOpsControllerGetQueueStats();
        // API returns { [queueName]: stats }, convert to array
        if (typeof response === 'object' && response !== null) {
          return Object.entries(response).map(([name, stats]: [string, unknown]): QueueStats => {
            const s = stats as {
              waiting?: number;
              active?: number;
              delayed?: number;
              failed?: number;
              completed?: number;
              paused?: number;
              total?: number;
            };
            return {
              name,
              waiting: s.waiting ?? 0,
              active: s.active ?? 0,
              delayed: s.delayed ?? 0,
              failed: s.failed ?? 0,
              completed: s.completed ?? 0,
              paused: s.paused ?? 0,
              total: s.total ?? 0,
            };
          });
        }
        return [];
      } catch (err) {
        console.error('Failed to fetch queue stats:', err);
        throw err;
      }
    },
    staleTime: 5_000, // 5 seconds
    refetchInterval: autoRefresh ? 10_000 : false, // Refetch every 10s if auto-refresh enabled
  });

  const { data: queues = [], isLoading, error, isFetching } = queryResult;
  const handleRefresh = useCallback((): void => {
    void queryResult.refetch();
  }, [queryResult]);

  // Fetch failed jobs for a specific queue
  const failedJobsQuery = useQuery<FailedJob[]>({
    queryKey: ['admin', 'queues', 'failed', failedJobsDialog.queueName],
    queryFn: async (): Promise<FailedJob[]> => {
      if (failedJobsDialog.queueName === '') return [];
      try {
        const response = await adminOpsApi.adminOpsControllerGetFailedJobs({
          name: failedJobsDialog.queueName,
          limit: 50,
          offset: 0,
        });
        // Response should contain jobs array
        const responseObj = response as { jobs?: FailedJob[] } | FailedJob[];
        const jobs = Array.isArray(responseObj) ? responseObj : (responseObj?.jobs ?? []);
        return jobs;
      } catch (err) {
        console.error('Failed to fetch failed jobs:', err);
        throw err;
      }
    },
    enabled: failedJobsDialog.open && failedJobsDialog.queueName.length > 0,
    staleTime: 10_000,
  });

  // Retry a failed job
  const retryJobMutation = useMutation({
    mutationFn: async ({ queueName, jobId }: { queueName: string; jobId: string }) => {
      return adminOpsApi.adminOpsControllerRetryFailedJob({ name: queueName, jobId });
    },
    onSuccess: () => {
      toast.success('Job queued for retry');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'queues'] });
    },
    onError: (err) => {
      console.error('Failed to retry job:', err);
      toast.error('Failed to retry job');
    },
  });

  // Clear all failed jobs
  const clearFailedMutation = useMutation({
    mutationFn: async (queueName: string) => {
      return adminOpsApi.adminOpsControllerClearFailedJobs({ name: queueName });
    },
    onSuccess: () => {
      toast.success('All failed jobs cleared');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'queues'] });
      setFailedJobsDialog({ open: false, queueName: '' });
    },
    onError: (err) => {
      console.error('Failed to clear jobs:', err);
      toast.error('Failed to clear failed jobs');
    },
  });

  // Toggle job stack trace expansion
  const toggleJobExpanded = (jobId: string): void => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  // Copy job ID to clipboard
  const copyJobId = async (jobId: string): Promise<void> => {
    await navigator.clipboard.writeText(jobId);
    setCopiedId(jobId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open failed jobs dialog
  const openFailedJobsDialog = (queueName: string): void => {
    setFailedJobsDialog({ open: true, queueName });
    setExpandedJobs(new Set());
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 10_000);

    return () => clearInterval(interval);
  }, [autoRefresh, handleRefresh]);

  if (isLoading ?? false) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-cyan-glow mx-auto mb-4" />
          <p className="text-text-secondary">Loading queue statistics...</p>
        </div>
      </div>
    );
  }

  if (error !== null && error !== undefined) {
    return (
      <Alert variant="destructive" className="bg-orange-warning/10 border-orange-warning/30">
        <AlertCircle className="h-4 w-4 text-orange-warning" />
        <AlertTitle className="text-text-primary">Error</AlertTitle>
        <AlertDescription className="text-text-secondary">
          Failed to load queue statistics. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate totals with explicit typing
  const totalsData = queues.reduce(
    (acc: { waiting: number; active: number; failed: number; completed: number; total: number }, q: QueueStats) => ({
      waiting: acc.waiting + q.waiting,
      active: acc.active + q.active,
      failed: acc.failed + q.failed,
      completed: acc.completed + q.completed,
      total: acc.total + q.total,
    }),
    { waiting: 0, active: 0, failed: 0, completed: 0, total: 0 }
  );

  // Health status calculation
  const healthStatus = totalsData.failed > 0 
    ? 'unhealthy' 
    : totalsData.active > 0 
      ? 'processing' 
      : totalsData.waiting > 0 
        ? 'queued' 
        : 'healthy';

  const healthConfig = {
    healthy: { color: 'text-green-success', bg: 'bg-green-success/20', label: 'All Clear', icon: CheckCircle2 },
    processing: { color: 'text-cyan-glow', bg: 'bg-cyan-glow/20', label: 'Processing', icon: Activity },
    queued: { color: 'text-purple-neon', bg: 'bg-purple-neon/20', label: 'Jobs Queued', icon: Clock },
    unhealthy: { color: 'text-orange-warning', bg: 'bg-orange-warning/20', label: 'Attention Needed', icon: AlertTriangle },
  };

  const currentHealth = healthConfig[healthStatus];
  const HealthIcon = currentHealth.icon;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary">Job Queues</h1>
          <p className="text-text-secondary text-xs sm:text-sm mt-1 hidden xs:block">
            Monitor BullMQ async job processing in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-8 text-xs sm:text-sm ${autoRefresh 
              ? 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/50 hover:bg-cyan-glow/30' 
              : 'border-border-subtle hover:border-cyan-glow/50'
            }`}
          >
            <Activity className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            <span className="hidden xs:inline">{autoRefresh ? 'Auto-Refresh' : 'Auto Off'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow h-8 text-xs sm:text-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Failed Jobs Alert Banner */}
      {totalsData.failed > 0 && (
        <Alert className="bg-orange-warning/10 border-orange-warning/30">
          <AlertTriangle className="h-4 w-4 text-orange-warning" />
          <AlertTitle className="text-text-primary">Failed Jobs Detected</AlertTitle>
          <AlertDescription className="text-text-secondary">
            There are <strong className="text-orange-warning">{totalsData.failed}</strong> failed jobs in the queue. 
            Check the dead-letter queue for details and consider retry or manual intervention.
          </AlertDescription>
        </Alert>
      )}

      {/* Health Status Banner */}
      <Card className={`${currentHealth.bg} border-transparent`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${currentHealth.bg}`}>
                <HealthIcon className={`h-5 w-5 ${currentHealth.color}`} />
              </div>
              <div>
                <p className={`font-semibold ${currentHealth.color}`}>{currentHealth.label}</p>
                <p className="text-sm text-text-secondary">
                  {totalsData.active > 0 && `${totalsData.active} active, `}
                  {totalsData.waiting > 0 && `${totalsData.waiting} waiting, `}
                  {totalsData.completed.toLocaleString()} completed total
                </p>
              </div>
            </div>
            <Badge className={`${currentHealth.bg} ${currentHealth.color} border-0`}>
              {healthStatus.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4">
        <Card className="bg-bg-secondary border-border-subtle hover:border-purple-neon/30 transition-colors">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="text-center">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-purple-neon" />
              <div className="text-xl sm:text-3xl font-bold text-text-primary">{totalsData.waiting}</div>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">Waiting</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-secondary border-border-subtle hover:border-cyan-glow/30 transition-colors">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="text-center">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-cyan-glow" />
              <div className="text-xl sm:text-3xl font-bold text-text-primary">{totalsData.active}</div>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-secondary border-border-subtle hover:border-green-success/30 transition-colors">
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="text-center">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-green-success" />
              <div className="text-xl sm:text-3xl font-bold text-text-primary">{totalsData.completed.toLocaleString()}</div>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`bg-bg-secondary border-border-subtle ${totalsData.failed > 0 ? 'border-orange-warning/50' : 'hover:border-orange-warning/30'} transition-colors`}>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="text-center">
              <AlertTriangle className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 ${totalsData.failed > 0 ? 'text-orange-warning animate-pulse' : 'text-text-muted'}`} />
              <div className={`text-3xl font-bold ${totalsData.failed > 0 ? 'text-orange-warning' : 'text-text-primary'}`}>
                {totalsData.failed}
              </div>
              <p className="text-sm text-text-secondary mt-1">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-secondary border-border-subtle hover:border-pink-featured/30 transition-colors">
          <CardContent className="pt-6">
            <div className="text-center">
              <Layers className="h-6 w-6 mx-auto mb-2 text-pink-featured" />
              <div className="text-3xl font-bold text-text-primary">{totalsData.total.toLocaleString()}</div>
              <p className="text-sm text-text-secondary mt-1">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queues Table */}
      <Card className="bg-bg-secondary border-border-subtle">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Server className="h-5 w-5 text-cyan-glow" />
                Queue Details
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Real-time job queue statistics per queue
              </CardDescription>
            </div>
            {isFetching && (
              <Badge className="bg-cyan-glow/20 text-cyan-glow border-0">
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-border-subtle rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-bg-tertiary border-border-subtle hover:bg-bg-tertiary">
                  <TableHead className="text-text-secondary">Queue Name</TableHead>
                  <TableHead className="text-right text-text-secondary">Waiting</TableHead>
                  <TableHead className="text-right text-text-secondary">Active</TableHead>
                  <TableHead className="text-right text-text-secondary">Delayed</TableHead>
                  <TableHead className="text-right text-text-secondary">Completed</TableHead>
                  <TableHead className="text-right text-text-secondary">Failed</TableHead>
                  <TableHead className="text-right text-text-secondary">Total</TableHead>
                  <TableHead className="text-text-secondary">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Server className="h-12 w-12 text-text-muted mx-auto mb-4" />
                      <p className="text-text-secondary">No queues found</p>
                      <p className="text-sm text-text-muted mt-1">
                        Queues will appear here when jobs are processed
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  queues.map((queue: QueueStats) => {
                    const queueStatus = queue.failed > 0 
                      ? 'error' 
                      : queue.active > 0 
                        ? 'processing' 
                        : queue.waiting > 0 
                          ? 'queued' 
                          : 'idle';
                    
                    const statusConfig = {
                      error: { bg: 'bg-orange-warning/20', text: 'text-orange-warning', label: 'Error' },
                      processing: { bg: 'bg-cyan-glow/20', text: 'text-cyan-glow', label: 'Processing' },
                      queued: { bg: 'bg-purple-neon/20', text: 'text-purple-neon', label: 'Queued' },
                      idle: { bg: 'bg-text-muted/20', text: 'text-text-secondary', label: 'Idle' },
                    };
                    
                    const status = statusConfig[queueStatus];

                    return (
                      <TableRow key={queue.name} className="border-border-subtle hover:bg-bg-tertiary/50 transition-colors">
                        <TableCell className="font-medium text-text-primary">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.bg.replace('/20', '')} ${queueStatus === 'processing' ? 'animate-pulse' : ''}`} />
                            {formatQueueName(queue.name)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`border-purple-neon/30 ${queue.waiting > 0 ? 'text-purple-neon' : 'text-text-muted'}`}>
                            {queue.waiting}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={`${queue.active > 0 ? 'bg-cyan-glow/20 text-cyan-glow' : 'bg-text-muted/10 text-text-muted'} border-0`}>
                            {queue.active}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`border-border-subtle ${queue.delayed > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                            {queue.delayed}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-green-success/20 text-green-success border-0">
                            {queue.completed.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {queue.failed > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openFailedJobsDialog(queue.name)}
                              className="h-auto p-0 hover:bg-transparent"
                            >
                              <Badge className="bg-orange-warning/20 text-orange-warning border-0 hover:bg-orange-warning/30 cursor-pointer transition-colors">
                                <Eye className="h-3 w-3 mr-1" />
                                {queue.failed}
                              </Badge>
                            </Button>
                          ) : (
                            <Badge className="bg-text-muted/10 text-text-muted border-0">
                              {queue.failed}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-text-secondary font-mono text-sm">
                            {queue.total.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.bg} ${status.text} border-0`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-cyan-glow/5 border-cyan-glow/20">
        <CardHeader>
          <CardTitle className="text-sm text-cyan-glow flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Queue Status Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-text-secondary space-y-2">
          <div className="grid gap-3 md:grid-cols-2">
            <p>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4 text-purple-neon" />
                <strong className="text-text-primary">Waiting:</strong>
              </span>{' '}
              Jobs queued and ready to process
            </p>
            <p>
              <span className="inline-flex items-center gap-1">
                <Zap className="h-4 w-4 text-cyan-glow" />
                <strong className="text-text-primary">Active:</strong>
              </span>{' '}
              Jobs currently being processed
            </p>
            <p>
              <span className="inline-flex items-center gap-1">
                <Pause className="h-4 w-4 text-text-muted" />
                <strong className="text-text-primary">Delayed:</strong>
              </span>{' '}
              Jobs scheduled for later execution
            </p>
            <p>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-success" />
                <strong className="text-text-primary">Completed:</strong>
              </span>{' '}
              Successfully processed jobs
            </p>
            <p>
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-warning" />
                <strong className="text-text-primary">Failed:</strong>
              </span>{' '}
              Jobs that encountered errors (check DLQ)
            </p>
            <p>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-4 w-4 text-pink-featured" />
                <strong className="text-text-primary">Total:</strong>
              </span>{' '}
              All-time job count for the queue
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Failed Jobs Dialog */}
      <Dialog 
        open={failedJobsDialog.open} 
        onOpenChange={(open) => setFailedJobsDialog({ open, queueName: open ? failedJobsDialog.queueName : '' })}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] bg-bg-secondary border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-warning" />
              Failed Jobs - {formatQueueName(failedJobsDialog.queueName)}
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              View failed job details, error messages, and stack traces. Retry individual jobs or clear all.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void failedJobsQuery.refetch()}
              disabled={failedJobsQuery.isFetching}
              className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${failedJobsQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearFailedMutation.mutate(failedJobsDialog.queueName)}
              disabled={clearFailedMutation.isPending || (failedJobsQuery.data?.length ?? 0) === 0}
              className="border-orange-warning/30 text-orange-warning hover:bg-orange-warning/10 hover:border-orange-warning"
            >
              {clearFailedMutation.isPending ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear All Failed
            </Button>
          </div>

          <ScrollArea className="h-[500px] pr-4">
            {failedJobsQuery.isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader className="h-6 w-6 animate-spin text-cyan-glow" />
              </div>
            ) : failedJobsQuery.error !== null && failedJobsQuery.error !== undefined ? (
              <Alert variant="destructive" className="bg-orange-warning/10 border-orange-warning/30">
                <AlertCircle className="h-4 w-4 text-orange-warning" />
                <AlertTitle className="text-text-primary">Error</AlertTitle>
                <AlertDescription className="text-text-secondary">
                  Failed to load failed jobs. Please try again.
                </AlertDescription>
              </Alert>
            ) : (failedJobsQuery.data?.length ?? 0) === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-success mx-auto mb-4" />
                <p className="text-text-secondary">No failed jobs in this queue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {failedJobsQuery.data?.map((job) => {
                  const isExpanded = expandedJobs.has(job.id);
                  return (
                    <Card key={job.id} className="bg-bg-tertiary border-border-subtle">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-orange-warning/20 text-orange-warning border-0 font-mono text-xs">
                                {job.name}
                              </Badge>
                              <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
                                Attempts: {job.attemptsMade}
                              </Badge>
                              <span className="text-xs text-text-muted">
                                {formatDate(job.timestamp, 'datetime')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-xs text-text-secondary font-mono bg-bg-primary px-2 py-1 rounded">
                                ID: {job.id}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void copyJobId(job.id)}
                                className="h-6 w-6 p-0 hover:bg-cyan-glow/10"
                              >
                                {copiedId === job.id ? (
                                  <Check className="h-3 w-3 text-green-success" />
                                ) : (
                                  <Copy className="h-3 w-3 text-text-muted" />
                                )}
                              </Button>
                            </div>

                            <p className="text-sm text-orange-warning font-medium mb-2 break-words">
                              {job.failedReason !== '' && job.failedReason !== undefined ? job.failedReason : 'Unknown error'}
                            </p>

                            {job.stacktrace !== undefined && job.stacktrace !== null && job.stacktrace.length > 0 && (
                              <Collapsible open={isExpanded} onOpenChange={() => toggleJobExpanded(job.id)}>
                                <CollapsibleTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-text-secondary hover:text-cyan-glow p-0 h-auto"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 mr-1" />
                                    )}
                                    {isExpanded ? 'Hide' : 'Show'} Stack Trace
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <pre className="text-xs text-text-muted font-mono bg-bg-primary p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                                    {job.stacktrace.join('\n')}
                                  </pre>
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            {job.data !== undefined && job.data !== null && Object.keys(job.data).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
                                  View Job Data
                                </summary>
                                <pre className="text-xs text-text-muted font-mono bg-bg-primary p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(job.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryJobMutation.mutate({ queueName: failedJobsDialog.queueName, jobId: job.id })}
                            disabled={retryJobMutation.isPending}
                            className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow shrink-0"
                          >
                            {retryJobMutation.isPending ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Retry
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatQueueName(name: string): string {
  return name
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
