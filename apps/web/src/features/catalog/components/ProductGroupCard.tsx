'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Layers, ShoppingCart } from 'lucide-react';
import type { ProductGroupResponseDto } from '@bitloot/sdk';
import { Card, CardContent, CardFooter } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { cn } from '@/design-system/utils/utils';

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

  // Format price for display
  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return num.toFixed(2);
  };

  // Determine if it's a single price or price range
  const priceDisplay =
    group.minPrice === group.maxPrice
      ? `$${formatPrice(group.minPrice)}`
      : `$${formatPrice(group.minPrice)} - $${formatPrice(group.maxPrice)}`;

  return (
    <motion.div
      className={cn('group relative', className)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {/* Blurred Background */}
          <div
            className="absolute inset-0 scale-110 blur-xl opacity-50"
            style={{
              backgroundImage: `url(${group.coverImageUrl !== '' && group.coverImageUrl !== null ? group.coverImageUrl : '/placeholder-game.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* Main Image */}
          <Image
            src={group.coverImageUrl !== '' && group.coverImageUrl !== null ? group.coverImageUrl : '/placeholder-game.jpg'}
            alt={group.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Group Badge - Top Left */}
          <div className="absolute top-2 left-2 z-10">
            <Badge
              variant="secondary"
              className="bg-purple-600/90 text-white border-none flex items-center gap-1"
            >
              <Layers className="h-3 w-3" />
              {group.productCount} variants
            </Badge>
          </div>

          {/* Hover Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center pb-4"
              >
                <Button
                  size="sm"
                  onClick={() => onViewVariants(group)}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Options
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {group.title}
          </h3>
          {group.tagline !== null && group.tagline !== undefined && group.tagline !== '' && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {group.tagline}
            </p>
          )}
        </CardContent>

        {/* Footer with Price */}
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Starting from</span>
            <span className="text-lg font-bold text-primary">
              {priceDisplay}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewVariants(group)}
            className="text-muted-foreground hover:text-primary"
          >
            Compare
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
