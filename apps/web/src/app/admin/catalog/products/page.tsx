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
import { useState } from 'react';
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
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  DollarSign,
  Loader2,
} from 'lucide-react';
import type { AdminProductResponseDto } from '@bitloot/sdk';
import { AdminCatalogProductsApi, Configuration } from '@bitloot/sdk';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

// Platform options for filter
const PLATFORMS = [
  'STEAM',
  'EPIC',
  'UPLAY',
  'ORIGIN',
  'GOG',
  'XBOX',
  'PLAYSTATION',
  'NINTENDO',
  'BATTLENET',
  'OTHER',
] as const;

// Region options for filter
const REGIONS = ['GLOBAL', 'NA', 'EU', 'UK', 'ASIA', 'LATAM', 'OCEANIA', 'OTHER'] as const;

export default function AdminCatalogProductsPage(): React.JSX.Element {
  // State: filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [lastError, setLastError] = useState<string | null>(null);

  // API Configuration
  const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: (): string => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('accessToken') ?? '';
      }
      return '';
    },
  });

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

  // Fetch products with filters
  const productsQuery = useQuery({
    queryKey: ['admin', 'catalog', 'products', searchQuery, platformFilter, regionFilter, publishedFilter],
    queryFn: async (): Promise<AdminProductResponseDto[]> => {
      if (!isOnline) {
        throw new Error('No internet connection. Please check your network.');
      }

      try {
        const api = new AdminCatalogProductsApi(apiConfig);

        // Build filter params (using empty string as fallback for required params)
        const response = await api.adminProductsControllerListAll({
          search: searchQuery !== '' ? searchQuery : '',
          platform: platformFilter === 'all' ? '' : platformFilter,
          region: regionFilter === 'all' ? '' : regionFilter,
          published: publishedFilter === 'all' ? '' : publishedFilter,
        });

        clearError();
        return response;
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), 'fetch-products');
        throw error;
      }
    },
    staleTime: 30_000, // 30 seconds
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

  // Handle manual refresh
  const handleRefresh = (): void => {
    clearError();
    void productsQuery.refetch();
  };

  // Format price with proper currency
  const formatPrice = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount / 100); // Convert minor denomination (cents) to dollars
  };

  const { data: products, isLoading, error } = productsQuery;

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                ? `${products.length} product${products.length === 1 ? '' : 's'} found`
                : 'No products'}
          </CardDescription>
        </CardHeader>
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
                            {formatPrice(product.costMinor)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-cyan-glow">
                            {formatPrice(product.priceMinor)}
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
        </CardContent>
      </Card>
    </div>
  );
}
