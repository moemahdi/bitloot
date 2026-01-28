/**
 * FeaturedProducts Component
 * 
 * Horizontal scrollable carousel of featured products above the main grid.
 * Shows spotlight products with enhanced styling.
 */
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { CatalogProductCard, CatalogProductCardSkeleton } from './CatalogProductCard';
import type { CatalogProduct } from '../types';

interface FeaturedProductsProps {
  products: CatalogProduct[];
  isLoading?: boolean;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  wishlistIds?: Set<string>;
  className?: string;
}

export function FeaturedProducts({
  products,
  isLoading = false,
  onAddToCart,
  onToggleWishlist,
  onViewProduct,
  wishlistIds = new Set(),
  className,
}: FeaturedProductsProps): React.ReactElement | null {
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
    
    const cardWidth = 320; // Approximate card width + gap
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);
  
  // If no products and not loading, don't render
  if (!isLoading && products.length === 0) {
    return null;
  }
  
  return (
    <section className={cn('relative', className)} aria-labelledby="featured-products-heading">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-neon/20">
            <Sparkles className="h-5 w-5 text-purple-neon" aria-hidden="true" />
          </div>
          <div>
            <h2 
              id="featured-products-heading" 
              className="text-lg font-semibold text-white"
            >
              Featured Products
            </h2>
            <p className="text-sm text-text-muted">
              Handpicked deals just for you
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
          aria-label="Featured products carousel"
        >
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="w-72 shrink-0 snap-start" role="listitem">
                  <CatalogProductCardSkeleton viewMode="grid" />
                </div>
              ))
            : products.map((product) => (
                <div 
                  key={product.id} 
                  className="w-72 shrink-0 snap-start"
                  role="listitem"
                >
                  <CatalogProductCard
                    product={product}
                    variant="featured"
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    onViewProduct={onViewProduct}
                    isInWishlist={wishlistIds.has(product.id)}
                    showQuickActions
                  />
                </div>
              ))
          }
        </div>
      </div>
    </section>
  );
}
