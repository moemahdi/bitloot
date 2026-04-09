'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCreditBalance, useCreditTransactions, useExpiringCredits } from './useCredits';
import { CreditsControllerGetTransactionsCreditTypeEnum } from '@bitloot/sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Loader2, Wallet, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, Gift, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, CircleDollarSign, Coins } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────

function formatEur(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n) || n === 0) return '€0.00';
  return `€${n.toFixed(2)}`;
}

function txTypeLabel(type: string): string {
  const map: Record<string, string> = {
    promo_grant: 'Promo Credit',
    cash_topup: 'Top-Up',
    purchase_spend: 'Purchase',
    refund_credit: 'Refund',
    admin_grant: 'Admin Grant',
    admin_adjust: 'Admin Adjustment',
    expiry: 'Expired',
    cashback: 'Cashback',
    signup_bonus: 'Sign-Up Bonus',
    referral_bonus: 'Referral Bonus',
    extension: 'Extension',
  };
  return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function txTypeColor(type: string): string {
  if (type.includes('spend') || type === 'expiry') return 'text-red-400';
  if (type.includes('topup') || type.includes('cashback') || type.includes('refund')) return 'text-emerald-400';
  if (type.includes('grant') || type.includes('bonus')) return 'text-cyan-glow';
  return 'text-text-secondary';
}

function txIcon(type: string) {
  if (type.includes('spend')) return ArrowUpRight;
  if (type.includes('topup')) return ArrowDownLeft;
  if (type.includes('grant') || type.includes('bonus')) return Gift;
  if (type === 'expiry') return Clock;
  if (type.includes('refund')) return RefreshCw;
  return Coins;
}

function formatTxDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Main Component ─────────────────────────────────────────────────

export function CreditsTabContent() {
  const [txPage, setTxPage] = useState(1);
  const [txFilter, setTxFilter] = useState<CreditsControllerGetTransactionsCreditTypeEnum | undefined>(undefined);
  const { data: balance, isLoading: loadingBalance } = useCreditBalance();
  const { data: transactions, isLoading: loadingTx } = useCreditTransactions(txPage, 10, txFilter);
  const { data: expiring } = useExpiringCredits();

  const totalBalance = parseFloat(balance?.total ?? '0');
  const cashBalance = parseFloat(balance?.cash ?? '0');
  const promoBalance = parseFloat(balance?.promo ?? '0');
  const expiringAmount = parseFloat(expiring?.amount ?? '0');
  const expiringEarliest = (expiring?.earliest as string | null) ?? null;

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Balance */}
        <Card className="glass border-cyan-glow/20 bg-gradient-to-br from-cyan-glow/5 to-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-text-muted">
              <Wallet className="h-4 w-4" />
              Total Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBalance ? (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
            ) : (
              <p className="text-2xl font-bold text-cyan-glow tabular-nums">
                {formatEur(totalBalance)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cash Credits */}
        <Card className="glass border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-text-muted">
              <CircleDollarSign className="h-4 w-4" />
              Cash Credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBalance ? (
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            ) : (
              <>
                <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                  {formatEur(cashBalance)}
                </p>
                <p className="text-xs text-text-muted mt-1">Never expires</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Promo Credits */}
        <Card className="glass border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-text-muted">
              <Gift className="h-4 w-4" />
              Promo Credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBalance ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            ) : (
              <>
                <p className="text-2xl font-bold text-purple-400 tabular-nums">
                  {formatEur(promoBalance)}
                </p>
                {expiringAmount > 0 && (
                  <p className="text-xs text-orange-warning mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {formatEur(expiringAmount)} expiring soon
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/credits/topup">
          <Button className="gap-2 bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 hover:bg-cyan-glow/20 hover:border-cyan-glow/50 transition-all">
            <TrendingUp className="h-4 w-4" />
            Top Up Credits
          </Button>
        </Link>
      </div>

      {/* Transaction Filters */}
      <Card className="glass border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Transaction History</CardTitle>
            <div className="flex gap-2">
              {(['all', 'promo', 'cash'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={
                    (filter === 'all' && txFilter === undefined) || txFilter === filter
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => setTxFilter(
                    filter === 'all'
                      ? undefined
                      : filter === 'promo'
                        ? CreditsControllerGetTransactionsCreditTypeEnum.Promo
                        : CreditsControllerGetTransactionsCreditTypeEnum.Cash
                  )}
                  className="text-xs"
                >
                  {filter === 'all' ? 'All' : filter === 'promo' ? 'Promo' : 'Cash'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTx ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-glow" />
            </div>
          ) : !transactions?.items.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Coins className="h-10 w-10 mb-3 text-text-muted/50" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.items.map((tx) => {
                  const Icon = txIcon(tx.type);
                  const amt = parseFloat(tx.amount);
                  const isCredit = amt > 0;

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 rounded-lg border border-border-subtle/50 bg-bg-secondary/30 px-4 py-3 transition-colors hover:bg-bg-secondary/60"
                    >
                      <div className={`rounded-full p-2 ${isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <Icon className={`h-4 w-4 ${isCredit ? 'text-emerald-400' : 'text-red-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {txTypeLabel(tx.type)}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-text-muted truncate">{String(tx.description)}</p>
                        )}
                        <p className="text-xs text-text-muted">{formatTxDate(String(tx.createdAt))}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold tabular-nums ${txTypeColor(tx.type)}`}>
                          {isCredit ? '+' : ''}{formatEur(amt)}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tx.creditType}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {transactions.total > 10 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
                  <p className="text-xs text-text-muted">
                    Page {transactions.page} of {Math.ceil(transactions.total / 10)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                      disabled={txPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTxPage((p) => p + 1)}
                      disabled={txPage >= Math.ceil(transactions.total / 10)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
