'use client';

/**
 * Admin Product Groups Page
 *
 * Features:
 * - List all product groups with search
 * - Create, edit, delete groups
 * - View assigned product count and price ranges
 * - Activate/deactivate groups
 * - Responsive table layout
 * - Error handling with retry capability
 *
 * Follows Level 5 admin page patterns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductGroupListResponseDto, ProductGroupResponseDto } from '@bitloot/sdk';
import { AdminProductGroupsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminProductGroupsPage(): React.JSX.Element {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ProductGroupResponseDto | null>(null);

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
          // Note: isActive can be used to filter, omitting shows all groups
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

  // Format price
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '-';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `$${num.toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Layers className="h-6 w-6 text-cyan-glow" />
            Product Groups
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage product groups to bundle variants together
          </p>
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
          <GlowButton asChild>
            <Link href="/admin/catalog/groups/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Link>
          </GlowButton>
        </div>
      </div>

      {/* Offline Alert */}
      {!isOnline && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>You&apos;re offline</AlertTitle>
          <AlertDescription>
            Please check your internet connection to manage product groups.
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

      {/* Groups Card */}
      <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">All Groups</CardTitle>
              <CardDescription>
                {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Refresh */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => groupsQuery.refetch()}
                disabled={groupsQuery.isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 ${groupsQuery.isFetching ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {groupsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
            </div>
          ) : groupsQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <XCircle className="h-12 w-12 text-accent-error" />
              <p className="text-text-secondary">Failed to load groups</p>
              <Button onClick={() => groupsQuery.refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Layers className="h-12 w-12 text-text-muted" />
              <p className="text-text-secondary">
                {searchQuery !== '' ? 'No groups match your search' : 'No product groups yet'}
              </p>
              {searchQuery === '' && (
                <GlowButton asChild>
                  <Link href="/admin/catalog/groups/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Group
                  </Link>
                </GlowButton>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  <AnimatePresence mode="popLayout">
                    {filteredGroups.map((group) => (
                      <motion.tr
                        key={group.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="group/row"
                      >
                        {/* Image */}
                        <TableCell>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg-tertiary border border-border-subtle">
                            {group.coverImageUrl !== null && group.coverImageUrl !== undefined && group.coverImageUrl !== '' ? (
                              <Image
                                src={group.coverImageUrl}
                                alt={group.title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Layers className="h-5 w-5 text-text-muted" />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Group Info */}
                        <TableCell>
                          <div className="flex flex-col">
                            <Link
                              href={`/admin/catalog/groups/${group.id}`}
                              className="font-medium text-text-primary hover:text-cyan-glow transition-colors"
                            >
                              {group.title}
                            </Link>
                            <span className="text-xs text-text-muted">{group.slug}</span>
                            {group.tagline !== null && group.tagline !== undefined && group.tagline !== '' && (
                              <span className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                                {group.tagline}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Product Count */}
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Package className="h-3 w-3" />
                            {group.productCount ?? 0}
                          </Badge>
                        </TableCell>

                        {/* Price Range */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 text-sm">
                            <DollarSign className="h-3 w-3 text-cyan-glow" />
                            <span className="text-text-primary">
                              {formatPrice(group.minPrice)} - {formatPrice(group.maxPrice)}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center">
                          {group.isActive ? (
                            <Badge className="bg-accent-success/20 text-accent-success border-accent-success/30">
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <EyeOff className="h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>

                        {/* Display Order */}
                        <TableCell className="text-center">
                          <span className="text-text-muted text-sm">{group.displayOrder ?? 0}</span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8"
                            >
                              <Link href={`/admin/catalog/groups/${group.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-accent-error hover:text-accent-error hover:bg-accent-error/10"
                              onClick={() => handleDeleteClick(group)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-accent-error">
              <Trash2 className="h-5 w-5" />
              Delete Product Group
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{groupToDelete?.title}&quot;? This will
              unassign all products from this group. Products themselves will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
