'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { catalogClient } from '@bitloot/sdk';
import type { ProductListResponseDto } from '@bitloot/sdk';
import { CatalogFilters } from '@/features/catalog/components/CatalogFilters';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
import { Sheet, SheetContent, SheetTrigger } from '@/design-system/primitives/sheet';
import {
  Filter,
  Loader2,
  Search,
  TrendingUp,
  Award,
  Sparkles,
  Crown,
  Gamepad2,
  MonitorPlay,
  Gift,
  UserCircle,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Package,
  Zap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { Product } from '@/features/catalog/components/ProductCard';
import { cn } from '@/design-system/utils/utils';
import { FloatingParticles, AnimatedGridPattern } from '@/components/animations/FloatingParticles';

// Category tabs configuration - matching home page
const CATEGORY_TABS = [
  { id: 'all', label: 'All Products', icon: LayoutGrid },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'best-sellers', label: 'Best Sellers', icon: Award },
  { id: 'new', label: 'New', icon: Sparkles },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'software', label: 'Software', icon: MonitorPlay },
  { id: 'gift-cards', label: 'Gift Cards', icon: Gift },
  { id: 'social', label: 'Social Media', icon: UserCircle },
  { id: 'premium', label: 'Premium', icon: Crown },
] as const;

type CategoryId = (typeof CATEGORY_TABS)[number]['id'];

// Sort options
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest Discount' },
] as const;

function CatalogContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Extract query params
  const pageParam = searchParams.get('page');
  const page = pageParam !== null && pageParam !== undefined ? Number(pageParam) : 1;
  const category = searchParams.get('category') ?? undefined;
  const platform = searchParams.get('platform') ?? undefined;
  const minPriceParam = searchParams.get('minPrice');
  const minPrice =
    minPriceParam !== null && minPriceParam !== undefined ? Number(minPriceParam) : undefined;
  const maxPriceParam = searchParams.get('maxPrice');
  const maxPrice =
    maxPriceParam !== null && maxPriceParam !== undefined ? Number(maxPriceParam) : undefined;
  const search = searchParams.get('search') ?? undefined;

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<ProductListResponseDto>({
    queryKey: ['products', { page, category, platform, minPrice, maxPrice, search, activeCategory }],
    queryFn: async () => {
      try {
        const result = await catalogClient.findAll({
          page,
          limit: 12,
          category: activeCategory !== 'all' ? activeCategory : category,
          platform,
          minPrice,
          maxPrice,
          search,
        });
        return result;
      } catch (error) {
        console.error('Failed to fetch products:', error);
        throw error;
      }
    },
  });

  // Map ProductResponseDto to Product interface expected by ProductCard
  const products: Product[] = (data?.data ?? []).map((dto) => ({
    id: dto.id,
    name: dto.title,
    description: dto.description ?? '',
    price: dto.price,
    currency: dto.currency,
    image: dto.imageUrl,
    platform: dto.platform,
    discount: 0,
  }));
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);

  // Handle search
  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery !== '') {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`/catalog?${params.toString()}`);
  };

  // Handle category change
  const handleCategoryChange = (categoryId: CategoryId): void => {
    setActiveCategory(categoryId);
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId !== 'all') {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    params.set('page', '1');
    router.push(`/catalog?${params.toString()}`);
  };

  // Handle pagination
  const goToPage = (newPage: number): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-gradient-dark">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[400px] w-[600px] bg-radial-cyan opacity-30 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[400px] bg-radial-purple opacity-20 blur-3xl pointer-events-none" />
          <AnimatedGridPattern />
          <FloatingParticles count={20} />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-12 md:py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-4 py-1.5">
              <Package className="h-4 w-4 text-cyan-glow" />
              <span className="text-sm font-medium text-cyan-glow">
                {total.toLocaleString()}+ Products Available
              </span>
            </div>
            <h1 className="mb-4 text-4xl font-display font-bold text-white md:text-5xl">
              Browse Our{' '}
              <span className="text-gradient-primary animate-glow-pulse">Catalog</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-text-secondary">
              Discover thousands of digital products with instant delivery and secure crypto
              payments
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mb-8 max-w-2xl"
          >
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 rounded-xl bg-radial-cyan opacity-0 blur-xl transition-opacity duration-300 group-focus-within:opacity-20 pointer-events-none" />
              <Search
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-cyan-glow"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search for games, software, gift cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
                className="glass w-full rounded-xl border-border-accent py-6 pl-12 pr-4 text-base text-white placeholder:text-text-muted transition-all duration-300 hover:border-cyan-glow/50 focus:border-cyan-glow focus:shadow-glow-cyan"
              />
              <GlowButton
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                Search
              </GlowButton>
            </form>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <nav
              className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent"
              role="tablist"
              aria-label="Product categories"
            >
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;

                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tab.id}`}
                    onClick={() => handleCategoryChange(tab.id)}
                    className={cn(
                      'flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                      isActive
                        ? 'border border-cyan-glow/30 bg-cyan-glow/15 text-cyan-glow shadow-[0_0_20px_rgba(0,217,255,0.2)]'
                        : 'glass border border-border-subtle text-text-muted hover:border-cyan-glow/30 hover:bg-bg-tertiary/50 hover:text-text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24"
            >
              <div className="glass rounded-2xl border border-border-subtle p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-cyan-glow" />
                    <h3 className="text-lg font-semibold text-white">Filters</h3>
                  </div>
                  <button
                    onClick={() => router.push('/catalog')}
                    className="text-sm text-text-muted transition-colors hover:text-cyan-glow"
                  >
                    Reset
                  </button>
                </div>
                <CatalogFilters />
              </div>
            </motion.div>
          </aside>

          {/* Products Area */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex flex-wrap items-center justify-between gap-4"
            >
              {/* Results Count */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-glow" />
                      Loading...
                    </span>
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-medium text-white">{products.length}</span> of{' '}
                      <span className="font-medium text-white">{total.toLocaleString()}</span>{' '}
                      products
                    </>
                  )}
                </span>
                {isFetching && !isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-glow" />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <GlowButton variant="outline" size="sm" className="lg:hidden">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </GlowButton>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 bg-bg-secondary p-6">
                    <div className="mb-6 flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-cyan-glow" />
                      <h3 className="text-lg font-semibold text-white">Filters</h3>
                    </div>
                    <CatalogFilters />
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort products"
                  className="glass cursor-pointer rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2 text-sm text-white transition-colors hover:border-cyan-glow/30 focus:border-cyan-glow focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-bg-secondary">
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* View Toggle */}
                <div className="hidden items-center gap-1 rounded-lg border border-border-subtle p-1 sm:flex">
                  <button
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    aria-pressed={viewMode === 'grid'}
                    className={cn(
                      'rounded-md p-2 transition-colors',
                      viewMode === 'grid'
                        ? 'bg-cyan-glow/15 text-cyan-glow'
                        : 'text-text-muted hover:text-white'
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    aria-pressed={viewMode === 'list'}
                    className={cn(
                      'rounded-md p-2 transition-colors',
                      viewMode === 'list'
                        ? 'bg-cyan-glow/15 text-cyan-glow'
                        : 'text-text-muted hover:text-white'
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  aria-label="Refresh products"
                  className={cn(
                    'rounded-lg border border-border-subtle p-2 text-text-muted transition-colors hover:border-cyan-glow/30 hover:text-cyan-glow',
                    isFetching && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                </button>
              </div>
            </motion.div>

            {/* Products Grid */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-96 flex-col items-center justify-center gap-4"
                >
                  <div className="relative">
                    <div className="absolute -inset-4 animate-ping rounded-full bg-cyan-glow/20" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-glow/30 bg-bg-secondary">
                      <Zap className="h-8 w-8 animate-pulse text-cyan-glow" fill="currentColor" />
                    </div>
                  </div>
                  <p className="text-text-secondary">Loading products...</p>
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
                </motion.div>
              ) : isError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex h-96 flex-col items-center justify-center gap-6"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-accent-error/30 bg-accent-error/10">
                    <AlertCircle className="h-10 w-10 text-accent-error" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-2 text-xl font-semibold text-white">Failed to Load Products</h3>
                    <p className="mb-4 text-text-secondary">
                      Something went wrong. Please try again.
                    </p>
                    <GlowButton onClick={() => refetch()} variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </GlowButton>
                  </div>
                </motion.div>
              ) : products.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex h-96 flex-col items-center justify-center gap-6"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border-subtle bg-bg-secondary">
                    <Search className="h-10 w-10 text-text-muted" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-2 text-xl font-semibold text-white">No Products Found</h3>
                    <p className="mb-4 max-w-md text-text-secondary">
                      We couldn&apos;t find any products matching your criteria. Try adjusting your
                      filters or search terms.
                    </p>
                    <GlowButton onClick={() => router.push('/catalog')} variant="outline">
                      Clear All Filters
                    </GlowButton>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="products"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  role="tabpanel"
                  id={`tabpanel-${activeCategory}`}
                >
                  <ProductGrid products={products} />

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-12 flex items-center justify-center gap-2"
                    >
                      <GlowButton
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => goToPage(page - 1)}
                        className="px-4"
                      >
                        Previous
                      </GlowButton>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              aria-label={`Go to page ${pageNum}`}
                              aria-current={page === pageNum ? 'page' : undefined}
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all',
                                page === pageNum
                                  ? 'border border-cyan-glow/30 bg-cyan-glow/15 text-cyan-glow shadow-[0_0_12px_rgba(0,217,255,0.2)]'
                                  : 'text-text-muted hover:bg-bg-tertiary hover:text-white'
                              )}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <GlowButton
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => goToPage(page + 1)}
                        className="px-4"
                      >
                        Next
                      </GlowButton>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CatalogPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-bg-primary">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-4 animate-ping rounded-full bg-cyan-glow/20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-glow/30 bg-bg-secondary">
                <Zap className="h-8 w-8 animate-pulse text-cyan-glow" fill="currentColor" />
              </div>
            </div>
            <p className="text-sm text-text-muted">Loading catalog...</p>
            <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
