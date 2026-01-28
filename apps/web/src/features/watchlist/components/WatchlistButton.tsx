'use client';

import type React from 'react';
import { Heart, Loader2 } from 'lucide-react';
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update watchlist';
      if (errorMessage === 'LOGIN_REQUIRED') {
        toast.error('Please login to add items to your watchlist', {
          action: {
            label: 'Login',
            onClick: () => window.location.href = '/auth/login',
          },
        });
      } else {
        toast.error(error?.message ?? 'Failed to update watchlist');
      }
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8 min-h-8 min-w-8',
    md: 'h-10 w-10 min-h-10 min-w-10',
    lg: 'h-12 w-12 min-h-12 min-w-12',
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
                'bg-bg-tertiary/50 border border-border-subtle',
                'hover:bg-pink-featured/20 hover:border-pink-featured/50 hover:shadow-glow-pink',
                isInWatchlist && 'text-pink-featured border-pink-featured/50 bg-pink-featured/10',
                isLoading && 'opacity-50 cursor-not-allowed',
                className
              )}
              aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Loader2 size={iconSizes[size]} className="animate-spin text-text-muted" />
                  </motion.div>
                ) : (
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
                        isInWatchlist 
                          ? 'fill-pink-featured text-pink-featured' 
                          : 'text-text-secondary hover:text-pink-featured'
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-bg-tertiary border-border-subtle text-text-primary">
            <p>{isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full button variant
  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'gap-2 transition-all duration-200',
        'border-border-subtle bg-bg-tertiary/50',
        'hover:border-pink-featured/50 hover:bg-pink-featured/10 hover:shadow-glow-pink',
        'active:scale-[0.98]',
        isInWatchlist && 'border-pink-featured/50 bg-pink-featured/10 text-pink-featured',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : (
        <Heart
          size={iconSizes[size]}
          className={cn(
            'transition-colors duration-200',
            isInWatchlist && 'fill-pink-featured text-pink-featured'
          )}
        />
      )}
      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </Button>
  );
}
