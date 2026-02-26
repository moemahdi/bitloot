'use client';

/**
 * Admin Game Spotlights Page
 *
 * Features:
 * - List all game spotlights with search
 * - Create, edit, delete spotlights
 * - View assigned product count, accent colors, and badges
 * - Activate/deactivate spotlights
 * - Preview spotlight pages
 * - Responsive card/table layout with neon cyberpunk styling
 *
 * Spotlights are featured game landing pages that appear on:
 * - Homepage "Game Spotlights" section
 * - Individual /games/[slug] pages
 *
 * Follows BitLoot design system with neon cyberpunk gaming aesthetic
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
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
  Search,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  Package,
  BarChart3,
  WifiOff,
  CheckCircle2,
  ExternalLink,
  Star,
  Calendar,
  Palette,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductGroupListResponseDto, ProductGroupResponseDto } from '@bitloot/sdk';
import { AdminProductGroupsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

// SpotlightGroup uses the ProductGroupResponseDto directly since it already
// includes all spotlight fields. We just alias it for clarity.
type SpotlightGroup = ProductGroupResponseDto;

// ============================================================================
// COMPONENTS
// ============================================================================

function StatsCard({
  label,
  value,
  icon: Icon,
  glowColor = 'cyan',
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  glowColor?: 'cyan' | 'purple' | 'green';
}): React.JSX.Element {
  const glowClasses = {
    cyan: 'text-cyan-glow shadow-glow-cyan-sm',
    purple: 'text-purple-neon shadow-glow-purple-sm',
    green: 'text-green-success shadow-glow-success',
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-bg-tertiary/50 border border-border-subtle hover:border-border-accent transition-colors">
      <div className={`p-2 rounded-lg bg-bg-primary ${glowClasses[glowColor]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-lg font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function SpotlightCardSkeleton(): React.JSX.Element {
  return (
    <Card className="overflow-hidden border-border-subtle bg-bg-secondary/50 animate-pulse">
      <div className="aspect-video bg-bg-tertiary" />
      <CardContent className="p-4 space-y-3">
        <div className="h-5 bg-bg-tertiary rounded w-3/4" />
        <div className="h-4 bg-bg-tertiary rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-bg-tertiary rounded-full w-16" />
          <div className="h-6 bg-bg-tertiary rounded-full w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

interface SpotlightCardProps {
  spotlight: SpotlightGroup;
  onDelete: (spotlight: SpotlightGroup) => void;
  isDeleting: boolean;
}

function SpotlightCard({ spotlight, onDelete, isDeleting }: SpotlightCardProps): React.JSX.Element {
  const heroImage = spotlight.heroImageUrl ?? spotlight.coverImageUrl;
  const accentColor = spotlight.accentColor ?? '#00d4ff';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group overflow-hidden border-border-subtle bg-bg-secondary/50 hover:border-brand-primary/50 transition-all duration-300">
        {/* Hero Image */}
        <div className="relative aspect-video bg-bg-tertiary overflow-hidden">
          {heroImage !== null && heroImage !== undefined && heroImage !== '' ? (
            <Image
              src={heroImage}
              alt={spotlight.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-text-muted">
              <Sparkles className="h-12 w-12 opacity-30" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div 
            className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"
            style={{ 
              background: `linear-gradient(to top, ${accentColor}20, transparent 60%), linear-gradient(to top, rgba(0,0,0,0.8), transparent 40%)`
            }}
          />
          
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <Badge 
              variant={spotlight.isActive ? 'default' : 'secondary'}
              className={spotlight.isActive 
                ? 'bg-green-success/20 text-green-success border-green-success/30' 
                : 'bg-bg-tertiary/80 text-text-muted'
              }
            >
              {spotlight.isActive ? (
                <><Eye className="h-3 w-3 mr-1" /> Live</>
              ) : (
                <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
              )}
            </Badge>
          </div>
          
          {/* Badge text */}
          {spotlight.badgeText !== null && spotlight.badgeText !== undefined && spotlight.badgeText !== '' && (
            <Badge 
              className="absolute top-3 right-3"
              style={{ 
                backgroundColor: `${accentColor}30`,
                borderColor: accentColor,
                color: accentColor 
              }}
            >
              {spotlight.badgeText}
            </Badge>
          )}
          
          {/* Metacritic score */}
          {spotlight.metacriticScore !== null && spotlight.metacriticScore !== undefined && spotlight.metacriticScore > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 backdrop-blur-sm">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-white">{spotlight.metacriticScore}</span>
            </div>
          )}
          
          {/* Product count */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 backdrop-blur-sm">
            <Package className="h-3 w-3 text-text-secondary" />
            <span className="text-xs text-white">{spotlight.productCount ?? 0} products</span>
          </div>
        </div>
        
        {/* Content */}
        <CardContent className="p-4">
          {/* Title & Actions */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary truncate group-hover:text-brand-primary transition-colors">
                {spotlight.title}
              </h3>
              {spotlight.tagline !== null && spotlight.tagline !== undefined && spotlight.tagline !== '' && (
                <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                  {spotlight.tagline}
                </p>
              )}
            </div>
            
            {/* Accent Color Indicator */}
            <div 
              className="w-6 h-6 rounded-full border-2 border-bg-tertiary shrink-0"
              style={{ backgroundColor: accentColor }}
              title={`Accent: ${accentColor}`}
            />
          </div>
          
          {/* Meta Info */}
          <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
            {spotlight.releaseDate !== null && spotlight.releaseDate !== undefined && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(spotlight.releaseDate).getFullYear()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              {accentColor}
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/admin/catalog/groups/${spotlight.id}`}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit spotlight settings and products</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  asChild
                  className="hover:text-brand-primary"
                >
                  <Link href={`/games/${spotlight.slug}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview spotlight page</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDelete(spotlight)}
                  disabled={isDeleting}
                  className="hover:text-destructive hover:bg-destructive/10"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete spotlight</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminSpotlightsPage(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [spotlightToDelete, setSpotlightToDelete] = useState<SpotlightGroup | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { handleError, clearError } = useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error: Error, context: string): void => {
      setLastError(error.message);
      console.error('Spotlights fetch error:', { error, context });
    },
    onRecovery: (): void => {
      setLastError(null);
    },
  });

  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  }, []);

  // Fetch spotlights
  const spotlightsQuery = useQuery({
    queryKey: ['admin', 'spotlights', searchQuery],
    queryFn: async (): Promise<ProductGroupListResponseDto> => {
      if (!isOnline) {
        throw new Error('No internet connection.');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      const response = await api.adminGroupsControllerList({
        search: searchQuery !== '' ? searchQuery : undefined,
      });
      clearError();
      return response;
    },
    staleTime: 30_000,
    gcTime: 300_000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (spotlightId: string) => {
      if (!isOnline) throw new Error('No internet connection');
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerDelete({ id: spotlightId });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'spotlights'] });
      showSuccess(`"${spotlightToDelete?.title}" deleted`);
      setSpotlightToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'delete-spotlight');
    },
  });

  // Refresh stats mutation
  const refreshStatsMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) throw new Error('No internet connection');
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerRefreshAllStats();
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'spotlights'] });
      showSuccess('Stats refreshed');
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'refresh-stats');
    },
  });

  const handleDeleteClick = (spotlight: SpotlightGroup): void => {
    setSpotlightToDelete(spotlight);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = (): void => {
    if (spotlightToDelete !== null) {
      deleteMutation.mutate(spotlightToDelete.id);
    }
  };

  const handleClearError = (): void => {
    setLastError(null);
    clearError();
  };

  const spotlights = spotlightsQuery.data?.groups ?? [];
  
  const filteredSpotlights = searchQuery !== ''
    ? spotlights.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : spotlights;

  const totalSpotlights = spotlights.length;
  const activeSpotlights = spotlights.filter((s) => s.isActive).length;
  const totalProducts = spotlights.reduce((sum, s) => sum + (s.productCount ?? 0), 0);

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 p-1"
      >
        {/* Success Toast */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-success/20 border border-green-success/30 shadow-glow-success"
            >
              <CheckCircle2 className="h-5 w-5 text-green-success" />
              <span className="text-sm font-medium text-green-success">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-linear-to-br from-brand-primary/20 to-purple-neon/20 border border-brand-primary/30 shadow-glow">
              <Sparkles className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                Game Spotlights
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                Featured game landing pages for the homepage and /games routes
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshStatsMutation.mutate()}
                  disabled={refreshStatsMutation.isPending || !isOnline}
                  className="gap-2"
                >
                  {refreshStatsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recalculate product counts and prices</TooltipContent>
            </Tooltip>
            <GlowButton asChild className="gap-2">
              <Link href="/admin/catalog/groups/new">
                <Plus className="h-4 w-4" />
                <span>New Spotlight</span>
              </Link>
            </GlowButton>
          </div>
        </div>

        {/* Stats */}
        {!spotlightsQuery.isLoading && !spotlightsQuery.isError && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard label="Total Spotlights" value={totalSpotlights} icon={Sparkles} glowColor="cyan" />
            <StatsCard label="Live" value={activeSpotlights} icon={Eye} glowColor="green" />
            <StatsCard label="Products" value={totalProducts} icon={Package} glowColor="purple" />
          </div>
        )}

        {/* Offline Alert */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Alert className="border-orange-warning/30 bg-orange-warning/10">
                <WifiOff className="h-4 w-4 text-orange-warning" />
                <AlertTitle className="text-orange-warning">You&apos;re offline</AlertTitle>
                <AlertDescription className="text-text-secondary">
                  Check your connection to manage spotlights.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        <AnimatePresence>
          {lastError !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Alert variant="destructive" className="relative">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="pr-8">{lastError}</AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={handleClearError}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Grid */}
        <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border-subtle/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  All Spotlights
                </CardTitle>
                <CardDescription>
                  {spotlightsQuery.isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    <>
                      {filteredSpotlights.length} spotlight{filteredSpotlights.length !== 1 ? 's' : ''}
                      {searchQuery !== '' && ` matching "${searchQuery}"`}
                    </>
                  )}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
                <Input
                  placeholder="Search spotlights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={spotlightsQuery.isLoading}
                />
                {searchQuery !== '' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {spotlightsQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SpotlightCardSkeleton key={i} />
                ))}
              </div>
            ) : spotlightsQuery.isError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <XCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Failed to load</h3>
                <p className="text-text-muted mb-4">Could not fetch spotlights</p>
                <Button variant="outline" onClick={() => spotlightsQuery.refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredSpotlights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-12 w-12 text-text-muted mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {searchQuery !== '' ? 'No results' : 'No spotlights yet'}
                </h3>
                <p className="text-text-muted mb-4">
                  {searchQuery !== '' 
                    ? 'Try a different search term' 
                    : 'Create your first game spotlight to feature on the homepage'
                  }
                </p>
                {searchQuery === '' && (
                  <GlowButton asChild>
                    <Link href="/admin/catalog/groups/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Spotlight
                    </Link>
                  </GlowButton>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredSpotlights.map((spotlight) => (
                    <SpotlightCard
                      key={spotlight.id}
                      spotlight={spotlight}
                      onDelete={handleDeleteClick}
                      isDeleting={deleteMutation.isPending && spotlightToDelete?.id === spotlight.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Spotlight
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{spotlightToDelete?.title}&quot;? 
                This will remove the spotlight page and ungroup all associated products.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
}