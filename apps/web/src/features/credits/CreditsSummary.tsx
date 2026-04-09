'use client';

import { useEffect } from 'react';
import { useCreditBalance } from '@/features/credits';
import { useAuth } from '@/hooks/useAuth';
import { Wallet, Info } from 'lucide-react';
import { Switch } from '@/design-system/primitives/switch';

interface CreditsSummaryProps {
  orderTotal: number;
  useCredits: boolean;
  onToggle: (enabled: boolean) => void;
  onCreditAmountChange?: (amount: number) => void;
}

function formatEur(value: number): string {
  if (isNaN(value) || value === 0) return '€0.00';
  return `€${value.toFixed(2)}`;
}

/**
 * Credits summary component for checkout.
 * Shows current balance and lets user toggle credit usage.
 * Only renders for authenticated users with a balance > 0.
 */
export function CreditsSummary({ orderTotal, useCredits, onToggle, onCreditAmountChange }: CreditsSummaryProps) {
  const { isAuthenticated } = useAuth();
  const { data: balance } = useCreditBalance();

  const total = parseFloat(balance?.total ?? '0');
  const hasCredits = isAuthenticated && total > 0;

  const promoBalance = hasCredits ? parseFloat(balance?.promo ?? '0') : 0;
  const cashBalance = hasCredits ? parseFloat(balance?.cash ?? '0') : 0;

  // Minimum crypto payment threshold — must match backend MIN_CRYPTO_PAYMENT
  const MIN_CRYPTO_PAYMENT = 3.0;

  // Credits applied: promo first (FIFO), then cash, up to order total
  let promoUsed = Math.min(promoBalance, orderTotal);
  let remainingAfterPromo = orderTotal - promoUsed;
  let cashUsed = Math.min(cashBalance, remainingAfterPromo);
  let totalApplied = promoUsed + cashUsed;
  let remainingToPay = orderTotal - totalApplied;

  // Cap credits so crypto remainder meets minimum payment threshold
  // If remainder is positive but below minimum, reduce credits
  const cappedByMinimum = remainingToPay > 0 && remainingToPay < MIN_CRYPTO_PAYMENT;
  if (cappedByMinimum) {
    const maxCredits = Math.max(0, orderTotal - MIN_CRYPTO_PAYMENT);
    // Recalculate with capped amount
    promoUsed = Math.min(promoBalance, maxCredits);
    remainingAfterPromo = maxCredits - promoUsed;
    cashUsed = Math.min(cashBalance, remainingAfterPromo);
    totalApplied = promoUsed + cashUsed;
    remainingToPay = orderTotal - totalApplied;
  }

  const fullyCovered = remainingToPay <= 0;

  // Notify parent of credit discount amount
  useEffect(() => {
    if (onCreditAmountChange) {
      onCreditAmountChange(useCredits && hasCredits ? totalApplied : 0);
    }
  }, [useCredits, hasCredits, totalApplied, onCreditAmountChange]);

  if (!isAuthenticated) return null;
  if (total <= 0) return null;

  return (
    <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-subtle/50">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <Wallet className="h-3.5 w-3.5 text-cyan-glow" />
          Use Credits
        </label>
        <Switch
          checked={useCredits}
          onCheckedChange={onToggle}
          aria-label="Toggle credit usage"
        />
      </div>

      {useCredits && (
        <div className="space-y-2 mt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Available Balance</span>
            <span className="font-medium text-cyan-glow tabular-nums">{formatEur(total)}</span>
          </div>
          {promoUsed > 0 && (
            <div className="flex justify-between text-text-muted">
              <span className="pl-2 text-xs">Promo credits</span>
              <span className="tabular-nums text-xs">-{formatEur(promoUsed)}</span>
            </div>
          )}
          {cashUsed > 0 && (
            <div className="flex justify-between text-text-muted">
              <span className="pl-2 text-xs">Cash credits</span>
              <span className="tabular-nums text-xs">-{formatEur(cashUsed)}</span>
            </div>
          )}
          <div className="flex justify-between text-emerald-400">
            <span>Credits Applied</span>
            <span className="font-semibold tabular-nums">-{formatEur(totalApplied)}</span>
          </div>
          {fullyCovered && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-cyan-glow">
              <Info className="h-3 w-3" />
              Fully covered by credits — no crypto payment needed
            </div>
          )}
          {cappedByMinimum && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-400">
              <Info className="h-3 w-3" />
              Minimum crypto payment is {formatEur(MIN_CRYPTO_PAYMENT)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
