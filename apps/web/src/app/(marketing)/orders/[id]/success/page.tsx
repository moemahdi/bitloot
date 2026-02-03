'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Copy,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Package,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { OrdersApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/design-system/primitives/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Separator } from '@/design-system/primitives/separator';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { toast } from 'sonner';
import { apiConfig } from '@/lib/api-config';
import { Confetti } from '@/components/animations/Confetti';
import { cn } from '@/design-system/utils/utils';
import { KeyReveal } from '@/features/orders';
import { useOrderAccess } from '@/hooks/useOrderAccess';
import { OrderReviewPrompt } from '@/features/reviews';

// Initialize SDK client
const ordersClient = new OrdersApi(apiConfig);

export default function OrderSuccessPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const _queryClient = useQueryClient();
  const orderId = String(params.id);
  const [showConfetti, _setShowConfetti] = useState(true);

  // Check order access status
  const orderAccess = useOrderAccess(orderId);

  const { data, isError, isPending } = useQuery<OrderResponseDto>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const order = await ordersClient.ordersControllerGetForCheckout({ id: orderId });
      return order;
    },
    // Poll every 5 seconds for orders waiting for fulfillment (paid but not fulfilled)
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'paid' || status === 'confirming') {
        return 5000;
      }
      // Stop polling once fulfilled or in terminal state
      return false;
    },
  });

  // NOTE: Sandbox auto-fulfillment trigger removed.
  // Fulfillment is now handled exclusively by:
  // 1. NOWPayments IPN webhook → triggers BullMQ fulfillment job
  // 2. Kinguin order.complete webhook → triggers BullMQ fulfillment job
  // This prevents duplicate fulfillment, double emails, and duplicate key records.

  const copyOrderId = (text: string): void => {
    void navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Check if order is fulfilled and has keys ready
  const isOrderFulfilled = data?.status === 'fulfilled';
  const orderItems = data?.items ?? [];

  if (isPending) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-40 rounded-xl md:col-span-2" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="mx-auto max-w-lg">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Error Loading Order</CardTitle>
              <CardDescription>
                We couldn&apos;t find this order. Please check the URL or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/help">Get Help</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const orderData = data;

  return (
    <>
      <Confetti active={showConfetti} />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto max-w-3xl space-y-8">
          
          {/* Success Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="relative overflow-hidden border-green-success/30 bg-gradient-to-br from-green-success/5 via-cyan-glow/5 to-transparent shadow-glow-success">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-success/10 via-transparent to-transparent" />
              <CardHeader className="relative text-center pb-4">
                <motion.div 
                  className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-success/10 border border-green-success/30 flex items-center justify-center shadow-glow-success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                >
                  <CheckCircle2 className="h-10 w-10 text-green-success animate-pulse" />
                </motion.div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-success to-cyan-glow bg-clip-text text-transparent">
                  Payment Successful!
                </CardTitle>
                <CardDescription className="text-base text-text-muted">
                  Thank you for your purchase. Your order has been confirmed.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pb-6">
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Package className="h-4 w-4" />
                    <span className="font-mono">Order #{orderId.slice(0, 8)}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <div className="flex items-center gap-2 text-text-muted">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(orderData.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-xs font-medium border uppercase tracking-wider",
                      isOrderFulfilled 
                        ? "bg-green-success/10 text-green-success border-green-success/30 shadow-glow-success"
                        : "bg-orange-warning/10 text-orange-warning border-orange-warning/30"
                    )}
                  >
                    {orderData.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Underpayment Alert */}
          {orderData.status === 'underpaid' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Alert variant="destructive" className="border-2">
                <XCircle className="h-5 w-5" />
                <AlertTitle className="text-lg">Payment Underpaid</AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                  <p>
                    The amount received was less than required. Cryptocurrency payments are
                    irreversible and cannot be refunded automatically.
                  </p>
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" size="sm" asChild className="bg-background hover:shadow-glow-cyan transition-shadow">
                        <Link href="/help">
                          <HelpCircle className="mr-2 h-4 w-4" />
                          Contact Support
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <div className="grid gap-8 md:grid-cols-3">
            {/* Main Content - Keys Section */}
            <motion.div 
              className="space-y-6 md:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Preparing Order Message - Shown when paid but not fulfilled */}
              {(orderData.status === 'paid' || orderData.status === 'confirming') && (
                <Alert className="border-orange-warning/20 bg-orange-warning/5">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin-glow rounded-full border-2 border-orange-warning border-t-transparent" />
                    <div>
                      <AlertTitle className="text-orange-warning">Preparing Your Order</AlertTitle>
                      <AlertDescription className="text-orange-warning/70">
                        Your payment is confirmed! We&apos;re now preparing your digital products. This usually takes less than a minute.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Digital Keys - Using KeyReveal Component */}
              {orderItems.length > 0 && (
                <KeyReveal 
                  orderId={orderId}
                  items={orderItems}
                  isFulfilled={isOrderFulfilled}
                  accessStatus={orderAccess.isLoading ? undefined : {
                    canAccess: orderAccess.canAccess,
                    reason: orderAccess.reason,
                    isAuthenticated: orderAccess.isAuthenticated,
                    message: orderAccess.message,
                  }}
                />
              )}

              {/* Security Notice - Only show if user can access keys */}
              {orderAccess.canAccess && (
              <Alert className="border-cyan-glow/20 bg-cyan-glow/5">
                <ShieldCheck className="h-4 w-4 text-cyan-glow" />
                <AlertTitle className="text-cyan-glow">Keep Your Products Secure</AlertTitle>
                <AlertDescription className="text-cyan-glow/70">
                  Save your product codes in a secure location. Don&apos;t share them with anyone. 
                  You can always access them from your order history.
                </AlertDescription>
              </Alert>
              )}

              {/* Review Prompt - Shows for fulfilled orders */}
              <OrderReviewPrompt
                orderId={orderId}
                items={orderItems}
                isOrderFulfilled={isOrderFulfilled}
                accessStatus={orderAccess.isLoading ? undefined : {
                  canAccess: orderAccess.canAccess,
                  reason: orderAccess.reason,
                  isAuthenticated: orderAccess.isAuthenticated,
                  message: orderAccess.message,
                }}
              />
            </motion.div>

            {/* Sidebar */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Order Summary Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Order ID</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs font-mono text-cyan-glow">{orderId.slice(0, 8)}</code>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:text-cyan-glow transition-colors"
                            onClick={() => copyOrderId(orderId)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Email</span>
                      <span className="font-medium truncate max-w-[140px]">{orderData.email}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Items</span>
                      <Badge variant="secondary" className="bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20">{orderItems.length}</Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Total</span>
                      <span className="text-lg font-bold tabular-nums text-green-success">€{parseFloat(orderData.total).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What's Next Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">What&apos;s Next?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <motion.li 
                      className="flex items-start gap-3 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-cyan-glow">1</span>
                      </div>
                      <span className="text-text-muted">Reveal your product codes above</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start gap-3 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-cyan-glow">2</span>
                      </div>
                      <span className="text-text-muted">Copy and redeem on the platform</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start gap-3 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-cyan-glow">3</span>
                      </div>
                      <span className="text-text-muted">Check email for confirmation</span>
                    </motion.li>
                  </ul>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button asChild variant="outline" className="w-full hover:border-cyan-glow/50 hover:shadow-glow-cyan transition-all">
                    <Link href={`/orders/${orderId}`}>
                      <Package className="mr-2 h-4 w-4" />
                      View Order Details
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button asChild variant="ghost" className="w-full hover:text-cyan-glow transition-colors">
                    <Link href="/catalog">
                      Continue Shopping
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </>
  );
}
