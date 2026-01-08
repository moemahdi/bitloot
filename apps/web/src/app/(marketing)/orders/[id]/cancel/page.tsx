'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  XCircle,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  HelpCircle,
  Clock,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/design-system/primitives/button';

export default function OrderCancelPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const orderId = String(params.id);

  const handleRetryPayment = () => {
    router.push(`/checkout/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-orange-warning/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-neon/5 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="glass-strong rounded-3xl overflow-hidden shadow-card-lg">
          {/* Header */}
          <div className="p-8 text-center border-b border-border-subtle bg-orange-warning/5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-full bg-orange-warning/10 flex items-center justify-center mb-6"
            >
              <XCircle className="h-10 w-10 text-orange-warning" />
            </motion.div>

            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
              Payment Cancelled
            </h1>
            <p className="text-text-muted">
              Your payment was not completed. Don&apos;t worry - your order is still saved and you can try again.
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Why section */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
                What happened?
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-tertiary">
                  <Clock className="h-5 w-5 text-text-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-text-primary text-sm font-medium">Payment timed out</p>
                    <p className="text-text-muted text-xs">
                      Crypto payments expire after a set time if not completed
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-tertiary">
                  <CreditCard className="h-5 w-5 text-text-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-text-primary text-sm font-medium">Cancelled manually</p>
                    <p className="text-text-muted text-xs">
                      You may have closed the payment page before completing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order ID */}
            <div className="mb-8 p-4 rounded-xl bg-bg-tertiary border border-border-subtle">
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Order ID</span>
                <code className="text-text-secondary font-mono text-sm">
                  {orderId.slice(0, 8)}...{orderId.slice(-4)}
                </code>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleRetryPayment}
                className="w-full h-14 text-base font-bold bg-cyan-glow text-bg-primary hover:shadow-glow-cyan"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Try Payment Again
              </Button>

              <Link href="/catalog" className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 border-border-subtle hover:border-cyan-glow/50"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="p-4 rounded-xl bg-purple-neon/5 border border-purple-neon/20">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-purple-neon mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-neon">Need assistance?</p>
                  <p className="text-xs text-text-muted mt-1">
                    If you sent a payment but it shows as cancelled, please{' '}
                    <Link href="/support" className="text-cyan-glow hover:underline">
                      contact support
                    </Link>{' '}
                    with your order ID.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <Link
            href={`/orders/${orderId}`}
            className="inline-flex items-center gap-2 text-text-muted hover:text-cyan-glow transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            View Order Status
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
