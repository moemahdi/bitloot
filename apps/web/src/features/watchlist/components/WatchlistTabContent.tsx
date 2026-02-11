'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  Clock,
  Check,
  Monitor,
  Search,
  LayoutGrid,
  List,
  ShoppingCart,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  Bell,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { CatalogProductCard } from '@/features/catalog/components/CatalogProductCard';
import type { CatalogProduct } from '@/features/catalog/types';

import { useWatchlist, useRemoveFromWatchlist } from '@/features/watchlist';
import { useCart } from '@/context/CartContext';
import { formatRelativeTime } from '@/utils/format-date';

// Custom hook for debouncing values
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Memoized stat card for watchlist
const WatchlistStatCard = memo(function WatchlistStatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  colorClass: string;
}) {
  return (
    <Card className="glass border-border-subtle bg-bg-secondary/50 backdrop-blur-sm card-interactive-glow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}/10`}>
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Memoized empty state component
const WatchlistEmptyState = memo(function WatchlistEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass border-border-subtle border-dashed overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-neon/5 via-transparent to-cyan-glow/5" />
          
          <CardContent className="relative flex flex-col items-center justify-center py-20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 bg-purple-neon/20 blur-2xl rounded-full" />
              <div className="relative p-6 rounded-full bg-gradient-to-br from-purple-neon/20 to-purple-neon/5 border border-purple-neon/30">
                <Heart className="h-12 w-12 text-purple-neon" />
              </div>
            </motion.div>
            
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-text-primary mb-2 text-glow-purple"
            >
              Start Your Watchlist
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-text-secondary max-w-md mb-8"
            >
              Save games you&apos;re interested in and never miss a deal. 
              Get notified when prices drop on your favorite titles.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link href="/">
                <GlowButton variant="default" size="lg">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Browse Games
                </GlowButton>
              </Link>
              <Link href="/deals">
                <Button variant="outline" size="lg" className="border-orange-warning/30 text-orange-warning hover:bg-orange-warning/10">
                  <DollarSign className="mr-2 h-5 w-5" />
                  View Deals
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-border-subtle"
            >
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Heart className="h-4 w-4 text-purple-neon" />
                <span>Track prices</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Bell className="h-4 w-4 text-cyan-glow" />
                <span>Get deal alerts</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <ShoppingCart className="h-4 w-4 text-green-success" />
                <span>Quick add to cart</span>
              </div>
            </motion.div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
});

// Loading skeleton component
const WatchlistSkeleton = memo(function WatchlistSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-lg p-4 space-y-2">
            <div className="skeleton h-4 w-20 animate-shimmer rounded" />
            <div className="skeleton h-8 w-28 animate-shimmer rounded" />
          </div>
        ))}
      </div>
      {/* Grid Skeleton */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass rounded-lg overflow-hidden">
            <div className="skeleton h-48 w-full animate-shimmer" />
            <div className="p-4 space-y-3">
              <div className="skeleton h-5 w-3/4 animate-shimmer rounded" />
              <div className="skeleton h-4 w-1/2 animate-shimmer rounded" />
              <div className="flex justify-between items-center">
                <div className="skeleton h-6 w-20 animate-shimmer rounded" />
                <div className="skeleton h-8 w-8 animate-shimmer rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Main component
function WatchlistTabContentBase(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'name'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const itemsPerPage = 12;
  
  const { data: watchlistData, isLoading, error, refetch } = useWatchlist(currentPage, itemsPerPage);
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { addItem } = useCart();

  const handleAddToCart = useCallback((item: NonNullable<typeof watchlistData>['data'][0]): void => {
    addItem({
      productId: item.product.id,
      slug: item.product.slug,
      title: item.product.title,
      price: item.product.price,
      quantity: 1,
      image: item.product.coverImageUrl ?? undefined,
    });
    toast.success(`${item.product.title} added to cart`);
  }, [addItem]);

  const handleAddAllToCart = useCallback((): void => {
    const items = watchlistData?.data ?? [];
    const availableItems = items.filter(item => item.product.isPublished !== false);
    availableItems.forEach(item => {
      addItem({
        productId: item.product.id,
        slug: item.product.slug,
        title: item.product.title,
        price: item.product.price,
        quantity: 1,
        image: item.product.coverImageUrl ?? undefined,
      });
    });
    toast.success(`${availableItems.length} items added to cart`);
  }, [watchlistData?.data, addItem]);

  const handleRemoveFromWatchlist = useCallback(async (productId: string, productTitle: string): Promise<void> => {
    try {
      await removeFromWatchlist.mutateAsync(productId);
      toast.success(`${productTitle} removed from watchlist`);
    } catch {
      toast.error('Failed to remove from watchlist');
    }
  }, [removeFromWatchlist]);

  // Computed values
  const items = useMemo(() => watchlistData?.data ?? [], [watchlistData?.data]);
  const total = watchlistData?.total ?? 0;
  const totalPages = watchlistData?.totalPages ?? 1;
  
  // Calculate stats
  const availableCount = useMemo(() => 
    items.filter(item => item.product.isPublished !== false).length, 
    [items]
  );
  
  const platformCounts = useMemo(() => 
    items.reduce((acc, item) => {
      const platform = item.product.platform ?? 'Other';
      acc[platform] = (acc[platform] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    [items]
  );
  
  const thisWeekCount = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return items.filter(item => new Date(item.createdAt) >= weekAgo).length;
  }, [items]);
  
  const topPlatform = useMemo(() => {
    const entries = Object.entries(platformCounts);
    if (entries.length === 0) return 'N/A';
    return entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
  }, [platformCounts]);
  
  // Sort and filter items
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Filter by search (using debounced value)
    if (debouncedSearchQuery.trim() !== '') {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(item => 
        item.product.title.toLowerCase().includes(query) ||
        (item.product.platform?.toLowerCase().includes(query) ?? false)
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.product.price - b.product.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.product.price - a.product.price);
        break;
      case 'name':
        result.sort((a, b) => a.product.title.localeCompare(b.product.title));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    return result;
  }, [items, debouncedSearchQuery, sortBy]);

  // Handle page change with memoization
  const handlePrevPage = useCallback(() => {
    setCurrentPage(p => Math.max(1, p - 1));
  }, []);
  
  const handleNextPage = useCallback(() => {
    setCurrentPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);
  
  const handlePageClick = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
  }, []);

  if (isLoading) {
    return <WatchlistSkeleton />;
  }

  if (error !== null) {
    return (
      <Card className="glass border-orange-warning/30">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 rounded-full bg-orange-warning/10">
            <AlertCircle className="h-12 w-12 text-orange-warning" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Failed to load watchlist</h3>
          <p className="text-text-secondary text-center max-w-sm">We couldn&apos;t fetch your saved products. Please try again.</p>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="border-orange-warning/30 text-orange-warning hover:bg-orange-warning/10 hover:border-orange-warning/50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return <WatchlistEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview - Using memoized stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <WatchlistStatCard
          icon={Heart}
          label="Saved Items"
          value={total}
          colorClass="text-purple-neon"
        />
        <WatchlistStatCard
          icon={Clock}
          label="This Week"
          value={<span className="text-cyan-glow">{thisWeekCount}</span>}
          colorClass="text-cyan-glow"
        />
        <WatchlistStatCard
          icon={Check}
          label="Available"
          value={<>{availableCount}<span className="text-sm text-text-muted font-normal">/{total}</span></>}
          colorClass="text-green-success"
        />
        <WatchlistStatCard
          icon={Monitor}
          label="Top Platform"
          value={<span className="text-lg truncate">{topPlatform}</span>}
          colorClass="text-orange-warning"
        />
      </div>

      {/* Toolbar */}
      <Card className="glass border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Search & Sort */}
            <div className="flex flex-1 gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Search watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-bg-tertiary/50 border-border-subtle focus:border-purple-neon/50"
                />
              </div>
              
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger className="w-[180px] bg-bg-tertiary/50 border-border-subtle text-text-primary focus:ring-purple-neon/50 focus:border-purple-neon/50">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-bg-secondary border-border-subtle">
                  <SelectItem value="recent" className="focus:bg-purple-neon/10 focus:text-purple-neon">Recently Added</SelectItem>
                  <SelectItem value="price-low" className="focus:bg-purple-neon/10 focus:text-purple-neon">Price: Low to High</SelectItem>
                  <SelectItem value="price-high" className="focus:bg-purple-neon/10 focus:text-purple-neon">Price: High to Low</SelectItem>
                  <SelectItem value="name" className="focus:bg-purple-neon/10 focus:text-purple-neon">Name: A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center rounded-md border border-border-subtle p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-7 w-7 p-0 ${viewMode === 'grid' ? 'bg-purple-neon/20 text-purple-neon' : 'text-text-muted hover:text-text-primary'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-7 w-7 p-0 ${viewMode === 'list' ? 'bg-purple-neon/20 text-purple-neon' : 'text-text-muted hover:text-text-primary'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Add All to Cart */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAllToCart}
                disabled={availableCount === 0}
                className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/50"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All ({availableCount})
              </Button>
              
              {/* Browse More */}
              <Link href="/">
                <Button variant="outline" size="sm" className="border-border-subtle hover:border-purple-neon/30">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Active Filters Info */}
          {searchQuery.trim() !== '' && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
              <span className="text-sm text-text-muted">
                Showing {filteredItems.length} of {items.length} items
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="h-6 px-2 text-xs text-purple-neon hover:bg-purple-neon/10"
              >
                Clear filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Watchlist Items */}
      {filteredItems.length === 0 ? (
        <Card className="glass border-border-subtle">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text-primary">No matches found</h3>
            <p className="text-text-secondary text-center max-w-sm mt-1">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item, index) => {
            const catalogProduct: CatalogProduct = {
              id: item.product.id,
              slug: item.product.slug,
              name: item.product.title,
              description: item.product.subtitle ?? '',
              price: String(item.product.price),
              currency: 'EUR',
              image: item.product.coverImageUrl ?? undefined,
              platform: item.product.platform ?? undefined,
              region: item.product.region ?? undefined,
              isAvailable: item.product.isPublished !== false,
              rating: 4.8,
            };
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
                className="relative group"
              >
                <CatalogProductCard
                  product={catalogProduct}
                  viewMode="grid"
                  isInWishlist={true}
                  onAddToCart={() => handleAddToCart(item)}
                  onToggleWishlist={async () => {
                    await handleRemoveFromWatchlist(item.product.id, item.product.title);
                  }}
                  showQuickActions={true}
                />
                <div className="absolute bottom-2 right-2 z-10">
                  <Badge variant="secondary" className="text-[10px] bg-bg-tertiary/90 backdrop-blur-sm border border-border-subtle">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    {formatRelativeTime(item.createdAt)}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredItems.map((item, index) => {
            const catalogProduct: CatalogProduct = {
              id: item.product.id,
              slug: item.product.slug,
              name: item.product.title,
              description: item.product.subtitle ?? '',
              price: String(item.product.price),
              currency: 'EUR',
              image: item.product.coverImageUrl ?? undefined,
              platform: item.product.platform ?? undefined,
              region: item.product.region ?? undefined,
              isAvailable: item.product.isPublished !== false,
              rating: 4.8,
            };
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
              >
                <CatalogProductCard
                  product={catalogProduct}
                  viewMode="list"
                  isInWishlist={true}
                  onAddToCart={() => handleAddToCart(item)}
                  onToggleWishlist={async () => {
                    await handleRemoveFromWatchlist(item.product.id, item.product.title);
                  }}
                  showQuickActions={true}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="glass border-border-subtle bg-bg-secondary/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">
                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, total)} of {total} items
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="border-border-subtle hover:border-purple-neon/30"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handlePageClick(pageNum)}
                        className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-purple-neon text-white' : 'text-text-secondary hover:text-text-primary'}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <span className="sm:hidden text-sm text-text-secondary px-2">
                  {currentPage} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="border-border-subtle hover:border-purple-neon/30"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export memoized version to prevent unnecessary re-renders
export const WatchlistTabContent = memo(WatchlistTabContentBase);
