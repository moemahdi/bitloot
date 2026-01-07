'use client';

import { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Search,
    Filter,
    X,
    Loader2,
    Grid3X3,
    LayoutList,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    Sparkles,
    Zap,
    RefreshCw,
    Package,
    AlertCircle,
    TrendingUp,
    Star,
    Gift,
    Gamepad2,
    Monitor,
    Smartphone,
    Crown,
    Flame,
    Clock,
    ArrowUpDown,
    Home,
    Layers,
} from 'lucide-react';

import { catalogClient, CatalogGroupsApi, Configuration } from '@bitloot/sdk';
import type { CategoriesResponseDto, FiltersResponseDto, ProductGroupResponseDto } from '@bitloot/sdk';

import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/design-system/primitives/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from '@/design-system/primitives/sheet';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { Slider } from '@/design-system/primitives/slider';
import { Checkbox } from '@/design-system/primitives/checkbox';
import { Separator } from '@/design-system/primitives/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/design-system/primitives/accordion';
import { ScrollArea } from '@/design-system/primitives/scroll-area';

import { ProductCard } from '@/features/catalog/components/ProductCard';
import type { Product } from '@/features/catalog/components/ProductCard';
import { ProductGroupCard } from '@/features/catalog/components/ProductGroupCard';
import { GroupVariantsModal } from '@/features/catalog/components/GroupVariantsModal';

// Initialize catalog groups API client
const catalogGroupsApi = new CatalogGroupsApi(
    new Configuration({
        basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    })
);

// ============================================================================
// Types & Constants
// ============================================================================

interface FilterState {
    search: string;
    category: string;
    platform: string[];
    region: string;
    minPrice: number;
    maxPrice: number;
    sort: 'newest' | 'price_asc' | 'price_desc' | 'rating';
}

const DEFAULT_FILTERS: FilterState = {
    search: '',
    category: 'all',
    platform: [],
    region: 'all',
    minPrice: 0,
    maxPrice: 500,
    sort: 'newest',
};

const PRODUCTS_PER_PAGE = 24;

const GAMING_EASING = [0.25, 0.46, 0.45, 0.94];

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    all: Sparkles,
    trending: TrendingUp,
    games: Gamepad2,
    software: Monitor,
    'gift-cards': Gift,
    subscriptions: Clock,
    mobile: Smartphone,
    featured: Crown,
    deals: Flame,
};

// Sort options
const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First', icon: Clock },
    { value: 'price_asc', label: 'Price: Low to High', icon: ArrowUpDown },
    { value: 'price_desc', label: 'Price: High to Low', icon: ArrowUpDown },
    { value: 'rating', label: 'Top Rated', icon: Star },
] as const;

// ============================================================================
// Skeleton Components
// ============================================================================

function ProductGridSkeleton({ count = 12 }: { count?: number }): React.ReactElement {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, ease: GAMING_EASING }}
                >
                    <Card className="h-full overflow-hidden bg-bg-secondary border border-border-subtle">
                        <div className="relative aspect-4/3 overflow-hidden">
                            <Skeleton className="absolute inset-0" />
                        </div>
                        <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <div className="flex items-center justify-between pt-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

function FilterSidebarSkeleton(): React.ReactElement {
    return (
        <div className="space-y-6 p-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
            <div className="space-y-3">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}

// ============================================================================
// Filter Sidebar Component
// ============================================================================

interface FilterSidebarProps {
    filters: FilterState;
    onFilterChange: (updates: Partial<FilterState>) => void;
    onClearFilters: () => void;
    filtersData?: FiltersResponseDto;
    categoriesData?: CategoriesResponseDto;
    isLoading: boolean;
    activeFilterCount: number;
}

function FilterSidebar({
    filters,
    onFilterChange,
    onClearFilters,
    filtersData,
    categoriesData,
    isLoading,
    activeFilterCount,
}: FilterSidebarProps): React.ReactElement {
    if (isLoading) {
        return <FilterSidebarSkeleton />;
    }

    const priceRange = filtersData?.priceRange ?? { min: 0, max: 500 };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                        <SlidersHorizontal className="w-4 h-4 text-cyan-glow" />
                    </div>
                    <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30">
                            {activeFilterCount}
                        </Badge>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="text-text-secondary hover:text-cyan-glow transition-colors"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            <Separator className="bg-border-subtle" />

            <Accordion type="multiple" defaultValue={['category', 'platform', 'price']} className="space-y-2">
                {/* Category Filter */}
                <AccordionItem value="category" className="border-border-subtle">
                    <AccordionTrigger className="text-text-primary hover:text-cyan-glow transition-colors py-3">
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Category
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-2">
                            <button
                                onClick={() => onFilterChange({ category: 'all' })}
                                className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                                    filters.category === 'all'
                                        ? 'bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow'
                                        : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    All Categories
                                </span>
                                {categoriesData !== null && categoriesData !== undefined && (
                                    <Badge variant="outline" className="text-xs">
                                        {categoriesData.totalProducts}
                                    </Badge>
                                )}
                            </button>
                            {categoriesData?.categories.map((cat) => {
                                const IconComponent = CATEGORY_ICONS[cat.id] ?? Package;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => onFilterChange({ category: cat.id })}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                                            filters.category === cat.id
                                                ? 'bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow'
                                                : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <IconComponent className="w-4 h-4" />
                                            {cat.label}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                            {cat.count}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Platform Filter */}
                <AccordionItem value="platform" className="border-border-subtle">
                    <AccordionTrigger className="text-text-primary hover:text-cyan-glow transition-colors py-3">
                        <span className="flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4" />
                            Platform
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-2">
                            {filtersData?.platforms.map((platform) => (
                                <label
                                    key={platform.id}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-tertiary cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={filters.platform.includes(platform.id)}
                                            onCheckedChange={(checked) => {
                                                const newPlatforms = checked === true
                                                    ? [...filters.platform, platform.id]
                                                    : filters.platform.filter((p) => p !== platform.id);
                                                onFilterChange({ platform: newPlatforms });
                                            }}
                                            className="border-border-accent data-[state=checked]:bg-cyan-glow data-[state=checked]:border-cyan-glow"
                                        />
                                        <span className="text-text-secondary">{platform.label}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {platform.count}
                                    </Badge>
                                </label>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Price Range Filter */}
                <AccordionItem value="price" className="border-border-subtle">
                    <AccordionTrigger className="text-text-primary hover:text-cyan-glow transition-colors py-3">
                        <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Price Range
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-text-secondary">
                                    €{filters.minPrice}
                                </span>
                                <span className="text-text-secondary">
                                    €{filters.maxPrice}
                                </span>
                            </div>
                            <Slider
                                value={[filters.minPrice, filters.maxPrice]}
                                min={priceRange.min}
                                max={priceRange.max}
                                step={5}
                                onValueChange={([min, max]) => {
                                    onFilterChange({ minPrice: min, maxPrice: max });
                                }}
                                className="**:[[role=slider]]:bg-cyan-glow **:[[role=slider]]:border-cyan-glow"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-text-muted">Min</label>
                                    <Input
                                        type="number"
                                        value={filters.minPrice}
                                        onChange={(e) => onFilterChange({ minPrice: Number(e.target.value) })}
                                        className="h-9 bg-bg-tertiary border-border-subtle"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-text-muted">Max</label>
                                    <Input
                                        type="number"
                                        value={filters.maxPrice}
                                        onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
                                        className="h-9 bg-bg-tertiary border-border-subtle"
                                    />
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Region Filter */}
                {filtersData !== null && filtersData !== undefined && filtersData.regions.length > 0 && (
                    <AccordionItem value="region" className="border-border-subtle">
                        <AccordionTrigger className="text-text-primary hover:text-cyan-glow transition-colors py-3">
                            <span className="flex items-center gap-2">
                                <Monitor className="w-4 h-4" />
                                Region
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pt-2">
                                <button
                                    onClick={() => onFilterChange({ region: 'all' })}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                                        filters.region === 'all'
                                            ? 'bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow'
                                            : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    <span>All Regions</span>
                                </button>
                                {filtersData.regions.map((region) => (
                                    <button
                                        key={region.id}
                                        onClick={() => onFilterChange({ region: region.id })}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                                            filters.region === region.id
                                                ? 'bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow'
                                                : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        <span>{region.label}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {region.count}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}
            </Accordion>
        </div>
    );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ 
    onClearFilters,
    searchQuery,
}: { 
    onClearFilters: () => void;
    searchQuery?: string;
}): React.ReactElement {
    const popularSearches = ['Cyberpunk 2077', 'Game Pass', 'Steam Wallet', 'FIFA', 'Windows 11'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: GAMING_EASING }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            {/* Icon with glow */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-neon/20 blur-2xl rounded-full" />
                <div className="relative p-6 rounded-2xl bg-bg-secondary border border-border-subtle">
                    <Package className="w-16 h-16 text-purple-neon" />
                </div>
            </div>

            {/* Message */}
            <h3 className="text-xl font-semibold text-text-primary mb-2">
                No products found
            </h3>
            <p className="text-text-secondary text-center max-w-md mb-6">
                {searchQuery !== undefined && searchQuery !== null && searchQuery !== ''
                    ? `We couldn't find any products matching "${searchQuery}". Try adjusting your filters or search terms.`
                    : 'No products match your current filters. Try adjusting your search criteria.'}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                    onClick={onClearFilters}
                    className="bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan transition-all"
                >
                    <X className="w-4 h-4 mr-2" />
                    Clear All Filters
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    className="border-border-accent hover:border-cyan-glow/60 hover:text-cyan-glow"
                >
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                </Button>
            </div>

            {/* Popular searches */}
            <div className="text-center">
                <p className="text-text-muted text-sm mb-3">Popular searches:</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {popularSearches.map((term) => (
                        <Badge
                            key={term}
                            variant="outline"
                            className="cursor-pointer hover:bg-cyan-glow/10 hover:border-cyan-glow/50 hover:text-cyan-glow transition-all"
                        >
                            {term}
                        </Badge>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Error State Component
// ============================================================================

function ErrorState({ 
    onRetry,
    error,
}: { 
    onRetry: () => void;
    error?: Error;
}): React.ReactElement {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: GAMING_EASING }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            {/* Icon with glow */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-orange-warning/20 blur-2xl rounded-full" />
                <div className="relative p-6 rounded-2xl bg-bg-secondary border border-orange-warning/30">
                    <AlertCircle className="w-16 h-16 text-orange-warning" />
                </div>
            </div>

            {/* Message */}
            <h3 className="text-xl font-semibold text-text-primary mb-2">
                Something went wrong
            </h3>
            <p className="text-text-secondary text-center max-w-md mb-6">
                We couldn&apos;t load the products. Please try again or contact support if the problem persists.
            </p>

            {error !== null && error !== undefined && (
                <div className="mb-6 p-3 rounded-lg bg-bg-tertiary border border-border-subtle max-w-md">
                    <code className="text-xs text-orange-warning font-mono break-all">
                        {error.message}
                    </code>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={onRetry}
                    className="bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan transition-all"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    className="border-border-accent hover:border-cyan-glow/60 hover:text-cyan-glow"
                >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                </Button>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Main Catalog Content Component
// ============================================================================

function CatalogContent(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Filter state
    const [filters, setFilters] = useState<FilterState>(() => {
        const minPriceParam = Number(searchParams.get('minPrice'));
        const maxPriceParam = Number(searchParams.get('maxPrice'));
        const sortParam = searchParams.get('sort');
        return {
            search: searchParams.get('q') ?? '',
            category: searchParams.get('category') ?? 'all',
            platform: searchParams.get('platform')?.split(',').filter(Boolean) ?? [],
            region: searchParams.get('region') ?? 'all',
            minPrice: Number.isNaN(minPriceParam) ? 0 : minPriceParam,
            maxPrice: Number.isNaN(maxPriceParam) || maxPriceParam === 0 ? 500 : maxPriceParam,
            sort: (sortParam !== null && sortParam !== '' ? sortParam : 'newest') as FilterState['sort'],
        };
    });
    
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Product groups modal state
    const [selectedGroup, setSelectedGroup] = useState<ProductGroupResponseDto | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    // Sync URL with filters
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.search !== '') params.set('q', filters.search);
        if (filters.category !== 'all') params.set('category', filters.category);
        if (filters.platform.length > 0) params.set('platform', filters.platform.join(','));
        if (filters.region !== 'all') params.set('region', filters.region);
        if (filters.minPrice > 0) params.set('minPrice', String(filters.minPrice));
        if (filters.maxPrice < 500) params.set('maxPrice', String(filters.maxPrice));
        if (filters.sort !== 'newest') params.set('sort', filters.sort);
        
        const queryString = params.toString();
        const newUrl = queryString !== '' ? `/catalog?${queryString}` : '/catalog';
        router.replace(newUrl, { scroll: false });
    }, [filters, router]);

    // Fetch categories
    const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ['catalog-categories'],
        queryFn: () => catalogClient.getCategories(),
        staleTime: 5 * 60 * 1000,
    });

    // Fetch filters
    const { data: filtersData, isLoading: isFiltersLoading } = useQuery({
        queryKey: ['catalog-filters'],
        queryFn: () => catalogClient.getFilters(),
        staleTime: 5 * 60 * 1000,
    });

    // Fetch product groups
    const { data: productGroups, isLoading: isGroupsLoading } = useQuery({
        queryKey: ['catalog-groups'],
        queryFn: () => catalogGroupsApi.groupsControllerListGroups(),
        staleTime: 5 * 60 * 1000,
    });

    // Handle opening group variants modal
    const handleViewGroupVariants = useCallback((group: ProductGroupResponseDto) => {
        setSelectedGroup(group);
        setIsGroupModalOpen(true);
    }, []);

    // Fetch products
    const {
        data: productsData,
        isLoading: isProductsLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ['catalog-products', filters, page],
        queryFn: () =>
            catalogClient.findAll({
                search: filters.search !== '' ? filters.search : undefined,
                category: filters.category !== 'all' ? filters.category : undefined,
                platform: filters.platform.length > 0 ? filters.platform[0] : undefined,
                region: filters.region !== 'all' ? filters.region : undefined,
                minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
                maxPrice: filters.maxPrice < 500 ? filters.maxPrice : undefined,
                sort: filters.sort,
                limit: PRODUCTS_PER_PAGE,
                page,
            }),
        staleTime: 2 * 60 * 1000,
    });

    // Filter handlers
    const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
        setFilters((prev) => ({ ...prev, ...updates }));
        setPage(1);
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        setPage(1);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    }, [refetch]);

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.search !== '') count++;
        if (filters.category !== 'all') count++;
        if (filters.platform.length > 0) count++;
        if (filters.region !== 'all') count++;
        if (filters.minPrice > 0 || filters.maxPrice < 500) count++;
        return count;
    }, [filters]);

    // Map API response to ProductCard format
    const products: Product[] = useMemo(() => {
        if (productsData?.data === undefined || productsData.data === null) return [];
        return productsData.data.map((item) => ({
            id: item.id,
            slug: item.slug ?? '',
            name: item.title,
            description: item.description ?? '',
            price: item.price ?? '0',
            currency: item.currency ?? 'EUR',
            image: item.imageUrl ?? undefined,
            platform: item.platform ?? undefined,
            discount: undefined,
            stock: undefined,
            isAvailable: item.isPublished === true,
            rating: item.rating ?? undefined,
            isFeatured: false,
        }));
    }, [productsData]);

    const totalProducts = productsData?.total ?? 0;
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
    const hasProducts = products.length > 0;

    // Debounced search
    const [searchInput, setSearchInput] = useState(filters.search);
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                handleFilterChange({ search: searchInput });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, filters.search, handleFilterChange]);

    return (
        <main className="min-h-screen bg-bg-primary">
            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-border-subtle">
                {/* Animated gradient orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-glow/10 blur-3xl"
                        animate={{ 
                            x: [0, 50, 0],
                            y: [0, 30, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute -top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-purple-neon/10 blur-3xl"
                        animate={{ 
                            x: [0, -30, 0],
                            y: [0, 40, 0],
                            scale: [1, 1.15, 1],
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    />
                    <motion.div
                        className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-pink-featured/5 blur-3xl"
                        animate={{ 
                            x: [0, 40, 0],
                            y: [0, -20, 0],
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    />
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg-primary/50 to-bg-primary pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ease: GAMING_EASING }}
                        className="flex justify-center mb-6"
                    >
                        <Badge 
                            variant="outline" 
                            className="px-4 py-1.5 bg-bg-secondary/80 border-cyan-glow/30 text-cyan-glow shadow-glow-cyan-sm backdrop-blur-sm"
                        >
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-glow opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-glow" />
                            </span>
                            <Zap className="w-3.5 h-3.5 mr-1.5" />
                            {totalProducts.toLocaleString()}+ Digital Products
                        </Badge>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, ease: GAMING_EASING }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-text-primary mb-4"
                    >
                        Browse All{' '}
                        <span className="text-gradient-primary">Editions</span>
                        {' '}and{' '}
                        <span className="text-gradient-featured">Platforms</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, ease: GAMING_EASING }}
                        className="text-text-secondary text-center max-w-2xl mx-auto mb-8"
                    >
                        Discover thousands of digital products with instant delivery and secure crypto payments
                    </motion.p>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, ease: GAMING_EASING }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative group">
                            {/* Glow effect */}
                            <div className="absolute -inset-0.5 bg-linear-to-r from-cyan-glow/40 via-purple-neon/40 to-pink-featured/40 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative flex items-center bg-bg-secondary border border-border-subtle rounded-xl overflow-hidden focus-within:border-cyan-glow/60 transition-colors">
                                <Search className="w-5 h-5 text-text-muted ml-4 shrink-0" />
                                <Input
                                    type="text"
                                    placeholder="Search games, software, gift cards..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="flex-1 h-12 md:h-14 border-0 bg-transparent text-text-primary placeholder:text-text-muted focus-visible:ring-0 text-base"
                                />
                                <div className="hidden md:flex items-center gap-2 pr-2">
                                    <kbd className="hidden lg:inline-flex h-7 select-none items-center gap-1 rounded-md border border-border-subtle bg-bg-tertiary px-2 text-xs font-mono text-text-muted">
                                        ⌘K
                                    </kbd>
                                    <Button
                                        size="sm"
                                        className="bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan-sm transition-all"
                                    >
                                        <Search className="w-4 h-4 mr-1.5" />
                                        Search
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, ease: GAMING_EASING }}
                        className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 text-sm"
                    >
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Zap className="w-4 h-4 text-cyan-glow" />
                            <span>Instant Delivery</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Package className="w-4 h-4 text-purple-neon" />
                            <span>300+ Crypto Accepted</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Star className="w-4 h-4 text-pink-featured" />
                            <span>Secure & Encrypted</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Sidebar - Desktop */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className="sticky top-4">
                            <Card className="bg-bg-secondary border-border-subtle overflow-hidden">
                                {/* Header glow accent */}
                                <div className="h-1 bg-linear-to-r from-cyan-glow via-purple-neon to-pink-featured" />
                                <ScrollArea className="h-[calc(100vh-8rem)]">
                                    <div className="p-4">
                                        <FilterSidebar
                                            filters={filters}
                                            onFilterChange={handleFilterChange}
                                            onClearFilters={handleClearFilters}
                                            filtersData={filtersData}
                                            categoriesData={categoriesData}
                                            isLoading={isCategoriesLoading || isFiltersLoading}
                                            activeFilterCount={activeFilterCount}
                                        />
                                    </div>
                                </ScrollArea>
                            </Card>
                        </div>
                    </aside>

                    {/* Mobile Filter Sheet */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full border-border-accent hover:border-cyan-glow/60 hover:text-cyan-glow"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <Badge className="ml-2 bg-cyan-glow text-bg-primary">
                                            {activeFilterCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 bg-bg-secondary border-border-subtle p-0">
                                <SheetHeader className="p-4 border-b border-border-subtle">
                                    <SheetTitle className="text-text-primary flex items-center gap-2">
                                        <SlidersHorizontal className="w-5 h-5 text-cyan-glow" />
                                        Filters
                                    </SheetTitle>
                                </SheetHeader>
                                <ScrollArea className="h-[calc(100vh-5rem)]">
                                    <div className="p-4">
                                        <FilterSidebar
                                            filters={filters}
                                            onFilterChange={handleFilterChange}
                                            onClearFilters={handleClearFilters}
                                            filtersData={filtersData}
                                            categoriesData={categoriesData}
                                            isLoading={isCategoriesLoading || isFiltersLoading}
                                            activeFilterCount={activeFilterCount}
                                        />
                                    </div>
                                </ScrollArea>
                                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-subtle bg-bg-secondary">
                                    <SheetClose asChild>
                                        <Button className="w-full bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90">
                                            Show Results ({totalProducts})
                                        </Button>
                                    </SheetClose>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Products Section */}
                    <div className="flex-1 min-w-0">
                        {/* Product Groups Section */}
                        {productGroups !== undefined && productGroups !== null && productGroups.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ease: GAMING_EASING }}
                                className="mb-8"
                            >
                                {/* Section Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-neon/20 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-purple-neon" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-text-primary">Product Collections</h2>
                                            <p className="text-sm text-text-secondary">Browse games with multiple editions & platforms</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-purple-neon/30 text-purple-neon">
                                        {productGroups.length} {productGroups.length === 1 ? 'collection' : 'collections'}
                                    </Badge>
                                </div>

                                {/* Groups Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {isGroupsLoading ? (
                                        // Loading skeletons
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="aspect-3/4 rounded-lg bg-bg-secondary border border-border-subtle skeleton" />
                                        ))
                                    ) : (
                                        productGroups.slice(0, 6).map((group, index) => (
                                            <motion.div
                                                key={group.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05, ease: GAMING_EASING }}
                                            >
                                                <ProductGroupCard
                                                    group={group}
                                                    onViewVariants={handleViewGroupVariants}
                                                />
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Toolbar */}
                        <div className="glass rounded-xl p-4 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                {/* Results count */}
                                <div className="flex items-center gap-3">
                                    <p className="text-text-secondary">
                                        {isProductsLoading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-cyan-glow" />
                                                Loading...
                                            </span>
                                        ) : (
                                            <>
                                                Showing{' '}
                                                <span className="text-text-primary font-medium">
                                                    {products.length}
                                                </span>{' '}
                                                of{' '}
                                                <span className="text-cyan-glow font-medium">
                                                    {totalProducts.toLocaleString()}
                                                </span>{' '}
                                                products
                                            </>
                                        )}
                                    </p>
                                    {isFetching && !isProductsLoading && (
                                        <Badge variant="outline" className="text-cyan-glow border-cyan-glow/30 animate-pulse">
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            Updating
                                        </Badge>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-3">
                                    {/* Sort */}
                                    <Select
                                        value={filters.sort}
                                        onValueChange={(value) => handleFilterChange({ sort: value as FilterState['sort'] })}
                                    >
                                        <SelectTrigger className="w-44 bg-bg-tertiary border-border-subtle hover:border-cyan-glow/40 transition-colors">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-bg-secondary border-border-subtle">
                                            {SORT_OPTIONS.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className="hover:bg-bg-tertiary focus:bg-bg-tertiary"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <option.icon className="w-4 h-4" />
                                                        {option.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* View Toggle */}
                                    <div className="hidden sm:flex items-center rounded-lg border border-border-subtle bg-bg-tertiary p-1">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-md transition-all duration-200 ${
                                                viewMode === 'grid'
                                                    ? 'bg-cyan-glow/20 text-cyan-glow shadow-glow-cyan-sm'
                                                    : 'text-text-muted hover:text-text-primary'
                                            }`}
                                            aria-label="Grid view"
                                        >
                                            <Grid3X3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-md transition-all duration-200 ${
                                                viewMode === 'list'
                                                    ? 'bg-cyan-glow/20 text-cyan-glow shadow-glow-cyan-sm'
                                                    : 'text-text-muted hover:text-text-primary'
                                            }`}
                                            aria-label="List view"
                                        >
                                            <LayoutList className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Refresh */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="hover:text-cyan-glow hover:bg-cyan-glow/10 transition-all"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Products Grid */}
                        <AnimatePresence mode="wait">
                            {isError ? (
                                <ErrorState 
                                    key="error"
                                    onRetry={() => refetch()} 
                                    error={error instanceof Error ? error : undefined}
                                />
                            ) : isProductsLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <ProductGridSkeleton count={12} />
                                </motion.div>
                            ) : !hasProducts ? (
                                <EmptyState 
                                    key="empty"
                                    onClearFilters={handleClearFilters}
                                    searchQuery={filters.search}
                                />
                            ) : (
                                <motion.div
                                    key="products"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className={`grid gap-4 md:gap-6 ${
                                        viewMode === 'grid'
                                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                            : 'grid-cols-1'
                                    }`}>
                                        {products.map((product, index) => (
                                            <motion.div
                                                key={product.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ 
                                                    delay: index * 0.03,
                                                    ease: GAMING_EASING,
                                                }}
                                            >
                                                <ProductCard product={product} />
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pagination */}
                        {hasProducts && totalPages > 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, ease: GAMING_EASING }}
                                className="mt-12"
                            >
                                <div className="text-center mb-4">
                                    <p className="text-text-secondary text-sm">
                                        Page <span className="text-cyan-glow font-medium">{page}</span> of{' '}
                                        <span className="text-text-primary font-medium">{totalPages}</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="border-border-accent hover:border-cyan-glow/60 hover:text-cyan-glow disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>

                                    <div className="hidden sm:flex items-center gap-1 glass rounded-lg px-2 py-1">
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
                                                    onClick={() => setPage(pageNum)}
                                                    className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                                                        page === pageNum
                                                            ? 'bg-cyan-glow text-bg-primary shadow-glow-cyan-sm'
                                                            : 'text-text-secondary hover:text-cyan-glow hover:bg-cyan-glow/10'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="border-border-accent hover:border-cyan-glow/60 hover:text-cyan-glow disabled:opacity-50"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>

                                {/* Load More Alternative */}
                                <div className="flex justify-center mt-6">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || isFetching}
                                        className="border-purple-neon/40 hover:border-purple-neon hover:bg-purple-neon/10 hover:text-purple-neon hover:shadow-glow-purple-sm transition-all"
                                    >
                                        {isFetching ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Load More Products
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </section>

            {/* Group Variants Modal */}
            <GroupVariantsModal
                group={selectedGroup}
                open={isGroupModalOpen}
                onOpenChange={setIsGroupModalOpen}
            />
        </main>
    );
}

// ============================================================================
// Page Export with Suspense
// ============================================================================

export default function CatalogPage(): React.ReactElement {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-bg-primary">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-glow/20 blur-2xl rounded-full animate-pulse" />
                                <Loader2 className="w-12 h-12 text-cyan-glow animate-spin relative" />
                            </div>
                            <p className="mt-4 text-text-secondary">Loading catalog...</p>
                        </div>
                    </div>
                </main>
            }
        >
            <CatalogContent />
        </Suspense>
    );
}
