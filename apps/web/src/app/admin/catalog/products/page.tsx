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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
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
                      const isActionPending = isPublishing || isUnpublishing;

                      return (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="border-b border-cyan-glow/10 hover:bg-cyan-glow/5 transition-colors"
                        >
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
                                disabled={true}
                                title="Reprice functionality coming in Task 5.4"
                                className="border-cyan-glow/30 text-cyan-glow/50"
                              >
                                <DollarSign className="mr-1 h-3 w-3" />
                                Reprice
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

      {/* Product Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-bg-secondary border-cyan-glow/20 text-text-primary">
          {selectedProduct !== null && selectedProduct !== undefined && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
                  {selectedProduct.title}
                  <Badge
                    variant="outline"
                    className={selectedProduct.sourceType === 'kinguin'
                      ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                      : 'border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow'
                    }
                  >
                    {selectedProduct.sourceType === 'kinguin' ? 'Kinguin' : 'Custom'}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-text-secondary">
                  {selectedProduct.subtitle ?? 'No subtitle'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
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

                {/* Product Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Platform & Region */}
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-cyan-glow" />
                    <span className="text-text-secondary">Platform:</span>
                    <span className="text-text-primary font-medium">{selectedProduct.platform ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-glow" />
                    <span className="text-text-secondary">Region:</span>
                    <span className="text-text-primary font-medium">{selectedProduct.region ?? 'N/A'}</span>
                  </div>

                  {/* Category & DRM */}
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-cyan-glow" />
                    <span className="text-text-secondary">Category:</span>
                    <span className="text-text-primary font-medium">{selectedProduct.category ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-cyan-glow" />
                    <span className="text-text-secondary">DRM:</span>
                    <span className="text-text-primary font-medium">{selectedProduct.drm ?? 'N/A'}</span>
                  </div>

                  {/* Rating */}
                  {selectedProduct.rating !== null && selectedProduct.rating !== undefined && Number(selectedProduct.rating) > 0 && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-text-secondary">Rating:</span>
                      <span className="text-text-primary font-medium">{Number(selectedProduct.rating).toFixed(1)} / 5</span>
                    </div>
                  )}

                  {/* Age Rating */}
                  {selectedProduct.ageRating !== null && selectedProduct.ageRating !== undefined && selectedProduct.ageRating.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-cyan-glow" />
                      <span className="text-text-secondary">Age Rating:</span>
                      <span className="text-text-primary font-medium">{selectedProduct.ageRating}</span>
                    </div>
                  )}

                  {/* Kinguin Offer ID */}
                  {selectedProduct.kinguinOfferId !== null && selectedProduct.kinguinOfferId !== undefined && selectedProduct.kinguinOfferId.length > 0 && (
                    <div className="flex items-center gap-2 col-span-2">
                      <ExternalLink className="h-4 w-4 text-orange-400" />
                      <span className="text-text-secondary">Kinguin ID:</span>
                      <code className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs">
                        {selectedProduct.kinguinOfferId}
                      </code>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedProduct.description !== null && selectedProduct.description !== undefined && selectedProduct.description.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-text-secondary">Description</h4>
                    <p className="text-sm text-text-primary bg-bg-primary p-3 rounded-lg border border-cyan-glow/10 max-h-32 overflow-y-auto">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                {/* Pricing */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary border border-cyan-glow/10">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xs text-text-secondary block">Cost</span>
                      <span className="text-lg font-bold text-text-primary">
                        €{parseFloat(String(selectedProduct.cost ?? '0')).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-text-secondary block">Price</span>
                      <span className="text-lg font-bold text-green-success">
                        €{parseFloat(String(selectedProduct.price ?? '0')).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={selectedProduct.isPublished
                      ? 'border-green-success/50 bg-green-success/10 text-green-success'
                      : 'border-gray-border bg-gray-600/10 text-gray-400'
                    }
                  >
                    {selectedProduct.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
