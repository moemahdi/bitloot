'use client';

/**
 * Admin Catalog Products Page
 * 
 * Features:
 * - Product listing with search and filters (platform, region, published status)
 * - Real-time data with 30-second cache
 * - Publish/unpublish toggle actions
 * - Responsive table layout
 * - Error handling with retry capability
 * - Loading and empty states
 * - Network status awareness
 * 
 * Follows Level 5 admin page patterns from orders/page.tsx
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { GlowButton } from '@/design-system/primitives/glow-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { Checkbox } from '@/design-system/primitives/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import {
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  DollarSign,
  Loader2,
  Plus,
  Pencil,
  Store,
  Crown,
  Star,
  Tag,
  MapPin,
  Monitor,
  ExternalLink,
  Shield,
  Trash2,
  // Additional icons for enhanced dialog
  Info,
  Package,
  Globe,
  Users,
  Building,
  Calendar,
  BarChart3,
  Languages,
  Cpu,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  Hash,
  Gamepad2,
  Award,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { AdminProductResponseDto, AdminProductsListResponseDto } from '@bitloot/sdk';
import { AdminCatalogProductsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

// Platform options for filter - values that exist in database from Kinguin
const PLATFORMS = [
  'Steam',
  'Epic',
  'Uplay',
  'Origin',
  'GOG',
  'Xbox',
  'PlayStation',
  'Nintendo',
  'Battle.net',
] as const;

// Region options for filter - values that exist in database from Kinguin
const REGIONS = [
  'Global',
  'North America',
  'Europe',
  'Asia',
  'Oceania',
  'South America',
] as const;

export default function AdminCatalogProductsPage(): React.JSX.Element {
  // State: filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [lastError, setLastError] = useState<string | null>(null);

  // Product detail dialog state
  const [selectedProduct, setSelectedProduct] = useState<AdminProductResponseDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Delete functionality state
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Error handling
  const { handleError, clearError } = useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error: Error, context: string): void => {
      setLastError(error.message);
      console.error('Products fetch error:', { error, context });
    },
    onRetry: (attempt: number): void => {
      console.info(`Retrying products fetch (attempt ${attempt})...`);
    },
    onRecovery: (): void => {
      setLastError(null);
      console.info('Products fetch recovered successfully');
    },
  });

  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();

  // Fetch products with filters and pagination
  const productsQuery = useQuery({
    queryKey: ['admin', 'catalog', 'products', searchQuery, platformFilter, regionFilter, publishedFilter, sourceFilter, currentPage, pageSize],
    queryFn: async (): Promise<AdminProductsListResponseDto> => {
      if (!isOnline) {
        throw new Error('No internet connection. Please check your network.');
      }

      try {
        const api = new AdminCatalogProductsApi(apiConfig);

        // Build filter params with pagination
        const response = await api.adminProductsControllerListAll({
          search: searchQuery !== '' ? searchQuery : undefined,
          platform: platformFilter === 'all' ? undefined : platformFilter,
          region: regionFilter === 'all' ? undefined : regionFilter,
          published: publishedFilter === 'all' ? undefined : publishedFilter,
          source: sourceFilter === 'all' ? undefined : sourceFilter,
          page: String(currentPage),
          limit: String(pageSize),
        });

        clearError();
        return response;
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), 'fetch-products');
        throw error;
      }
    },
    staleTime: 60_000, // 60 seconds - increased to reduce API calls
    gcTime: 300_000, // 5 minutes cache time
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
    retry: (failureCount: number, error: Error): boolean => {
      if (failureCount < 3) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        return message.includes('network') || message.includes('timeout');
      }
      return false;
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminCatalogProductsApi(apiConfig);
      return await api.adminProductsControllerPublish({ id: productId });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'products'] });
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'publish-product');
    },
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminCatalogProductsApi(apiConfig);
      return await api.adminProductsControllerUnpublish({ id: productId });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'products'] });
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'unpublish-product');
    },
  });

  // Single delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminCatalogProductsApi(apiConfig);
      return await api.adminProductsControllerDelete({ id: productId });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'products'] });
      setProductToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'delete-product');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminCatalogProductsApi(apiConfig);
      return await api.adminProductsControllerBulkDelete({ bulkDeleteProductsDto: { ids: productIds } });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'products'] });
      setSelectedProductIds(new Set());
      setDeleteConfirmOpen(false);
      setIsBulkDelete(false);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'bulk-delete-products');
    },
  });

  // Single product reprice mutation
  const repriceMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminCatalogProductsApi(apiConfig);
      return await api.adminProductsControllerReprice({ id: productId });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'products'] });
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'reprice-product');
    },
  });

  // Handle delete confirmation
  const handleDeleteClick = (productId: string): void => {
    setProductToDelete(productId);
    setIsBulkDelete(false);
    setDeleteConfirmOpen(true);
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteClick = (): void => {
    if (selectedProductIds.size === 0) return;
    setIsBulkDelete(true);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete action
  const confirmDelete = (): void => {
    if (isBulkDelete) {
      bulkDeleteMutation.mutate(Array.from(selectedProductIds));
    } else if (productToDelete !== null && productToDelete !== undefined) {
      deleteMutation.mutate(productToDelete);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (productId: string): void => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Select/deselect all products on current page
  const toggleSelectAll = (): void => {
    if (data?.products === null || data?.products === undefined) return;
    const currentPageIds = data.products.map((p) => p.id);
    const allSelected = currentPageIds.every((id) => selectedProductIds.has(id));

    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // Deselect all on current page
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        // Select all on current page
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, platformFilter, regionFilter, publishedFilter, sourceFilter]);

  // Handle manual refresh
  const handleRefresh = (): void => {
    clearError();
    void productsQuery.refetch();
  };

  // Format price with proper currency (EUR from Kinguin)
  const formatPrice = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) {
      return 'N/A';
    }
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount); // Prices are already in EUR (not cents)
  };

  const { data, isLoading, error } = productsQuery;
  const products = data?.products ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalProducts = data?.total ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary drop-shadow-[0_0_10px_rgba(0,217,255,0.1)]">Catalog Products</h1>
          <p className="text-text-secondary mt-2">
            Manage products from Kinguin sync and custom listings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/catalog/products/new">
            <GlowButton
              variant="default"
              size="sm"
              glowColor="cyan"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Product
            </GlowButton>
          </Link>
          <GlowButton
            onClick={handleRefresh}
            disabled={isLoading}
            variant="secondary"
            size="sm"
            glowColor="cyan"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </GlowButton>
          {selectedProductIds.size > 0 && (
            <GlowButton
              onClick={handleBulkDeleteClick}
              disabled={bulkDeleteMutation.isPending}
              variant="secondary"
              size="sm"
              glowColor="red"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedProductIds.size})
            </GlowButton>
          )}
        </div>
      </div>

      {/* Network Status Alert */}
      {!isOnline && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Internet Connection</AlertTitle>
          <AlertDescription>
            Please check your network connection and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {lastError != null && lastError.length > 0 && isOnline && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Products</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>{lastError}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="mt-2 border-red-500/30 hover:bg-red-500/10"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters Card */}
      <Card className="border-cyan-glow/20 bg-bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.05)]">
        <CardHeader>
          <CardTitle className="text-text-primary">Filters</CardTitle>
          <CardDescription className="text-text-secondary">
            Search and filter products by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-text-secondary">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-glow/50" />
                <Input
                  id="search"
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
                />
              </div>
            </div>

            {/* Source Filter */}
            <div className="space-y-2">
              <Label htmlFor="source" className="text-text-secondary">Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger id="source" className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent className="border-cyan-glow/20 bg-bg-secondary/95 backdrop-blur-xl">
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="kinguin">Kinguin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Platform Filter */}
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-text-secondary">Platform</Label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger id="platform" className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20">
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent className="border-cyan-glow/20 bg-bg-secondary/95 backdrop-blur-xl">
                  <SelectItem value="all">All Platforms</SelectItem>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region Filter */}
            <div className="space-y-2">
              <Label htmlFor="region" className="text-text-secondary">Region</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger id="region" className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent className="border-cyan-glow/20 bg-bg-secondary/95 backdrop-blur-xl">
                  <SelectItem value="all">All Regions</SelectItem>
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Published Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="published" className="text-text-secondary">Status</Label>
              <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                <SelectTrigger id="published" className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="border-cyan-glow/20 bg-bg-secondary/95 backdrop-blur-xl">
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="true">Published</SelectItem>
                  <SelectItem value="false">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table Card */}
      <Card className="border-cyan-glow/20 bg-bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.05)]">
        <CardHeader>
          <CardTitle className="text-text-primary">Products</CardTitle>
          <CardDescription className="text-text-secondary">
            {isLoading
              ? 'Loading products...'
              : products != null
                ? `${totalProducts} total product${totalProducts === 1 ? '' : 's'} (showing ${products.length} on this page)`
                : 'No products'}
          </CardDescription>
        </CardHeader>

        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="relative h-1 w-full overflow-hidden bg-gray-surface">
            <div className="absolute h-full w-full bg-cyan-glow/30 animate-pulse" />
            <div className="absolute h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan-glow to-transparent" />
          </div>
        )}

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
              <span className="ml-3 text-text-secondary">Loading products...</span>
            </div>
          ) : error != null && (lastError == null || lastError.length === 0) ? (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Failed to Load Products</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </AlertDescription>
            </Alert>
          ) : products == null || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="h-12 w-12 text-text-muted mb-4" />
              <p className="text-lg font-medium text-text-primary">No products found</p>
              <p className="text-sm text-text-secondary mt-1">
                Try adjusting your filters or run a Kinguin sync
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-cyan-glow/20 hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={products.length > 0 && products.every((p) => selectedProductIds.has(p.id))}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="text-text-secondary uppercase tracking-wider text-xs">Title</TableHead>
                    <TableHead className="text-text-secondary uppercase tracking-wider text-xs">Source</TableHead>
                    <TableHead className="text-text-secondary uppercase tracking-wider text-xs">Category</TableHead>
                    <TableHead className="text-text-secondary uppercase tracking-wider text-xs">Platform</TableHead>
                    <TableHead className="text-text-secondary uppercase tracking-wider text-xs">Region</TableHead>
                    <TableHead className="text-right text-text-secondary uppercase tracking-wider text-xs">Cost</TableHead>
                    <TableHead className="text-right text-text-secondary uppercase tracking-wider text-xs">Price</TableHead>
                    <TableHead className="text-text-secondary uppercase tracking-wider text-xs">Status</TableHead>
                    <TableHead className="text-right text-text-secondary uppercase tracking-wider text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {(products ?? []).map((product: AdminProductResponseDto, index) => {
                      const isPublishing = publishMutation.isPending && publishMutation.variables === product.id;
                      const isUnpublishing = unpublishMutation.isPending && unpublishMutation.variables === product.id;
                      const isRepricing = repriceMutation.isPending && repriceMutation.variables === product.id;
                      const isActionPending = isPublishing || isUnpublishing || isRepricing;

                      return (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="border-b border-cyan-glow/10 hover:bg-cyan-glow/5 transition-colors"
                        >
                          <TableCell className="w-10">
                            <Checkbox
                              checked={selectedProductIds.has(product.id)}
                              onCheckedChange={() => toggleProductSelection(product.id)}
                              aria-label={`Select ${product.title ?? 'product'}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium max-w-xs truncate text-text-primary">
                            {(product.title ?? '').length > 0 ? product.title : 'Untitled'}
                          </TableCell>
                          <TableCell>
                            {product.sourceType === 'custom' ? (
                              <Badge variant="outline" className="border-cyan-glow/30 text-cyan-glow bg-cyan-glow/5">
                                <Store className="mr-1 h-3 w-3" />
                                Custom
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/5">
                                <Crown className="mr-1 h-3 w-3" />
                                Kinguin
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-purple-glow/30 text-purple-glow bg-purple-glow/5">
                              {product.category ?? 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-bg-tertiary text-text-secondary">
                              {product.platform ?? 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-bg-tertiary text-text-secondary">
                              {product.region ?? 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-text-muted">
                            {formatPrice(parseFloat(product.cost ?? '0'))}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-cyan-glow">
                            {formatPrice(parseFloat(product.price ?? '0'))}
                          </TableCell>
                          <TableCell>
                            {product.isPublished ? (
                              <Badge variant="default" className="bg-green-success/20 text-green-success border border-green-success/30 shadow-[0_0_8px_rgba(57,255,20,0.2)]">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-bg-tertiary text-text-muted">
                                <XCircle className="mr-1 h-3 w-3" />
                                Hidden
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsDetailOpen(true);
                                }}
                                className="border-purple-glow/30 text-purple-glow hover:bg-purple-glow/10"
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Button>
                              <Link href={`/admin/catalog/products/${product.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
                                >
                                  <Pencil className="mr-1 h-3 w-3" />
                                  Edit
                                </Button>
                              </Link>
                              {product.isPublished ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => unpublishMutation.mutate(product.id)}
                                  disabled={isActionPending || !isOnline}
                                  className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                >
                                  {isUnpublishing ? (
                                    <>
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      Hiding...
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="mr-1 h-3 w-3" />
                                      Hide
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => publishMutation.mutate(product.id)}
                                  disabled={isActionPending || !isOnline}
                                  className="bg-green-success/20 text-green-success border border-green-success/30 hover:bg-green-success/30"
                                >
                                  {isPublishing ? (
                                    <>
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      Publishing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Publish
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => repriceMutation.mutate(product.id)}
                                disabled={isActionPending || repriceMutation.isPending || !isOnline}
                                title="Reprice product based on current pricing rules"
                                className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/50"
                              >
                                {repriceMutation.isPending && repriceMutation.variables === product.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <DollarSign className="mr-1 h-3 w-3" />
                                )}
                                Reprice
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(product.id)}
                                disabled={isActionPending || deleteMutation.isPending || !isOnline}
                                className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
                                title="Delete product"
                              >
                                {deleteMutation.isPending && deleteMutation.variables === product.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && products.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-border pt-4">
              {/* Results info */}
              <div className="text-sm text-text-secondary">
                Showing{' '}
                <span className="font-medium text-text-primary">
                  {(currentPage - 1) * pageSize + 1}
                </span>
                {' '}-{' '}
                <span className="font-medium text-text-primary">
                  {Math.min(currentPage * pageSize, totalProducts)}
                </span>
                {' '}of{' '}
                <span className="font-medium text-text-primary">{totalProducts}</span>
                {' '}products
              </div>

              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  className="rounded-lg border border-gray-border bg-gray-surface px-3 py-1 text-sm text-text-primary focus:border-cyan-glow focus:outline-none focus:ring-1 focus:ring-cyan-glow"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Pagination buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || isLoading}
                  className="border-gray-border"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="border-gray-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-text-secondary">
                  Page{' '}
                  <span className="font-medium text-text-primary">{currentPage}</span>
                  {' '}of{' '}
                  <span className="font-medium text-text-primary">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  className="border-gray-border"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages || isLoading}
                  className="border-gray-border"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Dialog - Enhanced with ALL Kinguin fields */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-bg-secondary border-cyan-glow/20 text-text-primary">
          {selectedProduct !== null && selectedProduct !== undefined && (
            <>
              <DialogHeader className="pb-2">
                <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2 flex-wrap">
                  {selectedProduct.title}
                  <Badge
                    variant="outline"
                    className={selectedProduct.sourceType === 'kinguin'
                      ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                      : 'border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow'
                    }
                  >
                    {selectedProduct.sourceType === 'kinguin' ? <><Crown className="h-3 w-3 mr-1" />Kinguin</> : <><Store className="h-3 w-3 mr-1" />Custom</>}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={selectedProduct.isPublished
                      ? 'border-green-success/50 bg-green-success/10 text-green-success'
                      : 'border-gray-border bg-gray-600/10 text-gray-400'
                    }
                  >
                    {selectedProduct.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  {selectedProduct.isPreorder && (
                    <Badge variant="outline" className="border-purple-500/50 bg-purple-500/10 text-purple-400">
                      <Clock className="h-3 w-3 mr-1" />Pre-order
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-text-secondary">
                  {selectedProduct.originalName ?? selectedProduct.subtitle ?? 'No subtitle'}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-bg-primary">
                  <TabsTrigger value="overview" className="text-xs">
                    <Info className="h-3 w-3 mr-1" />Overview
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />Pricing
                  </TabsTrigger>
                  <TabsTrigger value="metadata" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />Metadata
                  </TabsTrigger>
                  <TabsTrigger value="media" className="text-xs">
                    <ImageIcon className="h-3 w-3 mr-1" />Media
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="text-xs">
                    <Cpu className="h-3 w-3 mr-1" />Technical
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[50vh] mt-4">
                  {/* OVERVIEW TAB */}
                  <TabsContent value="overview" className="space-y-4 pr-4">
                    {/* Product Image */}
                    {selectedProduct.coverImageUrl !== null && selectedProduct.coverImageUrl !== undefined && selectedProduct.coverImageUrl.length > 0 && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden bg-bg-primary border border-cyan-glow/10">
                        <Image
                          src={selectedProduct.coverImageUrl}
                          alt={selectedProduct.title ?? 'Product image'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    {/* Core Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                        <Monitor className="h-4 w-4 text-cyan-glow shrink-0" />
                        <span className="text-text-secondary">Platform:</span>
                        <span className="text-text-primary font-medium">{selectedProduct.platform ?? 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                        <MapPin className="h-4 w-4 text-cyan-glow shrink-0" />
                        <span className="text-text-secondary">Region:</span>
                        <span className="text-text-primary font-medium">{selectedProduct.region ?? 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                        <Gamepad2 className="h-4 w-4 text-cyan-glow shrink-0" />
                        <span className="text-text-secondary">Category:</span>
                        <span className="text-text-primary font-medium">{selectedProduct.category ?? 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                        <Shield className="h-4 w-4 text-cyan-glow shrink-0" />
                        <span className="text-text-secondary">DRM:</span>
                        <span className="text-text-primary font-medium">{selectedProduct.drm ?? 'N/A'}</span>
                      </div>

                      {/* Ratings Row */}
                      {(selectedProduct.rating !== null && selectedProduct.rating !== undefined) || (selectedProduct.metacriticScore !== null && selectedProduct.metacriticScore !== undefined) ? (
                        <>
                          {selectedProduct.rating !== null && selectedProduct.rating !== undefined && Number(selectedProduct.rating) > 0 && (
                            <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 shrink-0" />
                              <span className="text-text-secondary">Rating:</span>
                              <span className="text-text-primary font-medium">{Number(selectedProduct.rating).toFixed(1)} / 5</span>
                            </div>
                          )}
                          {selectedProduct.metacriticScore !== null && selectedProduct.metacriticScore !== undefined && (
                            <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                              <Award className="h-4 w-4 text-green-400 shrink-0" />
                              <span className="text-text-secondary">Metacritic:</span>
                              <span className={`font-medium ${selectedProduct.metacriticScore >= 75 ? 'text-green-400' : selectedProduct.metacriticScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {selectedProduct.metacriticScore}/100
                              </span>
                            </div>
                          )}
                        </>
                      ) : null}

                      {selectedProduct.ageRating !== null && selectedProduct.ageRating !== undefined && (
                        <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                          <Shield className="h-4 w-4 text-cyan-glow shrink-0" />
                          <span className="text-text-secondary">Age Rating:</span>
                          <span className="text-text-primary font-medium">{selectedProduct.ageRating}</span>
                        </div>
                      )}

                      {selectedProduct.releaseDate !== null && selectedProduct.releaseDate !== undefined && (
                        <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                          <Calendar className="h-4 w-4 text-cyan-glow shrink-0" />
                          <span className="text-text-secondary">Release:</span>
                          <span className="text-text-primary font-medium">{new Date(selectedProduct.releaseDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {selectedProduct.description !== null && selectedProduct.description !== undefined && selectedProduct.description.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <Info className="h-4 w-4" />Description
                        </h4>
                        <div className="text-sm text-text-primary bg-bg-primary p-3 rounded-lg border border-cyan-glow/10 max-h-40 overflow-y-auto whitespace-pre-wrap">
                          {selectedProduct.description}
                        </div>
                      </div>
                    )}

                    {/* Activation Details */}
                    {selectedProduct.activationDetails !== null && selectedProduct.activationDetails !== undefined && selectedProduct.activationDetails.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />Activation Details
                        </h4>
                        <div className="text-sm text-text-primary bg-bg-primary p-3 rounded-lg border border-cyan-glow/10 max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {selectedProduct.activationDetails}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* PRICING & INVENTORY TAB */}
                  <TabsContent value="pricing" className="space-y-4 pr-4">
                    {/* Main Pricing Card */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-bg-primary border border-cyan-glow/10">
                        <div className="text-xs text-text-secondary mb-1">Cost Price</div>
                        <div className="text-2xl font-bold text-text-primary">
                          €{parseFloat(String(selectedProduct.cost ?? '0')).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-bg-primary border border-green-success/20">
                        <div className="text-xs text-text-secondary mb-1">Sell Price</div>
                        <div className="text-2xl font-bold text-green-success">
                          €{parseFloat(String(selectedProduct.price ?? '0')).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Margin Calculation */}
                    <div className="p-3 rounded-lg bg-bg-primary border border-cyan-glow/10">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Profit Margin:</span>
                        <span className="text-lg font-bold text-green-success">
                          €{(parseFloat(String(selectedProduct.price ?? '0')) - parseFloat(String(selectedProduct.cost ?? '0'))).toFixed(2)}
                          <span className="text-xs text-text-secondary ml-2">
                            ({parseFloat(String(selectedProduct.cost ?? '0')) > 0 
                              ? (((parseFloat(String(selectedProduct.price ?? '0')) - parseFloat(String(selectedProduct.cost ?? '0'))) / parseFloat(String(selectedProduct.cost ?? '0'))) * 100).toFixed(1)
                              : '0'}%)
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Inventory Stats */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Package className="h-4 w-4" />Inventory Information
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {selectedProduct.qty !== null && selectedProduct.qty !== undefined && (
                          <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                            <Hash className="h-4 w-4 text-cyan-glow shrink-0" />
                            <span className="text-text-secondary">Quantity:</span>
                            <span className="text-text-primary font-medium">{selectedProduct.qty}</span>
                          </div>
                        )}
                        {selectedProduct.textQty !== null && selectedProduct.textQty !== undefined && (
                          <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                            <Package className="h-4 w-4 text-cyan-glow shrink-0" />
                            <span className="text-text-secondary">Stock:</span>
                            <span className="text-text-primary font-medium">{selectedProduct.textQty}</span>
                          </div>
                        )}
                        {selectedProduct.offersCount !== null && selectedProduct.offersCount !== undefined && (
                          <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                            <BarChart3 className="h-4 w-4 text-cyan-glow shrink-0" />
                            <span className="text-text-secondary">Offers:</span>
                            <span className="text-text-primary font-medium">{selectedProduct.offersCount}</span>
                          </div>
                        )}
                        {selectedProduct.totalQty !== null && selectedProduct.totalQty !== undefined && (
                          <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                            <Package className="h-4 w-4 text-cyan-glow shrink-0" />
                            <span className="text-text-secondary">Total Qty:</span>
                            <span className="text-text-primary font-medium">{selectedProduct.totalQty}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kinguin IDs */}
                    {selectedProduct.sourceType === 'kinguin' && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <Crown className="h-4 w-4 text-orange-400" />Kinguin Integration
                        </h4>
                        <div className="space-y-2 text-sm">
                          {selectedProduct.kinguinOfferId !== null && selectedProduct.kinguinOfferId !== undefined && (
                            <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-orange-500/20">
                              <span className="text-text-secondary">Offer ID:</span>
                              <code className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs">{selectedProduct.kinguinOfferId}</code>
                            </div>
                          )}
                          {selectedProduct.kinguinId !== null && selectedProduct.kinguinId !== undefined && (
                            <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-orange-500/20">
                              <span className="text-text-secondary">Kinguin ID:</span>
                              <code className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs">{selectedProduct.kinguinId}</code>
                            </div>
                          )}
                          {selectedProduct.kinguinProductId !== null && selectedProduct.kinguinProductId !== undefined && (
                            <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-orange-500/20">
                              <span className="text-text-secondary">Product ID:</span>
                              <code className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs">{selectedProduct.kinguinProductId}</code>
                            </div>
                          )}
                          {selectedProduct.cheapestOfferId !== null && selectedProduct.cheapestOfferId !== undefined && selectedProduct.cheapestOfferId.length > 0 && (
                            <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-orange-500/20">
                              <span className="text-text-secondary">Cheapest Offers:</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedProduct.cheapestOfferId.slice(0, 3).map((id, i) => (
                                  <code key={i} className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs">{id}</code>
                                ))}
                                {selectedProduct.cheapestOfferId.length > 3 && (
                                  <span className="text-text-secondary text-xs">+{selectedProduct.cheapestOfferId.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedProduct.merchantName !== null && selectedProduct.merchantName !== undefined && selectedProduct.merchantName.length > 0 && (
                            <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-orange-500/20">
                              <Building className="h-4 w-4 text-orange-400 shrink-0" />
                              <span className="text-text-secondary">Merchants:</span>
                              <span className="text-text-primary">{selectedProduct.merchantName.slice(0, 3).join(', ')}{selectedProduct.merchantName.length > 3 ? ` +${selectedProduct.merchantName.length - 3}` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* METADATA TAB */}
                  <TabsContent value="metadata" className="space-y-4 pr-4">
                    {/* Developers & Publishers */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProduct.developers !== null && selectedProduct.developers !== undefined && selectedProduct.developers.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <Users className="h-4 w-4" />Developers
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedProduct.developers.map((dev, i) => (
                              <Badge key={i} variant="outline" className="border-cyan-glow/30 text-cyan-glow text-xs">{dev}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedProduct.publishers !== null && selectedProduct.publishers !== undefined && selectedProduct.publishers.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <Building className="h-4 w-4" />Publishers
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedProduct.publishers.map((pub, i) => (
                              <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400 text-xs">{pub}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Genres */}
                    {selectedProduct.genres !== null && selectedProduct.genres !== undefined && selectedProduct.genres.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <Gamepad2 className="h-4 w-4" />Genres
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedProduct.genres.map((genre, i) => (
                            <Badge key={i} variant="outline" className="border-green-500/30 text-green-400 text-xs">{genre}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedProduct.tags !== null && selectedProduct.tags !== undefined && selectedProduct.tags.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <Tag className="h-4 w-4" />Tags
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedProduct.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Regional Restrictions */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Globe className="h-4 w-4" />Regional Information
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {selectedProduct.regionId !== null && selectedProduct.regionId !== undefined && (
                          <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                            <span className="text-text-secondary">Region ID:</span>
                            <span className="text-text-primary font-medium">{selectedProduct.regionId}</span>
                          </div>
                        )}
                        {selectedProduct.regionalLimitations !== null && selectedProduct.regionalLimitations !== undefined && (
                          <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-yellow-500/20">
                            <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                            <span className="text-text-secondary">Limitations:</span>
                            <span className="text-yellow-400 text-xs">{selectedProduct.regionalLimitations}</span>
                          </div>
                        )}
                      </div>
                      {selectedProduct.countryLimitation !== null && selectedProduct.countryLimitation !== undefined && selectedProduct.countryLimitation.length > 0 && (
                        <div className="p-2 rounded bg-bg-primary border border-red-500/20">
                          <span className="text-text-secondary text-sm">Restricted Countries: </span>
                          <span className="text-red-400 text-xs">{selectedProduct.countryLimitation.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Languages */}
                    {selectedProduct.languages !== null && selectedProduct.languages !== undefined && selectedProduct.languages.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <Languages className="h-4 w-4" />Languages
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedProduct.languages.map((lang, i) => (
                            <Badge key={i} variant="outline" className="border-blue-500/30 text-blue-400 text-xs">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Steam Link */}
                    {selectedProduct.steam !== null && selectedProduct.steam !== undefined && (
                      <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                        <ExternalLink className="h-4 w-4 text-cyan-glow" />
                        <span className="text-text-secondary">Steam:</span>
                        <a href={selectedProduct.steam} target="_blank" rel="noopener noreferrer" className="text-cyan-glow hover:underline text-sm truncate">
                          {selectedProduct.steam}
                        </a>
                      </div>
                    )}
                  </TabsContent>

                  {/* MEDIA TAB */}
                  <TabsContent value="media" className="space-y-4 pr-4">
                    {/* Cover Images */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />Cover Images
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedProduct.coverImageUrl !== null && selectedProduct.coverImageUrl !== undefined && (
                          <div className="space-y-1">
                            <span className="text-xs text-text-secondary">Full Cover</span>
                            <div className="relative h-32 rounded-lg overflow-hidden bg-bg-primary border border-cyan-glow/10">
                              <Image src={selectedProduct.coverImageUrl} alt="Cover" fill className="object-cover" unoptimized />
                            </div>
                          </div>
                        )}
                        {selectedProduct.coverThumbnailUrl !== null && selectedProduct.coverThumbnailUrl !== undefined && (
                          <div className="space-y-1">
                            <span className="text-xs text-text-secondary">Thumbnail</span>
                            <div className="relative h-32 rounded-lg overflow-hidden bg-bg-primary border border-cyan-glow/10">
                              <Image src={selectedProduct.coverThumbnailUrl} alt="Thumbnail" fill className="object-cover" unoptimized />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Screenshots */}
                    {selectedProduct.screenshots !== null && selectedProduct.screenshots !== undefined && selectedProduct.screenshots.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />Screenshots ({selectedProduct.screenshots.length})
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedProduct.screenshots.slice(0, 6).map((screenshot, i) => (
                            <a key={i} href={screenshot.url} target="_blank" rel="noopener noreferrer" className="relative h-20 rounded overflow-hidden bg-bg-primary border border-cyan-glow/10 hover:border-cyan-glow/50 transition-colors">
                              <Image src={screenshot.thumbnail ?? screenshot.url} alt={`Screenshot ${i + 1}`} fill className="object-cover" unoptimized />
                            </a>
                          ))}
                        </div>
                        {selectedProduct.screenshots.length > 6 && (
                          <p className="text-xs text-text-secondary">+{selectedProduct.screenshots.length - 6} more screenshots</p>
                        )}
                      </div>
                    )}

                    {/* Videos */}
                    {selectedProduct.videos !== null && selectedProduct.videos !== undefined && selectedProduct.videos.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <Video className="h-4 w-4" />Videos ({selectedProduct.videos.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedProduct.videos.slice(0, 3).map((video, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                              <Video className="h-4 w-4 text-red-400" />
                              <a 
                                href={`https://www.youtube.com/watch?v=${video.videoId}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-cyan-glow hover:underline text-sm"
                              >
                                Video {i + 1} - {video.videoId}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedProduct.coverImageUrl === null || selectedProduct.coverImageUrl === undefined) && (selectedProduct.screenshots === null || selectedProduct.screenshots === undefined || selectedProduct.screenshots.length === 0) && (selectedProduct.videos === null || selectedProduct.videos === undefined || selectedProduct.videos.length === 0) && (
                      <div className="text-center py-8 text-text-secondary">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No media available for this product</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* TECHNICAL TAB */}
                  <TabsContent value="technical" className="space-y-4 pr-4">
                    {/* System Requirements */}
                    {selectedProduct.systemRequirements !== null && selectedProduct.systemRequirements !== undefined && selectedProduct.systemRequirements.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <Cpu className="h-4 w-4" />System Requirements
                        </h4>
                        {selectedProduct.systemRequirements.map((sysReq, i) => (
                          <div key={i} className="p-3 rounded-lg bg-bg-primary border border-cyan-glow/10">
                            <div className="text-sm font-medium text-cyan-glow mb-2">{sysReq.system}</div>
                            <div className="space-y-1">
                              {sysReq.requirement?.map((req, j) => (
                                <p key={j} className="text-xs text-text-secondary">{req}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Product IDs */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Hash className="h-4 w-4" />Product Identifiers
                      </h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                          <span className="text-text-secondary">Internal ID:</span>
                          <code className="text-cyan-glow bg-cyan-glow/10 px-2 py-0.5 rounded text-xs">{selectedProduct.id}</code>
                        </div>
                        {selectedProduct.slug !== null && selectedProduct.slug !== undefined && (
                          <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                            <span className="text-text-secondary">Slug:</span>
                            <code className="text-cyan-glow bg-cyan-glow/10 px-2 py-0.5 rounded text-xs">{selectedProduct.slug}</code>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Clock className="h-4 w-4" />Timestamps
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedProduct.createdAt !== null && selectedProduct.createdAt !== undefined && (
                          <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                            <span className="text-text-secondary">Created:</span>
                            <span className="text-text-primary">{new Date(selectedProduct.createdAt).toLocaleString()}</span>
                          </div>
                        )}
                        {selectedProduct.updatedAt !== null && selectedProduct.updatedAt !== undefined && (
                          <div className="flex items-center gap-2 p-2 rounded bg-bg-primary border border-cyan-glow/10">
                            <span className="text-text-secondary">Updated:</span>
                            <span className="text-text-primary">{new Date(selectedProduct.updatedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(selectedProduct.systemRequirements === null || selectedProduct.systemRequirements === undefined || selectedProduct.systemRequirements.length === 0) && (
                      <div className="text-center py-8 text-text-secondary">
                        <Cpu className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No system requirements specified</p>
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              {/* Actions - Always visible at bottom */}
              <div className="flex gap-2 pt-4 border-t border-cyan-glow/10">
                <Link href={`/admin/catalog/products/${selectedProduct.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Product
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-gray-border text-text-secondary hover:text-text-primary"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-bg-secondary border border-red-500/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {isBulkDelete ? 'Delete Multiple Products' : 'Delete Product'}
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              {isBulkDelete
                ? `You are about to permanently delete ${selectedProductIds.size} product${selectedProductIds.size > 1 ? 's' : ''}. This action cannot be undone.`
                : 'You are about to permanently delete this product. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
              className="border-gray-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {(deleteMutation.isPending || bulkDeleteMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {isBulkDelete ? `${selectedProductIds.size} Products` : 'Product'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
