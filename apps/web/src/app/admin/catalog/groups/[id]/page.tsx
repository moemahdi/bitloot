'use client';

/**
 * Admin Game Spotlight Edit Page
 *
 * Features:
 * - Edit spotlight details (title, hero images, accent colors)
 * - View and manage assigned products
 * - Add/remove products from spotlight
 * - Toggle spotlight visibility
 * - Configure visual settings for /games/[slug] pages
 * - Neon cyberpunk gaming aesthetic
 *
 * Follows BitLoot design system
 * Matches create page structure with no field duplication
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Save,
  Loader2,
  ArrowLeft,
  Trash2,
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
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  Palette,
  Video,
  Star,
  Pencil,
  HelpCircle,
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

interface SpotlightFeatureItem {
  title: string;
  description: string;
}

function normalizeFeatures(features: unknown): SpotlightFeatureItem[] {
  if (!Array.isArray(features)) {
    return [];
  }

  return features
    .map((item: unknown) => {
      if (typeof item === 'string') {
        const title = item.trim();
        return title !== '' ? { title, description: '' } : null;
      }

      if (item !== null && typeof item === 'object') {
        const typedItem = item as { title?: unknown; description?: unknown };
        const title =
          typeof typedItem.title === 'string'
            ? typedItem.title.trim()
            : '';

        if (title === '') {
          return null;
        }

        return {
          title,
          description:
            typeof typedItem.description === 'string'
              ? typedItem.description.trim()
              : '',
        };
      }

      return null;
    })
    .filter((item): item is SpotlightFeatureItem => item !== null);
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

function DetailSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6 p-1">
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
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border-subtle bg-bg-secondary/50">
            <CardHeader>
              <div className="skeleton w-32 h-5 rounded" />
              <div className="skeleton w-48 h-4 rounded mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="skeleton w-20 h-4 rounded" />
                  <div className="skeleton w-full h-10 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CharacterCount({
  current,
  max,
  className = '',
}: {
  current: number;
  max: number;
  className?: string;
}): React.JSX.Element {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= 80;
  const isError = percentage >= 100;

  return (
    <span
      className={`text-xs tabular-nums ${
        isError ? 'text-destructive' : isWarning ? 'text-orange-warning' : 'text-text-muted'
      } ${className}`}
    >
      {current}/{max}
    </span>
  );
}

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
      <div className="p-2 rounded-lg bg-linear-to-br from-brand-primary/20 to-purple-neon/20 border border-brand-primary/30">
        <Icon className="h-4 w-4 text-brand-primary" />
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

function ColorPreview({ color }: { color: string }): React.JSX.Element {
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(color);
  return (
    <div
      className="w-8 h-8 rounded-lg border-2 border-bg-tertiary transition-all"
      style={{ backgroundColor: isValid ? color : '#1a1a2e' }}
    />
  );
}

function StatsCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  variant?: 'default' | 'cyan' | 'purple' | 'success' | 'warning';
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
    <div className={`p-4 rounded-lg bg-bg-tertiary/50 border border-border-subtle hover:border-border-accent transition-all ${glowClasses[variant]}`}>
      <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colorClasses[variant]}`}>{value}</div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminSpotlightEditPage(): React.JSX.Element {
  const params = useParams();
  const _router = useRouter();
  const groupId = params.id as string;

  // Basic Info state
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');

  // Visual Settings state
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#00d4ff');
  const [badgeText, setBadgeText] = useState('');
  const [heroImageError, setHeroImageError] = useState(false);

  // Game Details state
  const [metacriticScore, setMetacriticScore] = useState<number | null>(null);
  const [releaseDate, setReleaseDate] = useState('');
  const [developerName, setDeveloperName] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [newGenre, setNewGenre] = useState('');

  // Visibility state
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  // Advanced settings state
  const [features, setFeatures] = useState<SpotlightFeatureItem[]>([]);
  const [faqItems, setFaqItems] = useState<Array<{ question: string; answer: string }>>([]);
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // UI state
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Product management state
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
    onError: (error: Error): void => setLastError(error.message),
    onRecovery: (): void => setLastError(null),
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
    await navigator.clipboard.writeText(`/games/${slug}`);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  }, []);

  // Fetch spotlight data
  const groupQuery = useQuery({
    queryKey: ['admin', 'catalog', 'groups', groupId],
    queryFn: async (): Promise<ProductGroupWithProductsDto> => {
      if (!isOnline) throw new Error('No internet connection');
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
      if (!isOnline) throw new Error('No internet connection');
      const api = new AdminCatalogProductsApi(apiConfig);
      return await api.adminProductsControllerListAll({
        page: '1',
        limit: '100',
        search: productSearch !== '' ? productSearch : undefined,
      });
    },
    enabled: addProductsOpen,
    staleTime: 10_000,
  });

  // Initialize form with spotlight data
  useEffect(() => {
    if (groupQuery.data !== undefined) {
      const data = groupQuery.data;
      
      // Basic Info
      setTitle(data.title);
      setTagline(data.tagline ?? '');
      setDescription(data.description ?? '');
      setLongDescription(data.longDescription ?? data.description ?? '');
      
      // Visual Settings
      setHeroImageUrl(data.heroImageUrl ?? data.coverImageUrl ?? '');
      setHeroVideoUrl(data.heroVideoUrl ?? '');
      setAccentColor(data.accentColor ?? '#00d4ff');
      setBadgeText(data.badgeText ?? '');
      
      // Game Details
      setMetacriticScore(data.metacriticScore ?? null);
      setReleaseDate(data.releaseDate != null ? (new Date(data.releaseDate).toISOString().split('T')[0] ?? '') : '');
      setDeveloperName(data.developerName ?? '');
      setPublisherName(data.publisherName ?? '');
      setGenres(data.genres ?? []);
      
      // Visibility
      setIsActive(data.isActive);
      setDisplayOrder(data.spotlightOrder ?? data.displayOrder ?? 0);
      
      // Advanced
      setFeatures(normalizeFeatures(data.features as unknown));
      setFaqItems(data.faqItems ?? []);
      
      setHasChanges(false);
      setHeroImageError(false);
    }
  }, [groupQuery.data]);

  // Track changes
  useEffect(() => {
    if (groupQuery.data !== undefined) {
      const data = groupQuery.data;
      const normalizedOriginalFeatures = normalizeFeatures(data.features as unknown);

      const changed =
        title !== data.title ||
        tagline !== (data.tagline ?? '') ||
        description !== (data.description ?? '') ||
        longDescription !== (data.longDescription ?? data.description ?? '') ||
        heroImageUrl !== (data.heroImageUrl ?? data.coverImageUrl ?? '') ||
        heroVideoUrl !== (data.heroVideoUrl ?? '') ||
        accentColor !== (data.accentColor ?? '#00d4ff') ||
        badgeText !== (data.badgeText ?? '') ||
        metacriticScore !== (data.metacriticScore ?? null) ||
        releaseDate !== (data.releaseDate != null ? new Date(data.releaseDate).toISOString().split('T')[0] : '') ||
        developerName !== (data.developerName ?? '') ||
        publisherName !== (data.publisherName ?? '') ||
        JSON.stringify(genres) !== JSON.stringify(data.genres ?? []) ||
        isActive !== data.isActive ||
        displayOrder !== (data.spotlightOrder ?? data.displayOrder ?? 0) ||
        JSON.stringify(features) !== JSON.stringify(normalizedOriginalFeatures) ||
        JSON.stringify(faqItems) !== JSON.stringify(data.faqItems ?? []);
      setHasChanges(changed);
    }
  }, [title, tagline, description, longDescription, heroImageUrl, heroVideoUrl, accentColor, badgeText, metacriticScore, releaseDate, developerName, publisherName, genres, isActive, displayOrder, features, faqItems, groupQuery.data]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): string | undefined => {
      if (hasChanges) {
        e.preventDefault();
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = message;
        return message;
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Reset hero image error when URL changes
  useEffect(() => {
    setHeroImageError(false);
  }, [heroImageUrl]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) throw new Error('No internet connection');
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerUpdate({
        id: groupId,
        updateProductGroupDto: ({
          title,
          tagline: tagline !== '' ? tagline : undefined,
          description,
          longDescription,
          coverImageUrl: heroImageUrl !== '' ? heroImageUrl : undefined,
          isActive,
          displayOrder,
          // Spotlight fields
          isSpotlight: true, // Always true for spotlights
          heroImageUrl: heroImageUrl !== '' ? heroImageUrl : undefined,
          heroVideoUrl: heroVideoUrl !== '' ? heroVideoUrl : undefined,
          accentColor: accentColor !== '' ? accentColor : undefined,
          badgeText: badgeText !== '' ? badgeText : undefined,
          metacriticScore: metacriticScore ?? undefined,
          releaseDate: releaseDate !== '' ? new Date(releaseDate).toISOString() : undefined,
          developerName: developerName !== '' ? developerName : undefined,
          publisherName: publisherName !== '' ? publisherName : undefined,
          genres: genres.length > 0 ? genres : undefined,
          features,
          faqItems: faqItems.length > 0 ? faqItems : undefined,
          spotlightOrder: displayOrder,
        } as unknown) as Parameters<typeof api.adminGroupsControllerUpdate>[0]['updateProductGroupDto'],
      });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups'] });
      setHasChanges(false);
      showSuccess('Spotlight saved successfully!');
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'update-spotlight');
    },
  });

  // Assign products mutation
  const assignMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      if (!isOnline) throw new Error('No internet connection');
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
      showSuccess(`${count} product${count !== 1 ? 's' : ''} added!`);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'assign-products');
    },
  });

  // Remove product mutation
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!isOnline) throw new Error('No internet connection');
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
      showSuccess('Product removed!');
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'remove-product');
    },
  });

  // Refresh stats mutation
  const refreshStatsMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) throw new Error('No internet connection');
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerRefreshStats({ id: groupId });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups', groupId] });
      showSuccess('Stats refreshed!');
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
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Clear error handler
  const handleClearError = (): void => {
    setLastError(null);
    clearError();
  };

  // Loading state
  if (groupQuery.isLoading) return <DetailSkeleton />;

  // Error state
  if (groupQuery.isError || groupQuery.data === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="p-6 rounded-full bg-destructive/10 border border-destructive/30">
          <XCircle className="h-16 w-16 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-text-primary">Failed to Load Spotlight</h2>
          <p className="text-text-secondary max-w-md">
            {groupQuery.error instanceof Error ? groupQuery.error.message : 'Unable to fetch spotlight details.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => void groupQuery.refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin/catalog/groups" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Spotlights
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const group = groupQuery.data;

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-1">
        {/* Success Toast */}
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

        {/* Unsaved Changes Banner */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-xl bg-bg-secondary/95 backdrop-blur-lg border border-brand-primary/50 shadow-glow"
            >
              <div className="flex items-center gap-2 text-brand-primary">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Unsaved changes</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => groupQuery.refetch()} className="text-text-secondary">
                  Discard
                </Button>
                <GlowButton size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </GlowButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild className="shrink-0 hover:text-brand-primary">
                  <Link href="/admin/catalog/groups">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to spotlights</TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-linear-to-br from-brand-primary/20 to-purple-neon/20 border border-brand-primary/30 shadow-glow">
                <Sparkles className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Edit Spotlight</h1>
                <p className="text-sm text-text-secondary mt-0.5">{group.title}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => refreshStatsMutation.mutate()} disabled={refreshStatsMutation.isPending} className="gap-2">
                  {refreshStatsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh stats</TooltipContent>
            </Tooltip>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href={`/games/${group.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Link>
            </Button>
            <GlowButton onClick={() => updateMutation.mutate()} disabled={!hasChanges || updateMutation.isPending} className={!hasChanges ? 'opacity-50' : ''}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </GlowButton>
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Alert className="border-orange-warning/30 bg-orange-warning/10">
                <WifiOff className="h-4 w-4 text-orange-warning" />
                <AlertTitle className="text-orange-warning">You&apos;re offline</AlertTitle>
                <AlertDescription className="text-text-secondary">Check your connection to save changes.</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lastError !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Alert variant="destructive" className="relative">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Failed to save</AlertTitle>
                <AlertDescription className="pr-8">{lastError}</AlertDescription>
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleClearError}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border-subtle/50 pb-4">
              <SectionHeader icon={Pencil} title="Basic Info" description="Game title and description" />
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Game Title <span className="text-destructive">*</span></Label>
                  <CharacterCount current={title.length} max={100} />
                </div>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Grand Theft Auto V" className="input-glow" maxLength={100} />
              </div>

              {/* Slug (read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="h-3.5 w-3.5 text-text-muted" />
                  URL Slug
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">/games/</span>
                    <Input value={group.slug} disabled className="font-mono text-sm pl-16 bg-bg-tertiary" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => void copySlug(group.slug)}>
                        {copiedSlug ? <Check className="h-4 w-4 text-green-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{copiedSlug ? 'Copied!' : 'Copy URL'}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tagline">Short Tagline</Label>
                  <CharacterCount current={tagline.length} max={200} />
                </div>
                <Textarea id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A promotional tagline..." rows={2} className="input-glow resize-none" maxLength={200} />
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Full Description</Label>
                  <CharacterCount current={description.length} max={2000} />
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Full game description for SEO..."
                  rows={6}
                  className="input-glow w-full resize-y"
                  maxLength={2000}
                />
              </div>

              {/* Marketing Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="longDescription">Marketing Description</Label>
                  <CharacterCount current={longDescription.length} max={5000} />
                </div>
                <Textarea
                  id="longDescription"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="Detailed long-form content shown on the /games/[slug] marketing page..."
                  rows={8}
                  className="input-glow w-full resize-y"
                  maxLength={5000}
                />
                <p className="text-xs text-text-muted">
                  This powers the full readable description block on the marketing spotlight page.
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Visual Settings */}
          <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border-subtle/50 pb-4">
              <SectionHeader icon={ImageIcon} title="Visual Settings" description="Hero images and accent colors" />
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Hero Image Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-bg-tertiary border border-border-subtle">
                {heroImageUrl !== '' && !heroImageError ? (
                  <Image src={heroImageUrl} alt="Hero preview" fill className="object-cover" onError={() => setHeroImageError(true)} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
                    <ImageIcon className="h-12 w-12 mb-2 opacity-30" />
                    <span className="text-sm">Hero image preview</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" style={{ background: `linear-gradient(to top, ${accentColor}30, transparent 50%)` }} />
                {badgeText !== '' && (
                  <Badge className="absolute top-3 right-3" style={{ backgroundColor: `${accentColor}40`, borderColor: accentColor, color: accentColor }}>
                    {badgeText}
                  </Badge>
                )}
              </div>

              {/* Hero Image URL */}
              <div className="space-y-2">
                <Label htmlFor="heroImageUrl" className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-text-muted" />
                  Hero Image URL
                </Label>
                <Input id="heroImageUrl" value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="https://example.com/hero.jpg" className="input-glow" />
                <p className="text-xs text-text-muted">Large banner image (16:9 recommended)</p>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5 text-text-muted" />
                  Accent Color
                </Label>
                <div className="flex gap-3">
                  <Input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                  <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#00d4ff" className="input-glow font-mono flex-1" />
                  <ColorPreview color={accentColor} />
                </div>
              </div>

              {/* Badge Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="badgeText">Badge Text</Label>
                  <CharacterCount current={badgeText.length} max={20} />
                </div>
                <Input id="badgeText" value={badgeText} onChange={(e) => setBadgeText(e.target.value)} placeholder="e.g., NEW, BEST SELLER, -50%" className="input-glow" maxLength={20} />
              </div>

              {/* Trailer URL */}
              <div className="space-y-2">
                <Label htmlFor="heroVideoUrl" className="flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-text-muted" />
                  Trailer URL
                </Label>
                <Input id="heroVideoUrl" value={heroVideoUrl} onChange={(e) => setHeroVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="input-glow" />
              </div>
            </CardContent>
          </Card>

          {/* Game Details */}
          <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border-subtle/50 pb-4">
              <SectionHeader icon={Star} title="Game Details" description="Metacritic, release date, and more" />
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Metacritic Score */}
                <div className="space-y-2">
                  <Label htmlFor="metacriticScore" className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    Metacritic
                  </Label>
                  <Input id="metacriticScore" type="number" min={0} max={100} value={metacriticScore ?? ''} onChange={(e) => { const val = parseInt(e.target.value, 10); setMetacriticScore(Number.isNaN(val) ? null : val); }} placeholder="0-100" className="input-glow" />
                </div>

                {/* Release Date */}
                <div className="space-y-2">
                  <Label htmlFor="releaseDate" className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    Release Date
                  </Label>
                  <Input id="releaseDate" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="input-glow" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Developer */}
                <div className="space-y-2">
                  <Label htmlFor="developerName">Developer</Label>
                  <Input id="developerName" value={developerName} onChange={(e) => setDeveloperName(e.target.value)} placeholder="e.g., Rockstar Games" className="input-glow" />
                </div>

                {/* Publisher */}
                <div className="space-y-2">
                  <Label htmlFor="publisherName">Publisher</Label>
                  <Input id="publisherName" value={publisherName} onChange={(e) => setPublisherName(e.target.value)} placeholder="e.g., Take-Two Interactive" className="input-glow" />
                </div>
              </div>

              {/* Genres */}
              <div className="space-y-2">
                <Label>Genres</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {genres.map((genre, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1 pr-1">
                      {genre}
                      <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-destructive/20" onClick={() => setGenres(genres.filter((_, i) => i !== idx))}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newGenre} onChange={(e) => setNewGenre(e.target.value)} placeholder="Add genre..." className="input-glow" onKeyDown={(e) => { if (e.key === 'Enter' && newGenre.trim() !== '') { e.preventDefault(); setGenres([...genres, newGenre.trim()]); setNewGenre(''); } }} />
                  <Button variant="outline" disabled={newGenre.trim() === ''} onClick={() => { if (newGenre.trim() !== '') { setGenres([...genres, newGenre.trim()]); setNewGenre(''); } }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats & Visibility */}
          <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border-subtle/50 pb-4">
              <SectionHeader icon={BarChart3} title="Stats & Visibility" description="Statistics and display settings" />
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatsCard icon={Package} label="Products" value={String(group.productCount ?? 0)} variant="cyan" />
                <StatsCard icon={DollarSign} label="Min Price" value={formatPrice(group.minPrice)} variant="success" />
                <StatsCard icon={DollarSign} label="Max Price" value={formatPrice(group.maxPrice)} variant="warning" />
                <StatsCard icon={Hash} label="Order" value={displayOrder} variant="purple" />
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Sort Order</Label>
                <Input id="displayOrder" type="number" min={0} value={displayOrder} onChange={(e) => { const val = parseInt(e.target.value, 10); setDisplayOrder(Number.isNaN(val) ? 0 : val); }} className="input-glow w-24" />
                <p className="text-xs text-text-muted">Lower numbers appear first on the homepage</p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border-subtle p-4 hover:border-brand-primary/30 transition-colors">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
                    {isActive ? <Eye className="h-4 w-4 text-green-success" /> : <EyeOff className="h-4 w-4 text-text-muted" />}
                    {isActive ? 'Live' : 'Draft'}
                  </Label>
                  <p className="text-xs text-text-muted">{isActive ? 'Visible on homepage and /games' : 'Hidden from public'}</p>
                </div>
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Settings (Collapsible) */}
        <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
          <CardHeader className="cursor-pointer select-none" onClick={() => setAdvancedExpanded(!advancedExpanded)}>
            <div className="flex items-center justify-between">
              <SectionHeader icon={FileText} title="Advanced Settings" description="Features and FAQ items" badge={<Badge variant="outline" className="text-xs">Optional</Badge>} />
              <Button variant="ghost" size="icon" className="shrink-0">
                {advancedExpanded ? <ChevronUp className="h-5 w-5 text-text-muted" /> : <ChevronDown className="h-5 w-5 text-text-muted" />}
              </Button>
            </div>
          </CardHeader>
          <AnimatePresence>
            {advancedExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                <CardContent className="space-y-6 pt-0">
                  {/* Features */}
                  <div className="space-y-4 p-4 rounded-lg border border-border-subtle bg-bg-tertiary/30">
                    <h4 className="font-medium text-text-primary flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-glow" />
                      Key Features
                    </h4>
                    <div className="space-y-2">
                      {features.map((feature, idx) => (
                        <div key={`${idx}-${feature.title}`} className="flex items-start gap-2 p-3 rounded border border-border-subtle bg-bg-tertiary/50">
                          <CheckCircle2 className="h-4 w-4 text-green-success shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold text-text-primary">{feature.title}</p>
                            {feature.description !== '' && (
                              <p className="text-sm text-text-secondary">{feature.description}</p>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/20" onClick={() => setFeatures(features.filter((_, i) => i !== idx))}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        value={newFeatureTitle}
                        onChange={(e) => setNewFeatureTitle(e.target.value)}
                        placeholder="Feature title..."
                        className="input-glow"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newFeatureTitle.trim() !== '') {
                            e.preventDefault();
                            setFeatures([
                              ...features,
                              {
                                title: newFeatureTitle.trim(),
                                description: newFeatureDescription.trim(),
                              },
                            ]);
                            setNewFeatureTitle('');
                            setNewFeatureDescription('');
                          }
                        }}
                      />
                      <Input
                        value={newFeatureDescription}
                        onChange={(e) => setNewFeatureDescription(e.target.value)}
                        placeholder="Feature description..."
                        className="input-glow"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="gap-2"
                        disabled={newFeatureTitle.trim() === ''}
                        onClick={() => {
                          if (newFeatureTitle.trim() !== '') {
                            setFeatures([
                              ...features,
                              {
                                title: newFeatureTitle.trim(),
                                description: newFeatureDescription.trim(),
                              },
                            ]);
                            setNewFeatureTitle('');
                            setNewFeatureDescription('');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add Feature
                      </Button>
                    </div>
                  </div>

                  {/* FAQ Items */}
                  <div className="space-y-4 p-4 rounded-lg border border-border-subtle bg-bg-tertiary/30">
                    <h4 className="font-medium text-text-primary flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-cyan-glow" />
                      FAQ Items
                    </h4>
                    <div className="space-y-3">
                      {faqItems.map((faq, idx) => (
                        <div key={idx} className="p-3 rounded border border-border-subtle bg-bg-tertiary/50">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 space-y-2">
                              <Input value={faq.question} onChange={(e) => { const updated = [...faqItems]; updated[idx] = { ...faq, question: e.target.value }; setFaqItems(updated); }} placeholder="Question..." className="input-glow" />
                              <Textarea value={faq.answer} onChange={(e) => { const updated = [...faqItems]; updated[idx] = { ...faq, answer: e.target.value }; setFaqItems(updated); }} placeholder="Answer..." rows={2} className="input-glow resize-none" />
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0 hover:bg-destructive/20" onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" onClick={() => setFaqItems([...faqItems, { question: '', answer: '' }])} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add FAQ Item
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Assigned Products */}
        <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeader icon={Package} title="Products" description={`${group.products?.length ?? 0} product${(group.products?.length ?? 0) !== 1 ? 's' : ''} in this spotlight`} />
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
                  <p className="text-sm text-text-secondary">Add products to show variant options on the spotlight page</p>
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
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-16 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.products?.map((product, index) => (
                      <motion.tr key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group border-b border-border-subtle last:border-0 hover:bg-cyan-glow/5 transition-colors">
                        <TableCell>
                          <div className="w-11 h-11 rounded-md overflow-hidden bg-bg-tertiary border border-border-subtle group-hover:border-cyan-glow/30 transition-colors">
                            {product.coverImageUrl !== null && product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                              <Image src={product.coverImageUrl} alt={product.title} width={44} height={44} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-text-muted" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/catalog/products/${product.id}`} className="font-medium text-text-primary hover:text-cyan-glow transition-colors line-clamp-1">
                            {product.title}
                          </Link>
                          <div className="flex gap-2 mt-0.5 md:hidden">
                            <Badge variant="outline" className="text-xs">{product.platform ?? '-'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="bg-bg-tertiary">{product.platform ?? '-'}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-text-secondary">{product.subtitle ?? 'Standard'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono font-medium text-cyan-glow">{formatPrice(product.price)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => { setProductToRemove(product); setRemoveConfirmOpen(true); }} disabled={removeMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove from spotlight</TooltipContent>
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
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col border-border-subtle bg-bg-secondary overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30">
                  <Plus className="h-4 w-4 text-cyan-glow" />
                </div>
                Add Products
              </DialogTitle>
              <DialogDescription>Select products to add to &quot;{group.title}&quot;</DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
                <Input placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-10 input-glow" />
              </div>

              <div className="flex-1 min-h-0 max-h-[50vh] overflow-y-auto">
                {productsQuery.isLoading ? (
                  <div className="space-y-3 pr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle bg-bg-tertiary animate-pulse">
                        <div className="w-5 h-5 rounded bg-bg-secondary shrink-0" />
                        <div className="w-10 h-10 rounded bg-bg-secondary shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-bg-secondary" />
                          <div className="h-3 w-1/2 rounded bg-bg-secondary" />
                        </div>
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
                  <div className="space-y-2 pr-2">
                    {availableProducts.map((product: AdminProductResponseDto, index: number) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedProductIds.includes(product.id) ? 'border-cyan-glow bg-cyan-glow/10 shadow-glow-cyan-sm' : 'border-border-subtle bg-bg-tertiary hover:border-cyan-glow/50'}`}
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <Checkbox checked={selectedProductIds.includes(product.id)} onCheckedChange={() => toggleProductSelection(product.id)} className="shrink-0 data-[state=checked]:bg-cyan-glow data-[state=checked]:border-cyan-glow" />
                        <div className="w-11 h-11 rounded-md overflow-hidden bg-bg-secondary shrink-0 border border-border-subtle">
                          {product.coverImageUrl !== null && product.coverImageUrl !== undefined && product.coverImageUrl !== '' ? (
                            <Image src={product.coverImageUrl} alt={product.title} width={44} height={44} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-text-muted" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="font-medium text-text-primary truncate">{product.title}</div>
                          <div className="flex gap-2 text-xs text-text-muted mt-0.5">
                            <Badge variant="outline" className="text-xs py-0 h-5 shrink-0">{product.platform ?? '-'}</Badge>
                            <span className="truncate">{product.region ?? 'Global'}</span>
                          </div>
                        </div>
                        <div className="text-sm font-mono font-medium text-cyan-glow shrink-0 pl-2">{formatPrice(product.price)}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <AnimatePresence>
                {selectedProductIds.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="shrink-0 flex items-center justify-between p-3 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30">
                    <span className="text-sm text-cyan-glow font-medium">{selectedProductIds.length} selected</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProductIds([])} className="h-7 text-text-muted">Clear</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DialogFooter className="shrink-0 gap-2 sm:gap-0 border-t border-border-subtle pt-4 mt-2">
              <Button variant="outline" onClick={() => { setAddProductsOpen(false); setSelectedProductIds([]); setProductSearch(''); }} disabled={assignMutation.isPending}>Cancel</Button>
              <GlowButton onClick={() => assignMutation.mutate(selectedProductIds)} disabled={selectedProductIds.length === 0 || assignMutation.isPending}>
                {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
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
                Remove <span className="font-medium text-text-primary">&quot;{productToRemove?.title}&quot;</span> from this spotlight?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-bg-secondary border border-border-subtle shrink-0">
                    {productToRemove?.coverImageUrl !== null && productToRemove?.coverImageUrl !== undefined && productToRemove.coverImageUrl !== '' ? (
                      <Image src={productToRemove.coverImageUrl} alt={productToRemove.title} width={48} height={48} className="w-full h-full object-contain" />
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
                The product will not be deleted, only removed from this spotlight.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t border-border-subtle pt-4">
              <Button variant="outline" onClick={() => setRemoveConfirmOpen(false)} disabled={removeMutation.isPending}>Cancel</Button>
              <Button variant="destructive" onClick={() => productToRemove !== null && removeMutation.mutate(productToRemove.id)} disabled={removeMutation.isPending} className="gap-2">
                {removeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
}
