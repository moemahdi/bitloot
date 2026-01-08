'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  Shield,
  Lock,
  ArrowLeft,
  Sparkles,
  Zap,
  CreditCard,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { OrdersApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Button } from '@/design-system/primitives/button';
import { RadioGroup, RadioGroupItem } from '@/design-system/primitives/radio-group';
import { Label } from '@/design-system/primitives/label';
import { Badge } from '@/design-system/primitives/badge';
import { Input } from '@/design-system/primitives/input';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import Link from 'next/link';
import { EmbeddedPaymentUI } from '@/features/checkout/EmbeddedPaymentUI';
import {
  POPULAR_COINS,
  STABLECOINS,
  OTHER_CURRENCIES,
  getCurrencyByCode,
  type CryptoCurrency,
} from '@/config/supported-currencies';

// Initialize SDK clients
const ordersClient = new OrdersApi(apiConfig);

// Interface for embedded payment response
interface EmbeddedPaymentResponse {
  paymentId: number;
  externalId: string;
  orderId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  priceCurrency: string;
  status: string;
  expiresAt: string;
  qrCodeData: string;
  estimatedTime: string;
}

// Quick select crypto options (6 popular choices)
const QUICK_CRYPTO_OPTIONS = [
  {
    id: 'usdttrc20',
    name: 'Tether',
    symbol: 'USDT',
    network: 'TRC20',
    description: 'Stablecoin • Lowest fees',
    icon: '₮',
    colorClass: 'from-green-success to-cyan-glow',
    glowClass: 'shadow-glow-success',
    borderClass: 'border-green-success',
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    description: 'Most secure & widely used',
    icon: '₿',
    colorClass: 'from-orange-500 to-amber-500',
    glowClass: 'shadow-glow-error',
    borderClass: 'border-orange-500',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    description: 'Fast transactions',
    icon: 'Ξ',
    colorClass: 'from-purple-neon to-cyan-glow',
    glowClass: 'shadow-glow-purple-sm',
    borderClass: 'border-purple-neon',
  },
  {
    id: 'ltc',
    name: 'Litecoin',
    symbol: 'LTC',
    description: 'Fast & low fees',
    icon: 'Ł',
    colorClass: 'from-text-secondary to-text-muted',
    glowClass: 'shadow-glow-cyan-sm',
    borderClass: 'border-text-secondary',
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    description: 'Ultra fast • Low fees',
    icon: '◎',
    colorClass: 'from-purple-500 to-green-400',
    glowClass: 'shadow-glow-purple-sm',
    borderClass: 'border-purple-500',
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'ERC20',
    description: 'Stablecoin',
    icon: '$',
    colorClass: 'from-blue-500 to-cyan-400',
    glowClass: 'shadow-glow-cyan-sm',
    borderClass: 'border-blue-500',
  },
];

// Type for selected crypto - now accepts any string for 300+ currencies
type CryptoId = string;

// Step type for the checkout flow
type CheckoutStep = 'select' | 'paying';

export default function CheckoutPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [selectedCrypto, setSelectedCrypto] = useState<CryptoId>('usdttrc20');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('select');
  const [embeddedPayment, setEmbeddedPayment] = useState<EmbeddedPaymentResponse | null>(null);
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  // Fetch order details using public checkout endpoint (no JWT required)
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await ordersClient.ordersControllerGetForCheckout({ id: orderId });
      return response;
    },
    enabled: Boolean(orderId),
    retry: 2,
  });

  // Redirect if order is not pending (already paid, fulfilled, or failed)
  useEffect(() => {
    if (order !== undefined && order !== null) {
      const status = order.status;
      // Only allow payment for pending orders
      if (status !== 'pending') {
        // Redirect to appropriate page based on status
        if (status === 'fulfilled') {
          router.replace(`/orders/${orderId}/success`);
        } else if (status === 'paid' || status === 'confirming') {
          router.replace(`/orders/${orderId}`);
        } else {
          // For failed, expired, etc - let them retry on orders page
          router.replace(`/orders/${orderId}`);
        }
      }
    }
  }, [order, orderId, router]);

  // Create embedded payment mutation (no redirect)
  const createPaymentMutation = useMutation({
    mutationFn: async (): Promise<EmbeddedPaymentResponse> => {
      if (order === null || order === undefined) throw new Error('Order not found');

      // Call embedded payment endpoint directly
      const response = await fetch(`${apiConfig.basePath}/payments/embedded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          priceAmount: order.total,
          priceCurrency: 'usd',
          payCurrency: selectedCrypto,
          email: order.email,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(errorData.message ?? 'Failed to create payment');
      }

      return response.json() as Promise<EmbeddedPaymentResponse>;
    },
    onSuccess: (payment) => {
      // Show embedded payment UI instead of redirecting
      setEmbeddedPayment(payment);
      setStep('paying');
      setIsProcessing(false);
      toast.success('Payment created! Send crypto to the address below.');
    },
    onError: (error) => {
      console.error('Payment creation failed:', error);
      toast.error('Failed to create payment. Please try again.');
      setIsProcessing(false);
    },
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    await createPaymentMutation.mutateAsync();
  };

  // Get selected crypto details - check quick options first, then full currency list
  const selectedCryptoDetails = useMemo(() => {
    const quickOption = QUICK_CRYPTO_OPTIONS.find((c) => c.id === selectedCrypto);
    if (quickOption !== undefined) return quickOption;

    // Fallback to full currency list
    const currency = getCurrencyByCode(selectedCrypto);
    if (currency !== undefined) {
      return {
        id: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        network: currency.network,
        description: currency.network ?? currency.category,
        icon: currency.symbol.charAt(0),
        colorClass: 'from-cyan-glow to-purple-neon',
        glowClass: 'shadow-glow-cyan-sm',
        borderClass: 'border-cyan-glow',
      };
    }
    return null;
  }, [selectedCrypto]);

  // Filter currencies based on search
  const filteredCurrencies = useMemo(() => {
    if (currencySearch.length === 0) {
      return { popular: POPULAR_COINS, stablecoins: STABLECOINS, other: OTHER_CURRENCIES };
    }

    const query = currencySearch.toLowerCase();
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
  }, [currencySearch]);

  const totalFilteredResults =
    filteredCurrencies.popular.length +
    filteredCurrencies.stablecoins.length +
    filteredCurrencies.other.length;

  // Loading state
  if (orderLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-3xl p-12 text-center max-w-md shadow-glow-cyan-sm"
        >
          <Loader2 className="h-12 w-12 animate-spin-glow text-cyan-glow mx-auto mb-4" />
          <p className="text-text-secondary text-lg">Loading your order...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (orderError !== null || order === null || order === undefined) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-12 text-center max-w-md shadow-glow-error"
        >
          <AlertCircle className="h-16 w-16 text-orange-warning mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-text-primary mb-3">Order Not Found</h2>
          <p className="text-text-secondary mb-8">
            We couldn&apos;t find this order. It may have expired or doesn&apos;t exist.
          </p>
          <Link href="/catalog">
            <Button className="bg-cyan-glow text-bg-primary hover:shadow-glow-cyan font-semibold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-glow/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-neon/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl py-8 md:py-12 px-4">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-text-muted hover:text-cyan-glow transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 mb-6">
            <Lock className="h-4 w-4 text-cyan-glow" />
            <span className="text-sm font-medium text-cyan-glow">Secure Checkout</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Complete Your Purchase
          </h1>
          <p className="text-text-muted text-lg">
            Select your preferred cryptocurrency to continue
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Embedded Payment UI - shown after payment is created */}
          {step === 'paying' && embeddedPayment !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3"
            >
              <EmbeddedPaymentUI
                orderId={orderId}
                paymentId={String(embeddedPayment.paymentId)}
                payAddress={embeddedPayment.payAddress}
                payAmount={embeddedPayment.payAmount}
                payCurrency={embeddedPayment.payCurrency}
                priceAmount={embeddedPayment.priceAmount}
                priceCurrency={embeddedPayment.priceCurrency}
                expiresAt={embeddedPayment.expiresAt}
                qrCodeData={embeddedPayment.qrCodeData}
                estimatedTime={embeddedPayment.estimatedTime}
              />
            </motion.div>
          )}

          {/* Main Payment Selection - only shown during crypto selection */}
          {step === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="glass-strong rounded-3xl overflow-hidden shadow-card-lg">
              {/* Section Header */}
              <div className="p-6 md:p-8 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-cyan-glow/10 border border-cyan-glow/30">
                    <CreditCard className="h-6 w-6 text-cyan-glow" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">Payment Method</h2>
                    <p className="text-text-muted text-sm">300+ cryptocurrencies supported</p>
                  </div>
                </div>
              </div>

              {/* Crypto Options */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Selected Currency Display */}
                {selectedCryptoDetails != null && (
                  <div className="p-4 rounded-xl border-2 border-cyan-glow bg-cyan-glow/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold bg-gradient-to-br ${selectedCryptoDetails.colorClass}`}>
                          {selectedCryptoDetails.icon}
                        </div>
                        <div>
                          <span className="font-bold text-text-primary">{selectedCryptoDetails.symbol}</span>
                          <span className="ml-2 text-text-muted">{selectedCryptoDetails.name}</span>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-success">Selected</Badge>
                    </div>
                    {selectedCryptoDetails.network != null && (
                      <p className="mt-2 text-xs text-text-muted">Network: {selectedCryptoDetails.network}</p>
                    )}
                  </div>
                )}

                {/* Quick Select - Popular Options */}
                <div>
                  <Label className="mb-3 block text-sm font-medium text-text-secondary">Quick Select (Recommended)</Label>
                  <RadioGroup
                    value={selectedCrypto}
                    onValueChange={(v) => setSelectedCrypto(v)}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {QUICK_CRYPTO_OPTIONS.map((crypto) => {
                      const isSelected = selectedCrypto === crypto.id;
                      return (
                        <div
                          key={crypto.id}
                          className={`
                            relative rounded-xl p-3 cursor-pointer transition-all duration-300
                            ${isSelected 
                              ? `border-2 ${crypto.borderClass} bg-gradient-to-br ${crypto.colorClass}/10 ${crypto.glowClass}` 
                              : 'border border-border-subtle hover:border-border-accent bg-bg-tertiary/30'}
                          `}
                          onClick={() => setSelectedCrypto(crypto.id)}
                        >
                          <RadioGroupItem value={crypto.id} id={`resume-${crypto.id}`} className="sr-only" />
                          <Label htmlFor={`resume-${crypto.id}`} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold bg-gradient-to-br ${crypto.colorClass}`}>
                                {crypto.icon}
                              </div>
                              <div>
                                <p className="font-semibold text-text-primary text-sm">{crypto.symbol}</p>
                                <p className="text-[10px] text-text-muted">{crypto.network ?? crypto.description}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <div className="w-4 h-4 rounded-full bg-green-success flex items-center justify-center">
                                  <Check className="h-2.5 w-2.5 text-white" />
                                </div>
                              </div>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                {/* Browse All Currencies */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAllCurrencies(!showAllCurrencies)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border-subtle hover:border-border-accent bg-bg-tertiary/30 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-text-muted" />
                      <span className="text-sm text-text-secondary">Browse all 300+ cryptocurrencies</span>
                    </div>
                    {showAllCurrencies ? (
                      <ChevronUp className="h-4 w-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    )}
                  </button>

                  {showAllCurrencies && (
                    <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-bg-secondary/50 space-y-4">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <Input
                          type="text"
                          placeholder="Search by name, symbol, or network..."
                          value={currencySearch}
                          onChange={(e) => setCurrencySearch(e.target.value)}
                          className="pl-10 h-10 bg-bg-tertiary border-border-primary"
                        />
                        <p className="mt-1 text-xs text-text-muted">{totalFilteredResults} currencies found</p>
                      </div>

                      {/* Currency Lists */}
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                          {/* Popular Coins */}
                          {filteredCurrencies.popular.length > 0 && (
                            <div>
                              <h4 className="mb-2 text-sm font-semibold text-cyan-glow flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5" /> Popular Coins
                              </h4>
                              <div className="space-y-1">
                                {filteredCurrencies.popular.map((currency) => (
                                  <button
                                    key={currency.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCrypto(currency.code);
                                      setShowAllCurrencies(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                                      selectedCrypto === currency.code
                                        ? 'bg-cyan-glow/10 border border-cyan-glow'
                                        : 'hover:bg-bg-tertiary border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-text-primary">{currency.symbol}</span>
                                      <span className="text-xs text-text-muted">{currency.name}</span>
                                    </div>
                                    {currency.network != null && (
                                      <Badge variant="outline" className="text-[10px]">{currency.network}</Badge>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Stablecoins */}
                          {filteredCurrencies.stablecoins.length > 0 && (
                            <div>
                              <h4 className="mb-2 text-sm font-semibold text-green-success flex items-center gap-2">
                                💵 Stablecoins ({filteredCurrencies.stablecoins.length})
                              </h4>
                              <div className="space-y-1">
                                {filteredCurrencies.stablecoins.map((currency) => (
                                  <button
                                    key={currency.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCrypto(currency.code);
                                      setShowAllCurrencies(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                                      selectedCrypto === currency.code
                                        ? 'bg-green-success/10 border border-green-success'
                                        : 'hover:bg-bg-tertiary border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-text-primary">{currency.symbol}</span>
                                      <span className="text-xs text-text-muted">{currency.name}</span>
                                    </div>
                                    {currency.network != null && (
                                      <Badge variant="outline" className="text-[10px]">{currency.network}</Badge>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Other Currencies */}
                          {filteredCurrencies.other.length > 0 && (
                            <div>
                              <h4 className="mb-2 text-sm font-semibold text-text-muted">
                                🪙 Other ({filteredCurrencies.other.length})
                              </h4>
                              <div className="space-y-1">
                                {filteredCurrencies.other.map((currency) => (
                                  <button
                                    key={currency.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCrypto(currency.code);
                                      setShowAllCurrencies(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                                      selectedCrypto === currency.code
                                        ? 'bg-purple-neon/10 border border-purple-neon'
                                        : 'hover:bg-bg-tertiary border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-text-primary">{currency.symbol}</span>
                                      <span className="text-xs text-text-muted">{currency.name}</span>
                                    </div>
                                    {currency.network != null && (
                                      <Badge variant="outline" className="text-[10px]">{currency.network}</Badge>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {totalFilteredResults === 0 && (
                            <p className="text-center text-text-muted py-8">
                              No currencies found matching &quot;{currencySearch}&quot;
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                {/* Security note */}
                <div className="p-4 rounded-xl bg-green-success/5 border border-green-success/20">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-success mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-success">Secure Payment</p>
                      <p className="text-xs text-text-muted mt-1">
                        Your payment is processed securely through NOWPayments. We never store
                        your wallet information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          )}

          {/* Order Summary Sidebar - only shown during crypto selection */}
          {step === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-strong rounded-3xl overflow-hidden sticky top-8 shadow-card-lg">
              {/* Order Header */}
              <div className="p-6 border-b border-border-subtle">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-glow" />
                  Order Summary
                </h3>
              </div>

              {/* Order Details */}
              <div className="p-6 space-y-4">
                {/* Order ID */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Order ID</span>
                  <span className="text-text-primary font-mono text-xs bg-bg-tertiary px-2 py-1 rounded">
                    {order.id.slice(0, 8)}...
                  </span>
                </div>

                {/* Email */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Email</span>
                  <span className="text-text-primary truncate max-w-[150px]">{order.email}</span>
                </div>

                <div className="h-px bg-border-subtle" />

                {/* Product */}
                <div className="p-3 rounded-xl bg-bg-tertiary">
                  <p className="font-medium text-text-primary text-sm mb-1">Digital Product</p>
                  <p className="text-xs text-text-muted">Instant delivery via email</p>
                </div>

                <div className="h-px bg-border-subtle" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-text-primary">
                      ${Number(order.total).toFixed(2)}
                    </p>
                    {selectedCryptoDetails != null && (
                      <p className="text-xs text-text-muted">
                        Pay with {selectedCryptoDetails.symbol}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <div className="p-6 pt-0">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || createPaymentMutation.isPending}
                  className="w-full h-14 text-base font-bold bg-cyan-glow text-bg-primary hover:shadow-glow-cyan active:scale-[0.98] transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing || createPaymentMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Pay with {selectedCryptoDetails?.symbol ?? selectedCrypto.toUpperCase()}
                    </>
                  )}
                </Button>

                {/* Payment note - no redirect now! */}
                <p className="text-xs text-center text-text-muted mt-4 flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3" />
                  Secure payment on our platform
                </p>
              </div>
            </div>
          </motion.div>
          )}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-text-muted text-sm">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
