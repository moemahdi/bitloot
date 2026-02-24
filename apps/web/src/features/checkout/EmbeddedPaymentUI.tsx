'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  Sparkles,
  Zap,
  Download,
  HelpCircle,
  ZoomIn,
} from 'lucide-react';
import { OrdersApi, PaymentsApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Progress } from '@/design-system/primitives/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/design-system/primitives/accordion';
import { toast } from 'sonner';
import { apiConfig } from '@/lib/api-config';
import { CryptoIcon } from '@/components/crypto-icons';
import { FullScreenQR } from '@/components/FullScreenQR';

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

type PaymentStatus = 'waiting' | 'confirming' | 'confirmed' | 'finished' | 'failed' | 'expired' | 'underpaid';

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
    icon: <Loader2 className="h-5 w-5 animate-spin-glow" />,
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
    description: 'Something went wrong with the payment. Please try again.',
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  expired: {
    label: 'Payment Window Expired',
    description: 'The 1-hour payment window has closed. No funds were charged.',
    icon: <Timer className="h-5 w-5" />,
    color: 'text-orange-warning',
    bgColor: 'bg-orange-warning/10',
  },
  underpaid: {
    label: 'Partial Payment Received',
    description: 'Insufficient amount received. Please contact support.',
    icon: <AlertCircle className="h-5 w-5" />,
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
    return (
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-destructive font-mono text-lg font-bold"
      >
        Expired
      </motion.span>
    );
  }

  const isLow = timeLeft.minutes < 5;
  const isCritical = timeLeft.minutes < 2;
  const totalSeconds = timeLeft.minutes * 60 + timeLeft.seconds;
  const progressPercentage = (totalSeconds / 3600) * 251.2; // 251.2 is circumference of circle with r=40

  return (
    <motion.div 
      animate={isCritical ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
      className="relative w-24 h-24"
    >
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-border-subtle"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={`${progressPercentage} 251.2`}
          className={isCritical ? 'text-destructive' : isLow ? 'text-orange-warning' : 'text-cyan-glow'}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Timer className={`h-4 w-4 mb-1 ${isCritical ? 'text-destructive' : isLow ? 'text-orange-warning' : 'text-text-secondary'}`} />
        <span className={`font-mono text-lg font-bold tabular-nums ${isCritical ? 'text-destructive animate-pulse' : isLow ? 'text-orange-warning' : 'text-text-primary'}`}>
          {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    </motion.div>
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
  const [confirmations, _setConfirmations] = useState<{current: number, required: number}>({current: 0, required: 3});
  const [txHash, _setTxHash] = useState<string | null>(null);
  const networkFee = 0.50; // Mock network fee - should come from backend
  const [amountReceived, _setAmountReceived] = useState<number>(0);
  const [amountNeeded, _setAmountNeeded] = useState<number>(0);
  const [showFullScreenQR, setShowFullScreenQR] = useState(false);

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

  // Also poll provider status directly for payment status (sandbox workaround)
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
  
  // Check for expired order status first (from backend orphan cleanup)
  if (orderStatus === 'expired') {
    paymentStatus = 'expired';
  // Check provider status (more accurate in sandbox)
  } else if (npPaymentStatus === 'confirming' || npPaymentStatus === 'sending') {
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
      // Trigger confetti
      void confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00FFFF', '#A855F7', '#10B981']
      });

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

  // Download QR Code
  const downloadQR = () => {
    const svg = document.querySelector('.qr-code-svg');
    if (svg === null || svg === undefined) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bitloot-payment-${orderId}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('QR code downloaded!');
  };

  // Success state - redirect happening
  if (paymentStatus === 'finished') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative glass-strong rounded-3xl p-10 text-center shadow-glow-success overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-success/10 via-transparent to-cyan-glow/5" />
        
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-green-success/30 to-green-success/10 flex items-center justify-center shadow-glow-success border-2 border-green-success/50"
        >
          <CheckCircle2 className="h-12 w-12 text-green-success" />
          <motion.div
            className="absolute inset-0 rounded-full bg-green-success/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-green-success mb-3"
        >
          Payment Confirmed!
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-text-muted mb-6"
        >
          Your order is being prepared. Redirecting...
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-cyan-glow"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Redirecting to order details...</span>
        </motion.div>
      </motion.div>
    );
  }

  // Failed/Expired state
  if (paymentStatus === 'failed' || paymentStatus === 'expired') {
    const isExpiredStatus = paymentStatus === 'expired';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative glass-strong rounded-3xl p-10 text-center overflow-hidden"
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 ${isExpiredStatus ? 'bg-gradient-to-br from-orange-warning/10 via-transparent to-transparent' : 'bg-gradient-to-br from-red-500/10 via-transparent to-transparent'}`} />
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`relative mx-auto mb-6 h-20 w-20 rounded-2xl ${statusConfig.bgColor} flex items-center justify-center border-2 ${isExpiredStatus ? 'border-orange-warning/50' : 'border-red-500/50'}`}
        >
          <div className={statusConfig.color}>{statusConfig.icon}</div>
        </motion.div>
        
        <h2 className={`text-2xl font-bold mb-3 ${statusConfig.color}`}>{statusConfig.label}</h2>
        <p className="text-text-muted mb-4 max-w-sm mx-auto">{statusConfig.description}</p>
        
        {/* Additional info for expired payments */}
        {isExpiredStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-4 rounded-xl bg-orange-warning/5 border border-orange-warning/20 text-left max-w-md mx-auto"
          >
            <p className="text-sm text-text-muted mb-2">
              <strong className="text-orange-warning">What happened?</strong>
            </p>
            <p className="text-xs text-text-muted mb-2">
              Crypto payments have a <strong>1-hour window</strong> to complete. If no payment is received within this time, the order expires automatically.
            </p>
            <p className="text-xs text-text-muted">
              <strong>Don&apos;t worry</strong> - no funds were charged. You can start a new order and complete the payment within the time limit.
            </p>
          </motion.div>
        )}
        
        {isExpiredStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 space-y-3"
          >
            <p className="text-sm text-text-muted text-center">Try a different cryptocurrency:</p>
            <div className="grid grid-cols-3 gap-2">
              {['BTC', 'ETH', 'USDT'].map((currency) => (
                <Button 
                  key={currency} 
                  variant="outline"
                  className="border-border-subtle hover:border-cyan-glow/50 hover:bg-cyan-glow/5"
                  onClick={() => {
                    toast.info(`Switching to ${currency}...`);
                    // This would trigger a new payment creation with selected currency
                  }}
                >
                  {currency}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Button
            onClick={() => router.push('/catalog')}
            className="h-14 px-8 bg-gradient-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan-lg font-bold text-lg group"
          >
            <RefreshCw className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:rotate-180" />
            {isExpiredStatus ? 'Create New Order' : 'Start New Payment'}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative glass-strong rounded-3xl overflow-hidden shadow-card-lg border border-border-subtle"
    >
      {/* Animated glow border when waiting */}
      {paymentStatus === 'waiting' && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{ 
            boxShadow: ['0 0 20px rgba(0, 255, 255, 0.1)', '0 0 40px rgba(0, 255, 255, 0.2)', '0 0 20px rgba(0, 255, 255, 0.1)']
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      {/* Gradient border accent */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-glow via-purple-neon to-cyan-glow"
        animate={paymentStatus === 'confirming' ? { opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Header with Status */}
      <div className={`p-6 border-b border-border-subtle ${statusConfig.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-bg-primary/50 ${statusConfig.color} border border-border-subtle`}>
              {statusConfig.icon}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${statusConfig.color}`}>{statusConfig.label}</h3>
              <p className="text-sm text-text-muted">{statusConfig.description}</p>
            </div>
          </div>
          <motion.button
            onClick={() => void refetch()}
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="p-2.5 rounded-xl hover:bg-bg-tertiary transition-colors duration-200 text-text-muted hover:text-cyan-glow border border-transparent hover:border-cyan-glow/30 hover:shadow-glow-cyan-sm"
            title="Refresh status"
          >
            <RefreshCw className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Progress indicator for confirming */}
        {paymentStatus === 'confirming' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Blockchain confirmations</span>
              <span className="text-cyan-glow font-mono">{confirmations.current}/{confirmations.required}</span>
            </div>
            <Progress value={(confirmations.current / confirmations.required) * 100} className="h-2" />
            <p className="text-xs text-text-muted">Estimated {estimatedTime} remaining</p>
          </div>
        )}
      </div>

      {/* Payment Details */}
      <div className="p-6 space-y-6">
        {/* Timer - 1 hour payment window */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-bg-tertiary to-bg-secondary border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-warning/10 border border-orange-warning/20">
              <Clock className="h-4 w-4 text-orange-warning" />
            </div>
            <div>
              <span className="text-text-muted font-medium block">Time remaining</span>
              <span className="text-xs text-text-muted/70">1-hour payment window</span>
            </div>
          </div>
          <CountdownTimer expiresAt={expiresAt} onExpired={() => setIsExpired(true)} />
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setShowFullScreenQR(true)}
          >
            {/* Animated glow ring */}
            <motion.div 
              className="absolute -inset-3 bg-gradient-to-r from-cyan-glow/30 via-purple-neon/30 to-cyan-glow/30 rounded-3xl blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-glow/20 via-purple-neon/20 to-cyan-glow/20 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative p-5 bg-white rounded-2xl shadow-xl border-2 border-white/50">
              <QRCodeSVG
                value={qrCodeData}
                size={200}
                level="H"
                includeMargin={true}
                className="qr-code-svg"
                style={{ display: 'block' }}
              />
              {/* Expand overlay hint */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-2xl transition-colors">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ZoomIn className="h-6 w-6" />
                </motion.div>
              </div>
            </div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-text-muted flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-glow animate-pulse" />
            Scan with your wallet app • Click to expand
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-2"
          >
            <Button 
              variant="outline" 
              onClick={() => setShowFullScreenQR(true)} 
              className="gap-2 border-cyan-glow/20 hover:border-cyan-glow/50 hover:bg-cyan-glow/5"
            >
              <ZoomIn className="h-4 w-4" />
              Expand QR
            </Button>
            <Button 
              variant="outline" 
              onClick={downloadQR} 
              className="gap-2 border-cyan-glow/20 hover:border-cyan-glow/50 hover:bg-cyan-glow/5"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </motion.div>
        </div>

        {/* Full Screen QR Modal */}
        <FullScreenQR
          qrData={qrCodeData}
          currency={payCurrency}
          amount={payAmount}
          isOpen={showFullScreenQR}
          onClose={() => setShowFullScreenQR(false)}
        />

        {/* Payment Instructions Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="border-none">
            <AccordionItem value="how-to-pay" className="border border-border-subtle rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-2 text-text-primary">
                  <HelpCircle className="h-4 w-4 text-cyan-glow" />
                  <span className="text-sm font-medium">How to pay with crypto?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ol className="space-y-3 text-sm text-text-muted">
                  <li className="flex gap-3">
                    <span className="font-bold text-cyan-glow shrink-0">1.</span>
                    <span>Open your crypto wallet app</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-cyan-glow shrink-0">2.</span>
                    <span>Scan the QR code or copy the address</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-cyan-glow shrink-0">3.</span>
                    <span>Send the EXACT amount shown above</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-cyan-glow shrink-0">4.</span>
                    <span>Wait for blockchain confirmation</span>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* Amount to Send */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-bg-tertiary via-bg-secondary to-bg-tertiary border border-border-subtle overflow-hidden group hover:border-cyan-glow/30 transition-colors">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-glow/5 to-purple-neon/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-glow" />
                Send exactly
              </span>
              <Badge className="bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 font-semibold">
                {payCurrency.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-bg-primary/80 border border-border-subtle">
                  <CryptoIcon code={payCurrency} size={32} />
                </div>
                <div>
                  <span className="text-3xl font-bold text-text-primary font-mono tracking-tight tabular-nums">
                    {payAmount}
                  </span>
                  <p className="text-sm text-text-muted mt-0.5 font-mono tabular-nums">
                    ≈ €{priceAmount} {priceCurrency.toUpperCase()}
                  </p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => void copyToClipboard(payAmount.toString(), 'amount')}
                  className={`h-11 w-11 rounded-xl border-border-subtle hover:border-cyan-glow hover:text-cyan-glow hover:shadow-glow-cyan-sm transition-all duration-200 ${copied === 'amount' ? 'border-green-success shadow-glow-success' : ''}`}
                >
                  {copied === 'amount' ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-success" />
                    </motion.div>
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Network Fee Warning */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-4 rounded-xl bg-orange-warning/5 border border-orange-warning/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-warning" />
            <span className="text-sm font-semibold text-orange-warning">Network Fee Notice</span>
          </div>
          <p className="text-xs text-text-muted">
            Amount shown is exact. Your wallet will add network fees separately (≈ €{networkFee.toFixed(2)} EUR)
          </p>
        </motion.div>

        {/* Wallet Address */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-bg-tertiary via-bg-secondary to-bg-tertiary border border-border-subtle overflow-hidden group hover:border-purple-neon/30 transition-colors">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-neon/5 to-cyan-glow/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted text-sm font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-purple-neon" />
                To this address
              </span>
            </div>
            <code className="text-sm font-mono text-text-secondary break-all bg-bg-primary/80 p-4 rounded-xl border border-border-subtle block mb-4">
              {payAddress}
            </code>
            {/* Prominent Copy Address Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={() => void copyToClipboard(payAddress, 'address')}
                className={`w-full h-14 text-base font-bold rounded-xl transition-all duration-200 ${
                  copied === 'address' 
                    ? 'bg-green-success/20 border-2 border-green-success text-green-success shadow-glow-success' 
                    : 'bg-gradient-to-r from-purple-neon/20 to-cyan-glow/20 border-2 border-purple-neon/50 text-text-primary hover:border-purple-neon hover:shadow-glow-purple'
                }`}
              >
                {copied === 'address' ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Address Copied!
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    Copy Payment Address
                  </span>
                )}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle text-sm text-text-muted">
          <Clock className="h-4 w-4 text-cyan-glow" />
          <span>Estimated confirmation: <span className="text-text-secondary font-medium">{estimatedTime}</span></span>
        </div>

        {/* Transaction Hash Display */}
        {txHash !== null && txHash !== undefined && txHash !== '' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-cyan-glow/5 border border-cyan-glow/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-cyan-glow">Transaction Hash</span>
              <a 
                href={`https://blockchain.com/btc/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-glow hover:underline flex items-center gap-1"
              >
                View on explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <code className="text-xs font-mono text-text-muted break-all bg-bg-primary/50 p-2 rounded block">
              {txHash}
            </code>
          </motion.div>
        )}

        {/* Underpayment Warning */}
        {(paymentStatus as string) === 'underpaid' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-orange-warning/10 border border-orange-warning/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-5 w-5 text-orange-warning" />
              <h4 className="font-semibold text-orange-warning">Partial Payment Received</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Received:</span>
                <span className="font-mono text-text-primary">{amountReceived.toFixed(8)} {payCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Still needed:</span>
                <span className="font-mono text-orange-warning">{amountNeeded.toFixed(8)} {payCurrency}</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={() => window.open('/support', '_blank')}>
              Contact Support
            </Button>
          </motion.div>
        )}

        {/* Security Note */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-success/5 to-green-success/10 border border-green-success/30 shadow-glow-success/20"
        >
          <div className="p-2.5 rounded-xl bg-green-success/10 border border-green-success/20">
            <Shield className="h-5 w-5 text-green-success" />
          </div>
          <p className="text-sm text-green-success font-medium">
            Secure blockchain payment. Your order will be processed automatically once confirmed.
          </p>
        </motion.div>

        {/* View Order Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <motion.button
            onClick={() => router.push(`/orders/${orderId}`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm text-cyan-glow hover:text-pink-featured hover:underline inline-flex items-center gap-1.5 transition-colors duration-200 group"
          >
            View order details
            <ExternalLink className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
