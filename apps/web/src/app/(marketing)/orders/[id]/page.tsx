'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  ArrowLeft,
  Package,
  Mail,
  Shield,
  Zap,
  RefreshCw,
  Timer,
  Wallet,
} from 'lucide-react';
import { OrdersApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Progress } from '@/design-system/primitives/progress';
import { toast } from 'sonner';
import { apiConfig } from '@/lib/api-config';

// Initialize SDK clients
const ordersClient = new OrdersApi(apiConfig);

// ========== Types ==========
type OrderStatus = 'pending' | 'confirming' | 'paid' | 'fulfilled' | 'failed' | 'expired' | 'underpaid';

// ========== Status Config ==========
const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  progress: number;
}> = {
  pending: {
    label: 'Awaiting Payment',
    description: 'Complete your payment to proceed with your order',
    icon: <Clock className="h-6 w-6" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10 border-amber-400/30',
    progress: 20,
  },
  confirming: {
    label: 'Confirming Payment',
    description: 'Your payment is being confirmed on the blockchain',
    icon: <Loader2 className="h-6 w-6 animate-spin" />,
    color: 'text-cyan-glow',
    bgColor: 'bg-cyan-glow/10 border-cyan-glow/30',
    progress: 50,
  },
  paid: {
    label: 'Payment Confirmed',
    description: 'Your payment has been confirmed. Preparing your order...',
    icon: <CheckCircle2 className="h-6 w-6" />,
    color: 'text-green-success',
    bgColor: 'bg-green-success/10 border-green-success/30',
    progress: 75,
  },
  fulfilled: {
    label: 'Order Complete',
    description: 'Your digital product is ready for download',
    icon: <Package className="h-6 w-6" />,
    color: 'text-green-success',
    bgColor: 'bg-green-success/10 border-green-success/30',
    progress: 100,
  },
  failed: {
    label: 'Payment Failed',
    description: 'Your payment could not be processed',
    icon: <XCircle className="h-6 w-6" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/30',
    progress: 0,
  },
  expired: {
    label: 'Payment Expired',
    description: 'The payment window has expired. Please try again.',
    icon: <Timer className="h-6 w-6" />,
    color: 'text-orange-warning',
    bgColor: 'bg-orange-warning/10 border-orange-warning/30',
    progress: 0,
  },
  underpaid: {
    label: 'Underpaid',
    description: 'Insufficient amount received. Please contact support.',
    icon: <AlertCircle className="h-6 w-6" />,
    color: 'text-orange-warning',
    bgColor: 'bg-orange-warning/10 border-orange-warning/30',
    progress: 0,
  },
};

// ========== Main Component ==========
export default function OrderStatusPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const orderId = String(params.id);

  // Fetch order data with polling
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery<OrderResponseDto>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orderData = await ordersClient.ordersControllerGetForCheckout({ id: orderId });
      return orderData;
    },
    refetchInterval: (query) => {
      // Poll every 5 seconds for pending/confirming orders
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'confirming') {
        return 5000;
      }
      // Stop polling for completed/failed orders
      return false;
    },
    retry: 3,
  });

  // Derive status
  const orderStatus = (order?.status ?? 'pending') as OrderStatus;
  const statusConfig = STATUS_CONFIG[orderStatus] ?? STATUS_CONFIG.pending;

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // Handle retry payment
  const handleRetryPayment = () => {
    router.push(`/checkout/${orderId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-3xl p-12 text-center max-w-md shadow-glow-cyan-sm"
        >
          <Loader2 className="h-12 w-12 animate-spin text-cyan-glow mx-auto mb-4" />
          <p className="text-text-secondary text-lg">Loading order details...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error !== null || order === null || order === undefined) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-12 text-center max-w-md shadow-glow-error"
        >
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-text-primary mb-3">Order Not Found</h2>
          <p className="text-text-secondary mb-8">
            We couldn&apos;t find this order. It may have been deleted or never existed.
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
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-text-muted hover:text-cyan-glow transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Store</span>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Order Status
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-text-muted">Order ID:</span>
            <code className="px-3 py-1 bg-bg-tertiary rounded-lg font-mono text-sm text-text-secondary">
              {orderId.slice(0, 8)}...{orderId.slice(-4)}
            </code>
            <button
              onClick={() => copyToClipboard(orderId, 'Order ID')}
              className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-cyan-glow"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Main Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-3xl overflow-hidden shadow-card-lg mb-8"
        >
          {/* Status Header */}
          <div className={`p-8 border-b border-border-subtle ${statusConfig.bgColor}`}>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-bg-primary/50 ${statusConfig.color}`}>
                {statusConfig.icon}
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${statusConfig.color}`}>
                  {statusConfig.label}
                </h2>
                <p className="text-text-muted mt-1">{statusConfig.description}</p>
              </div>
              <button
                onClick={() => void refetch()}
                className="p-3 rounded-xl bg-bg-tertiary hover:bg-border-subtle transition-colors text-text-muted hover:text-cyan-glow"
                title="Refresh status"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <Progress value={statusConfig.progress} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-text-muted">
                <span>Created</span>
                <span>Confirming</span>
                <span>Paid</span>
                <span>Delivered</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Order Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Package className="h-5 w-5 text-cyan-glow" />
                  Order Details
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between p-3 rounded-xl bg-bg-tertiary">
                    <span className="text-text-muted">Total</span>
                    <span className="text-xl font-bold text-text-primary">
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between p-3 rounded-xl bg-bg-tertiary">
                    <span className="text-text-muted flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </span>
                    <span className="text-text-secondary truncate max-w-[200px]">
                      {order.email}
                    </span>
                  </div>

                  <div className="flex justify-between p-3 rounded-xl bg-bg-tertiary">
                    <span className="text-text-muted">Created</span>
                    <span className="text-text-secondary">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-neon" />
                  Items
                </h3>

                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div
                      key={item.id ?? idx}
                      className="p-4 rounded-xl bg-bg-tertiary border border-border-subtle"
                    >
                      <p className="font-medium text-text-primary">Digital Product</p>
                      <p className="text-sm text-text-muted mt-1">
                        Product ID: {item.productId.slice(0, 8)}...
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.sourceType}
                        </Badge>
                        {item.signedUrl !== null && item.signedUrl !== undefined && (
                          <Badge className="text-xs bg-green-success/20 text-green-success">
                            Key Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons based on status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {/* Pending - Show pay button */}
          {orderStatus === 'pending' && (
            <Button
              onClick={handleRetryPayment}
              className="h-14 px-8 text-base font-bold bg-cyan-glow text-bg-primary hover:shadow-glow-cyan"
            >
              <Wallet className="h-5 w-5 mr-2" />
              Complete Payment
            </Button>
          )}

          {/* Failed/Expired - Retry */}
          {(orderStatus === 'failed' || orderStatus === 'expired') && (
            <Button
              onClick={handleRetryPayment}
              className="h-14 px-8 text-base font-bold bg-cyan-glow text-bg-primary hover:shadow-glow-cyan"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Try Again
            </Button>
          )}

          {/* Fulfilled - View Keys */}
          {orderStatus === 'fulfilled' && (
            <Link href={`/orders/${orderId}/success`}>
              <Button className="h-14 px-8 text-base font-bold bg-green-success text-bg-primary hover:shadow-glow-success">
                <Package className="h-5 w-5 mr-2" />
                View Your Keys
              </Button>
            </Link>
          )}

          {/* Always show support link */}
          <Link href="/support">
            <Button variant="outline" className="h-14 px-8 text-base border-border-subtle hover:border-cyan-glow/50">
              Need Help?
            </Button>
          </Link>
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-success/10 border border-green-success/30">
            <Shield className="h-4 w-4 text-green-success" />
            <span className="text-sm text-green-success">
              Your payment is secured with blockchain verification
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
