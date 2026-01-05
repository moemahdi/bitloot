'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { ProductResponseDto, ScreenshotDto, VideoDto, SystemRequirementDto } from '@bitloot/sdk';
import Image from 'next/image';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';

import { Skeleton } from '@/design-system/primitives/skeleton';
import { 
  Bitcoin, Zap, Loader2, Globe, Monitor, ChevronLeft, 
  Share2, Check, Package, Play, Image as ImageIcon, 
  Cpu, HardDrive, AlertTriangle, Key, Clock, 
  RefreshCw, FileText, Wallet, Lock, BadgeCheck,
  Volume2, Wifi, Settings, Gamepad2, Shield, Star
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AddToCartButton } from '@/features/product/components/AddToCartButton';
import { ProductReviews } from '@/features/reviews';
import { WatchlistButton } from '@/features/watchlist';
import { EmailEntryModal } from '@/features/checkout/EmailEntryModal';
import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback, useEffect } from 'react';

// ========== Design Constants & Utilities ==========

const GLASS_PANEL = "bg-[#0A0A0B]/80 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50";
const GLASS_CARD = "bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors";

// ========== Component: Trust Badge (PRD Requirement) ==========

type TrustBadgeVariant = 'default' | 'success' | 'warning' | 'info';

interface TrustBadgeProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  variant?: TrustBadgeVariant;
}

const TRUST_BADGE_VARIANTS: Record<TrustBadgeVariant, string> = {
  default: 'border-white/10 bg-white/5',
  success: 'border-emerald-500/30 bg-emerald-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
  info: 'border-cyan-500/30 bg-cyan-500/10',
};

const TRUST_BADGE_ICON_VARIANTS: Record<TrustBadgeVariant, string> = {
  default: 'text-white/70',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  info: 'text-cyan-400',
};

function TrustBadge({ icon, title, description, variant = 'default' }: TrustBadgeProps): React.ReactElement {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${TRUST_BADGE_VARIANTS[variant]} transition-all hover:bg-white/8`}>
      <div className={`shrink-0 mt-0.5 ${TRUST_BADGE_ICON_VARIANTS[variant]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{title}</p>
        {description != null && description.length > 0 && (
          <p className="text-xs text-white/50 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ========== Component: Crypto Payment Banner (PRD Requirement) ==========

function CryptoPaymentBanner(): React.ReactElement {
  const cryptos = [
    { icon: Bitcoin, name: 'BTC', color: 'text-amber-400' },
    { icon: Wallet, name: 'ETH', color: 'text-blue-400' },
    { icon: Wallet, name: 'USDT', color: 'text-emerald-400' },
  ];

  return (
    <div className="bg-linear-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-semibold text-white">Pay with Crypto</span>
      </div>
      <p className="text-xs text-white/60 mb-3">
        Instant key delivery after payment confirmation
      </p>
      <div className="flex items-center gap-4">
        {cryptos.map((crypto) => (
          <div key={crypto.name} className="flex items-center gap-1.5">
            <crypto.icon className={`h-4 w-4 ${crypto.color}`} />
            <span className="text-xs font-medium text-white/80">{crypto.name}</span>
          </div>
        ))}
        <span className="text-xs text-white/40">+300 more</span>
      </div>
    </div>
  );
}

// ========== Component: Metacritic Badge ==========

function MetacriticBadge({ score }: { score: number }): React.ReactElement {
  const getScoreData = (): { color: string; label: string } => {
    if (score >= 75) return { color: 'bg-[#66CC33]', label: 'Must-Play' };
    if (score >= 50) return { color: 'bg-[#FFCC33]', label: 'Mixed' };
    return { color: 'bg-[#FF0000]', label: 'Low' };
  };

  const { color, label } = getScoreData();

  return (
    <div className="flex items-center gap-3 group bg-black/40 backdrop-blur-md p-1.5 pr-4 rounded-xl border border-white/10 hover:border-white/20 transition-all">
      <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center font-bold text-white text-lg shadow-inner`}>
        {score}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Metascore</span>
        <span className="text-xs font-medium text-white">{label}</span>
      </div>
    </div>
  );
}

// ========== Type for unified media items ==========

type MediaItem = 
  | { type: 'video'; videoId: string; title?: string }
  | { type: 'image'; url: string; iscover?: boolean };

// ========== Component: Unified Media Gallery ==========

function MediaGallery({ 
  screenshots, 
  videos, 
  coverImage, 
  productTitle,
  isPreorder 
}: { 
  screenshots?: ScreenshotDto[]; 
  videos?: VideoDto[]; 
  coverImage?: string | null;
  productTitle: string;
  isPreorder?: boolean;
}): React.ReactElement {
  // Build unified media array: videos first, then cover, then screenshots
  const mediaItems: MediaItem[] = [];
  
  // Add videos
  if (videos != null && videos.length > 0) {
    videos.forEach((v, i) => {
      mediaItems.push({ type: 'video', videoId: v.videoId ?? '', title: `Trailer ${i + 1}` });
    });
  }
  
  // Add cover image
  if (coverImage != null && coverImage !== '') {
    mediaItems.push({ type: 'image', url: coverImage, iscover: true });
  }
  
  // Add screenshots
  if (screenshots != null && screenshots.length > 0) {
    screenshots.forEach((s) => {
      mediaItems.push({ type: 'image', url: s.url });
    });
  }
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  
  const currentItem = mediaItems[selectedIndex];
  const totalItems = mediaItems.length;
  
  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setVideoLoading(true);
  }, [totalItems]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % totalItems);
    setVideoLoading(true);
  }, [totalItems]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isHovering) {
        if (e.key === 'ArrowLeft') handlePrevious();
        if (e.key === 'ArrowRight') handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovering, handlePrevious, handleNext]);

  if (totalItems === 0) {
    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 flex items-center justify-center">
        <ImageIcon className="h-16 w-16 text-zinc-700" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-cyan-400" />
          Media Gallery
        </h3>
        <span className="text-xs font-medium text-text-muted bg-white/5 px-2 py-1 rounded-md">
          {selectedIndex + 1} / {totalItems}
        </span>
      </div>

      {/* Main Display */}
      <div 
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50 group shadow-2xl"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <AnimatePresence mode="wait">
          {currentItem?.type === 'video' ? (
            <motion.div
              key={`video-${selectedIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full"
            >
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                  <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
                </div>
              )}
              <iframe
                src={`https://www.youtube.com/embed/${currentItem.videoId}?rel=0&modestbranding=1`}
                title={`${productTitle} - Video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                onLoad={() => setVideoLoading(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`image-${selectedIndex}`}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full"
            >
              <Image
                src={currentItem?.type === 'image' ? currentItem.url : '/placeholder.jpg'}
                alt={`${productTitle} - Media ${selectedIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority={selectedIndex === 0}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pre-order Badge */}
        {isPreorder === true && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5 z-20">
            <Clock className="h-4 w-4" /> Pre-Order
          </div>
        )}
        
        {/* Video/Image Type Indicator */}
        {currentItem?.type === 'video' && (
          <div className="absolute top-4 right-4 bg-pink-500/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 z-20">
            <Play className="h-3 w-3 fill-current" /> Video
          </div>
        )}
        
        {/* Navigation Controls */}
        {totalItems > 1 && (
          <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="pointer-events-auto h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="pointer-events-auto h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95 rotate-180"
              aria-label="Next"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Scrollable Thumbnails - Shows all media types */}
      {totalItems > 1 && (
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mask-fade-right">
            {mediaItems.map((item, index) => (
              <button
                key={item.type === 'video' ? `video-${index}` : item.url}
                onClick={() => { setSelectedIndex(index); setVideoLoading(true); }}
                className={`relative shrink-0 w-28 aspect-video rounded-lg overflow-hidden transition-all duration-300 ${
                  index === selectedIndex 
                    ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0A0A0B] opacity-100 scale-105' 
                    : 'opacity-50 hover:opacity-100 hover:scale-105'
                }`}
              >
                {item.type === 'video' ? (
                  <>
                    <Image
                      src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                      alt={item.title ?? 'Video thumbnail'}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="h-8 w-8 rounded-full bg-pink-500 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Image
                      src={item.url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {item.iscover === true && (
                      <div className="absolute bottom-1 left-1 bg-cyan-500/90 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                        Cover
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// VideoSection has been merged into MediaGallery component above

// ========== Component: System Requirements (Redesigned) ==========

function parseSystemRequirements(text: string): { label: string; value: string; icon: string }[] {
  const specConfig: Record<string, { icon: string; priority: number }> = {
    'os': { icon: 'os', priority: 1 },
    'processor': { icon: 'cpu', priority: 2 },
    'cpu': { icon: 'cpu', priority: 2 },
    'memory': { icon: 'ram', priority: 3 },
    'ram': { icon: 'ram', priority: 3 },
    'graphics': { icon: 'gpu', priority: 4 },
    'gpu': { icon: 'gpu', priority: 4 },
    'video card': { icon: 'gpu', priority: 4 },
    'storage': { icon: 'storage', priority: 5 },
    'hard drive': { icon: 'storage', priority: 5 },
    'directx': { icon: 'directx', priority: 6 },
    'sound': { icon: 'sound', priority: 7 },
    'network': { icon: 'network', priority: 8 },
  };
  
  const specLabels = Object.keys(specConfig);
  const pattern = new RegExp(`(${specLabels.join('|')})\\s*:`, 'gi');
  const specs: { label: string; value: string; icon: string }[] = [];
  const parts = text.split(pattern).filter(part => part.trim() !== '');
  
  for (let i = 0; i < parts.length - 1; i += 2) {
    const label = parts[i]?.trim().toLowerCase();
    const value = parts[i + 1]?.trim();
    if (label !== undefined && value !== undefined) {
      const config = specConfig[label] ?? { icon: 'default', priority: 99 };
      specs.push({ 
        label: label.charAt(0).toUpperCase() + label.slice(1), 
        value,
        icon: config.icon
      });
    }
  }
  
  // Sort by priority
  specs.sort((a, b) => {
    const priorityA = specConfig[a.label.toLowerCase()]?.priority ?? 99;
    const priorityB = specConfig[b.label.toLowerCase()]?.priority ?? 99;
    return priorityA - priorityB;
  });
  
  return specs.length > 0 ? specs : [{ label: 'Requirements', value: text.trim(), icon: 'default' }];
}

function SpecIcon({ type, className = "h-4 w-4" }: { type: string; className?: string }): React.ReactElement {
  switch (type) {
    case 'os':
      return <Monitor className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'ram':
      return <HardDrive className={className} />;
    case 'gpu':
      return <Gamepad2 className={className} />;
    case 'storage':
      return <HardDrive className={className} />;
    case 'directx':
      return <Zap className={className} />;
    case 'sound':
      return <Volume2 className={className} />;
    case 'network':
      return <Wifi className={className} />;
    default:
      return <Settings className={className} />;
  }
}

function SystemRequirementsSection({ requirements }: { requirements: SystemRequirementDto[] }): React.ReactElement {
  const [activeOS, setActiveOS] = useState(requirements[0]?.system ?? 'windows');
  const [showOptimal, setShowOptimal] = useState(false);

  if (requirements.length === 0) return <></>;

  const currentReq = requirements.find(r => r.system === activeOS);
  
  // Debug logging - remove in production
  console.info('SystemRequirements DEBUG:', {
    currentReq,
    requirement0: currentReq?.requirement?.[0],
    requirement1: currentReq?.requirement?.[1],
    requirementLength: currentReq?.requirement?.length,
    fullRequirement: currentReq?.requirement
  });
  
  const minSpecs = currentReq?.requirement?.[0] !== undefined && currentReq.requirement[0].trim() !== '' 
    ? parseSystemRequirements(currentReq.requirement[0]) 
    : [];
  const recSpecs = currentReq?.requirement?.[1] !== undefined && currentReq.requirement[1].trim() !== '' 
    ? parseSystemRequirements(currentReq.requirement[1]) 
    : [];
  const hasOptimal = recSpecs.length > 0 && recSpecs.some(s => s.value.trim() !== '');
  const displaySpecs = showOptimal && hasOptimal ? recSpecs : minSpecs;
  
  console.info('Parsed specs DEBUG:', { minSpecs, recSpecs, hasOptimal, showOptimal, displaySpecs });

  return (
    <div className={`rounded-2xl overflow-hidden ${GLASS_PANEL}`}>
      {/* Header with OS Selector */}
      <div className="p-5 border-b border-white/5 bg-linear-to-r from-purple-500/5 via-transparent to-cyan-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20">
              <Cpu className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">System Requirements</h3>
              <p className="text-xs text-zinc-500">Hardware specifications</p>
            </div>
          </div>
          
          {/* OS Pills */}
          <div className="flex gap-2">
            {requirements.map((req) => (
              <button
                key={req.system}
                onClick={() => setActiveOS(req.system ?? 'windows')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${activeOS === req.system 
                    ? 'bg-linear-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/20' 
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }
                `}
              >
                {req.system === 'windows' && <Monitor className="h-4 w-4" />}
                {req.system === 'mac' && <Monitor className="h-4 w-4" />}
                {req.system === 'linux' && <Monitor className="h-4 w-4" />}
                <span className="capitalize">{req.system}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Toggle: Required vs Optimal */}
      {hasOptimal && (
        <div className="px-5 py-3 border-b border-white/5 bg-black/20">
          <div className="flex items-center justify-center gap-1 p-1 bg-black/40 rounded-full max-w-xs mx-auto border border-white/5">
            <button
              onClick={() => setShowOptimal(false)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${!showOptimal 
                  ? 'bg-amber-500/20 text-amber-400 shadow-inner' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              <Shield className="h-4 w-4" />
              <span>Required</span>
            </button>
            <button
              onClick={() => setShowOptimal(true)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${showOptimal 
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-inner' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              <Zap className="h-4 w-4" />
              <span>Optimal</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Specs Grid - Modern Card Layout */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displaySpecs.map((spec, i) => (
            <div 
              key={i}
              className={`
                group relative p-4 rounded-xl border transition-all duration-300
                ${showOptimal 
                  ? 'bg-linear-to-br from-cyan-500/5 to-transparent border-cyan-500/10 hover:border-cyan-500/30' 
                  : 'bg-linear-to-br from-amber-500/5 to-transparent border-amber-500/10 hover:border-amber-500/30'
                }
              `}
            >
              {/* Icon Badge */}
              <div className={`
                absolute -top-2 -left-2 p-2 rounded-lg shadow-lg
                ${showOptimal 
                  ? 'bg-linear-to-br from-cyan-500 to-cyan-600' 
                  : 'bg-linear-to-br from-amber-500 to-amber-600'
                }
              `}>
                <SpecIcon type={spec.icon} className="h-3.5 w-3.5 text-white" />
              </div>
              
              {/* Spec Content */}
              <div className="ml-4">
                <span className={`
                  text-[10px] uppercase tracking-widest font-bold
                  ${showOptimal ? 'text-cyan-400/70' : 'text-amber-400/70'}
                `}>
                  {spec.label}
                </span>
                <p className="text-sm text-zinc-200 mt-1 leading-relaxed">
                  {spec.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Info Footer */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <div className="flex items-center justify-center gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Required = Minimum to run</span>
            </div>
            {hasOptimal && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>Optimal = Best experience</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Loading & Error States ==========

function ProductPageSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 pt-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header breadcrumb skeleton */}
        <div className="flex gap-2 mb-8">
          <Skeleton className="h-4 w-16 bg-white/5 rounded" />
          <Skeleton className="h-4 w-4 bg-white/5 rounded" />
          <Skeleton className="h-4 w-24 bg-white/5 rounded" />
          <Skeleton className="h-4 w-4 bg-white/5 rounded" />
          <Skeleton className="h-4 w-32 bg-white/5 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image skeleton with glow effect */}
            <div className="relative">
              <Skeleton className="aspect-video w-full rounded-2xl bg-white/5" />
              <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-black/60 to-transparent" />
            </div>
            
            {/* Thumbnail gallery skeleton */}
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-20 w-32 shrink-0 rounded-lg bg-white/5" />
              ))}
            </div>

            {/* About section skeleton */}
            <div className={`${GLASS_PANEL} p-6 space-y-4`}>
              <Skeleton className="h-6 w-40 bg-white/5 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-white/5 rounded" />
                <Skeleton className="h-4 w-full bg-white/5 rounded" />
                <Skeleton className="h-4 w-3/4 bg-white/5 rounded" />
              </div>
            </div>

            {/* System requirements skeleton */}
            <div className={`${GLASS_PANEL} p-6 space-y-4`}>
              <Skeleton className="h-6 w-48 bg-white/5 rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 bg-white/5 rounded-full" />
                <Skeleton className="h-8 w-24 bg-white/5 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16 bg-white/5 rounded" />
                    <Skeleton className="h-4 w-full bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar purchase card skeleton */}
          <div className="space-y-6">
            {/* Title and platform badges */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 bg-cyan-500/10 rounded-full" />
                <Skeleton className="h-6 w-20 bg-purple-500/10 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full bg-white/5 rounded" />
              <Skeleton className="h-8 w-3/4 bg-white/5 rounded" />
            </div>

            {/* Purchase card skeleton */}
            <div className={`${GLASS_CARD} p-6 space-y-6`}>
              {/* Price skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-10 w-32 bg-white/5 rounded" />
                <Skeleton className="h-4 w-24 bg-white/5 rounded" />
              </div>

              {/* Trust badges skeleton */}
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 bg-white/5 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24 bg-white/5 rounded" />
                      <Skeleton className="h-3 w-32 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add to cart button skeleton */}
              <Skeleton className="h-12 w-full bg-cyan-500/20 rounded-lg" />

              {/* Crypto banner skeleton */}
              <Skeleton className="h-16 w-full bg-white/5 rounded-lg" />
            </div>

            {/* Metacritic skeleton */}
            <div className={`${GLASS_PANEL} p-4`}>
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 bg-white/5 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-white/5 rounded" />
                  <Skeleton className="h-3 w-32 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductErrorState({ onRetry }: { onRetry?: () => void }): React.ReactElement {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="text-center max-w-md space-y-6">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <Package className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Product Unavailable</h1>
          <p className="text-zinc-500">The item you are looking for has been moved or no longer exists.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/catalog">
            <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
              <ChevronLeft className="h-4 w-4" /> Catalog
            </Button>
          </Link>
          <Button onClick={onRetry} className="gap-2 bg-white text-black hover:bg-zinc-200">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

// ========== Main Page Component ==========

export default function ProductPage(): React.ReactElement {
  const params = useParams();
  const slug = params.id as string;
  const catalogClient = new CatalogApi(apiConfig);
  const [copied, setCopied] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const { data: product, isLoading, isError, refetch } = useQuery<ProductResponseDto>({
    queryKey: ['product', slug],
    queryFn: () => catalogClient.catalogControllerGetProduct({ slug }),
    enabled: Boolean(slug),
  });

  const handleShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { console.warn('Clipboard API failed'); }
  };

  if (isLoading) return <ProductPageSkeleton />;
  if (isError || product === null || product === undefined) return <ProductErrorState onRetry={refetch} />;

  const priceInDollars = parseFloat(product?.price ?? '0');
  
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-cyan-500/30 selection:text-cyan-100 pb-20">
      
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-6 pt-6 lg:pt-10 max-w-[1400px]">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <Link href="/catalog" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Catalog
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300 truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
          
          {/* LEFT COLUMN: Media & Description (Span 8) */}
          <div className="lg:col-span-8 space-y-8 lg:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            
            {/* Unified Media Gallery - Videos, Cover, Screenshots all together */}
            <MediaGallery 
              screenshots={product.screenshots}
              videos={product.videos}
              coverImage={product.imageUrl}
              productTitle={product.title}
              isPreorder={product.isPreorder}
            />

            {/* About This Game */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <FileText className="h-6 w-6 text-zinc-400" />
                  About the Game
                </h2>
                {product.metacriticScore !== null && product.metacriticScore !== undefined && product.metacriticScore > 0 && (
                   <MetacriticBadge score={product.metacriticScore} />
                )}
              </div>
              
              <div className={`p-6 lg:p-8 rounded-2xl ${GLASS_PANEL}`}>
                {product.description !== null && product.description !== undefined && product.description !== '' ? (
                  <div 
                    className="prose prose-invert prose-zinc max-w-none 
                      prose-headings:text-white prose-headings:font-bold 
                      prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-white prose-strong:font-semibold
                      leading-relaxed text-zinc-300/90"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-zinc-500 italic">No description available.</p>
                )}
              </div>
            </section>

            {/* Activation Details (if available) */}
            {product.activationDetails !== null && product.activationDetails !== undefined && product.activationDetails !== '' && (
              <div className={`p-6 rounded-xl space-y-3 ${GLASS_PANEL}`}>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-yellow-500" /> Activation
                </h3>
                <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {product.activationDetails}
                </div>
              </div>
            )}

             {/* System Requirements - At the bottom as per user request */}
             {product.systemRequirements !== null && product.systemRequirements !== undefined && product.systemRequirements.length > 0 && (
              <SystemRequirementsSection requirements={product.systemRequirements} />
            )}

            {/* Customer Reviews Section */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400" />
                Customer Reviews
              </h2>
              <div className={`rounded-2xl ${GLASS_PANEL} p-6 lg:p-8`}>
                <ProductReviews productId={product.id ?? ''} pageSize={5} />
              </div>
            </section>

            {/* Videos are now integrated into MediaGallery at the top */}
          </div>

          {/* RIGHT COLUMN: Sticky Purchase Sidebar (Span 4) */}
          <div className="lg:col-span-4 relative">
            <div className="lg:sticky lg:top-24 space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              
              {/* Product Title Header (Mobile only shows at top, desktop here) */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.platform !== null && product.platform !== undefined && product.platform !== '' && (
                    <Badge variant="outline" className="border-white/20 text-zinc-300 bg-white/5 backdrop-blur-md">
                      <Monitor className="h-3 w-3 mr-1.5" /> {product.platform}
                    </Badge>
                  )}
                  {product.category !== null && product.category !== undefined && product.category !== '' && (
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                      {product.category}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-white leading-[1.1] tracking-tight">
                  {product.title}
                </h1>
                {product.subtitle !== null && product.subtitle !== undefined && product.subtitle !== '' && (
                  <p className="text-lg text-zinc-400 font-medium">{product.subtitle}</p>
                )}
              </div>

              {/* Purchase Card */}
              <Card className="border-0 overflow-hidden shadow-2xl shadow-cyan-900/10 relative group">
                {/* Glow Effects */}
                <div className="absolute inset-0 bg-linear-to-b from-white/10 to-[#0A0A0B] backdrop-blur-xl" />
                <div className="absolute inset-0 border border-white/10 rounded-xl" />
                <div className="absolute -inset-1 bg-linear-to-br from-cyan-500/20 via-purple-500/20 to-transparent blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-700" />
                
                <CardContent className="relative p-6 space-y-6">
                  {/* Price Section */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-zinc-400 mb-1 font-medium">Total Price</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white tracking-tight">
                          €{priceInDollars.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button 
                      size="lg" 
                      className="w-full h-12 text-base font-bold bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => setIsEmailModalOpen(true)}
                    >
                      <Bitcoin className="h-5 w-5 mr-2" />
                      Buy Now
                    </Button>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-4">
                        <AddToCartButton
                          id={product.id ?? ''}
                          title={product.title ?? 'Product'}
                          price={priceInDollars}
                          image={product.imageUrl}
                        />
                      </div>
                      <div className="col-span-1">
                        <WatchlistButton
                          productId={product.id ?? ''}
                          productTitle={product.title ?? 'Product'}
                          variant="icon"
                          size="md"
                          className="h-11 w-full border border-white/10 hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trust Signals - PRD Requirement */}
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <TrustBadge
                      icon={<Zap className="h-4 w-4" />}
                      title="Instant Delivery"
                      description="Key delivered in seconds"
                      variant="success"
                    />
                    <TrustBadge
                      icon={<Lock className="h-4 w-4" />}
                      title="Secure Payment"
                      description="Encrypted checkout"
                      variant="info"
                    />
                    <TrustBadge
                      icon={<BadgeCheck className="h-4 w-4" />}
                      title="Official Distributor"
                      description="100% authentic keys"
                      variant="default"
                    />
                  </div>

                  {/* Crypto Payment Banner - PRD Requirement */}
                  <CryptoPaymentBanner />
                </CardContent>
              </Card>

              {/* Game Info Bento Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl space-y-1 ${GLASS_CARD}`}>
                  <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Release Date</div>
                  <div className="text-sm font-medium text-white truncate">
                    {product.releaseDate !== null && product.releaseDate !== undefined && product.releaseDate !== '' ? new Date(product.releaseDate).toLocaleDateString() : 'TBA'}
                  </div>
                </div>
                <div className={`p-4 rounded-xl space-y-1 ${GLASS_CARD}`}>
                  <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Developer</div>
                  <div className="text-sm font-medium text-white truncate" title={product.developers?.join(', ')}>
                    {product.developers?.[0] ?? 'Unknown'}
                  </div>
                </div>
                <div className={`p-4 rounded-xl space-y-1 ${GLASS_CARD}`}>
                  <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Publisher</div>
                  <div className="text-sm font-medium text-white truncate" title={product.publishers?.join(', ')}>
                    {product.publishers?.[0] ?? 'Unknown'}
                  </div>
                </div>
                <div className={`p-4 rounded-xl space-y-1 ${GLASS_CARD}`}>
                  <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Region</div>
                  <div className="text-sm font-medium text-white truncate flex items-center gap-1">
                    <Globe className="h-3 w-3 text-zinc-400" />
                    {product.region ?? 'Global'}
                  </div>
                </div>
                {product.regionalLimitations !== null && product.regionalLimitations !== undefined && product.regionalLimitations !== '' && (
                  <div className="col-span-2 p-4 rounded-xl space-y-1 bg-red-500/10 border border-red-500/20 backdrop-blur-xl">
                    <div className="text-xs text-red-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Limitations
                    </div>
                    <div className="text-sm font-medium text-red-200/80 line-clamp-2" title={product.regionalLimitations}>
                      {product.regionalLimitations}
                    </div>
                  </div>
                )}
              </div>

               {/* Tags */}
               {product.tags !== null && product.tags !== undefined && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-colors cursor-default">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share Button */}
               <button 
                onClick={handleShare}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                {copied ? 'Link Copied' : 'Share this product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Entry Modal */}
      <EmailEntryModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        productId={product.id ?? ''}
        productTitle={product.title ?? 'Product'}
        productPrice={priceInDollars.toFixed(2)}
        userEmail={user?.email}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
