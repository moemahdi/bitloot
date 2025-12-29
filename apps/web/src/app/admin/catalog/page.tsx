'use client';

import { useState } from 'react';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { AdminCatalogProductsApi, AdminCatalogSyncApi, AdminCatalogPricingApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import { Progress } from '@/design-system/primitives/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/design-system/primitives/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system/primitives/select';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { Loader2, RefreshCw, CheckCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';

const productsApi = new AdminCatalogProductsApi(apiConfig);
const syncApi = new AdminCatalogSyncApi(apiConfig);
const pricingApi = new AdminCatalogPricingApi(apiConfig);

// Cache time constants - prevent excessive API calls to avoid rate limits
const PRODUCTS_STALE_TIME = 60_000; // 1 minute - products don't change often
const PRODUCTS_GC_TIME = 300_000; // 5 minutes - keep in cache for navigation

export default function AdminCatalogPage(): React.ReactElement | null {
    const { isLoading, isAdmin } = useAdminGuard();

    // Products State with Pagination
    const [productSearch, setProductSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Sync State
    const [isSyncing, setIsSyncing] = useState(false);

    // Products Query with Pagination
    const { 
        data: productsData, 
        isLoading: isProductsLoading, 
        isFetching: isProductsFetching,
        refetch: refetchProducts 
    } = useQuery({
        queryKey: ['admin-products', productSearch, currentPage, pageSize],
        queryFn: async () => {
            return await productsApi.adminProductsControllerListAll({
                search: productSearch,
                platform: '',
                region: '',
                published: '',
                source: '',
                page: String(currentPage),
                limit: String(pageSize),
            });
        },
        enabled: isAdmin,
        staleTime: PRODUCTS_STALE_TIME, // Don't refetch for 1 minute
        gcTime: PRODUCTS_GC_TIME, // Keep in cache for 5 minutes
        placeholderData: keepPreviousData, // Show previous data while loading new page
    });

    // Pricing Rules Query
    const { refetch: refetchRules } = useQuery({
        queryKey: ['admin-pricing-rules'],
        queryFn: async () => {
            return await pricingApi.adminPricingControllerListAll({
                productId: '',
                ruleType: '',
                isActive: '',
                page: '1',
                limit: '50',
            });
        },
        enabled: isAdmin,
        staleTime: PRODUCTS_STALE_TIME,
        gcTime: PRODUCTS_GC_TIME,
    });

    // Sync Mutation
    const syncMutation = useMutation({
        mutationFn: async () => {
            return await syncApi.adminSyncControllerTriggerSync();
        },
        onSuccess: () => {
            setIsSyncing(true);
            // Poll for status or just show success message
            setTimeout(() => setIsSyncing(false), 5000); // Mock sync duration for UI feedback
        },
    });

    // Handle search with debounce reset to page 1
    const handleSearchChange = (value: string): void => {
        setProductSearch(value);
        setCurrentPage(1); // Reset to first page on new search
    };

    // Handle page size change
    const handlePageSizeChange = (value: string): void => {
        setPageSize(parseInt(value, 10));
        setCurrentPage(1); // Reset to first page
    };

    // Pagination helpers
    const totalPages = productsData?.totalPages ?? 1;
    const totalProducts = productsData?.total ?? 0;
    const products = productsData?.products ?? [];
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    // Loading skeleton for table rows
    const LoadingSkeleton = (): React.ReactElement => (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
            ))}
        </>
    );

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Catalog Management</h1>
                    <p className="text-muted-foreground">Manage products, sync with Kinguin, and pricing rules.</p>
                </div>
            </div>

            <Tabs defaultValue="products" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="sync">Kinguin Sync</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <CardTitle>Product Catalog</CardTitle>
                                    <CardDescription>
                                        {totalProducts.toLocaleString()} products total
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Search products..."
                                        value={productSearch}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="w-[250px]"
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => refetchProducts()}
                                        disabled={isProductsFetching}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isProductsFetching ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>
                            {/* Loading Progress Bar */}
                            {isProductsFetching && (
                                <Progress value={undefined} className="h-1 mt-2" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Platform</TableHead>
                                        <TableHead>Region</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isProductsLoading ? (
                                        <LoadingSkeleton />
                                    ) : products.length > 0 ? (
                                        products.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium max-w-[300px] truncate">
                                                    {product.title}
                                                </TableCell>
                                                <TableCell>{product.platform ?? '-'}</TableCell>
                                                <TableCell>{product.region ?? '-'}</TableCell>
                                                <TableCell>€{parseFloat(product.price ?? '0').toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={product.isPublished ? 'default' : 'secondary'}>
                                                        {product.isPublished ? 'Published' : 'Draft'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No products found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                        {/* Pagination Footer */}
                        <CardFooter className="flex items-center justify-between border-t pt-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Rows per page:</span>
                                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                                    <SelectTrigger className="w-[70px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground mr-4">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={!canGoPrevious || isProductsFetching}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={!canGoPrevious || isProductsFetching}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={!canGoNext || isProductsFetching}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={!canGoNext || isProductsFetching}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Sync Tab */}
                <TabsContent value="sync" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kinguin Catalog Sync</CardTitle>
                            <CardDescription>Synchronize imported Kinguin products with latest prices and stock.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={() => syncMutation.mutate()}
                                    disabled={syncMutation.isPending || isSyncing}
                                >
                                    {syncMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Sync Imported Products
                                </Button>
                            </div>

                            {isSyncing && (
                                <Alert>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <AlertTitle>Sync in progress</AlertTitle>
                                    <AlertDescription>
                                        The catalog is currently synchronizing with Kinguin. This may take a few minutes.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {syncMutation.isSuccess && !isSyncing && (
                                <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-800">Sync Triggered</AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        Sync job has been successfully queued.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pricing Rules Tab */}
                <TabsContent value="pricing" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Pricing Rules</CardTitle>
                                <Button variant="outline" size="icon" onClick={() => refetchRules()}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>Manage dynamic pricing rules for products.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                Pricing rules table - to be implemented
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
