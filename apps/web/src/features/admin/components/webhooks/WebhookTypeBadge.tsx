'use client';

import { Badge } from '@/design-system/primitives/badge';
import { Webhook, CreditCard, Package, Mail, Shield } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';

export interface WebhookTypeBadgeProps {
  type: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Configuration for each webhook type - BitLoot neon cyberpunk style
 */
const typeConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  nowpayments_ipn: {
    label: 'Payment IPN',
    icon: CreditCard,
    className:
      'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all duration-200',
  },
  payment: {
    label: 'Payment',
    icon: CreditCard,
    className:
      'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all duration-200',
  },
  kinguin: {
    label: 'Kinguin',
    icon: Package,
    className:
      'bg-purple-neon/10 text-purple-neon border-purple-neon/30 shadow-glow-purple-sm hover:shadow-glow-purple transition-all duration-200',
  },
  fulfillment: {
    label: 'Fulfillment',
    icon: Package,
    className:
      'bg-purple-neon/10 text-purple-neon border-purple-neon/30 shadow-glow-purple-sm hover:shadow-glow-purple transition-all duration-200',
  },
  resend: {
    label: 'Email',
    icon: Mail,
    className:
      'bg-green-success/10 text-green-success border-green-success/30 shadow-glow-success hover:shadow-glow-success transition-all duration-200',
  },
  email: {
    label: 'Email',
    icon: Mail,
    className:
      'bg-green-success/10 text-green-success border-green-success/30 shadow-glow-success hover:shadow-glow-success transition-all duration-200',
  },
  admin_status_override: {
    label: 'Admin Override',
    icon: Shield,
    className:
      'bg-orange-warning/10 text-orange-warning border-orange-warning/30 shadow-glow-error hover:shadow-glow-error transition-all duration-200',
  },
};

const defaultConfig = {
  label: 'Webhook',
  icon: Webhook,
  className:
    'bg-bg-tertiary text-text-muted border-border-subtle hover:border-border-accent transition-colors duration-200',
};

/**
 * Webhook Type Badge Component
 * Displays webhook type with neon glow effects and gaming aesthetic
 * 
 * @example
 * <WebhookTypeBadge type="payment" />
 * <WebhookTypeBadge type="kinguin" size="lg" />
 * <WebhookTypeBadge type="email" showIcon={false} />
 */
export function WebhookTypeBadge({
  type,
  className,
  showIcon = true,
  size = 'default',
}: WebhookTypeBadgeProps): React.ReactElement {
  const config = typeConfig[type.toLowerCase()] ?? defaultConfig;
  const Icon = config.icon;

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
      variant="outline"
      className={cn(
        'inline-flex items-center font-medium',
        config.className,
        sizeClasses[size],
        className,
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * Get a human-readable label for webhook type
 * 
 * @example
 * getWebhookTypeLabel('payment') // "Payment"
 * getWebhookTypeLabel('kinguin') // "Kinguin"
 */
export function getWebhookTypeLabel(type: string): string {
  return (typeConfig[type.toLowerCase()] ?? defaultConfig).label;
}
