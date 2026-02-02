/**
 * Catalog Page
 * 
 * Complete catalog page with hero, filters, product grid, and pagination.
 * This is the main entry point for the BitLoot catalog redesign.
 */
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCatalogState } from '@/features/catalog/hooks';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useWatchlist,
} from '@/features/watchlist/hooks/useWatchlist';
import {
  CatalogHero,
  CategoryTabs,
  Toolbar,
  FilterPanel,
  MobileFilterSheet,
  MobileFilterTrigger,
  CatalogProductGrid,
  GroupVariantsModal,
  CatalogEmptyState,
  CatalogErrorState,
  CatalogPagination,
} from '@/features/catalog/components';
import { PLATFORMS, REGIONS, GENRES } from '@/features/catalog/types';
import type { FilterPreset, CatalogProduct } from '@/features/catalog/types';
import { CatalogGroupsApi, Configuration, type ProductGroupResponseDto } from '@bitloot/sdk';

export default function CatalogPage(): React.ReactElement {
  const router = useRouter();
  
  // Auth check for watchlist
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Cart context for add to cart
  const { addItem } = useCart();
  
  // Watchlist mutations for API persistence
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  
  // Fetch user's watchlist to populate wishlist IDs (max 50 per API limit)
  // Only fetch when authenticated AND auth is not loading to avoid 400 errors
  const { data: watchlistData } = useWatchlist(1, 50, isAuthenticated && !isAuthLoading);
  
  // Initialize catalog state from hook
  const {
    filters,
    setViewMode,
    products,
    isLoading,
    error,
    totalCount,
    totalPages,
    goToPage,
    setItemsPerPage,
    savedPresets,
    saveCurrentPreset,
    applyPreset,
    deletePreset,
    recentSearches,
    refetch,
    setFilters,
    resetFilters,
    activeFilters,
  } = useCatalogState();
  
  // Extract values from filters for convenience
  const viewMode = filters.viewMode;
  const currentPage = filters.page;
  const itemsPerPage = filters.itemsPerPage;
  
  // Mobile filter sheet state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Wishlist state - populated from API for authenticated users
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  
  // Populate wishlistIds from API when watchlist data loads
  useEffect(() => {
    if (watchlistData?.data !== undefined) {
      const ids = new Set(watchlistData.data.map((item) => item.product.id));
      setWishlistIds(ids);
    }
  }, [watchlistData]);
  
  // Selected group for modal
  const [selectedGroup, setSelectedGroup] = useState<ProductGroupResponseDto | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  
  // Product groups state (fetched from API)
  const [productGroups, setProductGroups] = useState<ProductGroupResponseDto[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  
  // Fetch product groups from API
  useEffect(() => {
    // Only fetch groups on first page without category filter
    const hasCategory = filters.businessCategory !== undefined && filters.businessCategory !== null;
    if (currentPage !== 1 || hasCategory) {
      setProductGroups([]);
      return;
    }
    
    const fetchGroups = async (): Promise<void> => {
      setIsLoadingGroups(true);
      try {
        const config = new Configuration({
          basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
        });
        const api = new CatalogGroupsApi(config);
        const groups = await api.groupsControllerListGroups();
        setProductGroups(groups);
      } catch (err) {
        console.error('Failed to fetch product groups:', err);
        setProductGroups([]);
      } finally {
        setIsLoadingGroups(false);
      }
    };
    
    void fetchGroups();
  }, [currentPage, filters.businessCategory]);
  
  // Filter product groups by search query (client-side)
  const filteredProductGroups = useMemo(() => {
    if (filters.search === '') {
      return productGroups;
    }
    const searchLower = filters.search.toLowerCase();
    return productGroups.filter((group) => {
      const titleMatch = group.title?.toLowerCase().includes(searchLower);
      const taglineMatch = group.tagline?.toLowerCase().includes(searchLower);
      return titleMatch || taglineMatch;
    });
  }, [productGroups, filters.search]);
  
  // Grid products are just all products (no more featured/trending separation)
  const gridProducts = useMemo(() => {
    if (products === null || products === undefined || products.length === 0) {
      return [];
    }
    return products;
  }, [products]);
  
  // Handlers
  const handleAddToCart = useCallback((productId: string) => {
    // Find the product from any available list
    const product = products?.find((p: CatalogProduct) => p.id === productId);
    if (product === undefined || product === null) {
      toast.error('Product not found');
      return;
    }
    
    addItem({
      productId: product.id,
      title: product.name,
      price: parseFloat(product.price),
      quantity: 1,
      image: product.image,
      platform: product.platform,
      category: product.category,
    });
    
    toast.success(`${product.name} added to cart`);
  }, [products, addItem]);
  
  const handleToggleWishlist = useCallback((productId: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please login to add items to your wishlist', {
        action: {
          label: 'Login',
          onClick: () => router.push('/auth/login'),
        },
      });
      return;
    }
    
    // Update local state for immediate UI feedback
    setWishlistIds((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(productId);
      
      if (isAdding) {
        next.add(productId);
        // Persist to API
        addToWatchlist.mutate(productId, {
          onSuccess: () => {
            toast.success('Added to wishlist');
          },
          onError: () => {
            // Revert on error
            setWishlistIds((current) => {
              const reverted = new Set(current);
              reverted.delete(productId);
              return reverted;
            });
            toast.error('Failed to add to wishlist');
          },
        });
      } else {
        next.delete(productId);
        // Persist to API
        removeFromWatchlist.mutate(productId, {
          onSuccess: () => {
            toast.success('Removed from wishlist');
          },
          onError: () => {
            // Revert on error
            setWishlistIds((current) => {
              const reverted = new Set(current);
              reverted.add(productId);
              return reverted;
            });
            toast.error('Failed to remove from wishlist');
          },
        });
      }
      
      return next;
    });
  }, [isAuthenticated, router, addToWatchlist, removeFromWatchlist]);
  
  const handleViewProduct = useCallback((productId: string) => {
    // Find the product to get its slug
    const product = products?.find((p: CatalogProduct) => p.id === productId);
    if (product !== undefined && product !== null) {
      router.push(`/product/${product.slug}`);
    } else {
      // Fallback to ID if product not found
      router.push(`/product/${productId}`);
    }
  }, [router, products]);
  
  const handleViewVariants = useCallback((group: ProductGroupResponseDto) => {
    setSelectedGroup(group);
    setIsGroupModalOpen(true);
  }, []);
  
  const handleSavePreset = useCallback((name: string) => {
    saveCurrentPreset(name);
  }, [saveCurrentPreset]);
  
  const handleApplyPreset = useCallback((preset: FilterPreset) => {
    applyPreset(preset);
  }, [applyPreset]);
  
  const handleDeletePreset = useCallback((presetId: string) => {
    deletePreset(presetId);
  }, [deletePreset]);
  
  const handleSearchSubmit = useCallback((_query: string) => {
    // Search is handled by the filter update - this is just for form submission
  }, []);
  
  // Show hero on first page (keep it visible even during search for smooth UX)
  const showHero = currentPage === 1;
  
  // Error state
  if (error !== null && error !== undefined) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <CatalogErrorState
            error={error}
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      {showHero && (
        <CatalogHero
          totalProducts={totalCount}
          searchValue={filters.search}
          onSearchChange={(value: string) => setFilters({ search: value })}
          onSearch={() => handleSearchSubmit(filters.search)}
        />
      )}
      
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Tabs */}
        <CategoryTabs
          activeCategory={filters.businessCategory}
          onCategoryChange={(category) => setFilters({ businessCategory: category })}
          className="mb-4"
        />
        
        {/* Mobile Filter Trigger - visible only on mobile */}
        <div className="lg:hidden mb-4">
          <MobileFilterTrigger
            activeFilterCount={activeFilters.length}
            onClick={() => setIsMobileFilterOpen(true)}
          />
        </div>
        
        {/* Main Layout with Sidebar */}
        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onReset={resetFilters}
                platforms={PLATFORMS}
                regions={REGIONS}
                genres={GENRES}
                savedPresets={savedPresets}
                onSavePreset={handleSavePreset}
                onApplyPreset={handleApplyPreset}
                onDeletePreset={handleDeletePreset}
                recentSearches={recentSearches}
                onSearchSubmit={handleSearchSubmit}
                showSearch={!showHero}
              />
            </div>
          </aside>
          
          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <Toolbar
              totalCount={totalCount}
              activeFilters={activeFilters}
              sortBy={filters.sortBy}
              viewMode={viewMode}
              itemsPerPage={itemsPerPage}
              isLoading={isLoading}
              onSortChange={(sort) => setFilters({ sortBy: sort })}
              onViewModeChange={setViewMode}
              onItemsPerPageChange={setItemsPerPage}
              onClearAllFilters={resetFilters}
              onRefresh={() => { void refetch(); }}
              showSearch={!showHero}
              searchValue={filters.search}
              onSearchChange={(value: string) => setFilters({ search: value })}
              className="mb-6"
            />
            
            {/* Product Grid or Empty State */}
            {!isLoading && gridProducts.length === 0 && filteredProductGroups.length === 0 ? (
              <CatalogEmptyState
                filters={filters}
                onResetFilters={resetFilters}
                onOpenFilters={() => setIsMobileFilterOpen(true)}
              />
            ) : (
              <>
                <CatalogProductGrid
                  products={gridProducts}
                  productGroups={filteredProductGroups}
                  viewMode={viewMode}
                  isLoading={isLoading}
                  isLoadingGroups={isLoadingGroups}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  onViewProduct={handleViewProduct}
                  onViewVariants={handleViewVariants}
                  wishlistIds={wishlistIds}
                  skeletonCount={itemsPerPage}
                />
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <CatalogPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={itemsPerPage}
                    onPageChange={goToPage}
                    onItemsPerPageChange={setItemsPerPage}
                    className="mt-8 pt-6 border-t border-border-subtle"
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
      
      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={isMobileFilterOpen}
        onOpenChange={setIsMobileFilterOpen}
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
        onApply={() => setIsMobileFilterOpen(false)}
        platforms={PLATFORMS}
        regions={REGIONS}
        genres={GENRES}
        savedPresets={savedPresets}
        onSavePreset={handleSavePreset}
        onApplyPreset={handleApplyPreset}
        onDeletePreset={handleDeletePreset}
        recentSearches={recentSearches}
        onSearchSubmit={handleSearchSubmit}
        showSearch={!showHero}
        totalResults={totalCount}
      />
      
      {/* Product Group Variants Modal */}
      <GroupVariantsModal
        group={selectedGroup}
        open={isGroupModalOpen}
        onOpenChange={setIsGroupModalOpen}
      />
    </div>
  );
}
