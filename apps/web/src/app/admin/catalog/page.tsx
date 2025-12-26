'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminCatalogProductsApi, AdminCatalogSyncApi, AdminCatalogPricingApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/design-system/primitives/table';
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';

const productsApi = new AdminCatalogProductsApi(apiConfig);
const syncApi = new AdminCatalogSyncApi(apiConfig);
const pricingApi = new AdminCatalogPricingApi(apiConfig);

export default function AdminCatalogPage(): React.ReactElement | null {
    const { isLoading, isAdmin } = useAdminGuard();

    // Products State
    const [productSearch, setProductSearch] = useState('');

    // Sync State
    const [isSyncing, setIsSyncing] = useState(false);

    // Products Query
    const { data: products, isLoading: isProductsLoading, refetch: refetchProducts } = useQuery({
        queryKey: ['admin-products', productSearch],
        queryFn: async () => {
            return await productsApi.adminProductsControllerListAll({
                search: productSearch,
                platform: '',
                region: '',
                published: '',
                source: '',
            });
        },
        enabled: isAdmin,
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
    });

    // Sync Mutation
    const syncMutation = useMutation({
        mutationFn: async (fullSync: boolean) => {
            return await syncApi.adminSyncControllerTriggerSync({ fullSync });
        },
        onSuccess: () => {
            setIsSyncing(true);
            // Poll for status or just show success message
            setTimeout(() => setIsSyncing(false), 5000); // Mock sync duration for UI feedback
        },
    });

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
                                <CardTitle>Product Catalog</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Search products..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="w-[250px]"
                                    />
                                    <Button variant="outline" size="icon" onClick={() => refetchProducts()}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isProductsLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
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
                                        {(products?.length ?? 0) > 0 ? (
                                            products?.map((product) => (
                                                <TableRow key={product.id}>
                                                    <TableCell className="font-medium">{product.title}</TableCell>
                                                    <TableCell>{product.platform}</TableCell>
                                                    <TableCell>{product.region}</TableCell>
                                                    <TableCell>${parseFloat(product.price ?? '0').toFixed(2)}</TableCell>
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
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sync Tab */}
                <TabsContent value="sync" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kinguin Catalog Sync</CardTitle>
                            <CardDescription>Synchronize local product catalog with Kinguin API.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={() => syncMutation.mutate(false)}
                                    disabled={syncMutation.isPending || isSyncing}
                                >
                                    {syncMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Trigger Delta Sync
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => syncMutation.mutate(true)}
                                    disabled={syncMutation.isPending || isSyncing}
                                >
                                    {syncMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Trigger Full Sync
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
