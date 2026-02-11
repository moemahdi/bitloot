'use client';

import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { CatalogApi, ProductResponseDto } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { CartItem } from '@/context/CartContext';

const catalogClient = new CatalogApi(apiConfig);

export interface CartItemStock {
  productId: string;
  slug: string;
  qty?: number;
  totalQty?: number;
  inStock?: boolean;
  isLoading: boolean;
  error?: Error;
}

export interface CartItemsStockResult {
  stockByProductId: Map<string, CartItemStock>;
  isLoading: boolean;
  hasStockIssues: boolean;
}

/**
 * Hook to fetch real-time stock information for cart items.
 * Uses TanStack Query to fetch each product's stock data in parallel with caching.
 * 
 * @param items - Cart items to fetch stock for
 * @returns Stock information mapped by product ID
 */
export function useCartItemsStock(items: CartItem[]): CartItemsStockResult {
  // Only fetch for items that have a slug (required for API lookup)
  const itemsWithSlug = items.filter(item => item.slug !== undefined && item.slug !== '');
  
  // Create parallel queries for each cart item
  const queries = useQueries({
    queries: itemsWithSlug.map(item => ({
      queryKey: ['cart-item-stock', item.slug],
      queryFn: async () => {
        const product = await catalogClient.catalogControllerGetProduct({ slug: item.slug! });
        return { item, product };
      },
      // Stock data should be fresh but not refetch too aggressively
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      // Don't show error toast for stock fetches - handle gracefully
      retry: 1,
    })),
  });

  // Build the stock map
  const stockByProductId = new Map<string, CartItemStock>();
  
  for (let i = 0; i < itemsWithSlug.length; i++) {
    const item = itemsWithSlug[i];
    const query = queries[i] as UseQueryResult<{ item: CartItem; product: ProductResponseDto }> | undefined;
    
    if (item === undefined || query === undefined) continue;
    
    if (query.isLoading) {
      stockByProductId.set(item.productId, {
        productId: item.productId,
        slug: item.slug!,
        isLoading: true,
      });
    } else if (query.error !== undefined && query.error !== null) {
      stockByProductId.set(item.productId, {
        productId: item.productId,
        slug: item.slug!,
        isLoading: false,
        error: query.error as Error,
      });
    } else if (query.data !== undefined) {
      const { product } = query.data;
      stockByProductId.set(item.productId, {
        productId: item.productId,
        slug: item.slug!,
        qty: product.qty,
        totalQty: product.totalQty,
        inStock: product.inStock,
        isLoading: false,
      });
    }
  }

  // Add entries for items without slug (can't fetch stock)
  const itemsWithoutSlug = items.filter(item => item.slug === undefined || item.slug === '');
  for (const item of itemsWithoutSlug) {
    stockByProductId.set(item.productId, {
      productId: item.productId,
      slug: '',
      isLoading: false,
      // No stock info available without slug - assume available
    });
  }

  // Check if any item has stock issues
  const hasStockIssues = items.some(item => {
    const stock = stockByProductId.get(item.productId);
    if (stock === undefined) return false;
    // Issue if out of stock or quantity exceeds available
    if (stock.inStock === false) return true;
    if (stock.qty !== undefined && item.quantity > stock.qty) return true;
    return false;
  });

  const isLoading = queries.some(q => q.isLoading);

  return {
    stockByProductId,
    isLoading,
    hasStockIssues,
  };
}

/**
 * Helper to generate stock warning message for a cart item
 */
export function getStockWarning(item: CartItem, stock: CartItemStock | undefined): string | undefined {
  if (stock === undefined || stock.isLoading) return undefined;
  
  // Out of stock
  if (stock.inStock === false) {
    return 'Out of stock';
  }
  
  // Quantity exceeds available stock
  if (stock.qty !== undefined && item.quantity > stock.qty) {
    if (stock.qty === 0) {
      return 'Out of stock';
    }
    return `Only ${stock.qty} available`;
  }
  
  // Low stock warning (at limit)
  if (stock.qty !== undefined && item.quantity === stock.qty && stock.qty <= 10) {
    return `Only ${stock.qty} left`;
  }
  
  return undefined;
}
