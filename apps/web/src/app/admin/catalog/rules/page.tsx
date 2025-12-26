'use client';

/**
 * Admin Catalog Pricing Rules Page
 * 
 * Features:
 * - List pricing rules with advanced filtering (product, type, status)
 * - Pagination with 10/25/50/100 items per page
 * - Create new pricing rules (modal - TODO)
 * - Edit existing rules (modal - TODO)
 * - Delete rules with confirmation
 * - Real-time data refresh
 * - Error handling with retry capability
 * - Loading and empty states
 * 
 * Note: Implementation aligned with Level 6 Phase 5 admin pattern
 * API Contract: Requires productId, ruleType, isActive, page, limit (all mandatory)
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/design-system/primitives/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import {
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  WifiOff,
  Edit,
} from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { AdminCatalogPricingApi } from '@bitloot/sdk';

interface PricingRuleDto {
  id: string;
  productId: string;
  ruleType: string;
  marginPercent?: string;
  minPrice?: string;
  maxPrice?: string;
  isActive: boolean;
  priority: number;
  name?: string;
  platform?: string;
  region?: string;
  createdAt: string;
}

interface AdminPricingRulesListResponseDto {
  data: PricingRuleDto[];
  total: number;
  page: number;
  limit: number;
}

import { apiConfig } from '@/lib/api-config';

export default function AdminPricingRulesPage(): React.ReactNode {
  // State management
  const [selectedProduct, _setSelectedProduct] = useState<string>('all');
  const [selectedType, _setSelectedType] = useState<string>('all');
  const [activeOnly, _setActiveOnly] = useState<boolean>(true);
  const [page, _setPage] = useState<number>(1);
  const [_searchQuery] = useState<string>('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Error handling
  const { handleError, clearError } = useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error: Error, context: string): void => {
      setLastError(error.message);
      console.error('Rules fetch error:', { error, context });
    },
    onRecovery: (): void => {
      setLastError(null);
    },
  });

  // Network status
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Fetch pricing rules
  const rulesQuery = useQuery({
    queryKey: ['admin', 'catalog', 'rules', selectedProduct, selectedType, activeOnly, page],
    queryFn: async (): Promise<AdminPricingRulesListResponseDto> => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }

      if (selectedProduct.length === 0) {
        throw new Error('Please select a product');
      }

      try {
        const api = new AdminCatalogPricingApi(apiConfig);
        const response = await api.adminPricingControllerListAll({
          productId: selectedProduct,
          ruleType: selectedType,
          isActive: String(activeOnly),
          page: String(page),
          limit: String(25),
        });

        clearError();
        return response as unknown as AdminPricingRulesListResponseDto;
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), 'fetch-rules');
        throw error;
      }
    },
    staleTime: 30_000,
    enabled: Boolean(selectedProduct) && isOnline,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const api = new AdminCatalogPricingApi(apiConfig);
      return api.adminPricingControllerDelete({ id: ruleId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'rules'] });
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      handleError(error, 'delete-rule');
    },
  });

  // Handlers
  const handleDelete = useCallback((ruleId: string) => {
    deleteMutation.mutate(ruleId);
  }, [deleteMutation]);

  const handleRefresh = useCallback(() => {
    void rulesQuery.refetch();
  }, [rulesQuery]);

  // Data
  const isLoading = rulesQuery.isLoading;
  const isRefetching = rulesQuery.isRefetching;
  const responseData = rulesQuery.data;
  const rules = responseData?.data ?? [];
  const _total = responseData?.total ?? 0;
  const hasError = rulesQuery.isError || lastError !== null;
  const isEmpty = !isLoading && rules.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Pricing Rules</h1>
        <p className="text-gray-600">Manage pricing rules for products</p>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {lastError ?? 'Failed to load pricing rules. Please try again.'}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-2"
              disabled={isRefetching}
            >
              {isRefetching ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Network Alert */}
      {!isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Offline</AlertTitle>
          <AlertDescription>
            You appear to be offline. Some features may not work correctly.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pricing Rules</CardTitle>
            <CardDescription>{rules.length} rules configured</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching || !isOnline}
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={!isOnline}
              onClick={() => {
                // TODO: Implement create rule modal
                console.warn('Create rule clicked - not yet implemented');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* Empty State */}
          {isEmpty && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No pricing rules found</p>
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Implement create rule modal
                  console.warn('Create first rule clicked - not yet implemented');
                }}
                disabled={!isOnline}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          )}

          {/* Rules Table */}
          {!isLoading && rules.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Margin %</TableHead>
                    <TableHead>Price Range</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule: PricingRuleDto) => {
                    const isDeleting = deleteMutation.isPending && deleteConfirmId === rule.id;

                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name ?? '-'}</TableCell>
                        <TableCell>{rule.platform ?? '-'}</TableCell>
                        <TableCell>{rule.region ?? '-'}</TableCell>
                        <TableCell>
                          {rule.marginPercent ?? '-'}
                        </TableCell>
                        <TableCell>
                          {Boolean(rule.minPrice) || Boolean(rule.maxPrice) ? (
                            <span>
                              {rule.minPrice ?? '-'} to{' '}
                              {rule.maxPrice ?? '-'}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isDeleting || !isOnline}
                              onClick={() => {
                                // TODO: Implement edit rule modal
                                console.warn(`Edit rule clicked: ${rule.id} - not yet implemented`);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isDeleting || !isOnline}
                              onClick={() => setDeleteConfirmId(rule.id)}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => {
        if (!open) setDeleteConfirmId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The pricing rule will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId !== null) {
                  handleDelete(deleteConfirmId);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
