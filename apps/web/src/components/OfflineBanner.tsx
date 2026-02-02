'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OfflineBannerProps {
  /** Custom message to show when offline */
  message?: string;
  /** Whether to show the refresh button */
  showRefresh?: boolean;
}

/**
 * Banner component that appears when the user is offline
 * Automatically hides when connection is restored
 */
export function OfflineBanner({
  message = 'You appear to be offline. Some features may not work.',
  showRefresh = true,
}: OfflineBannerProps): React.ReactElement | null {
  const isOnline = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-orange-warning/95 backdrop-blur-sm text-bg-primary px-4 py-3 shadow-lg"
        >
          <div className="container mx-auto flex items-center justify-center gap-3 text-sm font-medium">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>{message}</span>
            {showRefresh && (
              <button
                onClick={() => window.location.reload()}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-bg-primary/20 hover:bg-bg-primary/30 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
