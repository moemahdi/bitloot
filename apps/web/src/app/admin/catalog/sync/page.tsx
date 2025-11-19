'use client';

/**
 * Admin Catalog Sync Page
 * 
 * Features:
 * - Trigger Kinguin catalog sync
 * - Monitor sync status and progress
 * - View sync history
 * - Display sync statistics
 * - Real-time data with refresh capability
 * - Error handling with retry capability
 * - Network status awareness
 * 
 * Follows Level 5 admin page patterns from orders/page.tsx
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import {
  RefreshCw,
  Play,
  AlertTriangle,
  Loader2,
  WifiOff,
  CheckCircle,
  XCircle,
  Clock,
  Database,
} from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Configuration, AdminCatalogSyncApi } from '@bitloot/sdk';

interface SyncStatusDto {
  syncJobId?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  productsProcessed: number;
  offersProcessed: number;
  errorsCount: number;
  lastSuccessfulSync?: Date;
  nextScheduledSync?: Date;
}

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

export default function AdminCatalogSyncPage(): React.ReactNode {
  // State management
  const [lastError, setLastError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [syncJobId, _setSyncJobId] = useState<string>('');
  const _queryClient = useQueryClient();

  // Error handling with retry logic
  const { handleError, clearError } = useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error: Error, context: string): void => {
      setLastError(error.message);
      console.error('Sync status fetch error:', { error, context });
    },
    onRetry: (attempt: number): void => {
      console.info(`Retrying sync status fetch (attempt ${attempt})...`);
    },
    onRecovery: (): void => {
      setLastError(null);
      console.info('Sync status fetch recovered successfully');
    },
  });

  // Network status (basic implementation)
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Fetch sync status
  const statusQuery = useQuery({
    queryKey: ['admin', 'catalog', 'sync', 'status'],
    queryFn: async (): Promise<SyncStatusDto> => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }

      try {
        const api = new AdminCatalogSyncApi(apiConfig);
        const response = await api.adminSyncControllerGetSyncStatus({
          jobId: syncJobId ?? '',
        });

        clearError();
        return response as SyncStatusDto;
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), 'fetch-sync-status');
        throw error;
      }
    },
    staleTime: 10_000, // 10 seconds for faster status updates
    retry: (failureCount: number, error: Error): boolean => {
      if (failureCount < 3) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        return message.includes('network') || message.includes('timeout');
      }
      return false;
    },
    refetchInterval: autoRefreshEnabled ? 5_000 : false, // 5 second polling during sync
  });

  // Trigger sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const api = new AdminCatalogSyncApi(apiConfig);
      return api.adminSyncControllerTriggerSync({});
    },
    onSuccess: (): void => {
      // Immediately refetch status after triggering sync
      void statusQuery.refetch();
      // Enable auto-refresh to watch sync progress
      setAutoRefreshEnabled(true);
    },
    onError: (error: Error): void => {
      handleError(error, 'trigger-sync');
    },
  });

  // Refresh handler
  const handleRefresh = useCallback((): void => {
    void statusQuery.refetch();
  }, [statusQuery]);

  // Sync trigger handler
  const handleTriggerSync = useCallback((): void => {
    syncMutation.mutate();
  }, [syncMutation]);

  // Loading and state
  const isLoading = statusQuery.isLoading;
  const isRefetching = statusQuery.isRefetching;
  const status = statusQuery.data ?? {
    status: 'idle' as const,
    productsProcessed: 0,
    offersProcessed: 0,
    errorsCount: 0,
  };
  const hasError = statusQuery.isError || lastError !== null;
  const isSyncing = status.status === 'running' || syncMutation.isPending;

  // Status badge color
  const getStatusColor = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (s) {
      case 'running':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'idle':
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Catalog Sync</h1>
        <p className="text-gray-600">Manage Kinguin catalog synchronization</p>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {lastError ?? 'Failed to fetch sync status. Please try again.'}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-2"
              disabled={isRefetching}
            >
              {isRefetching ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Network Alert */}
      {!isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Offline</AlertTitle>
          <AlertDescription>
            You appear to be offline. Sync operations are disabled.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sync Status</CardTitle>
            <CardDescription>Current synchronization state</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching || !isOnline || isSyncing}
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={!isOnline || isSyncing || syncMutation.isPending}
              onClick={handleTriggerSync}
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Trigger Sync
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Current Status */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {status.status === 'running' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {status.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {status.status === 'failed' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {status.status === 'idle' && (
                      <Clock className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-xs font-medium text-gray-600">Status</span>
                  </div>
                  <Badge variant={getStatusColor(status.status)}>
                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                  </Badge>
                </div>

                {/* Products Processed */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium text-gray-600">Products</span>
                  </div>
                  <p className="text-2xl font-bold">{status.productsProcessed}</p>
                </div>

                {/* Offers Processed */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium text-gray-600">Offers</span>
                  </div>
                  <p className="text-2xl font-bold">{status.offersProcessed}</p>
                </div>

                {/* Errors Count */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium text-gray-600">Errors</span>
                  </div>
                  <p className={`text-2xl font-bold ${status.errorsCount > 0 ? 'text-orange-500' : 'text-gray-600'}`}>
                    {status.errorsCount}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4 space-y-2 text-sm">
                {status.startedAt !== null && status.startedAt !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sync Started:</span>
                    <span className="font-medium">
                      {new Date(status.startedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {status.completedAt !== null && status.completedAt !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">
                      {new Date(status.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {status.lastSuccessfulSync !== null && status.lastSuccessfulSync !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Successful:</span>
                    <span className="font-medium">
                      {new Date(status.lastSuccessfulSync).toLocaleString()}
                    </span>
                  </div>
                )}
                {status.nextScheduledSync !== null && status.nextScheduledSync !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Scheduled:</span>
                    <span className="font-medium">
                      {new Date(status.nextScheduledSync).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message if failed */}
              {status.status === 'failed' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Sync Failed</AlertTitle>
                  <AlertDescription>
                    The last synchronization failed. Please check the logs and try again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            <span className="font-medium">Kinguin Sync</span> synchronizes the latest product
            offers from Kinguin&rsquo;s catalog into your BitLoot storefront.
          </p>
          <p>
            <span className="font-medium">Frequency:</span> Syncs can be triggered manually or run
            on a schedule (typically once per day).
          </p>
          <p>
            <span className="font-medium">Processing:</span> Each offer is processed with pricing
            rules applied to compute retail prices.
          </p>
          <p>
            <span className="font-medium">Deduplication:</span> Duplicate offers across platforms
            are consolidated into single products.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
