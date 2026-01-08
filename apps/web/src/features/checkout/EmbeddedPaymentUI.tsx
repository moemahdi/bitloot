'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import {
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Wallet,
  Shield,
  Timer,
} from 'lucide-react';
import { OrdersApi, PaymentsApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Progress } from '@/design-system/primitives/progress';
import { toast } from 'sonner';
import { apiConfig } from '@/lib/api-config';

const ordersClient = new OrdersApi(apiConfig);
const paymentsClient = new PaymentsApi(apiConfig);

// ========== Types ==========
interface EmbeddedPaymentProps {
  orderId: string;
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  priceCurrency: string;
  expiresAt: string;
  qrCodeData: string;
  estimatedTime: string;
}

type PaymentStatus = 'waiting' | 'confirming' | 'confirmed' | 'finished' | 'failed' | 'expired';

// ========== Currency Icons ==========
const CURRENCY_ICONS: Record<string, string> = {
  btc: '₿',
  eth: 'Ξ',
  ltc: 'Ł',
  usdttrc20: '₮',
  usdterc20: '₮',
  trx: '◈',
  bnb: '◆',
  sol: '◎',
  doge: 'Ð',
};

// ========== Status Config ==========
const STATUS_CONFIG: Record<PaymentStatus, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  waiting: {
    label: 'Waiting for Payment',
    description: 'Send the exact amount to the address below',
    icon: <Wallet className="h-5 w-5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
  confirming: {
    label: 'Confirming on Blockchain',
    description: 'Transaction detected, waiting for confirmations...',
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    color: 'text-cyan-glow',
    bgColor: 'bg-cyan-glow/10',
  },
  confirmed: {
    label: 'Payment Confirmed',
    description: 'Your payment has been confirmed!',
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-green-success',
    bgColor: 'bg-green-success/10',
  },
  finished: {
    label: 'Payment Complete',
    description: 'Preparing your order...',
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-green-success',
    bgColor: 'bg-green-success/10',
  },
  failed: {
    label: 'Payment Failed',
    description: 'Something went wrong. Please try again.',
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  expired: {
    label: 'Payment Expired',
    description: 'The payment window has expired. Please start a new payment.',
    icon: <Timer className="h-5 w-5" />,
    color: 'text-orange-warning',
    bgColor: 'bg-orange-warning/10',
  },
};

// ========== Countdown Timer Component ==========
function CountdownTimer({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        onExpired();
        return null;
      }

      return {
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (newTimeLeft === null) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  if (timeLeft === null) {
    return <span className="text-red-500 font-mono text-lg">Expired</span>;
  }

  const isLow = timeLeft.minutes < 5;

  return (
    <div className={`flex items-center gap-2 ${isLow ? 'text-orange-warning' : 'text-text-secondary'}`}>
      <Timer className="h-4 w-4" />
      <span className="font-mono text-lg font-semibold">
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

// ========== Main Component ==========
export function EmbeddedPaymentUI({
  orderId,
  paymentId,
  payAddress,
  payAmount,
  payCurrency,
  priceAmount,
  priceCurrency,
  expiresAt,
  qrCodeData,
  estimatedTime,
}: EmbeddedPaymentProps): React.ReactElement {
  const router = useRouter();
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [npPaymentStatus, setNpPaymentStatus] = useState<string | null>(null);

  // Poll order status every 5 seconds
  const { data: order, refetch } = useQuery<OrderResponseDto>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orderData = await ordersClient.ordersControllerGetForCheckout({ id: orderId });
      return orderData;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling on terminal states
      if (status === 'paid' || status === 'fulfilled' || status === 'failed') {
        return false;
      }
      // Poll every 5 seconds while waiting
      return 5000;
    },
  });

  // Also poll NOWPayments directly for payment status (sandbox workaround)
  // This will update the order status when payment is detected
  const { data: _paymentPollData } = useQuery({
    queryKey: ['payment-poll', paymentId],
    queryFn: async () => {
      try {
        const result = await paymentsClient.paymentsControllerPollPaymentStatus({ paymentId });
        setNpPaymentStatus(result.paymentStatus ?? null);
        
        // If fulfillment was triggered, refetch order
        if (result.fulfillmentTriggered === true) {
          void refetch();
        }
        
        return result;
      } catch {
        // Silent fail - order polling is the backup
        return null;
      }
    },
    refetchInterval: (query) => {
      const npStatus = query.state.data?.paymentStatus;
      // Stop polling on terminal states
      if (npStatus === 'finished' || npStatus === 'confirmed' || npStatus === 'failed') {
        return false;
      }
      // Poll every 10 seconds (less aggressive than order polling)
      return 10000;
    },
    enabled: paymentId !== '' && paymentId !== undefined,
  });

  // Determine current status (consider both order and payment status)
  const orderStatus = order?.status ?? 'pending';
  let paymentStatus: PaymentStatus = 'waiting';
  
  // Check NOWPayments status first (more accurate in sandbox)
  if (npPaymentStatus === 'confirming' || npPaymentStatus === 'sending') {
    paymentStatus = 'confirming';
  } else if (npPaymentStatus === 'confirmed' || npPaymentStatus === 'finished') {
    paymentStatus = 'finished';
  } else if (npPaymentStatus === 'failed' || npPaymentStatus === 'refunded' || npPaymentStatus === 'expired') {
    paymentStatus = 'failed';
  } else if (orderStatus === 'confirming') {
    paymentStatus = 'confirming';
  } else if (orderStatus === 'paid' || orderStatus === 'fulfilled') {
    paymentStatus = 'finished';
  } else if (orderStatus === 'failed') {
    paymentStatus = 'failed';
  } else if (isExpired) {
    paymentStatus = 'expired';
  }

  const statusConfig = STATUS_CONFIG[paymentStatus];

  // Handle redirect on success
  useEffect(() => {
    if (paymentStatus === 'finished') {
      const timer = setTimeout(() => {
        router.push(`/orders/${orderId}/success`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, orderId, router]);

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'address' | 'amount') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type === 'address' ? 'Address' : 'Amount'} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const currencyIcon = CURRENCY_ICONS[payCurrency.toLowerCase()] ?? payCurrency.toUpperCase();

  // Success state - redirect happening
  if (paymentStatus === 'finished') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-3xl p-8 text-center shadow-glow-success"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mx-auto mb-6 h-20 w-20 rounded-full bg-green-success/20 flex items-center justify-center"
        >
          <CheckCircle2 className="h-10 w-10 text-green-success" />
        </motion.div>
        <h2 className="text-2xl font-bold text-green-success mb-2">Payment Confirmed!</h2>
        <p className="text-text-muted mb-4">Redirecting to your order...</p>
        <Loader2 className="h-6 w-6 animate-spin text-cyan-glow mx-auto" />
      </motion.div>
    );
  }

  // Failed/Expired state
  if (paymentStatus === 'failed' || paymentStatus === 'expired') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-8 text-center"
      >
        <div className={`mx-auto mb-6 h-16 w-16 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
          <div className={statusConfig.color}>{statusConfig.icon}</div>
        </div>
        <h2 className={`text-xl font-bold mb-2 ${statusConfig.color}`}>{statusConfig.label}</h2>
        <p className="text-text-muted mb-6">{statusConfig.description}</p>
        <Button
          onClick={() => router.push(`/checkout/${orderId}`)}
          className="bg-cyan-glow text-bg-primary hover:shadow-glow-cyan"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-3xl overflow-hidden shadow-card-lg"
    >
      {/* Header with Status */}
      <div className={`p-6 border-b border-border-subtle ${statusConfig.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-bg-primary/50 ${statusConfig.color}`}>
              {statusConfig.icon}
            </div>
            <div>
              <h3 className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</h3>
              <p className="text-sm text-text-muted">{statusConfig.description}</p>
            </div>
          </div>
          <button
            onClick={() => void refetch()}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-cyan-glow"
            title="Refresh status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Progress indicator for confirming */}
        {paymentStatus === 'confirming' && (
          <div className="mt-4">
            <Progress value={50} className="h-1.5" />
            <p className="text-xs text-text-muted mt-1">Waiting for blockchain confirmations...</p>
          </div>
        )}
      </div>

      {/* Payment Details */}
      <div className="p-6 space-y-6">
        {/* Timer */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary border border-border-subtle">
          <span className="text-text-muted">Time remaining</span>
          <CountdownTimer expiresAt={expiresAt} onExpired={() => setIsExpired(true)} />
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <QRCodeSVG
              value={qrCodeData}
              size={180}
              level="H"
              includeMargin={true}
              style={{ display: 'block' }}
            />
          </div>
        </div>

        {/* Amount to Send */}
        <div className="p-4 rounded-xl bg-bg-tertiary border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-muted text-sm">Send exactly</span>
            <Badge variant="outline" className="text-xs">
              {payCurrency.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currencyIcon}</span>
              <span className="text-2xl font-bold text-text-primary font-mono">
                {payAmount}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void copyToClipboard(payAmount.toString(), 'amount')}
              className="shrink-0"
            >
              {copied === 'amount' ? (
                <CheckCircle2 className="h-4 w-4 text-green-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            ≈ {priceAmount} {priceCurrency.toUpperCase()}
          </p>
        </div>

        {/* Wallet Address */}
        <div className="p-4 rounded-xl bg-bg-tertiary border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-muted text-sm">To this address</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-text-secondary break-all bg-bg-primary p-3 rounded-lg">
              {payAddress}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void copyToClipboard(payAddress, 'address')}
              className="shrink-0"
            >
              {copied === 'address' ? (
                <CheckCircle2 className="h-4 w-4 text-green-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
          <Clock className="h-4 w-4" />
          <span>Estimated confirmation time: {estimatedTime}</span>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-success/5 border border-green-success/20">
          <Shield className="h-4 w-4 text-green-success shrink-0" />
          <p className="text-xs text-green-success">
            Secure blockchain payment. Your order will be processed automatically once confirmed.
          </p>
        </div>

        {/* View Order Link */}
        <div className="text-center">
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            className="text-sm text-cyan-glow hover:underline inline-flex items-center gap-1"
          >
            View order details
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
