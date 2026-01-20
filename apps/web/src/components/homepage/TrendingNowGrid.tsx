'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi, Configuration } from '@bitloot/sdk';
import type { ProductListResponseDto } from '@bitloot/sdk';

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
} from 'lucide-react';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { useCart } from '@/context/CartContext';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TrendingProduct {
    id: string;
    slug: string;
    name: string;
    price: string;
    currency: string;
    image?: string;
    platform?: string;
    rating?: number;
    salesCount?: number;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function TrendingGridSkeleton(): React.ReactElement {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden bg-bg-secondary border-border-subtle">
                    <Skeleton className="aspect-[3/4]" />
                    <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between items-center pt-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

interface TrendingProductCardProps {
    product: TrendingProduct;
    rank: number;
    onAddToCart: (product: TrendingProduct) => void;
}

function TrendingProductCard({ product, rank, onAddToCart }: TrendingProductCardProps): React.ReactElement {
    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart(product);
    }, [product, onAddToCart]);

    const isTopThree = rank <= 3;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: Math.min(rank * 0.05, 0.4) }}
        >
            <Link href={`/product/${product.slug}`} className="block group">
                <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <Card className={`relative overflow-hidden bg-bg-secondary border-border-subtle transition-all duration-300 ${
                        isTopThree 
                            ? 'group-hover:border-orange-warning/50 group-hover:shadow-[0_0_20px_rgba(251,146,60,0.2)]' 
                            : 'group-hover:border-cyan-glow/50 group-hover:shadow-glow-cyan'
                    }`}>
                        {/* Product Image */}
                        <div className="relative aspect-[3/4] overflow-hidden">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{ backgroundImage: `url(${product.image ?? '/placeholder-game.jpg'})` }}
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />

                            {/* Rank Badge */}
                            <div className="absolute top-3 left-3">
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-sm shadow-lg ${
                                    rank === 1 
                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black' 
                                        : rank === 2 
                                        ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black'
                                        : rank === 3 
                                        ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white'
                                        : 'bg-bg-tertiary/90 backdrop-blur-sm text-text-primary border border-border-subtle'
                                }`}>
                                    {isTopThree && <Flame className="w-3.5 h-3.5" />}
                                    #{rank}
                                </div>
                            </div>

                            {/* Platform Badge */}
                            {product.platform !== undefined && (
                                <Badge className="absolute top-3 right-3 bg-purple-neon/90 text-white border-0 text-xs px-2 py-0.5 shadow-glow-purple-sm">
                                    {product.platform}
                                </Badge>
                            )}

                            {/* Product Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 drop-shadow-lg group-hover:text-cyan-glow transition-colors">
                                    {product.name}
                                </h3>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-lg font-bold text-cyan-glow drop-shadow-lg">
                                        €{product.price}
                                    </span>
                                    {product.rating !== undefined && (
                                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                                            <Star className="w-3 h-3 fill-current" />
                                            {product.rating.toFixed(1)}
                                        </span>
                                    )}
                                </div>

                                {/* Sales indicator (mock for now) */}
                                {isTopThree && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-orange-400">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>Hot this week</span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Add Button */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ scale: 1.1 }}
                                className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                                <Button
                                    size="icon"
                                    className="h-10 w-10 rounded-full bg-cyan-glow hover:bg-cyan-400 text-bg-primary shadow-glow-cyan-sm"
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        </div>
                    </Card>
                </motion.div>
            </Link>
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TrendingNowGrid(): React.ReactElement {
    const { addItem } = useCart();

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
    }, [addItem]);

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
