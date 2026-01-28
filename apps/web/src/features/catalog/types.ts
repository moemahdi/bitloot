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

export type BusinessCategory = 'games' | 'software' | 'gift-cards' | 'subscriptions';

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
  category?: string;
  businessCategory?: BusinessCategory;
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

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'best_deals', label: 'Best Deals' },
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
    id: 'gift-cards', 
    label: 'Gift Cards', 
    description: 'Steam, PSN, Xbox & more',
    color: 'text-pink-featured',
  },
  { 
    id: 'subscriptions', 
    label: 'Subscriptions', 
    description: 'Game Pass, PS Plus & more',
    color: 'text-green-success',
  },
];

export const PLATFORMS: PlatformOption[] = [
  { id: 'Steam', label: 'Steam', color: 'text-blue-400' },
  { id: 'Origin', label: 'EA / Origin', color: 'text-orange-400' },
  { id: 'Uplay', label: 'Ubisoft', color: 'text-cyan-400' },
  { id: 'Xbox', label: 'Xbox', color: 'text-green-400' },
  { id: 'PlayStation', label: 'PlayStation', color: 'text-blue-500' },
  { id: 'Epic', label: 'Epic Games', color: 'text-slate-400' },
  { id: 'GOG', label: 'GOG', color: 'text-purple-400' },
  { id: 'Nintendo', label: 'Nintendo', color: 'text-red-400' },
];

export const REGIONS: RegionOption[] = [
  { id: 'Global', label: 'Global' },
  { id: 'EU', label: 'Europe' },
  { id: 'NA', label: 'North America' },
  { id: 'LATAM', label: 'Latin America' },
  { id: 'Asia', label: 'Asia' },
  { id: 'Other', label: 'Other Regions' },
];

export const PRICE_PRESETS: PriceRangeOption[] = [
  { min: 0, max: 10, label: 'Under €10' },
  { min: 10, max: 25, label: '€10 - €25' },
  { min: 25, max: 50, label: '€25 - €50' },
  { min: 50, max: 100, label: '€50 - €100' },
  { min: 100, max: 500, label: '€100+' },
];
