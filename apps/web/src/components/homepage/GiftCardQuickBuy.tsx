'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Gift,
    ShoppingCart,
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

// Use the same ProductCard as catalog for consistency
import { ProductCard } from '@/features/catalog/components/ProductCard';
import type { Product } from '@/features/catalog/components/ProductCard';

// ============================================================================
// API CONFIGURATION
// ============================================================================

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

const catalogApi = new CatalogApi(apiConfig);

// ============================================================================
// LOADING SKELETON
// ============================================================================

function GiftCardSkeleton(): React.ReactElement {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i} className="h-full bg-bg-secondary border-border-subtle animate-pulse overflow-hidden">
                    <div className="aspect-4/3 bg-bg-tertiary" />
                    <CardContent className="p-4">
                        <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-3" />
                        <div className="flex items-center justify-between">
                            <div className="h-5 bg-bg-tertiary rounded w-16" />
                            <div className="h-8 bg-bg-tertiary rounded w-20" />
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
    const router = useRouter();

    // Fetch gift card products from quick_buy_gift_cards section
    const { data: productsData, isLoading, error } = useQuery({
        queryKey: ['homepage-quick-buy-gift-cards'],
        queryFn: () => catalogApi.catalogControllerGetProductsBySection({
            sectionKey: 'quick_buy_gift_cards',
            limit: 8,
        }),
        staleTime: 2 * 60 * 1000, // 2 minutes - pick up admin changes quickly
    });

    // Transform API response to ProductCard format
    const products: Product[] = useMemo(() => {
        if (productsData?.data == null) return [];
        return productsData.data.map((p: ProductResponseDto) => ({
            id: p.id,
            slug: p.slug,
            name: p.title,
            description: p.description ?? '',
            price: p.price,
            currency: p.currency ?? 'EUR',
            image: p.imageUrl ?? undefined,
            platform: p.platform ?? undefined,
            isAvailable: p.isPublished,
            rating: p.metacriticScore != null ? p.metacriticScore / 20 : undefined,
        }));
    }, [productsData]);

    // Handle Add to Cart
    const handleAddToCart = useCallback((product: Product) => {
        addItem({
            productId: product.id,
            title: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            image: product.image,
        });
    }, [addItem]);

    // Handle Buy Now
    const handleBuyNow = useCallback((product: Product) => {
        addItem({
            productId: product.id,
            title: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            image: product.image,
        });
        router.push('/checkout');
    }, [addItem, router]);

    // Don't render section if no products assigned
    if (!isLoading && products.length === 0) {
        return <></>;
    }

    return (
        <section className="py-20 bg-bg-primary relative overflow-hidden">
            {/* Background effects */}
            <div
                className="absolute inset-0 bg-linear-to-b from-transparent via-green-success/3 to-transparent pointer-events-none"
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

                {/* Gift Card Grid - Using consistent ProductCard */}
                {isLoading ? (
                    <GiftCardSkeleton />
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="w-12 h-12 text-orange-warning mb-4" />
                        <p className="text-text-secondary">Unable to load gift cards</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddToCart}
                                onBuyNow={handleBuyNow}
                                isAboveFold={index < 4}
                            />
                        ))}
                    </div>
                )}

                {/* Info Banner */}
                {products.length > 0 && (
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
