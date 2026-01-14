'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, ChevronDown, ChevronUp, LogIn, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/design-system/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Separator } from '@/design-system/primitives/separator';
import { ReviewForm } from './ReviewForm';
import { useCanReviewOrder } from '../hooks/useReviews';
import type { OrderItemResponseDto } from '@bitloot/sdk';

interface OrderAccessStatus {
  canAccess: boolean;
  reason: string;
  isAuthenticated: boolean;
  message?: string;
}

interface OrderReviewPromptProps {
  orderId: string;
  items: OrderItemResponseDto[];
  isOrderFulfilled: boolean;
  /** Full access status from useOrderAccess hook */
  accessStatus?: OrderAccessStatus;
  /** @deprecated Use accessStatus instead */
  isAuthenticated?: boolean;
}

export function OrderReviewPrompt({
  orderId,
  items,
  isOrderFulfilled,
  accessStatus,
  isAuthenticated: isAuthenticatedProp = false,
}: OrderReviewPromptProps): React.ReactElement | null {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  
  const canReviewQuery = useCanReviewOrder(orderId);

  // Determine if user can access based on accessStatus or fallback to isAuthenticated prop
  const canAccess = accessStatus?.canAccess ?? isAuthenticatedProp;
  const isAuthenticated = accessStatus?.isAuthenticated ?? isAuthenticatedProp;
  const hasSessionToken = accessStatus?.reason === 'session_token';

  // Don't show if order isn't fulfilled
  if (!isOrderFulfilled) {
    return null;
  }

  // Show login prompt if user can't access (no auth AND no session token)
  if (!canAccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border-subtle bg-gradient-to-br from-bg-tertiary/50 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-cyan-glow/10 flex items-center justify-center shrink-0">
                <Lock className="h-6 w-6 text-cyan-glow" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-text-primary">Login to Leave a Review</h3>
                <p className="text-sm text-text-muted">
                  {accessStatus?.message ?? 'Sign in to your account to share your experience and help other customers.'}
                </p>
              </div>
              <Button asChild className="shrink-0 gap-2">
                <Link href={`/auth/login?redirect=/orders/${orderId}/success`}>
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Don't show if can't review (already reviewed, etc.)
  if (!canReviewQuery.data?.canReview) {
    return null;
  }

  const handleReviewSuccess = () => {
    setIsReviewSubmitted(true);
    setIsExpanded(false);
  };

  if (isReviewSubmitted) {
    return (
      <Card className="border-green-success/20 bg-gradient-to-br from-green-success/5 to-transparent">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-green-success/10 flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-green-success fill-green-success" />
            </div>
            <h3 className="font-semibold text-lg">Thank You for Your Reviews!</h3>
            <p className="text-sm text-muted-foreground">
              Your feedback helps other customers make informed decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="space-y-4"
    >
      <Card className="border-green-success/20 bg-gradient-to-br from-green-success/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-green-success/10 flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 text-green-success fill-green-success" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Rate Your Purchase</CardTitle>
              <CardDescription>
                Share your experience with your order. Your review helps other customers!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show items in the order */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Items in your order:</p>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id} className="text-sm flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  {item.productSlug ? (
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                    >
                      {item.productTitle}
                    </Link>
                  ) : (
                    <span>{item.productTitle}</span>
                  )}
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground">(×{item.quantity})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Single review button/form for entire order */}
          {!isExpanded ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsExpanded(true)}
              className="w-full gap-2"
            >
              <Star className="h-5 w-5" />
              Write Review for This Order
              <ChevronDown className="h-4 w-4" />
            </Button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ReviewForm
                  orderId={orderId}
                  productId={undefined} // No specific product - review is for the order
                  productName={items.length === 1 ? items[0]?.productTitle ?? undefined : undefined}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setIsExpanded(false)}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
