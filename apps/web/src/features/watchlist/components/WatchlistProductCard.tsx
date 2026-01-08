'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Eye, ShoppingCart, Trash2, Loader2, Clock } from 'lucide-react';

export interface WatchlistProduct {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  price: number;
  coverImageUrl?: string | null;
  platform?: string | null;
  region?: string | null;
  isPublished?: boolean;
}

interface WatchlistProductCardProps {
  product: WatchlistProduct;
  addedAt: string | Date;
  onRemove: (productId: string) => Promise<void>;
  onAddToCart?: (product: WatchlistProduct) => void;
  onQuickView?: (product: WatchlistProduct) => void;
  isRemoving?: boolean;
}

export function WatchlistProductCard({
  product,
  addedAt,
  onRemove,
  onAddToCart,
  onQuickView,
  isRemoving = false,
}: WatchlistProductCardProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const isUnavailable = product.isPublished === false;

  const handleRemove = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    await onRemove(product.id);
  };

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group h-full"
    >
      <Link href={`/product/${product.slug}`} className="block h-full">
        <Card className="h-full overflow-hidden bg-bg-secondary border-border-subtle hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-300">
          {/* Image Section with Blur Background */}
          <div className="relative aspect-3/4 overflow-hidden">
            {/* Blurred Background */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110"
              style={{ backgroundImage: `url(${product.coverImageUrl ?? '/placeholder-product.jpg'})` }}
            />

            {/* Main Image */}
            <div className="relative z-10 w-full h-full">
              <Image
                src={product.coverImageUrl ?? '/placeholder-product.jpg'}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover transition-transform duration-300 group-hover:scale-110 ${isUnavailable ? 'grayscale' : ''}`}
              />
            </div>

            {/* Badges - Top Right */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
              {isUnavailable && (
                <Badge variant="destructive" className="text-sm font-bold shadow-glow-error">
                  UNAVAILABLE
                </Badge>
              )}
              {product.region !== undefined && product.region !== '' && (
                <Badge className="bg-bg-tertiary/90 backdrop-blur-sm border border-border-subtle text-text-primary text-xs">
                  {product.region}
                </Badge>
              )}
            </div>

            {/* Hover Overlay with Actions */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center gap-3 z-20"
                  onClick={(e) => e.preventDefault()}
                >
                  {!isUnavailable && onQuickView !== undefined && (
                    <Button
                      size="sm"
                      className="bg-cyan-glow text-bg-primary hover:shadow-glow-cyan font-semibold"
                      onClick={(e) => {
                        e.preventDefault();
                        onQuickView(product);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Quick View
                    </Button>
                  )}
                  {!isUnavailable && onAddToCart !== undefined && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-neon/50 text-purple-neon hover:bg-purple-neon/20 hover:border-purple-neon hover:shadow-glow-purple-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        onAddToCart(product);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  )}
                  {/* Remove from Watchlist Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-warning/50 text-orange-warning hover:bg-orange-warning/20 hover:border-orange-warning hover:shadow-glow-error"
                    onClick={handleRemove}
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-text-primary line-clamp-2 flex-1 group-hover:text-cyan-glow transition-colors">
                {product.title}
              </h3>
            </div>

            {product.subtitle !== undefined && product.subtitle !== '' && (
              <p className="text-sm text-text-muted mb-3 line-clamp-2">
                {product.subtitle}
              </p>
            )}
          </CardContent>

          {/* Footer */}
          <CardFooter className="p-4 pt-0 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-cyan-glow">
                  €{product.price.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {product.platform ?? 'Digital Key'}
              </p>
            </div>

            <div className="flex items-center gap-1 text-text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{formatDate(addedAt)}</span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
