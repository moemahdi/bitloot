'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { cn } from '@/design-system/utils/utils';

export interface TimelineDataPoint {
  timestamp: string;
  total: number;
  processed: number;
  failed: number;
  pending: number;
}

export interface WebhookActivityChartProps {
  data: TimelineDataPoint[] | null | undefined;
  isLoading?: boolean;
  className?: string;
  height?: number;
  title?: string;
  showLegend?: boolean;
}

/**
 * Webhook Activity Timeline Chart - BitLoot neon cyberpunk style
 * Real-time area chart visualization with neon gradient fills
 * Shows total, processed, failed webhook activity over time
 * Uses recharts with BitLoot's electric color palette
 * 
 * @example
 * <WebhookActivityChart data={timelineData} isLoading={loading} />
 * <WebhookActivityChart data={data} height={400} showLegend={false} />
 */
export function WebhookActivityChart({
  data,
  isLoading = false,
  className,
  height = 300,
  title = 'Webhook Activity',
  showLegend = true,
}: WebhookActivityChartProps): React.ReactElement {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((point) => ({
      ...point,
      time: formatTimestamp(point.timestamp),
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-text-muted border border-border-subtle rounded-lg bg-bg-tertiary/50"
            style={{ height }}
          >
            <p className="text-sm">No activity data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#39FF14" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#39FF14" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 25% 20%)" opacity={0.3} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: 4 }}
            />
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: 'hsl(218 25% 75%)' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#00D9FF"
              strokeWidth={2.5}
              fill="url(#colorTotal)"
              dot={false}
              activeDot={{ r: 5, fill: '#00D9FF', stroke: '#00D9FF', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="processed"
              name="Processed"
              stroke="#39FF14"
              strokeWidth={2.5}
              fill="url(#colorProcessed)"
              dot={false}
              activeDot={{ r: 5, fill: '#39FF14', stroke: '#39FF14', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="failed"
              name="Failed"
              stroke="#FF6B00"
              strokeWidth={2.5}
              fill="url(#colorFailed)"
              dot={false}
              activeDot={{ r: 5, fill: '#FF6B00', stroke: '#FF6B00', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Mini Sparkline Chart - Compact neon visualization
 * Single-metric area chart for inline stats and dashboards
 * Uses cyan-glow by default, customizable per metric type
 * 
 * @example
 * <WebhookSparkline data={data} dataKey="total" color="#00D9FF" />
 * <WebhookSparkline data={data} dataKey="processed" color="#39FF14" />
 */
export function WebhookSparkline({
  data,
  dataKey = 'total',
  color = '#00D9FF',
  height = 40,
  width = 120,
  className,
}: {
  data: TimelineDataPoint[] | null | undefined;
  dataKey?: 'total' | 'processed' | 'failed' | 'pending';
  color?: string;
  height?: number;
  width?: number;
  className?: string;
}): React.ReactElement {
  if (!data || data.length === 0) {
    return <div className={cn('bg-bg-tertiary/50 rounded border border-border-subtle', className)} style={{ height, width }} />;
  }

  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${dataKey})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  } catch {
    return timestamp;
  }
}
