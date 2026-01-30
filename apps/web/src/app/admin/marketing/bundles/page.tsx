'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Switch } from '@/design-system/primitives/switch';
import { Label } from '@/design-system/primitives/label';
import { Badge } from '@/design-system/primitives/badge';
import { Input } from '@/design-system/primitives/input';
import { Textarea } from '@/design-system/primitives/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/design-system/primitives/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/design-system/primitives/alert-dialog';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import {
  AlertCircle,
  Loader,
  Gift,
  Plus,
  Trash2,
  Edit,
  Package,
  Save,
  X,
  Percent,
  Search,
  Image,
} from 'lucide-react';
import NextImage from 'next/image';
import { Configuration } from '@bitloot/sdk';
import { ScrollArea } from '@/design-system/primitives/scroll-area';

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

// Types
interface CatalogProduct {
  id: string;
  title: string;
  slug: string;
  price: string;
  coverImageUrl?: string;
  platform?: string;
}

interface BundleProductInfo {
  id: string;
  title: string;
  slug: string;
  price: string;
  coverImageUrl?: string;
  platform?: string;
}

interface BundleProduct {
  id: string;
  productId: string;
  displayOrder: number;
  isBonus: boolean;
  discountPercent: string;
  product?: BundleProductInfo;
}

interface BundleDeal {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  originalPrice: string;
  bundlePrice: string;
  savingsPercent: number;
  isActive: boolean;
  heroImage: string | null;
  category: string;
  products: BundleProduct[];
  createdAt: string;
}

const CATEGORIES = [
  { value: 'games', label: 'Games' },
  { value: 'software', label: 'Software' },
  { value: 'mixed', label: 'Mixed' },
];

// API Functions
async function fetchBundles(): Promise<BundleDeal[]> {
  const token = getCookie('accessToken');
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/bundles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch bundles');
  const data: unknown = await response.json();
  return data as BundleDeal[];
}

async function createBundle(data: {
  name: string;
  description?: string;
  category: string;
  heroImage?: string;
}): Promise<BundleDeal> {
  const token = getCookie('accessToken');
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/bundles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...data,
      bundlePrice: '0',
      currency: 'EUR',
      isActive: false,
    }),
  });
  if (!response.ok) throw new Error('Failed to create bundle');
  const responseData: unknown = await response.json();
  return responseData as BundleDeal;
}

async function updateBundle(id: string, data: Partial<BundleDeal>): Promise<BundleDeal> {
  const token = getCookie('accessToken');
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/bundles/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update bundle');
  const responseData: unknown = await response.json();
  return responseData as BundleDeal;
}

async function deleteBundle(id: string): Promise<void> {
  const token = getCookie('accessToken');
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/bundles/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete bundle');
}

async function addProductToBundle(bundleId: string, productId: string, discountPercent: number): Promise<BundleDeal> {
  const token = getCookie('accessToken');
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/bundles/${bundleId}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, discountPercent }),
  });
  if (!response.ok) throw new Error('Failed to add product');
  const data: unknown = await response.json();
  return data as BundleDeal;
}

async function updateBundleProduct(bundleId: string, productId: string, discountPercent: number): Promise<BundleDeal> {
  const token = getCookie('accessToken');
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/bundles/${bundleId}/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ discountPercent }),
  });
  if (!response.ok) throw new Error('Failed to update product');
  const data: unknown = await response.json();
  return data as BundleDeal;
}

async function removeProductFromBundle(bundleId: string, productId: string): Promise<BundleDeal> {
  const token = getCookie('accessToken');
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/bundles/${bundleId}/products/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to remove product');
  const data: unknown = await response.json();
  return data as BundleDeal;
}

async function searchProducts(query: string): Promise<CatalogProduct[]> {
  const token = getCookie('accessToken');
  // eslint-disable-next-line no-console
  console.log('[Bundle Search] Searching for:', query ?? '(empty - loading all)');
  
  // Build URL - search param is optional, will return all products if empty
  const params = new URLSearchParams({ limit: '20' });
  if (query.trim() !== '') {
    params.set('search', query.trim());
  }
  
  const url = `${apiConfig.basePath}/admin/catalog/products?${params.toString()}`;
  // eslint-disable-next-line no-console
  console.log('[Bundle Search] URL:', url);
  
  try {
    const response = await fetch(url, { 
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      } 
    });
    // eslint-disable-next-line no-console
    console.log('[Bundle Search] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Bundle Search] Failed:', response.statusText, errorText);
      return [];
    }
    
    const data = await response.json() as CatalogProduct[] | { products: CatalogProduct[] };
    // eslint-disable-next-line no-console
    console.log('[Bundle Search] Response data:', data);
    
    // Handle both array response and paginated response
    const products = Array.isArray(data) ? data : (data.products ?? []);
    // eslint-disable-next-line no-console
    console.log('[Bundle Search] Products found:', products.length);
    return products;
  } catch (error) {
    console.error('[Bundle Search] Error:', error);
    return [];
  }
}

// Format price in Euro
function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `€${(Number.isNaN(num) ? 0 : num ?? 0).toFixed(2)}`;
}

// Calculate discounted price
function calcDiscountedPrice(price: string, discountPercent: string): number {
  const pRaw = parseFloat(price);
  const dRaw = parseFloat(discountPercent);
  const p = Number.isNaN(pRaw) ? 0 : pRaw;
  const d = Number.isNaN(dRaw) ? 0 : dRaw;
  return p * (1 - d / 100);
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function AdminBundlesPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBundle, setEditingBundle] = useState<BundleDeal | null>(null);
  const [managingBundle, setManagingBundle] = useState<BundleDeal | null>(null);
  const [deletingBundle, setDeletingBundle] = useState<BundleDeal | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('games');
  const [formHeroImage, setFormHeroImage] = useState('');

  // Product search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [discountInput, setDiscountInput] = useState('10');

  // Fetch bundles
  const { data: bundles = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'bundles'],
    queryFn: fetchBundles,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBundle,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bundles'] });
      setShowCreateDialog(false);
      resetForm();
      toast.success(`Bundle "${data.name}" created successfully!`);
    },
    onError: (error) => {
      toast.error(`Failed to create bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BundleDeal> }) => updateBundle(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bundles'] });
      if (editingBundle !== null) {
        toast.success('Bundle updated successfully!');
      }
      setEditingBundle(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBundle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bundles'] });
      toast.success(`Bundle "${deletingBundle?.name}" deleted successfully!`);
      setDeletingBundle(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDeletingBundle(null);
    },
  });

  const addProductMutation = useMutation({
    mutationFn: ({ bundleId, productId, discountPercent }: { bundleId: string; productId: string; discountPercent: number }) =>
      addProductToBundle(bundleId, productId, discountPercent),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bundles'] });
      setManagingBundle(data);
      toast.success('Product added to bundle!');
      setSelectedProduct(null);
      setDiscountInput('10');
      setSearchQuery('');
      setSearchResults([]);
    },
    onError: (error) => {
      toast.error(`Failed to add product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ bundleId, productId, discountPercent }: { bundleId: string; productId: string; discountPercent: number }) =>
      updateBundleProduct(bundleId, productId, discountPercent),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bundles'] });
      setManagingBundle(data);
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: ({ bundleId, productId }: { bundleId: string; productId: string }) =>
      removeProductFromBundle(bundleId, productId),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bundles'] });
      setManagingBundle(data);
      toast.success('Product removed from bundle');
    },
    onError: (error) => {
      toast.error(`Failed to remove product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Reset form
  function resetForm() {
    setFormName('');
    setFormDescription('');
    setFormCategory('games');
    setFormHeroImage('');
  }

  // Open edit dialog
  function openEdit(bundle: BundleDeal) {
    setFormName(bundle.name);
    setFormDescription(bundle.description ?? '');
    setFormCategory(bundle.category);
    setFormHeroImage(bundle.heroImage ?? '');
    setEditingBundle(bundle);
  }

  // Load initial products (called when manage dialog opens)
  const loadInitialProducts = useCallback(async () => {
    setIsSearching(true);
    try {
      const results = await searchProducts('');
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Load products when manage dialog opens
  useEffect(() => {
    if (managingBundle !== null) {
      // Reset search state when dialog opens
      setSearchQuery('');
      setSelectedProduct(null);
      setDiscountInput('10');
      // Load initial products
      void loadInitialProducts();
    } else {
      // Clear search results when dialog closes
      setSearchResults([]);
    }
  }, [managingBundle, loadInitialProducts]);

  // Handle search (triggered on button click or Enter)
  async function handleSearch() {
    setIsSearching(true);
    try {
      const results = await searchProducts(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  }

  // Calculate totals for managing bundle
  const bundleTotals = useMemo(() => {
    if (managingBundle === null) return { original: 0, discounted: 0, savings: 0 };
    let original = 0;
    let discounted = 0;
    for (const bp of managingBundle.products) {
      if (bp.product !== null && bp.product !== undefined) {
        const price = Number.isNaN(parseFloat(bp.product.price)) ? 0 : parseFloat(bp.product.price);
        original += price;
        discounted += calcDiscountedPrice(bp.product.price, bp.discountPercent);
      }
    }
    return {
      original,
      discounted,
      savings: original > 0 ? ((original - discounted) / original) * 100 : 0,
    };
  }, [managingBundle]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error !== null && error !== undefined) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p>Failed to load bundles</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-pink-500" />
            Bundle Deals
          </h1>
          <p className="text-muted-foreground">Create and manage product bundles with individual discounts</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Bundle
        </Button>
      </div>

      {/* Bundles List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Bundles ({bundles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bundles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No bundles created yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Bundle Price</TableHead>
                  <TableHead>Savings</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundles.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {bundle.heroImage !== null && bundle.heroImage !== '' ? (
                          <div className="relative w-10 h-10 rounded overflow-hidden">
                            <NextImage src={bundle.heroImage} alt="" fill sizes="40px" className="object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Gift className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{bundle.name}</p>
                          {bundle.description !== null && bundle.description !== undefined && bundle.description !== '' && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {bundle.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{bundle.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{bundle.products?.length ?? 0} items</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground line-through">
                      {formatPrice(bundle.originalPrice)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatPrice(bundle.bundlePrice)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-pink-500">{bundle.savingsPercent}% OFF</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={bundle.isActive}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ id: bundle.id, data: { isActive: checked } })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setManagingBundle(bundle)}
                          title="Manage products"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(bundle)}
                          title="Edit bundle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingBundle(bundle)}
                          className="text-destructive hover:text-destructive"
                          title="Delete bundle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingBundle !== null} onOpenChange={(open) => !open && setDeletingBundle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Bundle
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <span className="block">
                  Are you sure you want to delete <strong>&quot;{deletingBundle?.name}&quot;</strong>?
                </span>
                {deletingBundle !== null && (deletingBundle.products?.length ?? 0) > 0 && (
                  <span className="block text-amber-600">
                    This bundle contains {deletingBundle.products?.length ?? 0} product(s). They will be removed from the bundle but not deleted from your catalog.
                  </span>
                )}
                <span className="block text-muted-foreground text-sm">
                  This action cannot be undone.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBundle !== null && deleteMutation.mutate(deletingBundle.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Bundle
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Bundle Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-pink-500" />
              Create New Bundle
            </DialogTitle>
            <DialogDescription>
              Create a bundle to offer multiple products at a discounted price. You can add products after creating the bundle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bundle Name *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Ultimate Gaming Bundle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Bundle description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroImage">Hero Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="heroImage"
                  value={formHeroImage}
                  onChange={(e) => setFormHeroImage(e.target.value)}
                  placeholder="https://..."
                />
                {formHeroImage !== null && formHeroImage !== '' && (
                  <div className="relative w-10 h-10 rounded overflow-hidden">
                    <NextImage src={formHeroImage} alt="" fill sizes="40px" className="object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                name: formName,
                description: formDescription !== '' ? formDescription : undefined,
                category: formCategory,
                heroImage: formHeroImage !== '' ? formHeroImage : undefined,
              })}
              disabled={formName.trim() === '' || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="ml-2">Create</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bundle Dialog */}
      <Dialog open={editingBundle !== null} onOpenChange={() => setEditingBundle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Bundle
            </DialogTitle>
            <DialogDescription>
              Update the bundle details below. Products can be managed from the bundle card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Bundle Name *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-heroImage">Hero Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-heroImage"
                  value={formHeroImage}
                  onChange={(e) => setFormHeroImage(e.target.value)}
                />
                {formHeroImage !== null && formHeroImage !== '' && (
                  <div className="relative w-10 h-10 rounded overflow-hidden">
                    <NextImage src={formHeroImage} alt="" fill sizes="40px" className="object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBundle(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editingBundle !== null) {
                  updateMutation.mutate({
                    id: editingBundle.id,
                    data: {
                      name: formName,
                      description: formDescription !== '' ? formDescription : null,
                      category: formCategory,
                      heroImage: formHeroImage !== '' ? formHeroImage : null,
                    },
                  });
                }
              }}
              disabled={formName.trim() === '' || updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="ml-2">Save</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <Dialog open={managingBundle !== null} onOpenChange={() => setManagingBundle(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-pink-500" />
              Manage Products: {managingBundle?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
            {/* Add Product Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Add Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search products..."
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader className="h-4 w-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <ScrollArea className="h-40 border rounded-md">
                    <div className="p-2 space-y-1">
                      {searchResults.map((product) => {
                        const isInBundle = managingBundle?.products.some(
                          (bp) => bp.productId === product.id
                        );
                        return (
                          <button
                            key={product.id}
                            type="button"
                            disabled={isInBundle}
                            onClick={() => setSelectedProduct(product)}
                            className={`w-full flex items-center gap-3 p-2 rounded text-left transition-colors ${
                              isInBundle === true
                                ? 'opacity-50 cursor-not-allowed'
                                : selectedProduct?.id === product.id
                                ? 'bg-pink-500/10 border border-pink-500'
                                : 'hover:bg-muted'
                            }`}
                          >
                            {product.coverImageUrl !== null && product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                              <div className="relative w-8 h-8 rounded overflow-hidden">
                                <NextImage src={product.coverImageUrl} alt="" fill sizes="32px" className="object-contain" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <Image className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.title}</p>
                              <p className="text-xs text-muted-foreground">{product.platform}</p>
                            </div>
                            <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
                            {isInBundle === true && (
                              <Badge variant="secondary" className="text-xs">In Bundle</Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Selected Product + Discount */}
                {selectedProduct !== null && selectedProduct !== undefined && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{selectedProduct.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Original: {formatPrice(selectedProduct.price)} → 
                        Discounted: {formatPrice(calcDiscountedPrice(selectedProduct.price, discountInput))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          className="w-20"
                          min={0}
                          max={100}
                        />
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (managingBundle !== null && selectedProduct !== null) {
                            addProductMutation.mutate({
                              bundleId: managingBundle.id,
                              productId: selectedProduct.id,
                              discountPercent: Number.isNaN(parseFloat(discountInput)) ? 0 : parseFloat(discountInput),
                            });
                          }
                        }}
                        disabled={addProductMutation.isPending}
                      >
                        {addProductMutation.isPending ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProduct(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bundle Products List */}
            <Card className="flex-1 overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Bundle Items ({managingBundle?.products?.length ?? 0})</span>
                  <div className="flex items-center gap-4 text-base">
                    <span className="text-muted-foreground line-through">
                      {formatPrice(bundleTotals.original)}
                    </span>
                    <span className="text-green-600 font-bold">
                      {formatPrice(bundleTotals.discounted)}
                    </span>
                    <Badge className="bg-pink-500">
                      {bundleTotals.savings.toFixed(0)}% OFF
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {(managingBundle?.products?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No products added yet</p>
                    <p className="text-sm">Search and add products above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(managingBundle?.products ?? [])
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((bp) => {
                        const hasImage = typeof bp.product?.coverImageUrl === 'string' && bp.product.coverImageUrl.length > 0;
                        return (
                        <div
                          key={bp.id}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          {hasImage ? (
                            <div className="relative w-12 h-12 rounded overflow-hidden">
                              <NextImage
                                src={bp.product?.coverImageUrl ?? ''}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {bp.product?.title ?? 'Unknown Product'}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground line-through">
                                {formatPrice(bp.product?.price ?? '0')}
                              </span>
                              <span className="text-green-600 font-semibold">
                                {formatPrice(calcDiscountedPrice(bp.product?.price ?? '0', bp.discountPercent))}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={bp.discountPercent}
                                onChange={(e) => {
                                  if (managingBundle !== null) {
                                    updateProductMutation.mutate({
                                      bundleId: managingBundle.id,
                                      productId: bp.productId,
                                      discountPercent: Number.isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value),
                                    });
                                  }
                                }}
                                className="w-16 text-center"
                                min={0}
                                max={100}
                              />
                              <Percent className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Badge variant="secondary" className="bg-pink-500/10 text-pink-600">
                              -{parseFloat(bp.discountPercent).toFixed(0)}%
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (managingBundle !== null) {
                                  removeProductMutation.mutate({
                                    bundleId: managingBundle.id,
                                    productId: bp.productId,
                                  });
                                }
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={() => setManagingBundle(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
