'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersApi, FulfillmentApi, AuthenticationApi, SessionsApi, type OrderResponseDto, type OrderItemResponseDto, type UserOrderStatsDto } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useWatchlist, useRemoveFromWatchlist } from '@/features/watchlist';
import { useCart } from '@/context/CartContext';
import { KeyReveal, type OrderItem } from '@/features/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Badge } from '@/design-system/primitives/badge';
import { Loader2, User, Shield, Key, Package, DollarSign, Check, Copy, ShoppingBag, LogOut, LayoutDashboard, Eye, HelpCircle, Mail, Hash, Crown, ShieldCheck, AlertCircle, Fingerprint, Info, Heart, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, RefreshCw, Smartphone, Monitor, Trash2, X, AlertTriangle, MessageSquare, Book, LifeBuoy, Clock, Globe, Activity, Search, Bell, ShoppingCart, LayoutGrid, List, RotateCcw, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { AnimatedGridPattern } from '@/components/animations/FloatingParticles';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { WatchlistProductCard } from '@/features/watchlist/components/WatchlistProductCard';
import { WatchlistPreview } from '@/components/WatchlistPreview';

const usersClient = new UsersApi(apiConfig);
const fulfillmentClient = new FulfillmentApi(apiConfig);

// ============ WATCHLIST TAB CONTENT COMPONENT ============
function WatchlistTabContent(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'name'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 12;
  
  const { data: watchlistData, isLoading, error, refetch } = useWatchlist(currentPage, itemsPerPage);
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { addItem } = useCart();

  const handleAddToCart = (item: NonNullable<typeof watchlistData>['data'][0]): void => {
    addItem({
      productId: item.product.id,
      title: item.product.title,
      price: item.product.price,
      quantity: 1,
      image: item.product.coverImageUrl ?? undefined,
    });
    toast.success(`${item.product.title} added to cart`);
  };

  const handleAddAllToCart = (): void => {
    const items = watchlistData?.data ?? [];
    const availableItems = items.filter(item => item.product.isPublished !== false);
    availableItems.forEach(item => {
      addItem({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: 1,
        image: item.product.coverImageUrl ?? undefined,
      });
    });
    toast.success(`${availableItems.length} items added to cart`);
  };

  const handleRemoveFromWatchlist = async (productId: string, productTitle: string): Promise<void> => {
    try {
      await removeFromWatchlist.mutateAsync(productId);
      toast.success(`${productTitle} removed from watchlist`);
    } catch {
      toast.error('Failed to remove from watchlist');
    }
  };

  // Computed values
  const items = useMemo(() => watchlistData?.data ?? [], [watchlistData?.data]);
  const total = watchlistData?.total ?? 0;
  const totalPages = watchlistData?.totalPages ?? 1;
  
  // Calculate stats
  const totalValue = items.reduce((sum, item) => sum + item.product.price, 0);
  const availableCount = items.filter(item => item.product.isPublished !== false).length;
  const platformCounts = items.reduce((acc, item) => {
    const platform = item.product.platform ?? 'Other';
    acc[platform] = (acc[platform] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort and filter items
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Filter by search
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
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
  }, [items, searchQuery, sortBy]);

  if (isLoading) {
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
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass border-border/50 border-dashed overflow-hidden">
          <div className="relative">
            {/* Background gradient */}
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
                className="text-2xl font-bold text-text-primary mb-2"
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
                <Link href="/bundles">
                  <Button variant="outline" size="lg" className="border-orange-warning/30 text-orange-warning hover:bg-orange-warning/10">
                    <DollarSign className="mr-2 h-5 w-5" />
                    View Deals
                  </Button>
                </Link>
              </motion.div>
              
              {/* Feature hints */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-border/30"
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
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        {/* Total Items */}
        <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm hover:border-purple-neon/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-neon/10">
                <Heart className="h-5 w-5 text-purple-neon" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Saved Items</p>
                <p className="text-2xl font-bold text-text-primary">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Value */}
        <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm hover:border-cyan-glow/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-glow/10">
                <DollarSign className="h-5 w-5 text-cyan-glow" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Total Value</p>
                <p className="text-2xl font-bold text-cyan-glow">€{totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Available Items */}
        <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm hover:border-green-success/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-success/10">
                <Check className="h-5 w-5 text-green-success" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Available</p>
                <p className="text-2xl font-bold text-text-primary">{availableCount}<span className="text-sm text-text-muted font-normal">/{total}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Top Platform */}
        <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm hover:border-orange-warning/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-warning/10">
                <Monitor className="h-5 w-5 text-orange-warning" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Top Platform</p>
                <p className="text-lg font-bold text-text-primary truncate">
                  {Object.entries(platformCounts).length > 0 
                    ? Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
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
                    className="pl-9 bg-bg-tertiary/50 border-border/50 focus:border-purple-neon/50"
                  />
                </div>
                
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 rounded-md bg-bg-tertiary/50 border border-border/50 text-text-primary text-sm focus:border-purple-neon/50 focus:outline-none cursor-pointer"
                >
                  <option value="recent">Recently Added</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center rounded-md border border-border/50 p-1">
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
                  <Button variant="outline" size="sm" className="border-border/50 hover:border-purple-neon/30">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Active Filters Info */}
            {searchQuery.trim() !== '' && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
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
      </motion.div>

      {/* Watchlist Items */}
      {filteredItems.length === 0 ? (
        <Card className="glass border-border/50">
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
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
            >
              <WatchlistProductCard
                product={{
                  id: item.product.id,
                  slug: item.product.slug,
                  title: item.product.title,
                  subtitle: item.product.subtitle,
                  price: item.product.price,
                  coverImageUrl: item.product.coverImageUrl,
                  platform: item.product.platform,
                  region: item.product.region,
                  isPublished: item.product.isPublished,
                }}
                addedAt={item.createdAt}
                onRemove={async (productId: string) => {
                  await handleRemoveFromWatchlist(productId, item.product.title);
                }}
                onAddToCart={() => handleAddToCart(item)}
                isRemoving={removeFromWatchlist.isPending}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredItems.map((item, index) => {
            const isUnavailable = item.product.isPublished === false;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Card className={`glass border-border/50 hover:border-purple-neon/30 transition-all group ${isUnavailable ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <Link href={`/product/${item.product.slug}`} className="shrink-0">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-bg-tertiary">
                          {item.product.coverImageUrl !== undefined && item.product.coverImageUrl !== null && item.product.coverImageUrl !== '' ? (
                            <Image
                              src={item.product.coverImageUrl}
                              alt={item.product.title}
                              width={80}
                              height={80}
                              className={`w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 ${isUnavailable ? 'grayscale' : ''}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-text-muted" />
                            </div>
                          )}
                          {isUnavailable && (
                            <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/80">
                              <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.product.slug}`}>
                          <h3 className="font-semibold text-text-primary truncate group-hover:text-purple-neon transition-colors">
                            {item.product.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {item.product.platform !== undefined && item.product.platform !== '' && (
                            <Badge variant="outline" className="text-xs border-border/50">
                              {item.product.platform}
                            </Badge>
                          )}
                          {item.product.region !== undefined && item.product.region !== '' && (
                            <Badge variant="outline" className="text-xs border-border/50">
                              {item.product.region}
                            </Badge>
                          )}
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Added {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Price & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-cyan-glow">€{item.product.price.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                            disabled={isUnavailable}
                            className="bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20 border border-cyan-glow/30"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleRemoveFromWatchlist(item.product.id, item.product.title)}
                            disabled={removeFromWatchlist.isPending}
                            className="border-orange-warning/30 text-orange-warning hover:bg-orange-warning/10"
                          >
                            {removeFromWatchlist.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="glass border-border/50 bg-bg-secondary/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, total)} of {total} items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-border/50 hover:border-purple-neon/30"
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
                          onClick={() => setCurrentPage(pageNum)}
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
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="border-border/50 hover:border-purple-neon/30"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default function ProfilePage(): React.ReactElement {
  const { user, logout, accessToken, sessionId } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Sync activeTab with URL query params
  const urlTab = searchParams.get('tab');
  const validTabs = ['overview', 'purchases', 'watchlist', 'security', 'account', 'help'];
  const [activeTab, setActiveTab] = useState(() => 
    urlTab !== null && validTabs.includes(urlTab) ? urlTab : 'overview'
  );

  // State for expanded orders in Purchases tab
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  // State for tracking download in progress
  const [_downloadingOrder, setDownloadingOrder] = useState<string | null>(null);
  // State for tracking key recovery in progress
  const [recoveringOrder, setRecoveringOrder] = useState<string | null>(null);
  
  // Purchases pagination, filtering, and search state
  const [purchasesPage, setPurchasesPage] = useState(1);
  const purchasesPerPage = 10;
  // Dynamic filter type - supports all status categories including new ones
  const [purchasesStatusFilter, setPurchasesStatusFilter] = useState<'all' | 'fulfilled' | 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled'>('all');
  const [purchasesSearchQuery, setPurchasesSearchQuery] = useState('');

  // Security tab state
  const [newEmail, setNewEmail] = useState('');
  const [oldEmailOtp, setOldEmailOtp] = useState('');
  const [newEmailOtp, setNewEmailOtp] = useState('');
  const [isEmailChangeStep, setIsEmailChangeStep] = useState<'idle' | 'otp' | 'verifying'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Dismissible sections
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  // Sessions pagination state
  const [sessionsPage, setSessionsPage] = useState(1);
  const sessionsPerPage = 5;
  
  // API clients
  const queryClient = useQueryClient();
  const authClient = new AuthenticationApi(apiConfig);
  const sessionsClient = new SessionsApi(apiConfig);

  // Update activeTab when URL changes
  useEffect(() => {
    if (urlTab !== null && validTabs.includes(urlTab)) {
      setActiveTab(urlTab);
    }
    // validTabs is a stable array, no need to include in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab]);

  // Handle tab change and update URL
  const handleTabChange = (newTab: string): void => {
    setActiveTab(newTab);
    // Update URL with new tab parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Fetch ALL user's orders (for accurate stats and client-side filtering/pagination)
  // Using a high limit to get all orders - typical user has < 100 orders
  const { data: allOrders, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery<OrderResponseDto[]>({
    queryKey: ['profile-orders-all'],
    queryFn: async () => {
      try {
        const response = await usersClient.usersControllerGetOrdersRaw({
          page: 1,
          limit: 500, // Fetch all orders for accurate stats and filtering
        });
        if (response.raw.ok) {
          const result = (await response.raw.json()) as {
            data: OrderResponseDto[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
          return result.data;
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        return [];
      }
    },
    enabled: user !== null && user !== undefined,
    staleTime: 0, // Always consider data stale to fetch fresh status
    refetchOnMount: 'always', // Refetch when component mounts (tab visited)
    refetchOnWindowFocus: true, // Refetch when user returns to window
  });

  // Fetch active sessions
  interface SessionData {
    id: string;
    deviceInfo: string;
    ipAddress: string;
    lastActiveAt: string;
    createdAt: string;
    isCurrent: boolean;
  }
  
  interface SessionsResponse {
    sessions: SessionData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery<SessionsResponse>({
    queryKey: ['active-sessions', sessionId, sessionsPage, sessionsPerPage],
    queryFn: async () => {
      try {
        // Build query params with pagination and currentSessionId
        const params = new URLSearchParams();
        if (sessionId !== null) params.append('currentSessionId', sessionId);
        params.append('page', sessionsPage.toString());
        params.append('limit', sessionsPerPage.toString());
        const queryParams = params.toString() !== '' ? `?${params.toString()}` : '';
        console.info('📋 Fetching sessions with currentSessionId:', sessionId, 'page:', sessionsPage);
        const response = await fetch(`${apiConfig.basePath}/sessions${queryParams}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const result = (await response.json()) as SessionsResponse;
          console.info('📋 Sessions received:', result.sessions.map(s => ({ id: s.id, isCurrent: s.isCurrent })));
          
          // ========== REVOKED SESSION CHECK ==========
          // If we passed a currentSessionId but no session is marked as current,
          // it means our session was revoked or expired. Trigger full logout.
          // Only check on first page to avoid false positives
          if (sessionsPage === 1 && sessionId !== null && result.sessions.length > 0) {
            const hasCurrentSession = result.sessions.some(s => s.isCurrent);
            if (!hasCurrentSession) {
              console.warn('🚫 Current session was revoked - logging out');
              toast.error('Your session was revoked. Please log in again.');
              // Use setTimeout to allow toast to show before logout
              setTimeout(() => {
                logout();
              }, 500);
              return { sessions: [], total: 0, page: 1, limit: sessionsPerPage, totalPages: 0 };
            }
          }
          
          // Edge case: No sessions at all means all were revoked (only check on first page)
          if (sessionsPage === 1 && sessionId !== null && result.sessions.length === 0 && result.total === 0) {
            console.warn('🚫 No active sessions found - logging out');
            toast.error('Your session has expired. Please log in again.');
            setTimeout(() => {
              logout();
            }, 500);
            return { sessions: [], total: 0, page: 1, limit: sessionsPerPage, totalPages: 0 };
          }
          
          return result;
        }
        return { sessions: [], total: 0, page: 1, limit: sessionsPerPage, totalPages: 0 };
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        return { sessions: [], total: 0, page: 1, limit: sessionsPerPage, totalPages: 0 };
      }
    },
    enabled: user !== null && user !== undefined && activeTab === 'security' && accessToken !== null,
    staleTime: 30000,
  });
  
  // Extract sessions data for easier access
  const sessions = sessionsData?.sessions ?? [];
  const sessionsTotalPages = sessionsData?.totalPages ?? 1;
  const sessionsTotal = sessionsData?.total ?? 0;

  // Fetch account deletion status
  interface DeletionStatus {
    deletionRequested: boolean;
    deletionScheduledAt: string | null;
    daysRemaining: number | null;
  }
  
  // API response interface (different from UI interface)
  interface DeletionStatusApiResponse {
    success: boolean;
    message: string;
    deletionDate: string | null;
    daysRemaining: number | null;
  }
  
  const { data: deletionStatus, refetch: _refetchDeletionStatus } = useQuery<DeletionStatus | null>({
    queryKey: ['deletion-status'],
    queryFn: async () => {
      try {
        const response = await authClient.authControllerGetAccountDeletionStatusRaw({});
        if (response.raw.ok) {
          const apiData = (await response.raw.json()) as DeletionStatusApiResponse;
          // Map API response to UI interface
          return {
            deletionRequested: apiData.deletionDate !== null,
            deletionScheduledAt: apiData.deletionDate,
            daysRemaining: apiData.daysRemaining,
          };
        }
        return null;
      } catch (error) {
        console.error('Failed to fetch deletion status:', error);
        return null;
      }
    },
    enabled: user !== null && user !== undefined && activeTab === 'security',
    staleTime: 0, // Always consider stale to ensure fresh data
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
  });

  // Email change mutations (Dual-OTP: old email + new email verification)
  const requestEmailChangeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await authClient.authControllerRequestEmailChangeRaw({
        requestEmailChangeDto: { newEmail: email }
      });
      if (!response.raw.ok) {
        const errorResponse: unknown = await response.raw.json();
        const error = errorResponse as { message?: string };
        throw new Error(error.message ?? 'Failed to request email change');
      }
      const successResponse: unknown = await response.raw.json();
      return successResponse as { message: string };
    },
    onSuccess: () => {
      setIsEmailChangeStep('otp');
      toast.success('Verification codes sent to both your current and new email addresses');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const verifyEmailChangeMutation = useMutation({
    mutationFn: async ({ oldCode, newCode }: { oldCode: string; newCode: string }) => {
      const response = await authClient.authControllerVerifyEmailChangeRaw({
        verifyEmailChangeDto: { oldEmailCode: oldCode, newEmailCode: newCode }
      });
      if (!response.raw.ok) {
        const errorResponse: unknown = await response.raw.json();
        const error = errorResponse as { message?: string };
        throw new Error(error.message ?? 'Failed to verify email change');
      }
      const successResponse: unknown = await response.raw.json();
      return successResponse as { message: string };
    },
    onSuccess: () => {
      setIsEmailChangeStep('idle');
      setNewEmail('');
      setOldEmailOtp('');
      setNewEmailOtp('');
      toast.success('Email address updated successfully!');
      // Refresh user data
      void queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Sessions refresh handler with feedback
  const handleRefreshSessions = async (): Promise<void> => {
    try {
      await refetchSessions();
      toast.success('Sessions refreshed');
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
      toast.error('Failed to refresh sessions');
    }
  };

  // Session mutations
  const revokeSessionMutation = useMutation({
    mutationFn: async (revokeSessionId: string) => {
      const response = await sessionsClient.sessionControllerRevokeSessionRaw({ sessionId: revokeSessionId });
      if (!response.raw.ok) {
        throw new Error('Failed to revoke session');
      }
      // Return whether this was the current session
      return revokeSessionId === sessionId;
    },
    onSuccess: (wasCurrentSession) => {
      if (wasCurrentSession) {
        toast.success('Current session ended. Logging out...');
        // Small delay to show the toast, then logout
        setTimeout(() => {
          logout();
        }, 1500);
      } else {
        toast.success('Session revoked');
        void refetchSessions();
      }
    },
    onError: () => {
      toast.error('Failed to revoke session');
    }
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: async () => {
      const response = await sessionsClient.sessionControllerRevokeAllSessionsRaw({});
      if (!response.raw.ok) {
        throw new Error('Failed to revoke all sessions');
      }
    },
    onSuccess: () => {
      toast.success('All sessions revoked. Logging out...');
      // Revoke all includes current, so logout
      setTimeout(() => {
        logout();
      }, 1500);
    },
    onError: () => {
      toast.error('Failed to revoke sessions');
    }
  });

  // Account deletion mutations
  const requestDeletionMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.authControllerRequestAccountDeletionRaw({
        requestDeletionDto: { confirmation: 'DELETE' }
      });
      if (!response.raw.ok) {
        const errorResponse: unknown = await response.raw.json();
        const error = errorResponse as { message?: string };
        throw new Error(error.message ?? 'Failed to request account deletion');
      }
      const successResponse: unknown = await response.raw.json();
      return successResponse as { message: string };
    },
    onSuccess: async () => {
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      toast.success('Account deletion scheduled. You have 30 days to cancel.');
      // Invalidate and refetch the deletion status cache
      await queryClient.invalidateQueries({ queryKey: ['deletion-status'] });
      await queryClient.refetchQueries({ queryKey: ['deletion-status'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Cancel deletion mutation - redirects to cancel-deletion page for consistent UX
  const cancelDeletionMutation = useMutation({
    mutationFn: async () => {
      // Get cancellation token from API - use the typed method, not raw
      const data = await authClient.authControllerGetCancellationToken();
      return data;
    },
    onSuccess: (data) => {
      // Redirect to the cancel-deletion page with the token
      router.push(`/cancel-deletion/${data.token}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
 
  // Fetch user order stats from dedicated API endpoint (no pagination limits)
  const { data: apiStats } = useQuery<UserOrderStatsDto>({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      try {
        return await usersClient.usersControllerGetStats();
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        return {
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          processingOrders: 0,
          failedOrders: 0,
          totalSpent: '0',
          digitalDownloads: 0,
        };
      }
    },
    enabled: user !== null && user !== undefined,
    staleTime: 30_000, // Cache for 30 seconds
  });

  // Order stats from API (accurate, not limited by pagination)
  const orderStats = useMemo(() => ({
    totalOrders: apiStats?.totalOrders ?? 0,
    completedOrders: apiStats?.completedOrders ?? 0,
    pendingOrders: apiStats?.pendingOrders ?? 0,
    processingOrders: apiStats?.processingOrders ?? 0,
    failedOrders: apiStats?.failedOrders ?? 0,
    totalSpent: parseFloat(apiStats?.totalSpent ?? '0'),
    digitalDownloads: apiStats?.digitalDownloads ?? 0,
  }), [apiStats]);

  // Dynamic filter categories based on actual orders present
  // Groups raw statuses into filter categories and counts orders per category
  const dynamicFilterCategories = useMemo(() => {
    if (allOrders === null || allOrders === undefined || allOrders.length === 0) {
      return [];
    }

    // Define status groupings (same as filtering logic)
    const statusToCategory: Record<string, string> = {
      // Fulfilled/Completed
      'fulfilled': 'fulfilled',
      // Paid/Processing
      'paid': 'paid',
      // Pending states
      'pending': 'pending',
      'waiting': 'pending',
      'confirming': 'pending',
      'created': 'pending',
      // Failed states
      'failed': 'failed',
      'underpaid': 'failed',
      'expired': 'failed',
      // Refunded
      'refunded': 'refunded',
      // Cancelled
      'cancelled': 'cancelled',
    };

    // Count orders per category
    const categoryCounts: Record<string, number> = {};
    
    allOrders.forEach((order: OrderResponseDto) => {
      const status = order.status ?? 'pending';
      const category = statusToCategory[status] ?? 'pending';
      categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
    });

    // Define display order and styling for each category
    type FilterCategoryKey = 'fulfilled' | 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled';
    type FilterCategory = {
      key: FilterCategoryKey;
      label: string;
      count: number;
      icon: 'Key' | 'RefreshCw' | 'Clock' | 'AlertTriangle' | 'RotateCcw' | 'XCircle';
      activeClass: string;
    };

    const categoryConfig: Record<FilterCategoryKey, Omit<FilterCategory, 'key' | 'count'>> = {
      'fulfilled': { label: 'Completed', icon: 'Key', activeClass: 'bg-green-success text-black' },
      'paid': { label: 'Processing', icon: 'RefreshCw', activeClass: 'bg-blue-500 text-white' },
      'pending': { label: 'Pending', icon: 'Clock', activeClass: 'bg-orange-warning text-black' },
      'failed': { label: 'Failed', icon: 'AlertTriangle', activeClass: 'bg-red-500 text-white' },
      'refunded': { label: 'Refunded', icon: 'RotateCcw', activeClass: 'bg-purple-500 text-white' },
      'cancelled': { label: 'Cancelled', icon: 'XCircle', activeClass: 'bg-gray-500 text-white' },
    };

    // Build array of categories that have orders (in display order)
    const displayOrder: FilterCategoryKey[] = ['fulfilled', 'paid', 'pending', 'failed', 'refunded', 'cancelled'];
    
    const result: FilterCategory[] = displayOrder
      .filter(key => (categoryCounts[key] ?? 0) > 0)
      .map(key => ({
        key,
        count: categoryCounts[key] ?? 0,
        label: categoryConfig[key].label,
        icon: categoryConfig[key].icon,
        activeClass: categoryConfig[key].activeClass,
      }));

    return result;
  }, [allOrders]);

  // Client-side filtering for purchases (applied to ALL orders)
  const filteredOrders = useMemo(() => {
    if (allOrders === null || allOrders === undefined) return [];
    
    let filtered = [...allOrders];
    
    // Filter by status - handle grouped statuses
    if (purchasesStatusFilter !== 'all') {
      filtered = filtered.filter((order: OrderResponseDto) => {
        const status = order.status ?? 'pending';
        
        if (purchasesStatusFilter === 'failed') {
          // 'failed' filter includes: failed, underpaid, expired
          return status === 'failed' || status === 'underpaid' || status === 'expired';
        }
        
        if (purchasesStatusFilter === 'pending') {
          // 'pending' filter includes: pending, waiting, confirming, created
          return status === 'pending' || status === 'waiting' || status === 'confirming' || status === 'created';
        }
        
        // Direct match for: fulfilled, paid, refunded, cancelled
        return status === purchasesStatusFilter;
      });
    }
    
    // Filter by search query (Order ID - matches both full ID and short ID)
    if (purchasesSearchQuery.trim() !== '') {
      const query = purchasesSearchQuery.toLowerCase().replace('#', '');
      filtered = filtered.filter((order: OrderResponseDto) => 
        order.id.toLowerCase().includes(query) ||
        order.id.slice(-8).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allOrders, purchasesStatusFilter, purchasesSearchQuery]);

  // Client-side pagination (applied after filtering)
  const paginatedPurchases = useMemo(() => {
    const startIndex = (purchasesPage - 1) * purchasesPerPage;
    return filteredOrders.slice(startIndex, startIndex + purchasesPerPage);
  }, [filteredOrders, purchasesPage, purchasesPerPage]);

  // Calculate pagination info
  const purchasesTotalPages = filteredOrders.length > 0 ? Math.ceil(filteredOrders.length / purchasesPerPage) : 1;

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setPurchasesPage(1);
  }, [purchasesStatusFilter, purchasesSearchQuery]);

  // Download keys for a fulfilled order
  const _handleDownloadKeys = async (orderId: string): Promise<void> => {
    setDownloadingOrder(orderId);
    try {
      const response = await fulfillmentClient.fulfillmentControllerGetDownloadLink({ id: orderId });
      if (response.signedUrl != null && response.signedUrl !== '') {
        // Open the signed URL in a new tab to download the keys
        window.open(response.signedUrl, '_blank');
        toast.success('Keys download started!');
      } else {
        toast.error('Download link not available. Keys may not be ready yet or have expired. Please contact support.');
      }
    } catch (error: unknown) {
      console.error('Failed to get download link:', error);
      
      // Parse error message for better user feedback
      let errorMessage = 'Failed to download keys. Please try again.';
      
      if (error !== null && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
        if (err.response?.status === 404) {
          errorMessage = 'Order not found. Please refresh the page and try again.';
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to access this order.';
        } else if (err.response?.status === 410) {
          errorMessage = 'Download link has expired. Keys are still available - please use the "View & Copy Keys" option instead.';
        } else if (err.message !== undefined && err.message !== null && (err.message.includes('network') || err.message.includes('fetch'))) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.response?.data?.message !== undefined && err.response?.data?.message !== null) {
          errorMessage = `Download failed: ${err.response.data.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setDownloadingOrder(null);
    }
  };

  // Recover keys for orders stuck at 'paid' status with null signedUrl
  const handleRecoverKeys = async (orderId: string): Promise<void> => {
    setRecoveringOrder(orderId);
    try {
      const response = await fulfillmentClient.fulfillmentControllerRecoverOrder({ id: orderId });
      
      // Check if recovery was successful
      if (response.recovered) {
        // Count successful recoveries
        const successfulItems = response.items.filter(item => item.signedUrl !== null).length;
        const totalItems = response.items.length;
        
        if (successfulItems === totalItems) {
          toast.success(`All ${totalItems} keys recovered successfully! Refreshing orders...`);
        } else if (successfulItems > 0) {
          toast.warning(`${successfulItems} of ${totalItems} keys recovered successfully. Some items may still be processing.`);
        } else {
          toast.error('Keys are not ready yet. Please try again in a few minutes or contact support if this persists.');
        }
        await refetchOrders();
      } else {
        // Recovery failed
        toast.error('Failed to recover keys. Keys may not be ready yet or there was an issue. Please contact support if this continues.');
      }
    } catch (error: unknown) {
      console.error('Failed to recover keys:', error);
      
      // Parse error message for better user feedback
      let errorMessage = 'Failed to recover keys. Please contact support.';
      
      if (error !== null && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
        if (err.response?.status === 404) {
          errorMessage = 'Order not found. Please refresh the page and try again.';
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to access this order.';
        } else if (err.response?.status === 400) {
          errorMessage = 'Invalid request. The order may not be eligible for key recovery.';
        } else if (err.message !== undefined && err.message !== null && (err.message.includes('network') || err.message.includes('fetch'))) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.response?.data?.message !== undefined && err.response?.data?.message !== null) {
          errorMessage = `Recovery failed: ${err.response.data.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setRecoveringOrder(null);
    }
  };

  // Loading state
  if (user === null || user === undefined) {
    return (
      <div className="container mx-auto max-w-6xl py-8 space-y-8">
        {/* Banner Skeleton */}
        <div className="glass rounded-xl p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="skeleton h-8 w-64 animate-shimmer rounded" />
              <div className="skeleton h-5 w-96 animate-shimmer rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton h-8 w-32 animate-shimmer rounded-full" />
              <div className="skeleton h-8 w-24 animate-shimmer rounded" />
            </div>
          </div>
        </div>
        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-6 space-y-3">
              <div className="skeleton h-5 w-24 animate-shimmer rounded" />
              <div className="skeleton h-8 w-16 animate-shimmer rounded" />
            </div>
          ))}
        </div>
        {/* Tabs Skeleton */}
        <div className="glass rounded-xl p-1">
          <div className="skeleton h-10 w-full animate-shimmer rounded" />
        </div>
        <div className="skeleton h-64 w-full animate-shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-8" role="region" aria-label="User profile dashboard">
      {/* Neon Welcome Banner */}
      <div className="glass relative overflow-hidden rounded-xl border border-cyan-glow/20 bg-bg-secondary p-8 shadow-lg shadow-cyan-glow/5">
        <div className="absolute inset-0 opacity-30">
          <AnimatedGridPattern />
        </div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Welcome back, <span className="text-gradient-primary">{user.email.split('@')[0]}</span>
            </h1>
            <p className="text-text-secondary">Manage your profile, security, and digital keys all in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-green-success/30 bg-green-success/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="status-dot status-dot-success" />
              <span className="text-sm font-medium text-green-success">Account Active</span>
            </div>
            {user.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-300"
              >
                <Link href="/admin">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Admin Dashboard
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              aria-label="Log out of your account"
              onClick={() => {
                // User confirmed logout action by clicking button
                logout();
                toast.success('Logged out successfully');
              }}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Animated Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          title="Total Orders"
          value={orderStats.totalOrders}
          icon={Package}
          color="cyan"
          delay={0.1}
        />
        <DashboardStatCard
          title="Completed"
          value={orderStats.completedOrders}
          icon={Check}
          color="green"
          delay={0.2}
        />
        <DashboardStatCard
          title="Total Spent"
          value={`€${orderStats.totalSpent.toFixed(2)}`}
          icon={DollarSign}
          color="orange"
          delay={0.3}
        />
        <DashboardStatCard
          title="Digital Downloads"
          value={orderStats.digitalDownloads}
          icon={Key}
          color="purple"
          delay={0.4}
        />
      </div>

      {/* Main Tabs Section */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="glass grid w-full grid-cols-6 border border-border/30 bg-bg-secondary/50 p-1 backdrop-blur-sm">
          <TabsTrigger
            value="overview"
            aria-label="Overview tab - view dashboard summary"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="purchases"
            aria-label="My Purchases tab - view order history and download keys"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Purchases</span>
          </TabsTrigger>
          <TabsTrigger
            value="watchlist"
            aria-label="Watchlist tab - view and manage your saved products"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Watchlist</span>
          </TabsTrigger>
          <TabsTrigger
            value="account"
            aria-label="Account tab - view profile information"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            aria-label="Security tab - manage password and security settings"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>

          <TabsTrigger
            value="help"
            aria-label="Help tab - frequently asked questions and support"
            className="flex items-center justify-center gap-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary data-[state=active]:bg-cyan-glow/10 data-[state=active]:text-cyan-glow data-[state=active]:shadow-glow-sm"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Dashboard Grid - Redesigned Layout */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column - Watchlist Preview (Larger, Prominent) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-5"
            >
              <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-neon/10">
                        <Heart className="h-4 w-4 text-purple-neon" />
                      </div>
                      <div>
                        <CardTitle className="text-text-primary text-base">Your Watchlist</CardTitle>
                        <p className="text-xs text-text-muted">Games you&apos;re tracking</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleTabChange('watchlist')}
                      className="text-xs text-purple-neon hover:text-purple-neon hover:bg-purple-neon/10"
                    >
                      View All
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <WatchlistPreview />
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Quick Actions + Activity */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quick Actions - Horizontal Row (Dismissible) */}
              {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-glow/10">
                          <LayoutDashboard className="h-4 w-4 text-cyan-glow" />
                        </div>
                        <CardTitle className="text-text-primary text-base">Quick Actions</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50"
                        onClick={() => setShowQuickActions(false)}
                        aria-label="Dismiss Quick Actions"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-1.5 py-3 border-cyan-glow/20 hover:border-cyan-glow/50 hover:bg-cyan-glow/5 group"
                        onClick={() => handleTabChange('purchases')}
                      >
                        <ShoppingBag className="h-5 w-5 text-cyan-glow group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium">Orders</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-1.5 py-3 border-orange-warning/20 hover:border-orange-warning/50 hover:bg-orange-warning/5 group"
                        asChild
                      >
                        <Link href="/deals">
                          <DollarSign className="h-5 w-5 text-orange-warning group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium">Deals</span>
                        </Link>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-1.5 py-3 border-green-success/20 hover:border-green-success/50 hover:bg-green-success/5 group"
                        asChild
                      >
                        <Link href="/catalog?sort=trending">
                          <Activity className="h-5 w-5 text-green-success group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium">Trending</span>
                        </Link>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-auto flex-col gap-1.5 py-3 border-purple-neon/20 hover:border-purple-neon/50 hover:bg-purple-neon/5 group"
                        asChild
                      >
                        <Link href="/catalog?sort=newest">
                          <Globe className="h-5 w-5 text-purple-neon group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium">New</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )}

              {/* Activity Insights - Compact 2x2 Grid */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-success/10">
                          <Activity className="h-4 w-4 text-green-success" />
                        </div>
                        <CardTitle className="text-text-primary text-base">Activity Insights</CardTitle>
                      </div>
                      {allOrders !== null && allOrders !== undefined && allOrders.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-cyan-glow hover:text-cyan-glow hover:bg-cyan-glow/10"
                          onClick={() => handleTabChange('purchases')}
                        >
                          View All
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingOrders ? (
                      <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-glow" />
                      </div>
                    ) : allOrders === null || allOrders === undefined || allOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-24 text-center">
                        <Activity className="h-8 w-8 text-text-muted mb-2" />
                        <p className="text-sm text-text-muted">No activity yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {/* Last Purchase Card */}
                        {(() => {
                          const lastOrder = allOrders[0];
                          const lastOrderItems = lastOrder?.items ?? [];
                          const daysSinceLastOrder = lastOrder !== null && lastOrder !== undefined
                            ? Math.floor((Date.now() - new Date(lastOrder.createdAt ?? new Date()).getTime()) / (1000 * 60 * 60 * 24))
                            : 0;
                          
                          return lastOrder !== null && lastOrder !== undefined && (
                            <div className="rounded-lg border border-cyan-glow/20 bg-cyan-glow/5 p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-medium text-text-muted">Last Purchase</p>
                                <Badge variant="outline" className="text-[10px] px-1.5 h-4">
                                  {daysSinceLastOrder === 0 ? 'Today' : daysSinceLastOrder === 1 ? '1d' : `${daysSinceLastOrder}d`}
                                </Badge>
                              </div>
                              <p className="text-sm font-semibold text-text-primary truncate">
                                {lastOrderItems[0]?.productTitle ?? 'Unknown'}
                              </p>
                              <p className="text-xs text-cyan-glow font-medium mt-1">
                                €{(() => { 
                                  const total = typeof lastOrder.total === 'string' ? parseFloat(lastOrder.total) : (lastOrder.total ?? 0); 
                                  return typeof total === 'number' ? total.toFixed(2) : '0.00'; 
                                })()}
                              </p>
                            </div>
                          );
                        })()}
                        
                        {/* Total Stats */}
                        <div className="rounded-lg border border-purple-neon/20 bg-purple-neon/5 p-3">
                          <p className="text-xs font-medium text-text-muted mb-1.5">Total Orders</p>
                          <p className="text-2xl font-bold text-purple-neon">{orderStats.totalOrders}</p>
                          <p className="text-xs text-text-muted mt-1">
                            {orderStats.completedOrders} completed
                          </p>
                        </div>
                        
                        {/* Browse Trending */}
                        <Link 
                          href="/catalog?sort=trending"
                          className="rounded-lg border border-green-success/20 bg-green-success/5 p-3 hover:bg-green-success/10 hover:border-green-success/40 transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Globe className="h-3.5 w-3.5 text-green-success" />
                            <p className="text-xs font-medium text-text-muted">Trending</p>
                          </div>
                          <p className="text-sm font-semibold text-text-primary group-hover:text-green-success transition-colors">
                            Popular Games
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            See what others buy
                          </p>
                        </Link>
                        
                        {/* Browse Deals */}
                        <Link 
                          href="/deals"
                          className="rounded-lg border border-orange-warning/20 bg-gradient-to-br from-orange-warning/10 to-orange-warning/5 p-3 hover:from-orange-warning/15 hover:border-orange-warning/40 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3.5 w-3.5 text-orange-warning" />
                              <p className="text-xs font-medium text-text-muted">Deals</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 h-4 border-orange-warning/30 text-orange-warning">
                              Hot
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-text-primary group-hover:text-orange-warning transition-colors">
                            Save up to 70%
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            Limited time offers
                          </p>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Recent Orders - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-text-primary">Recent Orders</CardTitle>
                    <CardDescription className="text-text-secondary">Your latest purchases and their status</CardDescription>
                  </div>
                  {allOrders !== null && allOrders !== undefined && allOrders.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTabChange('purchases')}
                      className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
                    >
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                  </div>
                ) : (allOrders === null || allOrders === undefined || allOrders.length === 0) ? (
                  <div className="flex h-64 flex-col items-center justify-center text-center px-4">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow/10 to-purple-neon/10 border border-cyan-glow/20">
                      <Package className="h-10 w-10 text-cyan-glow" />
                    </div>
                    <p className="text-xl font-bold text-text-primary mb-2">Start Your Gaming Journey</p>
                    <p className="text-sm text-text-muted mb-6 max-w-md">
                      Discover thousands of games at amazing prices. Instant delivery, secure payments, 24/7 support.
                    </p>
                    <div className="flex gap-3">
                      <GlowButton size="default" asChild>
                        <Link href="/bundles">
                          <DollarSign className="h-4 w-4 mr-2" />
                          View Deals
                        </Link>
                      </GlowButton>
                      <Button variant="outline" size="default" asChild className="border-purple-neon/30 text-purple-neon hover:bg-purple-neon/10">
                        <Link href="/?sort=trending">
                          <Activity className="h-4 w-4 mr-2" />
                          Trending Games
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allOrders.slice(0, 5).map((order: OrderResponseDto, index: number) => {
                      // Extract order items info
                      const items = order.items ?? [];
                      const totalItems = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
                      const firstItem = items[0];
                      const hasMultipleItems = items.length > 1;
                      
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          key={order.id}
                          className="group rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 transition-all hover:border-cyan-glow/30 hover:bg-bg-tertiary/50 hover:shadow-[0_0_15px_rgba(0,217,255,0.05)] cursor-pointer"
                          onClick={() => handleTabChange('purchases')}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-primary text-cyan-glow">
                              <Package className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Order ID and Date */}
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-text-primary font-mono text-sm">#{order.id.slice(-8)}</p>
                                <span className="text-text-muted">•</span>
                                <p className="text-xs text-text-secondary">
                                  {new Date(order.createdAt ?? new Date()).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              
                              {/* Product Title(s) */}
                              {firstItem !== null && firstItem !== undefined && (
                                <p className="text-sm text-text-primary mb-1 truncate">
                                  {firstItem.productTitle ?? 'Digital Product'}
                                  {hasMultipleItems && (
                                    <span className="text-text-muted ml-1">
                                      + {items.length - 1} more {items.length - 1 === 1 ? 'item' : 'items'}
                                    </span>
                                  )}
                                </p>
                              )}
                              
                              {/* Items count */}
                              <p className="text-xs text-text-muted">
                                {totalItems} {totalItems === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="crypto-amount font-bold text-text-primary mb-1">
                                  €{(() => { 
                                    const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); 
                                    return typeof total === 'number' ? total.toFixed(2) : '0.00'; 
                                  })()}
                                </p>
                                <Badge
                                  variant={order.status === 'fulfilled' ? 'default' : 'secondary'}
                                  className={order.status === 'fulfilled'
                                    ? 'badge-success'
                                    : order.status === 'paid'
                                      ? 'badge-info'
                                      : order.status === 'failed'
                                        ? 'badge-error'
                                        : 'badge-warning'
                                  }
                                >
                                  <span className={`status-dot mr-1.5 ${
                                    order.status === 'fulfilled' ? 'status-dot-success' 
                                    : order.status === 'paid' ? 'status-dot-info'
                                    : order.status === 'failed' ? 'status-dot-error'
                                    : 'status-dot-warning'
                                  }`} />
                                  {order.status ?? 'pending'}
                                </Badge>
                              </div>
                              <ChevronRight className="h-5 w-5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* My Purchases Tab - Enhanced with Pagination & Filters */}
        <TabsContent value="purchases" className="space-y-6">
          <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-neon/10 border border-purple-neon/20">
                      <ShoppingBag className="h-5 w-5 text-purple-neon" />
                    </div>
                    <div>
                      <CardTitle className="text-text-primary">Purchase History</CardTitle>
                      <CardDescription className="text-text-secondary">
                        {purchasesStatusFilter === 'all' && purchasesSearchQuery === '' 
                          ? `${orderStats.totalOrders} orders total`
                          : `Showing ${filteredOrders.length} of ${orderStats.totalOrders} orders`}
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => void refetchOrders()}
                    disabled={isLoadingOrders}
                    className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {/* Filter Tabs - Dynamic based on existing order statuses */}
                <div className="flex flex-wrap gap-2">
                  {/* All button is always visible */}
                  <Button
                    variant={purchasesStatusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPurchasesStatusFilter('all')}
                    className={purchasesStatusFilter === 'all' ? 'bg-purple-neon text-black' : ''}
                  >
                    All ({orderStats.totalOrders})
                  </Button>
                  
                  {/* Dynamic filter buttons - only show categories with orders */}
                  {dynamicFilterCategories.map((category) => {
                    // Map icon string to component
                    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                      'Key': Key,
                      'RefreshCw': RefreshCw,
                      'Clock': Clock,
                      'AlertTriangle': AlertTriangle,
                      'RotateCcw': RotateCcw,
                      'XCircle': XCircle,
                    };
                    const IconComponent = iconMap[category.icon];
                    
                    return (
                      <Button
                        key={category.key}
                        variant={purchasesStatusFilter === category.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPurchasesStatusFilter(category.key)}
                        className={purchasesStatusFilter === category.key ? category.activeClass : ''}
                      >
                        {IconComponent !== undefined ? <IconComponent className="h-3 w-3 mr-1" /> : null}
                        {category.label} ({category.count})
                      </Button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    type="text"
                    placeholder="Search by Order ID..."
                    value={purchasesSearchQuery}
                    onChange={(e) => setPurchasesSearchQuery(e.target.value)}
                    className="pl-10 bg-bg-tertiary/50 border-border/50"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingOrders ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-neon" />
                  <p className="text-text-secondary">Loading your purchase history...</p>
                </div>
              ) : (allOrders === null || allOrders === undefined || allOrders.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="h-16 w-16 text-text-muted/30 mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No purchases yet</h3>
                  <p className="text-text-secondary mb-4">Start exploring our catalog to find amazing deals!</p>
                  <Link href="/">
                    <Button className="bg-purple-neon hover:bg-purple-neon/80">
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-16 w-16 text-text-muted/30 mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No matching orders</h3>
                  <p className="text-text-secondary mb-4">Try adjusting your filters or search query</p>
                  <Button 
                    variant="outline" 
                    onClick={() => { setPurchasesStatusFilter('all'); setPurchasesSearchQuery(''); }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedPurchases.map((order: OrderResponseDto, index) => {
                    const isExpanded = expandedOrders.has(order.id);
                    const isFulfilled = order.status === 'fulfilled';
                    const isPaid = order.status === 'paid';
                    const isExpired = order.status === 'expired';
                    const isFailed = order.status === 'failed' || order.status === 'underpaid' || isExpired;
                    const isPending = order.status === 'waiting' || order.status === 'pending' || order.status === 'confirming';
                    
                    // Map order items to KeyReveal format using real product titles
                    const keyRevealItems: OrderItem[] = order.items.map((item: OrderItemResponseDto) => ({
                      id: item.id,
                      productId: item.productId,
                      productTitle: item.productTitle,
                      quantity: 1,
                    }));

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`group rounded-xl border transition-all duration-300 ${
                          isFulfilled 
                            ? 'border-green-success/30 bg-green-success/5 hover:border-green-success/50' 
                            : isFailed
                            ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                            : isPaid
                            ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50'
                            : 'border-border/50 bg-bg-tertiary/30 hover:border-purple-neon/20 hover:bg-bg-tertiary/50'
                        }`}
                      >
                        {/* Order Header - Clickable to expand */}
                        <div 
                          className="p-5 cursor-pointer"
                          onClick={() => {
                            const newExpanded = new Set(expandedOrders);
                            if (isExpanded) {
                              newExpanded.delete(order.id);
                            } else {
                              newExpanded.add(order.id);
                            }
                            setExpandedOrders(newExpanded);
                          }}
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${
                                isFulfilled 
                                  ? 'bg-green-success/10 border-green-success/30' 
                                  : isFailed
                                  ? 'bg-red-500/10 border-red-500/30'
                                  : isPaid
                                  ? 'bg-blue-500/10 border-blue-500/30'
                                  : 'bg-purple-neon/10 border-purple-neon/20'
                              }`}>
                                {isFulfilled ? (
                                  <Key className="h-6 w-6 text-green-success" />
                                ) : isFailed ? (
                                  <AlertCircle className="h-6 w-6 text-red-500" />
                                ) : isPaid ? (
                                  <RefreshCw className="h-6 w-6 text-blue-400" />
                                ) : (
                                  <Package className="h-6 w-6 text-purple-neon" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-text-primary">
                                    #{order.id.slice(-8).toUpperCase()}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-text-secondary line-clamp-1">
                                  {order.items.length === 1 
                                    ? (order.items[0]?.productTitle ?? 'Unknown Product')
                                    : order.items.length > 1
                                    ? `${order.items[0]?.productTitle ?? 'Product'} + ${order.items.length - 1} more`
                                    : 'No items'}
                                </p>
                                <p className="text-xs text-text-tertiary mt-0.5">
                                  {order.createdAt != null
                                    ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : 'Date unknown'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge
                                className={
                                  isFulfilled
                                    ? 'bg-green-success/20 text-green-success border-green-success/30'
                                    : isFailed
                                    ? 'bg-red-500/20 text-red-500 border-red-500/30'
                                    : isPaid
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    : order.status === 'confirming'
                                    ? 'bg-orange-warning/20 text-orange-warning border-orange-warning/30'
                                    : 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30'
                                }
                              >
                                {isFulfilled && <Check className="h-3 w-3 mr-1" />}
                                {order.status ?? 'pending'}
                              </Badge>
                              <span className="font-bold text-lg text-text-primary">
                                €{(() => { const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); return typeof total === 'number' ? total.toFixed(2) : '0.00'; })()}
                              </span>
                              <div className="text-text-muted">
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick action buttons (always visible) */}
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
                            {isFulfilled && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  // Toggle expand/collapse
                                  const newExpanded = new Set(expandedOrders);
                                  if (isExpanded) {
                                    newExpanded.delete(order.id);
                                  } else {
                                    newExpanded.add(order.id);
                                  }
                                  setExpandedOrders(newExpanded);
                                }}
                                className="border-green-success/30 bg-green-success/10 text-green-success hover:bg-green-success/20"
                              >
                                <Key className="h-4 w-4 mr-1" />
                                {isExpanded ? 'Hide Keys' : 'View & Copy Keys'}
                              </Button>
                            )}
                            {isPaid && (
                              <div className="flex flex-wrap items-center gap-3">
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); void handleRecoverKeys(order.id); }}
                                  disabled={recoveringOrder === order.id}
                                  className="bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                  {recoveringOrder === order.id ? (
                                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Retrieving...</>
                                  ) : (
                                    <><Key className="h-4 w-4 mr-1" />Retrieve Keys</>
                                  )}
                                </Button>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                                  <span className="text-sm text-blue-400">Payment confirmed • Click to retrieve keys</span>
                                </div>
                              </div>
                            )}
                            {isPending && (
                              <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <Loader2 className="h-4 w-4 animate-spin text-orange-warning" />
                                <span>
                                  {order.status === 'confirming' ? 'Payment being confirmed...' : 
                                   order.status === 'waiting' ? 'Awaiting payment...' : 
                                   'Processing...'}
                                </span>
                              </div>
                            )}
                            {isExpired && (
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <Clock className="h-4 w-4" />
                                <span>Payment expired - Order cancelled</span>
                              </div>
                            )}
                            {isFailed && !isExpired && (
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <span>{order.status === 'underpaid' ? 'Insufficient payment received' : 'Payment failed'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Order Details with KeyReveal */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-border/30 px-5 pb-5"
                          >
                            <div className="pt-5 space-y-4">
                              {/* Order Details Summary */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-bg-primary/50 border border-border/30">
                                <div>
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Order Reference</p>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm text-text-primary">#{order.id.slice(-8).toUpperCase()}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-text-muted hover:text-cyan-glow"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void navigator.clipboard.writeText(order.id);
                                        toast.success('Full Order ID copied');
                                      }}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Items</p>
                                  <p className="font-semibold text-text-primary">{order.items.length}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Payment</p>
                                  <p className="font-semibold text-text-primary">€{(() => { const total = typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0); return typeof total === 'number' ? total.toFixed(2) : '0.00'; })()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-text-muted uppercase tracking-wider">Status</p>
                                  <p className={`font-semibold ${
                                    isFulfilled ? 'text-green-success' : 
                                    isFailed ? 'text-red-500' : 
                                    isPaid ? 'text-blue-400' : 
                                    'text-orange-warning'
                                  }`}>
                                    {(order.status ?? 'pending').charAt(0).toUpperCase() + (order.status ?? 'pending').slice(1)}
                                  </p>
                                </div>
                              </div>

                              {/* KeyReveal Component for Fulfilled Orders ONLY */}
                              {isFulfilled && order.items.length > 0 && (
                                <div className="mt-4">
                                  <KeyReveal
                                    orderId={order.id}
                                    items={keyRevealItems}
                                    isFulfilled={true}
                                    variant="default"
                                  />
                                </div>
                              )}
                              
                              {/* Paid but not fulfilled - Show retrieve keys prompt */}
                              {isPaid && !isFulfilled && order.items.length > 0 && (
                                <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                        <Key className="h-5 w-5 text-blue-400" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-text-primary">Keys Ready to Retrieve</p>
                                        <p className="text-sm text-blue-400">Your payment was confirmed. Click the button to fetch your keys.</p>
                                        <p className="text-xs text-text-muted mt-1">If retrieval fails, keys may still be processing or there may be a temporary issue.</p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={(e) => { e.stopPropagation(); void handleRecoverKeys(order.id); }}
                                      disabled={recoveringOrder === order.id}
                                      className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                                    >
                                      {recoveringOrder === order.id ? (
                                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Retrieving...</>
                                      ) : (
                                        <><Key className="h-4 w-4 mr-1" />Retrieve Keys Now</>
                                      )}
                                    </Button>
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-blue-500/20">
                                    <h4 className="text-sm font-medium text-text-secondary mb-2">Items in this order:</h4>
                                    <div className="space-y-2">
                                      {order.items.map((item: OrderItemResponseDto, idx) => (
                                        <div key={item.id} className="flex items-center gap-2 text-sm">
                                          <div className="h-6 w-6 rounded bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold">{idx + 1}</div>
                                          <span className="text-text-primary">{item.productTitle ?? 'Digital Product'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Items List for Non-Fulfilled Orders */}
                              {!isFulfilled && !isPaid && order.items.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-text-primary flex items-center gap-2">
                                    <Package className="h-4 w-4 text-purple-neon" />
                                    Order Items
                                  </h4>
                                  <div className="space-y-2">
                                    {order.items.map((item: OrderItemResponseDto, itemIndex) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-bg-primary/50 border border-border/30"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-neon/10 text-purple-neon text-sm font-bold">
                                            {itemIndex + 1}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-text-primary">
                                              {item.productTitle ?? 'Digital Product'}
                                            </p>
                                          </div>
                                        </div>
                                        <Badge variant="outline" className={`text-xs ${
                                          isExpired ? 'border-red-500/30 text-red-400' :
                                          isFailed ? 'border-red-500/30 text-red-400' :
                                          isPending ? 'border-orange-warning/30 text-orange-warning' :
                                          'border-border/50 text-text-muted'
                                        }`}>
                                          {isExpired ? 'Expired' : isPending ? 'Pending' : isFailed ? 'Failed' : 'Processing'}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Need Help Section */}
                              <div className="flex items-center justify-between pt-2 border-t border-border/20">
                                <p className="text-xs text-text-muted">
                                  Need help? Contact support with reference #{order.id.slice(-8).toUpperCase()}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-text-muted hover:text-cyan-glow"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void navigator.clipboard.writeText(order.id);
                                    toast.success('Full Order ID copied');
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy Full ID
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                  </div>

                  {/* Pagination Controls */}
                  {purchasesTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <div className="text-sm text-text-muted">
                        Page {purchasesPage} of {purchasesTotalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPurchasesPage(Math.max(1, purchasesPage - 1))}
                          disabled={purchasesPage === 1}
                          className="border-purple-neon/30 text-purple-neon hover:bg-purple-neon/10"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, purchasesTotalPages) }, (_, i) => {
                            const totalPages = purchasesTotalPages;
                            let pageNumber: number;
                            
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (purchasesPage <= 3) {
                              pageNumber = i + 1;
                            } else if (purchasesPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = purchasesPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNumber}
                                variant={purchasesPage === pageNumber ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPurchasesPage(pageNumber)}
                                className={purchasesPage === pageNumber ? 'bg-purple-neon text-black' : 'border-border/30'}
                              >
                                {pageNumber}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPurchasesPage(Math.min(purchasesTotalPages, purchasesPage + 1))}
                          disabled={purchasesPage >= purchasesTotalPages}
                          className="border-purple-neon/30 text-purple-neon hover:bg-purple-neon/10"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab - OTP-Based Authentication */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Security Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-1"
            >
              <Card className="glass h-full border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-green-success/30 hover:shadow-[0_0_20px_rgba(57,255,20,0.1)]">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="relative mb-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-success/10 border-2 border-green-success/30">
                      <Fingerprint className="h-12 w-12 text-green-success" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-success text-bg-primary">
                      <Check className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">Passwordless Auth</h3>
                  <p className="text-sm text-text-secondary mb-4">Your account uses secure OTP verification</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className="badge-success">
                      <span className="status-dot status-dot-success mr-1" />
                      <Shield className="h-3 w-3 mr-1" /> OTP Protected
                    </Badge>
                    {user.emailConfirmed && (
                      <Badge className="badge-info">
                        <span className="status-dot status-dot-info mr-1" />
                        <Mail className="h-3 w-3 mr-1" /> Email Verified
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Email Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                      <Mail className="h-5 w-5 text-cyan-glow" />
                    </div>
                    <div>
                      <CardTitle className="text-text-primary">Email Address</CardTitle>
                      <CardDescription className="text-text-secondary">Manage your account email</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Email Display */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-bg-tertiary/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-text-muted" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{user?.email}</p>
                        <p className="text-xs text-text-secondary">Primary email address</p>
                      </div>
                    </div>
                    {user.emailConfirmed && (
                      <Badge className="badge-success text-xs">
                        <Check className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>

                  {/* Email Change Form */}
                  <AnimatePresence mode="wait">
                    {isEmailChangeStep === 'idle' && (
                      <motion.div
                        key="email-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="Enter new email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="flex-1 bg-bg-tertiary/50 border-border/50"
                          />
                          <Button
                            onClick={() => void requestEmailChangeMutation.mutateAsync(newEmail)}
                            disabled={newEmail === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) || requestEmailChangeMutation.isPending}
                            className="bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20 border border-cyan-glow/30"
                          >
                            {requestEmailChangeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Change Email'
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {isEmailChangeStep === 'otp' && (
                      <motion.div
                        key="otp-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-lg bg-cyan-glow/5 border border-cyan-glow/20 space-y-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-text-secondary">
                              <p className="font-medium text-text-primary mb-1">Dual verification required</p>
                              <p>For your security, we&apos;ve sent verification codes to both your current email (<span className="font-medium text-cyan-glow">{user?.email}</span>) and new email (<span className="font-medium text-cyan-glow">{newEmail}</span>).</p>
                            </div>
                          </div>

                          {/* Current Email OTP */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">
                              Code from current email ({user?.email})
                            </label>
                            <Input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={oldEmailOtp}
                              onChange={(e) => setOldEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="bg-bg-tertiary/50 border-border/50 font-mono tracking-widest text-center"
                            />
                          </div>

                          {/* New Email OTP */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">
                              Code from new email ({newEmail})
                            </label>
                            <Input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={newEmailOtp}
                              onChange={(e) => setNewEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="bg-bg-tertiary/50 border-border/50 font-mono tracking-widest text-center"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => void verifyEmailChangeMutation.mutateAsync({ oldCode: oldEmailOtp, newCode: newEmailOtp })}
                              disabled={oldEmailOtp.length !== 6 || newEmailOtp.length !== 6 || verifyEmailChangeMutation.isPending}
                              className="flex-1 bg-green-success/10 text-green-success hover:bg-green-success/20 border border-green-success/30"
                            >
                              {verifyEmailChangeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Verify Both Codes
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setIsEmailChangeStep('idle');
                                setOldEmailOtp('');
                                setNewEmailOtp('');
                              }}
                              className="text-text-muted hover:text-text-primary"
                            >
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Active Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-success/10 border border-green-success/20">
                      <Key className="h-5 w-5 text-green-success" />
                    </div>
                    <div>
                      <CardTitle className="text-text-primary">Active Sessions</CardTitle>
                      <CardDescription className="text-text-secondary">Devices where you&apos;re signed in</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleRefreshSessions()}
                      disabled={sessionsLoading}
                      className="text-text-muted hover:text-text-primary"
                      aria-label="Refresh sessions list"
                    >
                      <RefreshCw className={`h-4 w-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    {sessionsTotal > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void revokeAllSessionsMutation.mutateAsync()}
                        disabled={revokeAllSessionsMutation.isPending}
                        className="text-orange-warning border-orange-warning/30 hover:bg-orange-warning/10"
                      >
                        {revokeAllSessionsMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <LogOut className="h-4 w-4 mr-1" />
                        )}
                        Revoke All Others
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-6 rounded-lg bg-bg-tertiary/20 border border-border/30 text-center">
                    <p className="text-sm text-text-secondary">No active sessions found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          session.isCurrent === true
                            ? 'bg-green-success/5 border-green-success/30'
                            : 'bg-bg-tertiary/30 border-border/30 hover:border-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            session.isCurrent === true ? 'bg-green-success/10' : 'bg-bg-tertiary/50'
                          }`}>
                            {session.deviceInfo?.toLowerCase().includes('mobile') ? (
                              <Smartphone className={`h-5 w-5 ${session.isCurrent === true ? 'text-green-success' : 'text-text-muted'}`} />
                            ) : (
                              <Monitor className={`h-5 w-5 ${session.isCurrent === true ? 'text-green-success' : 'text-text-muted'}`} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-text-primary">
                                {session.deviceInfo ?? 'Unknown Device'}
                              </p>
                              {session.isCurrent === true && (
                                <Badge className="badge-success text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                              <span>{session.ipAddress ?? 'Unknown'}</span>
                              <span>•</span>
                              <span>Last active: {session.lastActiveAt != null ? new Date(session.lastActiveAt).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        {session.isCurrent !== true && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void revokeSessionMutation.mutateAsync(session.id)}
                            disabled={revokeSessionMutation.isPending}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            {revokeSessionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Sessions Pagination */}
                {sessionsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-4">
                    <p className="text-sm text-text-muted">
                      Showing {sessions.length} of {sessionsTotal} sessions
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSessionsPage(p => Math.max(1, p - 1))}
                        disabled={sessionsPage === 1 || sessionsLoading}
                        className="border-border/50 text-text-secondary hover:text-text-primary"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-text-secondary px-2">
                        Page {sessionsPage} of {sessionsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSessionsPage(p => Math.min(sessionsTotalPages, p + 1))}
                        disabled={sessionsPage === sessionsTotalPages || sessionsLoading}
                        className="border-border/50 text-text-secondary hover:text-text-primary"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Deletion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass border-red-500/20 bg-red-500/5 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-text-primary">Delete Account</CardTitle>
                    <CardDescription className="text-text-secondary">Permanently delete your account and data</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {deletionStatus?.deletionRequested === true ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-orange-warning/10 border border-orange-warning/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-warning shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-warning mb-1">
                            Account Deletion Scheduled
                          </p>
                          <p className="text-sm text-text-secondary">
                            Your account will be permanently deleted in <span className="font-bold text-orange-warning">{deletionStatus.daysRemaining} days</span>.
                            All your data, orders, and keys will be removed.
                          </p>
                          {(deletionStatus.deletionScheduledAt !== null && deletionStatus.deletionScheduledAt !== undefined && deletionStatus.deletionScheduledAt !== '') && (
                            <p className="text-xs text-text-muted mt-2">
                              Scheduled for: {new Date(deletionStatus.deletionScheduledAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => void cancelDeletionMutation.mutateAsync()}
                      disabled={cancelDeletionMutation.isPending}
                      className="w-full bg-green-success/10 text-green-success hover:bg-green-success/20 border border-green-success/30"
                    >
                      {cancelDeletionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Cancel Account Deletion
                    </Button>
                  </div>
                ) : showDeleteConfirm ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-text-secondary mb-3">
                        This action is <span className="font-bold text-red-500">irreversible</span>. After 30 days, all your data will be permanently deleted including:
                      </p>
                      <ul className="text-sm text-text-muted space-y-1 ml-4">
                        <li>• Your account and profile</li>
                        <li>• All purchase history</li>
                        <li>• Downloaded product keys</li>
                        <li>• Watchlist and preferences</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-text-secondary">
                        Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm:
                      </p>
                      <Input
                        type="text"
                        placeholder="Type DELETE"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="bg-bg-tertiary/50 border-red-500/30 focus:border-red-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void requestDeletionMutation.mutateAsync()}
                        disabled={deleteConfirmText !== 'DELETE' || requestDeletionMutation.isPending}
                        className="flex-1 bg-red-500 text-white hover:bg-red-600"
                      >
                        {requestDeletionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">
                      Once deleted, your account cannot be recovered. You have 30 days to cancel.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass border-purple-neon/20 bg-purple-neon/5 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-neon/10 border border-purple-neon/20">
                    <Info className="h-5 w-5 text-purple-neon" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Security Tips</h4>
                    <ul className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        Keep your email account secure
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        Never share OTP codes with anyone
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        Check for secure connection (HTTPS)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-neon shrink-0" />
                        OTP codes expire in 5 minutes
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-1"
            >
              <Card className="glass h-full border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/30 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  {/* Avatar with initials */}
                  <div className="relative mb-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border-2 border-cyan-glow/30 shadow-[0_0_30px_rgba(0,217,255,0.2)]">
                      <span className="text-3xl font-bold text-cyan-glow">
                        {user.email.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    {user.role === 'admin' && (
                      <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple-neon text-white shadow-[0_0_15px_rgba(157,78,221,0.5)]">
                        <Crown className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">
                    {user.email.split('@')[0]}
                  </h3>
                  <p className="text-sm text-text-secondary mb-4 font-mono">{user.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className={user.role === 'admin' 
                      ? 'badge-featured' 
                      : 'badge-info'
                    }>
                      {user.role === 'admin' ? (
                        <><span className="status-dot mr-1" style={{ background: 'var(--pink-featured)' }} /><Crown className="h-3 w-3 mr-1" /> Admin</>
                      ) : (
                        <><span className="status-dot status-dot-info mr-1" /><User className="h-3 w-3 mr-1" /> Member</>
                      )}
                    </Badge>
                    <Badge className={user.emailConfirmed 
                      ? 'badge-success' 
                      : 'badge-warning'
                    }>
                      {user.emailConfirmed ? (
                        <><span className="status-dot status-dot-success mr-1" /><Check className="h-3 w-3 mr-1" /> Verified</>
                      ) : (
                        <><span className="status-dot status-dot-warning mr-1" /><AlertCircle className="h-3 w-3 mr-1" /> Unverified</>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                      <Fingerprint className="h-5 w-5 text-cyan-glow" />
                    </div>
                    <div>
                      <CardTitle className="text-text-primary">Account Details</CardTitle>
                      <CardDescription className="text-text-secondary">Your profile information and settings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email Field */}
                  <div className="group rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 transition-all hover:border-cyan-glow/20 hover:bg-bg-tertiary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-glow/10">
                          <Mail className="h-4 w-4 text-cyan-glow" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wide">Email Address</p>
                          <p className="font-medium text-text-primary">{user.email}</p>
                        </div>
                      </div>
                      {user.emailConfirmed && (
                        <Badge className="badge-success">
                          <span className="status-dot status-dot-success mr-1" /><Check className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* User ID Field */}
                  <div className="group rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 transition-all hover:border-cyan-glow/20 hover:bg-bg-tertiary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-neon/10">
                          <Hash className="h-4 w-4 text-purple-neon" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wide">User ID</p>
                          <p className="font-mono text-sm text-text-primary">{user.id}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-text-muted hover:text-cyan-glow"
                        onClick={() => {
                          void navigator.clipboard.writeText(user.id);
                          toast.success('User ID copied to clipboard');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Account Role Field */}
                  <div className="group rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 transition-all hover:border-cyan-glow/20 hover:bg-bg-tertiary/50">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        user.role === 'admin' ? 'bg-purple-neon/10' : 'bg-cyan-glow/10'
                      }`}>
                        {user.role === 'admin' ? (
                          <Crown className="h-4 w-4 text-purple-neon" />
                        ) : (
                          <User className="h-4 w-4 text-cyan-glow" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wide">Account Type</p>
                        <p className="font-medium text-text-primary capitalize">{user.role ?? 'Member'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 text-center group hover:border-cyan-glow/30 transition-colors">
                      <p className="crypto-amount text-2xl font-bold text-cyan-glow">{orderStats.totalOrders}</p>
                      <p className="text-xs text-text-muted">Total Orders</p>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-bg-tertiary/30 p-4 text-center group hover:border-green-success/30 transition-colors">
                      <p className="crypto-amount text-2xl font-bold text-green-success">€{orderStats.totalSpent.toFixed(2)}</p>
                      <p className="text-xs text-text-muted">Total Spent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
              <CardContent className="p-5">
                <h4 className="font-semibold text-text-primary mb-4">Quick Actions</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4 border-border/50 hover:border-cyan-glow/30 hover:bg-cyan-glow/5"
                    onClick={() => setActiveTab('security')}
                  >
                    <Shield className="h-5 w-5 text-cyan-glow" />
                    <span className="text-sm">Change Password</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4 border-border/50 hover:border-purple-neon/30 hover:bg-purple-neon/5"
                    onClick={() => setActiveTab('purchases')}
                  >
                    <ShoppingBag className="h-5 w-5 text-purple-neon" />
                    <span className="text-sm">View Purchases</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4 border-border/50 hover:border-green-success/30 hover:bg-green-success/5"
                    onClick={() => setActiveTab('help')}
                  >
                    <HelpCircle className="h-5 w-5 text-green-success" />
                    <span className="text-sm">Get Help</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Watchlist Tab */}
        <TabsContent value="watchlist" className="space-y-6">
          <WatchlistTabContent />
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-6">
          {/* Quick Support Links */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass border-border/50 bg-gradient-to-br from-cyan-glow/5 to-transparent hover:border-cyan-glow/30 transition-all duration-300 cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-3 rounded-full bg-cyan-glow/10 group-hover:bg-cyan-glow/20 transition-colors">
                  <MessageSquare className="h-6 w-6 text-cyan-glow" />
                </div>
                <h3 className="font-semibold text-text-primary">Live Chat</h3>
                <p className="text-xs text-text-secondary">Get instant help from our support team</p>
                <Button variant="outline" size="sm" className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
            
            <Card className="glass border-border/50 bg-gradient-to-br from-purple-neon/5 to-transparent hover:border-purple-neon/30 transition-all duration-300 cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-3 rounded-full bg-purple-neon/10 group-hover:bg-purple-neon/20 transition-colors">
                  <Mail className="h-6 w-6 text-purple-neon" />
                </div>
                <h3 className="font-semibold text-text-primary">Email Support</h3>
                <p className="text-xs text-text-secondary">Response within 24 hours</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-neon/30 text-purple-neon hover:bg-purple-neon/10"
                  onClick={() => window.location.href = 'mailto:support@bitloot.com'}
                >
                  Send Email
                </Button>
              </CardContent>
            </Card>
            
            <Card className="glass border-border/50 bg-gradient-to-br from-orange-warning/5 to-transparent hover:border-orange-warning/30 transition-all duration-300 cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-3 rounded-full bg-orange-warning/10 group-hover:bg-orange-warning/20 transition-colors">
                  <Book className="h-6 w-6 text-orange-warning" />
                </div>
                <h3 className="font-semibold text-text-primary">Help Center</h3>
                <p className="text-xs text-text-secondary">Browse guides and tutorials</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-orange-warning/30 text-orange-warning hover:bg-orange-warning/10"
                  onClick={() => window.open('/help', '_blank')}
                >
                  Visit Center
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQs Section - Simplified, links to Help Center */}
          <Card className="glass border-border/50 bg-bg-secondary/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-cyan-glow" />
                  <CardTitle className="text-text-primary">Quick Answers</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-cyan-glow hover:bg-cyan-glow/10" asChild>
                  <Link href="/help">
                    View All
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
              <CardDescription className="text-text-secondary">Common account questions — visit our Help Center for more</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Most Essential FAQs Only */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-bg-secondary/30 border border-border/30">
                  <h4 className="font-medium mb-1 text-text-primary flex items-center gap-2">
                    <Package className="h-4 w-4 text-cyan-glow" />
                    How do I access my purchased keys?
                  </h4>
                  <p className="text-sm text-text-secondary pl-6">
                    Your keys are in the <span className="text-cyan-glow font-medium">Purchases</span> tab. Click any order to reveal keys.
                    Use <span className="text-orange-warning font-medium">Recover Keys</span> if they&apos;re not visible after payment.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-bg-secondary/30 border border-border/30">
                  <h4 className="font-medium mb-1 text-text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-purple-neon" />
                    How do I change my email or manage security?
                  </h4>
                  <p className="text-sm text-text-secondary pl-6">
                    Go to the <span className="text-purple-neon font-medium">Security</span> tab to change your email (requires dual-OTP verification),
                    manage active sessions, or request account deletion.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-bg-secondary/30 border border-border/30">
                  <h4 className="font-medium mb-1 text-text-primary flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-orange-warning" />
                    What if I underpay or overpay?
                  </h4>
                  <p className="text-sm text-text-secondary pl-6">
                    Underpayments are <span className="text-orange-warning font-medium">non-refundable</span> and will not fulfill the order.
                    Overpayments cannot be refunded. Always verify the exact amount before sending.
                  </p>
                </div>
              </div>
              
              {/* Link to Help Center */}
              <div className="flex items-center justify-center pt-2">
                <Button variant="outline" className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10" asChild>
                  <Link href="/help">
                    <Book className="h-4 w-4 mr-2" />
                    Visit Help Center for All FAQs
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="glass border-border/50 bg-gradient-to-r from-cyan-glow/5 via-purple-neon/5 to-orange-warning/5">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-cyan-glow" />
                Still Need Help?
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Our support team is available 24/7 to assist you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-bg-secondary/30 border border-border/30">
                  <Clock className="h-5 w-5 text-cyan-glow mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-text-primary">Response Time</h4>
                    <p className="text-xs text-text-secondary mt-1">
                      Live chat: Instant<br />
                      Email: Within 24 hours
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-bg-secondary/30 border border-border/30">
                  <Globe className="h-5 w-5 text-purple-neon mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-text-primary">Availability</h4>
                    <p className="text-xs text-text-secondary mt-1">
                      24/7 Support<br />
                      Multiple languages
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-gradient-to-r from-cyan-glow to-purple-neon hover:opacity-90"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Support Ticket
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-border/50 text-text-secondary hover:text-text-primary"
                  asChild
                >
                  <Link href="/help">
                    <Book className="h-4 w-4 mr-2" />
                    Help Center
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-border/50 text-text-secondary hover:text-text-primary"
                  asChild
                >
                  <Link href="/refund">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refund Policy
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
