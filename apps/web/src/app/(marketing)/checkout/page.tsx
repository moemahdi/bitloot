'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { Badge } from '@/design-system/primitives/badge';
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
  Clock,
  Gift,
  CreditCard,
  Wallet
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { OrdersApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { OrderResponseDto } from '@bitloot/sdk';
import { EmbeddedPaymentUI } from '@/features/checkout/EmbeddedPaymentUI';
import { PaymentMethodForm, type PaymentMethodFormData } from '@/features/checkout/PaymentMethodForm';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [embeddedPayment, setEmbeddedPayment] = useState<EmbeddedPaymentResponse | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

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

  // Create order and embedded payment mutation (no redirect)
  const createOrderMutation = useMutation({
    mutationFn: async (payCurrency: string): Promise<{ order: OrderResponseDto; payment: EmbeddedPaymentResponse }> => {
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
          payCurrency,
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

  const handlePaymentSubmit = async (data: PaymentMethodFormData): Promise<void> => {
    setIsProcessing(true);
    await createOrderMutation.mutateAsync(data.payCurrency);
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
                          
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <Button
                              onClick={() => {
                                setEmail(user.email);
                                setCurrentStep('payment');
                              }}
                              className="w-full h-14 bg-gradient-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan-lg font-bold text-lg transition-all duration-200 group"
                            >
                              Continue to Payment
                              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                          </motion.div>
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
                                className="h-14 pl-12 bg-bg-secondary border-border-subtle text-text-primary text-lg placeholder:text-text-muted focus:border-cyan-glow focus:ring-2 focus:ring-cyan-glow/30 focus:shadow-glow-cyan-sm rounded-xl transition-all duration-200"
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

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <Button
                              type="submit"
                              className="w-full h-14 bg-gradient-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan-lg font-bold text-lg transition-all duration-200 group"
                            >
                              Continue to Payment
                              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                          </motion.div>
                          
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
                  <PaymentMethodForm
                    onSubmit={handlePaymentSubmit}
                    isLoading={isProcessing}
                  />
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
                      whileHover={{ x: 2, borderColor: 'rgba(0, 255, 255, 0.3)' }}
                      transition={{ delay: index * 0.1, duration: 0.2 }}
                      className="flex justify-between items-start gap-3 p-3 rounded-xl bg-bg-tertiary/30 border border-border-subtle/50 hover:bg-bg-tertiary/50 transition-colors cursor-default"
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
                      <p className="text-sm font-bold text-cyan-glow whitespace-nowrap font-mono tracking-tight">
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
                <motion.div 
                  animate={{ boxShadow: ['0 0 20px rgba(0, 255, 255, 0.1)', '0 0 30px rgba(0, 255, 255, 0.2)', '0 0 20px rgba(0, 255, 255, 0.1)'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-cyan-glow/10 to-purple-neon/5 border border-cyan-glow/30"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-text-primary">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold font-mono tracking-tight bg-gradient-to-r from-cyan-glow to-purple-neon bg-clip-text text-transparent">
                        €{subtotal.toFixed(2)}
                      </span>
                      <p className="text-xs text-text-muted mt-0.5">VAT included</p>
                    </div>
                  </div>
                </motion.div>

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
