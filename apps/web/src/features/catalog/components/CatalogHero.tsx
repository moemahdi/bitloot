/**
 * CatalogHero Component
 * 
 * Full-width hero section with animated gradient orbs, centered content,
 * integrated search bar with keyboard shortcut, and quick stats.
 */
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Input } from '@/design-system/primitives/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import { Zap, Search, Package, Star, Command } from 'lucide-react';

// Gaming-style easing for smooth animations
const GAMING_EASING = [0.25, 0.46, 0.45, 0.94] as const;

interface CatalogHeroProps {
  /** Total number of products in catalog */
  totalProducts: number;
  /** Current search input value */
  searchValue: string;
  /** Handler for search input changes */
  onSearchChange: (value: string) => void;
  /** Handler for search submission */
  onSearch?: () => void;
}

export function CatalogHero({
  totalProducts,
  searchValue,
  onSearchChange,
  onSearch,
}: CatalogHeroProps): React.ReactElement {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: ⌘K or / to focus search
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))) {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSearchSubmit = () => {
    if (onSearch) {
      onSearch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <section 
      className="relative overflow-hidden border-b border-border-subtle"
      aria-label="Catalog hero"
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-glow/10 blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-purple-neon/10 blur-3xl"
          animate={{ 
            x: [0, -30, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-pink-featured/5 blur-3xl"
          animate={{ 
            x: [0, 40, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 bg-linear-to-b from-transparent via-bg-primary/50 to-bg-primary pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: GAMING_EASING }}
          className="flex justify-center mb-6"
        >
          <Badge 
            variant="outline" 
            className="px-4 py-1.5 bg-bg-secondary/80 border-cyan-glow/30 text-cyan-glow shadow-glow-cyan-sm backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-glow opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-glow" />
            </span>
            <Zap className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            {totalProducts.toLocaleString()}+ Digital Products
          </Badge>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ease: GAMING_EASING }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-text-primary mb-4"
        >
          Browse All{' '}
          <span className="text-gradient-primary">Categories</span>
          {' '}and{' '}
          <span className="text-gradient-featured">Platforms</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: GAMING_EASING }}
          className="text-text-secondary text-center max-w-2xl mx-auto mb-8"
        >
          Discover thousands of digital products with instant delivery and secure crypto payments
        </motion.p>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease: GAMING_EASING }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative group">
            {/* Glow effect */}
            <div 
              className="absolute -inset-0.5 bg-linear-to-r from-cyan-glow/40 via-purple-neon/40 to-pink-featured/40 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300" 
              aria-hidden="true"
            />
            
            <div className="relative flex items-center bg-bg-secondary border border-border-subtle rounded-xl overflow-hidden focus-within:border-cyan-glow/60 transition-colors">
              <Search className="w-5 h-5 text-text-muted ml-4 shrink-0" aria-hidden="true" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search games, software, gift cards..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 h-12 md:h-14 !border-0 bg-transparent text-text-primary placeholder:text-text-muted !ring-0 !ring-offset-0 !outline-none !shadow-none focus:!ring-0 focus:!border-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 text-base"
                aria-label="Search products"
              />
              <div className="hidden md:flex items-center gap-2 pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <kbd className="hidden lg:inline-flex h-7 select-none items-center gap-1 rounded-md border border-border-subtle bg-bg-tertiary px-2 text-xs font-mono text-text-muted cursor-help">
                        <Command className="w-3 h-3" aria-hidden="true" />K
                      </kbd>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Press ⌘K or / to focus search</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  size="sm"
                  onClick={handleSearchSubmit}
                  className="bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan-sm transition-all"
                >
                  <Search className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: GAMING_EASING }}
          className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 text-sm"
        >
          <div className="flex items-center gap-2 text-text-secondary">
            <Zap className="w-4 h-4 text-cyan-glow" aria-hidden="true" />
            <span>Instant Delivery</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Package className="w-4 h-4 text-purple-neon" aria-hidden="true" />
            <span>300+ Crypto Accepted</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Star className="w-4 h-4 text-pink-featured" aria-hidden="true" />
            <span>Secure & Encrypted</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
