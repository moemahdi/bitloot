/**
 * CatalogProductGrid Component
 * 
 * Responsive grid for displaying products and product groups with view mode support (grid/list/compact).
 * Handles loading states and empty states.
 * Product groups are displayed inline with products using the same grid layout.
 */
'use client';

import { cn } from '@/design-system/utils/utils';
import { CatalogProductCard, CatalogProductCardSkeleton } from './CatalogProductCard';
import { ProductGroupGridCard, ProductGroupGridCardSkeleton } from './ProductGroupGridCard';
import type { CatalogProduct, ViewMode } from '../types';
import type { ProductGroupResponseDto } from '@bitloot/sdk';

interface CatalogProductGridProps {
  products: CatalogProduct[];
  productGroups?: ProductGroupResponseDto[];
  viewMode: ViewMode;
  isLoading?: boolean;
  isLoadingGroups?: boolean;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  onViewVariants?: (group: ProductGroupResponseDto) => void;
  wishlistIds?: Set<string>;
  skeletonCount?: number;
  className?: string;
}

export function CatalogProductGrid({
  products,
  productGroups = [],
  viewMode,
  isLoading = false,
  isLoadingGroups = false,
  onAddToCart,
  onToggleWishlist,
  onViewProduct,
  onViewVariants,
  wishlistIds = new Set(),
  skeletonCount = 12,
  className,
}: CatalogProductGridProps): React.ReactElement {
  // Grid classes based on view mode
  const gridClasses = {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    list: 'flex flex-col gap-3',
    compact: 'grid grid-cols-1 sm:grid-cols-2 gap-2',
  };
  
  // Calculate total items count (products + groups)
  const totalItems = products.length + productGroups.length;
  
  // Loading state
  if (isLoading) {
    return (
      <div 
        className={cn(gridClasses[viewMode], className)}
        role="list"
        aria-label="Loading products"
        aria-busy="true"
      >
        {/* Show a mix of product and group skeletons */}
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} role="listitem">
            {i < 2 && isLoadingGroups ? (
              <ProductGroupGridCardSkeleton viewMode={viewMode} />
            ) : (
              <CatalogProductCardSkeleton viewMode={viewMode} />
            )}
          </div>
        ))}
      </div>
    );
  }
  
  // No products or groups
  if (totalItems === 0) {
    return (
      <div 
        className={cn('py-12 text-center', className)}
        role="status"
        aria-label="No products found"
      >
        <p className="text-text-muted">No products to display</p>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(gridClasses[viewMode], className)}
      role="list"
      aria-label={`${totalItems} items`}
    >
      {/* Render product groups first (they appear at the top/beginning) */}
      {productGroups.map((group) => (
        <div key={`group-${group.id}`} role="listitem">
          <ProductGroupGridCard
            group={group}
            viewMode={viewMode}
            onViewVariants={onViewVariants}
          />
        </div>
      ))}
      
      {/* Render products */}
      {products.map((product, index) => (
        <div key={product.id} role="listitem">
          <CatalogProductCard
            product={product}
            viewMode={viewMode}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            onViewProduct={onViewProduct}
            isInWishlist={wishlistIds.has(product.id)}
            showQuickActions
            isPriority={index < 4}
          />
        </div>
      ))}
    </div>
  );
}
