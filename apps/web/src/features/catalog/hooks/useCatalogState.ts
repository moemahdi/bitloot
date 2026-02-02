/**
 * useCatalogState Hook
 * 
 * Centralized state management for the catalog page.
 * Handles filters, URL sync, data fetching, and local storage.
 */
'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalogClient } from '@bitloot/sdk';
import type { 
  FilterState, 
  FilterPreset, 
  CatalogProduct, 
  ActiveFilter,
  BusinessCategory,
  SortOption,
  ViewMode,
} from '../types';
import { DEFAULT_FILTERS, detectRegionFromTitle } from '../types';

const STORAGE_KEYS = {
  PRESETS: 'bitloot_filter_presets',
  RECENTLY_VIEWED: 'bitloot_recently_viewed',
  RECENT_SEARCHES: 'bitloot_recent_searches',
  VIEW_MODE: 'bitloot_view_mode',
  ITEMS_PER_PAGE: 'bitloot_items_per_page',
};

const MAX_RECENT_SEARCHES = 5;
const MAX_RECENTLY_VIEWED = 10;

// ============================================================================
// URL PARAM UTILITIES
// ============================================================================

function parseFiltersFromURL(searchParams: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {};
  
  const search = searchParams.get('q') ?? searchParams.get('search');
  if (search !== null && search !== '') filters.search = search;
  
  const category = searchParams.get('category') ?? searchParams.get('businessCategory');
  if (category !== null && category !== '' && ['games', 'software', 'subscriptions'].includes(category)) {
    filters.businessCategory = category as BusinessCategory;
  }
  
  // Genre filter (for game genres like action, rpg, fps, etc.)
  const genre = searchParams.get('genre');
  if (genre !== null && genre !== '') filters.genre = genre;
  
  const platform = searchParams.get('platform');
  if (platform !== null && platform !== '') filters.platform = platform.split(',').filter(Boolean);
  
  const region = searchParams.get('region');
  if (region !== null && region !== '') filters.region = region;
  
  const minPrice = searchParams.get('minPrice');
  if (minPrice !== null && minPrice !== '') filters.minPrice = Number(minPrice);
  
  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice !== null && maxPrice !== '') filters.maxPrice = Number(maxPrice);
  
  const sort = searchParams.get('sort');
  if (sort !== null && sort !== '') filters.sortBy = sort as SortOption;
  
  const page = searchParams.get('page');
  if (page !== null && page !== '') filters.page = Number(page);
  
  return filters;
}

function buildURLParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.search !== '') params.set('q', filters.search);
  if (filters.businessCategory !== null) params.set('category', filters.businessCategory);
  if (filters.genre !== '') params.set('genre', filters.genre);
  if (filters.platform.length > 0) params.set('platform', filters.platform.join(','));
  if (filters.region !== '') params.set('region', filters.region);
  if (filters.minPrice > 0) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice < 500) params.set('maxPrice', String(filters.maxPrice));
  if (filters.sortBy !== 'newest') params.set('sort', filters.sortBy);
  if (filters.page > 1) params.set('page', String(filters.page));
  
  return params;
}

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored !== null && stored !== '' ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or other error
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export interface UseCatalogStateReturn {
  // State
  filters: FilterState;
  products: CatalogProduct[];
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Filter actions
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setFilters: (newFilters: Partial<FilterState>) => void;
  resetFilters: () => void;
  clearSearch: () => void;
  
  // Active filters
  activeFilters: ActiveFilter[];
  removeFilter: (filter: ActiveFilter) => void;
  
  // Presets
  savedPresets: FilterPreset[];
  saveCurrentPreset: (name: string) => void;
  applyPreset: (preset: FilterPreset) => void;
  deletePreset: (presetId: string) => void;
  
  // Pagination
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Search history
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Recently viewed
  recentlyViewed: CatalogProduct[];
  addRecentlyViewed: (product: CatalogProduct) => void;
  
  // View preferences
  setViewMode: (mode: ViewMode) => void;
  setItemsPerPage: (count: 24 | 48 | 96) => void;
  
  // Refetch
  refetch: () => void;
}

export function useCatalogState(): UseCatalogStateReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Track hydration status
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Initialize filters from URL only (NOT localStorage - to avoid hydration mismatch)
  const [filters, setFiltersState] = useState<FilterState>(() => {
    const urlFilters = parseFiltersFromURL(searchParams);
    // Always use defaults on initial render to match server
    return {
      ...DEFAULT_FILTERS,
      ...urlFilters,
      viewMode: 'grid', // Default - will be updated after hydration
      itemsPerPage: 24, // Default - will be updated after hydration
    };
  });
  
  // Apply localStorage preferences AFTER hydration to prevent mismatch
  useEffect(() => {
    if (!isHydrated) {
      const storedViewMode = getFromStorage<ViewMode>(STORAGE_KEYS.VIEW_MODE, 'grid');
      const storedItemsPerPage = getFromStorage<24 | 48 | 96>(STORAGE_KEYS.ITEMS_PER_PAGE, 24);
      
      setFiltersState((prev) => ({
        ...prev,
        viewMode: storedViewMode,
        itemsPerPage: storedItemsPerPage,
      }));
      setIsHydrated(true);
    }
  }, [isHydrated]);
  
  // Track if URL sync is happening to avoid infinite loops
  const isInternalNavigation = useRef(false);
  
  // Sync URL changes back to filter state (for external navigation like header menu)
  useEffect(() => {
    // Skip if this is an internal filter change that triggered URL update
    if (isInternalNavigation.current) {
      isInternalNavigation.current = false;
      return;
    }
    
    // Parse URL and update filters if different
    const urlFilters = parseFiltersFromURL(searchParams);
    setFiltersState((prev) => {
      // Only update if URL-controlled filters actually changed
      const hasChanges = 
        prev.search !== (urlFilters.search ?? '') ||
        prev.genre !== (urlFilters.genre ?? '') ||
        prev.platform.join(',') !== (urlFilters.platform ?? []).join(',') ||
        prev.region !== (urlFilters.region ?? '') ||
        prev.minPrice !== (urlFilters.minPrice ?? 0) ||
        prev.maxPrice !== (urlFilters.maxPrice ?? 500) ||
        prev.sortBy !== (urlFilters.sortBy ?? 'newest') ||
        prev.page !== (urlFilters.page ?? 1) ||
        prev.businessCategory !== urlFilters.businessCategory;
      
      if (!hasChanges) return prev;
      
      return {
        ...prev,
        ...urlFilters,
        // Preserve localStorage settings
        viewMode: prev.viewMode,
        itemsPerPage: prev.itemsPerPage,
      };
    });
  }, [searchParams]);
  
  // Saved presets
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>(() => 
    getFromStorage<FilterPreset[]>(STORAGE_KEYS.PRESETS, [])
  );
  
  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    getFromStorage<string[]>(STORAGE_KEYS.RECENT_SEARCHES, [])
  );
  
  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<CatalogProduct[]>(() =>
    getFromStorage<CatalogProduct[]>(STORAGE_KEYS.RECENTLY_VIEWED, [])
  );
  
  // Fetch products
  // Server-side region filtering is now supported, so we use normal pagination
  const fetchLimit = filters.itemsPerPage;
  
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['catalog-products', filters],
    queryFn: () => catalogClient.findAll({
      q: filters.search !== '' ? filters.search : undefined,
      businessCategory: filters.businessCategory ?? undefined,
      category: filters.genre !== '' ? filters.genre : undefined, // Genre filter passed as 'category' to API
      platform: filters.platform.length > 0 ? filters.platform.join(',') : undefined,
      region: filters.region !== '' ? filters.region : undefined, // Server-side region filtering
      minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice < 500 ? filters.maxPrice : undefined,
      sort: filters.sortBy as 'newest' | 'price_asc' | 'price_desc' | 'rating',
      limit: fetchLimit,
      page: filters.page,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Transform API products to CatalogProduct format
  const rawProducts: CatalogProduct[] = useMemo(() => {
    if (data?.data === undefined || data.data === null) return [];
    return data.data.map((p) => {
      const title = p.title ?? '';
      // Use hybrid detection: database region + regional limitations + title patterns
      const dbRegion = (p as { region?: string }).region ?? null;
      const regionalLimitations = (p as { regionalLimitations?: string }).regionalLimitations ?? null;
      // Detect region using all available sources
      const detectedRegions = detectRegionFromTitle(title, dbRegion, regionalLimitations);
      
      return {
        id: p.id,
        slug: p.slug,
        name: title,
        description: p.description ?? '',
        price: p.price,
        currency: p.currency ?? 'EUR',
        image: p.imageUrl ?? undefined,
        platform: p.platform ?? undefined,
        genre: p.category ?? undefined, // Kinguin genre (Action, RPG, etc.)
        category: p.category ?? undefined, // Keep for backwards compatibility
        businessCategory: p.businessCategory ?? undefined, // BitLoot store section
        discount: undefined, // SDK doesn't have discountPercent
        stock: undefined, // SDK doesn't have stock
        isAvailable: p.isPublished,
        rating: p.rating ?? undefined,
        isFeatured: p.isFeatured ?? false,
        // Store detected regions for filtering
        detectedRegions,
        region: detectedRegions.includes('global') ? 'Global' : detectedRegions[0]?.toUpperCase() ?? 'Global',
      };
    });
  }, [data]);
  
  // Server-side filtering is now used, so products come pre-filtered
  // The detectedRegions are still computed for display purposes
  const products: CatalogProduct[] = rawProducts;
  
  // Server handles pagination, no need for client-side pagination
  const paginatedProducts: CatalogProduct[] = products;
  
  // Use server-provided counts
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / filters.itemsPerPage);
  
  // Sync URL with filters (mark as internal to prevent infinite loop with searchParams effect)
  useEffect(() => {
    isInternalNavigation.current = true;
    const params = buildURLParams(filters);
    const paramsStr = params.toString();
    const newURL = paramsStr !== '' ? `${pathname}?${paramsStr}` : pathname;
    router.replace(newURL, { scroll: false });
  }, [filters, pathname, router]);
  
  // Persist view preferences
  useEffect(() => {
    setToStorage(STORAGE_KEYS.VIEW_MODE, filters.viewMode);
  }, [filters.viewMode]);
  
  useEffect(() => {
    setToStorage(STORAGE_KEYS.ITEMS_PER_PAGE, filters.itemsPerPage);
  }, [filters.itemsPerPage]);
  
  // ============================================================================
  // FILTER ACTIONS
  // ============================================================================
  
  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFiltersState((prev) => ({
      ...prev,
      [key]: value,
      // Reset page when filters change (except page itself)
      page: key === 'page' ? (value as number) : 1,
    }));
  }, []);
  
  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      // Reset page unless explicitly set
      page: newFilters.page ?? 1,
    }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFiltersState({
      ...DEFAULT_FILTERS,
      viewMode: filters.viewMode,
      itemsPerPage: filters.itemsPerPage,
    });
  }, [filters.viewMode, filters.itemsPerPage]);
  
  const clearSearch = useCallback(() => {
    setFilter('search', '');
  }, [setFilter]);
  
  // ============================================================================
  // ACTIVE FILTERS
  // ============================================================================
  
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const active: ActiveFilter[] = [];
    
    if (filters.search !== '') {
      active.push({
        type: 'search',
        label: 'Search',
        value: filters.search,
        removeAction: () => clearSearch(),
      });
    }
    
    if (filters.businessCategory !== null) {
      active.push({
        type: 'businessCategory',
        label: 'Category',
        value: filters.businessCategory,
        removeAction: () => setFilter('businessCategory', null),
      });
    }
    
    if (filters.genre !== '') {
      active.push({
        type: 'genre',
        label: 'Genre',
        value: filters.genre.charAt(0).toUpperCase() + filters.genre.slice(1).replace('-', ' '),
        removeAction: () => setFilter('genre', ''),
      });
    }
    
    filters.platform.forEach((p) => {
      active.push({
        type: 'platform',
        label: 'Platform',
        value: p,
        removeAction: () => setFilter('platform', filters.platform.filter((x) => x !== p)),
      });
    });
    
    if (filters.region !== '') {
      active.push({
        type: 'region',
        label: 'Region',
        value: filters.region,
        removeAction: () => setFilter('region', ''),
      });
    }
    
    if (filters.minPrice > 0 || filters.maxPrice < 500) {
      active.push({
        type: 'price',
        label: 'Price',
        value: `$${filters.minPrice} - $${filters.maxPrice}`,
        removeAction: () => setFilters({ minPrice: 0, maxPrice: 500 }),
      });
    }
    
    return active;
  }, [filters, clearSearch, setFilter, setFilters]);
  
  const removeFilter = useCallback((filter: ActiveFilter) => {
    filter.removeAction();
  }, []);
  
  // ============================================================================
  // PRESETS
  // ============================================================================
  
  const saveCurrentPreset = useCallback((name: string) => {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      filters: {
        search: filters.search,
        businessCategory: filters.businessCategory,
        genre: filters.genre,
        platform: filters.platform,
        region: filters.region,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sortBy: filters.sortBy,
      },
      createdAt: new Date(),
    };
    
    const updated = [...savedPresets, newPreset].slice(-5); // Keep max 5 presets
    setSavedPresets(updated);
    setToStorage(STORAGE_KEYS.PRESETS, updated);
  }, [filters, savedPresets]);
  
  const applyPreset = useCallback((preset: FilterPreset) => {
    setFilters(preset.filters);
  }, [setFilters]);
  
  const deletePreset = useCallback((presetId: string) => {
    const updated = savedPresets.filter((p) => p.id !== presetId);
    setSavedPresets(updated);
    setToStorage(STORAGE_KEYS.PRESETS, updated);
  }, [savedPresets]);
  
  // ============================================================================
  // PAGINATION
  // ============================================================================
  
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setFilter('page', validPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setFilter, totalPages]);
  
  const nextPage = useCallback(() => {
    if (filters.page < totalPages) {
      goToPage(filters.page + 1);
    }
  }, [filters.page, totalPages, goToPage]);
  
  const prevPage = useCallback(() => {
    if (filters.page > 1) {
      goToPage(filters.page - 1);
    }
  }, [filters.page, goToPage]);
  
  // ============================================================================
  // SEARCH HISTORY
  // ============================================================================
  
  const addRecentSearch = useCallback((query: string) => {
    if (query.trim() === '') return;
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    setToStorage(STORAGE_KEYS.RECENT_SEARCHES, updated);
  }, [recentSearches]);
  
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    setToStorage(STORAGE_KEYS.RECENT_SEARCHES, []);
  }, []);
  
  // ============================================================================
  // RECENTLY VIEWED
  // ============================================================================
  
  const addRecentlyViewed = useCallback((product: CatalogProduct) => {
    const updated = [product, ...recentlyViewed.filter((p) => p.id !== product.id)].slice(0, MAX_RECENTLY_VIEWED);
    setRecentlyViewed(updated);
    setToStorage(STORAGE_KEYS.RECENTLY_VIEWED, updated);
  }, [recentlyViewed]);
  
  // ============================================================================
  // VIEW PREFERENCES
  // ============================================================================
  
  const setViewMode = useCallback((mode: ViewMode) => {
    setFilter('viewMode', mode);
  }, [setFilter]);
  
  const setItemsPerPage = useCallback((count: 24 | 48 | 96) => {
    setFiltersState((prev) => ({
      ...prev,
      itemsPerPage: count,
      page: 1, // Reset to first page
    }));
  }, []);
  
  return {
    // State
    filters,
    products: paginatedProducts, // Use paginated products (handles both server and client-side pagination)
    totalCount,
    totalPages,
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
    
    // Filter actions
    setFilter,
    setFilters,
    resetFilters,
    clearSearch,
    
    // Active filters
    activeFilters,
    removeFilter,
    
    // Presets
    savedPresets,
    saveCurrentPreset,
    applyPreset,
    deletePreset,
    
    // Pagination
    goToPage,
    nextPage,
    prevPage,
    
    // Search history
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    
    // Recently viewed
    recentlyViewed,
    addRecentlyViewed,
    
    // View preferences
    setViewMode,
    setItemsPerPage,
    
    // Refetch
    refetch: () => { void refetch(); },
  };
}
