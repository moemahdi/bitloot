'use client';

/**
 * TrendingNowGrid - 3 Carousel Layout
 * 
 * Redesigned trending section with 3 horizontal scrollable carousels:
 * - Grid 1: Top Sellers (ranks 1-16)
 * - Grid 2: Rising Stars (ranks 17-32)
 * - Grid 3: Hot Picks (ranks 33-48)
 * 
 * Inspired by RecommendedForYou carousel design with auto-scroll,
 * segment progress indicators, and compact product cards.
 */

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi, Configuration } from '@bitloot/sdk';
import type { ProductListResponseDto } from '@bitloot/sdk';
import { toast } from 'sonner';
import { cn } from '@/design-system/utils/utils';

// API Configuration
const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});
const catalogApi = new CatalogApi(apiConfig);

import {
    TrendingUp,
    Star,
    ShoppingCart,
    Flame,
    ArrowRight,
    Heart,
    Eye,
    ChevronLeft,
    ChevronRight,
    Rocket,
    Sparkles,
    Zap,
    Package,
} from 'lucide-react';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Skeleton } from '@/design-system/primitives/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useAddToWatchlist, useRemoveFromWatchlist, useCheckWatchlist } from '@/features/watchlist/hooks/useWatchlist';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TrendingProduct {
    id: string;
    slug: string;
    name: string;
    price: string;
    originalPrice?: string;
    currency: string;
    image?: string;
    platform?: string;
    category?: string;
    rating?: number;
    salesCount?: number;
    discount?: number;
}

interface CarouselConfig {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    accentColor: string;
    startIndex: number;
    endIndex: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTAL_PRODUCTS = 48;

const CAROUSEL_CONFIGS: CarouselConfig[] = [
    {
        id: 'top-sellers',
        title: 'Top Sellers',
        subtitle: 'Best performing games this week',
        icon: Flame,
        iconBg: 'bg-orange-warning/20',
        iconColor: 'text-orange-warning',
        accentColor: 'orange-warning',
        startIndex: 0,
        endIndex: 16,
    },
    {
        id: 'rising-stars',
        title: 'Rising Stars',
        subtitle: 'Rapidly climbing in popularity',
        icon: Rocket,
        iconBg: 'bg-purple-neon/20',
        iconColor: 'text-purple-neon',
        accentColor: 'purple-neon',
        startIndex: 16,
        endIndex: 32,
    },
    {
        id: 'hot-picks',
        title: 'Hot Picks',
        subtitle: 'Editor\'s recommended trending games',
        icon: Sparkles,
        iconBg: 'bg-cyan-glow/20',
        iconColor: 'text-cyan-glow',
        accentColor: 'cyan-glow',
        startIndex: 32,
        endIndex: 48,
    },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numPrice);
}

// Platform badge colors
const platformColors: Record<string, string> = {
    steam: 'bg-[#1b2838] text-white',
    origin: 'bg-[#f56c2d] text-white',
    ubisoft: 'bg-[#0070ff] text-white',
    gog: 'bg-[#86328a] text-white',
    epic: 'bg-[#313131] text-white',
    xbox: 'bg-[#107c10] text-white',
    playstation: 'bg-[#003791] text-white',
    nintendo: 'bg-[#e60012] text-white',
    battlenet: 'bg-[#00ceff] text-black',
    rockstar: 'bg-[#fcaf17] text-black',
};

// ============================================================================
// COMPACT TRENDING CARD
// ============================================================================

interface TrendingCardProps {
    product: TrendingProduct;
    rank: number;
    accentColor: string;
    onAddToCart: (product: TrendingProduct) => void;
    onToggleWishlist: (productId: string, isInWishlist: boolean) => void;
}

function TrendingCard({ product, rank, accentColor, onAddToCart, onToggleWishlist }: TrendingCardProps): React.ReactElement {
    const [imageError, setImageError] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Wishlist state
    const { data: wishlistData } = useCheckWatchlist(product.id);
    const isInWishlist = wishlistData?.isInWatchlist ?? false;

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAddingToCart) return;
        setIsAddingToCart(true);
        onAddToCart(product);
        setTimeout(() => setIsAddingToCart(false), 1500);
    }, [product, onAddToCart, isAddingToCart]);

    const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleWishlist(product.id, isInWishlist);
    }, [product.id, isInWishlist, onToggleWishlist]);

    const isTopThree = rank <= 3;
    const hasDiscount = product.discount != null && product.discount > 0;
    const hasImage = product.image !== undefined && product.image !== '' && !imageError;
    const platformKey = product.platform?.toLowerCase() ?? 'other';

    // Rank badge colors
    const getRankBadgeClass = () => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black';
        if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black';
        if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-orange-700 text-white';
        return 'bg-bg-tertiary/90 backdrop-blur-sm text-text-primary';
    };

    // Accent hover color class
    const getHoverClass = () => {
        if (accentColor === 'orange-warning') return 'hover:border-orange-warning/40 hover:shadow-[0_0_20px_rgba(251,146,60,0.15)]';
        if (accentColor === 'purple-neon') return 'hover:border-purple-neon/40 hover:shadow-[0_0_20px_rgba(157,78,221,0.15)]';
        return 'hover:border-cyan-glow/40 hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]';
    };

    return (
        <div
            className={cn(
                'group flex flex-col rounded-xl overflow-hidden bg-bg-secondary border border-border-subtle',
                'transition-all duration-300 hover:-translate-y-1',
                getHoverClass()
            )}
        >
            {/* Clickable Link Area */}
            <Link
                href={`/product/${product.slug}`}
                className="flex flex-col flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-inset"
            >
                {/* Image Container */}
                <div className="relative aspect-16/10 overflow-hidden bg-bg-tertiary">
                    {hasImage ? (
                        <Image
                            src={product.image ?? ''}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
                            className="object-contain transition-transform duration-500 group-hover:scale-110"
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-8 w-8 text-text-muted" aria-hidden="true" />
                        </div>
                    )}

                    {/* Top badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                        <div className="flex flex-wrap gap-1">
                            {/* Rank Badge */}
                            <div className={cn(
                                'flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold text-[10px] shadow-lg',
                                getRankBadgeClass()
                            )}>
                                {isTopThree && <Flame className="w-2.5 h-2.5" />}
                                #{rank}
                            </div>
                            {/* Discount Badge */}
                            {hasDiscount && (
                                <Badge className="bg-green-success text-bg-primary border-0 text-[10px] font-bold px-1.5 py-0.5">
                                    -{product.discount}%
                                </Badge>
                            )}
                        </div>

                        {/* Wishlist button */}
                        <button
                            onClick={handleToggleWishlist}
                            className={cn(
                                'rounded-full bg-bg-primary/80 p-1.5 backdrop-blur-sm transition-all hover:scale-110',
                                isInWishlist ? 'text-pink-featured' : 'text-white opacity-0 group-hover:opacity-100'
                            )}
                            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            <Heart className={cn('h-3.5 w-3.5', isInWishlist && 'fill-current')} />
                        </button>
                    </div>

                    {/* Instant delivery badge */}
                    <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="glass text-[9px] px-1.5 py-0.5">
                            <Zap className="h-2.5 w-2.5 mr-0.5 text-green-success" />
                            Instant
                        </Badge>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-3">
                    {/* Platform & Category */}
                    <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
                        {product.platform !== undefined && (
                            <Badge
                                className={cn(
                                    'text-[9px] px-1.5 py-0 uppercase tracking-wider border-0',
                                    platformColors[platformKey] ?? 'bg-bg-tertiary text-text-secondary'
                                )}
                            >
                                {product.platform}
                            </Badge>
                        )}
                        {product.category !== undefined && (
                            <span className="text-[10px] text-text-muted capitalize">{product.category}</span>
                        )}
                    </div>

                    {/* Title with Tooltip */}
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <h3 className="mb-1.5 text-sm font-medium text-text-primary line-clamp-2 min-h-10 group-hover:text-cyan-glow transition-colors cursor-default">
                                    {product.name}
                                </h3>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs bg-bg-tertiary border-border-accent text-text-primary">
                                {product.name}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Rating */}
                    <div className="mb-2 flex items-center gap-1">
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-bg-tertiary/50">
                            <Star className="h-3 w-3 fill-orange-warning text-orange-warning" />
                            <span className="text-xs font-semibold text-text-primary tabular-nums">
                                {product.rating !== undefined ? product.rating.toFixed(1) : '4.8'}
                            </span>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="mt-auto flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-text-primary">
                            {formatPrice(product.price)}
                        </span>
                        {hasDiscount && product.originalPrice !== undefined && (
                            <span className="text-xs text-text-muted line-through">
                                {formatPrice(product.originalPrice)}
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Action Buttons */}
            <div className="px-2.5 pb-2.5 pt-1.5 border-t border-border-subtle flex gap-1.5">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="flex-1 h-8 text-xs font-medium border-border-accent bg-bg-tertiary/50 text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/60"
                >
                    <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                    Cart
                </Button>
                <Button
                    size="sm"
                    asChild
                    className="flex-1 h-8 text-xs font-semibold bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90"
                >
                    <Link href={`/product/${product.slug}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                    </Link>
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// CAROUSEL SKELETON
// ============================================================================

function CarouselSkeleton(): React.ReactElement {
    return (
        <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-56 sm:w-64 md:w-72 shrink-0 rounded-xl bg-bg-secondary border border-border-subtle overflow-hidden">
                    <Skeleton className="aspect-16/10" />
                    <div className="p-3 space-y-2">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// SINGLE CAROUSEL COMPONENT
// ============================================================================

interface TrendingCarouselProps {
    config: CarouselConfig;
    products: TrendingProduct[];
    onAddToCart: (product: TrendingProduct) => void;
    onToggleWishlist: (productId: string, isInWishlist: boolean) => void;
    isLoading: boolean;
}

function TrendingCarousel({ config, products, onAddToCart, onToggleWishlist, isLoading }: TrendingCarouselProps): React.ReactElement {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [activeSegment, setActiveSegment] = useState(0);
    const [totalSegments, setTotalSegments] = useState(1);
    const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);

    const IconComponent = config.icon;

    // Check scroll state
    const checkScrollState = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container === null) return;

        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(
            container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );

        // Calculate segments
        const cardWidth = 288; // ~18rem card width + gap
        const visibleCards = Math.floor(container.clientWidth / cardWidth);
        const segments = Math.max(1, Math.ceil(products.length / Math.max(1, visibleCards)));
        setTotalSegments(segments);

        // Calculate active segment
        const scrollProgress = container.scrollLeft / Math.max(1, container.scrollWidth - container.clientWidth);
        const currentSegment = Math.min(segments - 1, Math.floor(scrollProgress * segments));
        setActiveSegment(Number.isNaN(currentSegment) ? 0 : currentSegment);
    }, [products.length]);

    // Initialize scroll state
    useEffect(() => {
        checkScrollState();
        window.addEventListener('resize', checkScrollState);
        return () => window.removeEventListener('resize', checkScrollState);
    }, [checkScrollState, products]);

    // Scroll function
    const scroll = useCallback((direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (container === null) return;

        const cardWidth = 288;
        const scrollAmount = direction === 'left' ? -cardWidth * 3 : cardWidth * 3;
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
        if (isAutoScrollPaused || products.length === 0) return;

        const intervalId = setInterval(() => {
            const container = scrollContainerRef.current;
            if (container === null) return;

const cardWidth = 288;
            const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;

            if (isAtEnd) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: cardWidth * 2, behavior: 'smooth' });
            }
        }, 15000);

        return () => clearInterval(intervalId);
    }, [isAutoScrollPaused, products.length]);

    if (products.length === 0 && !isLoading) return <></>;

    return (
        <div className="space-y-4">
            {/* Carousel Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shadow-card-sm', config.iconBg)}>
                        <IconComponent className={cn('h-4 w-4', config.iconColor)} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-text-primary">{config.title}</h3>
                        <p className="text-xs text-text-muted">{config.subtitle}</p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className="h-7 w-7 rounded-full border-border-subtle bg-bg-tertiary disabled:opacity-30"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className="h-7 w-7 rounded-full border-border-subtle bg-bg-tertiary disabled:opacity-30"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Carousel */}
            <div
                className="relative"
                onMouseEnter={() => setIsAutoScrollPaused(true)}
                onMouseLeave={() => setIsAutoScrollPaused(false)}
            >
                {/* Gradient fades */}
                <div className={cn(
                    'pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-6 bg-linear-to-r from-bg-primary to-transparent transition-opacity',
                    canScrollLeft ? 'opacity-100' : 'opacity-0'
                )} />
                <div className={cn(
                    'pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-6 bg-linear-to-l from-bg-primary to-transparent transition-opacity',
                    canScrollRight ? 'opacity-100' : 'opacity-0'
                )} />

                {/* Products */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScrollState}
                    className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden scroll-smooth snap-x snap-mandatory -mx-1 px-1"
                >
                    {isLoading ? (
                        <CarouselSkeleton />
                    ) : (
                        products.map((product, index) => (
                            <div key={product.id} className="w-56 sm:w-64 md:w-72 shrink-0 snap-start">
                                <TrendingCard
                                    product={product}
                                    rank={config.startIndex + index + 1}
                                    accentColor={config.accentColor}
                                    onAddToCart={onAddToCart}
                                    onToggleWishlist={onToggleWishlist}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Segment Progress */}
            {!isLoading && products.length > 0 && totalSegments > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                    {Array.from({ length: totalSegments }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToSegment(index)}
                            className={cn(
                                'h-1 rounded-full transition-all duration-300',
                                index === activeSegment
                                    ? 'w-5'
                                    : 'w-1.5 bg-border-accent hover:bg-text-muted'
                            )}
                            style={{
                                backgroundColor: index === activeSegment
                                    ? (config.accentColor === 'orange-warning' ? '#ff6b00' :
                                        config.accentColor === 'purple-neon' ? '#9d4edd' : '#00d9ff')
                                    : undefined
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

export function TrendingNowGrid(): React.ReactElement {
    const { addItem } = useCart();
    const { isAuthenticated } = useAuth();
    const { mutate: addToWatchlist } = useAddToWatchlist();
    const { mutate: removeFromWatchlist } = useRemoveFromWatchlist();

    // Fetch trending products
    const { data: trendingData, isLoading, error } = useQuery<ProductListResponseDto>({
        queryKey: ['homepage', 'section', 'trending'],
        queryFn: () => catalogApi.catalogControllerGetProductsBySection({ sectionKey: 'trending', limit: TOTAL_PRODUCTS }),
        staleTime: 2 * 60 * 1000,
    });

    // Transform API response
    const trendingProducts: TrendingProduct[] = useMemo(() => {
        if (trendingData?.data == null) return [];
        return trendingData.data.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.title,
            price: p.price,
            currency: p.currency ?? 'EUR',
            image: p.imageUrl ?? undefined,
            platform: p.platform ?? undefined,
            category: p.category ?? undefined,
            rating: p.metacriticScore != null ? p.metacriticScore / 20 : undefined,
        }));
    }, [trendingData]);

    // Split products into 3 groups
    const productGroups = useMemo(() => {
        return CAROUSEL_CONFIGS.map((config) => ({
            config,
            products: trendingProducts.slice(config.startIndex, config.endIndex),
        }));
    }, [trendingProducts]);

    // Handle Add to Cart
    const handleAddToCart = useCallback((product: TrendingProduct) => {
        addItem({
            productId: product.id,
            title: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            image: product.image,
            platform: product.platform,
        });
        toast.success(`${product.name} added to cart`);
    }, [addItem]);

    // Handle Wishlist Toggle
    const handleToggleWishlist = useCallback((productId: string, isInWishlist: boolean) => {
        if (!isAuthenticated) {
            toast.error('Please login to add items to your wishlist', {
                action: { label: 'Login', onClick: () => { window.location.href = '/auth/login'; } },
            });
            return;
        }

        if (isInWishlist) {
            removeFromWatchlist(productId, { onError: () => toast.error('Failed to remove from wishlist') });
        } else {
            addToWatchlist(productId, { onError: () => toast.error('Failed to add to wishlist') });
        }
    }, [isAuthenticated, addToWatchlist, removeFromWatchlist]);

    // Don't render on error
    if (error !== null && error !== undefined) {
        return <></>;
    }

    return (
        <section className="py-12 md:py-16 bg-bg-primary relative">
            {/* Top gradient line */}
            <div
                className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-warning/30 to-transparent"
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 md:px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-linear-to-br from-orange-warning/20 to-pink-featured/20 border border-orange-warning/30">
                            <TrendingUp className="w-5 h-5 text-orange-warning" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-display font-bold text-text-primary flex items-center gap-2">
                                Trending Now
                                <Badge className="bg-linear-to-r from-orange-warning to-pink-featured text-white border-0 text-[10px]">
                                    POPULAR
                                </Badge>
                            </h2>
                            <p className="text-sm text-text-muted mt-0.5">
                                Most popular games this week based on sales
                            </p>
                        </div>
                    </div>

                    <Button asChild variant="outline" size="sm" className="group">
                        <Link href="/catalog?sort=rating">
                            View All Trending
                            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </motion.div>

                {/* 3 Carousels */}
                <div className="space-y-8">
                    {productGroups.map(({ config, products }, index) => (
                        <motion.div
                            key={config.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <TrendingCarousel
                                config={config}
                                products={products}
                                onAddToCart={handleAddToCart}
                                onToggleWishlist={handleToggleWishlist}
                                isLoading={isLoading}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default TrendingNowGrid;
