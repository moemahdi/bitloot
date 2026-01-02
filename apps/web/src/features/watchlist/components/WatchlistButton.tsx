'use client';

import type React from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/design-system/primitives/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import { useToggleWatchlist } from '../hooks/useWatchlist';
import { cn } from '@/design-system/utils/utils';
import { toast } from 'sonner';

interface WatchlistButtonProps {
  productId: string;
  productTitle?: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WatchlistButton({
  productId,
  productTitle = 'Product',
  variant = 'icon',
  size = 'md',
  className,
}: WatchlistButtonProps): React.JSX.Element {
  const { isInWatchlist, isLoading, toggle, error } = useToggleWatchlist(productId);

  const handleClick = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await toggle();
      if (isInWatchlist) {
        toast.success(`Removed "${productTitle}" from watchlist`);
      } else {
        toast.success(`Added "${productTitle}" to watchlist`);
      }
    } catch {
      toast.error(error?.message ?? 'Failed to update watchlist');
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClick}
              disabled={isLoading}
              className={cn(
                sizeClasses[size],
                'rounded-full transition-all duration-200',
                'hover:bg-red-100 dark:hover:bg-red-900/20',
                isInWatchlist && 'text-red-500',
                className
              )}
              aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isInWatchlist ? 'filled' : 'empty'}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Heart
                    size={iconSizes[size]}
                    className={cn(
                      'transition-colors duration-200',
                      isInWatchlist && 'fill-red-500 text-red-500'
                    )}
                  />
                </motion.div>
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full button variant
  return (
    <Button
      variant={isInWatchlist ? 'default' : 'outline'}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'gap-2 transition-all duration-200',
        isInWatchlist && 'bg-red-500 hover:bg-red-600 text-white',
        className
      )}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(isInWatchlist && 'fill-current')}
      />
      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </Button>
  );
}
