'use client';

/**
 * FeaturedByTypeSection - 3 Carousel Layout
 * 
 * Redesigned featured collections section with 3 horizontal scrollable carousels:
 * - Carousel 1: Games (cyan accent)
 * - Carousel 2: Software (purple accent)
 * - Carousel 3: Subscriptions (pink accent)
 * 
 * Features auto-scroll, segment progress indicators, and compact product cards.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { m } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi, Configuration } from '@bitloot/sdk';
import type { ProductListResponseDto } from '@bitloot/sdk';
import { toast } from 'sonner';
import { useInView } from '@/hooks/useInView';

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
    ChevronLeft,
    ChevronRight,
    ShoppingCart,
    Heart,
    Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Skeleton } from '@/design-system/primitives/skeleton';

// Components
import type { CatalogProduct } from '@/features/catalog/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ProductTypeConfig {
    id: string;
    label: string;
    icon: LucideIcon;
    category: string;
    color: 'cyan' | 'purple' | 'pink';
    accentHex: string;
    description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRODUCT_TYPES: ProductTypeConfig[] = [
    { 
        id: 'featured_games', 
        label: 'Games', 
        icon: Gamepad2, 
        category: 'games',
        color: 'cyan',
        accentHex: '#00d9ff',
        description: 'PC, PlayStation, Xbox, Nintendo & more'
    },
    { 
        id: 'featured_software', 
        label: 'Software', 
        icon: Monitor, 
        category: 'software',
        color: 'purple',
        accentHex: '#9d4edd',
        description: 'Productivity, security & creative tools'
    },
    { 
        id: 'featured_subscriptions', 
        label: 'Subscriptions', 
        icon: Repeat, 
        category: 'subscriptions',
        color: 'pink',
        accentHex: '#ff006e',
        description: 'Game Pass, EA Play, Ubisoft+ & more'
    },
];

const PRODUCTS_PER_CAROUSEL = 48;
const CARD_WIDTH = 288; // Card width + gap for scroll calculations

// ============================================================================
// COLOR CLASSES
// ============================================================================

const colorClasses = {
    cyan: {
        iconBg: 'bg-cyan-glow/20',
        iconColor: 'text-cyan-glow',
        badgeBg: 'bg-cyan-glow/10 text-cyan-glow',
        cardBorder: 'hover:border-cyan-glow/50',
        buttonBg: 'bg-cyan-glow hover:bg-cyan-glow/90 text-bg-primary',
        glow: 'hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]',
    },
    purple: {
        iconBg: 'bg-purple-neon/20',
        iconColor: 'text-purple-neon',
        badgeBg: 'bg-purple-neon/10 text-purple-neon',
        cardBorder: 'hover:border-purple-neon/50',
        buttonBg: 'bg-purple-neon hover:bg-purple-neon/90 text-white',
        glow: 'hover:shadow-[0_0_20px_rgba(157,78,221,0.15)]',
    },
    pink: {
        iconBg: 'bg-pink-featured/20',
        iconColor: 'text-pink-featured',
        badgeBg: 'bg-pink-featured/10 text-pink-featured',
        cardBorder: 'hover:border-pink-featured/50',
        buttonBg: 'bg-pink-featured hover:bg-pink-featured/90 text-white',
        glow: 'hover:shadow-[0_0_20px_rgba(255,0,110,0.15)]',
    },
};

// ============================================================================
// COMPACT PRODUCT CARD
// ============================================================================

interface CompactProductCardProps {
    product: CatalogProduct;
    color: 'cyan' | 'purple' | 'pink';
    onAddToCart: (productId: string) => void;
    /** Set to true for above-the-fold images (LCP optimization) */
    isPriority?: boolean;
}

function CompactProductCard({ product, color, onAddToCart, isPriority = false }: CompactProductCardProps): React.ReactElement {
    const colors = colorClasses[color];

    return (
        <Link href={`/product/${product.slug}`} className="block group">
            <div className={cn(
                'relative flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary transition-all duration-300',
                'hover:-translate-y-1',
                colors.cardBorder,
                colors.glow
            )}>
                {/* Image Container */}
                <div className="relative aspect-4/3 overflow-hidden bg-bg-tertiary">
                    {product.image != null && product.image !== '' ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            priority={isPriority}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="288px"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-10 w-10 text-text-muted" />
                        </div>
                    )}
                    
                    {/* Platform Badge */}
                    {product.platform != null && (
                        <div className="absolute left-2 top-2">
                            <Badge className="bg-bg-primary/80 text-text-primary text-[10px] px-1.5 py-0.5 backdrop-blur-sm">
                                {product.platform}
                            </Badge>
                        </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-bg-primary/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg-primary"
                    >
                        <Heart className="h-3.5 w-3.5 text-text-secondary hover:text-pink-featured transition-colors" />
                    </button>

                    {/* Quick Add Button - Shows on hover */}
                    <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAddToCart(product.id);
                            }}
                            className={cn(
                                'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                colors.buttonBg
                            )}
                        >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Add to Cart
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1.5 p-3">
                    {/* Title */}
                    <h3 className="text-sm font-medium text-text-primary line-clamp-2 min-h-10 group-hover:text-white transition-colors">
                        {product.name}
                    </h3>

                    {/* Rating & Price Row */}
                    <div className="flex items-center justify-between">
                        {/* Rating */}
                        {product.rating != null && product.rating > 0 ? (
                            <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                <span className="text-xs text-text-secondary">{product.rating.toFixed(1)}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-text-muted">New</span>
                        )}

                        {/* Price */}
                        <div className="text-sm font-bold text-text-primary">
                            €{parseFloat(product.price).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function CarouselSkeleton(): React.ReactElement {
    return (
        <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-56 sm:w-64 md:w-72 shrink-0">
                    <div className="overflow-hidden rounded-xl bg-bg-secondary border border-border-subtle">
                        <Skeleton className="aspect-4/3" />
                        <div className="p-3 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-4 w-16" />
                            </div>
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

function EmptyState({ type }: { type: string }): React.ReactElement {
    return (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-bg-secondary border border-border-subtle mb-3">
                <Package className="w-6 h-6 text-text-muted" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">No {type} found</h3>
            <p className="text-xs text-text-secondary">
                Check back soon for new products.
            </p>
        </div>
    );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ message }: { message: string }): React.ReactElement {
    return (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 mb-3">
                <Shield className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-red-500 mb-1">Something went wrong</h3>
            <p className="text-xs text-text-secondary">{message}</p>
        </div>
    );
}

// ============================================================================
// PRODUCT CAROUSEL COMPONENT
// ============================================================================

interface ProductCarouselProps {
    config: ProductTypeConfig;
    /** When false, the data fetch is deferred (IntersectionObserver-based). */
    enabled?: boolean;
}

function ProductCarousel({ config, enabled = true }: ProductCarouselProps): React.ReactElement {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [activeSegment, setActiveSegment] = useState(0);
    const [totalSegments, setTotalSegments] = useState(1);
    const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
    
    const { addItem } = useCart();
    const { isAuthenticated: _isAuthenticated } = useAuth();
    const colors = colorClasses[config.color];
    const Icon = config.icon;

    // Fetch products — gated by the parent section's IntersectionObserver
    const { data: productsData, isLoading, isError, error } = useQuery<ProductListResponseDto>({
        queryKey: ['homepage', 'carousel', config.id],
        queryFn: () => catalogApi.catalogControllerGetProductsBySection({ 
            sectionKey: config.id, 
            limit: PRODUCTS_PER_CAROUSEL 
        }),
        staleTime: 5 * 60 * 1000, // 5 min stale
        enabled,
    });

    // Transform products
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

    // Check scroll state (wrapped in rAF to batch layout reads and avoid forced reflows)
    const checkScrollState = useCallback(() => {
        requestAnimationFrame(() => {
            const container = scrollContainerRef.current;
            if (container === null) return;

            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;

            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

            // Calculate segments
            const visibleCards = Math.floor(clientWidth / CARD_WIDTH);
            const segments = Math.max(1, Math.ceil(products.length / Math.max(1, visibleCards)));
            setTotalSegments(segments);

            // Calculate active segment
            const maxScroll = scrollWidth - clientWidth;
            if (maxScroll <= 0) {
                setActiveSegment(0);
                return;
            }
            const scrollProgress = scrollLeft / maxScroll;
            const currentSegment = Math.min(segments - 1, Math.floor(scrollProgress * segments));
            setActiveSegment(Number.isNaN(currentSegment) ? 0 : currentSegment);
        });
    }, [products.length]);

    // Initialize scroll state
    useEffect(() => {
        checkScrollState();
        window.addEventListener('resize', checkScrollState);
        return () => window.removeEventListener('resize', checkScrollState);
    }, [checkScrollState, products.length]);

    // Scroll function
    const scroll = useCallback((direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (container === null) return;

        const scrollAmount = direction === 'left' ? -CARD_WIDTH * 3 : CARD_WIDTH * 3;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }, []);

    // Scroll to segment
    const scrollToSegment = useCallback((segmentIndex: number) => {
        const container = scrollContainerRef.current;
        if (container === null || totalSegments <= 1) return;

        const maxScroll = container.scrollWidth - container.clientWidth;
        const targetScroll = (segmentIndex / (totalSegments - 1)) * maxScroll;
        container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }, [totalSegments]);

    // Auto-scroll
    useEffect(() => {
        if (isAutoScrollPaused || products.length <= 6 || isLoading) return;

        const intervalId = setInterval(() => {
            requestAnimationFrame(() => {
                const container = scrollContainerRef.current;
                if (container === null) return;

                const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;

                if (isAtEnd) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: CARD_WIDTH * 2, behavior: 'smooth' });
                }
            });
        }, 15000);

        return () => clearInterval(intervalId);
    }, [isAutoScrollPaused, products.length, isLoading]);

    // Handle Add to Cart
    const handleAddToCart = useCallback((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product == null) return;
        
        addItem({
            productId: product.id,
            slug: product.slug,
            title: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            image: product.image,
            platform: product.platform,
        });
        toast.success(`${product.name} added to cart`);
    }, [addItem, products]);

    return (
        <div className="space-y-4">
            {/* Carousel Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shadow-card-sm', colors.iconBg)}>
                        <Icon className={cn('h-5 w-5', colors.iconColor)} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">{config.label}</h3>
                            {products.length > 0 && (
                                <Badge variant="secondary" className={cn('text-[10px] px-1.5', colors.badgeBg)}>
                                    {products.length}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-text-muted">{config.description}</p>
                    </div>
                </div>

                {/* Navigation + View All */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className="h-8 w-8 rounded-full border-border-subtle bg-bg-tertiary disabled:opacity-30"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className="h-8 w-8 rounded-full border-border-subtle bg-bg-tertiary disabled:opacity-30"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="text-xs">
                        <Link href={`/catalog?category=${config.category}`}>
                            View All
                            <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Carousel */}
            {isLoading ? (
                <CarouselSkeleton />
            ) : isError ? (
                <ErrorState message={error instanceof Error ? error.message : 'Failed to load'} />
            ) : products.length === 0 ? (
                <EmptyState type={config.label} />
            ) : (
                <div
                    className="relative"
                    onMouseEnter={() => setIsAutoScrollPaused(true)}
                    onMouseLeave={() => setIsAutoScrollPaused(false)}
                >
                    {/* Gradient fades */}
                    <div className={cn(
                        'pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-linear-to-r from-bg-primary to-transparent transition-opacity',
                        canScrollLeft ? 'opacity-100' : 'opacity-0'
                    )} />
                    <div className={cn(
                        'pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-linear-to-l from-bg-primary to-transparent transition-opacity',
                        canScrollRight ? 'opacity-100' : 'opacity-0'
                    )} />

                    {/* Products */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={checkScrollState}
                        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden scroll-smooth snap-x snap-mandatory -mx-1 px-1"
                    >
                        {products.map((product, index) => (
                            <div key={product.id} className="w-56 sm:w-64 md:w-72 shrink-0 snap-start">
                                <CompactProductCard
                                    product={product}
                                    color={config.color}
                                    onAddToCart={handleAddToCart}
                                    isPriority={index < 4}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Segment Progress */}
            {!isLoading && products.length > 6 && totalSegments > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                    {Array.from({ length: totalSegments }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToSegment(index)}
                            className={cn(
                                'h-1.5 rounded-full transition-all duration-300',
                                index === activeSegment
                                    ? 'w-6'
                                    : 'w-1.5 bg-border-accent hover:bg-text-muted'
                            )}
                            style={{
                                backgroundColor: index === activeSegment ? config.accentHex : undefined
                            }}
                            aria-label={`Go to section ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FeaturedByTypeSection(): React.ReactElement {
    // Defer all carousel data fetches until this section is about to scroll into view.
    // A single IntersectionObserver on the section root gates all 3 carousels simultaneously.
    const { ref: sectionRef, inView } = useInView('500px');

    return (
        <section ref={sectionRef} className="py-12 md:py-16 bg-bg-primary relative overflow-hidden">
            {/* Background decoration */}
            <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-purple-neon/5 via-transparent to-transparent opacity-50"
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Section Header */}
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-linear-to-br from-purple-neon/20 to-pink-featured/20 border border-purple-neon/30">
                            <Sparkles className="w-5 h-5 text-purple-neon" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-display font-bold text-text-primary flex items-center gap-2">
                                Featured Collections
                                <Badge className="bg-linear-to-r from-purple-neon to-pink-featured text-white border-0 text-[10px]">
                                    CURATED
                                </Badge>
                            </h2>
                            <p className="text-sm text-text-muted mt-0.5">
                                Hand-picked products across all categories
                            </p>
                        </div>
                    </div>

                    <Button asChild variant="outline" size="sm" className="group">
                        <Link href="/catalog">
                            Browse All
                            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </m.div>

                {/* 3 Carousels */}
                <div className="space-y-10">
                    {PRODUCT_TYPES.map((config, index) => (
                        <m.div
                            key={config.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <ProductCarousel config={config} enabled={inView} />
                        </m.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default FeaturedByTypeSection;
