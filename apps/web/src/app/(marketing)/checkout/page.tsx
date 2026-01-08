'use client';

import { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { RadioGroup, RadioGroupItem } from '@/design-system/primitives/radio-group';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import { Badge } from '@/design-system/primitives/badge';
import {
  POPULAR_COINS,
  STABLECOINS,
  OTHER_CURRENCIES,
  getCurrencyByCode,
  type CryptoCurrency,
} from '@/config/supported-currencies';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  Loader2, 
  ShoppingBag, 
  Lock, 
  ArrowRight, 
  Sparkles,
  Zap,
  Shield,
  Check,
  Mail,
  CreditCard,
  Wallet,
  Search,
  ChevronDown,
  Clock,
  Gift
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { OrdersApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { OrderResponseDto } from '@bitloot/sdk';
import { EmbeddedPaymentUI } from '@/features/checkout/EmbeddedPaymentUI';

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

// ========== Validation Schema ==========
const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

type CheckoutStep = 'email' | 'payment' | 'paying';

// ========== Crypto Quick Select Options (Popular) ==========
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

// ========== SDK Clients ==========
const ordersClient = new OrdersApi(apiConfig);

// ========== Step Progress Component ==========
function StepProgress({ currentStep }: { currentStep: CheckoutStep }): React.ReactElement {
  const steps = [
    { id: 'email', label: 'Email', icon: Mail, color: 'cyan-glow' },
    { id: 'payment', label: 'Select Crypto', icon: CreditCard, color: 'purple-neon' },
    { id: 'paying', label: 'Pay', icon: Wallet, color: 'green-success' },
  ];
  
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = index < currentIndex;
        
        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`
                relative flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl transition-all duration-300
                ${isActive ? 'bg-gradient-to-r from-cyan-glow/20 to-purple-neon/10 border-2 border-cyan-glow shadow-glow-cyan-sm' : ''}
                ${isCompleted ? 'bg-green-success/10 border-2 border-green-success/50' : ''}
                ${!isActive && !isCompleted ? 'bg-bg-tertiary/50 border border-border-subtle hover:border-border-accent' : ''}
              `}
            >
              {/* Animated glow ring for active step */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-cyan-glow/10"
                  animate={{ opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              
              <div className={`
                relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300
                ${isActive ? 'bg-gradient-to-br from-cyan-glow to-purple-neon text-bg-primary shadow-glow-cyan-sm' : ''}
                ${isCompleted ? 'bg-green-success text-bg-primary' : ''}
                ${!isActive && !isCompleted ? 'bg-bg-secondary text-text-muted border border-border-subtle' : ''}
              `}>
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              
              <span className={`
                hidden sm:inline text-sm font-semibold transition-colors duration-300
                ${isActive ? 'text-cyan-glow' : isCompleted ? 'text-green-success' : 'text-text-muted'}
              `}>
                {step.label}
              </span>
              
              {/* Step number on mobile */}
              <span className={`
                sm:hidden text-xs font-bold
                ${isActive ? 'text-cyan-glow' : isCompleted ? 'text-green-success' : 'text-text-muted'}
              `}>
                {index + 1}
              </span>
            </motion.div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="relative w-6 sm:w-12 h-1 overflow-hidden rounded-full bg-bg-tertiary">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-green-success to-cyan-glow"
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ========== Main Checkout Component ==========
export default function CheckoutPage(): React.ReactElement {
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('email');
  const [email, setEmail] = useState(user?.email ?? '');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoId>('usdttrc20');
  const [isProcessing, setIsProcessing] = useState(false);
  const [embeddedPayment, setEmbeddedPayment] = useState<EmbeddedPaymentResponse | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: user?.email ?? '' },
  });

  // Calculate totals
  const subtotal = total;

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

  // Create order and embedded payment mutation (no redirect)
  const createOrderMutation = useMutation({
    mutationFn: async (): Promise<{ order: OrderResponseDto; payment: EmbeddedPaymentResponse }> => {
      if (items.length === 0) throw new Error('Cart is empty');

      // Build items array for multi-item order support
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      // Step 1: Create order with all items
      const order = await ordersClient.ordersControllerCreate({
        createOrderDto: {
          email,
          items: orderItems,
          captchaToken: '', // TODO: Add Turnstile CAPTCHA
        },
      });

      if (order?.id === undefined || order.id === '') {
        throw new Error('Failed to create order');
      }

      // Step 2: Create embedded payment (no redirect)
      // Use the order total from backend (correctly calculated from all items)
      const response = await fetch(`${apiConfig.basePath}/payments/embedded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          priceAmount: order.total, // Use backend-calculated total
          priceCurrency: 'eur',
          payCurrency: selectedCrypto,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(errorData.message ?? 'Failed to create payment');
      }

      const payment = await response.json() as EmbeddedPaymentResponse;
      return { order, payment };
    },
    onSuccess: ({ order, payment }) => {
      clearCart();
      setCreatedOrderId(order.id);
      setEmbeddedPayment(payment);
      setCurrentStep('paying');
      setIsProcessing(false);
      toast.success('Payment created! Send crypto to the address below.');
    },
    onError: (error: Error) => {
      console.error('Checkout error:', error);
      toast.error(error.message ?? 'Checkout failed. Please try again.');
      setIsProcessing(false);
    },
  });

  // Handlers
  const handleEmailSubmit = (data: EmailFormData): void => {
    setEmail(data.email);
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (): Promise<void> => {
    setIsProcessing(true);
    await createOrderMutation.mutateAsync();
  };

  const handleBack = (): void => {
    if (currentStep === 'payment') {
      setCurrentStep('email');
    } else {
      router.push('/cart');
    }
  };

  // ========== EMPTY CART STATE ==========
  // Only show empty cart if NOT in 'paying' step (cart is cleared after payment created)
  if (items.length === 0 && currentStep !== 'paying') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-glow/5 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-neon/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative glass-strong rounded-3xl p-10 sm:p-14 text-center max-w-md shadow-card-lg border border-border-subtle"
        >
          {/* Decorative glow ring */}
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-cyan-glow/20 via-transparent to-purple-neon/20 -z-10" />
          
          {/* Icon with animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative mx-auto mb-8"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-glow/10 to-purple-neon/10 flex items-center justify-center border border-border-subtle">
              <ShoppingBag className="h-12 w-12 text-text-muted" />
            </div>
            {/* Floating sparkle */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ y: [-2, 2, -2], rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-6 w-6 text-cyan-glow" />
            </motion.div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl font-bold text-text-primary mb-3"
          >
            Your Cart is Empty
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-text-muted mb-8 max-w-xs mx-auto"
          >
            Discover amazing game keys and start filling your cart with instant digital delivery.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/catalog">
              <Button className="h-12 px-8 bg-gradient-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan font-semibold text-base transition-all duration-300 hover:scale-105">
                <Gift className="h-5 w-5 mr-2" />
                Browse Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary glow - top left */}
        <motion.div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-glow/5 rounded-full blur-[120px]"
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Secondary glow - bottom right */}
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-neon/5 rounded-full blur-[100px]"
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_hsl(var(--bg-primary))_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl py-8 md:py-12 px-4">
        {/* Back Button - Enhanced */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/5 transition-all duration-300 group border border-transparent hover:border-cyan-glow/20"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm font-medium">{currentStep === 'email' ? 'Back to Cart' : 'Back'}</span>
          </button>
        </motion.div>

        {/* Header - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-glow/10 to-purple-neon/10 border border-cyan-glow/30 mb-5 shadow-glow-cyan-sm"
          >
            <Lock className="h-4 w-4 text-cyan-glow" />
            <span className="text-sm font-semibold text-cyan-glow">Secure Checkout</span>
            <Shield className="h-4 w-4 text-cyan-glow" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight"
          >
            Complete Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-glow to-purple-neon">
              Purchase
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-text-muted text-sm sm:text-base"
          >
            Fast, secure crypto payments with instant key delivery
          </motion.p>
        </motion.div>

        {/* Step Progress */}
        <StepProgress currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-2"
          >
            <AnimatePresence mode="wait">
              {/* ========== STEP 1: EMAIL ========== */}
              {currentStep === 'email' && (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="relative glass-strong rounded-3xl overflow-hidden shadow-card-lg border border-border-subtle">
                    {/* Gradient border accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-glow via-purple-neon to-cyan-glow" />
                    
                    <div className="p-6 md:p-8 border-b border-border-subtle bg-gradient-to-r from-cyan-glow/5 to-transparent">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-purple-neon/10 flex items-center justify-center border border-cyan-glow/30 shadow-glow-cyan-sm">
                          <Mail className="h-6 w-6 text-cyan-glow" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Delivery Email</h2>
                          <p className="text-sm text-text-muted">We&apos;ll send your game keys here instantly</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 md:p-8">
                      {isAuthenticated && user?.email !== undefined && user.email !== '' ? (
                        // Authenticated user - show email confirmation
                        <div className="space-y-6">
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="p-5 rounded-2xl bg-gradient-to-r from-green-success/10 to-green-success/5 border border-green-success/30 shadow-glow-success"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-green-success/20 flex items-center justify-center border border-green-success/30">
                                <Check className="h-6 w-6 text-green-success" />
                              </div>
                              <div>
                                <p className="font-semibold text-text-primary text-lg">{user.email}</p>
                                <p className="text-xs text-green-success font-medium flex items-center gap-1">
                                  <Shield className="h-3 w-3" /> Verified account
                                </p>
                              </div>
                            </div>
                          </motion.div>
                          
                          <Button
                            onClick={() => {
                              setEmail(user.email);
                              setCurrentStep('payment');
                            }}
                            className="w-full h-14 bg-gradient-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan font-bold text-lg transition-all duration-300 hover:scale-[1.02]"
                          >
                            Continue to Payment
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        // Guest user - email form
                        <form onSubmit={handleSubmit(handleEmailSubmit)} className="space-y-6">
                          <div className="space-y-3">
                            <Label htmlFor="email" className="text-sm font-medium text-text-secondary">
                              Email Address
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none" />
                              <Input
                                type="email"
                                id="email"
                                placeholder="your@email.com"
                                className="h-14 pl-12 bg-bg-secondary border-border-subtle text-text-primary text-lg placeholder:text-text-muted focus:border-cyan-glow/50 focus:ring-2 focus:ring-cyan-glow/20 rounded-xl transition-all duration-200"
                                {...register('email')}
                              />
                            </div>
                            {errors.email !== undefined && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-orange-warning flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-warning" />
                                {errors.email.message}
                              </motion.p>
                            )}
                          </div>

                          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-warning/10 to-orange-warning/5 border border-orange-warning/30">
                            <div className="flex gap-3">
                              <Zap className="h-5 w-5 text-orange-warning flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm text-text-secondary">
                                  <span className="font-bold text-orange-warning">Important:</span> Your purchased keys will be delivered to this email address. Please double-check it&apos;s correct!
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className="w-full h-14 bg-gradient-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan font-bold text-lg transition-all duration-300 hover:scale-[1.02]"
                          >
                            Continue to Payment
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                          
                          {/* Trust indicators */}
                          <div className="flex items-center justify-center gap-6 pt-2">
                            <div className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Lock className="h-3.5 w-3.5" />
                              <span>Encrypted</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Zap className="h-3.5 w-3.5" />
                              <span>Instant delivery</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Clock className="h-3.5 w-3.5" />
                              <span>24/7 support</span>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========== STEP 2: PAYMENT ========== */}
              {currentStep === 'payment' && (
                <motion.div
                  key="payment-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="relative glass-strong rounded-3xl overflow-hidden shadow-card-lg border border-border-subtle">
                    {/* Gradient border accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-neon via-cyan-glow to-purple-neon" />
                    
                    <div className="p-6 md:p-8 border-b border-border-subtle bg-gradient-to-r from-purple-neon/5 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-neon/20 to-cyan-glow/10 flex items-center justify-center border border-purple-neon/30 shadow-glow-purple-sm">
                            <Wallet className="h-6 w-6 text-purple-neon" />
                          </div>
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Select Payment Method</h2>
                            <p className="text-sm text-text-muted">300+ cryptocurrencies supported</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="hidden sm:flex border-purple-neon/30 text-purple-neon gap-1">
                          <Sparkles className="h-3 w-3" /> Crypto Only
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                      {/* Selected Currency Display - Enhanced */}
                      {selectedCryptoDetails != null && (
                        <motion.div 
                          initial={{ scale: 0.98, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={selectedCrypto}
                          className="p-5 rounded-2xl border-2 border-cyan-glow bg-gradient-to-r from-cyan-glow/10 to-purple-neon/5 shadow-glow-cyan-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold bg-gradient-to-br ${selectedCryptoDetails.colorClass} shadow-lg`}>
                                {selectedCryptoDetails.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xl text-text-primary">{selectedCryptoDetails.symbol}</span>
                                  <span className="text-text-muted">{selectedCryptoDetails.name}</span>
                                </div>
                                {selectedCryptoDetails.network != null && (
                                  <p className="text-xs text-text-muted mt-0.5">Network: <span className="text-cyan-glow">{selectedCryptoDetails.network}</span></p>
                                )}
                              </div>
                            </div>
                            <Badge className="bg-green-success/20 text-green-success border-green-success/30 shadow-glow-success">
                              <Check className="h-3 w-3 mr-1" /> Selected
                            </Badge>
                          </div>
                        </motion.div>
                      )}

                      {/* Quick Select - Popular Options - Enhanced */}
                      <div>
                        <Label className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                          <Zap className="h-4 w-4 text-cyan-glow" />
                          Quick Select (Recommended)
                        </Label>
                        <RadioGroup
                          value={selectedCrypto}
                          onValueChange={(v) => setSelectedCrypto(v)}
                          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                        >
                          {QUICK_CRYPTO_OPTIONS.map((crypto, index) => {
                            const isSelected = selectedCrypto === crypto.id;
                            return (
                              <motion.div
                                key={crypto.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.2 }}
                                className={`
                                  relative rounded-2xl p-4 cursor-pointer transition-all duration-300
                                  ${isSelected 
                                    ? `border-2 ${crypto.borderClass} bg-gradient-to-br ${crypto.colorClass}/10 ${crypto.glowClass}` 
                                    : 'border border-border-subtle hover:border-border-accent hover:bg-bg-tertiary/50 bg-bg-tertiary/30'}
                                `}
                                onClick={() => setSelectedCrypto(crypto.id)}
                              >
                                <RadioGroupItem value={crypto.id} id={crypto.id} className="sr-only" />
                                <Label htmlFor={crypto.id} className="cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold bg-gradient-to-br ${crypto.colorClass} shadow-md`}>
                                      {crypto.icon}
                                    </div>
                                    <div>
                                      <p className="font-bold text-text-primary">{crypto.symbol}</p>
                                      <p className="text-[11px] text-text-muted leading-tight">{crypto.network ?? crypto.description}</p>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <motion.div 
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-3 right-3"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-green-success flex items-center justify-center shadow-glow-success">
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    </motion.div>
                                  )}
                                </Label>
                              </motion.div>
                            );
                          })}
                        </RadioGroup>
                      </div>

                      {/* Browse All Currencies - Enhanced */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowAllCurrencies(!showAllCurrencies)}
                          className={`
                            w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300 group
                            ${showAllCurrencies 
                              ? 'border-purple-neon bg-purple-neon/10 shadow-glow-purple-sm' 
                              : 'border-border-subtle hover:border-purple-neon/50 bg-bg-tertiary/30 hover:bg-bg-tertiary/50'}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showAllCurrencies ? 'bg-purple-neon/20' : 'bg-bg-secondary group-hover:bg-purple-neon/10'}`}>
                              <Search className={`h-4 w-4 transition-colors ${showAllCurrencies ? 'text-purple-neon' : 'text-text-muted group-hover:text-purple-neon'}`} />
                            </div>
                            <span className={`text-sm font-medium transition-colors ${showAllCurrencies ? 'text-purple-neon' : 'text-text-secondary group-hover:text-text-primary'}`}>
                              Browse all 300+ cryptocurrencies
                            </span>
                          </div>
                          <motion.div
                            animate={{ rotate: showAllCurrencies ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className={`h-5 w-5 transition-colors ${showAllCurrencies ? 'text-purple-neon' : 'text-text-muted'}`} />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {showAllCurrencies && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 p-5 rounded-2xl border border-border-subtle bg-gradient-to-b from-bg-secondary/80 to-bg-tertiary/50 space-y-4">
                                {/* Search Input - Enhanced */}
                                <div className="relative">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                  <Input
                                    type="text"
                                    placeholder="Search by name, symbol, or network..."
                                    value={currencySearch}
                                    onChange={(e) => setCurrencySearch(e.target.value)}
                                    className="pl-11 h-12 bg-bg-tertiary border-border-subtle focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20 rounded-xl"
                                  />
                                  <Badge variant="outline" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs border-border-subtle">
                                    {totalFilteredResults} found
                                  </Badge>
                                </div>

                                {/* Currency Lists - Enhanced */}
                                <ScrollArea className="h-[320px] pr-4">
                                  <div className="space-y-5">
                                    {/* Popular Coins */}
                                    {filteredCurrencies.popular.length > 0 && (
                                      <div>
                                        <h4 className="mb-3 text-sm font-bold text-cyan-glow flex items-center gap-2 sticky top-0 bg-bg-secondary/90 backdrop-blur-sm py-2 -mt-2 rounded-lg px-2">
                                          <Sparkles className="h-4 w-4" /> Popular Coins
                                          <Badge className="ml-auto bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30">{filteredCurrencies.popular.length}</Badge>
                                        </h4>
                                        <div className="space-y-1.5">
                                          {filteredCurrencies.popular.map((currency) => (
                                            <button
                                              key={currency.code}
                                              type="button"
                                              onClick={() => {
                                                setSelectedCrypto(currency.code);
                                                setShowAllCurrencies(false);
                                              }}
                                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                                                selectedCrypto === currency.code
                                                  ? 'bg-cyan-glow/10 border-2 border-cyan-glow shadow-glow-cyan-sm'
                                                  : 'hover:bg-bg-tertiary border border-transparent hover:border-border-subtle'
                                              }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-glow/20 to-purple-neon/10 flex items-center justify-center text-sm font-bold text-cyan-glow">
                                                  {currency.symbol.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                  <span className="font-bold text-text-primary">{currency.symbol}</span>
                                                  <span className="ml-2 text-xs text-text-muted">{currency.name}</span>
                                                </div>
                                              </div>
                                              {currency.network != null && (
                                                <Badge variant="outline" className="text-[10px] border-border-subtle">{currency.network}</Badge>
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Stablecoins */}
                                    {filteredCurrencies.stablecoins.length > 0 && (
                                      <div>
                                        <h4 className="mb-3 text-sm font-bold text-green-success flex items-center gap-2 sticky top-0 bg-bg-secondary/90 backdrop-blur-sm py-2 -mt-2 rounded-lg px-2">
                                          💵 Stablecoins
                                          <Badge className="ml-auto bg-green-success/10 text-green-success border-green-success/30">{filteredCurrencies.stablecoins.length}</Badge>
                                        </h4>
                                        <div className="space-y-1.5">
                                          {filteredCurrencies.stablecoins.map((currency) => (
                                            <button
                                              key={currency.code}
                                              type="button"
                                              onClick={() => {
                                                setSelectedCrypto(currency.code);
                                                setShowAllCurrencies(false);
                                              }}
                                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                                                selectedCrypto === currency.code
                                                  ? 'bg-green-success/10 border-2 border-green-success shadow-glow-success'
                                                  : 'hover:bg-bg-tertiary border border-transparent hover:border-border-subtle'
                                              }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-success/10 flex items-center justify-center text-sm font-bold text-green-success">
                                                  $
                                                </div>
                                                <div className="text-left">
                                                  <span className="font-bold text-text-primary">{currency.symbol}</span>
                                                  <span className="ml-2 text-xs text-text-muted">{currency.name}</span>
                                                </div>
                                              </div>
                                              {currency.network != null && (
                                                <Badge variant="outline" className="text-[10px] border-border-subtle">{currency.network}</Badge>
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Other Currencies */}
                                    {filteredCurrencies.other.length > 0 && (
                                      <div>
                                        <h4 className="mb-3 text-sm font-bold text-text-secondary flex items-center gap-2 sticky top-0 bg-bg-secondary/90 backdrop-blur-sm py-2 -mt-2 rounded-lg px-2">
                                          🪙 Other Currencies
                                          <Badge className="ml-auto bg-bg-tertiary text-text-muted border-border-subtle">{filteredCurrencies.other.length}</Badge>
                                        </h4>
                                        <div className="space-y-1.5">
                                          {filteredCurrencies.other.map((currency) => (
                                            <button
                                              key={currency.code}
                                              type="button"
                                              onClick={() => {
                                                setSelectedCrypto(currency.code);
                                                setShowAllCurrencies(false);
                                              }}
                                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                                                selectedCrypto === currency.code
                                                  ? 'bg-purple-neon/10 border-2 border-purple-neon shadow-glow-purple-sm'
                                                  : 'hover:bg-bg-tertiary border border-transparent hover:border-border-subtle'
                                              }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-purple-neon/10 flex items-center justify-center text-sm font-bold text-purple-neon">
                                                  {currency.symbol.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                  <span className="font-bold text-text-primary">{currency.symbol}</span>
                                                  <span className="ml-2 text-xs text-text-muted">{currency.name}</span>
                                                </div>
                                              </div>
                                              {currency.network != null && (
                                                <Badge variant="outline" className="text-[10px] border-border-subtle">{currency.network}</Badge>
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {totalFilteredResults === 0 && (
                                      <div className="text-center py-12">
                                        <Search className="h-12 w-12 text-text-muted mx-auto mb-4 opacity-50" />
                                        <p className="text-text-muted font-medium">
                                          No currencies found matching &quot;{currencySearch}&quot;
                                        </p>
                                        <p className="text-xs text-text-muted mt-1">Try a different search term</p>
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* How it works - Enhanced */}
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-glow/10 to-purple-neon/5 border border-cyan-glow/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="h-4 w-4 text-cyan-glow" />
                          <p className="text-sm font-bold text-cyan-glow">How it works</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-cyan-glow/20 flex items-center justify-center text-xs font-bold text-cyan-glow flex-shrink-0">1</div>
                            <p className="text-xs text-text-secondary leading-relaxed">Click &quot;Pay Now&quot; to generate your payment address</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-purple-neon/20 flex items-center justify-center text-xs font-bold text-purple-neon flex-shrink-0">2</div>
                            <p className="text-xs text-text-secondary leading-relaxed">Send the exact amount to the provided address</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-success/20 flex items-center justify-center text-xs font-bold text-green-success flex-shrink-0">3</div>
                            <p className="text-xs text-text-secondary leading-relaxed">Keys delivered instantly after confirmation</p>
                          </div>
                        </div>
                      </div>

                      {/* Pay Button - Enhanced */}
                      <Button
                        onClick={handlePaymentSubmit}
                        disabled={isProcessing}
                        className="w-full h-16 bg-gradient-to-r from-cyan-glow via-purple-neon to-cyan-glow bg-[length:200%_100%] text-bg-primary hover:shadow-glow-cyan font-bold text-lg transition-all duration-500 hover:bg-right disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Creating Payment...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-5 w-5" />
                            Pay €{subtotal.toFixed(2)} with {selectedCryptoDetails?.symbol ?? selectedCrypto.toUpperCase()}
                            <ArrowRight className="ml-3 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========== STEP 3: PAYING (Embedded Payment UI) ========== */}
              {currentStep === 'paying' && embeddedPayment !== null && createdOrderId !== null && (
                <motion.div
                  key="paying-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <EmbeddedPaymentUI
                    orderId={createdOrderId}
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
            </AnimatePresence>
          </motion.div>

          {/* Order Summary Sidebar - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-strong rounded-3xl overflow-hidden sticky top-8 shadow-card-lg border border-border-subtle">
              {/* Gradient Accent */}
              <div className="h-1 bg-gradient-to-r from-cyan-glow via-purple-neon to-cyan-glow" />
              
              <div className="p-6 border-b border-border-subtle bg-gradient-to-r from-cyan-glow/5 to-purple-neon/5">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-glow/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-cyan-glow" />
                  </div>
                  Order Summary
                  <Badge className="ml-auto bg-bg-tertiary text-text-muted border-border-subtle text-xs">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Badge>
                </h3>
              </div>

              <div className="p-6 space-y-5">
                {/* Items - Enhanced */}
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <motion.div 
                      key={item.productId} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-start gap-3 p-3 rounded-xl bg-bg-tertiary/30 border border-border-subtle/50 hover:border-border-subtle transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] border-border-subtle">
                            Qty: {item.quantity}
                          </Badge>
                          <Badge className="text-[10px] bg-green-success/10 text-green-success border-green-success/30">
                            Instant
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-cyan-glow whitespace-nowrap">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

                {/* Email (if set) */}
                {email !== '' && (
                  <>
                    <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-bg-tertiary/20">
                      <span className="text-text-muted flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        Delivery to
                      </span>
                      <span className="text-text-secondary font-medium truncate max-w-[150px]">{email}</span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
                  </>
                )}

                {/* Total - Enhanced */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-glow/10 to-purple-neon/5 border border-cyan-glow/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-text-primary">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold bg-gradient-to-r from-cyan-glow to-purple-neon bg-clip-text text-transparent">
                        €{subtotal.toFixed(2)}
                      </span>
                      <p className="text-xs text-text-muted mt-0.5">VAT included</p>
                    </div>
                  </div>
                </div>

                {/* Trust Signals - Enhanced */}
                <div className="pt-2 space-y-3">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 text-sm p-3 rounded-xl bg-green-success/5 border border-green-success/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-success/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-green-success" />
                    </div>
                    <div>
                      <span className="font-medium text-green-success">Instant delivery</span>
                      <p className="text-xs text-text-muted">Keys delivered within seconds</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-3 text-sm p-3 rounded-xl bg-cyan-glow/5 border border-cyan-glow/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-glow/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-cyan-glow" />
                    </div>
                    <div>
                      <span className="font-medium text-cyan-glow">Secure payment</span>
                      <p className="text-xs text-text-muted">Encrypted with industry standards</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-3 text-sm p-3 rounded-xl bg-purple-neon/5 border border-purple-neon/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-neon/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-purple-neon" />
                    </div>
                    <div>
                      <span className="font-medium text-purple-neon">100% authentic</span>
                      <p className="text-xs text-text-muted">Official licensed keys</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Note - Enhanced */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bg-secondary/50 border border-border-subtle">
            <Lock className="h-3.5 w-3.5 text-text-muted" />
            <p className="text-text-muted text-sm">
              By completing this purchase, you agree to our{' '}
              <a href="/terms" className="text-cyan-glow hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-cyan-glow hover:underline">Privacy Policy</a>
            </p>
          </div>
          
          {/* Payment Trust Badges */}
          <div className="mt-6 flex justify-center items-center gap-6 opacity-60">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Shield className="h-4 w-4" />
              <span>SSL Secured</span>
            </div>
            <div className="w-px h-4 bg-border-subtle" />
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Sparkles className="h-4 w-4" />
              <span>300+ Cryptos</span>
            </div>
            <div className="w-px h-4 bg-border-subtle" />
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Zap className="h-4 w-4" />
              <span>Instant Delivery</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
