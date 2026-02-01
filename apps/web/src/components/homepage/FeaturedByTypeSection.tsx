'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi, Configuration } from '@bitloot/sdk';
import type { ProductListResponseDto } from '@bitloot/sdk';
import { toast } from 'sonner';

// API Configuration
const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});
const catalogApi = new CatalogApi(apiConfig);
import {
    Gamepad2,
    Monitor,
    Repeat,
    Sparkles,
    ArrowRight,
    Package,
    Shield,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Tabs, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Skeleton } from '@/design-system/primitives/skeleton';

// Components
import { CatalogProductCard } from '@/features/catalog/components/CatalogProductCard';
import type { CatalogProduct } from '@/features/catalog/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useAddToWatchlist, useRemoveFromWatchlist } from '@/features/watchlist/hooks/useWatchlist';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ProductTypeTab {
    id: string;
    label: string;
    icon: LucideIcon;
    category: string; // API category filter
    color: string;
    description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRODUCT_TYPE_TABS: ProductTypeTab[] = [
    { 
        id: 'featured_games', 
        label: 'Games', 
        icon: Gamepad2, 
        category: 'games',
        color: 'cyan',
        description: 'PC, PlayStation, Xbox, Nintendo & more'
    },
    { 
        id: 'featured_software', 
        label: 'Software', 
        icon: Monitor, 
        category: 'software',
        color: 'purple',
        description: 'Productivity, security & creative tools'
    },
    { 
        id: 'featured_subscriptions', 
        label: 'Subscriptions', 
        icon: Repeat, 
        category: 'subscriptions',
        color: 'pink',
        description: 'Game Pass, EA Play, Ubisoft+ & more'
    },
];

// Category-specific background gradients
const CATEGORY_BACKGROUNDS: Record<string, string> = {
    'cyan': 'from-cyan-glow/5 via-cyan-glow/2 to-transparent',
    'purple': 'from-purple-neon/5 via-purple-neon/2 to-transparent',
    'green': 'from-green-success/5 via-green-success/2 to-transparent',
    'pink': 'from-pink-featured/5 via-pink-featured/2 to-transparent',
};

// Pagination constants
const PRODUCTS_PER_PAGE = 12;
const TOTAL_PRODUCTS = 48;

// ============================================================================
// ANIMATED TAB ICON - Icon with animation on tab switch
// ============================================================================

function AnimatedTabIcon({ Icon, isActive, color }: { Icon: LucideIcon; isActive: boolean; color: string }): React.ReactElement {
    const getColorClass = (c: string, active: boolean): string => {
        if (!active) return 'text-current';
        switch (c) {
            case 'cyan': return 'text-white';
            case 'purple': return 'text-white';
            case 'green': return 'text-white';
            case 'pink': return 'text-white';
            default: return 'text-current';
        }
    };

    return (
        <motion.div
            initial={false}
            animate={isActive ? { 
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0],
            } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            <Icon className={`w-4 h-4 ${getColorClass(color, isActive)}`} aria-hidden="true" />
        </motion.div>
    );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ProductGridSkeleton(): React.ReactElement {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl bg-bg-secondary border border-border-subtle">
                    <Skeleton className="aspect-[16/10]" />
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-8 flex-1" />
                            <Skeleton className="h-8 flex-1" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyProductsState({ type }: { type: string }): React.ReactElement {
    return (
        <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-secondary border border-border-subtle mb-4">
                <Package className="w-8 h-8 text-text-muted" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No {type} found</h3>
            <p className="text-text-secondary mb-4">
                Check back soon for new products in this category.
            </p>
            <Button asChild variant="outline">
                <Link href="/catalog">Browse All Products</Link>
            </Button>
        </div>
    );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ message }: { message: string }): React.ReactElement {
    return (
        <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-error/10 border border-red-error/30 mb-4">
                <Shield className="w-8 h-8 text-red-error" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-red-error mb-2">Something went wrong</h3>
            <p className="text-text-secondary mb-4">{message}</p>
            <Button
                variant="outline"
                onClick={() => window.location.reload()}
            >
                Try Again
            </Button>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FeaturedByTypeSection(): React.ReactElement {
    const [activeTab, setActiveTab] = useState('featured_games');
    const [currentPage, setCurrentPage] = useState(0);
    const router = useRouter();
    const { addItem } = useCart();
    const { isAuthenticated } = useAuth();
    const { mutate: _addToWatchlist } = useAddToWatchlist();
    const { mutate: _removeFromWatchlist } = useRemoveFromWatchlist();

    // Reset page when tab changes
    const handleTabChange = useCallback((tabId: string) => {
        setActiveTab(tabId);
        setCurrentPage(0);
    }, []);

    // Get current tab config (always defined since we have PRODUCT_TYPE_TABS[0] fallback)
    const currentTab = useMemo(() => {
        return PRODUCT_TYPE_TABS.find(t => t.id === activeTab) ?? PRODUCT_TYPE_TABS[0]!;
    }, [activeTab]);

    // Fetch products from admin-configured section
    const {
        data: productsData,
        isLoading,
        isError,
        error,
    } = useQuery<ProductListResponseDto>({
        queryKey: ['homepage', 'section', activeTab],
        queryFn: () => catalogApi.catalogControllerGetProductsBySection({ 
            sectionKey: activeTab, 
            limit: TOTAL_PRODUCTS 
        }),
        staleTime: 2 * 60 * 1000, // 2 minutes to pick up admin changes quickly
    });

    // Transform API response to CatalogProduct format
    const products: CatalogProduct[] = useMemo(() => {
        if (productsData?.data == null) return [];
        return productsData.data.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.title,
            description: p.description ?? '',
            price: p.price,
            currency: p.currency ?? 'EUR',
            image: p.imageUrl ?? undefined,
            platform: p.platform ?? undefined,
            category: p.category ?? undefined,
            isAvailable: p.isPublished,
            rating: p.metacriticScore != null ? p.metacriticScore / 20 : undefined,
        }));
    }, [productsData]);

    // Pagination logic
    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const start = currentPage * PRODUCTS_PER_PAGE;
        return products.slice(start, start + PRODUCTS_PER_PAGE);
    }, [products, currentPage]);

    const handlePrevPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(0, prev - 1));
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
    }, [totalPages]);

    const handlePageClick = useCallback((pageIndex: number) => {
        setCurrentPage(pageIndex);
    }, []);

    // Handle Add to Cart
    const handleAddToCart = useCallback((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product == null) return;
        
        addItem({
            productId: product.id,
            title: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            image: product.image,
        });
        toast.success(`${product.name} added to cart`);
    }, [addItem, products]);

    // Handle View Product
    const handleViewProduct = useCallback((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product == null) return;
        router.push(`/product/${product.slug}`);
    }, [router, products]);

    // Handle Wishlist Toggle
    const handleToggleWishlist = useCallback((_productId: string) => {
        if (!isAuthenticated) {
            toast.error('Please login to add items to your wishlist', {
                action: {
                    label: 'Login',
                    onClick: () => { window.location.href = '/auth/login'; },
                },
            });
            return;
        }

        // We'll let the CatalogProductCard handle the actual toggle logic
        // since it has access to the isInWishlist state
    }, [isAuthenticated]);

    // Tab color classes
    const getTabColorClasses = (tabId: string, isActive: boolean): string => {
        const tab = PRODUCT_TYPE_TABS.find(t => t.id === tabId);
        if (tab === undefined) return '';
        
        if (isActive) {
            switch (tab.color) {
                case 'cyan': return 'bg-cyan-glow text-bg-primary shadow-glow-cyan-sm';
                case 'purple': return 'bg-purple-neon text-white shadow-glow-purple-sm';
                case 'green': return 'bg-green-success text-white shadow-glow-success';
                case 'pink': return 'bg-pink-featured text-white shadow-glow-pink';
                default: return 'bg-cyan-glow text-bg-primary';
            }
        }
        return 'text-text-muted hover:text-text-primary';
    };

    return (
        <section className="py-20 bg-bg-primary relative overflow-hidden">
            {/* Animated category-specific background gradient */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentTab.color}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 bg-gradient-to-b ${CATEGORY_BACKGROUNDS[currentTab.color] ?? CATEGORY_BACKGROUNDS['cyan']} pointer-events-none`}
                    aria-hidden="true"
                />
            </AnimatePresence>
            
            {/* Subtle orb effect matching category color */}
            <motion.div
                key={`orb-${currentTab.color}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.4, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[150px] pointer-events-none"
                style={{
                    background: currentTab.color === 'cyan' ? 'rgba(0, 217, 255, 0.08)' 
                        : currentTab.color === 'purple' ? 'rgba(157, 78, 221, 0.08)'
                        : currentTab.color === 'green' ? 'rgba(57, 255, 20, 0.08)'
                        : 'rgba(255, 0, 110, 0.08)'
                }}
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <Badge
                        variant="secondary"
                        className="mb-4 px-3 py-1 bg-purple-neon/10 border border-purple-neon/30 text-purple-neon"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                        Featured Collections
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        Shop by Category
                    </h2>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentTab.description}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-text-secondary max-w-2xl mx-auto"
                        >
                            {currentTab.description}
                        </motion.p>
                    </AnimatePresence>
                </motion.div>

                {/* Enhanced Product Type Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="w-full"
                >
                    <div className="flex justify-center mb-10">
                        <TabsList className="inline-flex p-1.5 bg-bg-secondary/70 border border-border-subtle rounded-2xl backdrop-blur-md gap-1 shadow-lg">
                            {PRODUCT_TYPE_TABS.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${getTabColorClasses(tab.id, isActive)}`}
                                    >
                                        <AnimatedTabIcon 
                                            Icon={tab.icon} 
                                            isActive={isActive} 
                                            color={tab.color} 
                                        />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        {/* Popular badge on hover */}
                                        {isActive && (
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="hidden lg:inline-flex items-center ml-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-white/20"
                                            >
                                                Popular
                                            </motion.span>
                                        )}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    {/* Category Stats Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center gap-4 md:gap-8 mb-8"
                    >
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <span className="font-semibold text-text-primary">{paginatedProducts.length}</span>
                            <span>of {products.length} products</span>
                        </div>
                        <div className="w-px h-4 bg-border-subtle" />
                        <div className="flex items-center gap-2 text-sm">
                            <motion.span 
                                key={currentTab.color}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    currentTab.color === 'cyan' ? 'bg-cyan-glow/10 text-cyan-glow' :
                                    currentTab.color === 'purple' ? 'bg-purple-neon/10 text-purple-neon' :
                                    currentTab.color === 'green' ? 'bg-green-success/10 text-green-success' :
                                    'bg-pink-featured/10 text-pink-featured'
                                }`}
                            >
                                <TrendingUp className="w-3 h-3" />
                                Trending in {currentTab.label}
                            </motion.span>
                        </div>
                    </motion.div>

                    {/* Products Grid */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {isLoading ? (
                                <ProductGridSkeleton />
                            ) : isError ? (
                                <ErrorState
                                    message={
                                        error instanceof Error
                                            ? error.message
                                            : 'Failed to load products'
                                    }
                                />
                            ) : products.length === 0 ? (
                                <EmptyProductsState type={currentTab.label} />
                            ) : (
                                <div className="relative group">
                                    {/* Left Arrow */}
                                    {totalPages > 1 && currentPage > 0 && (
                                        <button
                                            onClick={handlePrevPage}
                                            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 rounded-full bg-bg-secondary/90 backdrop-blur-sm border border-border-accent shadow-lg flex items-center justify-center text-text-primary transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:-translate-x-6 ${
                                                currentTab.color === 'cyan' ? 'hover:bg-cyan-glow hover:text-bg-primary hover:border-cyan-glow hover:shadow-glow-cyan'
                                                : currentTab.color === 'purple' ? 'hover:bg-purple-neon hover:text-white hover:border-purple-neon hover:shadow-glow-purple'
                                                : currentTab.color === 'green' ? 'hover:bg-green-success hover:text-white hover:border-green-success hover:shadow-glow-success'
                                                : 'hover:bg-pink-featured hover:text-white hover:border-pink-featured hover:shadow-glow-pink'
                                            }`}
                                            aria-label="Previous products"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                    )}

                                    {/* Right Arrow */}
                                    {totalPages > 1 && currentPage < totalPages - 1 && (
                                        <button
                                            onClick={handleNextPage}
                                            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 rounded-full bg-bg-secondary/90 backdrop-blur-sm border border-border-accent shadow-lg flex items-center justify-center text-text-primary transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-6 ${
                                                currentTab.color === 'cyan' ? 'hover:bg-cyan-glow hover:text-bg-primary hover:border-cyan-glow hover:shadow-glow-cyan'
                                                : currentTab.color === 'purple' ? 'hover:bg-purple-neon hover:text-white hover:border-purple-neon hover:shadow-glow-purple'
                                                : currentTab.color === 'green' ? 'hover:bg-green-success hover:text-white hover:border-green-success hover:shadow-glow-success'
                                                : 'hover:bg-pink-featured hover:text-white hover:border-pink-featured hover:shadow-glow-pink'
                                            }`}
                                            aria-label="Next products"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    )}

                                    {/* Products Grid with Animation */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`${activeTab}-${currentPage}`}
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                        >
                                            {paginatedProducts.map((product) => (
                                                <CatalogProductCard
                                                    key={product.id}
                                                    product={product}
                                                    onAddToCart={handleAddToCart}
                                                    onViewProduct={handleViewProduct}
                                                    onToggleWishlist={handleToggleWishlist}
                                                    showQuickActions={true}
                                                />
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Page Indicators (dots) */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-8">
                                            {Array.from({ length: totalPages }).map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handlePageClick(idx)}
                                                    className={`transition-all duration-300 rounded-full ${
                                                        currentPage === idx
                                                            ? `w-8 h-2 ${
                                                                currentTab.color === 'cyan' ? 'bg-cyan-glow shadow-glow-cyan-sm'
                                                                : currentTab.color === 'purple' ? 'bg-purple-neon shadow-glow-purple-sm'
                                                                : currentTab.color === 'green' ? 'bg-green-success shadow-glow-success'
                                                                : 'bg-pink-featured shadow-glow-pink'
                                                            }`
                                                            : 'w-2 h-2 bg-bg-tertiary hover:bg-text-muted'
                                                    }`}
                                                    aria-label={`Go to page ${idx + 1}`}
                                                    aria-current={currentPage === idx ? 'page' : undefined}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </Tabs>

                {/* View All Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center mt-12"
                >
                    <Button asChild variant="outline" size="lg" className="group">
                        <Link href={`/catalog?category=${currentTab.category}`}>
                            View All {currentTab.label}
                            <ArrowRight
                                className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                                aria-hidden="true"
                            />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}

export default FeaturedByTypeSection;
