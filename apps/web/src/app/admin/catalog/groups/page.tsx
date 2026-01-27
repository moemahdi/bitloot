'use client';

/**
 * Admin Product Groups Page
 *
 * Features:
 * - List all product groups with search
 * - Create, edit, delete groups
 * - View assigned product count and price ranges
 * - Activate/deactivate groups
 * - Responsive table layout with neon cyberpunk styling
 * - Error handling with retry capability
 * - Full 9-state implementation (default, hover, focus, active, disabled, loading, error, success, empty)
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
  Layers,
  Eye,
  EyeOff,
  DollarSign,
  Package,
  BarChart3,
  WifiOff,
  CheckCircle2,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductGroupListResponseDto, ProductGroupResponseDto } from '@bitloot/sdk';
import { AdminProductGroupsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants for staggered children
const _containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

// Skeleton loader component for table rows
function TableRowSkeleton(): React.JSX.Element {
  return (
    <TableRow>
      <TableCell>
        <div className="w-12 h-12 rounded-lg skeleton" />
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-3 w-24 skeleton rounded" />
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="h-6 w-12 skeleton rounded-full mx-auto" />
      </TableCell>
      <TableCell className="text-right">
        <div className="h-4 w-24 skeleton rounded ml-auto" />
      </TableCell>
      <TableCell className="text-center">
        <div className="h-6 w-16 skeleton rounded-full mx-auto" />
      </TableCell>
      <TableCell className="text-center">
        <div className="h-4 w-8 skeleton rounded mx-auto" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <div className="h-8 w-8 skeleton rounded" />
          <div className="h-8 w-8 skeleton rounded" />
        </div>
      </TableCell>
    </TableRow>
  );
}

// Stats card component
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

export default function AdminProductGroupsPage(): React.JSX.Element {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ProductGroupResponseDto | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Error handling
  const { handleError, clearError } = useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error: Error, context: string): void => {
      setLastError(error.message);
      console.error('Groups fetch error:', { error, context });
    },
    onRetry: (attempt: number): void => {
      console.info(`Retrying groups fetch (attempt ${attempt})...`);
    },
    onRecovery: (): void => {
      setLastError(null);
      console.info('Groups fetch recovered successfully');
    },
  });

  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();

  // Show success feedback
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  }, []);

  // Fetch groups
  const groupsQuery = useQuery({
    queryKey: ['admin', 'catalog', 'groups', searchQuery],
    queryFn: async (): Promise<ProductGroupListResponseDto> => {
      if (!isOnline) {
        throw new Error('No internet connection. Please check your network.');
      }

      try {
        const api = new AdminProductGroupsApi(apiConfig);
        const response = await api.adminGroupsControllerList({
          search: searchQuery !== '' ? searchQuery : undefined,
        });

        clearError();
        return response;
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), 'fetch-groups');
        throw error;
      }
    },
    staleTime: 30_000,
    gcTime: 300_000,
    retry: (failureCount: number, error: Error): boolean => {
      if (failureCount < 3) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        return message.includes('network') || message.includes('timeout');
      }
      return false;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerDelete({ id: groupId });
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups'] });
      showSuccess(`"${groupToDelete?.title}" has been deleted`);
      setGroupToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'delete-group');
    },
  });

  // Refresh stats mutation
  const refreshStatsMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerRefreshAllStats();
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups'] });
      showSuccess('Stats refreshed successfully');
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'refresh-stats');
    },
  });

  // Handle delete confirmation
  const handleDeleteClick = (group: ProductGroupResponseDto): void => {
    setGroupToDelete(group);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete action
  const confirmDelete = (): void => {
    if (groupToDelete !== null) {
      deleteMutation.mutate(groupToDelete.id);
    }
  };

  // Clear error handler
  const handleClearError = (): void => {
    setLastError(null);
    clearError();
  };

  // Get data
  const data = groupsQuery.data;
  const groups = data?.groups ?? [];

  // Filter groups by search query (client-side for quick filtering)
  const filteredGroups = searchQuery !== ''
    ? groups.filter((g) =>
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : groups;

  // Calculate stats
  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.isActive).length;
  const totalProducts = groups.reduce((sum, g) => sum + (g.productCount ?? 0), 0);

  // Format price
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '-';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `$${num.toFixed(2)}`;
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-6 p-1"
      >
        {/* Success Toast */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-success/20 border border-green-success/30 shadow-glow-success"
            >
              <CheckCircle2 className="h-5 w-5 text-green-success" />
              <span className="text-sm font-medium text-green-success">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30 shadow-glow-cyan-sm">
                <Layers className="h-6 w-6 text-cyan-glow" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                  Product Groups
                </h1>
                <p className="text-sm text-text-secondary mt-0.5">
                  Bundle product variants together for organized catalog management
                </p>
              </div>
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
                  className="gap-2 hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200"
                >
                  {refreshStatsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-glow" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Refresh Stats</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recalculate product counts and price ranges</p>
              </TooltipContent>
            </Tooltip>
            <GlowButton asChild className="gap-2">
              <Link href="/admin/catalog/groups/new">
                <Plus className="h-4 w-4" />
                <span>Create Group</span>
              </Link>
            </GlowButton>
          </div>
        </div>

        {/* Stats Overview */}
        {!groupsQuery.isLoading && !groupsQuery.isError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <StatsCard
              label="Total Groups"
              value={totalGroups}
              icon={Layers}
              glowColor="cyan"
            />
            <StatsCard
              label="Active Groups"
              value={activeGroups}
              icon={Eye}
              glowColor="green"
            />
            <StatsCard
              label="Products Grouped"
              value={totalProducts}
              icon={Package}
              glowColor="purple"
            />
          </motion.div>
        )}

        {/* Offline Alert */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert className="border-orange-warning/30 bg-orange-warning/10">
                <WifiOff className="h-4 w-4 text-orange-warning" />
                <AlertTitle className="text-orange-warning">You&apos;re offline</AlertTitle>
                <AlertDescription className="text-text-secondary">
                  Please check your internet connection to manage product groups.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        <AnimatePresence>
          {lastError !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive" className="relative">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription className="pr-8">{lastError}</AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 hover:bg-destructive/20"
                  onClick={handleClearError}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Groups Card */}
        <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border-subtle/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-neon" />
                  All Groups
                </CardTitle>
                <CardDescription className="mt-1">
                  {groupsQuery.isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading groups...
                    </span>
                  ) : (
                    <>
                      {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''} found
                      {searchQuery !== '' && ` matching "${searchQuery}"`}
                    </>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <Input
                    placeholder="Search by name or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 input-glow"
                    disabled={groupsQuery.isLoading}
                  />
                  {searchQuery !== '' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchQuery('')}
                    >
                      <XCircle className="h-4 w-4 text-text-muted" />
                    </Button>
                  )}
                </div>
                {/* Refresh */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => groupsQuery.refetch()}
                      disabled={groupsQuery.isFetching}
                      className="hover:bg-bg-tertiary hover:text-cyan-glow transition-colors"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${groupsQuery.isFetching ? 'animate-spin text-cyan-glow' : ''}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh list</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Loading State */}
            {groupsQuery.isLoading ? (
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead className="text-center">Products</TableHead>
                      <TableHead className="text-right">Price Range</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : groupsQuery.isError ? (
              /* Error State */
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="p-4 rounded-full bg-destructive/10 mb-4">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Failed to load groups</h3>
                <p className="text-sm text-text-secondary text-center max-w-sm mb-6">
                  There was an error loading your product groups. Please try again.
                </p>
                <Button
                  onClick={() => groupsQuery.refetch()}
                  className="gap-2 hover:shadow-glow-cyan-sm transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : filteredGroups.length === 0 ? (
              /* Empty State */
              <div className="empty-state py-16">
                <div className="p-4 rounded-full bg-bg-tertiary border border-border-subtle mb-4">
                  <Layers className="empty-state-icon m-0" />
                </div>
                <h3 className="empty-state-title">
                  {searchQuery !== '' ? 'No matching groups' : 'No product groups yet'}
                </h3>
                <p className="empty-state-description">
                  {searchQuery !== ''
                    ? `No groups found matching "${searchQuery}". Try a different search term.`
                    : 'Create your first product group to organize product variants together.'}
                </p>
                {searchQuery !== '' ? (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="mt-4 gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Clear Search
                  </Button>
                ) : (
                  <GlowButton asChild className="mt-4 gap-2">
                    <Link href="/admin/catalog/groups/new">
                      <Plus className="h-4 w-4" />
                      Create First Group
                    </Link>
                  </GlowButton>
                )}
              </div>
            ) : (
              /* Data Table */
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border-subtle/50">
                      <TableHead className="w-16 text-text-muted uppercase text-xs tracking-wider font-medium">
                        Image
                      </TableHead>
                      <TableHead className="text-text-muted uppercase text-xs tracking-wider font-medium">
                        <span className="flex items-center gap-1">
                          Group
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </span>
                      </TableHead>
                      <TableHead className="text-center text-text-muted uppercase text-xs tracking-wider font-medium">
                        Products
                      </TableHead>
                      <TableHead className="text-right text-text-muted uppercase text-xs tracking-wider font-medium">
                        Price Range
                      </TableHead>
                      <TableHead className="text-center text-text-muted uppercase text-xs tracking-wider font-medium">
                        Status
                      </TableHead>
                      <TableHead className="text-center text-text-muted uppercase text-xs tracking-wider font-medium">
                        Order
                      </TableHead>
                      <TableHead className="text-right text-text-muted uppercase text-xs tracking-wider font-medium">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredGroups.map((group, index) => (
                        <motion.tr
                          key={group.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ delay: index * 0.03 }}
                          className="group/row border-b border-border-subtle/30 hover:bg-bg-tertiary/50 transition-colors"
                        >
                          {/* Image */}
                          <TableCell className="py-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg-tertiary border border-border-subtle group-hover/row:border-border-accent transition-colors">
                              {group.coverImageUrl !== null && group.coverImageUrl !== undefined && group.coverImageUrl !== '' ? (
                                <Image
                                  src={group.coverImageUrl}
                                  alt={group.title}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary">
                                  <Layers className="h-5 w-5 text-text-muted" />
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Group Info */}
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-0.5">
                              <Link
                                href={`/admin/catalog/groups/${group.id}`}
                                className="font-medium text-text-primary hover:text-cyan-glow transition-colors inline-flex items-center gap-1 group/link"
                              >
                                {group.title}
                                <Pencil className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                              </Link>
                              <code className="text-xs text-text-muted font-mono bg-bg-tertiary/50 px-1.5 py-0.5 rounded w-fit">
                                {group.slug}
                              </code>
                              {group.tagline !== null && group.tagline !== undefined && group.tagline !== '' && (
                                <span className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                                  {group.tagline}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Product Count */}
                          <TableCell className="text-center py-3">
                            <Badge
                              variant="outline"
                              className={`gap-1.5 ${
                                (group.productCount ?? 0) > 0
                                  ? 'border-purple-neon/30 text-purple-neon'
                                  : 'border-border-subtle text-text-muted'
                              }`}
                            >
                              <Package className="h-3 w-3" />
                              {group.productCount ?? 0}
                            </Badge>
                          </TableCell>

                          {/* Price Range */}
                          <TableCell className="text-right py-3">
                            <div className="flex items-center justify-end gap-1.5 text-sm">
                              <DollarSign className="h-3.5 w-3.5 text-cyan-glow" />
                              <span className="font-mono text-text-primary">
                                {formatPrice(group.minPrice)}
                              </span>
                              <span className="text-text-muted">–</span>
                              <span className="font-mono text-text-primary">
                                {formatPrice(group.maxPrice)}
                              </span>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center py-3">
                            {group.isActive ? (
                              <Badge className="badge-success gap-1">
                                <span className="status-dot status-dot-success" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1.5 text-text-muted">
                                <EyeOff className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>

                          {/* Display Order */}
                          <TableCell className="text-center py-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-bg-tertiary text-text-muted text-sm font-medium">
                              {group.displayOrder ?? 0}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right py-3">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover/row:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="h-8 w-8 hover:bg-cyan-glow/10 hover:text-cyan-glow transition-colors"
                                  >
                                    <Link href={`/admin/catalog/groups/${group.id}`}>
                                      <Pencil className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit group</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    onClick={() => handleDeleteClick(group)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete group</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>Delete Product Group</DialogTitle>
              </div>
              <DialogDescription className="text-left">
                Are you sure you want to delete{' '}
                <span className="font-medium text-text-primary">&quot;{groupToDelete?.title}&quot;</span>?
                <br />
                <br />
                <span className="text-orange-warning">
                  This will unassign all products from this group.
                </span>{' '}
                Products themselves will not be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleteMutation.isPending}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 sm:flex-none gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Group
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
}
