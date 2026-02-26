/**
 * Game Spotlight Types
 *
 * Type definitions for the spotlight feature components.
 * Maps to the ProductGroupWithProductsDto from the SDK.
 */

import type { ProductGroupWithProductsDto } from '@bitloot/sdk';

export type SpotlightGroup = ProductGroupWithProductsDto;

/**
 * Product variant for spotlight pages
 * Uses optional fields to support both API data and transformed data
 */
export interface SpotlightProduct {
  id: string;
  title: string;
  slug: string;
  platform?: string;
  region?: string;
  subtitle?: string;
  price: string;
  currency: string;
  coverImageUrl?: string;
  rating?: number;
  isPublished?: boolean;
  sourceType?: string;
}

/**
 * FAQ item for spotlight pages
 */
export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Spotlight hero props
 */
export interface SpotlightHeroProps {
  title: string;
  tagline?: string;
  coverImageUrl?: string;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  accentColor?: string;
  badgeText?: string;
  releaseDate?: string;
  metacriticScore?: number;
  developerName?: string;
  publisherName?: string;
  genres?: string[];
  minPrice?: string;
  maxPrice?: string;
  onWatchTrailer?: () => void;
  onBuyNow?: () => void;
}

/**
 * Edition selector props
 */
export interface EditionSelectorProps {
  products: SpotlightProduct[];
  selectedPlatform?: string;
  onSelectProduct: (product: SpotlightProduct) => void;
}

/**
 * Platform grid props
 */
export interface PlatformGridProps {
  products: SpotlightProduct[];
  selectedPlatform?: string;
  onSelectPlatform: (platform: string | undefined) => void;
}

/**
 * Platform tab item
 */
export interface PlatformTab {
  id: string;
  label: string;
  icon?: string;
  count: number;
}

/**
 * Countdown timer props
 */
export interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}

/**
 * Feature highlight props
 */
export interface FeatureHighlightsProps {
  features: string[];
  accentColor?: string;
}

/**
 * FAQ section props
 */
export interface FaqSectionProps {
  items: FaqItem[];
  accentColor?: string;
}

/**
 * Video embed modal props
 */
export interface VideoModalProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
}
