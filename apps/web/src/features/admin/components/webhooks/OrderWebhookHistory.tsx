'use client';

import { useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { cn } from '@/design-system/utils/utils';
import { formatRelativeTime } from '@/utils/format-date';
import { WebhookTypeBadge } from './WebhookTypeBadge';
import { SignatureIndicator } from './SignatureIndicator';
import { PaymentStatusBadge } from './WebhookStatusBadge';
import Link from 'next/link';

export interface OrderWebhookItem {
  id: string;
  webhookType: string;
  createdAt: string;
  processed: boolean;
  signatureValid: boolean | null;
  paymentStatus: string | null;
  error: string | null;
  externalId: string | null;
}

export interface OrderWebhookHistoryProps {
  webhooks: OrderWebhookItem[] | null | undefined;
  orderId: string;
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
  showViewAll?: boolean;
}

/**
 * Order Webhook History Timeline (BitLoot Neon Cyberpunk Style)
 * Shows all webhooks related to a specific order with electric timeline visualization
 * Uses green-success for processed, orange-warning for errors, cyan-glow for pending
 */
export function OrderWebhookHistory({
  webhooks,
  orderId,
  isLoading = false,
  className,
  maxItems,
  showViewAll = true,
}: OrderWebhookHistoryProps): React.ReactElement {
  const displayWebhooks = useMemo(() => {
    if (webhooks === null || webhooks === undefined) return [];
    return maxItems !== undefined ? webhooks.slice(0, maxItems) : webhooks;
  }, [webhooks, maxItems]);

  const hasMore = webhooks !== null && webhooks !== undefined && maxItems !== undefined && webhooks.length > maxItems;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-text-primary">Webhook History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (webhooks === null || webhooks === undefined || webhooks.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-text-primary">Webhook History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="empty-state">
            <Clock className="empty-state-icon" />
            <p className="empty-state-title">No webhooks received yet</p>
            <p className="empty-state-description">Webhook events will appear here as they are received for this order</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-text-primary">
          Webhook History
          <Badge variant="secondary" className="ml-2 bg-purple-neon/10 border-purple-neon/30 text-purple-neon">
            {webhooks.length}
          </Badge>
        </CardTitle>
        {showViewAll && (
          <Button variant="ghost" size="sm" asChild className="hover:text-cyan-glow transition-colors duration-200">
            <Link href={`/admin/webhooks/logs?orderId=${orderId}`}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border-subtle" />

          {/* Timeline items */}
          <div className="space-y-4">
            {displayWebhooks.map((webhook, index) => (
              <TimelineItem
                key={webhook.id}
                webhook={webhook}
                _isFirst={index === 0}
                _isLast={index === displayWebhooks.length - 1}
              />
            ))}
          </div>

          {/* Show more indicator */}
          {hasMore && (
            <div className="mt-4 ml-10 text-sm text-text-muted">
              + {webhooks.length - maxItems} more webhooks
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({
  webhook,
  _isFirst,
  _isLast,
}: {
  webhook: OrderWebhookItem;
  _isFirst: boolean;
  _isLast: boolean;
}): React.ReactElement {
  const getStatusIcon = () => {
    if (webhook.error !== null && webhook.error !== undefined && webhook.error !== '') {
      return <XCircle className="h-4 w-4 text-orange-warning" />;
    }
    if (webhook.processed === true) {
      return <CheckCircle2 className="h-4 w-4 text-green-success" />;
    }
    return <Clock className="h-4 w-4 text-cyan-glow" />;
  };

  const getStatusColor = () => {
    if (webhook.error !== null && webhook.error !== undefined && webhook.error !== '') return 'bg-orange-warning/10 border-orange-warning/30 shadow-glow-error';
    if (webhook.processed === true) return 'bg-green-success/10 border-green-success/30 shadow-glow-success';
    return 'bg-cyan-glow/10 border-cyan-glow/30 shadow-glow-cyan-sm';
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline dot */}
      <div
        className={cn(
          'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-bg-secondary transition-all duration-200',
          getStatusColor()
        )}
      >
        {getStatusIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <WebhookTypeBadge type={webhook.webhookType} size="sm" />
          <SignatureIndicator valid={webhook.signatureValid} size="sm" />
          {webhook.paymentStatus !== null && webhook.paymentStatus !== undefined && webhook.paymentStatus !== '' ? (
            <PaymentStatusBadge status={webhook.paymentStatus} size="sm" />
          ) : null}
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
          <time dateTime={webhook.createdAt}>
            {formatRelativeTime(webhook.createdAt)}
          </time>
          {webhook.externalId !== null && webhook.externalId !== undefined && webhook.externalId !== '' ? (
            <span className="text-text-muted font-mono text-xs">
              #{webhook.externalId.slice(0, 8)}
            </span>
          ) : null}
        </div>

        {webhook.error !== null && webhook.error !== undefined && webhook.error !== '' ? (
          <div className="mt-2 p-2 bg-orange-warning/10 rounded text-sm text-orange-warning border border-orange-warning/30 shadow-glow-error">
            {webhook.error}
          </div>
        ) : null}

        <div className="mt-2">
          <Button variant="ghost" size="sm" asChild className="h-7 px-2 hover:text-cyan-glow transition-colors duration-200">
            <Link href={`/admin/webhooks/logs/${webhook.id}`}>
              View Details <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline timeline for tables (BitLoot Neon Style)
 * Shows webhook count with success/error badges
 */
export function OrderWebhookTimelineCompact({
  webhooks,
  orderId,
  className,
}: {
  webhooks: OrderWebhookItem[] | null | undefined;
  orderId: string;
  className?: string;
}): React.ReactElement {
  if (webhooks === null || webhooks === undefined || webhooks.length === 0) {
    return <span className={cn('text-text-muted text-sm', className)}>No webhooks</span>;
  }

  const processed = webhooks.filter((w) => w.processed).length;
  const failed = webhooks.filter((w) => w.error !== null && w.error !== undefined && w.error !== '').length;

  return (
    <Link
      href={`/admin/webhooks/logs?orderId=${orderId}`}
      className={cn('inline-flex items-center gap-2 text-sm hover:text-cyan-glow hover:underline transition-colors duration-200', className)}
    >
      <span className="text-text-secondary">{webhooks.length} webhooks</span>
      {processed > 0 && (
        <Badge variant="outline" className="h-5 text-green-success border-green-success/30 bg-green-success/10">
          {processed} ✓
        </Badge>
      )}
      {failed > 0 && (
        <Badge variant="outline" className="h-5 text-orange-warning border-orange-warning/30 bg-orange-warning/10">
          {failed} ✗
        </Badge>
      )}
    </Link>
  );
}
