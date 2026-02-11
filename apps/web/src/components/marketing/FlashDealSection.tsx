'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { m, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Zap, ShoppingCart, ChevronRight, ChevronLeft, Flame, TrendingUp, Sparkles, Timer } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { Configuration } from '@bitloot/sdk';
import { useCart } from '@/context/CartContext';

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

// Stable fallback date (far in the past = already expired)
const EXPIRED_DATE = '1970-01-01T00:00:00.000Z';

// Flash deal response type
interface FlashDealProduct {
  id: string;
  productId: string;
  originalPrice?: string;
  discountPrice?: string;
  discountPercent?: string;
  displayOrder: number;
  product?: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl?: string;
    price?: string;
    currency?: string;
    platform?: string;
  };
}

interface ActiveFlashDeal {
  id: string;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  productsCount: number;
  displayType?: 'inline' | 'sticky';
  products: FlashDealProduct[];
}

// Fetch active flash deal (inline type)
async function fetchActiveFlashDeal(): Promise<ActiveFlashDeal | null> {
  const response = await fetch(`${apiConfig.basePath}/public/marketing/flash-deal/active?type=inline`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch flash deal');
  }
  const result: unknown = await response.json();
  const data = result as ActiveFlashDeal | null;
  // Return if we got a deal
  if (data?.id !== undefined) {
    return data;
  }
  return null;
}

// Countdown timer hook
function useCountdown(endTime: string) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculate = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

// Time unit component - Enhanced with glow and animation
function TimeUnit({ value, label, isUrgent }: { value: number; label: string; isUrgent?: boolean }) {
  return (
    <m.div 
      className="flex flex-col items-center"
      animate={isUrgent === true ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: isUrgent === true ? Infinity : 0 }}
    >
      <div className={`relative bg-gradient-to-br from-bg-tertiary to-bg-secondary rounded-xl px-4 py-3 min-w-[60px] border ${isUrgent === true ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]'}`}>
        <span className={`text-3xl font-bold tabular-nums ${isUrgent === true ? 'text-red-400' : 'text-yellow-400'}`}>
          {String(value).padStart(2, '0')}
        </span>
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-xl ${isUrgent === true ? 'bg-red-500/5' : 'bg-yellow-500/5'} blur-sm -z-10`} />
      </div>
      <span className="text-xs text-text-muted mt-2 uppercase tracking-widest font-medium">{label}</span>
    </m.div>
  );
}

// Animated fire particles
function FireParticles() {
  // Pre-calculated positions to avoid Math.random() - using index-based distribution
  const positions = [10, 25, 40, 55, 70, 85];
  const durations = [2.2, 2.8, 3.1, 2.5, 3.4, 2.9];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <m.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-t from-orange-500 to-yellow-300"
          initial={{ 
            x: `${positions[i] ?? 50}%`, 
            y: '100%', 
            opacity: 0,
            scale: 0 
          }}
          animate={{ 
            y: '-20%', 
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{ 
            duration: durations[i] ?? 3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

// Currency symbol helper
function getCurrencySymbol(currency?: string): string {
  const upperCurrency = currency !== null && currency !== undefined && currency !== '' 
    ? currency.toUpperCase() 
    : '';
  
  switch (upperCurrency) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'USD': return '$';
    case 'JPY': return '¥';
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    default: return currency ?? '€'; // Default to EUR
  }
}

// Flash deal product card - Enhanced design
function FlashDealProductCard({ product, onAddToCart, index, isPriority = false }: { product: FlashDealProduct; onAddToCart: (product: FlashDealProduct) => void; index: number; isPriority?: boolean }) {
  // Use originalPrice if set, otherwise fall back to product.price
  const originalPrice = parseFloat(product.originalPrice ?? product.product?.price ?? '0');
  // Use discountPrice if set, otherwise calculate from discount percent
  const discountPercent = parseFloat(product.discountPercent ?? '0');
  const discountedPrice = typeof product.discountPrice === 'string' && product.discountPrice.length > 0
    ? parseFloat(product.discountPrice) 
    : originalPrice * (1 - discountPercent / 100);
  // Get currency symbol from product
  const productCurrency = typeof product.product?.currency === 'string' && product.product.currency.length > 0 ? product.product.currency : 'EUR';
  const currencySymbol = getCurrencySymbol(productCurrency);
  // Show "Hot" badge for high discounts
  const isHotDeal = discountPercent >= 50;
  // Simulate scarcity (in production, this would come from backend)
  const stockLevel = useMemo(() => ['Low Stock', 'Selling Fast', 'Popular'][index % 3], [index]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
  }, [product, onAddToCart]);

  return (
    <m.div
      whileHover={{ scale: 1.03, y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link href={`/product/${product.product?.slug ?? product.productId}`}>
        <Card className="relative glass border-border-accent hover:border-yellow-500/60 transition-all duration-500 overflow-hidden group cursor-pointer h-full hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]">
          {/* Animated border glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-[-1px] bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-yellow-500/50 rounded-lg blur-sm" />
          </div>
          
          <CardContent className="relative p-0 bg-bg-primary rounded-lg">
            {/* Image */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary overflow-hidden">
              {product.product?.coverImageUrl !== undefined && product.product.coverImageUrl !== '' ? (
                <Image
                  src={product.product.coverImageUrl}
                  alt={product.product.title ?? 'Product'}
                  fill
                  priority={isPriority}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                  <Zap className="h-12 w-12 text-yellow-400/50" />
                </div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Discount Badge - Enhanced */}
              <m.div
                initial={{ rotate: -12 }}
                whileHover={{ rotate: 0, scale: 1.1 }}
                className="absolute top-3 left-3"
              >
                <Badge className={`${isHotDeal ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-yellow-500 to-orange-400'} text-black font-bold gap-1 shadow-lg px-3 py-1`}>
                  <Flame className="h-3.5 w-3.5" fill={isHotDeal ? 'white' : 'currentColor'} />
                  -{Math.round(discountPercent)}%
                </Badge>
              </m.div>

              {/* Hot Deal indicator */}
              {isHotDeal && (
                <Badge className="absolute top-3 right-3 bg-red-500/90 text-white font-semibold gap-1 animate-pulse">
                  <TrendingUp className="h-3 w-3" />
                  HOT
                </Badge>
              )}

              {/* Platform Badge */}
              {product.product?.platform !== undefined && product.product.platform !== '' && !isHotDeal ? (
                <Badge variant="secondary" className="absolute top-3 right-3 bg-bg-primary/90 backdrop-blur-sm text-text-secondary border border-border-accent">
                  {product.product.platform}
                </Badge>
              ) : null}

              {/* Quick add button - always visible */}
              <m.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute bottom-3 right-3"
              >
                <Button 
                  size="icon"
                  className="bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg rounded-full h-10 w-10"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </m.div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              {/* Scarcity indicator */}
              <div className="flex items-center gap-1.5 text-xs text-orange-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                {stockLevel}
              </div>

              <h3 className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-yellow-400 transition-colors duration-300 leading-snug">
                {product.product?.title ?? 'Loading...'}
              </h3>

              <div className="flex items-end justify-between pt-1">
                <div className="flex flex-col">
                  <span className="text-xs text-text-muted line-through">
                    {currencySymbol}{originalPrice.toFixed(2)}
                  </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {currencySymbol}{discountedPrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                  <Sparkles className="h-2.5 w-2.5" />
                  Save {currencySymbol}{(originalPrice - discountedPrice).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </m.div>
  );
}

// Loading skeleton - Enhanced
function _FlashDealSkeleton() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-yellow-500/5 via-orange-500/5 to-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pagination config
const PRODUCTS_PER_PAGE = 10;

/**
 * FlashDealSection - Dynamic flash deal banner with countdown and pagination
 * 
 * Features:
 * - Live countdown timer
 * - Paginated product grid (10 per page)
 * - Animated discount badges
 * - Responsive grid layout
 */
export function FlashDealSection(): React.ReactElement | null {
  const { addItem } = useCart();
  const [currentPage, setCurrentPage] = useState(0);
  
  const { data: flashDeal, isLoading, error } = useQuery({
    queryKey: ['public', 'marketing', 'flash-deal', 'active', 'inline'],
    queryFn: fetchActiveFlashDeal,
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Check for new deals every minute
  });

  // Memoize endTime to prevent infinite re-renders
  const endTime = useMemo(() => flashDeal?.endsAt ?? EXPIRED_DATE, [flashDeal?.endsAt]);
  const countdown = useCountdown(endTime);

  // Calculate pagination
  const totalProducts = flashDeal?.products.length ?? 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const startIndex = currentPage * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = flashDeal?.products.slice(startIndex, endIndex) ?? [];

  // Handler for adding products to cart
  const handleAddToCart = useCallback((product: FlashDealProduct) => {
    const rawOriginalPrice = product.originalPrice ?? product.product?.price ?? '0';
    const rawDiscountPercent = product.discountPercent ?? '0';
    const discountedPrice = typeof product.discountPrice === 'string' && product.discountPrice.length > 0
      ? parseFloat(product.discountPrice) 
      : parseFloat(rawOriginalPrice) * (1 - parseFloat(rawDiscountPercent) / 100);
    
    const coverImageUrl = typeof product.product?.coverImageUrl === 'string' ? product.product.coverImageUrl : undefined;
    addItem({
      productId: product.productId,
      slug: product.product?.slug,
      title: product.product?.title ?? 'Unknown Product',
      price: discountedPrice,
      quantity: 1,
      image: coverImageUrl,
      platform: product.product?.platform ?? undefined,
    });
  }, [addItem]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  // Check if countdown is urgent (less than 1 hour)
  const isUrgent = countdown.hours === 0 && countdown.expired !== true;

  // Don't render anything if loading, error, or no active deal
  // This prevents skeleton from showing when there are no flash deals
  if (isLoading === true) {
    return null;
  }

  if (error !== null && error !== undefined) {
    return null;
  }

  if (flashDeal === null || flashDeal === undefined || countdown.expired === true) {
    return null;
  }
  
  // Also don't render if no products in the deal
  if (flashDeal.products.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Seamless background - blends with bg-primary */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/[0.03] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(234,179,8,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,_rgba(234,179,8,0.04),transparent_60%)]" />
      
      {/* Subtle animated fire particles */}
      <FireParticles />
      
      {/* Very subtle decorative glows - no hard edges */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] -translate-y-1/2 -translate-x-1/2 bg-yellow-500/[0.03] rounded-full blur-[150px]" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] -translate-y-1/2 translate-x-1/2 bg-orange-500/[0.03] rounded-full blur-[150px]" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Header - Enhanced */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-5">
            {/* Animated icon container */}
            <m.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="relative p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
            >
              <Zap className="h-10 w-10 text-yellow-400" fill="currentColor" />
              {/* Glow effect */}
              <div className="absolute inset-0 bg-yellow-500/20 rounded-2xl blur-xl -z-10" />
            </m.div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  {flashDeal.name}
                </h2>
                <Badge className={`${isUrgent ? 'bg-red-500' : 'bg-gradient-to-r from-red-500 to-orange-500'} text-white font-semibold animate-pulse shadow-lg`}>
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  LIVE
                </Badge>
              </div>
              {flashDeal.description !== null && flashDeal.description !== undefined && flashDeal.description !== '' && (
                <p className="text-text-muted text-lg">{flashDeal.description}</p>
              )}
            </div>
          </div>

          {/* Countdown Timer - Enhanced */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 text-text-muted">
              <Timer className={`h-5 w-5 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`} />
              <span className="text-sm font-medium uppercase tracking-wider">
                {isUrgent ? 'Ending Soon!' : 'Ends in'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <TimeUnit value={countdown.hours} label="Hours" isUrgent={isUrgent} />
              <span className={`text-3xl font-bold ${isUrgent ? 'text-red-400' : 'text-yellow-400'} animate-pulse`}>:</span>
              <TimeUnit value={countdown.minutes} label="Mins" isUrgent={isUrgent} />
              <span className={`text-3xl font-bold ${isUrgent ? 'text-red-400' : 'text-yellow-400'} animate-pulse`}>:</span>
              <TimeUnit value={countdown.seconds} label="Secs" isUrgent={isUrgent} />
            </div>
          </div>
        </div>

        {/* Products Grid with Animation */}
        <AnimatePresence mode="wait">
          <m.div
            key={currentPage}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {currentProducts.map((product, index) => (
              <m.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <FlashDealProductCard product={product} onAddToCart={handleAddToCart} index={index} isPriority={index < 4} />
              </m.div>
            ))}
          </m.div>
        </AnimatePresence>

        {/* Pagination Controls - Enhanced */}
        {totalPages > 1 && (
          <m.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex items-center justify-center gap-6"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="gap-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Page indicators - Enhanced */}
            <div className="flex items-center gap-3">
              {Array.from({ length: totalPages }).map((_, index) => (
                <m.button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`relative h-3 rounded-full transition-all duration-400 ${
                    index === currentPage 
                      ? 'w-10 bg-gradient-to-r from-yellow-400 to-orange-400' 
                      : 'w-3 bg-yellow-500/30 hover:bg-yellow-500/50'
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                >
                  {index === currentPage && (
                    <m.div 
                      layoutId="activePage"
                      className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                    />
                  )}
                </m.button>
              ))}
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="gap-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </m.div>
        )}

        {/* Total products info - Enhanced */}
        <m.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <span className="inline-flex items-center gap-2 text-text-muted text-sm bg-bg-secondary/50 px-4 py-2 rounded-full border border-border-accent">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Showing {startIndex + 1}-{Math.min(endIndex, totalProducts)} of {totalProducts} exclusive deals
          </span>
        </m.div>
      </div>
    </section>
  );
}
