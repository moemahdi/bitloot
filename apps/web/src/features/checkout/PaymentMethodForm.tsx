'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Check,
  Search,
  Zap,
  AlertCircle,
  Loader2,
  Shield,
  Coins,
  X,
  Sparkles,
  Star,
  TrendingUp,
  DollarSign,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { PaymentsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { CryptoIcon } from '@/components/crypto-icons';
import {
  POPULAR_COINS,
  STABLECOINS,
  OTHER_CURRENCIES,
  getCurrencyByCode,
  type CryptoCurrency,
} from '@/config/supported-currencies';

const paymentsClient = new PaymentsApi(apiConfig);

// ============================================
// TYPES & VALIDATION SCHEMA
// ============================================

const paymentMethodSchema = z.object({
  payCurrency: z
    .string({
      required_error: 'Please select a cryptocurrency',
    })
    .min(1, 'Please select a cryptocurrency'),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  onSubmit: (data: PaymentMethodFormData) => Promise<void>;
  isLoading?: boolean;
  defaultCurrency?: string;
  /** Order total in fiat (e.g., '5.31'). When provided, currencies that don't meet the minimum are disabled. */
  orderTotal?: string;
}

// ============================================
// QUICK SELECT CURRENCIES (Top 6)
// ============================================

const QUICK_SELECT: CryptoCurrency[] = [
  { code: 'ltc', name: 'Litecoin', symbol: 'LTC', category: 'popular' },
  { code: 'btc', name: 'Bitcoin', symbol: 'BTC', category: 'popular' },
  { code: 'eth', name: 'Ethereum', symbol: 'ETH', category: 'popular' },
  { code: 'usdttrc20', name: 'Tether', symbol: 'USDT', network: 'TRC20', category: 'stablecoin' },
  { code: 'sol', name: 'Solana', symbol: 'SOL', category: 'popular' },
  { code: 'usdc', name: 'USD Coin', symbol: 'USDC', network: 'ETH', category: 'stablecoin' },
];

// ============================================
// CATEGORY TABS
// ============================================

type TabId = 'popular' | 'stablecoins' | 'all';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'popular', label: 'Popular', icon: TrendingUp },
  { id: 'stablecoins', label: 'Stablecoins', icon: DollarSign },
  { id: 'all', label: 'All Coins', icon: Globe },
];

// ============================================
// SUB-COMPONENTS
// ============================================

/** Compact currency pill for quick select */
function CurrencyPill({
  currency,
  isSelected,
  onClick,
  isLoading = false,
}: {
  currency: CryptoCurrency;
  isSelected: boolean;
  onClick: () => void;
  isLoading?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={isLoading ? undefined : onClick}
      whileHover={isLoading ? {} : { y: -2 }}
      whileTap={isLoading ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        relative flex items-center gap-2.5 px-4 py-3 rounded-2xl
        border transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
        ${isLoading
          ? 'opacity-70 cursor-wait border-cyan-glow/30 bg-bg-secondary'
          : isSelected
            ? 'bg-gradient-to-r from-cyan-glow/15 to-cyan-glow/5 border-cyan-glow/60 shadow-[0_0_20px_rgba(0,217,255,0.15)]'
            : 'bg-bg-secondary/80 border-border-subtle hover:border-border-accent hover:bg-bg-tertiary/80'
        }
      `}
      aria-pressed={isSelected}
      aria-disabled={isLoading}
      aria-label={`Select ${currency.name}${currency.network !== undefined && currency.network !== null && currency.network !== '' ? ` on ${currency.network}` : ''}`}
    >
      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-bg-secondary/60 backdrop-blur-sm z-10">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-glow" />
        </div>
      )}

      <CryptoIcon code={currency.code} size={28} className="flex-shrink-0" />
      
      <div className="flex flex-col items-start min-w-0">
        <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-cyan-glow' : 'text-text-primary'}`}>
          {currency.symbol}
        </span>
        {currency.network !== undefined && currency.network !== null && currency.network !== '' && (
          <span className="text-[10px] text-text-muted leading-tight">{currency.network}</span>
        )}
      </div>

      {/* Selected indicator */}
      <AnimatePresence>
        {isSelected && !isLoading && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="ml-auto w-5 h-5 rounded-full bg-cyan-glow flex items-center justify-center flex-shrink-0"
          >
            <Check className="w-3 h-3 text-bg-primary" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** Currency row item for the browse list */
function CurrencyRow({
  currency,
  isSelected,
  onClick,
  isLoading = false,
}: {
  currency: CryptoCurrency;
  isSelected: boolean;
  onClick: () => void;
  isLoading?: boolean;
}) {
  const inactive = isLoading;
  return (
    <motion.button
      type="button"
      onClick={inactive ? undefined : onClick}
      whileTap={inactive ? {} : { scale: 0.99 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-150 group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary
        ${isLoading
          ? 'opacity-70 cursor-wait bg-cyan-glow/5'
          : isSelected
            ? 'bg-cyan-glow/10 shadow-[inset_0_0_0_1px_rgba(0,217,255,0.25)]'
            : 'hover:bg-bg-tertiary/70'
        }
      `}
      aria-pressed={isSelected}
      aria-disabled={inactive}
      aria-label={`Select ${currency.name}${currency.network !== undefined && currency.network !== null && currency.network !== '' ? ` on ${currency.network}` : ''}`}
    >
      <CryptoIcon code={currency.code} size={32} className="flex-shrink-0" />
      
      <div className="flex flex-col items-start min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isSelected ? 'text-cyan-glow' : 'text-text-primary'}`}>
            {currency.symbol}
          </span>
          {currency.network !== undefined && currency.network !== null && currency.network !== '' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-bg-tertiary text-text-muted border border-border-subtle/50">
              {currency.network}
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted truncate max-w-full">{currency.name}</span>
      </div>

      {/* Loading or check */}
      <div className="flex-shrink-0 w-6 flex justify-center">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyan-glow" />
        ) : isSelected ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="w-5 h-5 rounded-full bg-cyan-glow flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-bg-primary" strokeWidth={3} />
          </motion.div>
        ) : (
          <div className="w-5 h-5 rounded-full border border-border-subtle group-hover:border-border-accent transition-colors" />
        )}
      </div>
    </motion.button>
  );
}

/** Floating selected currency bar */
function SelectedBar({ currency, onClear }: { currency: CryptoCurrency; onClear: () => void }) {
  return (
    <motion.div
      key={currency.code}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center justify-between p-3 rounded-2xl
        bg-gradient-to-r from-cyan-glow/10 via-bg-secondary to-purple-neon/5
        border border-cyan-glow/25 shadow-[0_0_30px_rgba(0,217,255,0.08)]"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <CryptoIcon code={currency.code} size={40} />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-success flex items-center justify-center ring-2 ring-bg-secondary"
          >
            <Check className="w-2.5 h-2.5 text-bg-primary" strokeWidth={3} />
          </motion.div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">{currency.symbol}</span>
            {currency.network !== undefined && currency.network !== null && currency.network !== '' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-bg-tertiary text-text-muted border border-border-subtle/50">
                {currency.network}
              </span>
            )}
          </div>
          <span className="text-xs text-text-muted">{currency.name}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        aria-label="Change currency"
      >
        <span className="text-xs font-medium text-cyan-glow hover:text-cyan-glow/80 transition-colors">Change</span>
      </button>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PaymentMethodForm({
  onSubmit,
  isLoading = false,
  defaultCurrency = 'ltc',
  orderTotal,
}: PaymentMethodFormProps) {
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('popular');
  const [showBrowser, setShowBrowser] = useState(false);
  const [validatingCurrency, setValidatingCurrency] = useState<string | null>(null);
  const [currencyError, setCurrencyError] = useState<{ code: string; message: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Form setup
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      payCurrency: defaultCurrency,
    },
  });

  const selectedCurrency = watch('payCurrency');
  const selectedCurrencyInfo = getCurrencyByCode(selectedCurrency);

  // Handle currency selection with click-to-validate
  const handleSelectCurrency = useCallback(async (code: string): Promise<void> => {
    if (validatingCurrency !== null) return;
    setCurrencyError(null);

    if (orderTotal === undefined || orderTotal === '') {
      setValue('payCurrency', code, { shouldValidate: true });
      setShowBrowser(false);
      return;
    }

    setValidatingCurrency(code);

    try {
      const result = await paymentsClient.paymentsControllerCheckCurrency({
        payCurrency: code,
        amount: orderTotal,
        priceCurrency: 'eur',
      });

      if (result.available === false) {
        setCurrencyError({
          code,
          message: result.message ?? `Minimum amount not met for ${code.toUpperCase()}`,
        });
        setValidatingCurrency(null);
        return;
      }
    } catch {
      // If validation call fails, allow selection
    }

    setValidatingCurrency(null);
    setValue('payCurrency', code, { shouldValidate: true });
    setShowBrowser(false);
  }, [validatingCurrency, orderTotal, setValue]);

  // Auto-focus search when browser opens
  useEffect(() => {
    if (showBrowser && searchInputRef.current !== null) {
      // Small delay for animation
      const t = setTimeout(() => searchInputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [showBrowser]);

  // Clear search when tab changes
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  // Filter currencies based on search + tab
  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filterFn = (currency: CryptoCurrency) => {
      if (query === '') return true;
      return (
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query) ||
        currency.symbol.toLowerCase().includes(query) ||
        (currency.network?.toLowerCase().includes(query) ?? false)
      );
    };

    if (activeTab === 'popular') return POPULAR_COINS.filter(filterFn);
    if (activeTab === 'stablecoins') return STABLECOINS.filter(filterFn);
    return [...POPULAR_COINS, ...STABLECOINS, ...OTHER_CURRENCIES].filter(filterFn);
  }, [searchQuery, activeTab]);

  // Handle form submission
  const onFormSubmit = async (data: PaymentMethodFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="w-full space-y-5">
      {/* ── Header ── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            Pay with Crypto
          </h2>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-glow/10 border border-cyan-glow/20">
            <Zap className="w-3 h-3 text-cyan-glow" />
            <span className="text-[10px] font-semibold text-cyan-glow uppercase tracking-wider">Instant</span>
          </div>
        </div>
        <p className="text-sm text-text-muted">100+ cryptocurrencies · lowest fees</p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* ── Selected Currency Bar ── */}
        <AnimatePresence mode="wait">
          {selectedCurrencyInfo !== null && selectedCurrencyInfo !== undefined && (
            <SelectedBar
              currency={selectedCurrencyInfo}
              onClear={() => setShowBrowser(true)}
            />
          )}
        </AnimatePresence>

        {/* ── Recommendation ── */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-neon/8 border border-purple-neon/15">
          <Sparkles className="w-3.5 h-3.5 text-purple-neon flex-shrink-0" />
          <span className="text-xs text-text-secondary">
            <span className="font-semibold text-purple-neon">Tip:</span> LTC or SOL for lowest fees
          </span>
        </div>

        {/* ── Quick Select Pills ── */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Quick Select</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_SELECT.map((currency) => (
              <CurrencyPill
                key={currency.code}
                currency={currency}
                isSelected={selectedCurrency === currency.code}
                onClick={() => void handleSelectCurrency(currency.code)}
                isLoading={validatingCurrency === currency.code}
              />
            ))}
          </div>
        </div>

        {/* ── Error Display ── */}
        <AnimatePresence>
          {currencyError !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-orange-warning/10 border border-orange-warning/20"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 text-orange-warning flex-shrink-0 mt-0.5" />
                <span className="text-sm text-orange-warning">{currencyError.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Browse More Button ── */}
        {!showBrowser && (
          <button
            type="button"
            onClick={() => setShowBrowser(true)}
            className="w-full py-2.5 text-sm font-medium text-cyan-glow hover:text-cyan-glow/80
              border border-dashed border-border-subtle hover:border-cyan-glow/30
              rounded-xl transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow"
          >
            Browse all 100+ cryptocurrencies
          </button>
        )}

        {/* ── Full Currency Browser ── */}
        <AnimatePresence>
          {showBrowser && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-border-subtle bg-bg-secondary/50 backdrop-blur-sm overflow-hidden">
                {/* Search */}
                <div className="p-3 border-b border-border-subtle/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search coin name or symbol..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-9 h-10 bg-bg-tertiary/50 border-border-subtle rounded-xl
                        focus:border-cyan-glow/50 focus:ring-1 focus:ring-cyan-glow/30
                        placeholder:text-text-muted text-sm"
                      aria-label="Search cryptocurrencies"
                    />
                    {searchQuery !== '' && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-muted hover:text-text-primary transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="flex border-b border-border-subtle/50">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium
                          transition-all duration-200 relative
                          ${isActive
                            ? 'text-cyan-glow'
                            : 'text-text-muted hover:text-text-secondary'
                          }
                        `}
                        aria-pressed={isActive}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-cyan-glow"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Currency List */}
                <div className="h-[320px] overflow-y-auto overscroll-contain p-2 space-y-0.5
                  [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-thumb]:bg-border-subtle [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb:hover]:bg-border-accent">
                  
                  {filteredCurrencies.length === 0 && searchQuery !== '' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <div className="relative mb-3">
                        <div className="absolute inset-0 bg-cyan-glow/10 rounded-full blur-2xl" />
                        <Coins className="w-10 h-10 text-text-muted relative" />
                      </div>
                      <p className="text-sm text-text-muted">
                        No results for &quot;<span className="text-cyan-glow font-medium">{searchQuery}</span>&quot;
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-xs text-cyan-glow hover:underline"
                      >
                        Clear search
                      </button>
                    </motion.div>
                  )}

                  {filteredCurrencies.map((currency) => (
                    <CurrencyRow
                      key={currency.code}
                      currency={currency}
                      isSelected={selectedCurrency === currency.code}
                      onClick={() => void handleSelectCurrency(currency.code)}
                      isLoading={validatingCurrency === currency.code}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-border-subtle/50 flex items-center justify-between">
                  <span className="text-[10px] text-text-muted">
                    {filteredCurrencies.length} {filteredCurrencies.length === 1 ? 'coin' : 'coins'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setShowBrowser(false); setSearchQuery(''); }}
                    className="text-[11px] font-medium text-text-muted hover:text-text-primary transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Validation Error ── */}
        <AnimatePresence>
          {errors.payCurrency !== null && errors.payCurrency !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-warning/10 border border-orange-warning/20"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4 text-orange-warning flex-shrink-0" />
              <span className="text-sm text-orange-warning">{errors.payCurrency.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Submit Button ── */}
        <motion.div
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full h-13 text-sm font-semibold rounded-2xl
              bg-cyan-glow text-bg-primary 
              hover:bg-cyan-glow/90 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)]
              active:scale-[0.99]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
              transition-all duration-200
              group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Continue to Payment</span>
                <span className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
              </>
            )}
          </Button>
        </motion.div>

        {/* ── Security Footer ── */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
          <Shield className="w-3 h-3 text-green-success" />
          <span>Secure payment · end-to-end encrypted</span>
        </div>
      </form>
    </div>
  );
}

export type { PaymentMethodFormData, PaymentMethodFormProps };
