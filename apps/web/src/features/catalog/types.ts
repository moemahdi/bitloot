/**
 * BitLoot Catalog Types
 * 
 * Comprehensive type definitions for the catalog page redesign.
 * Based on catalog_prd.md specifications.
 */

// ============================================================================
// FILTER TYPES
// ============================================================================

export type SortOption = 
  | 'newest' 
  | 'price_asc' 
  | 'price_desc' 
  | 'popular' 
  | 'trending' 
  | 'rating' 
  | 'best_deals';

export type ViewMode = 'grid' | 'list' | 'compact';

export type BusinessCategory = 'games' | 'software' | 'subscriptions';

export interface FilterState {
  search: string;
  businessCategory: BusinessCategory | null;
  genre: string; // Genre filter (action, rpg, fps, etc.)
  platform: string[];
  region: string;
  minPrice: number;
  maxPrice: number;
  sortBy: SortOption;
  viewMode: ViewMode;
  itemsPerPage: 24 | 48 | 96;
  page: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<FilterState>;
  createdAt: Date;
}

export interface ActiveFilter {
  type: 'businessCategory' | 'genre' | 'platform' | 'region' | 'price' | 'search';
  label: string;
  value: string;
  removeAction: () => void;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export type ProductVariant = 'default' | 'featured' | 'trending' | 'bundle' | 'flash-deal';

export type StockStatus = 'in' | 'low' | 'out' | 'preorder';

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  image?: string;
  platform?: string;
  platforms?: string[];
  region?: string;
  detectedRegions?: string[]; // Regions detected from title for filtering
  genre?: string; // Kinguin genre (Action, RPG, etc.)
  category?: string; // Alias for genre (deprecated, use genre)
  businessCategory?: BusinessCategory; // BitLoot store section (games/software/subscriptions)
  discount?: number;
  originalPrice?: string;
  stock?: number;
  isAvailable?: boolean;
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  viewerCount?: number; // For "X people viewing" badge
  salesCount?: number;
  createdAt?: string;
  variant?: ProductVariant;
  flashDealEndsAt?: Date; // End time for flash deals
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface CatalogUIState {
  isLoading: boolean;
  isFiltering: boolean;
  isMobileFilterOpen: boolean;
  isSearchFocused: boolean;
  error: Error | null;
}

export interface CatalogPageState {
  filters: FilterState;
  products: CatalogProduct[];
  totalCount: number;
  totalPages: number;
  ui: CatalogUIState;
  savedPresets: FilterPreset[];
  recentlyViewed: CatalogProduct[];
  recentSearches: string[];
}

// ============================================================================
// HERO SECTION TYPES
// ============================================================================

export interface HeroSection {
  id: string;
  title: string;
  subtitle: string;
  backgroundType: 'gradient' | 'image' | 'video';
  backgroundValue: string;
  accentColor: 'cyan' | 'purple' | 'pink' | 'green';
  ctaText: string;
  ctaLink: string;
  countdown?: {
    endsAt: Date;
    showTimer: boolean;
  };
  isActive: boolean;
}

// ============================================================================
// CATEGORY & FILTER OPTION TYPES
// ============================================================================

export interface CategoryOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  count?: number;
  color?: string;
}

export interface PlatformOption {
  id: string;
  label: string;
  count?: number;
  color?: string;
}

export interface RegionOption {
  id: string;
  label: string;
  count?: number;
}

export interface PriceRangeOption {
  min: number;
  max: number;
  label: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface CatalogAnalyticsEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
  timestamp: Date;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  platforms: PlatformOption[];
  regions: RegionOption[];
  priceRange: { min: number; max: number };
  savedPresets: FilterPreset[];
  onSavePreset: (name: string) => void;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (presetId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export interface ProductCardProps {
  product: CatalogProduct;
  variant?: ProductVariant;
  isLoading?: boolean;
  isAboveFold?: boolean;
  onAddToCart?: (product: CatalogProduct) => void;
  onQuickBuy?: (product: CatalogProduct) => void;
  onQuickView?: (product: CatalogProduct) => void;
  onAddToWishlist?: (product: CatalogProduct) => void;
}

export interface ProductGridProps {
  products: CatalogProduct[];
  isLoading: boolean;
  viewMode: ViewMode;
  columns?: 1 | 2 | 3 | 4;
  skeletonCount?: number;
  onProductClick?: (product: CatalogProduct) => void;
  onAddToCart?: (product: CatalogProduct) => void;
  onQuickBuy?: (product: CatalogProduct) => void;
}

export interface ToolbarProps {
  totalCount: number;
  activeFilters: ActiveFilter[];
  sortBy: SortOption;
  viewMode: ViewMode;
  itemsPerPage: 24 | 48 | 96;
  isLoading?: boolean;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onItemsPerPageChange: (count: 24 | 48 | 96) => void;
  onClearAllFilters: () => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export interface CategoryTabsProps {
  activeCategory: BusinessCategory | null;
  onCategoryChange: (category: BusinessCategory | null) => void;
  categoryCounts?: Record<BusinessCategory, number>;
}

export interface EmptyStateProps {
  type: 'no-results' | 'error' | 'empty';
  filters?: FilterState;
  error?: Error;
  onClearFilters?: () => void;
  onRetry?: () => void;
  onBrowseAll?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  businessCategory: null,
  genre: '',
  platform: [],
  region: '',
  minPrice: 0,
  maxPrice: 500,
  sortBy: 'newest',
  viewMode: 'grid',
  itemsPerPage: 24,
  page: 1,
};

export const SORT_OPTIONS: { value: SortOption; label: string; description?: string }[] = [
  { value: 'newest', label: 'New Arrivals', description: 'Latest products first' },
  { value: 'trending', label: 'Trending', description: 'Hot right now' },
  { value: 'popular', label: 'Most Popular', description: 'Top rated & reviewed' },
  { value: 'best_deals', label: 'Best Deals', description: 'Biggest savings' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export const ITEMS_PER_PAGE_OPTIONS: (24 | 48 | 96)[] = [24, 48, 96];

export const BUSINESS_CATEGORIES: CategoryOption[] = [
  { 
    id: 'games', 
    label: 'Games', 
    description: 'PC & Console game keys',
    color: 'text-cyan-glow',
  },
  { 
    id: 'software', 
    label: 'Software', 
    description: 'Windows, Office & more',
    color: 'text-purple-neon',
  },
  { 
    id: 'subscriptions', 
    label: 'Subscriptions', 
    description: 'Game Pass, PS Plus & more',
    color: 'text-green-success',
  },
];

export const PLATFORMS: PlatformOption[] = [
  { id: 'steam', label: 'Steam', color: 'text-blue-400' },
  { id: 'origin', label: 'EA / Origin', color: 'text-orange-400' },
  { id: 'uplay', label: 'Ubisoft', color: 'text-cyan-400' },
  { id: 'xbox', label: 'Xbox', color: 'text-green-400' },
  { id: 'playstation', label: 'PlayStation', color: 'text-blue-500' },
  { id: 'epic', label: 'Epic Games', color: 'text-slate-400' },
  { id: 'gog', label: 'GOG', color: 'text-purple-400' },
  { id: 'nintendo', label: 'Nintendo', color: 'text-red-400' },
  { id: 'android', label: 'Android', color: 'text-green-500' },
  { id: 'pc', label: 'PC', color: 'text-gray-400' },
  { id: 'rockstar', label: 'Rockstar Games', color: 'text-yellow-500' },
];

// Game genres from database - IDs are lowercase for backend matching
export interface GenreOption {
  id: string;
  label: string;
  color: string;
}

export const GENRES: GenreOption[] = [
  { id: 'action', label: 'Action', color: 'text-red-400' },
  { id: 'adventure', label: 'Adventure', color: 'text-green-400' },
  { id: 'rpg', label: 'RPG', color: 'text-purple-400' },
  { id: 'simulation', label: 'Simulation', color: 'text-blue-400' },
  { id: 'strategy', label: 'Strategy', color: 'text-yellow-400' },
  { id: 'racing', label: 'Racing', color: 'text-orange-400' },
  { id: 'sport', label: 'Sports', color: 'text-green-500' },
  { id: 'casual', label: 'Casual', color: 'text-pink-400' },
  { id: 'indie', label: 'Indie', color: 'text-cyan-400' },
  { id: 'mmo', label: 'MMO', color: 'text-blue-500' },
  { id: 'fps', label: 'FPS', color: 'text-red-500' },
  { id: 'survival', label: 'Survival', color: 'text-amber-400' },
  { id: 'open world', label: 'Open World', color: 'text-emerald-400' },
  { id: 'anime', label: 'Anime', color: 'text-pink-500' },
  { id: 'co-op', label: 'Co-op', color: 'text-violet-400' },
  { id: 'story rich', label: 'Story Rich', color: 'text-indigo-400' },
  { id: 'vr games', label: 'VR Games', color: 'text-fuchsia-400' },
];

export const REGIONS: RegionOption[] = [
  { id: 'global', label: 'Global / Region Free' },
  { id: 'eu', label: 'Europe (EU)' },
  { id: 'na', label: 'North America (US/NA)' },
  { id: 'uk', label: 'United Kingdom (UK)' },
  { id: 'row', label: 'Rest of World (RoW)' },
  { id: 'latam', label: 'Latin America' },
  { id: 'asia', label: 'Asia' },
];

// ============================================================================
// REGION DETECTION - HYBRID APPROACH (DATABASE + TITLE)
// ============================================================================

/**
 * Maps database region values to our filter IDs
 * Includes Kinguin "Region X" numeric codes based on their regionalLimitations
 */
const DB_REGION_MAP: Record<string, string> = {
  // Direct matches
  'global': 'global',
  'worldwide': 'global',
  'region free': 'global',
  
  // Europe
  'europe': 'eu',
  'eu': 'eu',
  'region 75': 'eu', // Kinguin: EUROPE
  
  // North America
  'north america': 'na',
  'na': 'na',
  'us': 'na',
  'usa': 'na',
  'united states': 'na',
  'americas': 'na',
  'region 74': 'na', // Kinguin: AMERICAS
  
  // UK
  'uk': 'uk',
  'united kingdom': 'uk',
  
  // Asia
  'asia': 'asia',
  
  // Latin America
  'latam': 'latam',
  'latin america': 'latam',
  'south america': 'latam',
  
  // Rest of World
  'row': 'row',
  'rest of world': 'row',
  'rest of the world': 'row',
  'region 80': 'row', // Kinguin: REST OF THE WORLD
  'region 10': 'row', // Kinguin: Rest of the world (RoW) - custom
  
  // Region Free (treated as global)
  'region 101': 'global', // Kinguin: REGION FREE
};

/**
 * Detects region from product using BOTH database region field AND title patterns.
 * This hybrid approach provides more robust filtering.
 * 
 * @param title - Product title to check for region codes
 * @param dbRegion - Region field from database (e.g., "North America", "Europe")
 * @param regionalLimitations - Regional limitations field (e.g., "REGION FREE")
 * @returns Array of detected region IDs for filtering
 */
export function detectRegionFromTitle(
  title: string, 
  dbRegion?: string | null,
  regionalLimitations?: string | null
): string[] {
  const detectedRegions: string[] = [];
  
  // === STEP 1: Check database region field ===
  if (dbRegion) {
    const normalizedDbRegion = dbRegion.toLowerCase().trim();
    const mappedRegion = DB_REGION_MAP[normalizedDbRegion];
    if (mappedRegion) {
      detectedRegions.push(mappedRegion);
    }
  }
  
  // === STEP 2: Check regional limitations (often more reliable than region field) ===
  if (regionalLimitations) {
    const limitations = regionalLimitations.toLowerCase();
    
    // Region free / worldwide
    if (limitations.includes('region free') || limitations.includes('worldwide') || limitations.includes('global')) {
      if (!detectedRegions.includes('global')) {
        detectedRegions.push('global');
      }
    }
    
    // Rest of World
    if (limitations.includes('rest of the world') || limitations.includes('row')) {
      if (!detectedRegions.includes('row')) {
        detectedRegions.push('row');
      }
    }
    
    // Europe
    if (limitations === 'europe' || limitations.includes('eu only')) {
      if (!detectedRegions.includes('eu')) {
        detectedRegions.push('eu');
      }
    }
    
    // Americas / North America
    if (limitations === 'americas' || limitations.includes('na only') || limitations.includes('us only')) {
      if (!detectedRegions.includes('na')) {
        detectedRegions.push('na');
      }
    }
    
    // Asia
    if (limitations === 'asia' || limitations.includes('asia only')) {
      if (!detectedRegions.includes('asia')) {
        detectedRegions.push('asia');
      }
    }
  }
  
  // === STEP 3: Check title patterns for more specific region info ===
  // EU patterns
  if (
    / EU /i.test(title) ||
    / EU\//i.test(title) ||
    /\/EU /i.test(title) ||
    /EU PC/i.test(title) ||
    /EU PS/i.test(title) ||
    /EU Xbox/i.test(title) ||
    /EU Key/i.test(title) ||
    /EU Steam/i.test(title) ||
    /EU Ubisoft/i.test(title) ||
    /EU Epic/i.test(title) ||
    /EU Nintendo/i.test(title) ||
    /EU EA/i.test(title) ||
    /\(EU\)/i.test(title) ||
    /\[EU\]/i.test(title)
  ) {
    if (!detectedRegions.includes('eu')) {
      detectedRegions.push('eu');
    }
  }
  
  // US/NA patterns
  if (
    / US /i.test(title) ||
    / US\//i.test(title) ||
    /\/US /i.test(title) ||
    /US PC/i.test(title) ||
    /US PS/i.test(title) ||
    /US Xbox/i.test(title) ||
    /US Key/i.test(title) ||
    /\(US\)/i.test(title) ||
    /\[US\]/i.test(title) ||
    / NA /i.test(title) ||
    /NA PS/i.test(title) ||
    /NA Steam/i.test(title) ||
    /NA Xbox/i.test(title) ||
    /\(NA\)/i.test(title) ||
    /\[NA\]/i.test(title)
  ) {
    if (!detectedRegions.includes('na')) {
      detectedRegions.push('na');
    }
  }
  
  // UK patterns
  if (
    / UK /i.test(title) ||
    /UK Key/i.test(title) ||
    /\(UK\)/i.test(title) ||
    /\[UK\]/i.test(title)
  ) {
    if (!detectedRegions.includes('uk')) {
      detectedRegions.push('uk');
    }
  }
  
  // RoW (Rest of World) patterns
  if (
    / RoW/i.test(title) ||
    /RoW /i.test(title) ||
    /\(RoW\)/i.test(title) ||
    /\[RoW\]/i.test(title)
  ) {
    if (!detectedRegions.includes('row')) {
      detectedRegions.push('row');
    }
  }
  
  // LATAM patterns
  if (
    /LATAM/i.test(title) ||
    /Latin America/i.test(title) ||
    /Argentina/i.test(title) ||
    /Brazil/i.test(title) ||
    /Mexico/i.test(title)
  ) {
    if (!detectedRegions.includes('latam')) {
      detectedRegions.push('latam');
    }
  }
  
  // Asia patterns
  if (
    / Asia/i.test(title) ||
    /Asia /i.test(title) ||
    /\/ASIA/i.test(title) ||
    /ASIA\//i.test(title) ||
    /\(Asia\)/i.test(title) ||
    /\[Asia\]/i.test(title) ||
    /EU\/ASIA/i.test(title)
  ) {
    if (!detectedRegions.includes('asia')) {
      detectedRegions.push('asia');
    }
  }
  
  // === STEP 4: Account products are region-free ===
  // Check AFTER other detections, as accounts can still have regional versions
  if (detectedRegions.length === 0) {
    if (/Account/i.test(title) || /Online Account/i.test(title) || /Account Activation/i.test(title)) {
      detectedRegions.push('global');
    }
  }
  
  // === STEP 5: If still nothing detected, mark as global ===
  if (detectedRegions.length === 0) {
    detectedRegions.push('global');
  }
  
  return [...new Set(detectedRegions)]; // Remove duplicates
}

export const PRICE_PRESETS: PriceRangeOption[] = [
  { min: 0, max: 10, label: 'Under €10' },
  { min: 10, max: 25, label: '€10 - €25' },
  { min: 25, max: 50, label: '€25 - €50' },
  { min: 50, max: 100, label: '€50 - €100' },
  { min: 100, max: 500, label: '€100+' },
];
