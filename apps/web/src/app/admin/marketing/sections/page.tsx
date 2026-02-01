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
 * Follows Level 5 admin page patterns
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
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import { Label } from '@/design-system/primitives/label';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
  GripVertical,
  TrendingUp,
  Gamepad2,
  Monitor,
  CreditCard,
  Repeat,
  Zap,
  X,
  LayoutGrid,
  Eye,
  ArrowUp,
  ArrowDown,
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

// Use AdminProductResponseDto from SDK, with simplified local alias
type Product = AdminProductResponseDto;

interface SectionConfig {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  maxProducts: number;
}

// ============================================================================
// SECTION CONFIGURATION
// ============================================================================

const HOMEPAGE_SECTIONS: SectionConfig[] = [
  {
    key: 'trending',
    name: 'Trending Now',
    description: 'Top selling products displayed on homepage. Shows up to 48 products with pagination.',
    icon: TrendingUp,
    color: 'text-orange-warning',
    maxProducts: 48,
  },
  {
    key: 'featured_games',
    name: 'Featured Games',
    description: 'Featured game keys shown in the Games tab. Shows up to 48 products with pagination.',
    icon: Gamepad2,
    color: 'text-cyan-glow',
    maxProducts: 48,
  },
  {
    key: 'featured_software',
    name: 'Featured Software',
    description: 'Featured software products in the Software tab. Shows up to 48 products with pagination.',
    icon: Monitor,
    color: 'text-purple-neon',
    maxProducts: 48,
  },
  {
    key: 'featured_subscriptions',
    name: 'Featured Subscriptions',
    description: 'Subscription services in the Subscriptions tab. Shows up to 48 products with pagination.',
    icon: Repeat,
    color: 'text-pink-featured',
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

/**
 * Fetch products that are assigned to a specific section
 */
async function fetchSectionProducts(sectionKey: string): Promise<Product[]> {
  const api = new AdminCatalogProductsApi(apiConfig);
  // Fetch all published products and filter by section client-side
  // (API filter by featuredSections would require new endpoint)
  const response = await api.adminProductsControllerListAll({
    published: 'true',
    limit: '100',
  });
  
  return response.products
    .filter((p) => {
      // featuredSections is Array<string> | undefined in SDK
      const sections = p.featuredSections ?? [];
      return sections.includes(sectionKey);
    })
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
}

/**
 * Add a product to a section by updating its featuredSections array
 */
async function addProductToSection(
  productId: string,
  sectionKey: string,
  currentSections: string[] | string | undefined,
  order: number
): Promise<void> {
  const api = new AdminCatalogProductsApi(apiConfig);
  // Handle case where featuredSections might be a comma-separated string from DB
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

/**
 * Remove a product from a section
 */
async function removeProductFromSection(
  productId: string,
  sectionKey: string,
  currentSections: string[] | string | undefined
): Promise<void> {
  const api = new AdminCatalogProductsApi(apiConfig);
  // Handle case where featuredSections might be a comma-separated string from DB
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

/**
 * Update product order within a section
 */
async function updateProductOrder(
  productId: string,
  newOrder: number
): Promise<void> {
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

  // Debounce search
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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          type="text"
          placeholder="Search published products..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 bg-bg-tertiary border-border-subtle"
        />
      </div>

      {!canAddMore && (
        <Alert className="bg-orange-warning/10 border-orange-warning/30">
          <AlertCircle className="h-4 w-4 text-orange-warning" />
          <AlertDescription className="text-orange-warning">
            Maximum of {maxSelections} products reached for this section.
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="h-[300px] border border-border-subtle rounded-lg">
        {productsQuery.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-glow" />
          </div>
        ) : productsQuery.error !== null && productsQuery.error !== undefined ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            Failed to load products
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted gap-2">
            <Search className="h-8 w-8" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer group"
                onClick={() => canAddMore && onSelect(product)}
              >
                {/* Product Image */}
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-bg-secondary shrink-0">
                  {product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                    <Image
                      src={product.coverImageUrl}
                      alt={product.title}
                      fill
                      sizes="48px"
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <LayoutGrid className="w-5 h-5 text-text-muted" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {product.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.platform !== undefined && product.platform !== '' && (
                      <Badge variant="outline" className="text-xs py-0 px-1.5">
                        {product.platform}
                      </Badge>
                    )}
                    <span className="text-xs text-text-muted">
                      €{product.price ?? '0.00'}
                    </span>
                  </div>
                </div>

                {/* Add Button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-glow/50 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow"
                  disabled={!canAddMore}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canAddMore) onSelect(product);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// SECTION PRODUCT LIST COMPONENT
// ============================================================================

interface SectionProductListProps {
  products: Product[];
  _sectionKey: string;
  onRemove: (product: Product) => void;
  onReorder: (product: Product, direction: 'up' | 'down') => void;
}

function SectionProductList({
  products,
  _sectionKey,
  onRemove,
  onReorder,
}: SectionProductListProps): React.ReactElement {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted border border-dashed border-border-subtle rounded-lg">
        <LayoutGrid className="h-10 w-10 mb-3" />
        <p className="text-sm">No products in this section</p>
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg border border-border-subtle group"
          >
            {/* Drag Handle / Order Number */}
            <div className="flex items-center gap-2 text-text-muted">
              <GripVertical className="h-4 w-4 cursor-grab" />
              <span className="text-xs font-mono w-6 text-center">#{index + 1}</span>
            </div>

            {/* Product Image */}
            <div className="relative w-10 h-10 rounded-md overflow-hidden bg-bg-secondary shrink-0">
              {product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                <Image
                  src={product.coverImageUrl}
                  alt={product.title}
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-text-muted" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {product.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {product.platform !== undefined && product.platform !== '' && (
                  <Badge variant="outline" className="text-xs py-0 px-1.5">
                    {product.platform}
                  </Badge>
                )}
                <span className="text-xs text-text-muted">
                  €{product.price ?? '0.00'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onReorder(product, 'up')}
                disabled={index === 0}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onReorder(product, 'down')}
                disabled={index === sortedProducts.length - 1}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
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

  return (
    <Card className="bg-bg-secondary border-border-subtle hover:border-border-accent transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-bg-tertiary ${config.color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{config.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {productCount}/{config.maxProducts} products
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              productCount > 0
                ? 'border-green-success/30 text-green-success bg-green-success/10'
                : 'border-border-subtle text-text-muted'
            }
          >
            {productCount > 0 ? 'Active' : 'Empty'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-text-muted mb-4">{config.description}</p>
        
        {/* Product Preview */}
        {productCount > 0 && (
          <div className="flex -space-x-2 mb-4">
            {products.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="relative w-8 h-8 rounded-md overflow-hidden border-2 border-bg-secondary"
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
                  <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
                    <LayoutGrid className="w-3 h-3 text-text-muted" />
                  </div>
                )}
              </div>
            ))}
            {productCount > 5 && (
              <div className="w-8 h-8 rounded-md bg-bg-tertiary border-2 border-bg-secondary flex items-center justify-center">
                <span className="text-xs text-text-muted">+{productCount - 5}</span>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={onManage}
          variant="outline"
          className="w-full border-border-subtle hover:border-cyan-glow hover:text-cyan-glow"
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl bg-bg-primary border-border-subtle">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-bg-tertiary ${config.color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            {config.name}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left: Product Search */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Search Products to Add
            </Label>
            <ProductSearch
              onSelect={(product) => { void onAddProduct(product); }}
              excludeIds={excludeIds}
              maxSelections={config.maxProducts}
              currentCount={products.length}
            />
          </div>

          {/* Right: Current Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">
                Section Products ({products.length}/{config.maxProducts})
              </Label>
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-glow" />
              )}
            </div>
            <ScrollArea className="h-[340px]">
              <SectionProductList
                products={products}
                _sectionKey={config.key}
                onRemove={(product) => { void onRemoveProduct(product); }}
                onReorder={(product, direction) => { void onReorderProduct(product, direction); }}
              />
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t border-border-subtle pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
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

  // Fetch products for all sections using useQueries (proper hook usage)
  const sectionQueryResults = useQueries({
    queries: HOMEPAGE_SECTIONS.map((config) => ({
      queryKey: ['admin', 'marketing', 'section-products', config.key],
      queryFn: () => fetchSectionProducts(config.key),
      staleTime: 30_000,
    })),
  });

  // Map query results back to section keys with proper typing
  const sectionQueries = HOMEPAGE_SECTIONS.map((config, index) => {
    const queryResult = sectionQueryResults[index];
    return {
      key: config.key,
      query: queryResult,
    };
  }).filter((sq): sq is { key: string; query: NonNullable<typeof sq.query> } => sq.query !== undefined);

  // Get products for a specific section
  const getSectionProducts = (key: string): Product[] => {
    const sectionQuery = sectionQueries.find((sq) => sq.key === key);
    return sectionQuery?.query.data ?? [];
  };

  // Handle manage button click
  const handleManage = (config: SectionConfig) => {
    setActiveSection(config);
    setIsDialogOpen(true);
  };

  // Invalidate section queries
  const invalidateSection = (sectionKey: string) => {
    void queryClient.invalidateQueries({ 
      queryKey: ['admin', 'marketing', 'section-products', sectionKey] 
    });
  };

  // Add product to section
  const handleAddProduct = async (product: Product) => {
    if (activeSection === null) return;
    setIsLoading(true);
    try {
      const currentProducts = getSectionProducts(activeSection.key);
      await addProductToSection(product.id, activeSection.key, product.featuredSections, currentProducts.length);
      invalidateSection(activeSection.key);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove product from section
  const handleRemoveProduct = async (product: Product) => {
    if (activeSection === null) return;
    setIsLoading(true);
    try {
      await removeProductFromSection(product.id, activeSection.key, product.featuredSections);
      invalidateSection(activeSection.key);
    } finally {
      setIsLoading(false);
    }
  };

  // Reorder product in section
  const handleReorderProduct = async (product: Product, direction: 'up' | 'down') => {
    if (activeSection === null) return;
    const products = getSectionProducts(activeSection.key);
    const sorted = [...products].sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
    const currentIndex = sorted.findIndex((p) => p.id === product.id);
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    setIsLoading(true);
    try {
      // Swap orders
      const otherProduct = sorted[newIndex];
      if (otherProduct !== undefined) {
        await updateProductOrder(product.id, newIndex);
        await updateProductOrder(otherProduct.id, currentIndex);
      }
      invalidateSection(activeSection.key);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total products across sections
  const totalProducts = useMemo(() => {
    return sectionQueries.reduce((acc, sq) => acc + (sq.query.data?.length ?? 0), 0);
  }, [sectionQueries]);

  // Calculate active sections count
  const activeSectionsCount = useMemo(() => {
    return sectionQueries.filter((sq) => (sq.query.data?.length ?? 0) > 0).length;
  }, [sectionQueries]);

  // Check if any query is loading
  const isAnyLoading = sectionQueries.some((sq) => sq.query.isLoading);
  const isAnyRefetching = sectionQueries.some((sq) => sq.query.isRefetching);

  // Refetch all sections
  const refetchAll = () => {
    sectionQueries.forEach((sq) => { void sq.query.refetch(); });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <LayoutGrid className="h-7 w-7 text-cyan-glow" />
            Homepage Sections
          </h1>
          <p className="text-text-secondary mt-1">
            Manage which products appear in each homepage section
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            disabled={isAnyRefetching}
            className="border-border-subtle"
          >
            {isAnyRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-bg-secondary border-border-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-glow/10">
              <LayoutGrid className="h-5 w-5 text-cyan-glow" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {HOMEPAGE_SECTIONS.length}
              </p>
              <p className="text-xs text-text-muted">Sections</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-secondary border-border-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-success/10">
              <CheckCircle className="h-5 w-5 text-green-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{totalProducts}</p>
              <p className="text-xs text-text-muted">Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-secondary border-border-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-neon/10">
              <Eye className="h-5 w-5 text-purple-neon" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {activeSectionsCount}
              </p>
              <p className="text-xs text-text-muted">Active Sections</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-bg-secondary border-border-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-warning/10">
              <Zap className="h-5 w-5 text-orange-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {HOMEPAGE_SECTIONS.reduce((acc, s) => acc + s.maxProducts, 0)}
              </p>
              <p className="text-xs text-text-muted">Max Capacity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections Grid */}
      {isAnyLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-bg-secondary border-border-subtle animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-bg-tertiary" />
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-bg-tertiary rounded" />
                    <div className="w-16 h-3 bg-bg-tertiary rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-3 bg-bg-tertiary rounded mb-4" />
                <div className="w-full h-9 bg-bg-tertiary rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <AlertTitle className="text-cyan-glow">Preview Changes</AlertTitle>
        <AlertDescription className="text-text-secondary">
          Changes are saved immediately. Visit the{' '}
          <a href="/" target="_blank" className="text-cyan-glow hover:underline">
            homepage
          </a>{' '}
          to see your updates live.
        </AlertDescription>
      </Alert>
    </div>
  );
}
