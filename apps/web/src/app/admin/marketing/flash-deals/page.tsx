'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Label } from '@/design-system/primitives/label';
import { Badge } from '@/design-system/primitives/badge';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { Input } from '@/design-system/primitives/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import {
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  Zap,
  Plus,
  Trash2,
  Edit,
  Timer,
  Play,
  Pause,
  Calendar,
  Package,
  Save,
  X,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import { Configuration } from '@bitloot/sdk';

// Helper to get cookie value
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

// Flash deal type
interface FlashDealProduct {
  id: string;
  productId: string;
  originalPrice?: string;
  discountPrice?: string;
  discountPercent?: string;
  displayOrder: number;
  product?: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl?: string;
    price?: string;
    currency?: string;
  };
}

interface FlashDeal {
  id: string;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  productsCount: number;
  displayType?: 'inline' | 'sticky';
  products: FlashDealProduct[];
  createdAt: string;
  updatedAt: string;
}

// API functions
async function fetchFlashDeals(): Promise<FlashDeal[]> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/flash-deals`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch flash deals');
  }
  const data: unknown = await response.json();
  return data as FlashDeal[];
}

async function createFlashDeal(payload: Partial<FlashDeal>): Promise<FlashDeal> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/flash-deals`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to create flash deal');
  }
  const result: unknown = await response.json();
  return result as FlashDeal;
}

async function updateFlashDeal(id: string, payload: Partial<FlashDeal>): Promise<FlashDeal> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/flash-deals/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to update flash deal');
  }
  const result: unknown = await response.json();
  return result as FlashDeal;
}

async function deleteFlashDeal(id: string): Promise<void> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/flash-deals/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete flash deal');
  }
}

async function activateFlashDeal(id: string): Promise<FlashDeal> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/flash-deals/${id}/activate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to activate flash deal');
  }
  const result: unknown = await response.json();
  return result as FlashDeal;
}

// Product management API functions
async function addProductToFlashDeal(
  flashDealId: string,
  productId: string,
  discountPercent: number,
): Promise<FlashDeal> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(
    `${apiConfig.basePath}/admin/marketing/flash-deals/${flashDealId}/products`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, discountPercent }),
    },
  );
  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => ({}));
    const error = errorData as { message?: string };
    throw new Error(error.message ?? 'Failed to add product');
  }
  const result: unknown = await response.json();
  return result as FlashDeal;
}

async function removeProductFromFlashDeal(
  flashDealId: string,
  productId: string,
): Promise<FlashDeal> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(
    `${apiConfig.basePath}/admin/marketing/flash-deals/${flashDealId}/products/${productId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error('Failed to remove product');
  }
  const result: unknown = await response.json();
  return result as FlashDeal;
}

// Catalog product interface
interface CatalogProduct {
  id: string;
  title: string;
  slug: string;
  price: string;
  currency?: string;
  imageUrl?: string;
  platform?: string;
  category?: string;
}

// Currency symbol helper
function getCurrencySymbol(currency?: string): string {
  const upperCurrency = currency !== null && currency !== undefined && currency !== '' 
    ? currency.toUpperCase() 
    : '';
  
  switch (upperCurrency) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'USD': return '$';
    case 'JPY': return '¥';
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    default: return currency ?? '€'; // Default to EUR
  }
}

interface CatalogResponse {
  data: CatalogProduct[];
  total: number;
  limit: number;
  offset: number;
  pages: number;
}

// Fetch products from catalog
async function fetchCatalogProducts(search?: string): Promise<CatalogProduct[]> {
  const params = new URLSearchParams();
  if (search !== undefined && search !== null && search !== '') params.set('q', search);
  params.set('limit', '20');
  
  const response = await fetch(
    `${apiConfig.basePath}/catalog/products?${params.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = (await response.json()) as unknown as CatalogResponse;
  return data.data;
}

// Calculate time remaining
function getTimeRemaining(endsAt: string): string {
  const end = new Date(endsAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

// Get deal status
function getDealStatus(deal: FlashDeal): { label: string; color: string } {
  const now = new Date();
  const start = new Date(deal.startsAt);
  const end = new Date(deal.endsAt);

  if (!deal.isActive) {
    return { label: 'Inactive', color: 'bg-gray-500/20 text-gray-400' };
  }
  if (now < start) {
    return { label: 'Scheduled', color: 'bg-blue-500/20 text-blue-400' };
  }
  if (now > end) {
    return { label: 'Expired', color: 'bg-red-500/20 text-red-400' };
  }
  return { label: 'Live', color: 'bg-green-500/20 text-green-400' };
}

/**
 * AdminFlashDealsPage - Manage flash deals
 */
export default function AdminFlashDealsPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FlashDeal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FlashDeal | null>(null);
  
  // Product management state
  const [managingProductsDeal, setManagingProductsDeal] = useState<FlashDeal | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [newProductDiscount, setNewProductDiscount] = useState(20);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Fetch catalog products for the search
  const { data: catalogProducts = [], isLoading: isLoadingProducts } = useQuery<CatalogProduct[]>({
    queryKey: ['catalog', 'products', productSearchQuery],
    queryFn: () => fetchCatalogProducts(productSearchQuery),
    enabled: showProductDropdown === true,
    staleTime: 30_000,
  });

  // Filter out products already in the flash deal
  const availableProducts = catalogProducts.filter(
    (p) => !(managingProductsDeal?.products?.some((fp) => fp.productId === p.id) ?? false)
  );

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startsAt: '',
    endsAt: '',
    productsCount: 8,
    displayType: 'inline' as 'inline' | 'sticky',
  });

  // Fetch all flash deals
  const { data: flashDeals = [], isLoading, error, refetch } = useQuery<FlashDeal[]>({
    queryKey: ['admin', 'marketing', 'flash-deals'],
    queryFn: fetchFlashDeals,
    staleTime: 30_000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createFlashDeal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'flash-deals'] });
      setSuccessMessage('Flash deal created successfully');
      setIsCreateOpen(false);
      resetForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FlashDeal> }) => {
      return updateFlashDeal(id, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'flash-deals'] });
      setSuccessMessage('Flash deal updated successfully');
      setEditingDeal(null);
      resetForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFlashDeal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'flash-deals'] });
      setSuccessMessage('Flash deal deleted');
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: activateFlashDeal,
    onSuccess: (deal) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'flash-deals'] });
      setSuccessMessage(`${deal.name} is now ${deal.isActive ? 'active' : 'inactive'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Add product to flash deal mutation
  const addProductMutation = useMutation({
    mutationFn: async ({ dealId, productId, discountPercent }: { dealId: string; productId: string; discountPercent: number }) => {
      return addProductToFlashDeal(dealId, productId, discountPercent);
    },
    onSuccess: (updatedDeal) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'flash-deals'] });
      // Update local state with the updated deal
      setManagingProductsDeal(updatedDeal);
      setSuccessMessage('Product added to flash deal');
      setSelectedProduct(null);
      setProductSearchQuery('');
      setNewProductDiscount(20);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Remove product from flash deal mutation
  const removeProductMutation = useMutation({
    mutationFn: async ({ dealId, productId }: { dealId: string; productId: string }) => {
      return removeProductFromFlashDeal(dealId, productId);
    },
    onSuccess: (updatedDeal) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'flash-deals'] });
      // Update local state with the updated deal
      setManagingProductsDeal(updatedDeal);
      setSuccessMessage('Product removed from flash deal');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  const handleAddProduct = () => {
    if (managingProductsDeal === null || selectedProduct === null) return;
    addProductMutation.mutate({
      dealId: managingProductsDeal.id,
      productId: selectedProduct.id,
      discountPercent: newProductDiscount,
    });
  };

  const handleRemoveProduct = (productId: string) => {
    if (managingProductsDeal === null) return;
    removeProductMutation.mutate({
      dealId: managingProductsDeal.id,
      productId,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startsAt: '',
      endsAt: '',
      productsCount: 8,
      displayType: 'inline',
    });
  };

  const openEdit = (deal: FlashDeal) => {
    setEditingDeal(deal);
    setFormData({
      name: deal.name,
      description: deal.description ?? '',
      startsAt: new Date(deal.startsAt).toISOString().slice(0, 16),
      endsAt: new Date(deal.endsAt).toISOString().slice(0, 16),
      productsCount: deal.productsCount,
      displayType: deal.displayType ?? 'inline',
    });
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      description: formData.description !== '' ? formData.description : undefined,
      startsAt: new Date(formData.startsAt).toISOString(),
      endsAt: new Date(formData.endsAt).toISOString(),
      productsCount: formData.productsCount,
      displayType: formData.displayType,
    };

    if (editingDeal !== null) {
      updateMutation.mutate({ id: editingDeal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-400" />
            Flash Deals
          </h1>
          <p className="text-text-muted mt-1">
            Create time-limited sales to drive urgency and conversions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Plus className="h-4 w-4" />
            New Flash Deal
          </Button>
        </div>
      </div>

      {/* Messages */}
      {successMessage !== null && successMessage !== undefined && successMessage !== '' && (
        <Alert className="border-green-500/30 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertTitle className="text-green-400">Success</AlertTitle>
          <AlertDescription className="text-green-300">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage !== null && errorMessage !== undefined && errorMessage !== '' && (
        <Alert className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Error</AlertTitle>
          <AlertDescription className="text-red-300">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading === true && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-yellow-400" />
          <span className="ml-3 text-text-muted">Loading flash deals...</span>
        </div>
      )}

      {/* Error State */}
      {error !== null && error !== undefined && isLoading === false && (
        <Alert className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Failed to load flash deals</AlertTitle>
          <AlertDescription className="text-red-300">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Flash Deals Table */}
      {isLoading !== true && (error === null || error === undefined) && (
        <Card className="glass border-border-accent">
          <CardHeader>
            <CardTitle>All Flash Deals</CardTitle>
            <CardDescription>
              {flashDeals.length} flash deal{flashDeals.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {flashDeals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Time Left</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flashDeals.map((deal) => {
                    const status = getDealStatus(deal);
                    return (
                      <TableRow key={deal.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-text-primary">{deal.name}</p>
                            {deal.description !== null && deal.description !== undefined && deal.description !== '' && (
                              <p className="text-sm text-text-muted truncate max-w-xs">
                                {deal.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={deal.displayType === 'sticky' 
                              ? 'border-purple-500 text-purple-400' 
                              : 'border-blue-500 text-blue-400'
                            }
                          >
                            {deal.displayType === 'sticky' ? 'Sticky' : 'Inline'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(deal.startsAt).toLocaleDateString()}
                            </p>
                            <p className="text-text-muted">
                              to {new Date(deal.endsAt).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-text-muted" />
                            <span>{deal.products?.length ?? 0} / {deal.productsCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Timer className="h-4 w-4 text-yellow-400" />
                            <span>{getTimeRemaining(deal.endsAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setManagingProductsDeal(deal)}
                              title="Manage Products"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => activateMutation.mutate(deal.id)}
                              disabled={activateMutation.isPending}
                              title={deal.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {deal.isActive ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(deal)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(deal)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-400/50" />
                <p>No flash deals yet</p>
                <p className="text-sm mt-1">Create your first flash deal to drive urgency</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateOpen || editingDeal !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingDeal(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="glass border-border-accent max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              {editingDeal !== null ? 'Edit Flash Deal' : 'Create Flash Deal'}
            </DialogTitle>
            <DialogDescription>
              {editingDeal !== null 
                ? 'Update the flash deal settings below' 
                : 'Set up a new time-limited sale campaign'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Deal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Weekend Flash Sale"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Up to 50% off selected games"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Time *</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">End Time *</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productsCount">Max Products</Label>
              <Input
                id="productsCount"
                type="number"
                min={1}
                max={20}
                value={formData.productsCount}
                onChange={(e) => setFormData({ ...formData, productsCount: parseInt(e.target.value, 10) })}
              />
              <p className="text-xs text-text-muted">Maximum number of products in this flash deal</p>
            </div>

            {/* Display Type Selector */}
            <div className="space-y-3">
              <Label>Display Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, displayType: 'inline' })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.displayType === 'inline'
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-border-primary hover:border-border-accent'
                  }`}
                >
                  <div className="font-medium text-text-primary mb-1">Inline (Default)</div>
                  <p className="text-xs text-text-muted">Shows in the regular page flow, typically below the hero section</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, displayType: 'sticky' })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.displayType === 'sticky'
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-border-primary hover:border-border-accent'
                  }`}
                >
                  <div className="font-medium text-text-primary mb-1">Sticky Banner</div>
                  <p className="text-xs text-text-muted">Shows at the very top of the page, above the header as a sticky bar</p>
                </button>
              </div>
              <p className="text-xs text-text-muted">Note: Only one flash deal of each type can be active at a time</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingDeal(null);
                resetForm();
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={formData.name === '' || formData.startsAt === '' || formData.endsAt === '' || createMutation.isPending || updateMutation.isPending}
              className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingDeal !== null ? 'Update Deal' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="glass border-border-accent max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Delete Flash Deal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm !== null && deleteConfirm !== undefined) {
                  deleteMutation.mutate(deleteConfirm.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <Dialog 
        open={managingProductsDeal !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setManagingProductsDeal(null);
            setSelectedProduct(null);
            setProductSearchQuery('');
            setNewProductDiscount(20);
            setShowProductDropdown(false);
          }
        }}
      >
        <DialogContent className="glass border-border-accent max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-400" />
              Manage Products - {managingProductsDeal?.name}
            </DialogTitle>
            <DialogDescription>
              Add or remove products from this flash deal. Products will appear on the homepage when the deal is active.
              <span className="block mt-1 text-xs text-text-muted">Products are optional - flash deals can display without any products.</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Product Form */}
            <div className="space-y-3">
              <Label>Search & Select Product</Label>
              
              {/* Selected Product Display */}
              {selectedProduct !== null ? (
                <div className="flex items-center gap-3 p-3 bg-bg-tertiary border border-border-subtle rounded-lg">
                  {selectedProduct.imageUrl !== null && selectedProduct.imageUrl !== undefined && selectedProduct.imageUrl !== '' && (
                    <div className="relative w-12 h-12 rounded overflow-hidden">
                      <Image 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.title}
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedProduct.title}</p>
                    <p className="text-xs text-text-muted">
                      {selectedProduct.platform !== null && selectedProduct.platform !== undefined && selectedProduct.platform !== '' && <span className="mr-2">{selectedProduct.platform}</span>}
                      {getCurrencySymbol(selectedProduct.currency)}{selectedProduct.price}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(null);
                      setProductSearchQuery('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <Input
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder="Search products by name..."
                      className="pl-10 bg-bg-tertiary border-border-subtle"
                    />
                  </div>
                  
                  {/* Product Dropdown */}
                  {showProductDropdown === true && (
                    <div className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto bg-bg-secondary border border-border-subtle rounded-lg shadow-lg">
                      {isLoadingProducts === true ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader className="h-5 w-5 animate-spin text-text-muted" />
                        </div>
                      ) : availableProducts.length > 0 ? (
                        availableProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="w-full flex items-center gap-3 p-3 hover:bg-bg-tertiary transition-colors text-left border-b border-border-subtle last:border-b-0"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowProductDropdown(false);
                            }}
                          >
                            {product.imageUrl !== null && product.imageUrl !== undefined && product.imageUrl !== '' && (
                              <div className="relative w-10 h-10 rounded overflow-hidden">
                                <Image 
                                  src={product.imageUrl} 
                                  alt={product.title}
                                  fill
                                  sizes="40px"
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.title}</p>
                              <p className="text-xs text-text-muted">
                                {product.platform !== undefined && product.platform !== null && product.platform !== '' && <span className="mr-2">{product.platform}</span>}
                                {getCurrencySymbol(product.currency)}{product.price}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="py-8 text-center text-text-muted text-sm">
                          {productSearchQuery !== undefined && productSearchQuery !== null && productSearchQuery !== '' 
                            ? 'No products found matching your search' 
                            : 'Start typing to search products'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Discount and Add Button */}
              <div className="flex gap-2 items-end">
                <div className="w-32 space-y-2">
                  <Label htmlFor="discount">Discount %</Label>
                  <Input
                    id="discount"
                    type="number"
                    min={1}
                    max={99}
                    value={newProductDiscount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setNewProductDiscount(Number.isNaN(val) ? 20 : val);
                    }}
                    className="bg-bg-tertiary border-border-subtle"
                  />
                </div>
                <Button
                  onClick={handleAddProduct}
                  disabled={selectedProduct === null || addProductMutation.isPending}
                  className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {addProductMutation.isPending ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Product
                </Button>
              </div>
            </div>

            {/* Current Products List */}
            <div className="border border-border-subtle rounded-lg overflow-hidden">
              <div className="bg-bg-tertiary px-4 py-2 border-b border-border-subtle">
                <h4 className="text-sm font-medium text-text-muted">
                  Products in this deal ({managingProductsDeal?.products?.length ?? 0} / {managingProductsDeal?.productsCount})
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {(managingProductsDeal?.products !== undefined && managingProductsDeal.products !== null && managingProductsDeal.products.length > 0) ? (
                  <Table>
                    <TableBody>
                      {managingProductsDeal.products.map((fp) => {
                        // Calculate prices
                        const rawOriginalPrice = parseFloat(fp.originalPrice ?? fp.product?.price ?? '0');
                        const originalPrice = Number.isNaN(rawOriginalPrice) ? 0 : rawOriginalPrice;
                        const rawDiscountPercent = parseFloat(fp.discountPercent ?? '0');
                        const discountPercent = Number.isNaN(rawDiscountPercent) ? 0 : rawDiscountPercent;
                        const discountedPrice = typeof fp.discountPrice === 'string' && fp.discountPrice.length > 0
                          ? parseFloat(fp.discountPrice) 
                          : originalPrice * (1 - discountPercent / 100);
                        const productCurrency = typeof fp.product?.currency === 'string' && fp.product.currency.length > 0 ? fp.product.currency : 'EUR';
                        const currencySymbol = getCurrencySymbol(productCurrency);
                        
                        return (
                          <TableRow key={fp.id}>
                            <TableCell>
                              {fp.product?.title ?? 'Unknown Product'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="text-text-muted line-through mr-2">
                                  {currencySymbol}{originalPrice.toFixed(2)}
                                </span>
                                <span className="text-green-400 font-medium">
                                  {currencySymbol}{discountedPrice.toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                {fp.discountPercent}% off
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(fp.productId)}
                                disabled={removeProductMutation.isPending}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No products added yet</p>
                    <p className="text-xs mt-1">Add products using their UUID above</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setManagingProductsDeal(null);
                setSelectedProduct(null);
                setProductSearchQuery('');
                setNewProductDiscount(20);
                setShowProductDropdown(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tips Card */}
      <Card className="glass border-border-subtle">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4 text-yellow-400" />
            Flash Deal Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-text-muted space-y-2">
          <p>• <strong>Duration:</strong> 24-72 hours works best for urgency</p>
          <p>• <strong>Discounts:</strong> 20-40% discounts drive the most conversions</p>
          <p>• <strong>Timing:</strong> Launch deals on Friday evenings or during holidays</p>
          <p>• <strong>Products:</strong> Feature 4-8 popular items for best results</p>
        </CardContent>
      </Card>
    </div>
  );
}
