'use client';

/**
 * SpotlightGamesSection - Homepage Game Spotlights
 *
 * Displays featured game spotlight pages with cinematic cards.
 * Links to /games/[slug] for full spotlight experience.
 *
 * Features:
 * - Fetches active spotlights from API
 * - Hero image cards with hover effects
 * - Badge text and accent colors
 * - Responsive grid layout
 */

import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { m } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, Star, Building2, Calendar } from 'lucide-react';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent } from '@/design-system/primitives/card';
import { cn } from '@/design-system/utils/utils';
import { CatalogGroupsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

// ============================================================================
// TYPES
// ============================================================================

interface SpotlightGroup {
  id: string;
  title: string;
  slug: string;
  tagline?: string | null;
  coverImageUrl?: string | null;
  isActive: boolean;
  isSpotlight?: boolean;
  heroImageUrl?: string | null;
  accentColor?: string | null;
  badgeText?: string | null;
  metacriticScore?: number | null;
  releaseDate?: Date | string | null;
  developerName?: string | null;
  publisherName?: string | null;
}

// ============================================================================
// SPOTLIGHT CARD COMPONENT
// ============================================================================

interface SpotlightCardProps {
  spotlight: SpotlightGroup;
  index: number;
}

function SpotlightCard({ spotlight, index }: SpotlightCardProps): React.ReactElement {
  const accentColor = spotlight.accentColor ?? '#00d4ff';
  const heroImage = spotlight.heroImageUrl ?? spotlight.coverImageUrl ?? '/images/placeholder-game.jpg';
  const releaseDateText =
    spotlight.releaseDate !== null && spotlight.releaseDate !== undefined
      ? new Date(spotlight.releaseDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;
  
  return (
    <m.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/games/${spotlight.slug}`}>
        <Card className="group relative overflow-hidden border-border-subtle bg-bg-secondary/95 transition-all duration-500 hover:border-brand-primary/60 hover:shadow-glow-cyan-sm cursor-pointer">
          {/* Hero Image */}
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={heroImage}
              alt={spotlight.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Gradient Overlay */}
            <div 
              className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent"
              style={{
                background: `linear-gradient(to top, ${accentColor}20, transparent 50%), linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4) 50%, transparent)`
              }}
            />
            
            {/* Badge */}
            {spotlight.badgeText !== null && spotlight.badgeText !== undefined && spotlight.badgeText !== '' && (
              <Badge 
                className="absolute top-4 left-4 border px-3 py-1 font-bold tracking-wide shadow-card-sm"
                style={{ 
                  backgroundColor: accentColor,
                  borderColor: accentColor,
                  color: 'hsl(var(--bg-primary))',
                }}
              >
                {spotlight.badgeText}
              </Badge>
            )}
            
            {/* Metacritic Score */}
            {spotlight.metacriticScore !== null && spotlight.metacriticScore !== undefined && spotlight.metacriticScore > 0 && (
              <div 
                className="absolute top-4 right-4 flex items-center gap-1.5 rounded-md border border-yellow-400/40 bg-black/85 px-2.5 py-1.5 backdrop-blur-md"
              >
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-yellow-300">Metacritic</span>
                <span className="text-sm font-bold text-white">{spotlight.metacriticScore}/100</span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <CardContent className="relative p-6">
            {/* Title */}
            <h3 className="text-xl font-display font-bold text-text-primary mb-2 group-hover:text-brand-primary transition-colors">
              {spotlight.title}
            </h3>
            
            {/* Tagline */}
            {spotlight.tagline !== null && spotlight.tagline !== undefined && spotlight.tagline !== '' && (
              <p className="mb-4 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                {spotlight.tagline}
              </p>
            )}
            
            {/* Meta Info */}
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1 text-xs text-text-tertiary">
                {spotlight.publisherName !== null && spotlight.publisherName !== undefined && spotlight.publisherName !== '' && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" />
                    <span>{spotlight.publisherName}</span>
                  </div>
                )}
                {releaseDateText !== null && releaseDateText !== 'Invalid Date' && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>{releaseDateText}</span>
                  </div>
                )}
              </div>
              
              {/* View Button */}
              <div 
                className="flex items-center gap-1 text-sm font-medium transition-colors"
                style={{ color: accentColor }}
              >
                <span>Explore</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
            
            {/* Accent glow on hover */}
            <div 
              className="absolute inset-x-0 bottom-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ backgroundColor: accentColor }}
            />
          </CardContent>
        </Card>
      </Link>
    </m.div>
  );
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function SpotlightSkeleton(): React.ReactElement {
  return (
    <Card className="overflow-hidden bg-bg-secondary border-border-subtle animate-pulse">
      <div className="aspect-video bg-bg-tertiary" />
      <CardContent className="p-6 space-y-3">
        <div className="h-6 bg-bg-tertiary rounded w-3/4" />
        <div className="h-4 bg-bg-tertiary rounded w-full" />
        <div className="h-4 bg-bg-tertiary rounded w-1/2" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SpotlightGamesSection(): React.ReactElement | null {
  const catalogGroupsApi = new CatalogGroupsApi(apiConfig);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const { data: spotlights, isLoading, isError } = useQuery({
    queryKey: ['homepage', 'spotlights'],
    queryFn: async () => {
      const response = await catalogGroupsApi.groupsControllerListSpotlights();
      return response as SpotlightGroup[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const spotlightsList = spotlights ?? [];
  const hasSpotlights = spotlightsList.length > 0;
  const shouldUseCarousel = !isLoading && spotlightsList.length > 3;

  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container === null) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
  }, []);

  useEffect(() => {
    if (!shouldUseCarousel) return;

    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [checkScrollState, shouldUseCarousel, spotlights]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container === null) return;

    const cardWidth = 380;
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  if (isError || (!isLoading && !hasSpotlights)) {
    return null;
  }
  
  return (
    <section className="py-16 md:py-20 bg-bg-primary relative overflow-hidden">
      {/* Background decoration */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 212, 255, 0.1), transparent)'
        }}
        aria-hidden="true"
      />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge
            variant="secondary"
            className="mb-4 px-3 py-1 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary"
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
            Featured Games
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
            Game Spotlights
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Explore our featured games with exclusive editions, bundles, and the best crypto prices.
          </p>
        </m.div>
        
        {/* Navigation (for many spotlights) */}
        {shouldUseCarousel && (
          <div className="mb-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="h-8 w-8 rounded-full border-border-subtle disabled:opacity-30"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="h-8 w-8 rounded-full border-border-subtle disabled:opacity-30"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Spotlight List */}
        {shouldUseCarousel ? (
          <div className="relative mb-10">
            <div
              className={cn(
                'pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 bg-linear-to-r from-bg-primary to-transparent transition-opacity',
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              )}
            />
            <div
              className={cn(
                'pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 bg-linear-to-l from-bg-primary to-transparent transition-opacity',
                canScrollRight ? 'opacity-100' : 'opacity-0'
              )}
            />
            <div
              ref={scrollContainerRef}
              onScroll={checkScrollState}
              className="flex gap-6 overflow-x-auto pb-4 scrollbar-hidden scroll-smooth snap-x snap-mandatory"
              role="list"
              aria-label="Spotlight games carousel"
            >
              {spotlightsList.map((spotlight, index) => (
                <div key={spotlight.id} className="w-[320px] shrink-0 snap-start md:w-[360px]" role="listitem">
                  <SpotlightCard spotlight={spotlight} index={index} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 mb-10 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <>
                <SpotlightSkeleton />
                <SpotlightSkeleton />
                <SpotlightSkeleton />
              </>
            ) : (
              spotlightsList.map((spotlight, index) => (
                <SpotlightCard key={spotlight.id} spotlight={spotlight} index={index} />
              ))
            )}
          </div>
        )}
        
        {/* View All Button */}
        {spotlightsList.length > 3 && (
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/games">
                View All Featured Games
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </m.div>
        )}
      </div>
    </section>
  );
}
