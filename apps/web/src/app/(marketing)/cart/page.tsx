'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
// Separator removed - using custom dividers instead
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap,
  Bitcoin,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Trash2,
  TrendingDown,
  Tag,
  Clock,
  Lock
} from 'lucide-react';
import { PromoCodeInput } from '@/features/checkout/PromoCodeInput';
import { useAddToWatchlist } from '@/features/watchlist/hooks/useWatchlist';
import { CatalogProductCard } from '@/features/catalog/components/CatalogProductCard';
import { cn } from '@/design-system/utils/utils';
import { toast } from 'sonner';
import type { CartItem } from '@/context/CartContext';
import type { CatalogProduct } from '@/features/catalog/types';

// Recently viewed storage key (same as catalog)
const RECENTLY_VIEWED_KEY = 'bitloot_recently_viewed';

// This matches the CatalogProduct structure stored by useCatalogState
interface RecentlyViewedProduct {
  id: string;
  slug: string;
  name: string;
  price: string;
  image?: string;
  platform?: string;
  genre?: string;
}

// ============================================================================
// RECENTLY VIEWED CAROUSEL COMPONENT
// ============================================================================

interface RecentlyViewedCarouselProps {
  products: RecentlyViewedProduct[];
  onAddToCart: (product: RecentlyViewedProduct) => void;
  onViewProduct: (slug: string) => void;
}

function RecentlyViewedCarousel({ products, onAddToCart, onViewProduct }: RecentlyViewedCarouselProps): React.ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeSegment, setActiveSegment] = useState(0);
  const [totalSegments, setTotalSegments] = useState(1);
  
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
    
    const cardWidth = 200; // Card width + gap
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
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-12"
      aria-labelledby="recently-viewed-heading"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-glow/20 shadow-glow-cyan-sm">
            <Clock className="h-4 w-4 text-cyan-glow" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="recently-viewed-heading"
              className="text-lg font-semibold text-text-primary"
            >
              Recently Viewed
            </h2>
            <p className="text-sm text-text-muted">Continue where you left off</p>
          </div>
        </div>
        
        {/* Navigation Arrows */}
        <div className="flex items-center gap-3">
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
        </div>
      </div>
      
      {/* Carousel Container */}
      <div className="relative">
        {/* Products Carousel */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollState}
          className={cn(
            'flex gap-3 overflow-x-auto pb-2 scrollbar-hidden scroll-smooth snap-x snap-mandatory',
            '-mx-1 px-1' // Small padding for focus rings
          )}
          role="list"
          aria-label="Recently viewed products carousel"
        >
          {products.map((product) => {
            // Map RecentlyViewedProduct to CatalogProduct for CatalogProductCard
            const catalogProduct: CatalogProduct = {
              id: product.id,
              slug: product.slug,
              name: product.name,
              description: '',
              price: product.price,
              currency: 'EUR',
              image: product.image,
              platform: product.platform,
              genre: product.genre,
              isAvailable: true,
              stock: 99, // Assume in stock for recently viewed
            };
            return (
              <div
                key={product.id}
                className="w-[calc(20%-9.6px)] min-w-[180px] shrink-0 snap-start"
                role="listitem"
              >
                <CatalogProductCard
                  product={catalogProduct}
                  onAddToCart={() => onAddToCart(product)}
                  onViewProduct={() => onViewProduct(product.slug)}
                  showQuickActions={true}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Segment Progress Bar */}
      {products.length > 0 && totalSegments > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSegments }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSegment(index)}
              className={cn(
                'h-1 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
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
    </motion.section>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CartPage(): React.ReactElement {
  const { 
    items, 
    addItem,
    removeItem, 
    updateQuantity, 
    clearCart, 
    total, 
    originalTotal, 
    savings, 
    itemCount, 
    appliedPromo, 
    setAppliedPromo,
    finalTotal 
  } = useCart();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const addToWatchlist = useAddToWatchlist();
  
  // Track items being removed for animation
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  
  // Track items just saved to watchlist (for immediate UI feedback before query refetch)
  const [justSavedItems, setJustSavedItems] = useState<Set<string>>(new Set());
  
  // Recently removed item for undo
  const [_lastRemovedItem, setLastRemovedItem] = useState<CartItem | null>(null);
  
  // Recently viewed products
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);
  
  // Load recently viewed from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored !== null && stored !== '') {
        const parsed = JSON.parse(stored) as unknown[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Map to ensure correct interface & filter out cart items
          const cartIds = new Set(items.map(i => i.productId));
          const mapped: RecentlyViewedProduct[] = [];
          
          for (const p of parsed) {
            if (typeof p !== 'object' || p === null) continue;
            const obj = p as Record<string, unknown>;
            const id = typeof obj.id === 'string' ? obj.id : '';
            const name = typeof obj.name === 'string' ? obj.name : '';
            
            if (id === '' || name === '' || cartIds.has(id)) continue;
            
            mapped.push({
              id,
              slug: typeof obj.slug === 'string' ? obj.slug : id,
              name,
              price: typeof obj.price === 'string' ? obj.price : (typeof obj.price === 'number' ? String(obj.price) : '0'),
              image: typeof obj.image === 'string' ? obj.image : undefined,
              platform: typeof obj.platform === 'string' ? obj.platform : undefined,
              genre: typeof obj.genre === 'string' ? obj.genre : undefined,
            });
            
            if (mapped.length >= 10) break; // Show up to 10 recently viewed
          }
          
          setRecentlyViewed(mapped);
        }
      }
    } catch (err) {
      console.error('[Cart] Error parsing recently viewed:', err);
    }
  }, [items]);

  // Handle remove with undo
  const handleRemove = useCallback((productId: string) => {
    const item = items.find(i => i.productId === productId);
    if (item === undefined) return;
    
    // Start animation
    setRemovingItems(prev => new Set(prev).add(productId));
    
    // After animation, actually remove
    setTimeout(() => {
      setLastRemovedItem(item);
      removeItem(productId);
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      
      // Show undo toast
      toast.success(`${item.title} removed`, {
        action: {
          label: 'Undo',
          onClick: () => {
            addItem(item);
            setLastRemovedItem(null);
          },
        },
        duration: 5000,
      });
    }, 300);
  }, [items, removeItem, addItem]);

  // Handle save for later (add to watchlist without removing from cart)
  const handleSaveForLater = useCallback((productId: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to save items', {
        action: {
          label: 'Login',
          onClick: () => router.push('/auth/login'),
        },
      });
      return;
    }
    
    // Check if just saved (immediate feedback)
    if (justSavedItems.has(productId)) {
      toast.info('Already saved to wishlist');
      return;
    }
    
    const item = items.find(i => i.productId === productId);
    if (item === undefined) return;
    
    addToWatchlist.mutate(productId, {
      onSuccess: () => {
        // Track for immediate UI feedback
        setJustSavedItems(prev => new Set(prev).add(productId));
        toast.success(`${item.title} saved to wishlist`);
      },
      onError: (error) => {
        // If already in watchlist, show info instead of error
        if (error.message.includes('already') || error.message.includes('exists')) {
          toast.info('Already saved to wishlist');
          setJustSavedItems(prev => new Set(prev).add(productId));
        } else {
          toast.error('Failed to save item');
        }
      },
    });
  }, [isAuthenticated, items, addToWatchlist, router, justSavedItems]);

  // Add recently viewed item to cart
  const handleAddRecentToCart = useCallback((product: RecentlyViewedProduct) => {
    addItem({
      productId: product.id,
      title: product.name,
      price: parseFloat(product.price),
      quantity: 1,
      image: product.image,
      platform: product.platform,
      category: product.genre, // Pass genre as category for cart display
    });
    toast.success(`${product.name} added to cart`);
  }, [addItem]);

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-neon/5 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-glow/5 rounded-full blur-[100px] mix-blend-screen" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center bg-bg-secondary/80 backdrop-blur-xl border border-border-subtle shadow-card-lg">
              <CardContent className="py-16">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-cyan-glow/20 blur-xl rounded-full animate-pulse" />
                  <ShoppingCart className="h-16 w-16 mx-auto text-text-muted relative z-10" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Your cart is empty</h2>
                <p className="text-text-muted mb-8 max-w-md mx-auto">
                  Looks like you haven&apos;t added anything yet. Explore our catalog and find your next digital adventure.
                </p>
                <Button 
                  asChild
                  className="bg-cyan-glow text-bg-primary hover:shadow-glow-cyan font-semibold"
                  size="lg"
                >
                  <Link href="/catalog">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Browse Catalog
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const estimatedTotal = finalTotal;

  const handleCheckout = (): void => {
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-20">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-neon/5 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-glow/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-2 text-text-muted hover:text-cyan-glow transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-glow to-purple-neon">
                Shopping Cart
              </h1>
              <p className="text-text-muted mt-1">
                {itemCount} item{itemCount !== 1 ? 's' : ''} ready for checkout
              </p>
            </div>
            
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-text-muted hover:text-red-error hover:bg-red-error/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, height: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                  >
                    <CartItemRow
                      productId={item.productId}
                      title={item.title}
                      price={item.price}
                      quantity={item.quantity}
                      image={item.image}
                      discountPercent={item.discountPercent}
                      bundleId={item.bundleId}
                      platform={item.platform}
                      category={item.category}
                      slug={item.productId}
                      isRemoving={removingItems.has(item.productId)}
                      isInWatchlistOverride={justSavedItems.has(item.productId) ? true : undefined}
                      onRemove={() => handleRemove(item.productId)}
                      onQuantityChange={(quantity) => updateQuantity(item.productId, quantity)}
                      onSaveForLater={() => handleSaveForLater(item.productId)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 grid grid-cols-3 gap-4"
            >
              {[
                { icon: Zap, text: 'Instant Delivery', color: 'text-cyan-glow' },
                { icon: Shield, text: 'Secure Payment', color: 'text-green-success' },
                { icon: Bitcoin, text: 'Crypto Accepted', color: 'text-orange-warning' },
              ].map((badge) => (
                <div 
                  key={badge.text}
                  className="flex items-center gap-2 p-3 rounded-xl bg-bg-secondary/50 border border-border-subtle"
                >
                  <badge.icon className={`h-5 w-5 ${badge.color}`} />
                  <span className="text-xs font-medium text-text-secondary">{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-4 bg-bg-secondary/90 backdrop-blur-xl border border-border-subtle shadow-card-lg overflow-hidden">
              {/* Header with gradient accent */}
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-cyan-glow/10 via-purple-neon/5 to-transparent" />
                <CardHeader className="relative border-b border-border-subtle/50 pb-4">
                  <CardTitle className="text-text-primary flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-glow/20 blur-md rounded-full" />
                      <div className="relative p-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30">
                        <Wallet className="h-5 w-5 text-cyan-glow" />
                      </div>
                    </div>
                    <div>
                      <span className="text-lg font-bold">Order Summary</span>
                      <p className="text-xs text-text-muted font-normal mt-0.5">{itemCount} item{itemCount !== 1 ? 's' : ''} in cart</p>
                    </div>
                  </CardTitle>
                </CardHeader>
              </div>

              <CardContent className="space-y-5 pt-5">
                {/* Promo Code Section */}
                <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-subtle/50">
                  <label className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-2 uppercase tracking-wider">
                    <Tag className="h-3.5 w-3.5 text-purple-neon" />
                    Promo Code
                  </label>
                  <PromoCodeInput
                    orderTotal={total.toFixed(2)}
                    productIds={items.map(item => item.productId)}
                    categoryIds={items.map(item => item.category).filter((c): c is string => c !== undefined)}
                    onPromoApplied={(promo) => setAppliedPromo(promo)}
                    onPromoRemoved={() => setAppliedPromo(null)}
                  />
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-3 p-3 rounded-xl bg-bg-tertiary/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Subtotal</span>
                    <span className="text-text-secondary font-medium">€{originalTotal.toFixed(2)}</span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-success flex items-center gap-1.5">
                        <div className="p-0.5 rounded bg-green-success/10">
                          <TrendingDown className="h-3.5 w-3.5" />
                        </div>
                        Bundle Savings
                      </span>
                      <span className="text-green-success font-semibold">-€{savings.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {appliedPromo !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-success flex items-center gap-1.5">
                        <div className="p-0.5 rounded bg-green-success/10">
                          <Tag className="h-3.5 w-3.5" />
                        </div>
                        Promo: {appliedPromo.code}
                      </span>
                      <span className="text-green-success font-semibold">-€{parseFloat(appliedPromo.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Processing Fee</span>
                    <span className="text-green-success font-medium">Free</span>
                  </div>
                </div>

                {/* Total with glow effect */}
                <div className="relative p-4 rounded-xl bg-linear-to-r from-cyan-glow/5 via-bg-tertiary to-purple-neon/5 border border-cyan-glow/20">
                  <div className="absolute inset-0 bg-linear-to-r from-cyan-glow/5 to-purple-neon/5 blur-xl opacity-50" />
                  <div className="relative flex justify-between items-center">
                    <div>
                      <span className="text-sm text-text-muted">Total</span>
                      <p className="text-xs text-text-muted/70">Including all discounts</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold bg-linear-to-r from-cyan-glow to-purple-neon bg-clip-text text-transparent">
                        €{estimatedTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Crypto Payment Options */}
                <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle/50">
                  <p className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Bitcoin className="h-4 w-4 text-orange-warning" />
                    Accepted Cryptocurrencies
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {/* Bitcoin */}
                    <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-bg-secondary/50 border border-border-subtle/30 hover:border-orange-warning/50 transition-colors group">
                      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#F7931A"/>
                        <path d="M22.5 13.5c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.6-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.3l-2.2-.5-.4 1.7s1.2.3 1.2.3c.6.2.8.6.7 1l-.7 2.9c0 0 .1 0 .2.1h-.2l-1 4c-.1.2-.3.5-.7.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.1.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.8.5 4.9.3 5.8-2.2.7-2-.1-3.2-1.5-3.9 1-.3 1.8-1 2-2.5zm-3.6 5.1c-.5 2-4 .9-5.1.7l.9-3.7c1.1.3 4.7.8 4.2 3zm.5-5.1c-.5 1.8-3.4.9-4.3.7l.8-3.3c.9.2 4 .6 3.5 2.6z" fill="white"/>
                      </svg>
                      <span className="text-[10px] font-bold text-text-secondary group-hover:text-orange-warning transition-colors">BTC</span>
                    </div>
                    
                    {/* Ethereum */}
                    <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-bg-secondary/50 border border-border-subtle/30 hover:border-purple-neon/50 transition-colors group">
                      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#627EEA"/>
                        <path d="M16 4v8.9l7.5 3.3L16 4z" fill="white" fillOpacity="0.6"/>
                        <path d="M16 4L8.5 16.2l7.5-3.3V4z" fill="white"/>
                        <path d="M16 21.9v6.1l7.5-10.4L16 21.9z" fill="white" fillOpacity="0.6"/>
                        <path d="M16 28v-6.1l-7.5-4.3L16 28z" fill="white"/>
                        <path d="M16 20.6l7.5-4.4L16 12.9v7.7z" fill="white" fillOpacity="0.2"/>
                        <path d="M8.5 16.2l7.5 4.4v-7.7l-7.5 3.3z" fill="white" fillOpacity="0.6"/>
                      </svg>
                      <span className="text-[10px] font-bold text-text-secondary group-hover:text-purple-neon transition-colors">ETH</span>
                    </div>
                    
                    {/* Solana */}
                    <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-bg-secondary/50 border border-border-subtle/30 hover:border-[#14F195]/50 transition-colors group">
                      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="url(#solana-gradient)"/>
                        <defs>
                          <linearGradient id="solana-gradient" x1="0" y1="0" x2="32" y2="32">
                            <stop offset="0%" stopColor="#9945FF"/>
                            <stop offset="100%" stopColor="#14F195"/>
                          </linearGradient>
                        </defs>
                        <path d="M9.5 19.8c.1-.1.3-.2.5-.2h12.8c.3 0 .5.4.3.6l-2.3 2.3c-.1.1-.3.2-.5.2H7.5c-.3 0-.5-.4-.3-.6l2.3-2.3z" fill="white"/>
                        <path d="M9.5 9.3c.1-.1.3-.2.5-.2h12.8c.3 0 .5.4.3.6l-2.3 2.3c-.1.1-.3.2-.5.2H7.5c-.3 0-.5-.4-.3-.6l2.3-2.3z" fill="white"/>
                        <path d="M20.3 14.5c-.1-.1-.3-.2-.5-.2H7c-.3 0-.5.4-.3.6l2.3 2.3c.1.1.3.2.5.2h12.8c.3 0 .5-.4.3-.6l-2.3-2.3z" fill="white"/>
                      </svg>
                      <span className="text-[10px] font-bold text-text-secondary group-hover:text-[#14F195] transition-colors">SOL</span>
                    </div>
                    
                    {/* USDT */}
                    <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-bg-secondary/50 border border-border-subtle/30 hover:border-green-success/50 transition-colors group">
                      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                        <path d="M17.9 17.9v-.1c-.1 0-.8 0-2 0-1 0-1.7 0-1.9 0v.1c-3.4-.1-6-.7-6-1.4s2.6-1.3 6-1.4v2.3c.2 0 .9.1 2 .1 1.2 0 1.8 0 1.9-.1v-2.3c3.4.1 6 .7 6 1.4s-2.6 1.3-6 1.4zm0-3v-2h5.6v-3.3H8.5v3.3h5.5v2c-3.9.2-6.8.9-6.8 1.9s2.9 1.7 6.8 1.9v6.7h3.8v-6.7c3.9-.2 6.8-.9 6.8-1.9s-2.9-1.7-6.7-1.9z" fill="white"/>
                      </svg>
                      <span className="text-[10px] font-bold text-text-secondary group-hover:text-green-success transition-colors">USDT</span>
                    </div>
                    
                    {/* Litecoin */}
                    <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-bg-secondary/50 border border-border-subtle/30 hover:border-gray-400/50 transition-colors group">
                      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#345D9D"/>
                        <path d="M10.5 23h11v-2h-7.3l1.5-5.5 2.3-.8-.5-1.7-2 .7 1.8-6.7h-3l-1.8 6.8-2.3.8.5 1.7 2-.7-1.7 6.4-.5 1z" fill="white"/>
                      </svg>
                      <span className="text-[10px] font-bold text-text-secondary group-hover:text-gray-300 transition-colors">LTC</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted text-center mt-2">+ 100 more cryptocurrencies</p>
                </div>

                {/* Checkout Button */}
                <div className="space-y-3 pt-2">
                  <Button 
                    onClick={handleCheckout}
                    className="w-full h-14 bg-linear-to-r from-cyan-glow to-cyan-glow/90 text-bg-primary hover:shadow-glow-cyan font-bold text-base relative overflow-hidden group"
                    size="lg"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    <span className="relative flex items-center gap-2">
                      Proceed to Checkout
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                  
                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-4 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-green-success" />
                      Secure
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-cyan-glow" />
                      Instant
                    </span>
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3 text-purple-neon" />
                      Encrypted
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <RecentlyViewedCarousel 
            products={recentlyViewed}
            onAddToCart={handleAddRecentToCart}
            onViewProduct={(slug) => router.push(`/product/${slug}`)}
          />
        )}
      </div>

      {/* Mobile Sticky Checkout Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-bg-secondary/95 backdrop-blur-xl border-t border-border-subtle safe-bottom">
        <div className="flex items-center justify-between mb-3">
          <span className="text-text-muted text-sm">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          <span className="text-xl font-bold text-cyan-glow">€{estimatedTotal.toFixed(2)}</span>
        </div>
        <Button 
          onClick={handleCheckout}
          className="w-full h-12 bg-cyan-glow text-bg-primary hover:shadow-glow-cyan font-bold text-base"
          size="lg"
        >
          Checkout
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
