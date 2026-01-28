/**
 * TrendingSection Component
 * 
 * Horizontal scroll section for trending products with "X people viewing" badges.
 */
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import { ChevronLeft, ChevronRight, TrendingUp, Flame } from 'lucide-react';
import { CatalogProductCard, CatalogProductCardSkeleton } from './CatalogProductCard';
import type { CatalogProduct } from '../types';

interface TrendingSectionProps {
  products: CatalogProduct[];
  isLoading?: boolean;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  wishlistIds?: Set<string>;
  className?: string;
}

export function TrendingSection({
  products,
  isLoading = false,
  onAddToCart,
  onToggleWishlist,
  onViewProduct,
  wishlistIds = new Set(),
  className,
}: TrendingSectionProps): React.ReactElement | null {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Check scroll state
  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  }, []);
  
  // Initialize scroll state
  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [checkScrollState, products]);
  
  // Scroll functions
  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const cardWidth = 280;
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);
  
  // If no products and not loading, don't render
  if (!isLoading && products.length === 0) {
    return null;
  }
  
  return (
    <section className={cn('relative', className)} aria-labelledby="trending-products-heading">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
              <TrendingUp className="h-5 w-5 text-orange-400" aria-hidden="true" />
            </div>
            {/* Animated fire icon */}
            <div className="absolute -top-1 -right-1 animate-bounce">
              <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />
            </div>
          </div>
          <div>
            <h2 
              id="trending-products-heading" 
              className="text-lg font-semibold text-white flex items-center gap-2"
            >
              Trending Now
              <span className="text-xs font-normal text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                Hot 🔥
              </span>
            </h2>
            <p className="text-sm text-text-muted">
              Popular products our customers love
            </p>
          </div>
        </div>
        
        {/* Navigation arrows */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="h-8 w-8 rounded-full border-border-subtle disabled:opacity-30"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="h-8 w-8 rounded-full border-border-subtle disabled:opacity-30"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Scrollable container */}
      <div className="relative">
        {/* Left gradient fade */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-bg-primary to-transparent transition-opacity',
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          )}
        />
        
        {/* Right gradient fade */}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-bg-primary to-transparent transition-opacity',
            canScrollRight ? 'opacity-100' : 'opacity-0'
          )}
        />
        
        {/* Products carousel */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollState}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hidden scroll-smooth snap-x snap-mandatory"
          role="list"
          aria-label="Trending products carousel"
        >
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="w-64 shrink-0 snap-start" role="listitem">
                  <CatalogProductCardSkeleton viewMode="grid" />
                </div>
              ))
            : products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="w-64 shrink-0 snap-start"
                  role="listitem"
                >
                  {/* Rank badge for top 3 */}
                  <div className="relative">
                    {index < 3 && (
                      <div
                        className={cn(
                          'absolute -top-2 -left-2 z-20 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white',
                          index === 0 && 'bg-yellow-500',
                          index === 1 && 'bg-gray-400',
                          index === 2 && 'bg-amber-700'
                        )}
                      >
                        #{index + 1}
                      </div>
                    )}
                    <CatalogProductCard
                      product={product}
                      variant="trending"
                      onAddToCart={onAddToCart}
                      onToggleWishlist={onToggleWishlist}
                      onViewProduct={onViewProduct}
                      isInWishlist={wishlistIds.has(product.id)}
                      showQuickActions
                    />
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </section>
  );
}
