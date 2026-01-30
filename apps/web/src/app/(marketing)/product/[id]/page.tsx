'use client';

import { useParams, useRouter } from 'next/navigation';
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
  Volume2, Wifi, Settings, Gamepad2, Shield, Star,
  Flame, Minus, Plus, ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductReviews } from '@/features/reviews';
import { WatchlistButton } from '@/features/watchlist';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { useState, useCallback, useEffect } from 'react';

// ========== Design Constants & Utilities (BitLoot Design System) ==========

const GLASS_PANEL = "bg-bg-secondary/80 backdrop-blur-xl border border-border-subtle shadow-card-lg";
const GLASS_CARD = "bg-bg-tertiary/50 backdrop-blur-md border border-border-subtle hover:border-border-accent transition-all duration-300";

// ========== Currency Helper ==========

function getCurrencySymbol(currency?: string): string {
  const upperCurrency = currency !== null && currency !== undefined && currency !== '' 
    ? currency.toUpperCase() 
    : '';
  
  switch (upperCurrency) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'USD': return '$';
    case 'JPY': return '¥';
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    default: return currency ?? '€'; // Default to EUR
  }
}

// ========== Flash Deal Types ==========

interface FlashDealProductInfo {
  originalPrice?: string;
  discountPrice?: string;
  discountPercent?: string;
  productId: string;
}

interface ActiveFlashDealResponse {
  id: string;
  name: string;
  endsAt: string;
  products: FlashDealProductInfo[];
}

async function fetchActiveFlashDeal(): Promise<ActiveFlashDealResponse | null> {
  try {
    const response = await fetch(`${apiConfig.basePath}/public/marketing/flash-deal/active`);
    if (!response.ok) return null;
    return response.json() as Promise<ActiveFlashDealResponse>;
  } catch {
    return null;
  }
}

// ========== Component: Trust Badge (PRD Requirement) ==========

type TrustBadgeVariant = 'default' | 'success' | 'warning' | 'info';

interface TrustBadgeProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  variant?: TrustBadgeVariant;
}

const TRUST_BADGE_VARIANTS: Record<TrustBadgeVariant, string> = {
  default: 'border-border-subtle bg-bg-tertiary/50',
  success: 'border-green-success/30 bg-green-success/10',
  warning: 'border-orange-warning/30 bg-orange-warning/10',
  info: 'border-cyan-glow/30 bg-cyan-glow/10',
};

const TRUST_BADGE_ICON_VARIANTS: Record<TrustBadgeVariant, string> = {
  default: 'text-text-secondary',
  success: 'text-green-success',
  warning: 'text-orange-warning',
  info: 'text-cyan-glow',
};

function TrustBadge({ icon, title, description, variant = 'default' }: TrustBadgeProps): React.ReactElement {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${TRUST_BADGE_VARIANTS[variant]} transition-all duration-300 hover:bg-bg-tertiary/80`}>
      <div className={`shrink-0 mt-0.5 ${TRUST_BADGE_ICON_VARIANTS[variant]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description != null && description.length > 0 && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ========== Component: Crypto Payment Banner (PRD Requirement) ==========

function CryptoPaymentBanner(): React.ReactElement {
  const cryptos = [
    { icon: Bitcoin, name: 'BTC', color: 'text-orange-warning' },
    { icon: Wallet, name: 'ETH', color: 'text-purple-neon' },
    { icon: Wallet, name: 'USDT', color: 'text-green-success' },
  ];

  return (
    <div className="bg-linear-to-r from-cyan-glow/10 via-purple-neon/10 to-pink-featured/10 border border-cyan-glow/20 rounded-xl p-4 hover:border-cyan-glow/40 transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-4 w-4 text-cyan-glow" />
        <span className="text-sm font-semibold text-text-primary">Pay with Crypto</span>
      </div>
      <p className="text-xs text-text-secondary mb-3">
        Instant key delivery after payment confirmation
      </p>
      <div className="flex items-center gap-4">
        {cryptos.map((crypto) => (
          <div key={crypto.name} className="flex items-center gap-1.5">
            <crypto.icon className={`h-4 w-4 ${crypto.color}`} />
            <span className="text-xs font-medium text-text-secondary">{crypto.name}</span>
          </div>
        ))}
        <span className="text-xs text-text-muted">+300 more</span>
      </div>
    </div>
  );
}

// ========== Component: Account Product Warning ==========

function AccountProductWarning(): React.ReactElement {
  return (
    <div className="bg-orange-warning/10 border border-orange-warning/30 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-warning shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-orange-warning">
            Account Product – Not a Key
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            This is <strong className="text-text-primary">not a product key</strong>. A <strong className="text-text-primary">new account</strong> will be created for you with the purchased content already activated. Log in using the credentials provided in your Inventory after purchase.
          </p>
        </div>
      </div>
      
      <div className="border-t border-orange-warning/20 pt-3 space-y-2">
        <p className="text-xs font-medium text-text-primary flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-warning" />
          Important – Do NOT:
        </p>
        <ul className="text-xs text-text-secondary space-y-1.5 ml-5">
          <li className="flex items-start gap-2">
            <span className="text-orange-warning">•</span>
            <span>Add payment methods to the account</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-warning">•</span>
            <span>Change the account region</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-warning">•</span>
            <span>Make additional purchases on the account</span>
          </li>
        </ul>
        <p className="text-xs text-orange-warning/80 italic mt-2">
          Violating these rules may result in the account being banned. No refunds apply in such cases.
        </p>
      </div>
    </div>
  );
}

// ========== Component: Quantity Selector (Enhanced) ==========

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  disabled?: boolean;
  unitPrice: number;
  currencySymbol: string;
}

function QuantitySelector({ 
  quantity, 
  onQuantityChange, 
  min = 1,
  disabled = false,
  unitPrice,
  currencySymbol,
}: QuantitySelectorProps): React.ReactElement {
  const decrease = (): void => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const increase = (): void => {
    onQuantityChange(quantity + 1);
  };

  const totalPrice = unitPrice * quantity;

  return (
    <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-subtle space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">Select Quantity</span>
      </div>
      
      {/* Quantity Controls Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Stepper */}
        <div className="flex items-center bg-bg-primary/60 rounded-xl p-1 border border-border-subtle">
          <button
            type="button"
            onClick={decrease}
            disabled={disabled || quantity <= min}
            className="h-10 w-10 flex items-center justify-center rounded-lg text-text-secondary hover:bg-purple-neon/20 hover:text-purple-neon transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="h-10 w-16 flex items-center justify-center text-text-primary font-bold text-xl tabular-nums select-none">
            {quantity}
          </div>
          <button
            type="button"
            onClick={increase}
            disabled={disabled}
            className="h-10 w-10 flex items-center justify-center rounded-lg text-text-secondary hover:bg-purple-neon/20 hover:text-purple-neon transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Price Display */}
        <div className="flex-1 text-right">
          <div className="text-2xl font-bold text-text-primary tabular-nums">
            {currencySymbol}{totalPrice.toFixed(2)}
          </div>
          {quantity > 1 && (
            <div className="text-xs text-text-muted">
              {currencySymbol}{unitPrice.toFixed(2)} each
            </div>
          )}
        </div>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex gap-2">
        {[1, 2, 3, 5, 10].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onQuantityChange(num)}
            disabled={disabled}
            className={`
              flex-1 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
              ${quantity === num 
                ? 'bg-purple-neon/20 text-purple-neon border border-purple-neon/40' 
                : 'bg-bg-primary/40 text-text-muted border border-transparent hover:bg-bg-primary/60 hover:text-text-secondary'
              }
              disabled:opacity-30 disabled:cursor-not-allowed
            `}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}

// ========== Component: Metacritic Badge ==========

function MetacriticBadge({ score }: { score: number }): React.ReactElement {
  const getScoreData = (): { color: string; label: string; glow: string } => {
    if (score >= 75) return { color: 'bg-green-success', label: 'Must-Play', glow: 'shadow-glow-success' };
    if (score >= 50) return { color: 'bg-orange-warning', label: 'Mixed', glow: 'shadow-glow-error' };
    return { color: 'bg-destructive', label: 'Low', glow: '' };
  };

  const { color, label, glow } = getScoreData();

  return (
    <div className="flex items-center gap-3 group bg-bg-secondary/60 backdrop-blur-md p-1.5 pr-4 rounded-xl border border-border-subtle hover:border-border-accent transition-all duration-300">
      <div className={`h-10 w-10 rounded-lg ${color} ${glow} flex items-center justify-center font-bold text-white text-lg shadow-inner`}>
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
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border-subtle shadow-card-lg bg-bg-secondary flex items-center justify-center">
        <ImageIcon className="h-16 w-16 text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-cyan-glow" />
          Media Gallery
        </h3>
        <span className="text-xs font-medium text-text-muted bg-bg-tertiary px-2 py-1 rounded-md">
          {selectedIndex + 1} / {totalItems}
        </span>
      </div>

      {/* Main Display */}
      <div 
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border-subtle bg-bg-primary/50 group shadow-card-lg hover:border-cyan-glow/30 transition-all duration-300"
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
                <div className="absolute inset-0 flex items-center justify-center bg-bg-primary z-10">
                  <Loader2 className="h-8 w-8 text-cyan-glow animate-spin-glow" />
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
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                priority={selectedIndex === 0}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-bg-primary/90 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pre-order Badge */}
        {isPreorder === true && (
          <div className="absolute top-4 left-4 bg-orange-warning text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg shadow-orange-warning/25 flex items-center gap-1.5 z-20">
            <Clock className="h-4 w-4" /> Pre-Order
          </div>
        )}
        
        {/* Video/Image Type Indicator */}
        {currentItem?.type === 'video' && (
          <div className="absolute top-4 right-4 bg-pink-featured/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-pink-featured/25 flex items-center gap-1.5 z-20">
            <Play className="h-3 w-3 fill-current" /> Video
          </div>
        )}
        
        {/* Navigation Controls */}
        {totalItems > 1 && (
          <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="pointer-events-auto h-10 w-10 rounded-full bg-bg-primary/70 backdrop-blur-md border border-border-subtle flex items-center justify-center text-text-primary hover:bg-cyan-glow/20 hover:border-cyan-glow/50 hover:text-cyan-glow transition-all hover:scale-110 active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="pointer-events-auto h-10 w-10 rounded-full bg-bg-primary/70 backdrop-blur-md border border-border-subtle flex items-center justify-center text-text-primary hover:bg-cyan-glow/20 hover:border-cyan-glow/50 hover:text-cyan-glow transition-all hover:scale-110 active:scale-95 rotate-180"
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
                    ? 'ring-2 ring-cyan-glow ring-offset-2 ring-offset-bg-primary opacity-100 scale-105 shadow-glow-cyan-sm' 
                    : 'opacity-50 hover:opacity-100 hover:scale-105 hover:ring-1 hover:ring-border-accent'
                }`}
              >
                {item.type === 'video' ? (
                  <>
                    <Image
                      src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                      alt={item.title ?? 'Video thumbnail'}
                      fill
                      sizes="112px"
                      className="object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/40">
                      <div className="h-8 w-8 rounded-full bg-pink-featured flex items-center justify-center shadow-glow-pink">
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
                      sizes="112px"
                      className="object-contain"
                    />
                    {item.iscover === true && (
                      <div className="absolute bottom-1 left-1 bg-cyan-glow/90 text-bg-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
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
      <div className="p-5 border-b border-border-subtle bg-linear-to-r from-purple-neon/5 via-transparent to-cyan-glow/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-purple-neon/20 to-cyan-glow/20 border border-purple-neon/20">
              <Cpu className="h-5 w-5 text-purple-neon" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">System Requirements</h3>
              <p className="text-xs text-text-muted">Hardware specifications</p>
            </div>
          </div>
          
          {/* OS Pills */}
          <div className="flex gap-2">
            {requirements.map((req) => (
              <button
                key={req.system}
                onClick={() => setActiveOS(req.system ?? 'windows')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                  ${activeOS === req.system 
                    ? 'bg-linear-to-r from-purple-neon to-cyan-glow text-white shadow-lg shadow-purple-neon/25' 
                    : 'bg-bg-tertiary/80 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border border-border-subtle'
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
        <div className="px-5 py-3 border-b border-border-subtle bg-bg-primary/20">
          <div className="flex items-center justify-center gap-1 p-1 bg-bg-primary/40 rounded-full max-w-xs mx-auto border border-border-subtle">
            <button
              onClick={() => setShowOptimal(false)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${!showOptimal 
                  ? 'bg-orange-warning/20 text-orange-warning shadow-inner' 
                  : 'text-text-muted hover:text-text-secondary'
                }
              `}
            >
              <Shield className="h-4 w-4" />
              <span>Required</span>
            </button>
            <button
              onClick={() => setShowOptimal(true)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${showOptimal 
                  ? 'bg-cyan-glow/20 text-cyan-glow shadow-inner' 
                  : 'text-text-muted hover:text-text-secondary'
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
                  ? 'bg-linear-to-br from-cyan-glow/5 to-transparent border-cyan-glow/10 hover:border-cyan-glow/30' 
                  : 'bg-linear-to-br from-orange-warning/5 to-transparent border-orange-warning/10 hover:border-orange-warning/30'
                }
              `}
            >
              {/* Icon Badge */}
              <div className={`
                absolute -top-2 -left-2 p-2 rounded-lg shadow-lg
                ${showOptimal 
                  ? 'bg-linear-to-br from-cyan-glow to-cyan-glow/80' 
                  : 'bg-linear-to-br from-orange-warning to-orange-warning/80'
                }
              `}>
                <SpecIcon type={spec.icon} className="h-3.5 w-3.5 text-white" />
              </div>
              
              {/* Spec Content */}
              <div className="ml-4">
                <span className={`
                  text-[10px] uppercase tracking-widest font-bold
                  ${showOptimal ? 'text-cyan-glow/70' : 'text-orange-warning/70'}
                `}>
                  {spec.label}
                </span>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {spec.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Info Footer */}
        <div className="mt-5 pt-4 border-t border-border-subtle">
          <div className="flex items-center justify-center gap-6 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-warning" />
              <span>Required = Minimum to run</span>
            </div>
            {hasOptimal && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-glow" />
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
    <div className="min-h-screen bg-bg-primary text-text-primary p-6 pt-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header breadcrumb skeleton */}
        <div className="flex gap-2 mb-8">
          <Skeleton className="h-4 w-16 bg-bg-tertiary rounded" />
          <Skeleton className="h-4 w-4 bg-bg-tertiary rounded" />
          <Skeleton className="h-4 w-24 bg-bg-tertiary rounded" />
          <Skeleton className="h-4 w-4 bg-bg-tertiary rounded" />
          <Skeleton className="h-4 w-32 bg-bg-tertiary rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image skeleton with glow effect */}
            <div className="relative">
              <Skeleton className="aspect-video w-full rounded-2xl bg-bg-secondary" />
              <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-bg-primary/60 to-transparent" />
            </div>
            
            {/* Thumbnail gallery skeleton */}
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-20 w-32 shrink-0 rounded-lg bg-bg-tertiary" />
              ))}
            </div>

            {/* About section skeleton */}
            <div className={`${GLASS_PANEL} p-6 space-y-4`}>
              <Skeleton className="h-6 w-40 bg-bg-tertiary rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-bg-tertiary rounded" />
                <Skeleton className="h-4 w-full bg-bg-tertiary rounded" />
                <Skeleton className="h-4 w-3/4 bg-bg-tertiary rounded" />
              </div>
            </div>

            {/* System requirements skeleton */}
            <div className={`${GLASS_PANEL} p-6 space-y-4`}>
              <Skeleton className="h-6 w-48 bg-bg-tertiary rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 bg-bg-tertiary rounded-full" />
                <Skeleton className="h-8 w-24 bg-bg-tertiary rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16 bg-bg-tertiary rounded" />
                    <Skeleton className="h-4 w-full bg-bg-tertiary rounded" />
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
                <Skeleton className="h-6 w-16 bg-cyan-glow/10 rounded-full" />
                <Skeleton className="h-6 w-20 bg-purple-neon/10 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full bg-bg-tertiary rounded" />
              <Skeleton className="h-8 w-3/4 bg-bg-tertiary rounded" />
            </div>

            {/* Purchase card skeleton */}
            <div className={`${GLASS_CARD} p-6 space-y-6`}>
              {/* Price skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-10 w-32 bg-bg-tertiary rounded" />
                <Skeleton className="h-4 w-24 bg-bg-tertiary rounded" />
              </div>

              {/* Trust badges skeleton */}
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 bg-bg-tertiary rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24 bg-bg-tertiary rounded" />
                      <Skeleton className="h-3 w-32 bg-bg-tertiary rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add to cart button skeleton */}
              <Skeleton className="h-12 w-full bg-cyan-glow/20 rounded-lg" />

              {/* Crypto banner skeleton */}
              <Skeleton className="h-16 w-full bg-bg-tertiary rounded-lg" />
            </div>

            {/* Metacritic skeleton */}
            <div className={`${GLASS_PANEL} p-4`}>
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 bg-bg-tertiary rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-bg-tertiary rounded" />
                  <Skeleton className="h-3 w-32 bg-bg-tertiary rounded" />
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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="text-center max-w-md space-y-6">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
          <Package className="h-10 w-10 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Product Unavailable</h1>
          <p className="text-text-muted">The item you are looking for has been moved or no longer exists.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/catalog">
            <Button variant="outline" className="gap-2 border-border-subtle hover:bg-bg-tertiary">
              <ChevronLeft className="h-4 w-4" /> Catalog
            </Button>
          </Link>
          <Button onClick={onRetry} className="gap-2 bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 shadow-glow-cyan-sm">
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
  const router = useRouter();
  const slug = params.id as string;
  const catalogClient = new CatalogApi(apiConfig);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { user: _user, isAuthenticated: _isAuthenticated } = useAuth();
  const { buyNow, addItem, items } = useCart();

  const { data: product, isLoading, isError, refetch } = useQuery<ProductResponseDto>({
    queryKey: ['product', slug],
    queryFn: () => catalogClient.catalogControllerGetProduct({ slug }),
    enabled: Boolean(slug),
  });

  // Fetch active flash deal to check if this product has a discount
  const { data: activeFlashDeal } = useQuery<ActiveFlashDealResponse | null>({
    queryKey: ['public', 'marketing', 'flash-deal', 'active'],
    queryFn: fetchActiveFlashDeal,
    staleTime: 60_000,
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

  // Check if product is in active flash deal
  const flashDealProduct = activeFlashDeal?.products.find(p => p.productId === product.id);
  const isInFlashDeal = Boolean(flashDealProduct);
  
  // Calculate prices
  const originalPrice = parseFloat(product?.price ?? '0');
  const currencySymbol = getCurrencySymbol(product?.currency);
  
  // If in flash deal, use discounted price; otherwise use original price
  const displayPrice = isInFlashDeal && (flashDealProduct?.discountPrice != null && flashDealProduct.discountPrice !== '') 
    ? parseFloat(flashDealProduct.discountPrice)
    : isInFlashDeal && (flashDealProduct?.discountPercent != null && flashDealProduct.discountPercent !== '')
      ? originalPrice * (1 - parseFloat(flashDealProduct.discountPercent) / 100)
      : originalPrice;
  
  const discountPercent = (flashDealProduct?.discountPercent != null && flashDealProduct.discountPercent !== '') ? parseFloat(flashDealProduct.discountPercent) : 0;
  
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-cyan-glow/30 selection:text-cyan-glow pb-20">
      
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-neon/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-glow/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-6 pt-6 lg:pt-10 max-w-[1400px]">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <Link href="/catalog" className="hover:text-cyan-glow transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Catalog
          </Link>
          <span className="text-text-muted/50">/</span>
          <span className="text-text-primary truncate max-w-[200px]">{product.title}</span>
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
                 <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
                  <FileText className="h-6 w-6 text-text-muted" />
                  About the Game
                </h2>
                {product.metacriticScore !== null && product.metacriticScore !== undefined && product.metacriticScore > 0 && (
                   <MetacriticBadge score={product.metacriticScore} />
                )}
              </div>
              
              <div className={`p-6 lg:p-8 rounded-2xl ${GLASS_PANEL}`}>
                {product.description !== null && product.description !== undefined && product.description !== '' ? (
                  <div 
                    className="prose prose-invert max-w-none 
                      prose-headings:text-text-primary prose-headings:font-bold 
                      prose-a:text-cyan-glow prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-text-primary prose-strong:font-semibold
                      leading-relaxed text-text-secondary"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-text-muted italic">No description available.</p>
                )}
              </div>
            </section>

            {/* Activation Details (if available) */}
            {product.activationDetails !== null && product.activationDetails !== undefined && product.activationDetails !== '' && (
              <div className={`p-6 rounded-xl space-y-3 ${GLASS_PANEL}`}>
                <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
                  <Key className="h-5 w-5 text-orange-warning" /> Activation
                </h3>
                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
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
              <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
                <Star className="h-6 w-6 text-orange-warning" />
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
                    <Badge variant="outline" className="border-border-accent text-text-secondary bg-bg-tertiary/50 backdrop-blur-md">
                      <Monitor className="h-3 w-3 mr-1.5" /> {product.platform}
                    </Badge>
                  )}
                  {product.category !== null && product.category !== undefined && product.category !== '' && (
                    <Badge className="bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20">
                      {product.category}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-text-primary leading-[1.1] tracking-tight">
                  {product.title}
                </h1>
                {product.subtitle !== null && product.subtitle !== undefined && product.subtitle !== '' && (
                  <p className="text-lg text-text-secondary font-medium">{product.subtitle}</p>
                )}
              </div>

              {/* Purchase Card */}
              <Card className="border-0 overflow-hidden shadow-card-lg relative group">
                {/* Glow Effects */}
                <div className="absolute inset-0 bg-linear-to-b from-bg-tertiary/80 to-bg-secondary backdrop-blur-xl" />
                <div className="absolute inset-0 border border-border-subtle rounded-xl" />
                <div className="absolute -inset-1 bg-linear-to-br from-cyan-glow/20 via-purple-neon/20 to-transparent blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-700" />
                
                <CardContent className="relative p-6 space-y-5">
                  {/* Flash Sale Banner */}
                  {isInFlashDeal && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl">
                      <Flame className="h-5 w-5 text-yellow-400 animate-pulse" />
                      <span className="text-sm font-bold text-yellow-400">
                        Flash Sale: {discountPercent}% OFF
                      </span>
                      {isInFlashDeal && (
                        <Badge className="ml-auto bg-yellow-500 text-black font-bold text-xs px-2">
                          LIMITED
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Price Display - Only show when not in flash deal (quantity selector shows price) */}
                  {!isInFlashDeal && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-text-muted">Price per unit:</span>
                      <span className="text-lg font-semibold text-text-primary">
                        {currencySymbol}{displayPrice.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Flash Deal Original Price */}
                  {isInFlashDeal && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-muted">Was:</span>
                      <span className="text-lg text-text-muted line-through">
                        {currencySymbol}{originalPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-text-muted">Now:</span>
                      <span className="text-lg font-bold text-yellow-400">
                        {currencySymbol}{displayPrice.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Enhanced Quantity Selector */}
                  <QuantitySelector
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    min={1}
                    unitPrice={displayPrice}
                    currencySymbol={currencySymbol}
                  />

                  {/* Cart Status - Shows if item is already in cart */}
                  {(() => {
                    const cartItem = items.find(item => item.productId === product.id);
                    if (cartItem !== undefined && cartItem !== null && !justAdded) {
                      return (
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-cyan-glow/10 border border-cyan-glow/30">
                          <span className="text-sm text-cyan-glow flex items-center gap-2 font-medium">
                            <Check className="h-4 w-4" />
                            {cartItem.quantity} already in cart
                          </span>
                          <Link 
                            href="/cart" 
                            className="text-sm font-semibold text-cyan-glow hover:text-white transition-colors flex items-center gap-1"
                          >
                            View Cart
                            <ChevronLeft className="h-4 w-4 rotate-180" />
                          </Link>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    {/* Buy Now Button - Primary CTA */}
                    <Button 
                      size="lg" 
                      className={`w-full h-14 text-lg font-bold shadow-lg border-0 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        isInFlashDeal 
                          ? 'bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-yellow-500/30' 
                          : 'bg-linear-to-r from-cyan-glow to-purple-neon hover:from-cyan-glow/90 hover:to-purple-neon/90 text-white shadow-cyan-glow/30'
                      }`}
                      onClick={() => {
                        buyNow({
                          productId: product.id ?? '',
                          title: product.title ?? 'Product',
                          price: displayPrice,
                          quantity: quantity,
                          image: product.imageUrl,
                        });
                        router.push('/checkout');
                      }}
                    >
                      {isInFlashDeal ? <Flame className="h-5 w-5 mr-2" /> : <Bitcoin className="h-5 w-5 mr-2" />}
                      Buy Now • {currencySymbol}{(displayPrice * quantity).toFixed(2)}
                    </Button>

                    {/* Add to Cart + Watchlist Row */}
                    <div className="flex gap-2">
                      {/* Add to Cart Button */}
                      <Button
                        size="lg"
                        variant="outline"
                        disabled={isAddingToCart}
                        onClick={async () => {
                          if (isAddingToCart || justAdded) return;
                          setIsAddingToCart(true);
                          
                          // Brief delay for feedback
                          await new Promise(resolve => setTimeout(resolve, 200));
                          
                          addItem({
                            productId: product.id ?? '',
                            title: product.title ?? 'Product',
                            price: displayPrice,
                            quantity: quantity,
                            image: product.imageUrl,
                          });
                          
                          setIsAddingToCart(false);
                          setJustAdded(true);
                          
                          // Reset after 3 seconds
                          setTimeout(() => {
                            setJustAdded(false);
                            setQuantity(1); // Reset quantity after adding
                          }, 3000);
                        }}
                        className={`
                          flex-1 h-12 text-base font-semibold transition-all duration-200 rounded-xl
                          ${justAdded 
                            ? 'border-green-success bg-green-success/20 text-green-success shadow-glow-success' 
                            : 'border-purple-neon/60 bg-purple-neon/10 text-purple-neon hover:bg-purple-neon/20 hover:border-purple-neon hover:shadow-glow-purple-sm'
                          }
                          active:scale-[0.98]
                        `}
                      >
                        {isAddingToCart ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Adding...
                          </>
                        ) : justAdded ? (
                          <>
                            <Check className="mr-2 h-5 w-5" />
                            Added to Cart!
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                      
                      {/* Watchlist Button */}
                      <WatchlistButton
                        productId={product.id ?? ''}
                        productTitle={product.title ?? 'Product'}
                        variant="icon"
                        size="md"
                        className="h-12 w-12 shrink-0 rounded-xl border border-border-subtle bg-bg-tertiary/30 hover:bg-pink-featured/10 hover:text-pink-featured hover:border-pink-featured/50 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Trust Signals - PRD Requirement */}
                  <div className="pt-4 border-t border-border-subtle space-y-2">
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

                  {/* Account Product Warning - Show if game with "account" in title */}
                  {product.title?.toLowerCase().includes('account') && 
                   product.businessCategory?.toLowerCase() === 'games' && (
                    <AccountProductWarning />
                  )}

                  {/* Crypto Payment Banner - PRD Requirement */}
                  <CryptoPaymentBanner />
                </CardContent>
              </Card>

              {/* Game Info Bento Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl space-y-1 ${GLASS_CARD}`}>
                  <div className="text-xs text-text-muted font-semibold uppercase tracking-wider">Release Date</div>
                  <div className="text-sm font-medium text-text-primary truncate">
                    {product.releaseDate !== null && product.releaseDate !== undefined && product.releaseDate !== '' ? new Date(product.releaseDate).toLocaleDateString() : 'TBA'}
                  </div>
                </div>
                <div className={`p-4 rounded-xl space-y-1 ${GLASS_CARD}`}>
                  <div className="text-xs text-text-muted font-semibold uppercase tracking-wider">Developer</div>
                  <div className="text-sm font-medium text-text-primary truncate" title={product.developers?.join(', ')}>
                    {product.developers?.[0] ?? 'Unknown'}
                  </div>
                </div>
                <div className={`p-4 rounded-xl space-y-1 ${GLASS_CARD}`}>
                  <div className="text-xs text-text-muted font-semibold uppercase tracking-wider">Publisher</div>
                  <div className="text-sm font-medium text-text-primary truncate" title={product.publishers?.join(', ')}>
                    {product.publishers?.[0] ?? 'Unknown'}
                  </div>
                </div>
                <div className={`p-4 rounded-xl space-y-1 ${GLASS_CARD}`}>
                  <div className="text-xs text-text-muted font-semibold uppercase tracking-wider">Region</div>
                  <div className="text-sm font-medium text-text-primary truncate flex items-center gap-1">
                    <Globe className="h-3 w-3 text-text-muted" />
                    {product.region ?? 'Global'}
                  </div>
                </div>
                {product.regionalLimitations !== null && product.regionalLimitations !== undefined && product.regionalLimitations !== '' && (
                  <div className="col-span-2 p-4 rounded-xl space-y-1 bg-destructive/10 border border-destructive/20 backdrop-blur-xl">
                    <div className="text-xs text-destructive font-semibold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Limitations
                    </div>
                    <div className="text-sm font-medium text-destructive/80 line-clamp-2" title={product.regionalLimitations}>
                      {product.regionalLimitations}
                    </div>
                  </div>
                )}
              </div>

               {/* Tags */}
               {product.tags !== null && product.tags !== undefined && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-md bg-bg-tertiary/50 border border-border-subtle text-xs text-text-muted hover:text-text-primary hover:border-border-accent transition-colors cursor-default">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share Button */}
               <button 
                onClick={handleShare}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
              >
                {copied ? <Check className="h-4 w-4 text-green-success" /> : <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                {copied ? 'Link Copied' : 'Share this product'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
