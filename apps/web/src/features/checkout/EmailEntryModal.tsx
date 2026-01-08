'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Mail, Loader2, ArrowRight, Shield, Zap, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OrdersApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { extractCheckoutError } from '@/utils/checkout-error-handler';
import { apiConfig } from '@/lib/api-config';

// Glass design constants matching product page
const GLASS_PANEL = 'bg-[#0A0A0B]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50';
const GLASS_CARD = 'bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle?: string;
  productPrice?: string;
  userEmail?: string;
  isAuthenticated: boolean;
}

const ordersClient = new OrdersApi(apiConfig);

export function EmailEntryModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  productPrice,
  userEmail,
  isAuthenticated,
}: EmailEntryModalProps): React.ReactElement | null {
  const router = useRouter();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: userEmail ?? '',
    },
  });

  // Pre-fill email when user is authenticated
  useState(() => {
    if (userEmail !== undefined && userEmail !== null && userEmail !== '') {
      setValue('email', userEmail);
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (email: string): Promise<OrderResponseDto> => {
      const order = await ordersClient.ordersControllerCreate({
        createOrderDto: {
          email,
          productId,
          captchaToken: captchaToken ?? undefined,
        },
      });
      return order;
    },
  });

  const onSubmit = async (data: EmailFormData): Promise<void> => {
    setError(null);

    // Check for CAPTCHA if enabled (only for non-authenticated users)
    if (!isAuthenticated && typeof process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === 'string' && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '' && (captchaToken === null || captchaToken === '')) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    try {
      const order = await createOrderMutation.mutateAsync(data.email);
      // Navigate to checkout with orderId for payment selection
      router.push(`/checkout/${order.id}`);
    } catch (err) {
      const checkoutError = extractCheckoutError(err);
      setError(checkoutError.message);
    }
  };

  const handleContinue = async (): Promise<void> => {
    if (isAuthenticated && userEmail !== undefined && userEmail !== null && userEmail !== '') {
      await onSubmit({ email: userEmail });
    }
  };

  const isLoading = createOrderMutation.isPending;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={`relative w-full max-w-md rounded-2xl ${GLASS_PANEL}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isLoading}
                className="absolute right-4 top-4 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {isAuthenticated ? 'Confirm Purchase' : 'Enter Your Email'}
                    </h2>
                    <p className="text-sm text-white/60">
                      {isAuthenticated
                        ? 'Proceed to payment'
                        : 'We\'ll send your keys here'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Summary */}
              {((productTitle !== undefined && productTitle !== null && productTitle !== '') || (productPrice !== undefined && productPrice !== null && productPrice !== '')) && (
                <div className={`mx-6 mb-4 rounded-xl p-4 ${GLASS_CARD}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-white/60">Purchasing</p>
                      <p className="text-white font-medium truncate max-w-[200px]">
                        {productTitle ?? 'Product'}
                      </p>
                    </div>
                    {productPrice !== undefined && productPrice !== null && productPrice !== '' && (
                      <div className="text-right">
                        <p className="text-sm text-white/60">Total</p>
                        <p className="text-lg font-bold text-cyan-400">{productPrice}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="px-6 pb-6">
                {isAuthenticated && userEmail !== undefined && userEmail !== null && userEmail !== '' ? (
                  /* Authenticated User Flow */
                  <div className="space-y-4">
                    <div className={`rounded-xl p-4 ${GLASS_CARD}`}>
                      <Label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">
                        Delivery Email
                      </Label>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                          <Check className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{userEmail}</p>
                          <p className="text-xs text-white/50">Verified account</p>
                        </div>
                      </div>
                    </div>

                    {error !== null && error !== '' && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    <Button
                      onClick={handleContinue}
                      disabled={isLoading}
                      className="w-full h-12 text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Non-Authenticated User Flow */
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80">
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        id="email"
                        placeholder="your@email.com"
                        disabled={isLoading}
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                        {...register('email')}
                      />
                      {errors.email !== undefined && errors.email !== null && (
                        <p className="text-sm text-red-400">{errors.email.message}</p>
                      )}
                    </div>

                    {/* CAPTCHA */}
                    {typeof process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === 'string' && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '' && (
                      <div className="flex justify-center">
                        <Turnstile
                          ref={turnstileRef}
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                          onSuccess={(token) => setCaptchaToken(token)}
                          onError={() => {
                            setCaptchaToken(null);
                            setError('CAPTCHA verification failed. Please try again.');
                          }}
                          onExpire={() => setCaptchaToken(null)}
                          options={{
                            theme: 'dark',
                          }}
                        />
                      </div>
                    )}

                    {error !== null && error !== '' && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating Order...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Trust Signals */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/40">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Instant Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
