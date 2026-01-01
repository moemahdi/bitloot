'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  catalogClient,
  type CategoriesResponseDto,
  type FiltersResponseDto,
  type CategoryDto,
  type FeaturedCategoryDto,
} from '@bitloot/sdk';

/**
 * Hook to fetch dynamic categories from the catalog API
 * Categories are aggregated from published products (genres, platforms)
 * Also includes featured/virtual categories for special sorts
 * 
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with categories, featured collections, and total product count
 */
export function useCatalogCategories(
  enabled: boolean = true
): UseQueryResult<CategoriesResponseDto, Error> {
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => catalogClient.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled,
  });
}

/**
 * Hook to fetch available filter options from the catalog API
 * Returns platforms, regions, genres with counts plus price range
 * 
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with filter options and price range
 */
export function useCatalogFilters(
  enabled: boolean = true
): UseQueryResult<FiltersResponseDto, Error> {
  return useQuery({
    queryKey: ['catalog', 'filters'],
    queryFn: () => catalogClient.getFilters(),
    staleTime: 5 * 60 * 1000, // 5 minutes - filters don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled,
  });
}

/**
 * Helper hook that combines categories and filters into a single query
 * Useful for pages that need both (like the catalog page)
 */
export function useCatalogMetadata(enabled: boolean = true): {
  categories: ReturnType<typeof useCatalogCategories>;
  filters: ReturnType<typeof useCatalogFilters>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const categoriesQuery = useCatalogCategories(enabled);
  const filtersQuery = useCatalogFilters(enabled);

  return {
    categories: categoriesQuery,
    filters: filtersQuery,
    isLoading: categoriesQuery.isLoading || filtersQuery.isLoading,
    isError: categoriesQuery.isError || filtersQuery.isError,
    error: categoriesQuery.error ?? filtersQuery.error,
  };
}

// Re-export types for convenience
export type { CategoriesResponseDto, FiltersResponseDto, CategoryDto, FeaturedCategoryDto };
