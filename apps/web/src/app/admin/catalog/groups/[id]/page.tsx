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
 * - Neon cyberpunk gaming aesthetic
 * - Full 9-state implementation
 *
 * Follows BitLoot design system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  RefreshCw,
  AlertTriangle,
  XCircle,
  Save,
  Loader2,
  ArrowLeft,
  Trash2,
  Layers,
  Eye,
  EyeOff,
  DollarSign,
  Package,
  BarChart3,
  Plus,
  Search,
  CheckCircle2,
  WifiOff,
  ImageIcon,
  Hash,
  Sparkles,
  FileText,
  Settings,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
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
import { motion, AnimatePresence } from 'framer-motion';

// Skeleton components for loading states
function DetailSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6 p-1">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="skeleton w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <div className="skeleton w-48 h-7 rounded" />
            <div className="skeleton w-32 h-4 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="skeleton w-32 h-9 rounded" />
          <div className="skeleton w-36 h-9 rounded" />
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border-subtle bg-bg-secondary/50">
          <CardHeader>
            <div className="skeleton w-32 h-5 rounded" />
            <div className="skeleton w-48 h-4 rounded mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton w-20 h-4 rounded" />
                <div className="skeleton w-full h-10 rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border-subtle bg-bg-secondary/50">
          <CardHeader>
            <div className="skeleton w-32 h-5 rounded" />
            <div className="skeleton w-48 h-4 rounded mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg bg-bg-tertiary">
                  <div className="skeleton w-16 h-4 rounded mb-2" />
                  <div className="skeleton w-20 h-8 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Table row skeleton
function _TableRowSkeleton(): React.JSX.Element {
  return (
    <TableRow>
      <TableCell><div className="skeleton w-10 h-10 rounded" /></TableCell>
      <TableCell><div className="skeleton w-40 h-5 rounded" /></TableCell>
      <TableCell><div className="skeleton w-16 h-6 rounded-full" /></TableCell>
      <TableCell><div className="skeleton w-20 h-4 rounded" /></TableCell>
      <TableCell><div className="skeleton w-16 h-4 rounded" /></TableCell>
      <TableCell className="text-right"><div className="skeleton w-16 h-5 rounded ml-auto" /></TableCell>
      <TableCell className="text-right"><div className="skeleton w-8 h-8 rounded ml-auto" /></TableCell>
    </TableRow>
  );
}

// Section header component
function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30">
        <Icon className="h-4 w-4 text-cyan-glow" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          {badge !== undefined && badge}
        </div>
        <p className="text-sm text-text-secondary mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// Stats card component
function StatsCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  variant?: 'default' | 'cyan' | 'purple' | 'success' | 'warning';
  suffix?: string;
}): React.JSX.Element {
  const colorClasses = {
    default: 'text-text-primary',
    cyan: 'text-cyan-glow',
    purple: 'text-purple-neon',
    success: 'text-green-success',
    warning: 'text-orange-warning',
  };

  const glowClasses = {
    default: '',
    cyan: 'shadow-glow-cyan-sm',
    purple: 'shadow-glow-purple-sm',
    success: 'shadow-glow-success',
    warning: 'shadow-glow-error',
  };

  return (
    <div className={`p-4 rounded-lg bg-bg-tertiary/50 border border-border-subtle hover:border-border-accent transition-all group ${glowClasses[variant]}`}>
      <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colorClasses[variant]} flex items-baseline gap-1`}>
        {value}
        {suffix !== undefined && <span className="text-sm text-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}

export default function AdminProductGroupDetailPage(): React.JSX.Element {
  const params = useParams();
  const _router = useRouter();
  const groupId = params.id as string;

  // Form state
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Dialog state
  const [addProductsOpen, setAddProductsOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState<GroupProductVariantDto | null>(null);

  // Toast state
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Show success toast helper
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  }, []);

  // Copy slug to clipboard
  const copySlug = useCallback(async (slug: string) => {
    await navigator.clipboard.writeText(slug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  }, []);

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
      setDescription(groupQuery.data.description ?? '');
      setCoverImageUrl(groupQuery.data.coverImageUrl ?? '');
      setIsActive(groupQuery.data.isActive);
      setDisplayOrder(groupQuery.data.displayOrder ?? 0);
      setHasChanges(false);
      setImageError(false);
    }
  }, [groupQuery.data]);

  // Track changes
  useEffect(() => {
    if (groupQuery.data !== undefined) {
      const changed =
        title !== groupQuery.data.title ||
        tagline !== (groupQuery.data.tagline ?? '') ||
        description !== (groupQuery.data.description ?? '') ||
        coverImageUrl !== (groupQuery.data.coverImageUrl ?? '') ||
        isActive !== groupQuery.data.isActive ||
        displayOrder !== (groupQuery.data.displayOrder ?? 0);
      setHasChanges(changed);
    }
  }, [title, tagline, description, coverImageUrl, isActive, displayOrder, groupQuery.data]);

  // Reset image error when URL changes
  useEffect(() => {
    setImageError(false);
  }, [coverImageUrl]);

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
          description: description !== '' ? description : undefined,
          coverImageUrl: coverImageUrl !== '' ? coverImageUrl : undefined,
          isActive,
          displayOrder,
        },
      });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups'] });
      setHasChanges(false);
      showSuccess('Changes saved successfully!');
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
      const count = selectedProductIds.length;
      setSelectedProductIds([]);
      showSuccess(`${count} product${count !== 1 ? 's' : ''} added to group!`);
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
      showSuccess('Product removed from group!');
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
      showSuccess('Statistics refreshed!');
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

  // Clear error handler
  const handleClearError = (): void => {
    setLastError(null);
    clearError();
  };

  // Loading state
  if (groupQuery.isLoading) {
    return <DetailSkeleton />;
  }

  // Error state
  if (groupQuery.isError || groupQuery.data === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="p-6 rounded-full bg-destructive/10 border border-destructive/30">
          <XCircle className="h-16 w-16 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-text-primary">Failed to Load Group</h2>
          <p className="text-text-secondary max-w-md">
            {groupQuery.error instanceof Error
              ? groupQuery.error.message
              : 'Unable to fetch group details. Please try again.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => void groupQuery.refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin/catalog/groups" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Groups
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const group = groupQuery.data;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Floating Success Toast */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-4 left-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-success/20 border border-green-success/50 text-green-success shadow-glow-success"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild className="hover:bg-bg-tertiary">
                  <Link href="/admin/catalog/groups">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Groups</TooltipContent>
            </Tooltip>
            <SectionHeader
              icon={Layers}
              title="Edit Group"
              description={group.title}
              badge={
                <Badge
                  variant={group.isActive ? 'default' : 'secondary'}
                  className={group.isActive ? 'bg-green-success/20 text-green-success border-green-success/50' : ''}
                >
                  {group.isActive ? 'Active' : 'Inactive'}
                </Badge>
              }
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshStatsMutation.mutate()}
                  disabled={refreshStatsMutation.isPending}
                  className="gap-2"
                >
                  {refreshStatsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Refresh Stats</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recalculate cached price ranges and counts</TooltipContent>
            </Tooltip>
            <GlowButton
              onClick={() => updateMutation.mutate()}
              disabled={!hasChanges || updateMutation.isPending}
              className={!hasChanges ? 'opacity-50' : ''}
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

        {/* Alerts */}
        <AnimatePresence mode="sync">
          {/* Offline Alert */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              key="offline-alert"
            >
              <Alert variant="destructive" className="border-orange-warning/50 bg-orange-warning/10">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>You&apos;re offline</AlertTitle>
                <AlertDescription>
                  Please check your internet connection to save changes.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Error Alert */}
          {lastError !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              key="error-alert"
            >
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{lastError}</span>
                  <Button variant="ghost" size="sm" onClick={handleClearError}>
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Group Details Card */}
          <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm hover:shadow-glow-cyan-sm transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30">
                  <Settings className="h-4 w-4 text-cyan-glow" />
                </div>
                Group Details
              </CardTitle>
              <CardDescription>Edit the group&apos;s information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title" className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-text-muted" />
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <span className={`text-xs ${title.length > 80 ? 'text-orange-warning' : 'text-text-muted'}`}>
                    {title.length}/100
                  </span>
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Battlefield 6"
                  maxLength={100}
                  className="input-glow"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tagline" className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-text-muted" />
                    Tagline
                  </Label>
                  <span className={`text-xs ${tagline.length > 120 ? 'text-orange-warning' : 'text-text-muted'}`}>
                    {tagline.length}/150
                  </span>
                </div>
                <Textarea
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Short marketing tagline..."
                  rows={2}
                  maxLength={150}
                  className="input-glow resize-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-text-muted" />
                    Description
                  </Label>
                  <span className={`text-xs ${description.length > 450 ? 'text-orange-warning' : 'text-text-muted'}`}>
                    {description.length}/500
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed group description..."
                  rows={4}
                  maxLength={500}
                  className="input-glow resize-none"
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label htmlFor="coverImage" className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-text-muted" />
                  Cover Image URL
                </Label>
                <Input
                  id="coverImage"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="input-glow"
                />
                {coverImageUrl !== '' && (
                  <div className="mt-3 relative w-full aspect-video max-w-xs rounded-lg overflow-hidden border border-border-subtle bg-bg-tertiary">
                    {!imageError ? (
                      <Image
                        src={coverImageUrl}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-xs">Failed to load image</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="displayOrder" className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-text-muted" />
                  Display Order
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => { const val = parseInt(e.target.value, 10); setDisplayOrder(Number.isNaN(val) ? 0 : val); }}
                  min={0}
                  max={9999}
                  className="input-glow w-32"
                />
                <p className="text-xs text-text-muted flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-cyan-glow" />
                  Lower numbers appear first. Default is 0.
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-bg-tertiary/50">
                <Label htmlFor="isActive" className="cursor-pointer flex-1">
                  {isActive ? (
                    <span className="flex items-center gap-2 text-green-success">
                      <Eye className="h-4 w-4" />
                      <span>
                        <span className="font-medium">Active</span>
                        <span className="text-text-muted text-xs ml-2">Visible in catalog</span>
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-text-muted">
                      <EyeOff className="h-4 w-4" />
                      <span>
                        <span className="font-medium">Inactive</span>
                        <span className="text-text-muted text-xs ml-2">Hidden from catalog</span>
                      </span>
                    </span>
                  )}
                </Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm hover:shadow-glow-purple-sm transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-linear-to-br from-purple-neon/20 to-pink-featured/20 border border-purple-neon/30">
                  <BarChart3 className="h-4 w-4 text-purple-neon" />
                </div>
                Group Statistics
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>Cached price range and product count</span>
                {refreshStatsMutation.isPending && (
                  <Loader2 className="h-3 w-3 animate-spin text-cyan-glow" />
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  icon={Package}
                  label="Products"
                  value={String(group.productCount ?? 0)}
                  variant="cyan"
                />
                <StatsCard
                  icon={DollarSign}
                  label="Min Price"
                  value={formatPrice(group.minPrice)}
                  variant="success"
                />
                <StatsCard
                  icon={DollarSign}
                  label="Max Price"
                  value={formatPrice(group.maxPrice)}
                  variant="warning"
                />
                <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle hover:border-border-accent transition-colors">
                  <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
                    <LinkIcon className="h-4 w-4" />
                    Slug
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-text-secondary truncate flex-1 bg-bg-primary/50 px-2 py-1 rounded">
                      {group.slug}
                    </code>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => void copySlug(group.slug)}
                        >
                          {copiedSlug ? (
                            <Check className="h-3.5 w-3.5 text-green-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copiedSlug ? 'Copied!' : 'Copy slug'}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* View on Store link */}
              <Button variant="outline" asChild className="w-full gap-2">
                <a href={`/catalog/groups/${group.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View on Store
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Products Card */}
        <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeader
                icon={Package}
                title="Assigned Products"
                description={`${group.products?.length ?? 0} product${(group.products?.length ?? 0) !== 1 ? 's' : ''} in this group`}
              />
              <GlowButton size="sm" onClick={() => setAddProductsOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Products
              </GlowButton>
            </div>
          </CardHeader>
          <CardContent>
            {(group.products?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="p-6 rounded-full bg-bg-tertiary border border-border-subtle">
                  <Package className="h-12 w-12 text-text-muted" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-medium text-text-primary">No products assigned</p>
                  <p className="text-sm text-text-secondary">Add products to create variant options for this group</p>
                </div>
                <GlowButton onClick={() => setAddProductsOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Product
                </GlowButton>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border-subtle">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-tertiary/50 hover:bg-bg-tertiary/50">
                      <TableHead className="w-14">Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="hidden md:table-cell">Platform</TableHead>
                      <TableHead className="hidden lg:table-cell">Edition</TableHead>
                      <TableHead className="hidden lg:table-cell">Region</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-16 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.products?.map((product, index) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group border-b border-border-subtle last:border-0 hover:bg-cyan-glow/5 transition-colors"
                      >
                        {/* Image */}
                        <TableCell>
                          <div className="w-11 h-11 rounded-md overflow-hidden bg-bg-tertiary border border-border-subtle group-hover:border-cyan-glow/30 transition-colors">
                            {product.coverImageUrl !== null && product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                              <Image
                                src={product.coverImageUrl}
                                alt={product.title}
                                width={44}
                                height={44}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-text-muted" />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Product Info */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/admin/catalog/products/${product.id}`}
                                className="font-medium text-text-primary hover:text-cyan-glow transition-colors line-clamp-1"
                              >
                                {product.title}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>{product.title}</p>
                              <p className="text-text-muted text-xs mt-1">Click to edit product</p>
                            </TooltipContent>
                          </Tooltip>
                          {/* Mobile-only platform/region */}
                          <div className="flex gap-2 mt-0.5 md:hidden">
                            <Badge variant="outline" className="text-xs">{product.platform ?? '-'}</Badge>
                            <span className="text-xs text-text-muted">{product.region ?? 'Global'}</span>
                          </div>
                        </TableCell>

                        {/* Platform */}
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="bg-bg-tertiary">{product.platform ?? '-'}</Badge>
                        </TableCell>

                        {/* Edition */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-text-secondary">
                            {product.subtitle ?? 'Standard'}
                          </span>
                        </TableCell>

                        {/* Region */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-text-secondary">
                            {product.region ?? 'Global'}
                          </span>
                        </TableCell>

                        {/* Price */}
                        <TableCell className="text-right">
                          <span className="font-mono font-medium text-cyan-glow">
                            {formatPrice(product.price)}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => {
                                  setProductToRemove(product);
                                  setRemoveConfirmOpen(true);
                                }}
                                disabled={removeMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove from group</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Products Dialog */}
        <Dialog open={addProductsOpen} onOpenChange={setAddProductsOpen}>
          <DialogContent className="max-w-2xl border-border-subtle bg-bg-secondary">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30">
                  <Plus className="h-4 w-4 text-cyan-glow" />
                </div>
                Add Products to Group
              </DialogTitle>
              <DialogDescription>
                Select products to add to &quot;{group.title}&quot;
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
                <Input
                  placeholder="Search products by name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10 input-glow"
                />
              </div>

              {/* Product List */}
              <ScrollArea className="h-80 pr-4">
                {productsQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle bg-bg-tertiary animate-pulse">
                        <div className="w-5 h-5 rounded bg-bg-secondary" />
                        <div className="w-10 h-10 rounded bg-bg-secondary" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-bg-secondary" />
                          <div className="h-3 w-1/2 rounded bg-bg-secondary" />
                        </div>
                        <div className="h-4 w-16 rounded bg-bg-secondary" />
                      </div>
                    ))}
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                    <div className="p-4 rounded-full bg-bg-tertiary border border-border-subtle mb-3">
                      <Package className="h-8 w-8" />
                    </div>
                    <p className="font-medium text-text-primary">No available products</p>
                    <p className="text-sm mt-1">All products may already be assigned</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableProducts.map((product: AdminProductResponseDto, index: number) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedProductIds.includes(product.id)
                            ? 'border-cyan-glow bg-cyan-glow/10 shadow-glow-cyan-sm'
                            : 'border-border-subtle bg-bg-tertiary hover:border-cyan-glow/50 hover:bg-bg-tertiary/80'
                        }`}
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <Checkbox
                          checked={selectedProductIds.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                          className="data-[state=checked]:bg-cyan-glow data-[state=checked]:border-cyan-glow"
                        />
                        <div className="w-11 h-11 rounded-md overflow-hidden bg-bg-secondary shrink-0 border border-border-subtle">
                          {product.coverImageUrl !== null && product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                            <Image
                              src={product.coverImageUrl}
                              alt={product.title}
                              width={44}
                              height={44}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-text-muted" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-text-primary truncate">
                            {product.title}
                          </div>
                          <div className="flex gap-2 text-xs text-text-muted mt-0.5">
                            <Badge variant="outline" className="text-xs py-0 h-5">{product.platform ?? '-'}</Badge>
                            <span>{product.region ?? 'Global'}</span>
                          </div>
                        </div>
                        <div className="text-sm font-mono font-medium text-cyan-glow shrink-0">
                          {formatPrice(product.price)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Selection Count */}
              <AnimatePresence>
                {selectedProductIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30"
                  >
                    <span className="text-sm text-cyan-glow font-medium">
                      {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProductIds([])}
                      className="h-7 text-text-muted hover:text-text-primary"
                    >
                      Clear
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t border-border-subtle pt-4 mt-2">
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
                Add {selectedProductIds.length > 0 ? selectedProductIds.length : ''} Product{selectedProductIds.length !== 1 ? 's' : ''}
              </GlowButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Product Confirmation */}
        <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
          <DialogContent className="border-border-subtle bg-bg-secondary max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <div className="p-1.5 rounded-md bg-destructive/10 border border-destructive/30">
                  <Trash2 className="h-4 w-4" />
                </div>
                Remove Product
              </DialogTitle>
              <DialogDescription className="pt-2">
                Remove <span className="font-medium text-text-primary">&quot;{productToRemove?.title}&quot;</span> from this group?
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-bg-secondary border border-border-subtle shrink-0">
                    {productToRemove?.coverImageUrl !== null && productToRemove?.coverImageUrl !== undefined && productToRemove.coverImageUrl !== '' ? (
                      <Image
                        src={productToRemove.coverImageUrl}
                        alt={productToRemove.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{productToRemove?.title}</p>
                    <div className="flex gap-2 mt-1 text-xs text-text-muted">
                      <span>{productToRemove?.platform ?? '-'}</span>
                      <span>•</span>
                      <span>{productToRemove?.region ?? 'Global'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-3 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-success" />
                The product will not be deleted, only unassigned from this group.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t border-border-subtle pt-4">
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
                className="gap-2"
              >
                {removeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
}
