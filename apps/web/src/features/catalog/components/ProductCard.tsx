'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Eye, ShoppingCart, Star, Zap, Package, Sparkles, Gamepad2 } from 'lucide-react';

// Currency symbol helper
function getCurrencySymbol(currency?: string): string {
  switch (currency?.toUpperCase()) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'USD': return '$';
    case 'JPY': return '¥';
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    default: return currency ?? '€';
  }
}

export interface Product {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: string;
    currency: string;
    image?: string;
    platform?: string;
    discount?: number;
    stock?: number;
    isAvailable?: boolean;
    rating?: number;
    isFeatured?: boolean;
}

interface ProductCardProps {
    product: Product;
    onQuickView?: (product: Product) => void;
    onAddToCart?: (product: Product) => void;
    onBuyNow?: (product: Product) => void;
    isLoading?: boolean;
    variant?: 'default' | 'featured';
    /** Mark as above-the-fold for LCP optimization (first 4 items) */
    isAboveFold?: boolean;
}

// Skeleton loader for loading state
function ProductCardSkeleton(): React.ReactElement {
    return (
        <Card className="h-full overflow-hidden bg-bg-secondary border border-border-subtle shadow-card-sm">
            <div className="relative aspect-4/3 overflow-hidden">
                <div className="absolute inset-0 skeleton" />
            </div>
            <CardContent className="p-3">
                <div className="h-4 w-3/4 skeleton rounded" />
            </CardContent>
            <CardFooter className="p-3 pt-0 flex flex-col gap-2">
                <div className="flex items-center justify-between w-full">
                    <div className="h-5 w-20 skeleton rounded" />
                    <div className="h-4 w-10 skeleton rounded" />
                </div>
                <div className="flex gap-2 w-full">
                    <div className="h-8 flex-1 skeleton rounded" />
                    <div className="h-8 flex-1 skeleton rounded" />
                </div>
            </CardFooter>
        </Card>
    );
}

export function ProductCard({ 
    product, 
    onQuickView, 
    onAddToCart,
    onBuyNow,
    isLoading = false,
    variant = 'default',
    isAboveFold = false
}: ProductCardProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;
    const isFeatured = variant === 'featured' || product.isFeatured === true;
    // Prioritize image loading for above-fold or featured cards (LCP optimization)
    const shouldPrioritize = isAboveFold === true || isFeatured;
    const rawRating = product.rating ?? 4.8;
    const parsedRating = typeof rawRating === 'number' ? rawRating : parseFloat(String(rawRating));
    const displayRating = Number.isNaN(parsedRating) ? 4.8 : parsedRating;
    
    // Calculate original price if discount exists
    const currentPrice = parseFloat(product.price);
    const currencySymbol = getCurrencySymbol(product.currency);
    const hasDiscount = product.discount !== undefined && product.discount !== null && product.discount > 0;
    const originalPrice = hasDiscount
        ? currentPrice / (1 - (product.discount ?? 0) / 100) 
        : null;

    const handleQuickView = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onQuickView?.(product);
    }, [onQuickView, product]);

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart?.(product);
    }, [onAddToCart, product]);

    const handleBuyNow = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onBuyNow?.(product);
    }, [onBuyNow, product]);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    // Show skeleton during loading
    if (isLoading) {
        return <ProductCardSkeleton />;
    }

    return (
        <motion.div
            whileHover={{ y: -4 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative group h-full"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
            <Card 
                className={`
                    h-full overflow-hidden bg-bg-secondary border shadow-card-sm
                    transition-all duration-250 transition-gaming
                    ${isFeatured === true
                        ? 'border-purple-neon/40 hover:border-purple-neon hover:shadow-glow-purple' 
                        : 'border-border-subtle hover:border-cyan-glow/60 hover:shadow-glow-cyan-sm'
                    }
                    ${isOutOfStock ? 'opacity-60 grayscale-30' : ''}
                `}
            >
                <Link 
                    href={`/product/${product.slug}`} 
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary rounded-t-lg"
                    aria-label={`View ${product.name} - ${currencySymbol}${currentPrice.toFixed(2)}${isOutOfStock ? ' (Out of Stock)' : ''}`}
                >
                    {/* Image Section */}
                    <div className="relative aspect-4/3 overflow-hidden bg-bg-tertiary">
                        {/* Main Image or Fallback */}
                        <div className="relative w-full h-full">
                            {imageError || typeof product.image !== 'string' || product.image.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center bg-bg-tertiary">
                                    <Package className="w-12 h-12 text-text-muted" aria-hidden="true" />
                                </div>
                            ) : (
                                <Image
                                    src={product.image}
                                    alt=""
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className={`
                                        object-cover transition-all duration-300 
                                        group-hover:scale-110 group-hover:brightness-75
                                        ${isOutOfStock ? 'grayscale' : ''}
                                    `}
                                    onError={handleImageError}
                                    priority={shouldPrioritize}
                                    loading={shouldPrioritize ? 'eager' : 'lazy'}
                                />
                            )}
                        </div>

                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-linear-to-t from-cyan-glow/20 via-transparent to-purple-neon/10" />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 z-20 flex items-start justify-between">
                            <div className="flex flex-col gap-1.5">
                                {isFeatured === true && !isOutOfStock && (
                                    <Badge className="badge-featured text-xs font-medium flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                                        Featured
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5 items-end">
                                {product.discount != null && product.discount > 0 && !isOutOfStock && (
                                    <Badge className="bg-green-success border-0 text-bg-primary font-bold text-xs px-1.5">
                                        -{product.discount}%
                                    </Badge>
                                )}
                                {isOutOfStock && (
                                    <Badge variant="destructive" className="text-xs font-medium">
                                        Sold Out
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Bottom Badges - Platform & Instant */}
                        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-end justify-between">
                            {!isOutOfStock && (
                                <Badge variant="secondary" className="glass text-xs px-1.5 py-0.5">
                                    <Zap className="w-2.5 h-2.5 mr-0.5 text-green-success" aria-hidden="true" />
                                    Instant
                                </Badge>
                            )}
                            {product.platform != null && product.platform.length > 0 && (
                                <Badge variant="secondary" className="glass text-xs px-1.5 py-0.5">
                                    <Gamepad2 className="w-2.5 h-2.5 mr-0.5 text-purple-neon" aria-hidden="true" />
                                    {product.platform}
                                </Badge>
                            )}
                        </div>

                        {/* Hover Overlay - Quick View Only */}
                        <AnimatePresence>
                            {isHovered && !isOutOfStock && onQuickView !== undefined && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0 flex items-center justify-center z-30"
                                    aria-hidden="true"
                                >
                                    <Button size="sm" onClick={handleQuickView} className="btn-outline h-9 px-4 backdrop-blur-sm">
                                        <Eye className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                        Quick View
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Content */}
                    <CardContent className="p-3 border-t border-border-subtle/50">
                        <h3 className="text-sm font-semibold text-text-primary line-clamp-1 group-hover:text-cyan-glow transition-colors duration-200">
                            {product.name}
                        </h3>
                    </CardContent>
                </Link>

                {/* Footer - Outside Link for button clicks */}
                <CardFooter className="p-3 pt-0 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-base font-bold crypto-amount ${isOutOfStock ? 'text-text-muted' : 'text-cyan-glow text-glow-cyan'}`}>
                                    {currencySymbol}{currentPrice.toFixed(2)}
                                </span>
                                {originalPrice !== null && !isOutOfStock && (
                                    <span className="text-xs text-text-muted line-through decoration-text-muted/50">
                                        {currencySymbol}{originalPrice.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-tertiary/50">
                                <Star className="w-3 h-3 fill-orange-warning text-orange-warning" aria-hidden="true" />
                                <span className="text-xs font-semibold text-text-primary tabular-nums">{displayRating.toFixed(1)}</span>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        {!isOutOfStock ? (
                            <div className="flex gap-2 w-full">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAddToCart}
                                    className="flex-1 h-8 text-xs font-medium border-border-accent bg-bg-tertiary/50 text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/60 hover:bg-bg-tertiary hover:shadow-glow-cyan-sm transition-all duration-200"
                                    aria-label={`Add ${product.name} to cart`}
                                >
                                    <ShoppingCart className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                                    Cart
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleBuyNow}
                                    className="flex-1 h-8 text-xs font-semibold bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan active:scale-[0.98] transition-all duration-200"
                                    aria-label={`Buy ${product.name} now`}
                                >
                                    <Zap className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                                    Buy Now
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="w-full h-8 text-xs font-medium opacity-50 cursor-not-allowed"
                            >
                                Out of Stock
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </motion.div>
        );
    }
