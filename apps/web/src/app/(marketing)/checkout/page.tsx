'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/design-system/primitives/button';
import { toast } from 'sonner';
import {
  Loader2,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { OrdersApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { OrderResponseDto } from '@bitloot/sdk';

// ========== SDK Clients ==========
const ordersClient = new OrdersApi(apiConfig);

// ========== Loading Skeleton ==========
function CheckoutLoadingSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-glow/5 rounded-full blur-[100px]"
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-neon/5 rounded-full blur-[80px]"
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative glass-strong rounded-3xl p-10 text-center max-w-md shadow-card-lg border border-cyan-glow/30"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-cyan-glow via-purple-neon to-cyan-glow" />

        {/* Animated Icon */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-2xl bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 flex items-center justify-center mx-auto mb-6 border border-cyan-glow/30 shadow-glow-cyan-sm"
        >
          <Loader2 className="h-10 w-10 text-cyan-glow animate-spin" />
        </motion.div>

        <h2 className="text-2xl font-bold text-text-primary mb-3">Preparing Your Order</h2>
        <p className="text-text-muted mb-6">Setting up your secure checkout experience...</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-glow"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ========== Empty Cart State ==========
function EmptyCartState(): React.ReactElement {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-glow/5 rounded-full blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-neon/5 rounded-full blur-[80px] animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative glass-strong rounded-3xl p-10 text-center max-w-md shadow-card-lg border border-border-subtle"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-3xl bg-linear-to-br from-cyan-glow/10 to-purple-neon/10 flex items-center justify-center mx-auto mb-6 border border-border-subtle"
        >
          <ShoppingCart className="h-12 w-12 text-text-muted" />
        </motion.div>

        <h2 className="text-2xl font-bold text-text-primary mb-3">Your Cart is Empty</h2>
        <p className="text-text-muted mb-6">
          Discover amazing game keys and start filling your cart with instant digital delivery.
        </p>

        <Link href="/catalog">
          <Button className="bg-linear-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan-lg font-bold text-lg px-8 py-6 group">
            <Sparkles className="mr-2 h-5 w-5" />
            Browse Products
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

// ========== Error State ==========
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }): React.ReactElement {
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

        <h2 className="text-2xl font-bold text-text-primary mb-3">Something Went Wrong</h2>
        <p className="text-text-muted mb-6">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onRetry}
            className="bg-linear-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan-lg font-bold group"
          >
            <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </Button>
          <Link href="/cart">
            <Button variant="outline" className="border-border-accent text-text-secondary hover:text-text-primary">
              Back to Cart
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ========== Main Checkout Page ==========
// This page creates an order from cart items and redirects to /checkout/[id]
// The unified checkout experience is in /checkout/[id]/page.tsx
export default function CheckoutPage(): React.ReactElement {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [hasAttempted, setHasAttempted] = useState(false);
  
  // Use ref to track if order creation is in progress (survives re-renders and strict mode)
  const isCreatingOrderRef = useRef(false);

  // Generate idempotency key from cart items (stable hash based on cart contents)
  const generateIdempotencyKey = (): string => {
    if (items.length === 0) return '';
    // Create a stable hash from cart items: productId:quantity pairs sorted
    const cartSignature = items
      .map((item) => `${item.productId}:${item.quantity}`)
      .sort()
      .join('|');
    // Add timestamp bucket (5-minute windows) to prevent stale matches
    const timeBucket = Math.floor(Date.now() / (5 * 60 * 1000));
    return `${cartSignature}-${timeBucket}`;
  };

  // Create order mutation - creates order and redirects to unified checkout page
  const createOrderMutation = useMutation({
    mutationFn: async (): Promise<OrderResponseDto> => {
      if (items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Build items array for multi-item order support
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      // Get email from user if authenticated, otherwise use placeholder
      // The email will be collected/confirmed on /checkout/[id] page
      const email = user?.email ?? 'pending@checkout.bitloot.io';

      // Generate idempotency key to prevent duplicate orders
      const idempotencyKey = generateIdempotencyKey();

      // Create order with all items
      const order = await ordersClient.ordersControllerCreate({
        createOrderDto: {
          email,
          items: orderItems,
          idempotencyKey,
        },
      });

      if (order?.id === undefined || order.id === '') {
        throw new Error('Failed to create order');
      }

      return order;
    },
    onSuccess: (order: OrderResponseDto) => {
      // Clear cart after successful order creation
      clearCart();
      toast.success('Order created! Proceeding to payment...');
      // Redirect to unified checkout page
      router.replace(`/checkout/${order.id}`);
    },
    onError: (error: Error) => {
      console.error('Failed to create order:', error);
      const errorMessage = error.message !== '' ? error.message : 'Failed to create order. Please try again.';
      toast.error(errorMessage);
      // Reset the ref so user can retry
      isCreatingOrderRef.current = false;
    },
  });

  // Auto-create order when page loads with cart items
  // Using ref to prevent duplicate calls from React Strict Mode double-mount
  useEffect(() => {
    // Guard: Only attempt if we have items and not already creating
    if (items.length > 0 && !isCreatingOrderRef.current && !hasAttempted) {
      isCreatingOrderRef.current = true;
      setHasAttempted(true);
      createOrderMutation.mutate();
    }
  }, [items.length, hasAttempted, createOrderMutation]);

  // Show empty cart state if no items and haven't started processing
  if (items.length === 0 && !createOrderMutation.isPending && !hasAttempted) {
    return <EmptyCartState />;
  }

  // Show error state if order creation failed
  if (createOrderMutation.isError) {
    const errorMsg = createOrderMutation.error?.message;
    return (
      <ErrorState
        message={errorMsg !== undefined && errorMsg !== '' ? errorMsg : 'Failed to create order'}
        onRetry={() => {
          setHasAttempted(false);
          createOrderMutation.reset();
        }}
      />
    );
  }

  // Show loading state while creating order
  return <CheckoutLoadingSkeleton />;
}
