'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ShoppingBag, Lock } from 'lucide-react';
import { useState } from 'react';

interface StickyMobileSummaryProps {
  /** Total amount in EUR */
  total: number;
  /** Number of items in order */
  itemCount: number;
  /** Current step label */
  currentStep?: string;
  /** Whether to show the component */
  show?: boolean;
}

/**
 * Sticky mobile order summary that shows total at bottom of screen
 * Expands on tap to show more details
 */
export function StickyMobileSummary({
  total,
  itemCount,
  currentStep = 'Checkout',
  show = true,
}: StickyMobileSummaryProps): React.ReactElement | null {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!show) return null;

  return (
    <>
      {/* Spacer for fixed element */}
      <div className="h-20 lg:hidden" />

      {/* Sticky Summary Bar - Only visible on mobile/tablet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
        {/* Gradient fade effect */}
        <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />

        {/* Main bar */}
        <div className="relative bg-bg-secondary/95 backdrop-blur-xl border-t border-border-subtle shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          {/* Expand/collapse handle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -top-6 left-1/2 -translate-x-1/2 p-1.5 rounded-t-xl bg-bg-secondary border border-b-0 border-border-subtle hover:border-cyan-glow/30 transition-colors group"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp className="h-4 w-4 text-text-muted group-hover:text-cyan-glow transition-colors" />
            </motion.div>
          </button>

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-border-subtle"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Step</span>
                    <span className="text-text-primary font-medium">{currentStep}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Items</span>
                    <span className="text-text-primary font-medium">{itemCount} product{itemCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Lock className="h-3 w-3 text-cyan-glow" />
                    <span>Secure crypto payment • Instant delivery</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main summary row */}
          <div className="px-4 py-4 safe-bottom">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30">
                  <ShoppingBag className="h-5 w-5 text-cyan-glow" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Order Total</p>
                  <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-glow to-purple-neon">
                    €{total.toFixed(2)}
                  </p>
                </div>
              </div>
              
              {/* Item count badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-purple-neon/10 text-sm font-medium text-purple-neon border border-purple-neon/20">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </div>
    </>
  );
}
