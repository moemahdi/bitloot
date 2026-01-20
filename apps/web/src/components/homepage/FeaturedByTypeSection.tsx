'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi, Configuration } from '@bitloot/sdk';
import type { ProductListResponseDto } from '@bitloot/sdk';

// API Configuration
const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});
const catalogApi = new CatalogApi(apiConfig);
import {
    Gamepad2,
    Monitor,
    CreditCard,
    Repeat,
    Sparkles,
    ArrowRight,
    Package,
    Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Tabs, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Skeleton } from '@/design-system/primitives/skeleton';

// Components
import { ProductCard } from '@/features/catalog/components/ProductCard';
import type { Product } from '@/features/catalog/components/ProductCard';
import { useCart } from '@/context/CartContext';

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
        id: 'featured_gift_cards', 
        label: 'Gift Cards', 
        icon: CreditCard, 
        category: 'gift-cards',
        color: 'green',
        description: 'Steam, PSN, Xbox, Nintendo & more'
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

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ProductGridSkeleton(): React.ReactElement {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden bg-bg-secondary border-border-subtle">
                    <Skeleton className="aspect-[3/4]" />
                    <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex justify-between items-center pt-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </CardContent>
                </Card>
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
    const router = useRouter();
    const { addItem } = useCart();

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
            limit: 12 
        }),
        staleTime: 2 * 60 * 1000, // 2 minutes to pick up admin changes quickly
    });

    // Transform API response to ProductCard format
    const products: Product[] = useMemo(() => {
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
        <section className="py-20 bg-bg-primary relative">
            {/* Subtle background gradient */}
            <div
                className="absolute inset-0 bg-linear-to-b from-transparent via-purple-neon/2 to-transparent pointer-events-none"
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
                        Featured
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        Shop by Category
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        {currentTab.description}
                    </p>
                </motion.div>

                {/* Product Type Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <div className="flex justify-center mb-10">
                        <TabsList className="inline-flex p-1.5 bg-bg-secondary/50 border border-border-subtle rounded-2xl backdrop-blur-sm gap-1">
                            {PRODUCT_TYPE_TABS.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${getTabColorClasses(tab.id, activeTab === tab.id)}`}
                                >
                                    <tab.icon className="w-4 h-4" aria-hidden="true" />
                                    <span>{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

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
