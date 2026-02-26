'use client';

/**
 * SpotlightHero Component
 *
 * Full-screen cinematic hero section for game spotlight pages.
 * Features:
 * - Full-width background image with gradient overlay
 * - Game title with optional neon glow effect
 * - Badge text (NEW RELEASE, COMING SOON, PRE-ORDER)
 * - Metacritic score display
 * - Genre tags
 * - Developer/Publisher info
 * - Release date with countdown
 * - Watch Trailer / Buy Now CTAs
 * - Price range display
 *
 * Uses BitLoot's neon cyberpunk design system.
 */

import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { GlowButton } from '@/design-system/primitives/glow-button';
import {
  Play,
  ShoppingCart,
  Star,
  Calendar,
  Building2,
  Gamepad2,
  Clock,
  Zap,
} from 'lucide-react';
import { BitcoinIcon, EthereumIcon, SolanaIcon } from '@/components/crypto-icons';
import { motion } from 'framer-motion';
import type { SpotlightHeroProps } from '../types';
import { CountdownTimer } from './CountdownTimer';
import { VideoModal } from './VideoModal';

export function SpotlightHero({
  title,
  tagline,
  coverImageUrl,
  heroImageUrl,
  heroVideoUrl,
  accentColor = '#00D9FF',
  badgeText,
  releaseDate,
  metacriticScore,
  developerName,
  publisherName: _publisherName,
  genres = [],
  minPrice,
  maxPrice,
  onWatchTrailer,
  onBuyNow,
}: SpotlightHeroProps): React.JSX.Element {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const backgroundImage = heroImageUrl ?? coverImageUrl;

  // Parse release date
  const releaseDateObj = useMemo(() => {
    if (releaseDate === undefined || releaseDate === '') return undefined;
    const parsed = new Date(releaseDate);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [releaseDate]);

  const isUpcoming = useMemo(() => {
    if (releaseDateObj === undefined) return false;
    return releaseDateObj > new Date();
  }, [releaseDateObj]);

  // Format price range
  const priceDisplay = useMemo(() => {
    if (minPrice === undefined || minPrice === '' || maxPrice === undefined || maxPrice === '') {
      return null;
    }
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (isNaN(min) || min <= 0) return null;
    if (min === max) return `€${min.toFixed(2)}`;
    return `€${min.toFixed(2)} - €${max.toFixed(2)}`;
  }, [minPrice, maxPrice]);

  // Metacritic score color
  const metacriticColor = useMemo(() => {
    if (metacriticScore === undefined || metacriticScore === null) return '#7A8599';
    if (metacriticScore >= 75) return '#39FF14';
    if (metacriticScore >= 50) return '#FFD700';
    return '#FF6B00';
  }, [metacriticScore]);

  // CSS custom properties for accent color
  const accentStyle: CSSProperties = {
    '--accent-color': accentColor,
    '--accent-glow': `${accentColor}40`,
  } as CSSProperties;

  return (
    <>
      <section
        className="relative min-h-[70vh] md:min-h-[80vh] overflow-hidden"
        style={accentStyle}
      >
        {/* Background Image */}
        {backgroundImage !== undefined && backgroundImage !== '' && (
          <div className="absolute inset-0">
            <Image
              src={backgroundImage}
              alt={title}
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-linear-to-t from-bg-primary via-bg-primary/80 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-r from-bg-primary/90 via-transparent to-bg-primary/50" />
            {/* Accent color glow at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: `linear-gradient(to right, ${accentColor}, transparent, ${accentColor})` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            {/* Badge */}
            {badgeText !== undefined && badgeText !== '' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
              >
                <Badge
                  className="inline-flex items-center gap-2 border-2 px-4 py-2 text-sm font-bold uppercase tracking-wider backdrop-blur-md"
                  style={{
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                    color: '#000',
                    boxShadow: `0 0 20px ${accentColor}80, 0 0 40px ${accentColor}40`,
                  }}
                >
                  <Zap className="h-4 w-4" />
                  {badgeText}
                </Badge>
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
              style={{
                textShadow: `0 0 40px ${accentColor}60, 0 2px 20px ${accentColor}40`,
              }}
            >
              {title}
            </motion.h1>

            {/* Tagline */}
            {tagline !== undefined && tagline !== '' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-xl text-text-secondary md:text-2xl"
              >
                {tagline}
              </motion.p>
            )}

            {/* Meta Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-8 flex flex-wrap items-center gap-4 text-sm text-text-secondary"
            >
              {/* Metacritic Score */}
              {metacriticScore !== undefined && metacriticScore !== null && (
                <div
                  className="flex items-center gap-2 rounded-lg border-2 px-3 py-2 backdrop-blur-md"
                  style={{
                    backgroundColor: `${metacriticColor}20`,
                    borderColor: metacriticColor,
                    boxShadow: `0 0 20px ${metacriticColor}50, inset 0 0 20px ${metacriticColor}15`,
                  }}
                >
                  <Star className="h-5 w-5" style={{ color: metacriticColor, filter: `drop-shadow(0 0 4px ${metacriticColor})` }} />
                  <span className="text-lg font-bold" style={{ color: metacriticColor, textShadow: `0 0 10px ${metacriticColor}` }}>
                    {metacriticScore}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide text-white">Metacritic</span>
                </div>
              )}

              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-text-muted" />
                  <span>{genres.slice(0, 3).join(' · ')}</span>
                </div>
              )}

              {/* Developer */}
              {developerName !== undefined && developerName !== '' && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-text-muted" />
                  <span>{developerName}</span>
                </div>
              )}

              {/* Release Date */}
              {releaseDateObj !== undefined && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-text-muted" />
                  <span>
                    {releaseDateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Countdown Timer (for upcoming games) */}
            {isUpcoming && releaseDateObj !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 text-text-secondary">
                  <Clock className="h-5 w-5" style={{ color: accentColor }} />
                  <span className="text-sm uppercase tracking-wide">Releases in</span>
                </div>
                <CountdownTimer targetDate={releaseDateObj} accentColor={accentColor} />
              </motion.div>
            )}

            {/* Price with Crypto Icons */}
            {priceDisplay !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm uppercase tracking-wide text-text-muted">Pay with crypto</span>
                  <div className="flex items-center gap-1 opacity-80">
                    <BitcoinIcon size={16} />
                    <EthereumIcon size={16} />
                    <SolanaIcon size={16} />
                  </div>
                </div>
                <div
                  className="text-3xl font-bold"
                  style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}60` }}
                >
                  {priceDisplay}
                </div>
              </motion.div>
            )}

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-4"
            >
              {heroVideoUrl !== undefined && heroVideoUrl !== '' && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setIsTrailerOpen(true);
                    onWatchTrailer?.();
                  }}
                  className="gap-2"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  <Play className="h-5 w-5" />
                  Watch Trailer
                </Button>
              )}

              <GlowButton
                size="lg"
                onClick={onBuyNow}
                className="gap-2"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 20px ${accentColor}40, 0 0 40px ${accentColor}20`,
                }}
              >
                <ShoppingCart className="h-5 w-5" />
                {isUpcoming ? 'Pre-Purchase' : 'Buy Now'}
              </GlowButton>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-bg-primary to-transparent" />

        {/* Floating Crypto Icons - Decorative */}
        <div className="absolute top-20 right-10 hidden opacity-20 lg:block">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col gap-4"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <BitcoinIcon size={48} className="drop-shadow-lg" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
            >
              <EthereumIcon size={40} className="drop-shadow-lg" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
            >
              <SolanaIcon size={36} className="drop-shadow-lg" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trailer Modal */}
      {heroVideoUrl !== undefined && heroVideoUrl !== '' && (
        <VideoModal
          videoUrl={heroVideoUrl}
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
        />
      )}
    </>
  );
}
