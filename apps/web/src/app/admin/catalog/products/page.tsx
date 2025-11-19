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
          <h1 className="text-3xl font-bold tracking-tight">Catalog Products</h1>
          <p className="text-muted-foreground mt-2">
            Manage products from Kinguin sync and custom listings
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Network Status Alert */}
      {!isOnline && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Internet Connection</AlertTitle>
          <AlertDescription>
            Please check your network connection and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {lastError != null && lastError.length > 0 && isOnline && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Products</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>{lastError}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter products by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Platform Filter */}
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="region">Region</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="published">Status</Label>
              <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                <SelectTrigger id="published">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
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
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
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
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading products...</span>
            </div>
          ) : error != null && (lastError == null || lastError.length === 0) ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Failed to Load Products</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </AlertDescription>
              </Alert>
          ) : products == null || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or run a Kinguin sync
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(products ?? []).map((product: AdminProductResponseDto) => {
                    const isPublishing = publishMutation.isPending && publishMutation.variables === product.id;
                    const isUnpublishing = unpublishMutation.isPending && unpublishMutation.variables === product.id;
                    const isActionPending = isPublishing || isUnpublishing;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {(product.title ?? '').length > 0 ? product.title : 'Untitled'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.category ?? 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {product.platform ?? 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {product.region ?? 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPrice(product.costMinor)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatPrice(product.priceMinor)}
                        </TableCell>
                        <TableCell>
                          {product.isPublished ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
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
                            >
                              <DollarSign className="mr-1 h-3 w-3" />
                              Reprice
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
