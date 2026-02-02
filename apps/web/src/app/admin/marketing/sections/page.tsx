'use client';

/**
 * Admin Homepage Sections Management Page
 * 
 * Allows admin to:
 * - View all homepage sections (Trending, Featured Games, Software, etc.)
 * - Search available published products
 * - Assign/remove products from each section
 * - Reorder products within sections
 * 
 * Follows Level 5 admin page patterns with neon cyberpunk design
 */

import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  Gamepad2,
  Monitor,
  Repeat,
  Zap,
  LayoutGrid,
  Eye,
  ArrowUp,
  ArrowDown,
  Package,
  Sparkles,
} from 'lucide-react';
import { Configuration, AdminCatalogProductsApi } from '@bitloot/sdk';
import type { AdminProductResponseDto } from '@bitloot/sdk';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// CONFIGURATION
// ============================================================================

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts[1];
    if (cookieValue !== undefined) {
      return cookieValue.split(';')[0] ?? null;
    }
  }
  return null;
}

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  accessToken: (): string => {
    if (typeof window !== 'undefined') {
      return getCookie('accessToken') ?? '';
    }
    return '';
  },
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Product = AdminProductResponseDto;

// Format price to always show 2 decimal places
function formatPrice(price: string | number | undefined): string {
  if (price === undefined || price === null || price === '') return '0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

interface SectionConfig {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  maxProducts: number;
}

// ============================================================================
// SECTION CONFIGURATION
// ============================================================================

const HOMEPAGE_SECTIONS: SectionConfig[] = [
  {
    key: 'trending',
    name: 'Trending Now',
    description: 'Top selling products displayed on homepage with pagination.',
    icon: TrendingUp,
    color: 'text-orange-warning',
    bgColor: 'bg-orange-warning/10',
    borderColor: 'border-orange-warning/30',
    maxProducts: 48,
  },
  {
    key: 'featured_games',
    name: 'Featured Games',
    description: 'Featured game keys shown in the Games tab.',
    icon: Gamepad2,
    color: 'text-cyan-glow',
    bgColor: 'bg-cyan-glow/10',
    borderColor: 'border-cyan-glow/30',
    maxProducts: 48,
  },
  {
    key: 'featured_software',
    name: 'Featured Software',
    description: 'Featured software products in the Software tab.',
    icon: Monitor,
    color: 'text-purple-neon',
    bgColor: 'bg-purple-neon/10',
    borderColor: 'border-purple-neon/30',
    maxProducts: 48,
  },
  {
    key: 'featured_subscriptions',
    name: 'Featured Subscriptions',
    description: 'Subscription services in the Subscriptions tab.',
    icon: Repeat,
    color: 'text-pink-featured',
    bgColor: 'bg-pink-featured/10',
    borderColor: 'border-pink-featured/30',
    maxProducts: 48,
  },
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchProducts(search: string): Promise<Product[]> {
  const api = new AdminCatalogProductsApi(apiConfig);
  const response = await api.adminProductsControllerListAll({
    search: search.trim() !== '' ? search.trim() : undefined,
    published: 'true',
    limit: '50',
  });
  return response.products;
}

async function fetchSectionProducts(sectionKey: string): Promise<Product[]> {
  const api = new AdminCatalogProductsApi(apiConfig);
  const response = await api.adminProductsControllerListAll({
    published: 'true',
    limit: '5000',
  });
  
  return response.products
    .filter((p) => {
      const sections = p.featuredSections ?? [];
      return sections.includes(sectionKey);
    })
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
}

async function addProductToSection(
  productId: string,
  sectionKey: string,
  currentSections: string[] | string | undefined,
  order: number
): Promise<void> {
  const api = new AdminCatalogProductsApi(apiConfig);
  let sections: string[] = [];
  if (Array.isArray(currentSections)) {
    sections = [...currentSections];
  } else if (typeof currentSections === 'string' && currentSections.length > 0) {
    sections = currentSections.split(',');
  }
  if (!sections.includes(sectionKey)) {
    sections.push(sectionKey);
  }
  await api.adminProductsControllerUpdate({
    id: productId,
    updateProductDto: { featuredSections: sections, featuredOrder: order },
  });
}

async function removeProductFromSection(
  productId: string,
  sectionKey: string,
  currentSections: string[] | string | undefined
): Promise<void> {
  const api = new AdminCatalogProductsApi(apiConfig);
  let sectionsArray: string[] = [];
  if (Array.isArray(currentSections)) {
    sectionsArray = [...currentSections];
  } else if (typeof currentSections === 'string' && currentSections.length > 0) {
    sectionsArray = currentSections.split(',');
  }
  const sections = sectionsArray.filter((s) => s !== sectionKey);
  await api.adminProductsControllerUpdate({
    id: productId,
    updateProductDto: { featuredSections: sections },
  });
}

async function updateProductOrder(productId: string, newOrder: number): Promise<void> {
  const api = new AdminCatalogProductsApi(apiConfig);
  await api.adminProductsControllerUpdate({
    id: productId,
    updateProductDto: { featuredOrder: newOrder },
  });
}

// ============================================================================
// PRODUCT SEARCH COMPONENT
// ============================================================================

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  excludeIds: string[];
  maxSelections?: number;
  currentCount: number;
}

function ProductSearch({
  onSelect,
  excludeIds,
  maxSelections = 48,
  currentCount,
}: ProductSearchProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const productsQuery = useQuery({
    queryKey: ['admin', 'products', 'search', debouncedQuery],
    queryFn: () => fetchProducts(debouncedQuery),
    staleTime: 30_000,
  });

  const filteredProducts = useMemo(() => {
    if (productsQuery.data === undefined || productsQuery.data === null) return [];
    return productsQuery.data.filter((p) => !excludeIds.includes(p.id));
  }, [productsQuery.data, excludeIds]);

  const canAddMore = currentCount < maxSelections;

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 h-9 bg-bg-tertiary border-border-subtle focus:border-cyan-glow/50 text-sm"
        />
      </div>

      {/* Max Products Warning */}
      {!canAddMore && (
        <Alert className="bg-orange-warning/5 border-orange-warning/20 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-orange-warning" />
          <AlertDescription className="text-orange-warning text-xs ml-2">
            Maximum of {maxSelections} products reached.
          </AlertDescription>
        </Alert>
      )}

      {/* Products List */}
      <div className="border border-border-subtle rounded-lg overflow-hidden bg-bg-tertiary/20 max-h-[200px] overflow-y-auto">
        {productsQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
          </div>
        ) : productsQuery.error !== null && productsQuery.error !== undefined ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-muted">
            <AlertCircle className="h-6 w-6 mb-2" />
            <p className="text-xs">Failed to load products</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-muted">
            <Search className="h-6 w-6 mb-2" />
            <p className="text-xs">No products found</p>
          </div>
        ) : (
          <div className="p-1.5 space-y-1">
            {filteredProducts.slice(0, 10).map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-bg-tertiary transition-colors"
              >
                {/* Product Image */}
                <div className="relative w-8 h-8 rounded overflow-hidden bg-bg-secondary shrink-0 border border-border-subtle">
                  {product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                    <Image
                      src={product.coverImageUrl}
                      alt={product.title}
                      fill
                      sizes="32px"
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs font-medium text-text-primary truncate">
                          {product.title}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{product.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex items-center gap-1.5">
                    {product.platform !== undefined && product.platform !== '' && (
                      <span className="text-[9px] text-text-muted">{product.platform}</span>
                    )}
                    <span className="text-[10px] text-green-success font-medium tabular-nums">
                      €{formatPrice(product.price)}
                    </span>
                  </div>
                </div>

                {/* Add Button */}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-cyan-glow hover:bg-cyan-glow/10 shrink-0"
                  disabled={!canAddMore}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.info('[ProductSearch] Add clicked, product:', product.id, product.title);
                    console.info('[ProductSearch] canAddMore:', canAddMore);
                    if (canAddMore) {
                      console.info('[ProductSearch] Calling onSelect...');
                      onSelect(product);
                    }
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION PRODUCT LIST COMPONENT
// ============================================================================

interface SectionProductListProps {
  products: Product[];
  onRemove: (product: Product) => void;
  onReorder: (product: Product, direction: 'up' | 'down') => void;
}

function SectionProductList({
  products,
  onRemove,
  onReorder,
}: SectionProductListProps): React.ReactElement {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted border border-dashed border-border-subtle rounded-xl bg-bg-tertiary/20">
        <Package className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm font-medium">No products in this section</p>
        <p className="text-xs mt-1">Search and add products above</p>
      </div>
    );
  }

  const sortedProducts = [...products].sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sortedProducts.map((product, index) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 p-2.5 bg-bg-tertiary rounded-lg border border-border-subtle hover:border-border-accent transition-colors"
          >
            {/* Order Number */}
            <span className="text-xs font-mono w-5 text-center font-semibold text-cyan-glow bg-cyan-glow/10 rounded py-0.5 shrink-0">
              {index + 1}
            </span>

            {/* Product Image */}
            <div className="relative w-9 h-9 rounded-md overflow-hidden bg-bg-secondary shrink-0 border border-border-subtle">
              {product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                <Image
                  src={product.coverImageUrl}
                  alt={product.title}
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-text-muted" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs font-medium text-text-primary truncate cursor-default">
                      {product.title}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">{product.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-1.5 mt-0.5">
                {product.platform !== undefined && product.platform !== '' && (
                  <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-bg-secondary">
                    {product.platform}
                  </Badge>
                )}
                <span className="text-[10px] text-green-success font-medium tabular-nums">
                  €{formatPrice(product.price)}
                </span>
              </div>
            </div>

            {/* Actions - Always Visible */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/10 disabled:opacity-30"
                onClick={() => onReorder(product, 'up')}
                disabled={index === 0}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/10 disabled:opacity-30"
                onClick={() => onReorder(product, 'down')}
                disabled={index === sortedProducts.length - 1}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-text-muted hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(product)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// SECTION CARD COMPONENT
// ============================================================================

interface SectionCardProps {
  config: SectionConfig;
  products: Product[];
  onManage: () => void;
}

function SectionCard({ config, products, onManage }: SectionCardProps): React.ReactElement {
  const IconComponent = config.icon;
  const productCount = products.length;
  const progressPercent = Math.min(100, (productCount / config.maxProducts) * 100);

  return (
    <Card className="bg-bg-secondary border-border-subtle hover:border-border-accent transition-all duration-300 hover:shadow-card-md group">
      <CardHeader className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.bgColor} ${config.borderColor} border`}>
              <IconComponent className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{config.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {productCount} / {config.maxProducts} products
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              productCount > 0
                ? 'border-green-success/30 text-green-success bg-green-success/10 text-xs'
                : 'border-border-subtle text-text-muted bg-bg-tertiary/50 text-xs'
            }
          >
            {productCount > 0 ? 'Active' : 'Empty'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="px-5 pb-5 pt-0 space-y-4">
        {/* Description */}
        <p className="text-xs text-text-muted leading-relaxed">{config.description}</p>
        
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                productCount > 0 ? config.bgColor.replace('/10', '/60') : 'bg-bg-tertiary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted text-right">
            {Math.round(progressPercent)}% filled
          </p>
        </div>
        
        {/* Product Preview */}
        {productCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-bg-secondary bg-bg-tertiary"
                >
                  {product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                    <Image
                      src={product.coverImageUrl}
                      alt={product.title}
                      fill
                      sizes="32px"
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-3 h-3 text-text-muted" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {productCount > 4 && (
              <span className="text-xs text-text-muted ml-1">+{productCount - 4} more</span>
            )}
          </div>
        )}

        {/* Manage Button */}
        <Button
          onClick={onManage}
          variant="outline"
          className="w-full h-9 border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow hover:bg-cyan-glow/5 transition-all"
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Manage Products
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SECTION MANAGEMENT DIALOG
// ============================================================================

interface SectionManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: SectionConfig | null;
  products: Product[];
  onAddProduct: (product: Product) => Promise<void>;
  onRemoveProduct: (product: Product) => Promise<void>;
  onReorderProduct: (product: Product, direction: 'up' | 'down') => Promise<void>;
  isLoading: boolean;
}

function SectionManageDialog({
  isOpen,
  onClose,
  config,
  products,
  onAddProduct,
  onRemoveProduct,
  onReorderProduct,
  isLoading,
}: SectionManageDialogProps): React.ReactElement {
  if (config === null) return <></>;

  const IconComponent = config.icon;
  const excludeIds = products.map((p) => p.id);
  const progressPercent = Math.min(100, (products.length / config.maxProducts) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl w-[95vw] max-h-[85vh] p-0 bg-bg-secondary border-border-subtle shadow-card-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle bg-bg-tertiary/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
              <IconComponent className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-text-primary">
                {config.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary">
                {products.length} / {config.maxProducts} products
              </DialogDescription>
            </div>
            <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${products.length > 0 ? 'bg-cyan-glow' : ''}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Search Section */}
          <div className="p-4 border-b border-border-subtle">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-3.5 w-3.5 text-cyan-glow" />
              <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                Search & Add
              </span>
            </div>
            <ProductSearch
              key={`search-${products.length}`}
              onSelect={(product) => { void onAddProduct(product); }}
              excludeIds={excludeIds}
              maxSelections={config.maxProducts}
              currentCount={products.length}
            />
          </div>

          {/* Current Products Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-3.5 w-3.5 text-purple-neon" />
                <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                  Assigned Products
                </span>
                {isLoading && (
                  <Loader2 className="h-3 w-3 animate-spin text-cyan-glow" />
                )}
              </div>
              <Badge 
                variant="secondary" 
                className={`text-[10px] ${
                  products.length > 0 
                    ? 'bg-green-success/10 text-green-success' 
                    : 'bg-bg-tertiary text-text-muted'
                }`}
              >
                {products.length}
              </Badge>
            </div>
            <SectionProductList
              products={products}
              onRemove={(product) => { void onRemoveProduct(product); }}
              onReorder={(product, direction) => { void onReorderProduct(product, direction); }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-subtle bg-bg-tertiary/30 shrink-0">
          <Button 
            onClick={onClose} 
            className="w-full bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 hover:bg-cyan-glow/20"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function HomepageSectionsPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products for all sections
  const sectionQueryResults = useQueries({
    queries: HOMEPAGE_SECTIONS.map((config) => ({
      queryKey: ['admin', 'marketing', 'section-products', config.key],
      queryFn: () => fetchSectionProducts(config.key),
      staleTime: 30_000,
    })),
  });

  const sectionQueries = HOMEPAGE_SECTIONS.map((config, index) => {
    const queryResult = sectionQueryResults[index];
    return { key: config.key, query: queryResult };
  }).filter((sq): sq is { key: string; query: NonNullable<typeof sq.query> } => sq.query !== undefined);

  const getSectionProducts = (key: string): Product[] => {
    const sectionQuery = sectionQueries.find((sq) => sq.key === key);
    return sectionQuery?.query.data ?? [];
  };

  const handleManage = (config: SectionConfig) => {
    setActiveSection(config);
    setIsDialogOpen(true);
  };

  const invalidateSection = async (sectionKey: string) => {
    await queryClient.refetchQueries({ 
      queryKey: ['admin', 'marketing', 'section-products', sectionKey] 
    });
    // Also refetch search queries so excludeIds updates
    await queryClient.invalidateQueries({ 
      queryKey: ['admin', 'products', 'search'],
      refetchType: 'all'
    });
  };

  const handleAddProduct = async (product: Product) => {
    console.info('[handleAddProduct] Called with product:', product.id, product.title);
    console.info('[handleAddProduct] activeSection:', activeSection?.key);
    if (activeSection === null) {
      console.info('[handleAddProduct] activeSection is null, returning early');
      return;
    }
    setIsLoading(true);
    try {
      const currentProducts = getSectionProducts(activeSection.key);
      console.info('[handleAddProduct] currentProducts count:', currentProducts.length);
      // Use product's featuredSections directly - the addProductToSection handles the merge
      const currentSections = product.featuredSections ?? [];
      console.info('[handleAddProduct] currentSections:', currentSections);
      
      console.info('[handleAddProduct] Calling addProductToSection...');
      await addProductToSection(product.id, activeSection.key, currentSections, currentProducts.length);
      console.info('[handleAddProduct] addProductToSection completed');
      
      // Optimistically update the cache with the new product
      const sectionKey = activeSection.key;
      const updatedProduct = {
        ...product,
        featuredSections: [...currentSections, sectionKey].filter((v, i, a) => a.indexOf(v) === i),
        featuredOrder: currentProducts.length,
      };
      
      queryClient.setQueryData(
        ['admin', 'marketing', 'section-products', sectionKey],
        (oldData: Product[] | undefined) => {
          const existing = oldData ?? [];
          // Check if product already exists
          if (existing.some(p => p.id === product.id)) {
            return existing;
          }
          return [...existing, updatedProduct];
        }
      );
      console.info('[handleAddProduct] Cache updated optimistically');
      
      // Also refetch to ensure server state is synced
      console.info('[handleAddProduct] Refetching queries...');
      await queryClient.invalidateQueries({ 
        queryKey: ['admin', 'products', 'search'],
        refetchType: 'all'
      });
      console.info('[handleAddProduct] Done!');
    } catch (error) {
      console.error('[handleAddProduct] Failed to add product:', error);
      // Refetch on error to restore correct state
      await queryClient.refetchQueries({ 
        queryKey: ['admin', 'marketing', 'section-products', activeSection.key] 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveProduct = async (product: Product) => {
    if (activeSection === null) return;
    setIsLoading(true);
    try {
      await removeProductFromSection(product.id, activeSection.key, product.featuredSections);
      await invalidateSection(activeSection.key);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorderProduct = async (product: Product, direction: 'up' | 'down') => {
    if (activeSection === null) return;
    const products = getSectionProducts(activeSection.key);
    const sorted = [...products].sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
    const currentIndex = sorted.findIndex((p) => p.id === product.id);
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    setIsLoading(true);
    try {
      const otherProduct = sorted[newIndex];
      if (otherProduct !== undefined) {
        await updateProductOrder(product.id, newIndex);
        await updateProductOrder(otherProduct.id, currentIndex);
      }
      await invalidateSection(activeSection.key);
    } finally {
      setIsLoading(false);
    }
  };

  const totalProducts = useMemo(() => {
    return sectionQueries.reduce((acc, sq) => acc + (sq.query.data?.length ?? 0), 0);
  }, [sectionQueries]);

  const activeSectionsCount = useMemo(() => {
    return sectionQueries.filter((sq) => (sq.query.data?.length ?? 0) > 0).length;
  }, [sectionQueries]);

  const isAnyLoading = sectionQueries.some((sq) => sq.query.isLoading);
  const isAnyRefetching = sectionQueries.some((sq) => sq.query.isRefetching);

  const refetchAll = () => {
    sectionQueries.forEach((sq) => { void sq.query.refetch(); });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Gradient Accent */}
      <div className="relative">
        <div className="absolute inset-0 bg-linear-to-r from-purple-neon/5 via-cyan-glow/5 to-transparent rounded-2xl blur-xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-neon/10 border border-purple-neon/20 shadow-glow-purple-sm">
              <Sparkles className="h-7 w-7 text-purple-neon" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                Homepage Sections
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                Curate products for each homepage section
              </p>
            </div>
          </div>
          <GlowButton
            onClick={refetchAll}
            disabled={isAnyRefetching}
            variant="secondary"
            size="sm"
            glowColor="cyan"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isAnyRefetching ? 'animate-spin' : ''}`} />
            Refresh All
          </GlowButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-bg-secondary border-border-subtle hover:border-border-accent transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-cyan-glow/10 border border-cyan-glow/20">
              <LayoutGrid className="h-5 w-5 text-cyan-glow" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {HOMEPAGE_SECTIONS.length}
              </p>
              <p className="text-xs text-text-muted">Total Sections</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-bg-secondary border-border-subtle hover:border-border-accent transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-green-success/10 border border-green-success/20">
              <CheckCircle className="h-5 w-5 text-green-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">{activeSectionsCount}</p>
              <p className="text-xs text-text-muted">Active Sections</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-bg-secondary border-border-subtle hover:border-border-accent transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-purple-neon/10 border border-purple-neon/20">
              <Package className="h-5 w-5 text-purple-neon" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">{totalProducts}</p>
              <p className="text-xs text-text-muted">Total Products</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-bg-secondary border-border-subtle hover:border-border-accent transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-orange-warning/10 border border-orange-warning/20">
              <Zap className="h-5 w-5 text-orange-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {HOMEPAGE_SECTIONS.reduce((acc, s) => acc + s.maxProducts, 0)}
              </p>
              <p className="text-xs text-text-muted">Max Capacity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections Grid */}
      {isAnyLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-bg-secondary border-border-subtle animate-pulse">
              <CardHeader className="p-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-bg-tertiary" />
                  <div className="space-y-2 flex-1">
                    <div className="w-32 h-4 bg-bg-tertiary rounded" />
                    <div className="w-20 h-3 bg-bg-tertiary rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0 space-y-4">
                <div className="w-full h-3 bg-bg-tertiary rounded" />
                <div className="w-full h-1.5 bg-bg-tertiary rounded-full" />
                <div className="w-full h-9 bg-bg-tertiary rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {HOMEPAGE_SECTIONS.map((config) => (
            <SectionCard
              key={config.key}
              config={config}
              products={getSectionProducts(config.key)}
              onManage={() => handleManage(config)}
            />
          ))}
        </div>
      )}

      {/* Section Management Dialog */}
      <SectionManageDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        config={activeSection}
        products={activeSection !== null ? getSectionProducts(activeSection.key) : []}
        onAddProduct={handleAddProduct}
        onRemoveProduct={handleRemoveProduct}
        onReorderProduct={handleReorderProduct}
        isLoading={isLoading}
      />

      {/* Info Alert */}
      <Alert className="bg-cyan-glow/5 border-cyan-glow/20">
        <Eye className="h-4 w-4 text-cyan-glow" />
        <AlertTitle className="text-cyan-glow font-semibold">Preview Changes</AlertTitle>
        <AlertDescription className="text-text-secondary text-sm">
          Changes are saved immediately. Visit the{' '}
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-cyan-glow hover:underline font-medium">
            homepage
          </a>{' '}
          to see your updates live.
        </AlertDescription>
      </Alert>
    </div>
  );
}
