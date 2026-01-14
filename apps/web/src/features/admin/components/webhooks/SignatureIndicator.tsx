'use client';

import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/design-system/primitives/tooltip';
import { cn } from '@/design-system/utils/utils';

export interface SignatureIndicatorProps {
  valid: boolean | undefined | null;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Signature Validity Indicator (BitLoot Neon Cyberpunk Style)
 * Shows whether the webhook HMAC signature was verified successfully
 * Uses green-success glow for valid, orange-warning glow for invalid, text-muted for unknown
 */
export function SignatureIndicator({
  valid,
  className,
  showLabel = false,
  size = 'default',
}: SignatureIndicatorProps): React.ReactElement {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const iconClass = sizeClasses[size];

  if (valid === undefined || valid === null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('inline-flex items-center gap-1 text-text-muted transition-colors duration-200', className)}>
              <HelpCircle className={iconClass} />
              {showLabel && <span className="text-xs">Unknown</span>}
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-bg-tertiary border-border-subtle text-text-primary">
            <p>Signature status unknown</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (valid) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('inline-flex items-center gap-1 text-green-success hover:shadow-glow-success transition-all duration-200', className)}>
              <CheckCircle2 className={iconClass} />
              {showLabel && <span className="text-xs font-medium">Valid</span>}
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-bg-tertiary border-border-subtle text-text-primary shadow-glow-success">
            <p className="font-medium">✓ HMAC signature verified successfully</p>
            <p className="text-xs text-text-secondary mt-1">Webhook is authentic and trusted</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1 text-orange-warning hover:shadow-glow-error transition-all duration-200', className)}>
            <XCircle className={iconClass} />
            {showLabel && <span className="text-xs font-medium">Invalid</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-bg-tertiary border-border-subtle text-text-primary shadow-glow-error">
          <p className="font-medium text-orange-warning">⚠️ HMAC signature verification failed</p>
          <p className="text-xs text-text-secondary mt-1">This webhook may be tampered or from an unknown source</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
