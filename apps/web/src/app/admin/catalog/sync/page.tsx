'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminCatalogSyncApi,
  Configuration,
  type SyncJobStatusResponseDto,
  type SyncJobStatusResponseDtoResult,
} from '@bitloot/sdk';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/primitives/card';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
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
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Play,
  Loader2,
  Package,
  ArrowUpCircle,
  PlusCircle,
  SkipForward,
  History,
  Zap,
  ChevronDown,
  Settings,
  RotateCcw,
} from 'lucide-react';
import { formatDate, formatRelativeTime as formatRelativeTimeUtil, formatDuration as formatDurationUtil } from '@/utils/format-date';

// ============ TYPES ============

interface LiveStats {
  percent: number;
  current: number;
  total: number;
  updated: number;
  created: number;
  skipped: number;
  errors: number;
}

// Use SDK types for sync result data
type SyncResult = SyncJobStatusResponseDtoResult;
// Note: SkippedProductInfoDto and UpdatedProductInfoDto types are used via SyncJobStatusResponseDtoResult

// ============ API CONFIG ============

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts[1]?.split(';')[0] ?? null;
  return null;
}

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  accessToken: () => getCookie('accessToken') ?? '',
});

const syncApi = new AdminCatalogSyncApi(apiConfig);

// ============ HELPERS ============

function formatSyncDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatSyncRelativeTime(dateInput: Date | string): string {
  return formatRelativeTimeUtil(dateInput);
}

// ============ COMPONENTS ============

function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'cyan',
  subtitle,
  animate = false,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: 'cyan' | 'green' | 'purple' | 'orange' | 'pink';
  subtitle?: string;
  animate?: boolean;
}) {
  const colorClasses = {
    cyan: 'text-cyan-glow bg-cyan-glow/10 border-cyan-glow/30',
    green: 'text-green-success bg-green-success/10 border-green-success/30',
    purple: 'text-purple-neon bg-purple-neon/10 border-purple-neon/30',
    orange: 'text-orange-warning bg-orange-warning/10 border-orange-warning/30',
    pink: 'text-pink-featured bg-pink-featured/10 border-pink-featured/30',
  };

  return (
    <Card className={`border ${colorClasses[color]} ${animate ? 'animate-pulse' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            {subtitle !== undefined && subtitle !== '' && (
              <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveSyncProgress({
  status,
  stats,
  startTime,
}: {
  status: SyncJobStatusResponseDto;
  stats: LiveStats;
  startTime: Date | null;
}) {
  const elapsed = startTime !== null ? Date.now() - startTime.getTime() : 0;
  const percent = stats.percent ?? 0;
  const estimatedTotal = percent > 0 ? (elapsed / percent) * 100 : 0;
  const remaining = Math.max(0, estimatedTotal - elapsed);

  return (
    <Card className="border-cyan-glow/50 shadow-glow-cyan-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-cyan-glow animate-spin" />
            <CardTitle className="text-lg">Sync In Progress</CardTitle>
          </div>
          <Badge variant="outline" className="border-cyan-glow text-cyan-glow">
            {status.status}
          </Badge>
        </div>
        <CardDescription>
          Synchronizing products from Kinguin catalog...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">
              Progress: {stats.current.toLocaleString()} / {stats.total.toLocaleString()} products
            </span>
            <span className="text-cyan-glow font-medium">{percent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-cyan-glow to-purple-neon transition-all duration-500 ease-out shadow-glow-cyan-sm"
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>Elapsed: {formatSyncDuration(elapsed)}</span>
            {remaining > 0 && percent > 5 && (
              <span>~{formatSyncDuration(remaining)} remaining</span>
            )}
          </div>
        </div>

        {/* Live Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-bg-tertiary rounded-lg">
            <Package className="h-5 w-5 mx-auto mb-1 text-cyan-glow" />
            <p className="text-xl font-bold text-text-primary">{stats.current.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">Processed</p>
          </div>
          <div className="text-center p-3 bg-bg-tertiary rounded-lg">
            <ArrowUpCircle className="h-5 w-5 mx-auto mb-1 text-purple-neon" />
            <p className="text-xl font-bold text-text-primary">{stats.updated.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">Updated</p>
          </div>
          <div className="text-center p-3 bg-bg-tertiary rounded-lg">
            <PlusCircle className="h-5 w-5 mx-auto mb-1 text-green-success" />
            <p className="text-xl font-bold text-text-primary">{stats.created.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">Created</p>
          </div>
          <div className="text-center p-3 bg-bg-tertiary rounded-lg">
            <SkipForward className="h-5 w-5 mx-auto mb-1 text-text-muted" />
            <p className="text-xl font-bold text-text-primary">{stats.skipped.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">Skipped</p>
          </div>
        </div>

        {/* Error Counter */}
        {stats.errors > 0 && (
          <Alert variant="destructive" className="border-orange-warning/50 bg-orange-warning/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sync Errors</AlertTitle>
            <AlertDescription>
              {stats.errors} error(s) encountered. Check logs for details.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function SyncCompletedSummary({ result, duration }: { result: SyncResult; duration: number }) {
  const [showSkipped, setShowSkipped] = useState(false);
  const [showUpdated, setShowUpdated] = useState(false);
  
  const total = result.productsProcessed ?? 0;
  const hasErrors = (result.errors?.length ?? 0) > 0;
  const hasSkipped = (result.skippedProducts?.length ?? 0) > 0;
  const hasUpdated = (result.updatedProducts?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {/* Summary Alert */}
      <Alert className={hasErrors 
        ? 'border-orange-warning/50 bg-orange-warning/10' 
        : 'border-green-success/50 bg-green-success/10 shadow-glow-success'
      }>
        {hasErrors ? (
          <AlertCircle className="h-5 w-5 text-orange-warning" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-success" />
        )}
        <AlertTitle className="text-lg">
          {hasErrors ? 'Sync Completed with Errors' : 'Sync Completed Successfully!'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <strong>{total.toLocaleString()}</strong> processed
            </span>
            <span className="flex items-center gap-1 text-purple-neon">
              <ArrowUpCircle className="h-4 w-4" />
              <strong>{(result.productsUpdated ?? 0).toLocaleString()}</strong> updated
            </span>
            <span className="flex items-center gap-1 text-green-success">
              <PlusCircle className="h-4 w-4" />
              <strong>{(result.productsCreated ?? 0).toLocaleString()}</strong> created
            </span>
            <span className="flex items-center gap-1 text-text-muted">
              <SkipForward className="h-4 w-4" />
              <strong>{(result.productsSkipped ?? 0).toLocaleString()}</strong> skipped
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatSyncDuration(duration)}
            </span>
          </div>
          {hasErrors && (
            <div className="mt-3 text-orange-warning">
              <strong>{result.errors?.length}</strong> error(s) occurred during sync.
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Updated Products Details */}
      {hasUpdated && (
        <Card className="border-purple-neon/30">
          <CardHeader className="pb-2">
            <button 
              onClick={() => setShowUpdated(!showUpdated)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-purple-neon" />
                <CardTitle className="text-base">
                  Updated Products ({result.updatedProducts?.length ?? 0})
                </CardTitle>
              </div>
              <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${showUpdated ? 'rotate-180' : ''}`} />
            </button>
          </CardHeader>
          {showUpdated && (
            <CardContent className="pt-2">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.updatedProducts?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-text-primary text-sm">{product.title}</p>
                            <p className="text-xs text-text-muted font-mono">{product.externalId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.priceChange?.oldPrice !== undefined && product.priceChange?.newPrice !== undefined ? (
                            <div className="text-sm">
                              <span className="text-text-muted line-through">
                                €{product.priceChange.oldPrice.toFixed(2)}
                              </span>
                              <span className="mx-1">→</span>
                              <span className={product.priceChange.newPrice > product.priceChange.oldPrice 
                                ? 'text-orange-warning' 
                                : 'text-green-success'
                              }>
                                €{product.priceChange.newPrice.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-text-muted text-sm">No price change</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Skipped Products Details */}
      {hasSkipped && (
        <Card className="border-orange-warning/30">
          <CardHeader className="pb-2">
            <button 
              onClick={() => setShowSkipped(!showSkipped)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <SkipForward className="h-5 w-5 text-orange-warning" />
                <CardTitle className="text-base">
                  Skipped Products ({result.skippedProducts?.length ?? 0})
                </CardTitle>
              </div>
              <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${showSkipped ? 'rotate-180' : ''}`} />
            </button>
          </CardHeader>
          {showSkipped && (
            <CardContent className="pt-2">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.skippedProducts?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-text-primary text-sm">{product.title}</p>
                            <p className="text-xs text-text-muted font-mono">{product.externalId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-orange-warning text-sm">{product.reason}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Errors Details */}
      {hasErrors && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-base">
                Errors ({result.errors?.length ?? 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {result.errors?.map((error, index) => (
                <div key={index} className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="badge-success">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="badge-error">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case 'active':
      return (
        <Badge className="badge-info">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    case 'waiting':
      return (
        <Badge variant="outline" className="border-text-muted text-text-muted">
          <Clock className="h-3 w-3 mr-1" />
          Waiting
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">{status}</Badge>
      );
  }
}

// ============ MAIN PAGE ============

export default function CatalogSyncPage() {
  const queryClient = useQueryClient();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [syncStartTime, setSyncStartTime] = useState<Date | null>(null);
  const [selectedHistoryResult, setSelectedHistoryResult] = useState<{
    result: SyncResult;
    duration: number;
    date: Date;
  } | null>(null);
  const [completedResult, setCompletedResult] = useState<{
    result: SyncResult;
    duration: number;
  } | null>(null);
  const [failedReason, setFailedReason] = useState<string | null>(null);

  // ============ QUERIES ============

  // Check Kinguin configuration status
  const { data: configStatus, isLoading: configLoading } = useQuery({
    queryKey: ['kinguin-config'],
    queryFn: () => syncApi.adminSyncControllerGetConfigStatus(),
    staleTime: 60000, // Cache for 1 minute
  });

  // Poll current job status
  const { data: status, error: statusError } = useQuery({
    queryKey: ['sync-status', currentJobId],
    queryFn: async () => {
      if (currentJobId === null || currentJobId === '') return null;
      try {
        return await syncApi.adminSyncControllerGetSyncStatus({ jobId: currentJobId });
      } catch (error) {
        // If 404, job completed and was removed - fetch from history to get full result
        if (error instanceof Error && error.message.includes('404')) {
          // Fetch history to get complete result with skippedProducts/updatedProducts
          const historyResponse = await syncApi.adminSyncControllerGetSyncHistory({ limit: '5' });
          const completedJob = historyResponse.jobs?.find(
            (job) => job.jobId === currentJobId
          );
          
          if (completedJob !== undefined) {
            // Return the full job data from history (includes result with product details)
            return completedJob;
          }
          
          // Fallback if job not found in history
          return {
            jobId: currentJobId,
            status: 'completed',
            progress: 100,
          } as SyncJobStatusResponseDto;
        }
        throw error;
      }
    },
    enabled: currentJobId !== null && currentJobId !== '',
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data === null || data === undefined) return 1000;
      // Stop polling when job is complete
      if (data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      return 1000; // Poll every second while running
    },
    staleTime: 0,
  });

  // Sync history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['sync-history'],
    queryFn: () => syncApi.adminSyncControllerGetSyncHistory({ limit: '10' }),
    staleTime: 30000,
  });

  // ============ MUTATIONS ============

  const triggerSyncMutation = useMutation({
    mutationFn: () => syncApi.adminSyncControllerTriggerSync(),
    onSuccess: (data) => {
      setCurrentJobId(data.jobId);
      setSyncStartTime(new Date());
      setCompletedResult(null);
      setFailedReason(null);
      void queryClient.invalidateQueries({ queryKey: ['sync-history'] });
    },
  });

  // Retry failed sync
  const handleRetrySync = () => {
    setFailedReason(null);
    setCompletedResult(null);
    triggerSyncMutation.mutate();
  };

  // ============ DERIVED STATE ============

  const isJobActive = currentJobId !== null && currentJobId !== '' && (status?.status === 'active' || status?.status === 'waiting');
  const isConfigured = configStatus?.configured === true;
  const history = historyData?.jobs ?? [];

  // Parse live stats from progressData (cast to any to access dynamic properties from job.progress)
  const progressData = status?.progressData as {
    percent?: number;
    current?: number;
    total?: number;
    updated?: number;
    skipped?: number;
    errors?: number;
  } | undefined;
  
  const liveStats: LiveStats = {
    percent: progressData?.percent ?? status?.progress ?? 0,
    current: progressData?.current ?? 0,
    total: progressData?.total ?? 0,
    updated: progressData?.updated ?? 0,
    created: 0, // Not tracked in progress, only in result
    skipped: progressData?.skipped ?? 0,
    errors: progressData?.errors ?? 0,
  };

  // ============ EFFECTS ============

  // Handle job completion
  useEffect(() => {
    if (status?.status === 'completed' && currentJobId !== null && currentJobId !== '') {
      const duration = syncStartTime !== null ? Date.now() - syncStartTime.getTime() : 0;
      
      // Use result if available (from direct status or history fallback)
      // The result should include skippedProducts and updatedProducts arrays
      const result: SyncResult = status.result ?? {
        productsProcessed: progressData?.total ?? progressData?.current ?? 0,
        productsUpdated: progressData?.updated ?? 0,
        productsCreated: 0,
        productsSkipped: progressData?.skipped ?? 0,
        errors: (progressData?.errors !== undefined && progressData.errors > 0) ? [`${progressData.errors} error(s)`] : [],
        // Note: skippedProducts and updatedProducts will be undefined in fallback
        // This should rarely happen now that we fetch from history on 404
      };
      
      setCompletedResult({ result, duration });
      setFailedReason(null);
      setCurrentJobId(null);
      setSyncStartTime(null);
      
      // Refresh history
      void queryClient.invalidateQueries({ queryKey: ['sync-history'] });
    } else if (status?.status === 'failed' && currentJobId !== null && currentJobId !== '') {
      // Capture the failure reason before clearing state
      setFailedReason(status.failedReason ?? 'Unknown error occurred during sync');
      setCurrentJobId(null);
      setSyncStartTime(null);
      void queryClient.invalidateQueries({ queryKey: ['sync-history'] });
    }
  }, [status?.status, status?.result, status?.failedReason, currentJobId, syncStartTime, queryClient, progressData]);

  // ============ RENDER ============

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-cyan-glow" />
            Kinguin Catalog Sync
          </h1>
          <p className="text-text-secondary mt-1">
            Synchronize products from Kinguin API to your catalog
          </p>
        </div>
        <Button
          onClick={() => triggerSyncMutation.mutate()}
          disabled={!isConfigured || isJobActive || triggerSyncMutation.isPending || configLoading}
          className="btn-primary shadow-glow-cyan"
          title={!isConfigured ? 'Kinguin API not configured' : undefined}
        >
          {configLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : triggerSyncMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : isJobActive ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {status?.status === 'waiting' ? 'Waiting in Queue...' : 'Sync Running...'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Sync
            </>
          )}
        </Button>
      </div>

      {/* Configuration Warning */}
      {!configLoading && !isConfigured && (
        <Alert className="border-orange-warning/50 bg-orange-warning/10">
          <Settings className="h-4 w-4 text-orange-warning" />
          <AlertTitle>Kinguin API Not Configured</AlertTitle>
          <AlertDescription>
            {configStatus?.message ?? 'Please configure your Kinguin API key in environment variables to enable catalog sync.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Completed Summary */}
      {completedResult !== null && (
        <SyncCompletedSummary
          result={completedResult.result}
          duration={completedResult.duration}
        />
      )}

      {/* Live Progress */}
      {isJobActive && status !== null && status !== undefined && (
        <LiveSyncProgress
          status={status}
          stats={liveStats}
          startTime={syncStartTime}
        />
      )}

      {/* Error Display */}
      {(triggerSyncMutation.error !== null || statusError !== null) && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {triggerSyncMutation.error?.message ?? 
             (statusError instanceof Error ? statusError.message : 'Unknown error')}
          </AlertDescription>
        </Alert>
      )}

      {/* Failed Sync Alert */}
      {failedReason !== null && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">Sync Failed</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm">{failedReason}</p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetrySync}
                disabled={triggerSyncMutation.isPending || !isConfigured}
                className="border-cyan-glow/50 text-cyan-glow hover:bg-cyan-glow/10"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry Sync
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFailedReason(null)}
                className="text-text-muted hover:text-text-primary"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Last Sync Quick Stats */}
      {history.length > 0 && !isJobActive && completedResult === null && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard
            title="Last Sync"
            value={formatSyncRelativeTime(new Date(history[0]?.processedOn ?? Date.now()))}
            icon={Clock}
            color="cyan"
            subtitle={history[0]?.status}
          />
          <StatsCard
            title="Processed"
            value={((history[0]?.result)?.productsProcessed ?? 0).toLocaleString()}
            icon={Package}
            color="purple"
          />
          <StatsCard
            title="Updated"
            value={((history[0]?.result)?.productsUpdated ?? 0).toLocaleString()}
            icon={ArrowUpCircle}
            color="cyan"
          />
          <StatsCard
            title="Created"
            value={((history[0]?.result)?.productsCreated ?? 0).toLocaleString()}
            icon={PlusCircle}
            color="green"
          />
          <StatsCard
            title="Skipped"
            value={((history[0]?.result)?.productsSkipped ?? 0).toLocaleString()}
            icon={SkipForward}
            color="orange"
          />
        </div>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-text-secondary" />
            <CardTitle>Sync History</CardTitle>
          </div>
          <CardDescription>
            Recent synchronization jobs and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-glow" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bg-tertiary mb-4">
                <Zap className="h-8 w-8 text-cyan-glow/50" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">No Sync History</h3>
              <p className="text-text-muted max-w-sm mx-auto mb-4">
                {isConfigured 
                  ? "You haven't run any catalog syncs yet. Click 'Start Sync' to synchronize your imported Kinguin products."
                  : "Configure your Kinguin API key first, then start syncing products."}
              </p>
              {isConfigured && (
                <Button
                  onClick={() => triggerSyncMutation.mutate()}
                  disabled={isJobActive || triggerSyncMutation.isPending}
                  variant="outline"
                  className="border-cyan-glow/50 text-cyan-glow hover:bg-cyan-glow/10"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start First Sync
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Processed</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Skipped</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((job) => {
                  const duration = (job.finishedOn !== null && job.finishedOn !== undefined && job.processedOn !== null && job.processedOn !== undefined)
                    ? new Date(job.finishedOn).getTime() - new Date(job.processedOn).getTime()
                    : 0;
                  const result = job.result;
                  
                  return (
                    <TableRow key={job.jobId}>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {formatDate(job.processedOn ?? job.createdAt ?? '', 'datetime')}
                          </p>
                          <p className="text-xs text-text-muted">
                            {formatSyncRelativeTime(new Date(job.processedOn ?? job.createdAt ?? ''))}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(result?.productsProcessed ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-purple-neon">
                        {(result?.productsUpdated ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-success">
                        {(result?.productsCreated ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-text-muted">
                        {(result?.productsSkipped ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-text-secondary">
                        {duration > 0 ? formatSyncDuration(duration) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedHistoryResult({
                            result: result ?? {},
                            duration,
                            date: new Date(job.processedOn ?? job.createdAt ?? ''),
                          })}
                          className="text-cyan-glow hover:text-cyan-glow/80"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Selected History Details */}
      {selectedHistoryResult !== null && (
        <Card className="border-cyan-glow/30 shadow-glow-cyan-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-cyan-glow" />
                <CardTitle>Sync Details</CardTitle>
                <span className="text-sm text-text-muted">
                  {formatDate(selectedHistoryResult.date, 'datetime')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedHistoryResult(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SyncCompletedSummary
              result={selectedHistoryResult.result}
              duration={selectedHistoryResult.duration}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
