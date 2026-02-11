'use client';

import { Minus, Plus, Trash2, Percent, Gift, Heart, Package } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/design-system/utils/utils';
import { useCheckWatchlist } from '@/features/watchlist/hooks/useWatchlist';
import { toast } from 'sonner';

interface CartItemRowProps {
  productId: string;
  slug?: string;
  title: string;
  price: number;           // Original price
  quantity: number;
  image?: string;
  discountPercent?: number; // 0-100, for bundle discounts
  bundleId?: string;        // If from a bundle
  platform?: string;
  category?: string;        // Genre/category for display
  isRemoving?: boolean;
  /** Override from parent (e.g., for immediate feedback after save) */
  isInWatchlistOverride?: boolean;
  /** Maximum quantity available (from real-time stock) */
  maxQuantity?: number;
  /** Stock warning message to display */
  stockWarning?: string;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
  onSaveForLater?: () => void;
}

export function CartItemRow({
  productId,
  slug,
  title,
  price,
  quantity,
  image,
  discountPercent,
  bundleId,
  platform,
  category,
  isRemoving = false,
  isInWatchlistOverride,
  maxQuantity,
  stockWarning,
  onRemove,
  onQuantityChange,
  onSaveForLater,
}: CartItemRowProps): React.ReactElement {
  // Fetch watchlist status from API (same pattern as CatalogProductCard)
  const { data: watchlistData } = useCheckWatchlist(productId);
  // Use API value if available, fall back to override prop
  const isInWatchlist = watchlistData?.isInWatchlist ?? isInWatchlistOverride ?? false;
  
  const hasDiscount = (discountPercent ?? 0) > 0;
  const discountedPrice = hasDiscount ? price * (1 - (discountPercent ?? 0) / 100) : price;
  const itemTotal = discountedPrice * quantity;

  // Generate product URL
  const productUrl = slug !== undefined ? `/product/${slug}` : `/product/${productId}`;

  const handleDecrement = (): void => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = (): void => {
    // Respect max quantity limit if set
    if (maxQuantity !== undefined && quantity >= maxQuantity) return;
    onQuantityChange(quantity + 1);
  };

  // Check if we're at or over the stock limit
  const isAtStockLimit = maxQuantity !== undefined && quantity >= maxQuantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 1, x: 0 }}
      animate={{ 
        opacity: isRemoving ? 0 : 1, 
        x: isRemoving ? -100 : 0,
        height: isRemoving ? 0 : 'auto'
      }}
      exit={{ opacity: 0, x: -100, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "group relative flex gap-4 p-4 rounded-xl",
        "bg-bg-secondary/60 backdrop-blur-sm border border-border-subtle",
        "hover:border-cyan-glow/30 hover:shadow-glow-cyan-sm",
        "transition-all duration-300"
      )}
    >
      {/* Product Image - Clickable */}
      <Link 
        href={productUrl}
        className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-bg-tertiary rounded-lg overflow-hidden border border-border-subtle/50 hover:border-cyan-glow/50 transition-colors"
      >
        {image !== undefined && image.length > 0 ? (
          <Image
            src={image}
            alt={title}
            width={96}
            height={96}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <Package className="h-8 w-8" />
          </div>
        )}
      </Link>

      {/* Middle: Product Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Title - Clickable */}
        <Link href={productUrl} className="block group/title">
          <h3 className="font-semibold text-sm sm:text-base text-text-primary group-hover/title:text-cyan-glow transition-colors line-clamp-2 pr-20">
            {title}
          </h3>
        </Link>

        {/* Badges Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Platform/Category Badge */}
          {platform !== null && platform !== undefined && platform !== '' ? (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 capitalize">
              {platform}
            </span>
          ) : category !== null && category !== undefined && category !== '' ? (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded bg-purple-neon/10 text-purple-neon border border-purple-neon/30 capitalize">
              {category}
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded bg-bg-tertiary text-text-muted border border-border-subtle/50">
              Digital Key
            </span>
          )}
          
          {/* Bundle Badge */}
          {bundleId !== null && bundleId !== undefined && bundleId !== '' && (
            <Badge className="text-[10px] sm:text-xs bg-pink-featured/10 text-pink-featured border-pink-featured/30 gap-0.5 px-1.5 py-0.5">
              <Gift className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Bundle
            </Badge>
          )}
          
          {/* Discount Badge */}
          {hasDiscount && (
            <Badge className="text-[10px] sm:text-xs bg-green-success/10 text-green-success border-green-success/30 gap-0.5 px-1.5 py-0.5">
              <Percent className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {discountPercent}% OFF
            </Badge>
          )}
        </div>

        {/* Price & Quantity Row */}
        <div className="flex items-center gap-3 pt-1">
          {/* Price */}
          <div className="flex items-center gap-1.5">
            {hasDiscount ? (
              <>
                <span className="text-xs text-text-muted line-through">€{price.toFixed(2)}</span>
                <span className="text-sm font-semibold text-green-success">€{discountedPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-sm text-text-secondary">€{price.toFixed(2)}</span>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-0.5 bg-bg-tertiary rounded-md p-0.5 border border-border-subtle">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              className="h-6 w-6 p-0 text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/10 disabled:opacity-30"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-xs font-semibold text-text-primary">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleIncrement}
              aria-label="Increase quantity"
              disabled={isAtStockLimit}
              className="h-6 w-6 p-0 text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title={isAtStockLimit ? `Only ${maxQuantity} available` : undefined}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Stock Warning */}
        {stockWarning !== undefined && stockWarning !== '' && (
          <p className="text-[10px] sm:text-xs text-orange-warning font-medium mt-1">
            {stockWarning}
          </p>
        )}
      </div>

      {/* Right: Total & Actions */}
      <div className="shrink-0 flex flex-col items-end justify-between">
        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {onSaveForLater !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (isInWatchlist) {
                  toast.info('Already saved to wishlist');
                  return;
                }
                onSaveForLater();
              }}
              aria-label={isInWatchlist ? "Already saved" : "Save for later"}
              className={cn(
                "h-7 w-7 p-0",
                isInWatchlist 
                  ? "text-pink-featured" 
                  : "text-text-muted hover:text-pink-featured hover:bg-pink-featured/10"
              )}
              title={isInWatchlist ? "Already in wishlist" : "Save for later"}
            >
              <Heart className={cn("h-3.5 w-3.5", isInWatchlist && "fill-current")} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={`Remove ${title} from cart`}
            className="h-7 w-7 p-0 text-text-muted hover:text-red-500 hover:bg-red-500/10"
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Item Total */}
        <div className="text-right">
          <p className="text-base sm:text-lg font-bold text-cyan-glow">€{itemTotal.toFixed(2)}</p>
          {quantity > 1 && (
            <p className="text-[10px] sm:text-xs text-text-muted">×{quantity}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
