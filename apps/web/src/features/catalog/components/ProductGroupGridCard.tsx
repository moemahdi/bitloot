/**
 * ProductGroupGridCard Component
 * 
 * Product group card designed to match CatalogProductCard styling and grid placement.
 * Shows grouped products where customers can pick from multiple variants.
 */
'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Layers, Eye, Sparkles } from 'lucide-react';
import type { ProductGroupResponseDto } from '@bitloot/sdk';
import type { ViewMode } from '../types';

interface ProductGroupGridCardProps {
  group: ProductGroupResponseDto;
  viewMode?: ViewMode;
  onViewVariants?: (group: ProductGroupResponseDto) => void;
  className?: string;
}

// Format price with proper formatting (EUR only)
function formatPrice(price: string | undefined | null): string {
  if (price === undefined || price === null || price === '') return '€0.00';
  const numPrice = parseFloat(price);
  if (Number.isNaN(numPrice)) return '€0.00';
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
}

function ProductGroupGridCardComponent({
  group,
  viewMode = 'grid',
  onViewVariants,
  className,
}: ProductGroupGridCardProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Handle view variants
  const handleViewVariants = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewVariants?.(group);
  }, [group, onViewVariants]);
  
  // Determine price display
  const minPrice = formatPrice(group.minPrice);
  const maxPrice = formatPrice(group.maxPrice);
  const isSamePrice = minPrice === maxPrice;
  
  // Image URL with fallback
  const imageUrl = group.coverImageUrl !== '' && group.coverImageUrl !== null && group.coverImageUrl !== undefined
    ? group.coverImageUrl
    : '/placeholder-game.jpg';
  
  // Check if popular (more than 5 variants)
  const isPopular = group.productCount !== undefined && group.productCount > 5;
  
  // List view layout
  if (viewMode === 'list') {
    return (
      <div
        onClick={handleViewVariants}
        className={cn(
          'group flex gap-4 rounded-xl border border-purple-neon/30 bg-bg-secondary p-4 transition-all cursor-pointer',
          'hover:border-cyan-glow/30 hover:shadow-glow-cyan-sm',
          'ring-2 ring-purple-neon/20',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewVariants?.(group);
          }
        }}
        aria-label={`View variants for ${group.title}`}
      >
        {/* Image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-bg-tertiary">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-bg-tertiary" />
          )}
          <Image
            src={imageUrl}
            alt={group.title}
            fill
            className={cn(
              'object-cover transition-all duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              isHovered && 'scale-105'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            sizes="96px"
          />
          {/* Variants badge */}
          <div className="absolute top-1 left-1">
            <Badge className="bg-purple-neon/90 text-white border-none text-xs px-1.5 py-0.5">
              <Layers className="h-3 w-3 mr-1" />
              {group.productCount}
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs font-medium border bg-purple-neon/20 text-purple-neon border-purple-neon/30"
              >
                <Layers className="h-3 w-3 mr-1" />
                Bundle
              </Badge>
              {isPopular && (
                <Badge
                  variant="outline"
                  className="text-xs font-medium border bg-pink-featured/20 text-pink-featured border-pink-featured/30"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-cyan-glow transition-colors">
              {group.title}
            </h3>
            {group.tagline !== null && group.tagline !== undefined && group.tagline !== '' && (
              <p className="text-sm text-text-muted line-clamp-1">{group.tagline}</p>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-text-muted">Starting from</span>
              <span className="text-lg font-bold text-cyan-glow">
                {isSamePrice ? minPrice : `${minPrice} – ${maxPrice}`}
              </span>
            </div>
            
            <Button
              size="sm"
              onClick={handleViewVariants}
              className="btn-primary"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Options
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Compact view
  if (viewMode === 'compact') {
    return (
      <div
        onClick={handleViewVariants}
        className={cn(
          'group flex gap-3 rounded-lg border border-purple-neon/30 bg-bg-secondary p-3 transition-all cursor-pointer',
          'hover:border-cyan-glow/30 hover:shadow-glow-cyan-sm',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewVariants?.(group);
          }
        }}
        aria-label={`View variants for ${group.title}`}
      >
        {/* Image */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-bg-tertiary">
          <Image
            src={imageUrl}
            alt={group.title}
            fill
            className="object-cover"
            sizes="64px"
          />
          <div className="absolute top-0.5 left-0.5">
            <Badge className="bg-purple-neon/90 text-white border-none text-[10px] px-1 py-0">
              <Layers className="h-2.5 w-2.5" />
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex flex-1 flex-col justify-center min-w-0">
          <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-cyan-glow transition-colors">
            {group.title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-cyan-glow">{minPrice}</span>
            <span className="text-xs text-purple-neon">{group.productCount} variants</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Default grid view
  return (
    <div
      onClick={handleViewVariants}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-purple-neon/30 bg-bg-secondary transition-all cursor-pointer',
        'hover:border-cyan-glow/30 hover:shadow-glow-cyan-sm hover:-translate-y-1',
        'ring-2 ring-purple-neon/20',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewVariants?.(group);
        }
      }}
      aria-label={`View variants for ${group.title}`}
    >
      {/* Image Container - Same aspect ratio as product cards */}
      <div className="relative aspect-16/10 overflow-hidden bg-bg-tertiary">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-bg-tertiary" />
        )}
        
        {/* Background blur layer */}
        <div
          className={cn(
            'absolute inset-0 scale-110 blur-2xl opacity-20 transition-opacity duration-300',
            isHovered && 'opacity-30'
          )}
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Main Image */}
        <Image
          src={imageUrl}
          alt={group.title}
          fill
          className={cn(
            'object-cover transition-all duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0',
            isHovered && 'scale-105'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-bg-primary/60 to-transparent" />
        
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-bg-primary/90 via-bg-primary/50 to-transparent" />
        
        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <Badge className="bg-purple-neon/90 text-white border-none flex items-center gap-1.5 px-2.5 py-1 shadow-glow-purple-sm backdrop-blur-sm">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-xs font-semibold">{group.productCount} variants</span>
          </Badge>
        </div>
        
        {/* Popular badge - Top Right */}
        {isPopular && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-pink-featured/90 text-white border-none flex items-center gap-1 px-2 py-1 shadow-glow-pink backdrop-blur-sm">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              <span className="text-xs font-medium">Popular</span>
            </Badge>
          </div>
        )}
        
        {/* Hover overlay with action button */}
        <div
          className={cn(
            'absolute inset-0 bg-linear-to-t from-bg-primary via-bg-primary/70 to-transparent',
            'flex items-end justify-center pb-6',
            'opacity-0 transition-opacity duration-200',
            isHovered && 'opacity-100'
          )}
        >
          <Button
            size="sm"
            onClick={handleViewVariants}
            className="bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan transition-all duration-200 font-medium"
          >
            <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
            View Options
          </Button>
        </div>
      </div>
      
      {/* Content - Same structure as CatalogProductCard */}
      <div className="flex flex-1 flex-col p-4">
        {/* Badges - same as platform/category row */}
        <div className="mb-2 flex items-center gap-2">
          <Badge className="bg-purple-neon/20 text-purple-neon border-purple-neon/30 text-xs">
            <Layers className="h-3 w-3 mr-1" />
            Bundle
          </Badge>
          {isPopular && (
            <span className="text-xs text-text-muted">Popular</span>
          )}
        </div>
        
        {/* Title - same as product title */}
        <h3 className="mb-2 text-sm font-medium text-white line-clamp-2 group-hover:text-cyan-glow transition-colors min-h-9">
          {group.title}
        </h3>
        
        {/* Subtitle row - same as rating row */}
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-xs text-text-muted">
            {group.tagline !== null && group.tagline !== undefined && group.tagline !== ''
              ? group.tagline
              : `Includes: ${group.productCount} variants`}
          </span>
        </div>
        
        {/* Price and action - same as product price section */}
        <div className="mt-auto pt-2 border-t border-border-subtle">
          <div className="flex flex-col mb-3">
            <span className="text-lg font-bold text-cyan-glow">
              {minPrice}
            </span>
            {!isSamePrice && (
              <span className="text-xs text-text-muted">
                up to {maxPrice}
              </span>
            )}
          </div>
          
          {/* Action Buttons - same as product buttons */}
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewVariants}
              className="flex-1 h-8 text-xs font-medium border-border-accent bg-bg-tertiary/50 text-text-secondary hover:text-purple-neon hover:border-purple-neon/60 hover:bg-bg-tertiary hover:shadow-glow-purple-sm transition-all duration-200"
            >
              Compare
            </Button>
            <Button
              size="sm"
              onClick={handleViewVariants}
              className="flex-1 h-8 text-xs font-semibold bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan active:scale-[0.98] transition-all duration-200"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for loading state
export function ProductGroupGridCardSkeleton({ viewMode = 'grid' }: { viewMode?: ViewMode }): React.ReactElement {
  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 rounded-xl border border-border-subtle bg-bg-secondary p-4 animate-pulse">
        <div className="h-24 w-24 shrink-0 rounded-lg bg-bg-tertiary" />
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-bg-tertiary rounded" />
            <div className="h-4 w-3/4 bg-bg-tertiary rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 bg-bg-tertiary rounded" />
            <div className="h-8 w-28 bg-bg-tertiary rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  if (viewMode === 'compact') {
    return (
      <div className="flex gap-3 rounded-lg border border-border-subtle bg-bg-secondary p-3 animate-pulse">
        <div className="h-16 w-16 shrink-0 rounded-md bg-bg-tertiary" />
        <div className="flex flex-1 flex-col justify-center">
          <div className="h-4 w-3/4 bg-bg-tertiary rounded mb-2" />
          <div className="h-4 w-1/2 bg-bg-tertiary rounded" />
        </div>
      </div>
    );
  }
  
  // Default grid skeleton - matches CatalogProductCardSkeleton
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

// Memoize for performance
export const ProductGroupGridCard = memo(ProductGroupGridCardComponent);
