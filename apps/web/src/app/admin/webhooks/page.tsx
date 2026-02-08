'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { Button } from '@/design-system/primitives/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import {
  RefreshCw,
  ArrowRight,
  Loader2,
  AlertCircle,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { useWebhookStats, type StatsPeriod } from '@/features/admin/hooks/useWebhookStats';
import { useWebhookTimeline } from '@/features/admin/hooks/useWebhookTimeline';
import {
  WebhookQuickStats,
  WebhookTypeBreakdown,
  WebhookActivityChart,
} from '@/features/admin/components/webhooks';

export default function AdminWebhooksDashboardPage(): React.ReactElement {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
  const [period, setPeriod] = useState<StatsPeriod>('24h');
  
  const { stats, isLoading: isStatsLoading, refetch: refetchStats } = useWebhookStats({
    period,
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
  });
  
  const { data: timelineData, isLoading: isTimelineLoading, refetch: refetchTimeline } = useWebhookTimeline({
    period: period,
    refetchInterval: 60_000, // Auto-refresh every minute
  });

  const handleRefresh = () => {
    refetchStats();
    refetchTimeline();
  };

  if (isGuardLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin-glow" />
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">Webhooks Dashboard</h1>
          <p className="text-text-secondary text-xs sm:text-sm hidden xs:block">
            Monitor incoming webhooks, processing status, and system health
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as StatsPeriod)}>
            <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isStatsLoading === true || isTimelineLoading === true} className="hover:text-cyan-glow hover:border-cyan-glow/50 transition-all duration-200 h-8 sm:h-10 text-xs sm:text-sm">
            <RefreshCw className={`mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 ${isStatsLoading === true ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
          <Button asChild className="bg-cyan-glow text-bg-primary hover:shadow-glow-cyan transition-all duration-200 h-8 sm:h-10 text-xs sm:text-sm">
            <Link href="/admin/webhooks/logs">
              <span className="hidden sm:inline">View All Logs</span>
              <span className="sm:hidden">Logs</span>
              <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <WebhookQuickStats stats={stats ?? null} isLoading={isStatsLoading} />

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Activity Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <WebhookActivityChart
            data={timelineData ?? null}
            isLoading={isTimelineLoading}
            title="Webhook Activity Timeline"
            height={280}
          />
        </div>

        {/* Type Breakdown - Takes 1 column */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg text-text-primary">Webhooks by Type</CardTitle>
            <CardDescription className="text-text-secondary text-xs sm:text-sm">Distribution of webhook sources</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {isStatsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="skeleton h-4 rounded w-3/4 mb-1" />
                    <div className="skeleton h-2 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <WebhookTypeBreakdown byType={stats?.byType} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg text-text-primary">Processing Status Overview</CardTitle>
          <CardDescription className="text-text-secondary text-xs sm:text-sm hidden xs:block">
            Quick access to webhooks by processing state
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <Tabs defaultValue="all">
            <TabsList className="mb-3 sm:mb-4 h-8 sm:h-10 flex-wrap">
              <TabsTrigger value="all" className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-9">
                <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">All</span> ({stats?.total ?? 0})
              </TabsTrigger>
              <TabsTrigger value="processed" className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-9">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-success" />
                <span className="hidden sm:inline">Processed</span> ({stats?.processed ?? 0})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-9">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-glow" />
                <span className="hidden sm:inline">Pending</span> ({stats?.pending ?? 0})
              </TabsTrigger>
              <TabsTrigger value="failed" className="gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-9">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-warning" />
                <span className="hidden sm:inline">Failed</span> ({stats?.failed ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <QuickActionCard
                title="View All Webhooks"
                description="Browse and filter through all webhook logs"
                href="/admin/webhooks/logs"
                icon={Activity}
                stats={`${stats?.total ?? 0} total webhooks`}
              />
            </TabsContent>

            <TabsContent value="processed">
              <QuickActionCard
                title="Processed Webhooks"
                description="Successfully processed webhook events"
                href="/admin/webhooks/logs?processed=true"
                icon={CheckCircle2}
                iconColor="text-green-success"
                stats={`${((stats?.processed ?? 0) / ((stats?.total ?? 0) === 0 ? 1 : stats?.total ?? 1) * 100).toFixed(1)}% success rate`}
              />
            </TabsContent>

            <TabsContent value="pending">
              <QuickActionCard
                title="Pending Webhooks"
                description="Webhooks awaiting processing"
                href="/admin/webhooks/logs?processed=false"
                icon={Clock}
                iconColor="text-cyan-glow"
                stats={`${stats?.pending ?? 0} awaiting action`}
                warning={(stats?.pending ?? 0) > 10}
              />
            </TabsContent>

            <TabsContent value="failed">
              <QuickActionCard
                title="Failed Webhooks"
                description="Webhooks that encountered errors during processing"
                href="/admin/webhooks/logs?processed=false&signatureValid=false"
                icon={AlertTriangle}
                iconColor="text-orange-warning"
                stats={`${stats?.failed ?? 0} need attention`}
                warning={(stats?.failed ?? 0) > 0}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Alerts / Issues */}
      {((stats?.invalidSignature ?? 0) > 0 || (stats?.failed ?? 0) > 0) && (
        <Card className="border-orange-warning/30 bg-orange-warning/10 shadow-glow-error">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-warning">
              <AlertCircle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.invalidSignature ?? 0) > 0 && (
              <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg border border-orange-warning/30">
                <div>
                  <p className="font-medium text-text-primary">
                    {stats?.invalidSignature} webhooks with invalid signatures
                  </p>
                  <p className="text-sm text-text-secondary">
                    These webhooks failed HMAC verification and may be spoofed
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="hover:text-cyan-glow hover:border-cyan-glow/50 transition-all duration-200">
                  <Link href="/admin/webhooks/logs?signatureValid=false">
                    Review
                  </Link>
                </Button>
              </div>
            )}
            {(stats?.failed ?? 0) > 0 && (
              <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg border border-orange-warning/30">
                <div>
                  <p className="font-medium text-text-primary">
                    {stats?.failed} webhooks failed processing
                  </p>
                  <p className="text-sm text-text-secondary">
                    These may need manual intervention or replay
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="hover:text-cyan-glow hover:border-cyan-glow/50 transition-all duration-200">
                  <Link href="/admin/webhooks/logs?processed=false">
                    Review & Replay
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  iconColor?: string;
  stats: string;
  warning?: boolean;
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  iconColor = 'text-cyan-glow',
  stats,
  warning,
}: QuickActionCardProps): React.ReactElement {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:bg-bg-tertiary/50 hover:border-border-accent group ${
        warning === true ? 'border-orange-warning/30 bg-orange-warning/10 hover:shadow-glow-error' : 'border-border-subtle hover:shadow-glow-cyan-sm'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full transition-all duration-200 ${
          warning === true ? 'bg-orange-warning/10 group-hover:shadow-glow-error' : 'bg-cyan-glow/10 group-hover:shadow-glow-cyan-sm'
        }`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-muted">{stats}</span>
        <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-cyan-glow transition-colors duration-200" />
      </div>
    </Link>
  );
}

