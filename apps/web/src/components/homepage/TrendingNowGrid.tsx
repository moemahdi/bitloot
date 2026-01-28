'use client';

import { useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
    TrendingUp,
    Star,
    ShoppingCart,
    Flame,
    ArrowRight,
    Heart,
    Eye,
} from 'lucide-react';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Skeleton } from '@/design-system/primitives/skeleton';
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

// ============================================================================
// LOADING SKELETON
// ============================================================================

function TrendingGridSkeleton(): React.ReactElement {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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

// Platform badge component
function PlatformBadge({ platform }: { platform: string }): React.ReactElement {
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
    const colorClass = platformColors[platform.toLowerCase()] ?? 'bg-bg-tertiary text-text-secondary';
    return (
        <Badge className={`text-[10px] px-1.5 py-0.5 font-medium uppercase tracking-wider border-0 ${colorClass}`}>
            {platform}
        </Badge>
    );
}

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

interface TrendingProductCardProps {
    product: TrendingProduct;
    rank: number;
    onAddToCart: (product: TrendingProduct) => void;
    onToggleWishlist: (productId: string, isInWishlist: boolean) => void;
}

function TrendingProductCard({ product, rank, onAddToCart, onToggleWishlist }: TrendingProductCardProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Wishlist state
    const { data: wishlistData } = useCheckWatchlist(product.id);
    const isInWishlist = wishlistData?.isInWatchlist ?? false;

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAddingToCart(true);
        onAddToCart(product);
        setTimeout(() => setIsAddingToCart(false), 1000);
    }, [product, onAddToCart]);

    const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleWishlist(product.id, isInWishlist);
    }, [product.id, isInWishlist, onToggleWishlist]);

    const isTopThree = rank <= 3;
    const hasDiscount = product.discount != null && product.discount > 0;

    // Rank badge colors
    const getRankBadgeClass = () => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black';
        if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black';
        if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-orange-700 text-white';
        return 'bg-bg-tertiary/90 backdrop-blur-sm text-text-primary border border-border-subtle';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: Math.min(rank * 0.05, 0.4) }}
        >
            <Link
                href={`/product/${product.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary transition-all duration-300 hover:border-orange-warning/40 hover:shadow-[0_0_25px_rgba(251,146,60,0.15)] hover:-translate-y-1"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image container - 16/10 aspect ratio like CatalogProductCard */}
                <div className="relative aspect-[16/10] overflow-hidden bg-bg-tertiary">
                    {/* Loading skeleton */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-bg-tertiary" />
                    )}
                    
                    {/* Product image */}
                    <Image
                        src={product.image && product.image.length > 0 ? product.image : '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isHovered ? 'scale-110' : ''}`}
                        onLoad={() => setImageLoaded(true)}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                    
                    {/* Top badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                        <div className="flex flex-wrap gap-1.5">
                            {/* Rank Badge */}
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs shadow-lg ${getRankBadgeClass()}`}>
                                {isTopThree && <Flame className="w-3 h-3" />}
                                #{rank}
                            </div>
                            {/* Discount Badge */}
                            {hasDiscount && (
                                <Badge className="bg-green-success text-bg-primary border-0 text-xs font-bold px-2 py-0.5">
                                    -{product.discount}%
                                </Badge>
                            )}
                        </div>
                        
                        {/* Wishlist button */}
                        <button
                            onClick={handleToggleWishlist}
                            className={`rounded-full bg-bg-primary/80 p-2 backdrop-blur-sm transition-all hover:bg-bg-primary hover:scale-110 ${isInWishlist ? 'text-pink-featured' : 'text-white'} ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                    
                    {/* Trending indicator for top 3 */}
                    {isTopThree && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-orange-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Hot this week
                        </div>
                    )}
                </div>
                
                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                    {/* Platform and category */}
                    <div className="mb-2 flex items-center gap-2">
                        {product.platform !== undefined && <PlatformBadge platform={product.platform} />}
                        {product.category !== undefined && (
                            <span className="text-xs text-text-muted capitalize">{product.category}</span>
                        )}
                    </div>
                    
                    {/* Title */}
                    <h3 className="mb-2 text-sm font-medium text-white line-clamp-2 group-hover:text-cyan-glow transition-colors min-h-[2.25rem]">
                        {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="mb-3 flex items-center gap-1.5">
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-tertiary/50">
                            <Star className="h-3 w-3 fill-orange-warning text-orange-warning" aria-hidden="true" />
                            <span className="text-xs font-semibold text-text-primary tabular-nums">
                                {product.rating !== undefined ? product.rating.toFixed(1) : '4.8'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Price and action */}
                    <div className="mt-auto pt-2 border-t border-border-subtle">
                        <div className="flex flex-col mb-3">
                            <span className="text-lg font-bold text-white">
                                {formatPrice(product.price)}
                            </span>
                            {hasDiscount && product.originalPrice !== undefined && (
                                <span className="text-xs text-text-muted line-through">
                                    {formatPrice(product.originalPrice)}
                                </span>
                            )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleAddToCart}
                                disabled={isAddingToCart}
                                className="flex-1 h-8 text-xs font-medium border-border-accent bg-bg-tertiary/50 text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/60 hover:bg-bg-tertiary hover:shadow-glow-cyan-sm transition-all duration-200"
                                aria-label={`Add ${product.name} to cart`}
                            >
                                <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                                Cart
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 h-8 text-xs font-semibold bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan active:scale-[0.98] transition-all duration-200"
                                aria-label={`View ${product.name} details`}
                            >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                            </Button>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
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

    // Fetch trending products from admin-configured 'trending' section
    const { data: trendingData, isLoading, error } = useQuery<ProductListResponseDto>({
        queryKey: ['homepage', 'section', 'trending'],
        queryFn: () => catalogApi.catalogControllerGetProductsBySection({ sectionKey: 'trending', limit: 12 }),
        staleTime: 2 * 60 * 1000, // 2 minutes to pick up admin changes quickly
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

    // Handle Add to Cart
    const handleAddToCart = useCallback((product: TrendingProduct) => {
        addItem({
            productId: product.id,
            title: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            image: product.image,
        });
        toast.success(`${product.name} added to cart`);
    }, [addItem]);

    // Handle Wishlist Toggle
    const handleToggleWishlist = useCallback((productId: string, isInWishlist: boolean) => {
        if (!isAuthenticated) {
            toast.error('Please login to add items to your wishlist', {
                action: {
                    label: 'Login',
                    onClick: () => { window.location.href = '/auth/login'; },
                },
            });
            return;
        }

        if (isInWishlist) {
            removeFromWatchlist(productId, {
                onError: () => toast.error('Failed to remove from wishlist'),
            });
        } else {
            addToWatchlist(productId, {
                onError: () => toast.error('Failed to add to wishlist'),
            });
        }
    }, [isAuthenticated, addToWatchlist, removeFromWatchlist]);

    // Don't render if error or no products
    if (error !== null && error !== undefined) {
        return <></>;
    }

    return (
        <section className="py-16 bg-bg-primary relative">
            {/* Subtle top gradient */}
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
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-warning/20 to-pink-featured/20 border border-orange-warning/30">
                            <TrendingUp className="w-6 h-6 text-orange-warning" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-display font-bold text-text-primary flex items-center gap-3">
                                Trending Now
                                <Badge className="bg-gradient-to-r from-orange-warning to-pink-featured text-white border-0 text-xs">
                                    POPULAR
                                </Badge>
                            </h2>
                            <p className="text-sm text-text-muted mt-1">
                                Most popular games this week based on sales
                            </p>
                        </div>
                    </div>

                    <Button asChild variant="outline" className="group">
                        <Link href="/catalog?sort=rating">
                            View All Trending
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </motion.div>

                {/* Products Grid */}
                {isLoading ? (
                    <TrendingGridSkeleton />
                ) : trendingProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {trendingProducts.map((product, index) => (
                            <TrendingProductCard
                                key={product.id}
                                product={product}
                                rank={index + 1}
                                onAddToCart={handleAddToCart}
                                onToggleWishlist={handleToggleWishlist}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-text-muted">No trending products available right now.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default TrendingNowGrid;
