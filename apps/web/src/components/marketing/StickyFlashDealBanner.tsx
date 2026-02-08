'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { m, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Zap, Clock, X, ArrowRight, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { Configuration } from '@bitloot/sdk';

// Types
interface StickyFlashDealProduct {
  id: string;
  productId: string;
  discountPercent?: string;
  discountPrice?: string;
  originalPrice?: string;
  product?: {
    title?: string;
    slug?: string;
    price?: string;
    coverImage?: string;
    currency?: string;
  };
}

interface StickyFlashDeal {
  id: string;
  name: string;
  headline?: string;
  subHeadline?: string;
  description: string | null;
  endsAt: string;
  accentColor?: string;
  textColor?: string;
  ctaText?: string;
  ctaLink?: string;
  displayType?: 'inline' | 'sticky';
  products: StickyFlashDealProduct[];
}

// Stable fallback date (far in the past = already expired)
const EXPIRED_DATE = '1970-01-01T00:00:00.000Z';

// Fetch sticky flash deal
async function fetchStickyFlashDeal(): Promise<StickyFlashDeal | null> {
  const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  });

  // Fetch specifically sticky type deals
  const response = await fetch(`${config.basePath}/public/marketing/flash-deal/active?type=sticky`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) return null;
  const data = (await response.json()) as unknown as StickyFlashDeal | null;
  
  // Return if we got a deal (already filtered by type on backend)
  if (data?.id !== undefined) {
    return data;
  }
  return null;
}

// Countdown hook
function useCountdown(endTime: string) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: true,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

// Countdown unit component
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <m.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[40px] text-center border border-white/10"
      >
        <span className="text-lg sm:text-xl font-bold tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </m.div>
      <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">{label}</span>
    </div>
  );
}

/**
 * StickyFlashDealBanner - Premium banner displayed at the top of the homepage
 * 
 * Features:
 * - Eye-catching gradient design with animations
 * - Countdown timer with individual units
 * - Shows headline, subheadline, and description
 * - Dismissable with session persistence
 * - Auto-hides when deal expires
 */
export function StickyFlashDealBanner(): React.ReactElement | null {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { data: flashDeal, isLoading, error } = useQuery({
    queryKey: ['public', 'marketing', 'flash-deal', 'sticky'],
    queryFn: fetchStickyFlashDeal,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  // Memoize endTime to prevent infinite re-renders
  const endTime = useMemo(() => flashDeal?.endsAt ?? EXPIRED_DATE, [flashDeal?.endsAt]);
  const countdown = useCountdown(endTime);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    // No persistence - will show again on page refresh
  }, []);

  // Don't render if loading, error, no deal, expired, or dismissed
  if (isLoading === true || (error !== null && error !== undefined) || flashDeal === null || flashDeal === undefined || countdown.expired === true || isDismissed === true) {
    return null;
  }

  const accentColor = flashDeal.accentColor ?? '#FF6B35';

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, #FF3366 50%, #FF6B35 100%)`,
          }}
        />
        
        {/* Animated particles/sparkles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <m.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              initial={{ 
                x: `${(i * 17) % 100}%`, 
                y: `${(i * 23) % 100}%`,
                scale: 0 
              }}
              animate={{ 
                y: [null, '-100%'],
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>

        {/* Mesh overlay for depth */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Left Section - Title & Description */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                <m.div
                  animate={{ 
                    rotate: isHovered ? [0, -10, 10, 0] : 0,
                    scale: isHovered ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
                </m.div>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/90">
                  Flash Sale
                </span>
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </div>
              
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 leading-tight">
                {flashDeal.headline ?? flashDeal.name}
              </h2>
              
              {flashDeal.subHeadline !== undefined && flashDeal.subHeadline !== null && flashDeal.subHeadline !== '' ? (
                <p className="text-sm sm:text-base text-white/90 font-medium">
                  {flashDeal.subHeadline}
                </p>
              ) : null}
              
              {flashDeal.description !== undefined && flashDeal.description !== null && flashDeal.description !== '' ? (
                <p className="text-xs sm:text-sm text-white/75 mt-1 max-w-md mx-auto lg:mx-0 line-clamp-2">
                  {flashDeal.description}
                </p>
              ) : null}
            </div>

            {/* Center Section - Countdown */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2 text-white/80">
                <Clock className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider font-medium">Ends In</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-white">
                {countdown.days > 0 && (
                  <>
                    <CountdownUnit value={countdown.days} label="Days" />
                    <span className="text-lg font-bold opacity-50">:</span>
                  </>
                )}
                <CountdownUnit value={countdown.hours} label="Hrs" />
                <span className="text-lg font-bold opacity-50">:</span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="text-lg font-bold opacity-50">:</span>
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            </div>

            {/* Right Section - CTA */}
            <div className="flex items-center gap-3">
              <Link href="/catalog">
                <m.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-gray-100 font-bold shadow-lg shadow-black/20 gap-2 px-6"
                  >
                    <Zap className="h-4 w-4" />
                    {flashDeal.ctaText ?? 'Shop Now'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </m.div>
              </Link>
              
              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white/80 hover:text-white"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <m.div 
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </m.div>
    </AnimatePresence>
  );
}

export default StickyFlashDealBanner;
