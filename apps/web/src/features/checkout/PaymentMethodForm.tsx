'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Zap,
  AlertCircle,
  Loader2,
  Shield,
  Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import { CryptoIcon } from '@/components/crypto-icons';
import {
  POPULAR_COINS,
  STABLECOINS,
  OTHER_CURRENCIES,
  getCurrencyByCode,
  type CryptoCurrency,
} from '@/config/supported-currencies';

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
}

// ============================================
// QUICK SELECT CURRENCIES (Top 5)
// ============================================

const QUICK_SELECT: CryptoCurrency[] = [
  { code: 'usdttrc20', name: 'Tether', symbol: 'USDT', network: 'TRC20', category: 'stablecoin' },
  { code: 'btc', name: 'Bitcoin', symbol: 'BTC', category: 'popular' },
  { code: 'eth', name: 'Ethereum', symbol: 'ETH', category: 'popular' },
  { code: 'sol', name: 'Solana', symbol: 'SOL', category: 'popular' },
  { code: 'usdc', name: 'USD Coin', symbol: 'USDC', network: 'ETH', category: 'stablecoin' },
];

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Currency Card - For quick select grid
 */
function CurrencyCard({
  currency,
  isSelected,
  onClick,
}: {
  currency: CryptoCurrency;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl
        border transition-all duration-200 min-h-[100px]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
        active:scale-[0.98]
        ${
          isSelected
            ? 'bg-cyan-glow/10 border-cyan-glow shadow-glow-cyan-sm'
            : 'bg-bg-secondary border-border-subtle hover:border-cyan-glow/50 hover:bg-bg-tertiary hover:shadow-glow-cyan-sm'
        }
      `}
      aria-pressed={isSelected}
      aria-label={`Select ${currency.name}${currency.network ? ` on ${currency.network}` : ''}`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-green-success flex items-center justify-center shadow-glow-success">
            <Check className="w-3 h-3 text-bg-primary" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Icon */}
      <CryptoIcon code={currency.code} size={36} className="flex-shrink-0" />

      {/* Symbol */}
      <span
        className={`font-semibold text-sm ${isSelected ? 'text-cyan-glow' : 'text-text-primary'}`}
      >
        {currency.symbol}
      </span>

      {/* Network badge */}
      {currency.network && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-4 bg-bg-tertiary/50 border-border-subtle text-text-muted"
        >
          {currency.network}
        </Badge>
      )}
    </motion.button>
  );
}

/**
 * Currency List Item - For browse all section
 */
function CurrencyListItem({
  currency,
  isSelected,
  onClick,
}: {
  currency: CryptoCurrency;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className={`
        w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-1 focus-visible:ring-offset-bg-secondary
        active:scale-[0.99]
        ${
          isSelected
            ? 'bg-cyan-glow/10 border border-cyan-glow/30 shadow-glow-cyan-sm'
            : 'hover:bg-bg-tertiary hover:border-border-accent border border-transparent'
        }
      `}
      aria-pressed={isSelected}
      aria-label={`Select ${currency.name}${currency.network ? ` on ${currency.network}` : ''}`}
    >
      <div className="flex items-center gap-3">
        <CryptoIcon code={currency.code} size={28} className="flex-shrink-0" />
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium text-sm ${isSelected ? 'text-cyan-glow' : 'text-text-primary'}`}
            >
              {currency.symbol}
            </span>
            {currency.network && (
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 h-4 bg-bg-tertiary/50 border-border-subtle text-text-muted"
              >
                {currency.network}
              </Badge>
            )}
          </div>
          <span className="text-xs text-text-muted">{currency.name}</span>
        </div>
      </div>

      {/* Selected check */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="w-5 h-5 rounded-full bg-green-success flex items-center justify-center shadow-glow-success"
        >
          <Check className="w-3 h-3 text-bg-primary" strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
}

/**
 * Selected Currency Display
 */
function SelectedCurrencyDisplay({ currency }: { currency: CryptoCurrency }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative p-4 rounded-xl bg-gradient-to-br from-cyan-glow/10 via-bg-tertiary to-purple-neon/5 border border-cyan-glow/30 shadow-glow-cyan-sm overflow-hidden"
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-glow/5 via-transparent to-purple-neon/5 animate-gradient-shift" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-glow/20 rounded-full blur-xl animate-glow-pulse" />
            <CryptoIcon code={currency.code} size={48} className="relative z-10" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-success flex items-center justify-center shadow-glow-success z-20"
            >
              <Check className="w-3 h-3 text-bg-primary" strokeWidth={3} />
            </motion.div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold text-cyan-glow text-glow-cyan">
                {currency.symbol}
              </span>
              <Badge className="badge-success text-xs">
                Selected
              </Badge>
            </div>
            <span className="text-text-secondary">{currency.name}</span>
            {currency.network && (
              <span className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow/50" />
                Network: {currency.network}
              </span>
            )}
          </div>
        </div>
        
        {/* Security indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-success/10 border border-green-success/20">
          <Shield className="w-3 h-3 text-green-success" />
          <span className="text-[10px] font-medium text-green-success uppercase tracking-wide">Secure</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Category Section Header
 */
function CategoryHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 px-1 py-2.5 sticky top-0 bg-bg-secondary/95 backdrop-blur-sm z-10 border-b border-border-subtle/50">
      <div className="w-1 h-3 rounded-full bg-gradient-to-b from-cyan-glow to-purple-neon" />
      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {title}
      </span>
      {count !== undefined && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-text-muted border-border-accent">
          {count}
        </Badge>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PaymentMethodForm({
  onSubmit,
  isLoading = false,
  defaultCurrency = 'usdttrc20',
}: PaymentMethodFormProps) {
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);

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

  // Handle currency selection
  const handleSelectCurrency = (code: string) => {
    setValue('payCurrency', code, { shouldValidate: true });
    // Collapse the dropdown after selection
    setShowAllCurrencies(false);
  };

  // Filter currencies based on search query
  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filterFn = (currency: CryptoCurrency) => {
      if (!query) return true;
      return (
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query) ||
        currency.symbol.toLowerCase().includes(query) ||
        (currency.network?.toLowerCase().includes(query) ?? false)
      );
    };

    return {
      popular: POPULAR_COINS.filter(filterFn),
      stablecoins: STABLECOINS.filter(filterFn),
      other: OTHER_CURRENCIES.filter(filterFn),
    };
  }, [searchQuery]);

  const totalResults =
    filteredCurrencies.popular.length +
    filteredCurrencies.stablecoins.length +
    filteredCurrencies.other.length;

  // Handle form submission
  const onFormSubmit = async (data: PaymentMethodFormData) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full border-border-subtle bg-bg-secondary shadow-card-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-xl sm:text-2xl text-text-primary">
              Select Payment Method
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Choose from 100+ supported cryptocurrencies
            </CardDescription>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-glow/10 border border-cyan-glow/20">
            <Zap className="w-3.5 h-3.5 text-cyan-glow" />
            <span className="text-xs font-medium text-cyan-glow">Instant</span>
          </div>
        </div>

        {/* Recommendation badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-neon/10 border border-purple-neon/20">
          <Sparkles className="w-4 h-4 text-purple-neon flex-shrink-0" />
          <span className="text-sm text-text-secondary">
            <span className="font-medium text-purple-neon">Recommended:</span> LTC or SOL for
            lowest network fees
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Selected Currency Display */}
          {selectedCurrencyInfo && <SelectedCurrencyDisplay currency={selectedCurrencyInfo} />}

          {/* Quick Select Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-text-secondary">Quick Select</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {QUICK_SELECT.map((currency) => (
                <CurrencyCard
                  key={currency.code}
                  currency={currency}
                  isSelected={selectedCurrency === currency.code}
                  onClick={() => handleSelectCurrency(currency.code)}
                />
              ))}
            </div>
          </div>

          {/* Browse All Currencies Toggle */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowAllCurrencies(!showAllCurrencies)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl
                border border-border-subtle bg-bg-tertiary/50 
                hover:border-border-accent hover:bg-bg-tertiary
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              aria-expanded={showAllCurrencies}
              aria-controls="all-currencies-section"
            >
              <span className="text-sm font-medium text-text-primary">
                Browse all 100+ cryptocurrencies
              </span>
              {showAllCurrencies ? (
                <ChevronUp className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              )}
            </button>

            {/* Expandable Currency Browser */}
            <AnimatePresence>
              {showAllCurrencies && (
                <motion.div
                  id="all-currencies-section"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-2">
                    {/* Search Input */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <Input
                          type="text"
                          placeholder="Search cryptocurrencies..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 h-11 bg-bg-tertiary border-border-subtle 
                            focus:border-cyan-glow focus:ring-1 focus:ring-cyan-glow
                            placeholder:text-text-muted"
                          aria-label="Search cryptocurrencies"
                        />
                      </div>
                      <p className="text-xs text-text-muted px-1">
                        Found <span className="font-medium text-text-secondary">{totalResults}</span>{' '}
                        currencies
                        {searchQuery && (
                          <span>
                            {' '}
                            matching &quot;<span className="text-cyan-glow">{searchQuery}</span>
                            &quot;
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Currency Lists */}
                    <ScrollArea className="h-[360px] rounded-lg border border-border-subtle bg-bg-tertiary/30">
                      <div className="p-3 space-y-2">
                        {/* No results - Empty State */}
                        {totalResults === 0 && searchQuery && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="empty-state py-12"
                          >
                            <div className="relative">
                              <div className="absolute inset-0 bg-cyan-glow/10 rounded-full blur-2xl" />
                              <Coins className="empty-state-icon relative" />
                            </div>
                            <h3 className="empty-state-title mt-4">No currencies found</h3>
                            <p className="empty-state-description mt-2">
                              No results for &quot;<span className="text-cyan-glow font-medium">{searchQuery}</span>&quot;
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSearchQuery('')}
                              className="mt-4 text-cyan-glow hover:text-pink-featured hover:bg-cyan-glow/10"
                            >
                              Clear search
                            </Button>
                          </motion.div>
                        )}

                        {/* Popular Coins */}
                        {filteredCurrencies.popular.length > 0 && (
                          <div>
                            <CategoryHeader title="Popular Coins" />
                            <div className="space-y-1">
                              {filteredCurrencies.popular.map((currency) => (
                                <CurrencyListItem
                                  key={currency.code}
                                  currency={currency}
                                  isSelected={selectedCurrency === currency.code}
                                  onClick={() => handleSelectCurrency(currency.code)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stablecoins */}
                        {filteredCurrencies.stablecoins.length > 0 && (
                          <div>
                            <CategoryHeader title="Stablecoins" />
                            <div className="space-y-1">
                              {filteredCurrencies.stablecoins.map((currency) => (
                                <CurrencyListItem
                                  key={currency.code}
                                  currency={currency}
                                  isSelected={selectedCurrency === currency.code}
                                  onClick={() => handleSelectCurrency(currency.code)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Other Cryptocurrencies */}
                        {filteredCurrencies.other.length > 0 && (
                          <div>
                            <CategoryHeader
                              title="Other Cryptocurrencies"
                              count={filteredCurrencies.other.length}
                            />
                            <div className="space-y-1">
                              {filteredCurrencies.other.map((currency) => (
                                <CurrencyListItem
                                  key={currency.code}
                                  currency={currency}
                                  isSelected={selectedCurrency === currency.code}
                                  onClick={() => handleSelectCurrency(currency.code)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {errors.payCurrency && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-orange-warning/10 border border-orange-warning/20"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 text-orange-warning flex-shrink-0" />
                <span className="text-sm text-orange-warning">{errors.payCurrency.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.99 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full h-14 text-base font-semibold
                bg-cyan-glow text-bg-primary 
                hover:bg-cyan-glow/90 hover:shadow-glow-cyan-lg
                active:scale-[0.99]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                transition-all duration-200
                group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin-glow" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 group-hover:animate-bounce-subtle" />
                  <span>Continue to Payment</span>
                  <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                </>
              )}
            </Button>
          </motion.div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
            <Shield className="w-3.5 h-3.5 text-green-success" />
            <span>
              Secure payment powered by{' '}
              <span className="text-text-secondary font-medium">NOWPayments</span>
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export type { PaymentMethodFormData, PaymentMethodFormProps };
