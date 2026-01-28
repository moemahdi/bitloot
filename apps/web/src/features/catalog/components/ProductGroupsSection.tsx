/**
 * ProductGroupsSection Component
 * 
 * Horizontal scroll section for product groups (bundles/editions with variants).
 * Shows grouped products where customers can pick from multiple variants.
 */
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { ProductGroupCard } from './ProductGroupCard';
import type { ProductGroupResponseDto } from '@bitloot/sdk';

interface ProductGroupsSectionProps {
  groups: ProductGroupResponseDto[];
  isLoading?: boolean;
  onViewVariants?: (group: ProductGroupResponseDto) => void;
  className?: string;
}

// Skeleton for loading state
function ProductGroupCardSkeleton(): React.ReactElement {
  return (
    <div className="w-64 shrink-0 rounded-xl border border-border-subtle bg-bg-secondary overflow-hidden animate-pulse">
      <div className="aspect-3/4 bg-bg-tertiary" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-bg-tertiary rounded" />
        <div className="h-4 w-1/2 bg-bg-tertiary rounded" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 w-20 bg-bg-tertiary rounded" />
          <div className="h-8 w-16 bg-bg-tertiary rounded" />
        </div>
      </div>
    </div>
  );
}

export function ProductGroupsSection({
  groups,
  isLoading = false,
  onViewVariants,
  className,
}: ProductGroupsSectionProps): React.ReactElement | null {
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
  }, [checkScrollState, groups]);
  
  // Scroll functions
  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const cardWidth = 280;
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);
  
  // Handle view variants
  const handleViewVariants = useCallback((group: ProductGroupResponseDto) => {
    onViewVariants?.(group);
  }, [onViewVariants]);
  
  // If no groups and not loading, don't render
  if (!isLoading && groups.length === 0) {
    return null;
  }
  
  return (
    <section className={cn('relative', className)} aria-labelledby="product-groups-heading">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-neon/20">
            <Layers className="h-5 w-5 text-purple-neon" aria-hidden="true" />
          </div>
          <div>
            <h2 
              id="product-groups-heading" 
              className="text-lg font-semibold text-white flex items-center gap-2"
            >
              Game Editions
              <span className="text-xs font-normal text-purple-neon bg-purple-neon/10 px-2 py-0.5 rounded-full">
                Multiple Options
              </span>
            </h2>
            <p className="text-sm text-text-muted">
              Choose from different editions and bundles
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
        
        {/* Groups carousel */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollState}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hidden scroll-smooth snap-x snap-mandatory"
          role="list"
          aria-label="Product groups carousel"
        >
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="snap-start" role="listitem">
                  <ProductGroupCardSkeleton />
                </div>
              ))
            : groups.map((group) => (
                <div 
                  key={group.id} 
                  className="w-64 shrink-0 snap-start"
                  role="listitem"
                >
                  <ProductGroupCard
                    group={group}
                    onViewVariants={handleViewVariants}
                  />
                </div>
              ))
          }
        </div>
      </div>
    </section>
  );
}
