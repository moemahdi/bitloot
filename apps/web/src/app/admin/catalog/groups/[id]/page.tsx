'use client';

/**
 * Admin Product Group Detail/Edit Page
 *
 * Features:
 * - Edit group details (title, tagline, cover image, status)
 * - View and manage assigned products
 * - Add/remove products from group
 * - Toggle group visibility
 * - Refresh cached statistics
 *
 * Follows Level 5 admin page patterns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Input } from '@/design-system/primitives/input';
import { Textarea } from '@/design-system/primitives/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { Switch } from '@/design-system/primitives/switch';
import { Label } from '@/design-system/primitives/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import { Checkbox } from '@/design-system/primitives/checkbox';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import {
  RefreshCw,
  AlertTriangle,
  XCircle,
  Save,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  Layers,
  Eye,
  EyeOff,
  DollarSign,
  Package,
  BarChart3,
  Plus,
  Search,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type {
  ProductGroupWithProductsDto,
  GroupProductVariantDto,
  AdminProductResponseDto,
} from '@bitloot/sdk';
import { AdminProductGroupsApi, AdminCatalogProductsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion } from 'framer-motion';

export default function AdminProductGroupDetailPage(): React.JSX.Element {
  const params = useParams();
  const _router = useRouter();
  const groupId = params.id as string;

  // Form state
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Dialog state
  const [addProductsOpen, setAddProductsOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState<GroupProductVariantDto | null>(null);

  // Error handling
  const [lastError, setLastError] = useState<string | null>(null);
  const { handleError, clearError } = useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error: Error): void => {
      setLastError(error.message);
    },
    onRecovery: (): void => {
      setLastError(null);
    },
  });

  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();

  // Fetch group
  const groupQuery = useQuery({
    queryKey: ['admin', 'catalog', 'groups', groupId],
    queryFn: async (): Promise<ProductGroupWithProductsDto> => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      const response = await api.adminGroupsControllerFindById({ id: groupId });
      clearError();
      return response;
    },
    enabled: groupId !== '',
    staleTime: 30_000,
  });

  // Fetch available products for assignment
  const productsQuery = useQuery({
    queryKey: ['admin', 'catalog', 'products', 'ungrouped', productSearch],
    queryFn: async () => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminCatalogProductsApi(apiConfig);
      // Fetch products - we'll filter client-side for ungrouped ones
      const response = await api.adminProductsControllerListAll({
        page: '1',
        limit: '100',
        search: productSearch !== '' ? productSearch : undefined,
      });
      return response;
    },
    enabled: addProductsOpen,
    staleTime: 10_000,
  });

  // Initialize form with group data
  useEffect(() => {
    if (groupQuery.data !== undefined) {
      setTitle(groupQuery.data.title);
      setTagline(groupQuery.data.tagline ?? '');
      setCoverImageUrl(groupQuery.data.coverImageUrl ?? '');
      setIsActive(groupQuery.data.isActive);
      setDisplayOrder(groupQuery.data.displayOrder ?? 0);
      setHasChanges(false);
    }
  }, [groupQuery.data]);

  // Track changes
  useEffect(() => {
    if (groupQuery.data !== undefined) {
      const changed =
        title !== groupQuery.data.title ||
        tagline !== (groupQuery.data.tagline ?? '') ||
        coverImageUrl !== (groupQuery.data.coverImageUrl ?? '') ||
        isActive !== groupQuery.data.isActive ||
        displayOrder !== (groupQuery.data.displayOrder ?? 0);
      setHasChanges(changed);
    }
  }, [title, tagline, coverImageUrl, isActive, displayOrder, groupQuery.data]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerUpdate({
        id: groupId,
        updateProductGroupDto: {
          title,
          tagline: tagline !== '' ? tagline : undefined,
          coverImageUrl: coverImageUrl !== '' ? coverImageUrl : undefined,
          isActive,
          displayOrder,
        },
      });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups'] });
      setHasChanges(false);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'update-group');
    },
  });

  // Assign products mutation
  const assignMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerAssignProducts({
        id: groupId,
        assignProductsToGroupDto: { productIds },
      });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups', groupId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'products'] });
      setAddProductsOpen(false);
      setSelectedProductIds([]);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'assign-products');
    },
  });

  // Remove product mutation
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerRemoveProducts({
        id: groupId,
        removeProductsFromGroupDto: { productIds: [productId] },
      });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups', groupId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'products'] });
      setRemoveConfirmOpen(false);
      setProductToRemove(null);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'remove-product');
    },
  });

  // Refresh stats mutation
  const refreshStatsMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerRefreshStats({ id: groupId });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups', groupId] });
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'refresh-stats');
    },
  });

  // Toggle product selection
  const toggleProductSelection = (productId: string): void => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Get available products (exclude already assigned)
  const assignedProductIds = groupQuery.data?.products?.map((p: GroupProductVariantDto) => p.id) ?? [];
  const availableProducts = (productsQuery.data?.products ?? []).filter(
    (p: AdminProductResponseDto) => !assignedProductIds.includes(p.id)
  );

  // Format price
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '-';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `$${num.toFixed(2)}`;
  };

  if (groupQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
      </div>
    );
  }

  if (groupQuery.isError || groupQuery.data === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <XCircle className="h-16 w-16 text-accent-error" />
        <p className="text-text-secondary">Failed to load group</p>
        <Button onClick={() => groupQuery.refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/admin/catalog/groups">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Link>
        </Button>
      </div>
    );
  }

  const group = groupQuery.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/catalog/groups">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Layers className="h-6 w-6 text-cyan-glow" />
              Edit Group
            </h1>
            <p className="text-sm text-text-secondary mt-1">{group.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshStatsMutation.mutate()}
            disabled={refreshStatsMutation.isPending}
          >
            {refreshStatsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh Stats</span>
          </Button>
          <GlowButton
            onClick={() => updateMutation.mutate()}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </GlowButton>
        </div>
      </div>

      {/* Offline Alert */}
      {!isOnline && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>You&apos;re offline</AlertTitle>
          <AlertDescription>
            Please check your internet connection to save changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {lastError !== null && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{lastError}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {updateMutation.isSuccess && !hasChanges && (
        <Alert className="border-accent-success/50 bg-accent-success/10">
          <CheckCircle className="h-4 w-4 text-accent-success" />
          <AlertTitle className="text-accent-success">Changes Saved</AlertTitle>
          <AlertDescription>Group has been updated successfully.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Group Details Card */}
        <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pencil className="h-4 w-4 text-cyan-glow" />
              Group Details
            </CardTitle>
            <CardDescription>Edit the group&apos;s information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Battlefield 6"
              />
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Textarea
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Short description..."
                rows={2}
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {coverImageUrl !== '' && (
                <div className="mt-2 relative w-32 h-32 rounded-lg overflow-hidden border border-border-subtle">
                  <Image
                    src={coverImageUrl}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    onError={() => setCoverImageUrl('')}
                  />
                </div>
              )}
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => { const val = parseInt(e.target.value, 10); setDisplayOrder(Number.isNaN(val) ? 0 : val); }}
                min={0}
              />
              <p className="text-xs text-text-muted">
                Lower numbers appear first. Default is 0.
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                {isActive ? (
                  <span className="flex items-center gap-2 text-accent-success">
                    <Eye className="h-4 w-4" />
                    Active (Visible in catalog)
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-text-muted">
                    <EyeOff className="h-4 w-4" />
                    Inactive (Hidden from catalog)
                  </span>
                )}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-glow" />
              Group Statistics
            </CardTitle>
            <CardDescription>Cached price range and product count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                  <Package className="h-4 w-4" />
                  Products
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {group.productCount ?? 0}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                  <DollarSign className="h-4 w-4" />
                  Min Price
                </div>
                <div className="text-2xl font-bold text-cyan-glow">
                  {formatPrice(group.minPrice)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                  <DollarSign className="h-4 w-4" />
                  Max Price
                </div>
                <div className="text-2xl font-bold text-accent-warning">
                  {formatPrice(group.maxPrice)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                  <BarChart3 className="h-4 w-4" />
                  Slug
                </div>
                <div className="text-sm font-mono text-text-secondary truncate">
                  {group.slug}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Products Card */}
      <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-4 w-4 text-cyan-glow" />
                Assigned Products
              </CardTitle>
              <CardDescription>
                {group.products?.length ?? 0} product{(group.products?.length ?? 0) !== 1 ? 's' : ''} in this group
              </CardDescription>
            </div>
            <GlowButton size="sm" onClick={() => setAddProductsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Products
            </GlowButton>
          </div>
        </CardHeader>
        <CardContent>
          {(group.products?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Package className="h-12 w-12 text-text-muted" />
              <p className="text-text-secondary">No products assigned to this group</p>
              <GlowButton onClick={() => setAddProductsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Product
              </GlowButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Edition</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.products?.map((product) => (
                    <TableRow key={product.id}>
                      {/* Image */}
                      <TableCell>
                        <div className="w-10 h-10 rounded overflow-hidden bg-bg-tertiary">
                          {product.coverImageUrl !== null && product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                            <Image
                              src={product.coverImageUrl}
                              alt={product.title}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-text-muted" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Product Info */}
                      <TableCell>
                        <Link
                          href={`/admin/catalog/products/${product.id}`}
                          className="font-medium text-text-primary hover:text-cyan-glow"
                        >
                          {product.title}
                        </Link>
                      </TableCell>

                      {/* Platform */}
                      <TableCell>
                        <Badge variant="outline">{product.platform ?? '-'}</Badge>
                      </TableCell>

                      {/* Edition */}
                      <TableCell>
                        <span className="text-sm text-text-secondary">
                          {product.subtitle ?? 'Standard'}
                        </span>
                      </TableCell>

                      {/* Region */}
                      <TableCell>
                        <span className="text-sm text-text-secondary">
                          {product.region ?? 'Global'}
                        </span>
                      </TableCell>

                      {/* Price */}
                      <TableCell className="text-right">
                        <span className="font-medium text-cyan-glow">
                          {formatPrice(product.price)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-accent-error hover:text-accent-error hover:bg-accent-error/10"
                          onClick={() => {
                            setProductToRemove(product);
                            setRemoveConfirmOpen(true);
                          }}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Products Dialog */}
      <Dialog open={addProductsOpen} onOpenChange={setAddProductsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-glow" />
              Add Products to Group
            </DialogTitle>
            <DialogDescription>
              Select products to add to &quot;{group.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Product List */}
            <ScrollArea className="h-80">
              {productsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-glow" />
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                  <Package className="h-8 w-8 mb-2" />
                  <p>No available products found</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {availableProducts.map((product: AdminProductResponseDto) => (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedProductIds.includes(product.id)
                          ? 'border-cyan-glow bg-cyan-glow/10'
                          : 'border-border-subtle bg-bg-tertiary hover:border-cyan-glow/50'
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <div className="w-10 h-10 rounded overflow-hidden bg-bg-secondary flex-shrink-0">
                        {product.coverImageUrl !== null && product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                          <Image
                            src={product.coverImageUrl}
                            alt={product.title}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text-primary truncate">
                          {product.title}
                        </div>
                        <div className="flex gap-2 text-xs text-text-muted">
                          <span>{product.platform ?? '-'}</span>
                          <span>•</span>
                          <span>{product.region ?? 'Global'}</span>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-cyan-glow">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Selection Count */}
            {selectedProductIds.length > 0 && (
              <div className="text-sm text-text-muted">
                {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setAddProductsOpen(false);
                setSelectedProductIds([]);
                setProductSearch('');
              }}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <GlowButton
              onClick={() => assignMutation.mutate(selectedProductIds)}
              disabled={selectedProductIds.length === 0 || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add {selectedProductIds.length} Product{selectedProductIds.length !== 1 ? 's' : ''}
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Product Confirmation */}
      <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-accent-error">
              <Trash2 className="h-5 w-5" />
              Remove Product from Group
            </DialogTitle>
            <DialogDescription>
              Remove &quot;{productToRemove?.title}&quot; from this group? The product will not
              be deleted, only unassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRemoveConfirmOpen(false)}
              disabled={removeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => productToRemove !== null && removeMutation.mutate(productToRemove.id)}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
