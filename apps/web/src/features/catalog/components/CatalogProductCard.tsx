/**
 * Enhanced CatalogProductCard Component
 * 
 * Redesigned product card with variants (default, featured, trending, bundle, flash-deal),
 * hover overlay, quick actions, and badges.
 * 
 * This is the new implementation for the catalog redesign, separate from the legacy ProductCard.
 */
'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { useCheckWatchlist } from '@/features/watchlist/hooks/useWatchlist';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  Heart,
  ShoppingCart,
  Star,
  Eye,
  Zap,
  TrendingUp,
  Package,
  Clock,
  Timer,
  Users,
  Check,
  Sparkles,
} from 'lucide-react';
import type { CatalogProduct, ProductVariant, ViewMode } from '../types';

interface CatalogProductCardProps {
  product: CatalogProduct;
  variant?: ProductVariant;
  viewMode?: ViewMode;
  isInWishlist?: boolean;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  showQuickActions?: boolean;
  className?: string;
  /** Set to true for above-the-fold images (LCP optimization) */
  isPriority?: boolean;
}

// Format price with proper formatting (EUR only)
function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
}

// Calculate time remaining for flash deal
function getTimeRemaining(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

// Badge component for product type
function ProductTypeBadge({ 
  type,
  className,
}: { 
  type: 'featured' | 'trending' | 'bundle' | 'flash-deal' | 'new' | 'bestseller';
  className?: string;
}): React.ReactElement {
  const badgeConfig = {
    'featured': { icon: Sparkles, label: 'Featured', className: 'bg-purple-neon/20 text-purple-neon border-purple-neon/30' },
    'trending': { icon: TrendingUp, label: 'Trending', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    'bundle': { icon: Package, label: 'Bundle', className: 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30' },
    'flash-deal': { icon: Zap, label: 'Flash Deal', className: 'bg-pink-featured/20 text-pink-featured border-pink-featured/30' },
    'new': { icon: Star, label: 'New', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    'bestseller': { icon: TrendingUp, label: 'Best Seller', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  };
  
  const config = badgeConfig[type];
  const Icon = config.icon;
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium border',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// Platform badge
function PlatformBadge({ platform }: { platform: string }): React.ReactElement {
  const platformColors: Record<string, string> = {
    'steam': 'bg-[#1b2838]/80 text-[#66c0f4]',
    'epic': 'text-white bg-white/10',
    'origin': 'bg-orange-500/20 text-orange-400',
    'uplay': 'bg-blue-500/20 text-blue-400',
    'gog': 'bg-purple-500/20 text-purple-400',
    'xbox': 'bg-green-500/20 text-green-400',
    'playstation': 'bg-blue-600/20 text-blue-400',
    'nintendo': 'bg-red-500/20 text-red-400',
  };
  
  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-xs capitalize',
        platformColors[platform.toLowerCase()] ?? 'bg-bg-tertiary text-text-secondary'
      )}
    >
      {platform}
    </Badge>
  );
}

// Discount percentage badge
function DiscountBadge({ percentage }: { percentage: number }): React.ReactElement {
  return (
    <Badge className="bg-green-success text-bg-primary text-xs font-bold">
      -{percentage}%
    </Badge>
  );
}

function CatalogProductCardComponent({
  product,
  variant = 'default',
  viewMode = 'grid',
  isInWishlist: isInWishlistProp = false,
  onAddToCart,
  onToggleWishlist,
  onViewProduct,
  showQuickActions = true,
  className,
  isPriority = false,
}: CatalogProductCardProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Fetch watchlist status from API (same pattern as WatchlistButton)
  const { data: watchlistData } = useCheckWatchlist(product.id);
  // Use API value if available, fall back to prop
  const isInWishlist = watchlistData?.isInWatchlist ?? isInWishlistProp;
  
  // Handle add to cart
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart === undefined || isAddingToCart) return;
    
    setIsAddingToCart(true);
    onAddToCart(product.id);
    // Reset after animation
    setTimeout(() => setIsAddingToCart(false), 1000);
  }, [product.id, onAddToCart, isAddingToCart]);
  
  // Handle wishlist toggle
  const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.(product.id);
  }, [product.id, onToggleWishlist]);
  
  // Handle view product
  const handleViewProduct = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewProduct?.(product.id);
  }, [product.id, onViewProduct]);
  
  // Calculate discount percentage from originalPrice if available
  const parsedPrice = parseFloat(product.price);
  const priceNum = Number.isNaN(parsedPrice) ? 0 : parsedPrice;
  const originalPriceNum = product.originalPrice !== undefined && product.originalPrice !== '' ? parseFloat(product.originalPrice) : undefined;
  const discountPercentage = originalPriceNum !== undefined && originalPriceNum > priceNum
    ? Math.round((1 - priceNum / originalPriceNum) * 100)
    : (product.discount ?? 0);
  
  // Determine if product is on sale
  const isOnSale = discountPercentage > 0;
  
  // Get variant-specific styling
  const variantStyles: Record<ProductVariant, string> = {
    default: '',
    featured: 'ring-2 ring-purple-neon/30 shadow-glow-purple-sm',
    trending: 'ring-2 ring-orange-500/30',
    bundle: 'ring-2 ring-cyan-glow/30 shadow-glow-cyan-sm',
    'flash-deal': 'ring-2 ring-pink-featured/30',
  };
  
  // List view layout
  if (viewMode === 'list') {
    return (
      <Link
        href={`/product/${product.slug}`}
        className={cn(
          'group flex gap-4 rounded-xl border border-border-subtle bg-bg-secondary p-4 transition-all',
          'hover:border-cyan-glow/30 hover:shadow-card-md',
          variantStyles[variant],
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-bg-tertiary">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-bg-tertiary" />
          )}
          <Image
            src={product.image !== undefined && product.image !== '' && product.image.length > 0 ? product.image : '/placeholder-product.jpg'}
            alt={product.name}
            fill
            priority={isPriority}
            className={cn(
              'object-contain transition-all duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              isHovered && 'scale-105'
            )}
            onLoad={() => setImageLoaded(true)}
            sizes="96px"
          />
          {discountPercentage > 0 && (
            <div className="absolute top-1 left-1">
              <DiscountBadge percentage={discountPercentage} />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {product.platform !== undefined && <PlatformBadge platform={product.platform} />}
              {variant !== 'default' && <ProductTypeBadge type={variant} />}
            </div>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-cyan-glow transition-colors cursor-default">
                    {product.name}
                  </h3>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs bg-bg-tertiary border-border-accent text-text-primary text-sm px-3 py-2"
                >
                  {product.name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {product.description !== undefined && product.description !== '' && (
              <p className="text-sm text-text-muted line-clamp-1">{product.description}</p>
            )}
            {/* Rating for list view */}
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-tertiary/50">
                <Star className="h-3 w-3 fill-orange-warning text-orange-warning" aria-hidden="true" />
                <span className="text-xs font-semibold text-text-primary tabular-nums">
                  {Number(product.rating ?? 4.8).toFixed(1)}
                </span>
              </div>
              {product.reviewCount !== undefined && product.reviewCount > 0 && (
                <span className="text-xs text-text-muted">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">
                {formatPrice(product.price)}
              </span>
              {isOnSale && product.originalPrice !== undefined && product.originalPrice !== '' && (
                <span className="text-sm text-text-muted line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            
            {showQuickActions && (
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8',
                          isInWishlist && 'text-pink-featured'
                        )}
                        onClick={handleToggleWishlist}
                      >
                        <Heart className={cn('h-4 w-4', isInWishlist && 'fill-current')} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {onAddToCart !== undefined && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || product.isAvailable !== true}
                    className="h-8 text-xs font-medium border-border-accent bg-bg-tertiary/50 text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/60"
                  >
                    {isAddingToCart ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <>
                        <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                        Cart
                      </>
                    )}
                  </Button>
                )}
                
                {onViewProduct !== undefined && product.isAvailable === true && (
                  <Button
                    size="sm"
                    onClick={handleViewProduct}
                    className="h-8 text-xs font-semibold bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }
  
  // Compact view layout
  if (viewMode === 'compact') {
    return (
      <Link
        href={`/product/${product.slug}`}
        className={cn(
          'group flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-secondary p-3 transition-all',
          'hover:border-cyan-glow/30 hover:shadow-card-sm',
          className
        )}
      >
        {/* Small image */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-bg-tertiary">
          <Image
            src={product.image !== undefined && product.image !== '' && product.image.length > 0 ? product.image : '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-contain"
            sizes="48px"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-cyan-glow transition-colors cursor-default">
                  {product.name}
                </h3>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs bg-bg-tertiary border-border-accent text-text-primary text-sm px-3 py-2"
              >
                {product.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-text-muted">{product.platform}</span>
            <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-bg-tertiary/50">
              <Star className="h-2.5 w-2.5 fill-orange-warning text-orange-warning" aria-hidden="true" />
              <span className="text-[10px] font-semibold text-text-primary tabular-nums">
                {Number(product.rating ?? 4.8).toFixed(1)}
              </span>
            </div>
            {isOnSale && (
              <Badge className="h-4 text-[10px] bg-green-success text-bg-primary px-1">
                -{discountPercentage}%
              </Badge>
            )}
          </div>
        </div>
        
        {/* Price */}
        <div className="shrink-0 text-right">
          <span className="font-semibold text-white">{formatPrice(product.price)}</span>
          {isOnSale && product.originalPrice !== undefined && product.originalPrice !== '' && (
            <span className="block text-xs text-text-muted line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </Link>
    );
  }
  
  // Default grid view
  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary transition-all duration-300',
        'hover:border-cyan-glow/30 hover:shadow-card-lg hover:-translate-y-1',
        variantStyles[variant],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-16/10 overflow-hidden bg-bg-tertiary">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-bg-tertiary" />
        )}
        
        {/* Product image */}
        <Image
          src={product.image !== undefined && product.image !== '' && product.image.length > 0 ? product.image : '/placeholder-product.jpg'}
          alt={product.name}
          fill
          priority={isPriority}
          className={cn(
            'object-contain transition-all duration-500',
            imageLoaded ? 'opacity-100' : 'opacity-0',
            isHovered && 'scale-110'
          )}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* Gradient overlay on hover */}
        <div
          className={cn(
            'absolute inset-0 bg-linear-to-t from-bg-primary/90 via-bg-primary/20 to-transparent transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex flex-wrap gap-1.5">
            {discountPercentage > 0 && (
              <DiscountBadge percentage={discountPercentage} />
            )}
            {variant !== 'default' && <ProductTypeBadge type={variant} />}
            {product.isNew === true && variant === 'default' && <ProductTypeBadge type="new" />}
          </div>
          
          {/* Instant Delivery Badge */}
          <Badge variant="secondary" className="glass text-[10px] px-1.5 py-0.5">
            <Zap className="h-2.5 w-2.5 mr-0.5 text-green-success" aria-hidden="true" />
            Instant
          </Badge>
        </div>
        
        {/* Wishlist button - positioned separately */}
        {showQuickActions && onToggleWishlist !== undefined && (
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'absolute top-3 right-3 rounded-full bg-bg-primary/80 p-2 backdrop-blur-sm transition-all',
              'hover:bg-bg-primary hover:scale-110',
              isInWishlist ? 'text-pink-featured' : 'text-white',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('h-4 w-4', isInWishlist && 'fill-current')} />
          </button>
        )}
        
        {/* Flash deal timer */}
        {variant === 'flash-deal' && product.flashDealEndsAt !== undefined && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-pink-featured/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Timer className="h-3.5 w-3.5" />
            {getTimeRemaining(product.flashDealEndsAt)}
          </div>
        )}
        
        {/* Trending badge with viewers */}
        {variant === 'trending' && product.viewerCount !== undefined && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-orange-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Users className="h-3.5 w-3.5" />
            {product.viewerCount} viewing
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Platform and genre */}
        <div className="mb-2 flex items-center gap-2">
          {product.platform !== undefined && <PlatformBadge platform={product.platform} />}
          {(product.genre ?? product.category) !== undefined && (
            <span className="text-xs text-text-muted capitalize">{product.genre ?? product.category}</span>
          )}
        </div>
        
        {/* Title with Tooltip */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="mb-2 text-sm font-medium text-white line-clamp-2 group-hover:text-cyan-glow transition-colors min-h-9 cursor-default">
                {product.name}
              </h3>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-xs bg-bg-tertiary border-border-accent text-text-primary text-sm px-3 py-2"
            >
              {product.name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Rating - always show with default 4.8 if not provided */}
        <div className="mb-3 flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-tertiary/50">
            <Star className="h-3 w-3 fill-orange-warning text-orange-warning" aria-hidden="true" />
            <span className="text-xs font-semibold text-text-primary tabular-nums">
              {Number(product.rating ?? 4.8).toFixed(1)}
            </span>
          </div>
          {product.reviewCount !== undefined && product.reviewCount > 0 && (
            <span className="text-xs text-text-muted">
              ({product.reviewCount} reviews)
            </span>
          )}
        </div>
        
        {/* Price and action */}
        <div className="mt-auto pt-2 border-t border-border-subtle">
          <div className="flex flex-col mb-3">
            <span className="text-lg font-bold text-white">
              {formatPrice(product.price)}
            </span>
            {isOnSale && product.originalPrice !== undefined && product.originalPrice !== '' && (
              <span className="text-xs text-text-muted line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {/* Action Buttons */}
          {showQuickActions && product.isAvailable === true ? (
            <div className="flex gap-2 w-full">
              {onAddToCart !== undefined && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex-1 h-8 text-xs font-medium border-border-accent bg-bg-tertiary/50 text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/60 hover:bg-bg-tertiary hover:shadow-glow-cyan-sm transition-all duration-200"
                  aria-label={`Add ${product.name} to cart`}
                >
                  {isAddingToCart ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                      Cart
                    </>
                  )}
                </Button>
              )}
              {onViewProduct !== undefined && (
                <Button
                  size="sm"
                  onClick={handleViewProduct}
                  className="flex-1 h-8 text-xs font-semibold bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan active:scale-[0.98] transition-all duration-200"
                  aria-label={`View ${product.name} details`}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
              )}
            </div>
          ) : product.isAvailable !== true ? (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="w-full h-8 text-xs font-medium opacity-50 cursor-not-allowed"
            >
              Out of Stock
            </Button>
          ) : null}
        </div>
        
        {/* Out of stock overlay */}
        {product.isAvailable !== true && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60 backdrop-blur-sm">
            <Badge variant="secondary" className="bg-bg-tertiary text-text-muted">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Out of Stock
            </Badge>
          </div>
        )}
      </div>
    </Link>
  );
}

export const CatalogProductCard = memo(CatalogProductCardComponent);

// Export skeleton for loading states
export function CatalogProductCardSkeleton({ viewMode = 'grid' }: { viewMode?: ViewMode }): React.ReactElement {
  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 rounded-xl border border-border-subtle bg-bg-secondary p-4 animate-pulse">
        <div className="h-24 w-24 shrink-0 rounded-lg bg-bg-tertiary" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-20 rounded bg-bg-tertiary" />
          <div className="h-5 w-3/4 rounded bg-bg-tertiary" />
          <div className="h-4 w-1/2 rounded bg-bg-tertiary" />
        </div>
      </div>
    );
  }
  
  if (viewMode === 'compact') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-secondary p-3 animate-pulse">
        <div className="h-12 w-12 shrink-0 rounded-md bg-bg-tertiary" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-bg-tertiary" />
          <div className="h-3 w-1/2 rounded bg-bg-tertiary" />
        </div>
        <div className="h-5 w-16 rounded bg-bg-tertiary" />
      </div>
    );
  }
  
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-secondary overflow-hidden animate-pulse">
      <div className="aspect-16/10 bg-bg-tertiary" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-20 rounded bg-bg-tertiary" />
        <div className="h-5 w-full rounded bg-bg-tertiary" />
        <div className="h-5 w-3/4 rounded bg-bg-tertiary" />
        <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
          <div className="h-6 w-16 rounded bg-bg-tertiary" />
          <div className="h-8 w-20 rounded bg-bg-tertiary" />
        </div>
      </div>
    </div>
  );
}
