'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Layers, ShoppingCart, Eye, Sparkles } from 'lucide-react';
import type { ProductGroupResponseDto } from '@bitloot/sdk';
import { Card, CardContent, CardFooter } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { cn } from '@/design-system/utils/utils';

// Gaming-optimized easing
const GAMING_EASING = [0.25, 0.46, 0.45, 0.94];

interface ProductGroupCardProps {
  group: ProductGroupResponseDto;
  onViewVariants: (group: ProductGroupResponseDto) => void;
  className?: string;
}

export function ProductGroupCard({
  group,
  onViewVariants,
  className,
}: ProductGroupCardProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Format price for display (8 decimal crypto precision available)
  const formatPrice = useCallback((price: string | undefined | null): string => {
    if (price === undefined || price === null || price === '') return '0.00';
    const num = parseFloat(price);
    return Number.isNaN(num) ? '0.00' : num.toFixed(2);
  }, []);

  // Determine if it's a single price or price range
  const minPrice = formatPrice(group.minPrice);
  const maxPrice = formatPrice(group.maxPrice);
  const isSamePrice = minPrice === maxPrice;
  const priceDisplay = isSamePrice ? `€${minPrice}` : `€${minPrice} – €${maxPrice}`;

  // Image URL with fallback
  const imageUrl = group.coverImageUrl !== '' && group.coverImageUrl !== null && group.coverImageUrl !== undefined
    ? group.coverImageUrl
    : '/placeholder-game.jpg';

  const handleViewVariants = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewVariants(group);
  }, [group, onViewVariants]);

  return (
    <motion.div
      className={cn('group relative', className)}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25, ease: GAMING_EASING }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient glow effect on hover */}
      <div
        className={cn(
          'absolute -inset-1 rounded-xl bg-linear-to-r from-purple-neon/0 via-cyan-glow/0 to-purple-neon/0 blur-xl transition-opacity duration-300',
          isHovered ? 'opacity-40' : 'opacity-0'
        )}
      />

      <Card className="relative overflow-hidden bg-bg-secondary border border-border-subtle hover:border-cyan-glow/50 transition-all duration-250 shadow-card-sm hover:shadow-glow-cyan-sm">
        {/* Image Container */}
        <div className="relative aspect-3/4 overflow-hidden">
          {/* Blurred Background Gradient */}
          <div className="absolute inset-0 bg-linear-to-b from-purple-neon/10 via-transparent to-bg-primary/80" />
          
          {/* Background blur layer */}
          {!imageError && (
            <div
              className="absolute inset-0 scale-110 blur-2xl opacity-30"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}

          {/* Main Image */}
          <Image
            src={imageError ? '/placeholder-game.jpg' : imageUrl}
            alt={group.title}
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />

          {/* Top gradient overlay */}
          <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-bg-primary/60 to-transparent" />
          
          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-bg-primary/90 via-bg-primary/50 to-transparent" />

          {/* Group Badge - Top Left */}
          <div className="absolute top-3 left-3 z-10">
            <Badge
              variant="secondary"
              className="bg-purple-neon/90 text-white border-none flex items-center gap-1.5 px-2.5 py-1 shadow-glow-purple-sm backdrop-blur-sm"
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs font-semibold">{group.productCount} variants</span>
            </Badge>
          </div>

          {/* Featured indicator if applicable */}
          {group.productCount !== undefined && group.productCount > 5 && (
            <div className="absolute top-3 right-3 z-10">
              <Badge
                variant="secondary"
                className="bg-pink-featured/90 text-white border-none flex items-center gap-1 px-2 py-1 shadow-glow-pink backdrop-blur-sm"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span className="text-xs font-medium">Popular</span>
              </Badge>
            </div>
          )}

          {/* Hover Overlay with Actions */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-linear-to-t from-bg-primary via-bg-primary/70 to-transparent flex items-end justify-center pb-6"
              >
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    onClick={handleViewVariants}
                    className="bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan transition-all duration-200 font-medium"
                    aria-label={`View variants for ${group.title}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
                    View Options
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewVariants}
                    className="border-border-accent bg-bg-tertiary/80 text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/60 hover:shadow-glow-cyan-sm backdrop-blur-sm transition-all duration-200"
                    aria-label={`Quick view ${group.title}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-1.5">
          <h3 className="font-semibold text-lg text-text-primary line-clamp-2 group-hover:text-cyan-glow transition-colors duration-200">
            {group.title}
          </h3>
          {group.tagline !== null && group.tagline !== undefined && group.tagline !== '' && (
            <p className="text-sm text-text-secondary line-clamp-1">
              {group.tagline}
            </p>
          )}
        </CardContent>

        {/* Footer with Price */}
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-muted">Starting from</span>
            <span className="text-lg font-bold text-cyan-glow crypto-amount text-glow-cyan">
              {priceDisplay}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewVariants}
            className="text-text-secondary hover:text-purple-neon hover:bg-purple-neon/10 transition-all duration-200"
            aria-label={`Compare variants for ${group.title}`}
          >
            Compare
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
