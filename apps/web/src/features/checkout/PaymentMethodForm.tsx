'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/design-system/primitives/button';
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
import { Badge } from '@/design-system/primitives/badge';
import {
  POPULAR_COINS,
  STABLECOINS,
  OTHER_CURRENCIES,
  QUICK_SELECT_CURRENCIES,
  getCurrencyByCode,
  type CryptoCurrency,
} from '@/config/supported-currencies';

// Define Zod schema for validation - now accepts any string for flexibility
const paymentMethodSchema = z.object({
  payCurrency: z.string({
    required_error: 'Please select a cryptocurrency',
  }).min(1, 'Please select a cryptocurrency'),
});

export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  onSubmit: (data: PaymentMethodFormData) => Promise<void>;
  isLoading?: boolean;
}

// Currency card component for quick select
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
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-md border-2 p-3 transition-all hover:bg-accent hover:text-accent-foreground ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-muted bg-popover'
      }`}
    >
      <span className="text-sm font-bold">{currency.symbol}</span>
      <span className="text-xs text-muted-foreground">{currency.network ?? currency.name}</span>
    </button>
  );
}

// Currency list item for search results
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
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 transition-all hover:bg-accent ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-muted'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-semibold">{currency.symbol}</span>
        <span className="text-sm text-muted-foreground">{currency.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {currency.network != null && (
          <Badge variant="outline" className="text-xs">
            {currency.network}
          </Badge>
        )}
        <Badge
          variant={
            currency.category === 'popular'
              ? 'default'
              : currency.category === 'stablecoin'
                ? 'secondary'
                : 'outline'
          }
          className="text-xs"
        >
          {currency.category === 'popular'
            ? '⭐ Popular'
            : currency.category === 'stablecoin'
              ? '💵 Stable'
              : 'Crypto'}
        </Badge>
      </div>
    </button>
  );
}

export function PaymentMethodForm({ onSubmit, isLoading = false }: PaymentMethodFormProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      payCurrency: 'usdttrc20', // Default to USDT TRC20 for low fees
    },
  });

  const selectedCurrency = watch('payCurrency');
  const selectedCurrencyInfo = getCurrencyByCode(selectedCurrency);

  // Filter currencies based on search query
  const filteredCurrencies = useMemo(() => {
    if (searchQuery.length === 0) {
      return { popular: POPULAR_COINS, stablecoins: STABLECOINS, other: OTHER_CURRENCIES };
    }

    const query = searchQuery.toLowerCase();
    const filter = (currencies: CryptoCurrency[]) =>
      currencies.filter(
        (c) =>
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.symbol.toLowerCase().includes(query) ||
          (c.network?.toLowerCase().includes(query) ?? false)
      );

    return {
      popular: filter(POPULAR_COINS),
      stablecoins: filter(STABLECOINS),
      other: filter(OTHER_CURRENCIES),
    };
  }, [searchQuery]);

  const totalResults =
    filteredCurrencies.popular.length +
    filteredCurrencies.stablecoins.length +
    filteredCurrencies.other.length;

  const handleSelectCurrency = (code: string) => {
    setValue('payCurrency', code);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Payment Method</CardTitle>
        <CardDescription>
          Choose from 300+ cryptocurrencies. We recommend USDT (TRC20) for lowest fees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-6">
          {/* Selected Currency Display */}
          {selectedCurrencyInfo != null && (
            <div className="rounded-lg border border-primary bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold">{selectedCurrencyInfo.symbol}</span>
                  <span className="ml-2 text-muted-foreground">{selectedCurrencyInfo.name}</span>
                </div>
                <Badge variant="default">Selected</Badge>
              </div>
              {selectedCurrencyInfo.network != null && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Network: {selectedCurrencyInfo.network}
                </p>
              )}
            </div>
          )}

          {/* Quick Select - Popular Options */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Quick Select (Popular)</Label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {QUICK_SELECT_CURRENCIES.map((currency) => (
                <CurrencyCard
                  key={currency.code}
                  currency={currency}
                  isSelected={selectedCurrency === currency.code}
                  onClick={() => handleSelectCurrency(currency.code)}
                />
              ))}
            </div>
          </div>

          {/* Search All Currencies */}
          <div>
            <button
              type="button"
              onClick={() => setShowAllCurrencies(!showAllCurrencies)}
              className="mb-2 flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
              <span>
                {showAllCurrencies ? 'Hide all currencies' : 'Browse all 300+ cryptocurrencies'}
              </span>
              <span>{showAllCurrencies ? '▲' : '▼'}</span>
            </button>

            {showAllCurrencies && (
              <div className="space-y-4 rounded-md border p-4">
                {/* Search Input */}
                <div>
                  <Input
                    type="text"
                    placeholder="Search currencies (e.g., BTC, Bitcoin, Solana...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Found {totalResults} currencies
                  </p>
                </div>

                {/* Currency Lists */}
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {/* Popular Coins */}
                    {filteredCurrencies.popular.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-semibold text-primary">⭐ Popular Coins</h4>
                        <div className="space-y-2">
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
                        <h4 className="mb-2 font-semibold text-green-600">💵 Stablecoins</h4>
                        <div className="space-y-2">
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

                    {/* Other Currencies */}
                    {filteredCurrencies.other.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-semibold text-muted-foreground">
                          🪙 Other Cryptocurrencies ({filteredCurrencies.other.length})
                        </h4>
                        <div className="space-y-2">
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

                    {totalResults === 0 && (
                      <p className="text-center text-muted-foreground">
                        No currencies found matching &quot;{searchQuery}&quot;
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {errors.payCurrency != null && (
            <p className="text-sm text-destructive">{errors.payCurrency.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
