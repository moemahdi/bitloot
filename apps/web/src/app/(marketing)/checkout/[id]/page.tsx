'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  AlertCircle,
  Shield,
  Lock,
  ChevronLeft,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  Package,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Mail,
  Check,
  CreditCard,
  Copy,
  Sparkles,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { OrdersApi, PaymentsApi } from '@bitloot/sdk';
import type { EmbeddedPaymentResponseDto, OrderItemResponseDto } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import Link from 'next/link';
import { EmbeddedPaymentUI } from '@/features/checkout/EmbeddedPaymentUI';
import { PaymentMethodForm, type PaymentMethodFormData } from '@/features/checkout/PaymentMethodForm';
import { useAuth } from '@/hooks/useAuth';

// Initialize SDK clients
const ordersClient = new OrdersApi(apiConfig);
const paymentsClient = new PaymentsApi(apiConfig);

// Email validation schema
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

// Step type for checkout flow
type CheckoutStep = 'email' | 'payment' | 'paying';

// Order status type
type OrderStatus = 'pending' | 'confirming' | 'paid' | 'fulfilled' | 'failed' | 'expired' | 'underpaid';

// Group order items by productId to show combined quantity
interface GroupedOrderItem {
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: string;
  totalPrice: number;
}

const groupOrderItems = (items: OrderItemResponseDto[] | undefined): GroupedOrderItem[] => {
  if (items === undefined || items.length === 0) return [];
  
  const grouped = new Map<string, GroupedOrderItem>();
  
  for (const item of items) {
    const existing = grouped.get(item.productId);
    const itemPrice = Number(item.unitPrice ?? 0);
    if (existing !== undefined) {
      existing.quantity += 1;
      existing.totalPrice += itemPrice;
    } else {
      grouped.set(item.productId, {
        productId: item.productId,
        productTitle: item.productTitle,
        quantity: 1,
        unitPrice: item.unitPrice ?? '0.00',
        totalPrice: itemPrice,
      });
    }
  }
  
  return Array.from(grouped.values());
};

// Step Progress component
function StepProgress({ currentStep }: { currentStep: CheckoutStep }): React.ReactElement {
  const steps = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'paying', label: 'Complete', icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex items-center justify-center gap-2 mb-10"
    >
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <motion.div
              animate={{
                scale: isActive ? 1.1 : 1,
                backgroundColor: isComplete || isActive ? 'hsl(var(--cyan-glow))' : 'transparent',
              }}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                isActive
                  ? 'border-cyan-glow text-bg-primary shadow-glow-cyan'
                  : isComplete
                    ? 'border-cyan-glow text-bg-primary'
                    : 'border-border-muted text-text-muted'
              }`}
            >
              {isComplete ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeStep"
                  className="absolute inset-0 rounded-full border-2 border-cyan-glow"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>

            {index < steps.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-1 transition-all duration-300 ${
                  isComplete ? 'bg-cyan-glow' : 'bg-border-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

// Loading skeleton
function CheckoutSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-glow/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-neon/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative glass-strong rounded-3xl p-10 text-center shadow-card-lg border border-border-subtle"
      >
        <Loader2 className="h-12 w-12 text-cyan-glow animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Loading checkout...</p>
      </motion.div>
    </div>
  );
}

// Status-aware card for non-payable states
function OrderStatusCard({
  status,
  orderId,
}: {
  status: OrderStatus;
  orderId: string;
}): React.ReactElement {
  const getStatusConfig = () => {
    switch (status) {
      case 'confirming':
        return {
          icon: Timer,
          iconClass: 'text-orange-warning',
          bgClass: 'from-orange-warning/20 to-orange-warning/10',
          borderClass: 'border-orange-warning/30',
          title: 'Payment Confirming',
          subtitle: 'Your payment is being confirmed on the blockchain',
          message: 'This usually takes a few minutes. You can safely close this page.',
        };
      case 'paid':
        return {
          icon: Package,
          iconClass: 'text-cyan-glow',
          bgClass: 'from-cyan-glow/20 to-cyan-glow/10',
          borderClass: 'border-cyan-glow/30',
          title: 'Payment Confirmed!',
          subtitle: 'Preparing your keys for delivery',
          message: 'Your order is being processed. Keys will be delivered shortly.',
        };
      case 'failed':
        return {
          icon: XCircle,
          iconClass: 'text-red-error',
          bgClass: 'from-red-error/20 to-red-error/10',
          borderClass: 'border-red-error/30',
          title: 'Payment Failed',
          subtitle: 'There was an issue with your payment',
          message: 'Please try creating a new order or contact support.',
        };
      case 'expired':
        return {
          icon: Clock,
          iconClass: 'text-orange-warning',
          bgClass: 'from-orange-warning/20 to-orange-warning/10',
          borderClass: 'border-orange-warning/30',
          title: 'Payment Window Expired',
          subtitle: 'The 1-hour payment window has closed',
          message: 'No funds were charged. Create a new order and complete payment within the time limit.',
        };
      case 'underpaid':
        return {
          icon: AlertCircle,
          iconClass: 'text-orange-warning',
          bgClass: 'from-orange-warning/20 to-orange-warning/10',
          borderClass: 'border-orange-warning/30',
          title: 'Underpaid Order',
          subtitle: 'Insufficient payment received',
          message: 'Please contact support for assistance with this order.',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return <></>;

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative glass-strong rounded-3xl overflow-hidden shadow-card-lg border ${config.borderClass}`}
    >
      <div className={`absolute inset-0 bg-linear-to-br ${config.bgClass} opacity-50`} />
      <div className="relative p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={`w-20 h-20 rounded-2xl bg-linear-to-br ${config.bgClass} flex items-center justify-center mx-auto mb-6 border ${config.borderClass}`}
        >
          <Icon className={`h-10 w-10 ${config.iconClass}`} />
        </motion.div>

        <h2 className="text-2xl font-bold text-text-primary mb-2">{config.title}</h2>
        <p className={`text-sm ${config.iconClass} font-medium mb-4`}>{config.subtitle}</p>
        <p className="text-text-muted mb-6">{config.message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/orders/${orderId}`}>
            <Button variant="outline" className="border-border-subtle hover:border-cyan-glow/50">
              View Order Status
            </Button>
          </Link>
          {(status === 'failed' || status === 'expired') && (
            <Link href="/catalog">
              <Button className="bg-linear-to-r from-cyan-glow to-purple-neon text-bg-primary">
                Browse Products
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CheckoutPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  // Auth context
  const { isAuthenticated, user } = useAuth();

  // State
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('email');
  const [email, setEmail] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [embeddedPayment, setEmbeddedPayment] = useState<EmbeddedPaymentResponseDto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Fetch order details
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
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 5s while confirming or paid (waiting for fulfillment)
      if (data?.status === 'confirming' || data?.status === 'paid') {
        return 5000;
      }
      return false;
    },
  });

  // Auto-redirect on fulfilled and set email from order
  useEffect(() => {
    if (order) {
      // Redirect to success when fulfilled
      if (order.status === 'fulfilled') {
        router.replace(`/orders/${orderId}/success`);
        return;
      }

      // Set email from order if available (skip placeholder emails)
      const orderEmail = order.email;
      if (orderEmail !== undefined && orderEmail !== '' && !orderEmail.includes('pending@checkout')) {
        setEmail(orderEmail);
        // Skip email step if order already has real email
        if (currentStep === 'email') {
          setCurrentStep('payment');
        }
      }
    }
  }, [order, orderId, router, currentStep]);

  // Create embedded payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (payCurrency: string): Promise<EmbeddedPaymentResponseDto> => {
      // Get the order total for payment creation
      if (!order) {
        throw new Error('Order not found');
      }
      const response = await paymentsClient.paymentsControllerCreateEmbedded({
        createPaymentDto: {
          orderId,
          email: email !== '' ? email : 'customer@checkout.bitloot.io',
          priceAmount: order.total,
          priceCurrency: 'USD',
          payCurrency,
        },
      });
      return response;
    },
    onSuccess: (data) => {
      setEmbeddedPayment(data);
      setIsProcessing(false);
      setCurrentStep('paying');
      toast.success('Payment created! Send crypto to complete your order.');
    },
    onError: (error: unknown) => {
      setIsProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
      toast.error(errorMessage);
    },
  });

  // Handlers
  const handleEmailSubmit = (data: EmailFormData): void => {
    setEmail(data.email);
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (data: PaymentMethodFormData): Promise<void> => {
    setIsProcessing(true);
    await createPaymentMutation.mutateAsync(data.payCurrency);
  };

  const handleBack = (): void => {
    if (currentStep === 'payment') {
      // Only go back to email if order doesn't have a real email yet
      const orderEmail = order?.email;
      const hasRealEmail = orderEmail !== undefined && orderEmail !== '' && !orderEmail.includes('pending@checkout');
      if (!hasRealEmail) {
        setCurrentStep('email');
      } else {
        router.push(`/orders/${orderId}`);
      }
    } else {
      router.push(`/orders/${orderId}`);
    }
  };

  // Loading state
  if (orderLoading) {
    return <CheckoutSkeleton />;
  }

  // Error state
  if (orderError || !order) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-error/5 rounded-full blur-[100px] animate-pulse" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative glass-strong rounded-3xl p-10 text-center max-w-md shadow-card-lg border border-red-error/30"
        >
          <div className="w-20 h-20 rounded-2xl bg-red-error/10 flex items-center justify-center mx-auto mb-6 border border-red-error/30">
            <AlertCircle className="h-10 w-10 text-red-error" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Order Not Found</h2>
          <p className="text-text-muted mb-6">
            We couldn&apos;t find this order. It may have expired or the link is invalid.
          </p>
          <Link href="/catalog">
            <Button className="bg-linear-to-r from-cyan-glow to-purple-neon text-bg-primary">
              Browse Products
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Get order status
  const orderStatus = order.status as OrderStatus;

  // Handle non-payable statuses
  if (['confirming', 'paid', 'failed', 'expired', 'underpaid'].includes(orderStatus)) {
    return (
      <div className="min-h-screen bg-bg-primary relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-glow/5 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-neon/5 rounded-full blur-[80px] animate-pulse" />
        </div>
        <div className="relative z-10 container mx-auto max-w-2xl py-12 px-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
            <Link href={`/orders/${orderId}`}>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/5 transition-all duration-300 group">
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Order</span>
              </button>
            </Link>
          </motion.div>
          <OrderStatusCard status={orderStatus} orderId={orderId} />
        </div>
      </div>
    );
  }

  // Main checkout flow for pending orders
  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-glow/5 rounded-full blur-[120px]"
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-neon/5 rounded-full blur-[100px]"
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,_hsl(var(--bg-primary))_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl py-8 md:py-12 px-4">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/5 transition-all duration-300 group border border-transparent hover:border-cyan-glow/20"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm font-medium">Back to Order</span>
          </button>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-cyan-glow/10 to-purple-neon/10 border border-cyan-glow/30 mb-5 shadow-glow-cyan-sm"
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
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-glow to-purple-neon">
              Payment
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-text-muted text-sm sm:text-base"
          >
            Fast, secure crypto payments with instant product delivery
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
                    <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-cyan-glow via-purple-neon to-cyan-glow" />

                    <div className="p-6 md:p-8 border-b border-border-subtle bg-linear-to-r from-cyan-glow/5 to-transparent">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-glow/20 to-purple-neon/10 flex items-center justify-center border border-cyan-glow/30 shadow-glow-cyan-sm">
                          <Mail className="h-6 w-6 text-cyan-glow" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                            Delivery Email
                          </h2>
                          <p className="text-sm text-text-muted">We&apos;ll send your products here instantly</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 md:p-8">
                      {isAuthenticated && user?.email ? (
                        <div className="space-y-6">
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="p-5 rounded-2xl bg-linear-to-r from-green-success/10 to-green-success/5 border border-green-success/30 shadow-glow-success"
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

                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              onClick={() => {
                                setEmail(user.email);
                                setCurrentStep('payment');
                              }}
                              className="w-full h-14 bg-linear-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan-lg font-bold text-lg transition-all duration-200 group"
                            >
                              Continue to Payment
                              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                          </motion.div>
                        </div>
                      ) : (
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
                            {errors.email && (
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

                          <div className="p-4 rounded-xl bg-linear-to-r from-orange-warning/10 to-orange-warning/5 border border-orange-warning/30">
                            <div className="flex gap-3">
                              <Zap className="h-5 w-5 text-orange-warning shrink-0 mt-0.5" />
                              <p className="text-sm text-text-secondary">
                                <span className="font-bold text-orange-warning">Important:</span> Your purchased products
                                will be delivered to this email address.
                              </p>
                            </div>
                          </div>

                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              type="submit"
                              className="w-full h-14 bg-linear-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan-lg font-bold text-lg transition-all duration-200 group"
                            >
                              Continue to Payment
                              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                          </motion.div>

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
                  <PaymentMethodForm onSubmit={handlePaymentSubmit} isLoading={isProcessing} />
                </motion.div>
              )}

              {/* ========== STEP 3: PAYING ========== */}
              {currentStep === 'paying' && embeddedPayment && (
                <motion.div
                  key="paying-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <EmbeddedPaymentUI
                    orderId={orderId}
                    paymentId={embeddedPayment.paymentId}
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

          {/* Sidebar - Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-8 space-y-6">
              <div className="relative glass-strong rounded-3xl overflow-hidden shadow-card-lg border border-border-subtle">
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-neon via-cyan-glow to-purple-neon" />

                <div className="p-6 border-b border-border-subtle">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-cyan-glow" />
                      Order Summary
                      {order.items && order.items.length > 0 && (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full bg-purple-neon/10 text-xs font-medium text-purple-neon border border-purple-neon/20">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </h3>
                  </div>
                  {/* Order ID with copy button */}
                  <div className="mt-2 flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-xs text-text-muted font-mono">{orderId.slice(0, 8)}...{orderId.slice(-4)}</span>
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(orderId);
                        toast.success('Order ID copied!');
                      }}
                      className="p-1 rounded-md hover:bg-cyan-glow/10 transition-colors group"
                      title="Copy Order ID"
                    >
                      <Copy className="h-3 w-3 text-text-muted group-hover:text-cyan-glow transition-colors" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Order Items - Grouped by product with pagination */}
                  {(() => {
                    const ITEMS_PER_PAGE = 5;
                    const groupedItems = groupOrderItems(order.items);
                    const totalPages = Math.ceil(groupedItems.length / ITEMS_PER_PAGE);
                    const paginatedItems = groupedItems.slice(
                      (currentPage - 1) * ITEMS_PER_PAGE,
                      currentPage * ITEMS_PER_PAGE
                    );
                    
                    return groupedItems.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          {paginatedItems.map((item, index) => (
                            <div key={item.productId} className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-subtle">
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-text-primary leading-relaxed">
                                    {item.productTitle !== '' ? item.productTitle : `Product #${(currentPage - 1) * ITEMS_PER_PAGE + index + 1}`}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-cyan-glow/10 text-xs font-medium text-cyan-glow">
                                      Qty: {item.quantity}
                                    </span>
                                    <span className="text-xs text-text-muted">Digital Product</span>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-semibold text-text-primary">
                                    €{item.totalPrice.toFixed(2)}
                                  </p>
                                  {item.quantity > 1 && (
                                    <p className="text-xs text-text-muted">
                                      €{Number(item.unitPrice).toFixed(2)} each
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50">
                            <span className="text-xs text-text-muted">
                              Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="text-xs h-7 px-2"
                              >
                                <ArrowLeft className="h-3 w-3 mr-1" />
                                Prev
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="text-xs h-7 px-2"
                              >
                                Next
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-subtle animate-pulse">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-border-subtle rounded w-3/4" />
                                <div className="h-3 bg-border-subtle rounded w-1/2" />
                              </div>
                              <div className="h-4 bg-border-subtle rounded w-16" />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Estimated Delivery Time */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-linear-to-r from-green-success/10 to-green-success/5 border border-green-success/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-success/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-green-success" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-success">Instant Delivery</p>
                      <p className="text-xs text-text-muted">Products delivered immediately after payment</p>
                    </div>
                  </motion.div>

                  <div className="border-t border-border-subtle pt-4 space-y-2">
                    {email !== '' && (
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{email}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border-subtle pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Total</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-glow to-purple-neon">
                          €{Number(order.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-text-muted">Including VAT</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Trust Signals - Horizontal below form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 max-w-5xl mx-auto"
        >
          <div className="glass-strong rounded-2xl p-6 border border-border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div 
                className="flex items-center gap-4 justify-center md:justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-linear-to-br from-cyan-glow/20 to-cyan-glow/10 flex items-center justify-center border border-cyan-glow/30"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Zap className="h-6 w-6 text-cyan-glow" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Instant Delivery</p>
                  <p className="text-xs text-text-muted">Products delivered to email</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-center gap-4 justify-center md:justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-linear-to-br from-purple-neon/20 to-purple-neon/10 flex items-center justify-center border border-purple-neon/30"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Lock className="h-6 w-6 text-purple-neon" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Secure Payment</p>
                  <p className="text-xs text-text-muted">256-bit encryption</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-center gap-4 justify-center md:justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-linear-to-br from-cyan-glow/20 to-purple-neon/10 flex items-center justify-center border border-cyan-glow/30"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Shield className="h-6 w-6 text-cyan-glow" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">100% Authentic</p>
                  <p className="text-xs text-text-muted">Official products only</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
