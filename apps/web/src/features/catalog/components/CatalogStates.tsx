/**
 * Empty and Error State Components
 * 
 * Display states for when no products match filters or an error occurs.
 */
'use client';

import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import {
  PackageSearch,
  SearchX,
  WifiOff,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';
import type { FilterState } from '../types';

// ============ EMPTY STATE ============

interface EmptyStateProps {
  filters: FilterState;
  onResetFilters: () => void;
  onOpenFilters?: () => void;
  className?: string;
}

export function CatalogEmptyState({
  filters,
  onResetFilters,
  onOpenFilters,
  className,
}: EmptyStateProps): React.ReactElement {
  // Check if any filters are active
  const hasActiveFilters = Boolean(
    (filters.search !== undefined && filters.search !== '') ||
    (filters.businessCategory ?? '') !== '' ||
    filters.platform.length > 0 ||
    (filters.region !== undefined && filters.region !== '') ||
    filters.minPrice > 0 ||
    filters.maxPrice < 500
  );
  
  // Search query specific empty state
  if (filters.search !== undefined && filters.search !== '') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-full bg-bg-secondary flex items-center justify-center">
            <SearchX className="h-10 w-10 text-text-muted" aria-hidden="true" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-orange-400" aria-hidden="true" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2 text-center">
          No results for &quot;{filters.search}&quot;
        </h3>
        <p className="text-text-muted text-center max-w-md mb-6">
          We couldn&apos;t find any products matching your search. Try using different keywords or check for typos.
        </p>
        
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="border-border-subtle"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Search
          </Button>
          {hasActiveFilters && onOpenFilters !== undefined && (
            <Button
              variant="outline"
              onClick={onOpenFilters}
              className="border-border-subtle"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Adjust Filters
            </Button>
          )}
        </div>
        
        {/* Search suggestions */}
        <div className="mt-8 p-4 rounded-lg bg-bg-secondary border border-border-subtle max-w-md w-full">
          <h4 className="text-sm font-medium text-white mb-3">Search Tips:</h4>
          <ul className="text-sm text-text-muted space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyan-glow">•</span>
              Try more general terms like &quot;action games&quot; or &quot;office software&quot;
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-glow">•</span>
              Check the spelling of your search term
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-glow">•</span>
              Use fewer keywords and remove filters
            </li>
          </ul>
        </div>
      </div>
    );
  }
  
  // Filter specific empty state
  if (hasActiveFilters) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
        <div className="h-20 w-20 rounded-full bg-bg-secondary flex items-center justify-center mb-6">
          <SlidersHorizontal className="h-10 w-10 text-text-muted" aria-hidden="true" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2 text-center">
          No products match your filters
        </h3>
        <p className="text-text-muted text-center max-w-md mb-6">
          Try adjusting your filter settings or removing some filters to see more products.
        </p>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="border-border-subtle"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
          {onOpenFilters !== undefined && (
            <Button
              onClick={onOpenFilters}
              className="bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Edit Filters
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Generic empty state (no products at all)
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="h-20 w-20 rounded-full bg-bg-secondary flex items-center justify-center mb-6">
        <PackageSearch className="h-10 w-10 text-text-muted" aria-hidden="true" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2 text-center">
        No products available
      </h3>
      <p className="text-text-muted text-center max-w-md mb-6">
        We&apos;re working on adding new products. Check back soon for exciting deals!
      </p>
      
      <Button
        variant="outline"
        className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
      >
        Browse Categories
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// ============ ERROR STATE ============

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function CatalogErrorState({
  error,
  onRetry,
  className,
}: ErrorStateProps): React.ReactElement {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const isNetworkError = errorMessage.toLowerCase().includes('network') ||
                         errorMessage.toLowerCase().includes('fetch') ||
                         errorMessage.toLowerCase().includes('offline');
  
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
          {isNetworkError ? (
            <WifiOff className="h-10 w-10 text-destructive" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
          )}
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2 text-center">
        {isNetworkError ? 'Connection Problem' : 'Something went wrong'}
      </h3>
      <p className="text-text-muted text-center max-w-md mb-6">
        {isNetworkError
          ? 'Please check your internet connection and try again.'
          : 'We encountered an error while loading products. Please try again.'}
      </p>
      
      {onRetry !== undefined && (
        <Button
          onClick={onRetry}
          className="bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
      
      {/* Error details (collapsible in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 max-w-lg w-full">
          <p className="text-xs text-destructive font-mono break-all">
            {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}

// ============ LOADING STATE ============

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function CatalogLoadingState({
  message = 'Loading products...',
  className,
}: LoadingStateProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      {/* Spinning loader */}
      <div className="relative h-16 w-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-border-subtle" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-glow animate-spin" />
      </div>
      
      <p className="text-text-muted animate-pulse">{message}</p>
    </div>
  );
}
