'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bitcoin,
  Loader2,
  AlertCircle,
  Shield,
  Lock,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Zap,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { OrdersApi, PaymentsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Button } from '@/design-system/primitives/button';
import { RadioGroup, RadioGroupItem } from '@/design-system/primitives/radio-group';
import { Label } from '@/design-system/primitives/label';
import { Badge } from '@/design-system/primitives/badge';
import Link from 'next/link';

// Initialize SDK clients
const ordersClient = new OrdersApi(apiConfig);
const paymentsClient = new PaymentsApi(apiConfig);

// Glass styling constants - matching product page
const GLASS_PANEL = 'bg-[#0A0A0B]/80 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50';
const GLASS_CARD = 'bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all';

// Crypto payment options with icons and details
const CRYPTO_OPTIONS = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    description: 'The original cryptocurrency',
    icon: '₿',
    color: 'from-orange-500 to-amber-500',
    bgGlow: 'hover:shadow-orange-500/20',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    description: 'Fast & widely accepted',
    icon: 'Ξ',
    color: 'from-blue-500 to-purple-500',
    bgGlow: 'hover:shadow-blue-500/20',
  },
  {
    id: 'usdttrc20',
    name: 'Tether',
    symbol: 'USDT',
    description: 'Stable coin (TRC20)',
    icon: '₮',
    color: 'from-emerald-500 to-teal-500',
    bgGlow: 'hover:shadow-emerald-500/20',
  },
  {
    id: 'ltc',
    name: 'Litecoin',
    symbol: 'LTC',
    description: 'Fast & low fees',
    icon: 'Ł',
    color: 'from-gray-400 to-slate-500',
    bgGlow: 'hover:shadow-gray-400/20',
  },
] as const;

type CryptoId = (typeof CRYPTO_OPTIONS)[number]['id'];

export default function CheckoutPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [selectedCrypto, setSelectedCrypto] = useState<CryptoId>('usdttrc20');
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('Order not found');

      const payment = await paymentsClient.paymentsControllerCreate({
        createPaymentDto: {
          orderId: order.id,
          priceAmount: order.total,
          priceCurrency: 'usd',
          payCurrency: selectedCrypto,
          email: order.email,
        },
      });

      return payment;
    },
    onSuccess: (payment) => {
      // Redirect to NOWPayments invoice
      if (payment.invoiceUrl && payment.invoiceUrl.length > 0) {
        window.location.href = payment.invoiceUrl;
      } else {
        toast.error('Payment URL not available. Please try again.');
      }
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

  // Memoize selected crypto details
  const selectedCryptoDetails = useMemo(() => {
    return CRYPTO_OPTIONS.find((c) => c.id === selectedCrypto);
  }, [selectedCrypto]);

  // Loading state
  if (orderLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${GLASS_PANEL} rounded-3xl p-12 text-center max-w-md`}
        >
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/70 text-lg">Loading your order...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (orderError || !order) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${GLASS_PANEL} rounded-3xl p-12 text-center max-w-md`}
        >
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Order Not Found</h2>
          <p className="text-white/60 mb-8">
            We couldn't find this order. It may have expired or doesn't exist.
          </p>
          <Link href="/catalog">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
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
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-6">
            <Lock className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Secure Checkout</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Complete Your Purchase
          </h1>
          <p className="text-white/50 text-lg">
            Select your preferred cryptocurrency to continue
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Payment Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className={`${GLASS_PANEL} rounded-3xl overflow-hidden`}>
              {/* Section Header */}
              <div className="p-6 md:p-8 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                    <CreditCard className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Payment Method</h2>
                    <p className="text-white/50 text-sm">Choose how you'd like to pay</p>
                  </div>
                </div>
              </div>

              {/* Crypto Options */}
              <div className="p-6 md:p-8">
                <RadioGroup
                  value={selectedCrypto}
                  onValueChange={(v) => setSelectedCrypto(v as CryptoId)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {CRYPTO_OPTIONS.map((crypto) => (
                    <motion.div
                      key={crypto.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RadioGroupItem
                        value={crypto.id}
                        id={crypto.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={crypto.id}
                        className={`
                          relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-300
                          ${GLASS_CARD}
                          ${crypto.bgGlow}
                          peer-data-[state=checked]:border-cyan-500/50
                          peer-data-[state=checked]:bg-gradient-to-br peer-data-[state=checked]:from-cyan-500/10 peer-data-[state=checked]:to-blue-500/10
                          peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-cyan-500/10
                        `}
                      >
                        {/* Selected indicator */}
                        <AnimatePresence>
                          {selectedCrypto === crypto.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="absolute top-3 right-3"
                            >
                              <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex items-center gap-4">
                          {/* Crypto Icon */}
                          <div
                            className={`
                            w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold
                            bg-gradient-to-br ${crypto.color}
                          `}
                          >
                            {crypto.icon}
                          </div>

                          {/* Crypto Details */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white">{crypto.name}</p>
                            <p className="text-sm text-white/50">{crypto.description}</p>
                          </div>
                        </div>

                        {/* Symbol badge */}
                        <div className="mt-3">
                          <Badge
                            variant="outline"
                            className="text-xs border-white/10 text-white/70"
                          >
                            {crypto.symbol}
                          </Badge>
                        </div>
                      </Label>
                    </motion.div>
                  ))}
                </RadioGroup>

                {/* Security note */}
                <div className="mt-8 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-emerald-400">Secure Payment</p>
                      <p className="text-xs text-white/50 mt-1">
                        Your payment is processed securely through NOWPayments. We never store
                        your wallet information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`${GLASS_PANEL} rounded-3xl overflow-hidden sticky top-8`}>
              {/* Order Header */}
              <div className="p-6 border-b border-white/5">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  Order Summary
                </h3>
              </div>

              {/* Order Details */}
              <div className="p-6 space-y-4">
                {/* Order ID */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">Order ID</span>
                  <span className="text-white font-mono text-xs bg-white/5 px-2 py-1 rounded">
                    {order.id.slice(0, 8)}...
                  </span>
                </div>

                {/* Email */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">Email</span>
                  <span className="text-white truncate max-w-[150px]">{order.email}</span>
                </div>

                <div className="h-px bg-white/5" />

                {/* Product */}
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="font-medium text-white text-sm mb-1">Digital Product</p>
                  <p className="text-xs text-white/50">Instant delivery via email</p>
                </div>

                <div className="h-px bg-white/5" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      ${Number(order.total).toFixed(2)}
                    </p>
                    {selectedCryptoDetails && (
                      <p className="text-xs text-white/50">
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
                  className="w-full h-14 text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 rounded-xl"
                >
                  {isProcessing || createPaymentMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Pay with {selectedCryptoDetails?.symbol}
                    </>
                  )}
                </Button>

                {/* Payment redirect note */}
                <p className="text-xs text-center text-white/40 mt-4 flex items-center justify-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  You'll be redirected to complete payment
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-white/30 text-sm">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
