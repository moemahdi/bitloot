'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Eye, ShoppingCart, Star } from 'lucide-react';

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
}

interface ProductCardProps {
    product: Product;
    onQuickView?: (product: Product) => void;
    onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView, onAddToCart }: ProductCardProps): React.ReactElement {
    const [isHovered, setIsHovered] = useState(false);
    const isOutOfStock = product.stock !== undefined && product.stock <= 0;

    return (
        <motion.div
            whileHover={{ y: -8 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative group h-full"
        >
            <Link href={`/product/${product.slug}`} className="block h-full">
                <Card className="h-full overflow-hidden bg-bg-secondary border-border-subtle hover:border-cyan-glow/50 transition-all duration-300">
                    {/* Image Section with Blur Background */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                        {/* Blurred Background */}
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110"
                            style={{ backgroundImage: `url(${product.image ?? '/placeholder-product.jpg'})` }}
                        />

                        {/* Main Image */}
                        <div className="relative z-10 w-full h-full">
                            <Image
                                src={product.image ?? '/placeholder-product.jpg'}
                                alt={product.name}
                                fill
                                className={`object-cover transition-transform duration-300 group-hover:scale-110 ${isOutOfStock ? 'grayscale' : ''}`}
                            />
                        </div>

                        {/* Badges */}
                        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                            {product.discount !== null && product.discount !== undefined && product.discount > 0 && !isOutOfStock && (
                                <Badge className="bg-pink-featured border-0 text-white font-bold shadow-lg shadow-pink-featured/30">
                                    -{product.discount}%
                                </Badge>
                            )}
                            {isOutOfStock && (
                                <Badge variant="destructive" className="text-sm font-bold shadow-lg">
                                    OUT OF STOCK
                                </Badge>
                            )}
                        </div>

                        {/* Hover Overlay with Actions */}
                        <AnimatePresence>
                            {isHovered && !isOutOfStock && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 z-20"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    {onQuickView !== undefined && (
                                        <GlowButton
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onQuickView(product);
                                            }}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Quick View
                                        </GlowButton>
                                    )}
                                    {onAddToCart !== undefined && (
                                        <GlowButton
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onAddToCart(product);
                                            }}
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                        </GlowButton>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Content */}
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-white line-clamp-2 flex-1 group-hover:text-cyan-glow transition-colors">
                                {product.name}
                            </h3>
                        </div>

                        <p className="text-sm text-text-muted mb-3 line-clamp-2">
                            {product.description}
                        </p>
                    </CardContent>

                    {/* Footer */}
                    <CardFooter className="p-4 pt-0 flex items-center justify-between">
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-cyan-glow">
                                    €{parseFloat(product.price).toFixed(2)}
                                </span>
                                {product.discount !== null && product.discount !== undefined && product.discount > 0 && (
                                    <span className="text-sm text-text-muted line-through">
                                        €{(parseFloat(product.price) / (1 - product.discount / 100)).toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-text-muted mt-1">
                                {product.platform ?? 'Digital Key'}
                            </p>
                        </div>

                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-white">4.8</span>
                        </div>
                    </CardFooter>
                </Card>
            </Link>
        </motion.div>
    );
}
