/**
 * RecommendedForYou Component
 * 
 * Compact carousel section displaying featured products (isFeatured: true).
 * Designed to be placed above the footer on all marketing pages except the homepage.
 * Max 24 products, auto-fetching from CatalogApi.
 */
'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Skeleton } from '@/design-system/primitives/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  Package,
  ArrowRight,
  Zap,
  ShoppingCart,
  Eye,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { CatalogApi, Configuration } from '@bitloot/sdk';
import type { ProductResponseDto, ProductListResponseDto } from '@bitloot/sdk';

// ============================================================================
// TYPES
// ============================================================================

interface RecommendedForYouProps {
  /** Maximum number of products to display (default: 24) */
  maxProducts?: number;
  /** Optional callback when clicking view all */
  onViewAll?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Title override */
  title?: string;
  /** Subtitle override */
  subtitle?: string;
  /** Auto-scroll interval in ms (default: 5000, set to 0 to disable) */
  autoScrollInterval?: number;
}

// ============================================================================
// API CONFIGURATION
// ============================================================================

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

const catalogApi = new CatalogApi(apiConfig);

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (Number.isNaN(numPrice)) return '€0.00';
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
}

// ============================================================================
// COMPACT PRODUCT CARD (Inline for this section)
// ============================================================================

// Platform badge colors matching CatalogProductCard
const platformColors: Record<string, string> = {
  steam: 'bg-sky-500/20 text-sky-400',
  epic: 'bg-slate-500/20 text-slate-300',
  gog: 'bg-purple-500/20 text-purple-400',
  ubisoft: 'bg-blue-500/20 text-blue-400',
  xbox: 'bg-green-500/20 text-green-400',
  playstation: 'bg-blue-600/20 text-blue-400',
  nintendo: 'bg-red-500/20 text-red-400',
  origin: 'bg-orange-500/20 text-orange-400',
  'battle.net': 'bg-blue-400/20 text-blue-300',
  rockstar: 'bg-yellow-500/20 text-yellow-400',
  windows: 'bg-cyan-500/20 text-cyan-400',
  other: 'bg-bg-tertiary text-text-secondary',
};

interface CompactProductCardProps {
  product: ProductResponseDto;
  className?: string;
}

function CompactProductCard({ product, className }: CompactProductCardProps): React.ReactElement {
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addItem } = useCart();
  
  // Price handling
  const priceValue = product.price;
  const currentPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : 0;
  const displayPrice = Number.isNaN(currentPrice) ? 0 : currentPrice;
  
  // Original price & discount handling
  const originalPriceValue = (product as { originalPrice?: string }).originalPrice;
  const hasOriginalPrice = typeof originalPriceValue === 'string' && originalPriceValue.length > 0;
  const originalPrice = hasOriginalPrice ? parseFloat(originalPriceValue) : 0;
  const isOnSale = hasOriginalPrice && originalPrice > displayPrice && !Number.isNaN(originalPrice);
  const discountPercentage = isOnSale ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  
  // Image handling
  const imageUrl = product.imageUrl;
  const hasValidImage = typeof imageUrl === 'string' && imageUrl.length > 0 && !imageError;
  
  // Platform handling
  const platformValue = product.platform;
  const hasPlatform = typeof platformValue === 'string' && platformValue.length > 0;
  const platformKey = hasPlatform ? platformValue.toLowerCase() : 'other';
  
  // Category/genre handling
  const categoryValue = (product as { category?: string; genre?: string }).genre ?? (product as { category?: string }).category;
  const hasCategory = typeof categoryValue === 'string' && categoryValue.length > 0;
  
  // Rating handling - default to 4.8 if not provided (like catalog cards)
  const ratingValue = product.rating;
  const displayRating = typeof ratingValue === 'number' && !Number.isNaN(ratingValue) && ratingValue > 0 ? ratingValue : 4.8;
  
  // Review count handling
  const reviewCountValue = (product as { reviewCount?: number }).reviewCount;
  const hasReviewCount = typeof reviewCountValue === 'number' && reviewCountValue > 0;
  
  // Handle add to cart - integrated with CartContext
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    // Add to cart via CartContext
    addItem({
      productId: product.id,
      title: product.title,
      price: displayPrice,
      quantity: 1,
      image: imageUrl,
      platform: hasPlatform ? platformValue : undefined,
      category: hasCategory ? categoryValue : undefined,
    });
    
    toast.success(`${product.title} added to cart`);
    
    // Reset button state after animation
    setTimeout(() => setIsAddingToCart(false), 1500);
  }, [isAddingToCart, addItem, product.id, product.title, displayPrice, imageUrl, hasPlatform, platformValue, hasCategory, categoryValue]);
  
  return (
    <div
      className={cn(
        'group flex flex-col rounded-xl overflow-hidden bg-bg-secondary border border-border-subtle',
        'transition-all duration-300 hover:border-cyan-glow/30 hover:shadow-card-lg hover:-translate-y-1',
        className
      )}
    >
      {/* Clickable Image & Content Area */}
      <Link
        href={`/product/${product.slug}`}
        className="flex flex-col flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-inset"
        aria-label={`View ${product.title} - ${formatPrice(displayPrice)}`}
      >
        {/* Image Container */}
        <div className="relative aspect-16/10 overflow-hidden bg-bg-tertiary">
          {hasValidImage ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-text-muted" aria-hidden="true" />
            </div>
          )}
          
          {/* Top badges - Discount & Featured */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
            <div className="flex flex-wrap gap-1.5">
              {discountPercentage > 0 && (
                <Badge className="bg-green-success text-bg-primary text-[10px] font-bold px-1.5">
                  -{discountPercentage}%
                </Badge>
              )}
            </div>
            
            {/* Instant Delivery Badge */}
            <Badge variant="secondary" className="glass text-[10px] px-1.5 py-0.5">
              <Zap className="h-2.5 w-2.5 mr-0.5 text-green-success" aria-hidden="true" />
              Instant
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex flex-1 flex-col p-3">
          {/* Platform & Category */}
          <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
            {hasPlatform && (
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-[10px] capitalize',
                  platformColors[platformKey] ?? 'bg-bg-tertiary text-text-secondary'
                )}
              >
                {platformValue}
              </Badge>
            )}
            {hasCategory && (
              <span className="text-[10px] text-text-muted capitalize">{categoryValue}</span>
            )}
          </div>
          
          {/* Title with Tooltip */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="mb-1.5 text-sm font-medium text-text-primary line-clamp-2 min-h-9 group-hover:text-cyan-glow transition-colors cursor-default">
                  {product.title}
                </h3>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs bg-bg-tertiary border-border-accent text-text-primary text-sm px-3 py-2"
              >
                {product.title}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Rating */}
          <div className="mb-2 flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-bg-tertiary/50">
              <Star className="h-3 w-3 fill-orange-warning text-orange-warning" aria-hidden="true" />
              <span className="text-xs font-semibold text-text-primary tabular-nums">
                {displayRating.toFixed(1)}
              </span>
            </div>
            {hasReviewCount && (
              <span className="text-[10px] text-text-muted">({reviewCountValue})</span>
            )}
          </div>
          
          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-text-primary">
                {formatPrice(displayPrice)}
              </span>
              {isOnSale && (
                <span className="text-xs text-text-muted line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      {/* Action Buttons - Outside of Link */}
      <div className="px-3 pb-3 pt-2 border-t border-border-subtle flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="flex-1 h-7 text-xs font-medium border-border-accent bg-bg-tertiary/50 text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/60 hover:bg-bg-tertiary hover:shadow-glow-cyan-sm transition-all duration-200"
          aria-label={`Add ${product.title} to cart`}
        >
          {isAddingToCart ? (
            <Check className="h-3.5 w-3.5 text-green-success" />
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5 mr-1" />
              Cart
            </>
          )}
        </Button>
        
        <Button
          size="sm"
          asChild
          className="flex-1 h-7 text-xs font-semibold bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan"
        >
          <Link href={`/product/${product.slug}`}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function CompactProductCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-lg overflow-hidden bg-bg-secondary border border-border-subtle">
      <Skeleton className="aspect-4/3 w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecommendedForYou({
  maxProducts = 24,
  onViewAll,
  className,
  title = 'Recommended For You',
  subtitle = 'Handpicked featured products',
  autoScrollInterval = 5000,
}: RecommendedForYouProps): React.ReactElement | null {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [activeSegment, setActiveSegment] = useState(0);
  const [totalSegments, setTotalSegments] = useState(1);
  
  // Fetch featured products
  const { data, isLoading, error } = useQuery<ProductListResponseDto>({
    queryKey: ['recommended-featured-products', maxProducts],
    queryFn: async () => {
      const response = await catalogApi.catalogControllerGetFeaturedProducts({
        limit: maxProducts,
      });
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const products: ProductResponseDto[] = useMemo(() => {
    if (data === null || data === undefined) return [];
    return data.data ?? [];
  }, [data]);
  
  // Check scroll state
  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container === null) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
    
    // Calculate segments based on visible cards
    const cardWidth = 200; // Approximate card width + gap
    const visibleCards = Math.floor(container.clientWidth / cardWidth);
    const segments = Math.max(1, Math.ceil(products.length / Math.max(1, visibleCards)));
    setTotalSegments(segments);
    
    // Calculate active segment
    const scrollProgress = container.scrollLeft / (container.scrollWidth - container.clientWidth);
    const currentSegment = Math.min(segments - 1, Math.floor(scrollProgress * segments));
    setActiveSegment(Number.isNaN(currentSegment) ? 0 : currentSegment);
  }, [products.length]);
  
  // Initialize scroll state
  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [checkScrollState, products]);
  
  // Scroll functions
  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container === null) return;
    
    const cardWidth = 200; // Compact card width + gap
    const scrollAmount = direction === 'left' ? -cardWidth * 3 : cardWidth * 3;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);
  
  // Scroll to specific segment
  const scrollToSegment = useCallback((segmentIndex: number) => {
    const container = scrollContainerRef.current;
    if (container === null || totalSegments <= 1) return;
    
    const maxScroll = container.scrollWidth - container.clientWidth;
    const targetScroll = (segmentIndex / (totalSegments - 1)) * maxScroll;
    
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }, [totalSegments]);
  
  // Auto-scroll functionality
  useEffect(() => {
    if (autoScrollInterval <= 0 || isAutoScrollPaused || products.length === 0) {
      return;
    }
    
    const intervalId = setInterval(() => {
      const container = scrollContainerRef.current;
      if (container === null) return;
      
      const cardWidth = 200; // Compact card width + gap
      const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
      
      if (isAtEnd) {
        // Reset to start when reaching the end
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll to next set of cards
        container.scrollBy({ left: cardWidth * 2, behavior: 'smooth' });
      }
    }, autoScrollInterval);
    
    return () => clearInterval(intervalId);
  }, [autoScrollInterval, isAutoScrollPaused, products.length]);
  
  // Don't render if no products and not loading
  if (!isLoading && products.length === 0) {
    return null;
  }
  
  // Don't render on error
  if (error !== null && error !== undefined) {
    console.error('Failed to load recommended products:', error);
    return null;
  }
  
  return (
    <section
      className={cn(
        'relative py-8 px-4 md:px-6 lg:px-8 bg-bg-secondary/50 border-t border-border-subtle',
        className
      )}
      aria-labelledby="recommended-for-you-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-neon/20 shadow-glow-purple-sm">
              <Sparkles className="h-4 w-4 text-purple-neon" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="recommended-for-you-heading"
                className="text-lg font-semibold text-text-primary"
              >
                {title}
              </h2>
              <p className="text-sm text-text-muted">{subtitle}</p>
            </div>
          </div>
          
          {/* Navigation & View All */}
          <div className="flex items-center gap-3">
            {/* Scroll Navigation */}
            <div className="hidden sm:flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="h-8 w-8 rounded-full border-border-subtle bg-bg-tertiary disabled:opacity-30 hover:border-cyan-glow/60"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="h-8 w-8 rounded-full border-border-subtle bg-bg-tertiary disabled:opacity-30 hover:border-cyan-glow/60"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* View All Link */}
            <Link
              href="/catalog?featured=true"
              onClick={onViewAll}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium text-cyan-glow',
                'hover:text-cyan-glow/80 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary rounded-md px-2 py-1'
              )}
            >
              View All
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        
        {/* Carousel Container */}
        <div
          className="relative"
          onMouseEnter={() => setIsAutoScrollPaused(true)}
          onMouseLeave={() => setIsAutoScrollPaused(false)}
        >
          {/* Left gradient fade */}
          <div
            className={cn(
              'pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-linear-to-r from-bg-secondary/50 to-transparent transition-opacity',
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden="true"
          />
          
          {/* Right gradient fade */}
          <div
            className={cn(
              'pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-linear-to-l from-bg-secondary/50 to-transparent transition-opacity',
              canScrollRight ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden="true"
          />
          
          {/* Products Carousel */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollState}
            className={cn(
              'flex gap-3 overflow-x-auto pb-2 scrollbar-hidden scroll-smooth snap-x snap-mandatory',
              '-mx-1 px-1' // Small padding for focus rings
            )}
            role="list"
            aria-label="Recommended products carousel"
          >
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="w-44 sm:w-48 shrink-0 snap-start"
                    role="listitem"
                  >
                    <CompactProductCardSkeleton />
                  </div>
                ))
              : products.map((product) => (
                  <div
                    key={product.id}
                    className="w-44 sm:w-48 shrink-0 snap-start"
                    role="listitem"
                  >
                    <CompactProductCard product={product} />
                  </div>
                ))
            }
          </div>
        </div>
        
        {/* Segment Progress Bar */}
        {!isLoading && products.length > 0 && totalSegments > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalSegments }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToSegment(index)}
                className={cn(
                  'h-1 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary',
                  index === activeSegment
                    ? 'w-6 bg-cyan-glow shadow-glow-cyan-sm'
                    : 'w-2 bg-border-accent hover:bg-text-muted'
                )}
                aria-label={`Go to section ${index + 1} of ${totalSegments}`}
                aria-current={index === activeSegment ? 'true' : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RecommendedForYou;
