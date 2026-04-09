'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Timer,
  ArrowLeft,
  Check,
  CreditCard,
  Wallet,
  Copy,
  Clock,
  XCircle,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreditsApi } from '@bitloot/sdk';
import type { EmbeddedPaymentResponseDto, TopupStatusResponseDto } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Button } from '@/design-system/primitives/button';
import Link from 'next/link';
import { PaymentMethodForm, type PaymentMethodFormData } from '@/features/checkout/PaymentMethodForm';
import { parseCheckoutError } from '@/lib/checkout-errors';

// Initialize SDK client
const creditsClient = new CreditsApi(apiConfig);

// Payment status types aligned with NOWPayments
type PaymentStatus = 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';

// Status configuration for UI
const STATUS_CONFIG: Record<PaymentStatus, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  isTerminal: boolean;
}> = {
  waiting: {
    label: 'Awaiting Payment',
    description: 'Send the exact amount to the address below',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-orange-warning',
    bgColor: 'bg-orange-warning/10',
    isTerminal: false,
  },
  confirming: {
    label: 'Confirming on Blockchain',
    description: 'Your payment has been detected and is being confirmed',
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    color: 'text-cyan-glow',
    bgColor: 'bg-cyan-glow/10',
    isTerminal: false,
  },
  confirmed: {
    label: 'Payment Confirmed',
    description: 'Your credits are being added to your account',
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-green-success',
    bgColor: 'bg-green-success/10',
    isTerminal: false,
  },
  sending: {
    label: 'Processing',
    description: 'Finalizing your top-up...',
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    color: 'text-cyan-glow',
    bgColor: 'bg-cyan-glow/10',
    isTerminal: false,
  },
  partially_paid: {
    label: 'Partial Payment',
    description: 'Amount received is less than required. Please send the remaining amount.',
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-orange-warning',
    bgColor: 'bg-orange-warning/10',
    isTerminal: false,
  },
  finished: {
    label: 'Top-Up Complete!',
    description: 'Your credits have been added to your account',
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-green-success',
    bgColor: 'bg-green-success/10',
    isTerminal: true,
  },
  failed: {
    label: 'Payment Failed',
    description: 'There was an issue with your payment',
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-red-error',
    bgColor: 'bg-red-error/10',
    isTerminal: true,
  },
  refunded: {
    label: 'Refunded',
    description: 'Your payment has been refunded',
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-text-muted',
    bgColor: 'bg-bg-secondary',
    isTerminal: true,
  },
  expired: {
    label: 'Payment Expired',
    description: 'The payment window has expired. Please create a new top-up.',
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-red-error',
    bgColor: 'bg-red-error/10',
    isTerminal: true,
  },
};

// Step type for checkout flow
type CheckoutStep = 'payment' | 'paying';

// Step Progress component
function StepProgress({ currentStep }: { currentStep: CheckoutStep }): React.ReactElement {
  const steps = [
    { id: 'payment', label: 'Select Crypto', icon: CreditCard },
    { id: 'paying', label: 'Complete Payment', icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                isActive
                  ? 'border-cyan-glow bg-cyan-glow text-bg-primary shadow-glow-cyan scale-110'
                  : isComplete
                    ? 'border-cyan-glow bg-cyan-glow text-bg-primary'
                    : 'border-border-muted text-text-muted'
              }`}
            >
              {isComplete ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
              {isActive && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-glow animate-ping opacity-30" />
              )}
            </div>

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
    </div>
  );
}

// Loading skeleton
function CheckoutSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="relative rounded-3xl p-10 text-center shadow-card-lg border border-border-subtle bg-bg-secondary">
        <Loader2 className="h-12 w-12 text-cyan-glow animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Loading checkout...</p>
      </div>
    </div>
  );
}

function formatEur(value: number): string {
  if (isNaN(value) || value === 0) return '€0.00';
  return `€${value.toFixed(2)}`;
}

// Payment Display Component with Status Polling
function TopupPaymentDisplay({
  payment,
  topupId,
}: {
  payment: EmbeddedPaymentResponseDto;
  topupId: string;
}): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Mutation to manually confirm topup (fallback when IPN doesn't arrive)
  const confirmMutation = useMutation({
    mutationFn: async () => {
      return creditsClient.creditsControllerConfirmTopup({ id: topupId });
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate credits queries so balance updates
        void queryClient.invalidateQueries({ queryKey: ['credits'] });
      }
    },
  });

  // Poll for payment status
  const { data: statusData } = useQuery({
    queryKey: ['topup-status', topupId],
    queryFn: async (): Promise<TopupStatusResponseDto> => {
      const response = await creditsClient.creditsControllerGetTopupStatus({ id: topupId });
      return response;
    },
    refetchInterval: (query) => {
      const currentStatus = (query.state.data?.paymentStatus ?? 'waiting') as PaymentStatus;
      const config = STATUS_CONFIG[currentStatus];
      // Stop polling when payment reaches terminal state
      if (config?.isTerminal === true) return false;
      // Poll every 5 seconds for non-terminal states
      return 5000;
    },
    enabled: Boolean(topupId),
    staleTime: 0, // Always fetch fresh data
  });

  const currentStatus = (statusData?.paymentStatus ?? 'waiting') as PaymentStatus;
  const statusConfig = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.waiting;

  // When payment is finished, trigger manual confirm (fallback for missing IPN)
  useEffect(() => {
    if (currentStatus === 'finished' && !hasConfirmed && statusData?.status === 'pending') {
      setHasConfirmed(true);
      confirmMutation.mutate();
    }
  }, [currentStatus, hasConfirmed, statusData?.status, confirmMutation]);

  // Redirect to profile on finished status (after confirmation)
  useEffect(() => {
    if (currentStatus === 'finished' && !hasRedirected) {
      setHasRedirected(true);
      toast.success('Credits added to your account!', { duration: 5000 });
      // Small delay before redirect for UX
      const timer = setTimeout(() => {
        router.push('/profile?tab=credits');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStatus, hasRedirected, router]);

  const handleCopy = useCallback(async (type: 'address' | 'amount', value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      toast.success(`${type === 'address' ? 'Address' : 'Amount'} copied!`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const qrValue = payment.qrCodeData ?? payment.payAddress;

  // Show success state for finished payments
  if (currentStatus === 'finished') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-green-success/30 bg-green-success/5 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-success/10 flex items-center justify-center mx-auto mb-6 border border-green-success/30">
            <Package className="h-10 w-10 text-green-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Top-Up Complete!</h2>
          <p className="text-text-muted mb-6">
            Your credits have been added to your account.
          </p>
          <p className="text-3xl font-bold text-green-success tabular-nums mb-6">
            +€{statusData?.amountEur?.toFixed(2) ?? payment.priceAmount}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="default"
              className="bg-gradient-to-r from-cyan-glow to-cyan-glow/80 text-bg-primary"
              onClick={() => router.push('/profile?tab=credits')}
            >
              View Balance
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/catalog')}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show failed/expired state
  if (currentStatus === 'failed' || currentStatus === 'expired') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-error/30 bg-red-error/5 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-error/10 flex items-center justify-center mx-auto mb-6 border border-red-error/30">
            <XCircle className="h-10 w-10 text-red-error" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">{statusConfig.label}</h2>
          <p className="text-text-muted mb-6">{statusConfig.description}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="default"
              onClick={() => router.push('/credits/topup')}
            >
              Start New Top-up
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/profile?tab=credits')}
            >
              Back to Credits
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Details Card */}
      <div className="rounded-2xl border border-cyan-glow/30 bg-bg-secondary/80 p-6">
        {/* Status Badge */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color} text-sm mb-4`}>
            {statusConfig.icon}
            {statusConfig.label}
          </div>
          <p className="text-text-muted text-sm">
            {statusConfig.description}
          </p>
          {/* Amount received indicator for confirming state */}
          {currentStatus === 'confirming' && statusData?.actuallyPaid != null && statusData.actuallyPaid > 0 && (
            <p className="text-cyan-glow text-sm mt-2">
              Received: {statusData.actuallyPaid} {payment.payCurrency.toUpperCase()}
            </p>
          )}
        </div>

        {/* QR Code - only show when waiting */}
        {currentStatus === 'waiting' && (
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-xl bg-bg-primary border border-border-subtle">
              <QRCodeSVG
                value={qrValue}
                size={160}
                bgColor="#0C0C0F"
                fgColor="#00F5FF"
                level="M"
              />
            </div>
          </div>
        )}

        {/* Confirming animation */}
        {(currentStatus === 'confirming' || currentStatus === 'confirmed' || currentStatus === 'sending') && (
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-cyan-glow/10 flex items-center justify-center border-2 border-cyan-glow/30">
                <Loader2 className="h-16 w-16 text-cyan-glow animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-cyan-glow animate-ping opacity-20" />
            </div>
          </div>
        )}

        {/* Amount - only show when waiting */}
        {currentStatus === 'waiting' && (
          <>
            <div className="mb-4">
              <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">
                Amount to Send
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-bg-primary border border-border-subtle p-4">
                <span className="flex-1 font-mono text-lg text-cyan-glow truncate">
                  {payment.payAmount} {payment.payCurrency.toUpperCase()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleCopy('amount', payment.payAmount.toString())}
                  className="shrink-0"
                >
                  {copied === 'amount' ? <Check className="h-4 w-4 text-green-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">
                Send to Address
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-bg-primary border border-border-subtle p-4">
                <span className="flex-1 font-mono text-sm text-text-primary break-all">
                  {payment.payAddress}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleCopy('address', payment.payAddress)}
                  className="shrink-0"
                >
                  {copied === 'address' ? <Check className="h-4 w-4 text-green-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
              <Timer className="h-4 w-4" />
              <span>Estimated confirmation: {payment.estimatedTime}</span>
            </div>
          </>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-border-subtle bg-bg-secondary/30 p-4">
        <div className="flex items-start gap-3">
          <Wallet className="h-5 w-5 text-cyan-glow shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">After Payment</p>
            <p className="text-xs text-text-muted mt-1">
              Once your payment is confirmed on the blockchain, your credits will be added
              automatically. You can close this page and check your balance later.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/profile?tab=credits')}
        >
          Check Balance
        </Button>
        <Button
          variant="default"
          className="flex-1 bg-gradient-to-r from-cyan-glow to-cyan-glow/80 text-bg-primary"
          onClick={() => router.push('/catalog')}
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}

export default function TopupCheckoutPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const topupId = params.id as string;

  // State
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('payment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [embeddedPayment, setEmbeddedPayment] = useState<EmbeddedPaymentResponseDto | null>(null);

  // Fetch topup details
  const {
    data: topup,
    isLoading: topupLoading,
    error: topupError,
  } = useQuery({
    queryKey: ['topup', topupId],
    queryFn: async () => {
      const response = await creditsClient.creditsControllerGetTopup({ id: topupId });
      return response;
    },
    enabled: Boolean(topupId),
    retry: 2,
  });

  // Create embedded payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (payCurrency: string): Promise<EmbeddedPaymentResponseDto> => {
      if (topup === null || topup === undefined) {
        throw new Error('Top-up not found');
      }
      try {
        const response = await creditsClient.creditsControllerCreateTopupPayment({
          id: topupId,
          createTopupPaymentDto: { payCurrency },
        });
        return response;
      } catch (err: unknown) {
        // Extract structured error body from SDK ResponseError
        if (err !== null && typeof err === 'object' && 'response' in err) {
          const responseError = err as { response: Response };
          try {
            const body: unknown = await responseError.response.json();
            throw body; // Re-throw as plain object so parseCheckoutError can read error/message
          } catch (parseErr) {
            if (parseErr !== err) throw parseErr;
          }
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      setEmbeddedPayment(data);
      setIsProcessing(false);
      setCurrentStep('paying');
      toast.success('Payment created! Send crypto to complete your top-up.');
    },
    onError: (error: unknown) => {
      setIsProcessing(false);
      const parsedError = parseCheckoutError(error);
      const apiMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as Record<string, unknown>).message
        : null;
      const displayMessage = typeof apiMessage === 'string' && apiMessage.length > 0
        ? apiMessage
        : parsedError.message;
      toast.error(displayMessage, {
        duration: 8000,
      });
    },
  });

  // Handlers
  const handlePaymentSubmit = async (data: PaymentMethodFormData): Promise<void> => {
    setIsProcessing(true);
    try {
      await createPaymentMutation.mutateAsync(data.payCurrency);
    } catch {
      // Error already handled by onError callback
    }
  };

  const handleBack = (): void => {
    if (currentStep === 'paying') {
      // Allow going back to change crypto selection
      setCurrentStep('payment');
      setEmbeddedPayment(null);
    } else {
      router.push('/credits/topup');
    }
  };

  // Loading state
  if (topupLoading) {
    return <CheckoutSkeleton />;
  }

  // Error state
  if (topupError != null || topup == null) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="rounded-3xl p-10 text-center max-w-md shadow-card-lg border border-red-error/30 bg-bg-secondary">
          <div className="w-20 h-20 rounded-2xl bg-red-error/10 flex items-center justify-center mx-auto mb-6 border border-red-error/30">
            <AlertCircle className="h-10 w-10 text-red-error" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Top-up Not Found</h2>
          <p className="text-text-muted mb-6">
            We couldn&apos;t find this top-up. It may have expired or the link is invalid.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/credits/topup">
              <Button variant="default" className="w-full">
                Start New Top-up
              </Button>
            </Link>
            <Link href="/profile?tab=credits">
              <Button variant="outline" className="w-full">
                Back to Credits
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">{currentStep === 'paying' ? 'Change Crypto' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-cyan-glow" />
              <span className="font-semibold text-text-primary">Credit Top-up</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <StepProgress currentStep={currentStep} />

        {/* Amount Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-text-muted text-sm mb-1">Top-up Amount</p>
          <p className="text-4xl font-bold text-cyan-glow tabular-nums">
            {formatEur(topup.amountEur)}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentStep === 'payment' && (
            <motion.div
              key="payment-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto"
            >
              <div className="rounded-3xl border border-border-subtle bg-bg-secondary/50 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary mb-2">Select Payment Method</h2>
                <p className="text-text-muted text-sm mb-6">
                  Choose your preferred cryptocurrency to complete the top-up.
                </p>

                <PaymentMethodForm
                  orderTotal={topup.amountEur.toString()}
                  onSubmit={handlePaymentSubmit}
                  isLoading={isProcessing}
                />
              </div>
            </motion.div>
          )}

          {currentStep === 'paying' && embeddedPayment !== null && (
            <motion.div
              key="paying-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <TopupPaymentDisplay payment={embeddedPayment} topupId={topupId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
