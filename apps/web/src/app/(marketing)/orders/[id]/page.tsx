'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrderAccess } from '@/hooks/useOrderAccess';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  ArrowLeft,
  ArrowRight,
  Package,
  Mail,
  Shield,
  Zap,
  RefreshCw,
  Timer,
  Wallet,
  ExternalLink,
  Sparkles,
  Hash,
  Calendar,
  CreditCard,
  ShoppingCart,
  Receipt,
  Box,
  CircleDollarSign,
  Bitcoin,
  Globe,
  User,
  FileText,
  Lock,
  LogIn,
} from 'lucide-react';
import { OrdersApi } from '@bitloot/sdk';
import type { OrderResponseDto, OrderItemResponseDto } from '@bitloot/sdk';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Progress } from '@/design-system/primitives/progress';
import { Alert, AlertDescription } from '@/design-system/primitives/alert';
import { Separator } from '@/design-system/primitives/separator';
import { toast } from 'sonner';
import { apiConfig } from '@/lib/api-config';
import { useClientDateFormat } from '@/hooks/useFormattedDate';

// Initialize SDK clients
const ordersClient = new OrdersApi(apiConfig);

// ========== Types ==========
type OrderStatus = 'created' | 'waiting' | 'pending' | 'confirming' | 'paid' | 'fulfilled' | 'failed' | 'expired' | 'underpaid' | 'refunded' | 'cancelled';

// ========== Status Config ==========
const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  progress: number;
  checkoutButtonLabel?: string;
}> = {
  created: {
    label: 'Order Created',
    description: 'Your order is ready. Complete your payment to proceed.',
    icon: <Clock className="h-6 w-6" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/30',
    progress: 10,
    checkoutButtonLabel: 'Complete Payment',
  },
  waiting: {
    label: 'Waiting for Payment',
    description: 'Waiting for your cryptocurrency payment to be detected',
    icon: <Clock className="h-6 w-6" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/30',
    progress: 25,
    checkoutButtonLabel: 'View Payment Details',
  },
  pending: {
    label: 'Awaiting Payment',
    description: 'Complete your payment to proceed with your order',
    icon: <Clock className="h-6 w-6" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/30',
    progress: 20,
    checkoutButtonLabel: 'Complete Payment',
  },
  confirming: {
    label: 'Confirming Payment',
    description: 'Your payment is being verified on the blockchain',
    icon: <Loader2 className="h-6 w-6 animate-spin" />,
    color: 'text-cyan-glow',
    bgColor: 'bg-cyan-glow/10',
    borderColor: 'border-cyan-glow/30',
    progress: 50,
  },
  paid: {
    label: 'Payment Confirmed',
    description: 'Your payment has been confirmed. Preparing your products...',
    icon: <CheckCircle2 className="h-6 w-6" />,
    color: 'text-green-success',
    bgColor: 'bg-green-success/10',
    borderColor: 'border-green-success/30',
    progress: 75,
  },
  fulfilled: {
    label: 'Order Complete',
    description: 'Your digital products are ready to access',
    icon: <Package className="h-6 w-6" />,
    color: 'text-green-success',
    bgColor: 'bg-green-success/10',
    borderColor: 'border-green-success/30',
    progress: 100,
  },
  failed: {
    label: 'Payment Failed',
    description: 'Your payment could not be processed',
    icon: <XCircle className="h-6 w-6" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    progress: 0,
  },
  expired: {
    label: 'Payment Window Expired',
    description: 'The 1-hour payment window has closed. No funds were charged.',
    icon: <Timer className="h-6 w-6" />,
    color: 'text-orange-warning',
    bgColor: 'bg-orange-warning/10',
    borderColor: 'border-orange-warning/30',
    progress: 0,
  },
  underpaid: {
    label: 'Underpaid',
    description: 'Insufficient amount received. Please contact support.',
    icon: <AlertCircle className="h-6 w-6" />,
    color: 'text-orange-warning',
    bgColor: 'bg-orange-warning/10',
    borderColor: 'border-orange-warning/30',
    progress: 0,
  },
  refunded: {
    label: 'Refunded',
    description: 'This order has been refunded.',
    icon: <XCircle className="h-6 w-6" />,
    color: 'text-purple-neon',
    bgColor: 'bg-purple-neon/10',
    borderColor: 'border-purple-neon/30',
    progress: 0,
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This order has been cancelled.',
    icon: <XCircle className="h-6 w-6" />,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    progress: 0,
  },
};

// ========== Helper Functions ==========
const formatCurrency = (amount: number | string): string => {
  return `€${Number(amount).toFixed(2)}`;
};

const getSourceTypeLabel = (sourceType: string): string => {
  const labels: Record<string, string> = {
    kinguin: 'Instant Delivery',
    custom: 'Digital Product',
    manual: 'Manual Delivery',
  };
  return labels[sourceType?.toLowerCase()] ?? 'Digital Product';
};

const getSourceTypeBadgeColor = (sourceType: string): string => {
  const colors: Record<string, string> = {
    kinguin: 'bg-purple-neon/20 text-purple-neon border-purple-neon/30',
    custom: 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30',
    manual: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
  };
  return colors[sourceType?.toLowerCase()] ?? 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30';
};

// Group order items by productId to show quantity
interface GroupedOrderItem {
  productId: string;
  productTitle: string;
  sourceType: string;
  quantity: number;
  items: Array<{
    id: string;
    signedUrl: object | null;
  }>;
}

const groupOrderItems = (items: OrderItemResponseDto[] | undefined): GroupedOrderItem[] => {
  if (items === undefined || items.length === 0) return [];
  
  const grouped = new Map<string, GroupedOrderItem>();
  
  for (const item of items) {
    const existing = grouped.get(item.productId);
    if (existing !== undefined) {
      existing.quantity += 1;
      existing.items.push({ id: item.id, signedUrl: item.signedUrl });
    } else {
      grouped.set(item.productId, {
        productId: item.productId,
        productTitle: item.productTitle,
        sourceType: item.sourceType,
        quantity: 1,
        items: [{ id: item.id, signedUrl: item.signedUrl }],
      });
    }
  }
  
  return Array.from(grouped.values());
};

// ========== Main Component ==========
export default function OrderStatusPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const orderId = String(params.id);

  // Use client-side date formatting to ensure correct timezone
  const { formatDate } = useClientDateFormat();

  // Fetch order data with polling
  const {
    data: order,
    isLoading,
    error,
    refetch: _refetch,
  } = useQuery<OrderResponseDto>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orderData = await ordersClient.ordersControllerGetForCheckout({ id: orderId });
      return orderData;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 3 seconds for active payment states
      if (status === 'created' || status === 'waiting' || status === 'pending' || status === 'confirming' || status === 'paid') {
        return 3000;
      }
      // Stop polling for terminal states
      return false;
    },
    retry: 3,
  });

  // Check if user can access order keys
  const orderAccess = useOrderAccess(orderId);

  // Derive status
  const orderStatus = (order?.status ?? 'pending') as OrderStatus;
  const statusConfig = STATUS_CONFIG[orderStatus] ?? STATUS_CONFIG.pending;

  // Pagination state for order items
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = React.useState(1);
  const groupedItems = React.useMemo(() => groupOrderItems(order?.items), [order?.items]);
  const totalPages = Math.ceil(groupedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = groupedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Handle go to payment
  const handleGoToPayment = () => {
    router.push(`/checkout/${orderId}`);
  };

  // Handle go to success/products page
  const handleViewProducts = () => {
    router.push(`/orders/${orderId}/success`);
  };

  // Handle retry/new order
  const handleCreateNewOrder = () => {
    router.push('/catalog');
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
          <Loader2 className="h-12 w-12 animate-spin-glow text-cyan-glow mx-auto mb-4" />
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
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6 animate-pulse" />
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

  // Calculate totals
  const itemCount = order.items?.length ?? 0;

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-glow/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-neon/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-green-success/3 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl py-8 md:py-12 px-4">
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

        {/* Header with Order ID */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-tertiary border border-border-subtle mb-4">
            <Receipt className="h-4 w-4 text-cyan-glow" />
            <span className="text-sm text-text-muted">Order Details</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Order Status
          </h1>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary rounded-xl border border-border-subtle">
              <Hash className="h-4 w-4 text-text-muted" />
              <code className="font-mono text-sm text-text-secondary">
                {orderId}
              </code>
              <motion.button
                onClick={() => copyToClipboard(orderId, 'Order ID')}
                className="p-1 rounded-lg hover:bg-bg-secondary transition-all text-text-muted hover:text-cyan-glow"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Copy Order ID"
              >
                <Copy className="h-3.5 w-3.5" />
              </motion.button>
            </div>
            <motion.button
              onClick={() => {
                window.location.reload();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-tertiary border border-border-subtle hover:border-cyan-glow/50 transition-all text-text-muted hover:text-cyan-glow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Refresh</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Main Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass-strong rounded-3xl overflow-hidden shadow-card-lg mb-8 border-2 ${statusConfig.borderColor}`}
        >
          {/* Status Header */}
          <div className={`p-6 md:p-8 ${statusConfig.bgColor} border-b ${statusConfig.borderColor}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <motion.div 
                className={`p-4 rounded-2xl bg-bg-primary/60 backdrop-blur-sm ${statusConfig.color} self-start`}
                animate={{ scale: orderStatus === 'confirming' || orderStatus === 'paid' ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: orderStatus === 'confirming' || orderStatus === 'paid' ? Infinity : 0, duration: 2 }}
              >
                {statusConfig.icon}
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className={`text-2xl md:text-3xl font-bold ${statusConfig.color}`}>
                    {statusConfig.label}
                  </h2>
                  <Badge 
                    variant="outline" 
                    className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} text-xs uppercase tracking-wider`}
                  >
                    {orderStatus}
                  </Badge>
                </div>
                <p className="text-text-muted mt-2 text-base">{statusConfig.description}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <Progress value={statusConfig.progress} className="h-2.5" />
              <div className="flex justify-between mt-3 text-xs text-text-muted">
                <span className={statusConfig.progress >= 20 ? statusConfig.color : ''}>Created</span>
                <span className={statusConfig.progress >= 50 ? statusConfig.color : ''}>Confirming</span>
                <span className={statusConfig.progress >= 75 ? statusConfig.color : ''}>Paid</span>
                <span className={statusConfig.progress >= 100 ? statusConfig.color : ''}>Delivered</span>
              </div>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Order Summary */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-glow/10">
                    <FileText className="h-5 w-5 text-cyan-glow" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Order Summary</h3>
                </div>

                <div className="space-y-3">
                  {/* Order ID */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle hover:border-cyan-glow/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Order ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-text-secondary">
                        {orderId.slice(0, 8)}...{orderId.slice(-4)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(orderId, 'Order ID')}
                        className="p-1 rounded hover:bg-bg-secondary text-text-muted hover:text-cyan-glow transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Status</span>
                    </div>
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Created</span>
                    </div>
                    <span className="text-text-secondary text-sm">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* Updated Date */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Last Updated</span>
                    </div>
                    <span className="text-text-secondary text-sm">
                      {formatDate(order.updatedAt)}
                    </span>
                  </div>

                  {/* Email */}
                  {order.email !== '' && !order.email.includes('@checkout.bitloot.io') && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-text-muted" />
                        <span className="text-text-muted">Email</span>
                      </div>
                      <span className="text-text-secondary text-sm break-all">
                        {order.email}
                      </span>
                    </div>
                  )}

                  {/* User ID if available */}
                  {order.userId !== undefined && order.userId !== null && order.userId.length > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-text-muted" />
                        <span className="text-text-muted">Customer ID</span>
                      </div>
                      <code className="text-xs font-mono text-text-muted">
                        {order.userId.slice(0, 8)}...
                      </code>
                    </div>
                  )}
                </div>

                {/* Payment Details Section */}
                <Separator className="my-6" />
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-success/10">
                    <CreditCard className="h-5 w-5 text-green-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Payment Details</h3>
                </div>

                <div className="space-y-3">
                  {/* Total Amount */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-cyan-glow/5 to-purple-neon/5 border border-cyan-glow/20">
                    <div className="flex items-center gap-3">
                      <CircleDollarSign className="h-5 w-5 text-cyan-glow" />
                      <span className="text-text-primary font-medium">Total Amount</span>
                    </div>
                    <span className="text-2xl font-bold text-cyan-glow tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  {/* Payment Method */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <Bitcoin className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Payment Method</span>
                    </div>
                    <Badge variant="outline" className="uppercase bg-blue-50 text-black  border border-yellow-500/30">
                      <Bitcoin className="h-3 w-3 mr-1" />
                      {order.payCurrency !== undefined && order.payCurrency !== null && order.payCurrency.length > 0
                        ? order.payCurrency.toUpperCase()
                        : 'Crypto'}
                    </Badge>
                  </div>

                  {/* Items Summary */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Items</span>
                    </div>
                    <span className="text-text-secondary">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Fulfillment Source */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Delivery</span>
                    </div>
                    <Badge variant="outline" className={getSourceTypeBadgeColor(order.sourceType)}>
                      {getSourceTypeLabel(order.sourceType)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Items */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-neon/10">
                      <Package className="h-5 w-5 text-purple-neon" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">Order Items</h3>
                    <Badge variant="outline" className="text-xs text-text-muted">
                      {groupedItems.length} product{groupedItems.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  {paginatedItems.map((groupedItem, idx) => (
                    <motion.div
                      key={groupedItem.productId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 rounded-2xl bg-bg-tertiary/50 border border-border-subtle hover:border-purple-neon/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <Box className="h-4 w-4 text-purple-neon shrink-0 mt-0.5" />
                            <span className="font-medium text-text-primary">
                              {groupedItem.productTitle}
                            </span>
                            <Badge className="ml-2 text-xs bg-purple-neon/20 text-purple-neon border border-purple-neon/30">
                              ×{groupedItem.quantity}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {/* Show quantity indicator for multiple items */}
                            {groupedItem.quantity > 1 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Package className="h-3.5 w-3.5 text-text-muted" />
                                <span className="text-text-muted">{groupedItem.quantity} units</span>
                                {orderStatus === 'fulfilled' && groupedItem.items.every(i => i.signedUrl !== null) && (
                                  <span className="text-green-success text-xs flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    All ready
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSourceTypeBadgeColor(groupedItem.sourceType)}`}
                          >
                            {getSourceTypeLabel(groupedItem.sourceType)}
                          </Badge>
                          
                          {orderStatus === 'fulfilled' && groupedItem.quantity === 1 && groupedItem.items[0]?.signedUrl !== null && (
                            <Badge className="text-xs bg-green-success/20 text-green-success border border-green-success/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ready
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {order.items.length === 0 && (
                    <div className="p-8 text-center rounded-2xl bg-bg-tertiary/30 border border-dashed border-border-subtle">
                      <Package className="h-12 w-12 text-text-muted mx-auto mb-3 opacity-50" />
                      <p className="text-text-muted">No items in this order</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle/50">
                    <span className="text-sm text-text-muted">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="text-xs"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="text-xs"
                      >
                        Next
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Status-based Alerts */}
        <AnimatePresence mode="wait">
          {/* Created/Waiting/Pending Order - Info Banner with Checkout Button */}
          {(orderStatus === 'created' || orderStatus === 'waiting' || orderStatus === 'pending') && (
            <motion.div
              key="payment-alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert className="border-amber-400/30 bg-amber-400/10">
                <Clock className="h-5 w-5 text-amber-400" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <span className="text-text-primary">
                    {orderStatus === 'created' 
                      ? 'Your order is ready. Complete your payment to receive your digital products.'
                      : orderStatus === 'waiting'
                        ? 'Waiting for your cryptocurrency payment. Click below to view payment details.'
                        : 'This order is awaiting payment. Complete your purchase to receive your digital products.'}
                  </span>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Confirming/Paid - Processing Banner */}
          {(orderStatus === 'confirming' || orderStatus === 'paid') && (
            <motion.div
              key="processing-alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert className="border-cyan-glow/30 bg-cyan-glow/10">
                <Sparkles className="h-5 w-5 text-cyan-glow animate-pulse" />
                <AlertDescription className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-cyan-glow border-t-transparent animate-spin" />
                  <span className="text-text-primary">
                    {orderStatus === 'confirming' 
                      ? 'Payment detected! Confirming on blockchain. This may take a few minutes...' 
                      : 'Payment confirmed! Preparing your digital products for delivery...'}
                  </span>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Fulfilled - Success Banner */}
          {orderStatus === 'fulfilled' && (
            <motion.div
              key="fulfilled-alert"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <Alert className="border-green-success/50 bg-green-success/20 shadow-glow-success">
                <CheckCircle2 className="h-5 w-5 text-green-success" />
                <AlertDescription>
                  <span className="text-green-success font-medium">
                    🎉 Your order is complete! Your digital products are ready to access.
                  </span>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Failed - Error Banner */}
          {orderStatus === 'failed' && (
            <motion.div
              key="failed-alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert className="border-red-500/30 bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
                <AlertDescription className="text-text-primary">
                  Payment could not be processed. You can retry or contact support for assistance.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Expired - Warning Banner */}
          {orderStatus === 'expired' && (
            <motion.div
              key="expired-alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert className="border-orange-warning/30 bg-orange-warning/10">
                <Timer className="h-5 w-5 text-orange-warning" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-text-primary">
                    <p className="font-medium">Payment window expired</p>
                    <p className="text-sm text-text-muted mt-1">
                      Crypto payments have a 1-hour window. No funds were charged - you can create a new order.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push('/catalog')}
                    className="bg-gradient-to-r from-cyan-glow to-purple-neon text-bg-primary whitespace-nowrap"
                  >
                    Create New Order
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Underpaid - Warning Banner */}
          {orderStatus === 'underpaid' && (
            <motion.div
              key="underpaid-alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert className="border-orange-warning/30 bg-orange-warning/10">
                <AlertCircle className="h-5 w-5 text-orange-warning" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <span className="text-text-primary">
                    Insufficient payment received. Please contact support with your order ID for assistance.
                  </span>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(orderId, 'Order ID')}
                    variant="outline"
                    className="border-orange-warning/50 text-orange-warning hover:bg-orange-warning/10 whitespace-nowrap"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Order ID
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {/* Created/Waiting/Pending - Go to Checkout */}
          {(orderStatus === 'created' || orderStatus === 'waiting' || orderStatus === 'pending') && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleGoToPayment}
                className="h-14 px-8 text-base font-bold bg-cyan-glow text-bg-primary hover:shadow-glow-cyan transition-all animate-glow-pulse"
              >
                <Wallet className="h-5 w-5 mr-2" />
                {statusConfig.checkoutButtonLabel ?? 'Complete Payment'}
              </Button>
            </motion.div>
          )}

          {/* Confirming - Show checkout button with status */}
          {orderStatus === 'confirming' && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleGoToPayment}
                className="h-14 px-8 text-base font-bold bg-cyan-glow text-bg-primary hover:shadow-glow-cyan transition-all"
              >
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                View Payment Status
              </Button>
            </motion.div>
          )}

          {/* Paid - Processing State (no button needed, just waiting) */}
          {orderStatus === 'paid' && (
            <div className="flex items-center gap-3 px-8 py-4 rounded-xl bg-bg-tertiary border border-green-success/30 shadow-glow-success">
              <Loader2 className="h-5 w-5 animate-spin text-green-success" />
              <span className="text-text-secondary font-medium">
                Payment confirmed! Preparing your products...
              </span>
            </div>
          )}

          {/* Fulfilled - Access Products (conditional based on access status) */}
          {orderStatus === 'fulfilled' && (
            <>
              {/* Loading access status */}
              {orderAccess.isLoading && (
                <div className="flex items-center gap-3 px-8 py-4 rounded-xl bg-bg-tertiary border border-border-subtle">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
                  <span className="text-text-secondary font-medium">
                    Checking access...
                  </span>
                </div>
              )}

              {/* Can access - Show button */}
              {!orderAccess.isLoading && orderAccess.canAccess && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleViewProducts}
                    className="h-14 px-8 text-base font-bold bg-green-success text-bg-primary hover:shadow-glow-success transition-all animate-glow-pulse"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Access Your Products
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Not authenticated - Show login prompt */}
              {!orderAccess.isLoading && !orderAccess.canAccess && !orderAccess.isAuthenticated && (
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Link href={`/auth/login?redirect=${encodeURIComponent(`/orders/${orderId}`)}`}>
                    <Button
                      className="h-14 px-8 text-base font-bold bg-amber-500 text-bg-primary hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all"
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      Login to Access Products
                    </Button>
                  </Link>
                  <p className="text-xs text-text-muted text-center max-w-xs">
                    Sign in to verify ownership and access your products
                  </p>
                </motion.div>
              )}

              {/* Authenticated but not owner - Show locked state */}
              {!orderAccess.isLoading && !orderAccess.canAccess && orderAccess.isAuthenticated && (
                <div className="flex flex-col items-center gap-3 px-8 py-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-red-500" />
                    <span className="text-text-secondary font-medium">
                      Access Restricted
                    </span>
                  </div>
                  <p className="text-xs text-text-muted text-center max-w-xs">
                    {orderAccess.message ?? 'You do not have permission to access this order.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Failed - Retry Options */}
          {orderStatus === 'failed' && (
            <>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleGoToPayment}
                  className="h-14 px-8 text-base font-bold bg-cyan-glow text-bg-primary hover:shadow-glow-cyan transition-all"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Retry Payment
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleCreateNewOrder}
                  variant="outline"
                  className="h-14 px-8 text-base border-border-subtle hover:border-cyan-glow/50"
                >
                  <Package className="h-5 w-5 mr-2" />
                  New Order
                </Button>
              </motion.div>
            </>
          )}

          {/* Expired - Start Fresh */}
          {orderStatus === 'expired' && (
            <>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleCreateNewOrder}
                  className="h-14 px-8 text-base font-bold bg-cyan-glow text-bg-primary hover:shadow-glow-cyan transition-all"
                >
                  <Package className="h-5 w-5 mr-2" />
                  Create New Order
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleGoToPayment}
                  variant="outline"
                  className="h-14 px-8 text-base border-border-subtle hover:border-orange-warning/50"
                >
                  <Timer className="h-5 w-5 mr-2" />
                  Try Again
                </Button>
              </motion.div>
            </>
          )}

          {/* Underpaid - Contact Support */}
          {orderStatus === 'underpaid' && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/help">
                <Button className="h-14 px-8 text-base font-bold bg-orange-warning text-bg-primary hover:shadow-glow-error transition-all">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Contact Support
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Always show support link (except underpaid) */}
          {orderStatus !== 'underpaid' && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/help">
                <Button 
                  variant="outline" 
                  className="h-14 px-8 text-base border-border-subtle hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all"
                >
                  Need Help?
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-success/10 border border-green-success/30 shadow-glow-success">
            <Shield className="h-4 w-4 text-green-success" />
            <span className="text-sm text-green-success">
              Secured by blockchain verification • Instant digital delivery
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
