'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Gift,
    ShoppingCart,
    Check,
    Zap,
    AlertCircle,
} from 'lucide-react';

// Design System Components
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent } from '@/design-system/primitives/card';
import { useCart } from '@/context/CartContext';
import { Configuration, CatalogApi } from '@bitloot/sdk';
import type { ProductResponseDto } from '@bitloot/sdk';

// ============================================================================
// API CONFIGURATION
// ============================================================================

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

const catalogApi = new CatalogApi(apiConfig);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface GiftCardProduct {
    id: string;
    title: string;
    slug: string;
    price: number;
    imageUrl?: string;
    platform?: string;
    platformColor: string;
}

const DEFAULT_COLOR = '#6366f1';

// Platform color mapping for styling
const PLATFORM_COLORS: Record<string, string> = {
    'steam': '#1b2838',
    'playstation': '#003791',
    'psn': '#003791',
    'xbox': '#107c10',
    'nintendo': '#e60012',
    'spotify': '#1db954',
    'netflix': '#e50914',
    'google play': '#01875f',
    'apple': '#555555',
    'amazon': '#ff9900',
};

function getPlatformColor(platform?: string): string {
    if (!platform) return DEFAULT_COLOR;
    const lowerPlatform = platform.toLowerCase();
    for (const [key, color] of Object.entries(PLATFORM_COLORS)) {
        if (lowerPlatform.includes(key)) {
            return color;
        }
    }
    return DEFAULT_COLOR;
}

// ============================================================================
// GIFT CARD PRODUCT CARD
// ============================================================================

interface GiftCardProductCardProps {
    product: GiftCardProduct;
    onAddToCart: (product: GiftCardProduct) => void;
    isAdded: boolean;
}

function GiftCardProductCard({ product, onAddToCart, isAdded }: GiftCardProductCardProps): React.ReactElement {
    const [imageError, setImageError] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
        >
            <Card className="h-full bg-bg-secondary border-border-subtle hover:border-cyan-glow/30 transition-all duration-300 overflow-hidden group">
                <CardContent className="p-5">
                    {/* Product Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div 
                            className="flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-105 overflow-hidden"
                            style={{ backgroundColor: `${product.platformColor}20` }}
                        >
                            {product.imageUrl && !imageError ? (
                                <Image
                                    src={product.imageUrl}
                                    alt={product.title}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <Gift className="w-6 h-6 text-text-muted" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-text-primary text-sm truncate">{product.title}</h3>
                            {product.platform && (
                                <p className="text-xs text-text-muted">{product.platform}</p>
                            )}
                        </div>
                    </div>

                    {/* Price & Add Button */}
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-lg font-bold text-text-primary">
                            €{product.price.toFixed(2)}
                        </span>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onAddToCart(product)}
                            disabled={isAdded}
                            className={`flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                                isAdded
                                    ? 'bg-green-success/20 text-green-success border border-green-success/40'
                                    : 'bg-cyan-glow text-bg-primary hover:shadow-glow-cyan-sm'
                            }`}
                        >
                            {isAdded ? (
                                <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Added
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="w-4 h-4 mr-1" />
                                    Add
                                </>
                            )}
                        </motion.button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function GiftCardSkeleton(): React.ReactElement {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-full bg-bg-secondary border-border-subtle animate-pulse">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-bg-tertiary" />
                            <div className="flex-1">
                                <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-2" />
                                <div className="h-3 bg-bg-tertiary rounded w-1/2" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="h-6 bg-bg-tertiary rounded w-16" />
                            <div className="h-9 bg-bg-tertiary rounded w-20" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GiftCardQuickBuy(): React.ReactElement {
    const { addItem } = useCart();
    const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

    // Fetch gift card products from quick_buy_gift_cards section
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['homepage-quick-buy-gift-cards'],
        queryFn: async (): Promise<GiftCardProduct[]> => {
            const response = await catalogApi.catalogControllerGetProductsBySection({
                sectionKey: 'quick_buy_gift_cards',
                limit: 6,
            });
            
            return response.data.map((p: ProductResponseDto) => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                price: parseFloat(p.price),
                imageUrl: p.imageUrl,
                platform: p.platform,
                platformColor: getPlatformColor(p.platform),
            }));
        },
        staleTime: 2 * 60 * 1000, // 2 minutes - pick up admin changes quickly
    });

    const handleAddToCart = useCallback((product: GiftCardProduct) => {
        // Add to cart
        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: 1,
            image: product.imageUrl,
        });

        // Mark as added (temporary visual feedback)
        setAddedItems((prev) => new Set(prev).add(product.id));

        // Remove the "added" state after 2 seconds
        setTimeout(() => {
            setAddedItems((prev) => {
                const next = new Set(prev);
                next.delete(product.id);
                return next;
            });
        }, 2000);
    }, [addItem]);

    // Don't render section if no products assigned
    if (!isLoading && (!products || products.length === 0)) {
        return <></>;
    }

    return (
        <section className="py-20 bg-bg-primary relative overflow-hidden">
            {/* Background effects */}
            <div
                className="absolute inset-0 bg-linear-to-b from-transparent via-green-success/2 to-transparent pointer-events-none"
                aria-hidden="true"
            />
            <div
                className="absolute top-1/2 left-1/4 w-96 h-96 bg-green-success/5 rounded-full blur-[120px] -translate-y-1/2"
                aria-hidden="true"
            />
            <div
                className="absolute top-1/2 right-1/4 w-80 h-80 bg-cyan-glow/5 rounded-full blur-[100px] -translate-y-1/2"
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
                        className="mb-4 px-3 py-1 bg-green-success/10 border border-green-success/30 text-green-success"
                    >
                        <Zap className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                        Quick Buy
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        Gift Cards - Instant Delivery
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        Pick your gift card and checkout in seconds.
                        Perfect for gifting or topping up your account.
                    </p>
                </motion.div>

                {/* Gift Card Grid */}
                {isLoading ? (
                    <GiftCardSkeleton />
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="w-12 h-12 text-orange-warning mb-4" />
                        <p className="text-text-secondary">Unable to load gift cards</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products?.map((product) => (
                            <GiftCardProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddToCart}
                                isAdded={addedItems.has(product.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Info Banner */}
                {products && products.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-12"
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6 rounded-2xl bg-bg-secondary/50 border border-border-subtle">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-glow/10 border border-cyan-glow/30">
                                    <ShoppingCart className="w-6 h-6 text-cyan-glow" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-text-primary">Add multiple cards at once</p>
                                    <p className="text-sm text-text-muted">Mix products, checkout when ready</p>
                                </div>
                            </div>
                            <Button asChild className="btn-primary">
                                <Link href="/checkout">
                                    View Cart
                                    <ShoppingCart className="ml-2 w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
}

export default GiftCardQuickBuy;
