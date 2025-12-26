'use client';

import { useQuery } from '@tanstack/react-query';
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
  AlertCircle,
  RefreshCw,
  Loader,
  Activity,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { AdminOperationsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
}

const adminOpsApi = new AdminOperationsApi(apiConfig);

/**
 * AdminQueuesPage - BullMQ Queue Monitoring
 * Phase 3: Ops Panels & Monitoring
 * 
 * Real-time monitoring of asynchronous job queues:
 * - Payments Queue: Payment processing jobs
 * - Fulfillment Queue: Order fulfillment jobs
 * - Email Queue: Email notification jobs (stub for L6)
 */
export default function AdminQueuesPage(): React.ReactElement {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch queue stats
  const queryResult = useQuery<QueueStats[]>({
    queryKey: ['admin', 'queues', 'stats'],
    queryFn: async (): Promise<QueueStats[]> => {
      try {
        const response = await adminOpsApi.adminOpsControllerGetQueueStats();
        // API returns { [queueName]: stats }, convert to array
        if (typeof response === 'object' && response !== null) {
          return Object.entries(response).map(([name, stats]: [string, unknown]): QueueStats => {
            const s = stats as { waiting?: number; active?: number; delayed?: number; failed?: number };
            return {
              name,
              waiting: s.waiting ?? 0,
              active: s.active ?? 0,
              delayed: s.delayed ?? 0,
              failed: s.failed ?? 0,
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

  const { data: queues = [], isLoading, error } = queryResult;
  const handleRefresh = useCallback((): void => {
    void queryResult.refetch();
  }, [queryResult]);

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
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error !== null && error !== undefined) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load queue statistics. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate totals with explicit typing
  const totalsData = queues.reduce(
    (acc: { waiting: number; active: number; failed: number }, q: QueueStats) => ({
      waiting: acc.waiting + q.waiting,
      active: acc.active + q.active,
      failed: acc.failed + q.failed,
    }),
    { waiting: 0, active: 0, failed: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Job Queues</h1>
          <p className="text-muted-foreground mt-1">
            Monitor BullMQ async job processing
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-Refreshing' : 'Auto-Refresh Off'}
          </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading ?? false}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-3xl font-bold">{totalsData.waiting}</div>
              <p className="text-sm text-muted-foreground mt-1">Waiting</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold">{totalsData.active}</div>
              <p className="text-sm text-muted-foreground mt-1">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-3xl font-bold">{totalsData.failed}</div>
              <p className="text-sm text-muted-foreground mt-1">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Details</CardTitle>
          <CardDescription>Real-time job queue statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Queue Name</TableHead>
                  <TableHead className="text-right">Waiting</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Delayed</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queues.map((queue: QueueStats) => (
                  <TableRow key={queue.name}>
                    <TableCell className="font-medium">{formatQueueName(queue.name)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{queue.waiting}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{queue.active}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{queue.delayed}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={queue.failed > 0 ? 'destructive' : 'outline'}>
                        {queue.failed}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          queue.active > 0
                            ? 'default'
                            : queue.waiting > 0
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {queue.active > 0 ? 'Processing' : queue.waiting > 0 ? 'Queued' : 'Idle'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">💡 Queue Statuses</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Waiting:</strong> Jobs queued and ready to process
          </p>
          <p>
            <strong>Active:</strong> Jobs currently being processed
          </p>
          <p>
            <strong>Delayed:</strong> Jobs scheduled for later execution
          </p>
          <p>
            <strong>Failed:</strong> Jobs that encountered errors (check dead-letter queue)
          </p>
          <p>
            <strong>Completed:</strong> Successfully processed jobs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function formatQueueName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
