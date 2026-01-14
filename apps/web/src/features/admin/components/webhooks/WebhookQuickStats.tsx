'use client';

import { Activity, CheckCircle2, Clock, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { cn } from '@/design-system/utils/utils';
import { Skeleton } from '@/design-system/primitives/skeleton';

export interface WebhookStats {
  total: number;
  processed: number;
  pending: number;
  failed: number;
  invalidSignature: number;
  duplicates: number;
  successRate: number;
  byType?: Record<string, number>;
  byStatus?: Record<string, number>;
}

export interface WebhookQuickStatsProps {
  stats: WebhookStats | null | undefined;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Quick Stats Cards Row for Dashboard - BitLoot neon cyberpunk style
 * Displays key webhook metrics with gaming-forward glow effects
 * 
 * @example
 * <WebhookQuickStats stats={webhookStats} />
 * <WebhookQuickStats stats={webhookStats} compact />
 * <WebhookQuickStats isLoading />
 */
export function WebhookQuickStats({
  stats,
  isLoading = false,
  className,
  compact = false,
}: WebhookQuickStatsProps): React.ReactElement {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-4',
          compact ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
          className,
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-bg-secondary border-border-subtle">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20 bg-bg-tertiary" />
              <Skeleton className="h-4 w-4 rounded bg-bg-tertiary" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 bg-bg-tertiary" />
              <Skeleton className="h-3 w-24 mt-1 bg-bg-tertiary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        className={cn(
          'p-8 text-center text-text-muted border border-border-subtle rounded-lg bg-bg-secondary',
          className,
        )}
      >
        No statistics available
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Webhooks',
      value: stats.total,
      icon: Activity,
      color: 'text-cyan-glow',
      bgColor: 'bg-cyan-glow/10',
      glowClass: 'shadow-glow-cyan-sm hover:shadow-glow-cyan',
      borderColor: 'border-cyan-glow/30',
      description: 'All received webhooks',
    },
    {
      title: 'Processed',
      value: stats.processed,
      icon: CheckCircle2,
      color: 'text-green-success',
      bgColor: 'bg-green-success/10',
      glowClass: 'shadow-glow-success hover:shadow-glow-success',
      borderColor: 'border-green-success/30',
      description: `${((stats.processed / stats.total) * 100 || 0).toFixed(1)}% of total`,
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-purple-neon',
      bgColor: 'bg-purple-neon/10',
      glowClass: 'shadow-glow-purple-sm hover:shadow-glow-purple',
      borderColor: 'border-purple-neon/30',
      description: 'Awaiting processing',
    },
    {
      title: 'Failed',
      value: stats.failed,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      glowClass: 'shadow-glow-error hover:shadow-glow-error',
      borderColor: 'border-destructive/30',
      description: 'Processing errors',
    },
    {
      title: 'Invalid Signature',
      value: stats.invalidSignature,
      icon: Shield,
      color: 'text-orange-warning',
      bgColor: 'bg-orange-warning/10',
      glowClass: 'shadow-glow-error hover:shadow-glow-error',
      borderColor: 'border-orange-warning/30',
      description: 'HMAC verification failed',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: TrendingUp,
      color:
        stats.successRate >= 95
          ? 'text-green-success'
          : stats.successRate >= 80
            ? 'text-purple-neon'
            : 'text-orange-warning',
      bgColor:
        stats.successRate >= 95
          ? 'bg-green-success/10'
          : stats.successRate >= 80
            ? 'bg-purple-neon/10'
            : 'bg-orange-warning/10',
      glowClass:
        stats.successRate >= 95
          ? 'shadow-glow-success hover:shadow-glow-success'
          : stats.successRate >= 80
            ? 'shadow-glow-purple-sm hover:shadow-glow-purple'
            : 'shadow-glow-error hover:shadow-glow-error',
      borderColor:
        stats.successRate >= 95
          ? 'border-green-success/30'
          : stats.successRate >= 80
            ? 'border-purple-neon/30'
            : 'border-orange-warning/30',
      description: 'Successful processing rate',
    },
  ];

  return (
    <div
      className={cn(
        'grid gap-4',
        compact ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
        className,
      )}
    >
      {statCards.map((stat) => (
        <StatCard key={stat.title} {...stat} compact={compact} />
      ))}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  glowClass: string;
  borderColor: string;
  description: string;
  compact?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  glowClass,
  borderColor,
  description,
  compact,
}: StatCardProps): React.ReactElement {
  return (
    <Card
      className={cn(
        'bg-bg-secondary border transition-all duration-200',
        borderColor,
        glowClass,
        'hover:border-border-accent',
      )}
    >
      <CardHeader
        className={cn(
          'flex flex-row items-center justify-between space-y-0',
          compact ? 'pb-1 pt-3' : 'pb-2',
        )}
      >
        <CardTitle className={cn('font-medium text-text-secondary', compact ? 'text-xs' : 'text-sm')}>
          {title}
        </CardTitle>
        <div className={cn('p-1.5 rounded border transition-colors duration-200', bgColor, borderColor)}>
          <Icon className={cn(color, compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        </div>
      </CardHeader>
      <CardContent className={compact ? 'pb-3' : undefined}>
        <div className={cn('font-bold text-text-primary', compact ? 'text-xl' : 'text-2xl')}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {!compact && <p className="text-xs text-text-muted mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * Inline Stats - BitLoot neon cyberpunk style
 * Compact inline metrics with neon accent colors
 * 
 * @example
 * <WebhookStatsInline stats={webhookStats} />
 */
export function WebhookStatsInline({
  stats,
  className,
}: {
  stats: WebhookStats | null | undefined;
  className?: string;
}): React.ReactElement {
  if (!stats) return <span className={cn('text-text-muted', className)}>—</span>;

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <span className="text-text-secondary">
        <strong className="text-text-primary">{stats.total}</strong> total
      </span>
      <span className="text-green-success">
        <strong>{stats.processed}</strong> processed
      </span>
      <span className="text-purple-neon">
        <strong>{stats.pending}</strong> pending
      </span>
      {stats.failed > 0 && (
        <span className="text-destructive">
          <strong>{stats.failed}</strong> failed
        </span>
      )}
    </div>
  );
}

/**
 * Type Breakdown Mini Chart - BitLoot neon cyberpunk style
 * Progress bars with neon gradient fills
 * 
 * @example
 * <WebhookTypeBreakdown byType={stats.byType} />
 */
export function WebhookTypeBreakdown({
  byType,
  className,
}: {
  byType: Record<string, number> | undefined;
  className?: string;
}): React.ReactElement {
  if (!byType || Object.keys(byType).length === 0) {
    return <span className="text-text-muted text-sm">No type data</span>;
  }

  const total = Object.values(byType).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(byType).sort(([, a], [, b]) => b - a);

  return (
    <div className={cn('space-y-2', className)}>
      {sorted.map(([type, count]) => {
        const percentage = (count / total) * 100;
        return (
          <div key={type} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium capitalize text-text-primary">
                {type.replace(/_/g, ' ')}
              </span>
              <span className="text-text-muted">
                {count} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden border border-border-subtle">
              <div
                className="h-full bg-gradient-to-r from-cyan-glow to-purple-neon rounded-full transition-all duration-300 shadow-glow-cyan-sm"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
