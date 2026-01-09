'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { OrdersApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import Link from 'next/link';
import { EmbeddedPaymentUI } from '@/features/checkout/EmbeddedPaymentUI';
import { PaymentMethodForm, type PaymentMethodFormData } from '@/features/checkout/PaymentMethodForm';

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



// Step type for the checkout flow
type CheckoutStep = 'select' | 'paying';

export default function CheckoutPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('select');
  const [embeddedPayment, setEmbeddedPayment] = useState<EmbeddedPaymentResponse | null>(null);

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
    mutationFn: async (payCurrency: string): Promise<EmbeddedPaymentResponse> => {
      if (order === null || order === undefined) throw new Error('Order not found');

      // Call embedded payment endpoint directly
      const response = await fetch(`${apiConfig.basePath}/payments/embedded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          priceAmount: order.total,
          priceCurrency: 'usd',
          payCurrency,
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

  // Handle payment submission from PaymentMethodForm
  const handlePaymentSubmit = async (data: PaymentMethodFormData): Promise<void> => {
    setIsProcessing(true);
    await createPaymentMutation.mutateAsync(data.payCurrency);
  };



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
              <div className="p-6 md:p-8">
                <PaymentMethodForm
                  onSubmit={handlePaymentSubmit}
                  isLoading={isProcessing || createPaymentMutation.isPending}
                />
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
                  </div>
                </div>
              </div>

              {/* Payment note */}
              <div className="p-6 pt-0">
                <p className="text-xs text-center text-text-muted flex items-center justify-center gap-1">
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
