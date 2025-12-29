'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Package, Check, AlertCircle, Loader2, Crown } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Input } from '@/design-system/primitives/input';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/design-system/primitives/table';
import { Alert, AlertDescription } from '@/design-system/primitives/alert';
import { Skeleton } from '@/design-system/primitives/skeleton';

import {
  AdminCatalogKinguinApi,
  type KinguinProductResultDto,
} from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const kinguinApi = new AdminCatalogKinguinApi(apiConfig);

export default function AdminImportPage(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const queryClient = useQueryClient();

  // Debounce search input
  const handleSearchChange = useCallback((value: string): (() => void) | undefined => {
    setSearchQuery(value);
    // Only trigger search if 3+ characters
    if (value.length >= 3) {
      const timer = setTimeout(() => {
        setDebouncedQuery(value);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDebouncedQuery('');
      return undefined;
    }
  }, []);

  // Search Kinguin products
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
    isFetching,
  } = useQuery({
    queryKey: ['kinguin-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery === '' || debouncedQuery.length < 3) {
        return null;
      }
      const response = await kinguinApi.adminKinguinControllerSearchProducts({
        query: debouncedQuery,
        limit: '20',
      });
      return response;
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 30_000, // 30 seconds
  });

  // Import product mutation
  const importMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await kinguinApi.adminKinguinControllerImportProduct({
        productId,
      });
      return response;
    },
    onSuccess: (data) => {
      toast.success(data.isNew ? 'Product Imported!' : 'Product Updated!', {
        description: `"${data.title}" has been ${data.isNew ? 'added to' : 'updated in'} your catalog.`,
      });
      // Invalidate search results to update the "Already Imported" status
      void queryClient.invalidateQueries({ queryKey: ['kinguin-search'] });
      // Invalidate products list if user navigates there
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error) => {
      toast.error('Import Failed', {
        description: error instanceof Error ? error.message : 'Failed to import product',
      });
    },
  });

  const handleImport = (productId: string): void => {
    importMutation.mutate(productId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import from Kinguin</h1>
        <p className="text-muted-foreground mt-2">
          Search for products on Kinguin and import them to your catalog one by one.
        </p>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Search Kinguin Products
          </CardTitle>
          <CardDescription>
            Enter at least 3 characters to search. Results will show products available on Kinguin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for games, software, keys..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          
      {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Type at least 3 characters to search...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {searchError !== null && searchError !== undefined && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchError instanceof Error ? searchError.message : 'Failed to search Kinguin products'}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {isSearching && debouncedQuery.length >= 3 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults !== null && searchResults !== undefined && !isSearching && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Search Results</span>
              <Badge variant="secondary">
                {searchResults.totalCount} product{searchResults.totalCount !== 1 ? 's' : ''} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No products found</h3>
                <p className="text-muted-foreground mt-1">
                  Try a different search term or check your spelling.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.results.map((product: KinguinProductResultDto) => (
                    <TableRow key={product.productId}>
                      <TableCell>
                        {product.coverImageUrl !== undefined && product.coverImageUrl !== null && product.coverImageUrl !== '' ? (
                          <Image
                            src={product.coverImageUrl}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium line-clamp-1">{product.name}</span>
                          {product.originalName !== undefined && product.originalName !== null && product.originalName !== '' && product.originalName !== product.name && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {product.originalName}
                            </span>
                          )}
                          {product.metacriticScore !== null && product.metacriticScore !== undefined && product.metacriticScore > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Metacritic: {product.metacriticScore}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.platform !== undefined && product.platform !== null && product.platform !== '' ? (
                          <Badge variant="outline">{product.platform}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.region !== undefined && product.region !== null && product.region !== '' ? (
                          <Badge variant="secondary">{product.region}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Global</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.alreadyImported ? (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Imported
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleImport(product.productId)}
                            disabled={importMutation.isPending && importMutation.variables === product.productId}
                          >
                            {importMutation.isPending && importMutation.variables === product.productId ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Package className="h-3 w-3 mr-1" />
                                Import
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Search Yet */}
      {(searchResults === null || searchResults === undefined) && !isSearching && debouncedQuery.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Start searching</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                Enter a product name above to search the Kinguin catalog. 
                You can import products one by one to your store.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
