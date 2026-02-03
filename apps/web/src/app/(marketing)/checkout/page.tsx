'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { toast } from 'sonner';
import {
  Loader2,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Mail,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { OrdersApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { OrderResponseDto } from '@bitloot/sdk';
import { OfflineBanner } from '@/components/OfflineBanner';
import { parseCheckoutError } from '@/lib/checkout-errors';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';

// Storage key for guest email persistence
const GUEST_EMAIL_STORAGE_KEY = 'bitloot_checkout_guest_email';

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
          Discover amazing digital products and start filling your cart with instant delivery.
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
// Guest users must provide email before proceeding
export default function CheckoutPage(): React.ReactElement {
  const { items, clearCart, appliedPromo, setAppliedPromo } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [hasAttempted, setHasAttempted] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Use ref to track if order creation is in progress (survives re-renders and strict mode)
  const isCreatingOrderRef = useRef(false);

  // CAPTCHA state
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState('');
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  // Check if CAPTCHA is enabled (via environment variable)
  const isCaptchaEnabled = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== undefined && 
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '';

  // Load saved guest email from localStorage on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(GUEST_EMAIL_STORAGE_KEY);
      if (savedEmail !== null && savedEmail !== '') {
        setGuestEmail(savedEmail);
      }
    } catch {
      // localStorage may not be available in some contexts
    }
  }, []);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Get the email to use for the order
  const getOrderEmail = (): string | null => {
    // If user is logged in, use their email
    if (user?.email !== undefined && user.email !== null && user.email !== '') {
      return user.email;
    }
    // Otherwise, use guest email if valid
    if (guestEmail !== '' && validateEmail(guestEmail)) {
      return guestEmail;
    }
    return null;
  };

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

      // Build items array for multi-item order support (including bundle discounts)
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        // Include bundle discount information if present
        discountPercent: item.discountPercent,
        bundleId: item.bundleId,
      }));

      // Get email - must be provided (no more placeholder)
      const email = getOrderEmail();
      if (email === null || email === '') {
        throw new Error('Email is required to proceed with checkout');
      }

      // Generate idempotency key to prevent duplicate orders
      const idempotencyKey = generateIdempotencyKey();

      // Create order with all items (include CAPTCHA token if enabled)
      const order = await ordersClient.ordersControllerCreate({
        createOrderDto: {
          email,
          items: orderItems,
          idempotencyKey,
          promoCode: appliedPromo?.code,
          captchaToken: captchaToken ?? undefined,
        },
      });

      if (order?.id === undefined || order?.id === null || order.id === '') {
        throw new Error('Failed to create order');
      }

      return order;
    },
    onSuccess: (order: OrderResponseDto) => {
      // Clear cart and promo after successful order creation
      clearCart();
      setAppliedPromo(null);
      
      // Save guest email to localStorage for future checkouts
      if (guestEmail !== '' && validateEmail(guestEmail)) {
        try {
          localStorage.setItem(GUEST_EMAIL_STORAGE_KEY, guestEmail);
        } catch {
          // Ignore storage errors
        }
      }
      
      // Store order session token for immediate guest access to keys
      if (order.orderSessionToken !== null && order.orderSessionToken !== undefined && order.orderSessionToken !== '') {
        localStorage.setItem(`order_session_${order.id}`, order.orderSessionToken);
      }
      
      // Prefetch the checkout page for faster navigation
      router.prefetch(`/checkout/${order.id}`);
      
      toast.success('Order created! Proceeding to payment...');
      // Redirect to unified checkout page
      router.replace(`/checkout/${order.id}`);
    },
    onError: (error: Error) => {
      console.error('Failed to create order:', error);
      // Use the error parser for user-friendly messages
      const parsedError = parseCheckoutError(error);
      toast.error(parsedError.message);
      // Reset the ref so user can retry
      isCreatingOrderRef.current = false;
      // Reset CAPTCHA so user can complete it again
      setCaptchaToken(null);
      turnstileRef.current?.reset();
    },
  });

  // Handle guest email submit
  const handleGuestEmailSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setEmailError('');
    setCaptchaError('');
    
    if (guestEmail.trim() === '') {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(guestEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Validate CAPTCHA if enabled
    if (isCaptchaEnabled && (captchaToken === null || captchaToken === '')) {
      setCaptchaError('Please complete the security check');
      return;
    }

    // Proceed with order creation
    if (!isCreatingOrderRef.current) {
      isCreatingOrderRef.current = true;
      setHasAttempted(true);
      createOrderMutation.mutate();
    }
  };

  // Auto-create order when page loads IF user is logged in
  useEffect(() => {
    // Only auto-create if user is logged in with email
    if (items.length > 0 && user?.email !== undefined && user?.email !== null && user.email !== '' && !isCreatingOrderRef.current && !hasAttempted) {
      isCreatingOrderRef.current = true;
      setHasAttempted(true);
      createOrderMutation.mutate();
    }
  }, [items.length, user?.email, hasAttempted, createOrderMutation]);

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
          isCreatingOrderRef.current = false;
          createOrderMutation.reset();
        }}
      />
    );
  }

  // Show loading state while creating order (for logged-in users)
  if (createOrderMutation.isPending || (user?.email !== undefined && user?.email !== null && user.email !== '' && hasAttempted)) {
    return <CheckoutLoadingSkeleton />;
  }

  // Show email collection form for guest users
  if (user?.email === undefined || user?.email === null || user.email === '') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
        {/* Offline Banner */}
        <OfflineBanner message="You're offline. Please reconnect to complete checkout." />
        
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
          className="relative glass-strong rounded-3xl p-8 max-w-md w-full shadow-card-lg border border-cyan-glow/30"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-cyan-glow via-purple-neon to-cyan-glow" />

          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 flex items-center justify-center mx-auto mb-4 border border-cyan-glow/30 shadow-glow-cyan-sm"
            >
              <Mail className="h-8 w-8 text-cyan-glow" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Enter Your Email</h2>
            <p className="text-text-muted text-sm">
              We&apos;ll send your digital products to this email address after payment
            </p>
          </div>

          {/* Cart Summary */}
          <div className="bg-bg-secondary/50 rounded-xl p-4 mb-6 border border-border-subtle">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Items in cart:</span>
              <span className="text-text-primary font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleGuestEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guest-email" className="text-text-secondary">
                Email Address
              </Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="your@email.com"
                value={guestEmail}
                onChange={(e) => {
                  setGuestEmail(e.target.value);
                  setEmailError('');
                }}
                className={`bg-bg-secondary border-border-subtle focus:border-cyan-glow/50 ${
                  emailError !== '' ? 'border-red-error' : ''
                }`}
                disabled={createOrderMutation.isPending}
              />
              {emailError !== '' && (
                <p className="text-red-error text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Turnstile CAPTCHA */}
            {isCaptchaEnabled && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <Shield className="h-4 w-4" />
                  <span>Security Check</span>
                </div>
                <div className="flex justify-center rounded-xl bg-bg-secondary/50 p-3 border border-border-subtle">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
                    onSuccess={(token) => {
                      setCaptchaToken(token);
                      setCaptchaError('');
                    }}
                    onError={() => {
                      setCaptchaToken(null);
                      setCaptchaError('Security check failed. Please try again.');
                    }}
                    onExpire={() => {
                      setCaptchaToken(null);
                      setCaptchaError('Security check expired. Please complete it again.');
                    }}
                    options={{
                      theme: 'dark',
                      size: 'normal',
                    }}
                  />
                </div>
                {captchaError !== '' && (
                  <p className="text-red-error text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {captchaError}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={createOrderMutation.isPending || (isCaptchaEnabled && captchaToken === null)}
              className="w-full bg-linear-to-r from-cyan-glow to-purple-neon text-bg-primary hover:shadow-glow-cyan-lg font-bold text-lg py-6 group"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Continue to Payment
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Already have an account?{' '}
              <Link href="/login?returnUrl=/checkout" className="text-cyan-glow hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback loading state
  return <CheckoutLoadingSkeleton />;
}
