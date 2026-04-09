'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCreditBalance, useCreateTopup } from '@/features/credits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import { Loader2, Wallet, ArrowLeft, Check, Shield, Zap, Clock, Info, CircleDollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250] as const;
const MIN_AMOUNT = 5;
const MAX_AMOUNT = 500;
const BALANCE_CAP = 2000;

function formatEur(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n) || n === 0) return '€0.00';
  return `€${n.toFixed(2)}`;
}

export default function TopupPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: balance, isLoading: balanceLoading } = useCreditBalance();
  const topupMutation = useCreateTopup();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const currentTotal = parseFloat(balance?.total ?? '0');
  const effectiveAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);
  const wouldExceedCap = currentTotal + effectiveAmount > BALANCE_CAP;
  const isValidAmount = effectiveAmount >= MIN_AMOUNT && effectiveAmount <= MAX_AMOUNT && !wouldExceedCap;

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login?redirect=/credits/topup');
    return null;
  }

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleTopup = async () => {
    if (!isValidAmount) return;

    try {
      const result = await topupMutation.mutateAsync(effectiveAmount);
      // Navigate to the checkout page to select crypto and complete payment
      router.push(`/credits/topup/${result.topupId}`);
    } catch {
      toast.error('Failed to create top-up. Please try again.');
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Back Link */}
      <Link
        href="/profile?tab=credits"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-cyan-glow transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Credits
      </Link>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold sm:text-3xl">
          <span className="text-gradient-primary">Top Up</span> Credits
        </h1>
        <p className="text-text-secondary mt-2">
          Add funds to your BitLoot balance. Pay with crypto, spend instantly.
        </p>
      </motion.div>

      {/* Current Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-cyan-glow/20 bg-gradient-to-r from-cyan-glow/5 to-transparent mb-6">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-cyan-glow/10 p-2">
                <Wallet className="h-5 w-5 text-cyan-glow" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Current Balance</p>
                {balanceLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
                ) : (
                  <p className="text-xl font-bold text-cyan-glow tabular-nums">
                    {formatEur(currentTotal)}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-xs text-text-muted border-border-subtle">
              Cap: {formatEur(BALANCE_CAP)}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Amount Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass border-border-subtle mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select Amount</CardTitle>
            <CardDescription>Choose a preset or enter a custom amount (€{MIN_AMOUNT}–€{MAX_AMOUNT})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AMOUNTS.map((amount) => {
                const isSelected = selectedAmount === amount;
                const exceedsCap = currentTotal + amount > BALANCE_CAP;

                return (
                  <button
                    key={amount}
                    onClick={() => !exceedsCap && handlePresetClick(amount)}
                    disabled={exceedsCap}
                    className={`
                      relative rounded-xl border p-4 text-center transition-all duration-200
                      ${isSelected
                        ? 'border-cyan-glow bg-cyan-glow/10 shadow-glow-sm ring-1 ring-cyan-glow/30'
                        : exceedsCap
                          ? 'border-border-subtle/50 opacity-50 cursor-not-allowed'
                          : 'border-border-subtle hover:border-cyan-glow/30 hover:bg-bg-secondary/50 cursor-pointer'
                      }
                    `}
                  >
                    <p className={`text-lg font-bold tabular-nums ${isSelected ? 'text-cyan-glow' : 'text-text-primary'}`}>
                      €{amount}
                    </p>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 rounded-full bg-cyan-glow p-0.5">
                        <Check className="h-3 w-3 text-bg-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <label htmlFor="custom-amount" className="text-sm text-text-muted">
                Or enter custom amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">€</span>
                <Input
                  id="custom-amount"
                  type="number"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step="1"
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  placeholder={`${MIN_AMOUNT}–${MAX_AMOUNT}`}
                  className="pl-7"
                />
              </div>
              {wouldExceedCap && effectiveAmount > 0 && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Would exceed {formatEur(BALANCE_CAP)} balance cap
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary & CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass border-border-subtle mb-6">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Top-up amount</span>
              <span className="font-medium tabular-nums">{formatEur(effectiveAmount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border-subtle pt-3">
              <span className="text-text-muted">New balance after top-up</span>
              <span className="font-bold text-cyan-glow tabular-nums">
                {formatEur(currentTotal + effectiveAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleTopup}
          disabled={!isValidAmount || topupMutation.isPending}
          className="w-full gap-2 h-12 text-base bg-gradient-to-r from-cyan-glow to-cyan-glow/80 text-bg-primary hover:from-cyan-300 hover:to-cyan-glow font-semibold transition-all disabled:opacity-50"
        >
          {topupMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CircleDollarSign className="h-5 w-5" />
              Top Up {effectiveAmount > 0 ? formatEur(effectiveAmount) : ''}
            </>
          )}
        </Button>
      </motion.div>

      {/* Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid gap-3 sm:grid-cols-3 mt-8"
      >
        {[
          { icon: Zap, title: 'Instant', desc: 'Credits available immediately after payment confirms' },
          { icon: Shield, title: 'Secure', desc: 'Pay with 100+ cryptocurrencies via NOWPayments' },
          { icon: Clock, title: 'No Expiry', desc: 'Cash credits never expire — use them anytime' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-lg border border-border-subtle/50 bg-bg-secondary/20 p-3">
            <Icon className="h-5 w-5 text-cyan-glow shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
