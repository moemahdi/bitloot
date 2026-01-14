'use client';

import { Badge } from '@/design-system/primitives/badge';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';

export interface WebhookStatusBadgeProps {
  processed: boolean;
  signatureValid: boolean;
  error?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Determines the status type based on webhook state
 */
function getStatusType(
  processed: boolean,
  signatureValid: boolean,
  error?: string,
): 'success' | 'pending' | 'failed' | 'invalid' {
  if (!signatureValid) return 'invalid';
  if (error && error.length > 0) return 'failed';
  if (processed) return 'success';
  return 'pending';
}

/**
 * Webhook Status Badge Component - BitLoot neon cyberpunk style
 * Displays webhook processing status with gaming-forward glow effects
 * 
 * @example
 * <WebhookStatusBadge processed={true} signatureValid={true} />
 * <WebhookStatusBadge processed={false} signatureValid={true} size="lg" />
 * <WebhookStatusBadge processed={false} signatureValid={false} />
 */
export function WebhookStatusBadge({
  processed,
  signatureValid,
  error,
  className,
  showIcon = true,
  size = 'default',
}: WebhookStatusBadgeProps): React.ReactElement {
  const status = getStatusType(processed, signatureValid, error);

  const config = {
    success: {
      label: 'Processed',
      icon: CheckCircle2,
      variant: 'outline' as const,
      className:
        'bg-green-success/10 text-green-success border-green-success/30 shadow-glow-success hover:shadow-glow-success transition-all duration-200',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      variant: 'outline' as const,
      className:
        'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all duration-200',
    },
    failed: {
      label: 'Failed',
      icon: XCircle,
      variant: 'destructive' as const,
      className: 'shadow-glow-error hover:shadow-glow-error transition-all duration-200',
    },
    invalid: {
      label: 'Invalid Sig',
      icon: AlertTriangle,
      variant: 'destructive' as const,
      className: 'shadow-glow-error hover:shadow-glow-error transition-all duration-200',
    },
  };

  const { label, icon: Icon, variant, className: statusClassName } = config[status];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    default: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant={variant}
      className={cn('inline-flex items-center font-medium', statusClassName, sizeClasses[size], className)}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{label}</span>
    </Badge>
  );
}

/**
 * Payment Status Badge - BitLoot neon cyberpunk style
 * Displays payment/webhook status from NOWPayments payload with semantic colors
 * 
 * @example
 * <PaymentStatusBadge status="finished" />
 * <PaymentStatusBadge status="confirming" size="lg" />
 * <PaymentStatusBadge status="underpaid" />
 */
export interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function PaymentStatusBadge({
  status,
  className,
  size = 'default',
}: PaymentStatusBadgeProps): React.ReactElement {
  const statusConfig: Record<string, { label: string; className: string }> = {
    waiting: {
      label: 'Waiting',
      className:
        'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all duration-200',
    },
    confirming: {
      label: 'Confirming',
      className:
        'bg-purple-neon/10 text-purple-neon border-purple-neon/30 shadow-glow-purple-sm hover:shadow-glow-purple transition-all duration-200',
    },
    confirmed: {
      label: 'Confirmed',
      className:
        'bg-green-success/10 text-green-success border-green-success/30 shadow-glow-success hover:shadow-glow-success transition-all duration-200',
    },
    finished: {
      label: 'Finished',
      className:
        'bg-green-success/10 text-green-success border-green-success/30 shadow-glow-success hover:shadow-glow-success transition-all duration-200',
    },
    failed: {
      label: 'Failed',
      className:
        'bg-destructive/10 text-destructive border-destructive/30 shadow-glow-error hover:shadow-glow-error transition-all duration-200',
    },
    expired: {
      label: 'Expired',
      className:
        'bg-text-muted/10 text-text-muted border-border-subtle hover:border-border-accent transition-all duration-200',
    },
    underpaid: {
      label: 'Underpaid',
      className:
        'bg-orange-warning/10 text-orange-warning border-orange-warning/30 shadow-glow-error hover:shadow-glow-error transition-all duration-200',
    },
    pending: {
      label: 'Pending',
      className:
        'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all duration-200',
    },
    processed: {
      label: 'Processed',
      className:
        'bg-green-success/10 text-green-success border-green-success/30 shadow-glow-success hover:shadow-glow-success transition-all duration-200',
    },
    duplicate: {
      label: 'Duplicate',
      className:
        'bg-purple-neon/10 text-purple-neon border-purple-neon/30 shadow-glow-purple-sm hover:shadow-glow-purple transition-all duration-200',
    },
    unknown: {
      label: 'Unknown',
      className: 'bg-bg-tertiary text-text-muted border-border-subtle transition-colors duration-200',
    },
  };

  const normalizedStatus = status?.toLowerCase() ?? 'unknown';
  const defaultConfig = { label: 'Unknown', className: 'bg-bg-tertiary text-text-muted border-border-subtle transition-colors duration-200' };
  const config = statusConfig[normalizedStatus] ?? defaultConfig;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', config.className, sizeClasses[size], className)}>
      {config.label}
    </Badge>
  );
}

/**
 * Duplicate Badge - BitLoot neon cyberpunk style
 * Indicates if a webhook was marked as duplicate (deduplicated)
 * 
 * @example
 * <DuplicateBadge isDuplicate={true} />
 * <DuplicateBadge isDuplicate={false} />
 */
export interface DuplicateBadgeProps {
  isDuplicate?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function DuplicateBadge({
  isDuplicate = false,
  className,
  size = 'default',
}: DuplicateBadgeProps): React.ReactElement {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    default: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  if (!isDuplicate) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'inline-flex items-center font-medium bg-bg-tertiary text-text-muted border-border-subtle transition-colors duration-200',
          sizeClasses[size],
          className,
        )}
      >
        <span>No</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center font-medium bg-purple-neon/10 text-purple-neon border-purple-neon/30 shadow-glow-purple-sm hover:shadow-glow-purple transition-all duration-200',
        sizeClasses[size],
        className,
      )}
    >
      <Copy className={iconSizes[size]} />
      <span>Duplicate</span>
    </Badge>
  );
}
