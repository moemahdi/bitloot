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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/design-system/primitives/dialog';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { Switch } from '@/design-system/primitives/switch';
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

type RuleType = 'margin_percent' | 'fixed_markup' | 'floor_cap' | 'dynamic_adjust';

interface CreateRuleFormData {
  productId: string;
  ruleType: RuleType;
  marginPercent: string;
  fixedMarkupMinor: string;
  floorMinor: string;
  capMinor: string;
  priority: string;
  isActive: boolean;
}

const initialFormData: CreateRuleFormData = {
  productId: '',
  ruleType: 'margin_percent',
  marginPercent: '25',
  fixedMarkupMinor: '',
  floorMinor: '',
  capMinor: '',
  priority: '0',
  isActive: true,
};

interface PricingRuleDto {
  id: string;
  productId: string | null;
  ruleType: string;
  marginPercent?: string | null;
  fixedMarkupMinor?: number | null;
  floorMinor?: number | null;
  capMinor?: number | null;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt?: string;
  // Product relation (if loaded)
  product?: {
    id: string;
    title: string;
  } | null;
}

// Helper functions for strict boolean expressions
function parseMoneyInput(val: string): number {
  const parsed = parseFloat(val);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCentsAsDollars(cents: string | undefined | null): string {
  if (cents === undefined || cents === null || cents === '') return '';
  const num = parseInt(cents, 10);
  if (Number.isNaN(num) || num === 0) return '';
  return (num / 100).toFixed(2);
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateRuleFormData>(initialFormData);
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateRuleFormData) => {
      const api = new AdminCatalogPricingApi(apiConfig);
      return api.adminPricingControllerCreate({
        createPricingRuleDto: {
          productId: data.productId.trim() !== '' ? data.productId.trim() : undefined,
          ruleType: data.ruleType,
          marginPercent: data.marginPercent !== '' ? data.marginPercent : undefined,
          fixedMarkupMinor: data.fixedMarkupMinor !== '' ? parseInt(data.fixedMarkupMinor, 10) : undefined,
          floorMinor: data.floorMinor !== '' ? parseInt(data.floorMinor, 10) : undefined,
          capMinor: data.capMinor !== '' ? parseInt(data.capMinor, 10) : undefined,
          priority: data.priority !== '' ? parseInt(data.priority, 10) : 0,
          isActive: data.isActive,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'rules'] });
      setIsCreateModalOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      handleError(error, 'create-rule');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateRuleFormData }) => {
      const api = new AdminCatalogPricingApi(apiConfig);
      return api.adminPricingControllerUpdate({
        id,
        updatePricingRuleDto: {
          ruleType: data.ruleType,
          marginPercent: data.marginPercent !== '' ? data.marginPercent : undefined,
          fixedMarkupMinor: data.fixedMarkupMinor !== '' ? parseInt(data.fixedMarkupMinor, 10) : undefined,
          floorMinor: data.floorMinor !== '' ? parseInt(data.floorMinor, 10) : undefined,
          capMinor: data.capMinor !== '' ? parseInt(data.capMinor, 10) : undefined,
          priority: data.priority !== '' ? parseInt(data.priority, 10) : 0,
          isActive: data.isActive,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'rules'] });
      setIsEditModalOpen(false);
      setEditingRuleId(null);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      handleError(error, 'update-rule');
    },
  });

  // Handlers
  const handleDelete = useCallback((ruleId: string) => {
    deleteMutation.mutate(ruleId);
  }, [deleteMutation]);

  const handleRefresh = useCallback(() => {
    void rulesQuery.refetch();
  }, [rulesQuery]);

  const handleFormChange = (field: keyof CreateRuleFormData, value: string | boolean): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSubmit = (): void => {
    // productId can be empty for global rules
    createMutation.mutate(formData);
  };

  const openCreateModal = (): void => {
    setFormData(initialFormData);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (rule: PricingRuleDto): void => {
    setFormData({
      productId: rule.productId ?? '',
      ruleType: (rule.ruleType as RuleType) ?? 'margin_percent',
      marginPercent: rule.marginPercent ?? '',
      fixedMarkupMinor: rule.fixedMarkupMinor != null ? String(rule.fixedMarkupMinor) : '',
      floorMinor: rule.floorMinor != null ? String(rule.floorMinor) : '',
      capMinor: rule.capMinor != null ? String(rule.capMinor) : '',
      priority: String(rule.priority ?? 0),
      isActive: rule.isActive,
    });
    setEditingRuleId(rule.id);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (): void => {
    if (editingRuleId !== null && editingRuleId !== '') {
      updateMutation.mutate({ id: editingRuleId, data: formData });
    }
  };

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
              onClick={openCreateModal}
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
                onClick={openCreateModal}
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
                    <TableHead>Scope</TableHead>
                    <TableHead>Rule Type</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Fixed Markup</TableHead>
                    <TableHead>Floor / Cap</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule: PricingRuleDto) => {
                    const isDeleting = deleteMutation.isPending && deleteConfirmId === rule.id;
                    const isGlobal = rule.productId == null || rule.productId === '';

                    // Format rule type for display
                    const ruleTypeLabels: Record<string, string> = {
                      margin_percent: 'Margin %',
                      fixed_markup: 'Fixed Markup',
                      floor_cap: 'Floor/Cap',
                      dynamic_adjust: 'Dynamic',
                    };

                    // Format currency display (convert from minor units to euros)
                    const formatCurrency = (minorAmount: number | null | undefined): string | null => {
                      if (minorAmount == null) return null;
                      return `€${(minorAmount / 100).toFixed(2)}`;
                    };

                    // Only show margin for margin_percent rules
                    const showMargin = rule.ruleType === 'margin_percent';
                    
                    // Only show fixed markup for fixed_markup rules
                    const showFixedMarkup = rule.ruleType === 'fixed_markup';
                    const fixedMarkupDisplay = showFixedMarkup && rule.fixedMarkupMinor != null 
                      ? `€${(rule.fixedMarkupMinor / 100).toFixed(2)}`
                      : null;

                    // Only show floor/cap for floor_cap or dynamic_adjust rules
                    const showFloorCap = rule.ruleType === 'floor_cap' || rule.ruleType === 'dynamic_adjust';
                    const floorDisplay = showFloorCap ? formatCurrency(rule.floorMinor) : null;
                    const capDisplay = showFloorCap ? formatCurrency(rule.capMinor) : null;
                    const hasFloorCap = floorDisplay !== null || capDisplay !== null;

                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          {isGlobal ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                              Global
                            </Badge>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-muted-foreground">Product</span>
                              <span className="text-sm font-medium truncate max-w-[150px]" title={rule.product?.title ?? rule.productId ?? ''}>
                                {rule.product?.title ?? (rule.productId != null && rule.productId !== '' ? rule.productId.slice(0, 8) + '...' : '-')}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ruleTypeLabels[rule.ruleType] ?? rule.ruleType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {showMargin && rule.marginPercent != null ? (
                            <span className="font-mono">{rule.marginPercent}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {fixedMarkupDisplay !== null ? (
                            <span className="font-mono">{fixedMarkupDisplay}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasFloorCap ? (
                            <span className="font-mono text-sm">
                              {floorDisplay ?? '-'} / {capDisplay ?? '-'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
                                openEditModal(rule);
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

      {/* Create Rule Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Pricing Rule</DialogTitle>
            <DialogDescription>
              Create a global rule (no Product ID) to apply to all products, or a product-specific rule to override the global default.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {/* Product ID */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="productId">Product ID (optional)</Label>
              <Input
                id="productId"
                placeholder="Leave empty for global rule"
                value={formData.productId}
                onChange={(e) => handleFormChange('productId', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Empty = applies to all products. Enter UUID to target a specific product.
              </p>
            </div>

            {/* Rule Type */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="ruleType">Rule Type *</Label>
              <Select
                value={formData.ruleType}
                onValueChange={(value) => handleFormChange('ruleType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rule type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="margin_percent">Margin Percent</SelectItem>
                  <SelectItem value="fixed_markup">Fixed Markup</SelectItem>
                  <SelectItem value="floor_cap">Floor/Cap Only</SelectItem>
                  <SelectItem value="dynamic_adjust">Dynamic Adjust</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.ruleType === 'margin_percent' && 'Add a percentage markup to the cost price.'}
                {formData.ruleType === 'fixed_markup' && 'Add a fixed dollar amount to the cost price.'}
                {formData.ruleType === 'floor_cap' && 'Only set minimum/maximum price bounds without markup.'}
                {formData.ruleType === 'dynamic_adjust' && 'Dynamically adjust margin based on market conditions.'}
              </p>
            </div>

            {/* Margin Percent - for margin_percent and dynamic_adjust types */}
            {(formData.ruleType === 'margin_percent' || formData.ruleType === 'dynamic_adjust') && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="marginPercent">Margin Percent (%)*</Label>
                <div className="relative">
                  <Input
                    id="marginPercent"
                    type="number"
                    step="0.01"
                    min="0"
                    max="500"
                    placeholder="e.g., 25"
                    value={formData.marginPercent}
                    onChange={(e) => handleFormChange('marginPercent', e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage added to cost. E.g., 25% on €10 cost = €12.50 retail.
                </p>
              </div>
            )}

            {/* Fixed Markup (for fixed_markup type) */}
            {formData.ruleType === 'fixed_markup' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="fixedMarkupMinor">Fixed Markup (€)*</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    id="fixedMarkupMinor"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 5.00"
                    value={formatCentsAsDollars(formData.fixedMarkupMinor)}
                    onChange={(e) => {
                      const dollars = parseMoneyInput(e.target.value);
                      handleFormChange('fixedMarkupMinor', String(Math.round(dollars * 100)));
                    }}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Fixed euro amount added to cost. E.g., €5 on €10 cost = €15 retail.
                </p>
              </div>
            )}

            {/* Floor/Cap - available for floor_cap, margin_percent, and dynamic_adjust */}
            {(formData.ruleType === 'floor_cap' || formData.ruleType === 'margin_percent' || formData.ruleType === 'dynamic_adjust') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="floorMinor">Floor Price {formData.ruleType === 'floor_cap' ? '*' : '(optional)'}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      id="floorMinor"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Min"
                      value={formatCentsAsDollars(formData.floorMinor)}
                      onChange={(e) => {
                        const dollars = parseMoneyInput(e.target.value);
                        handleFormChange('floorMinor', String(Math.round(dollars * 100)));
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="capMinor">Cap Price {formData.ruleType === 'floor_cap' ? '*' : '(optional)'}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      id="capMinor"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Max"
                      value={formatCentsAsDollars(formData.capMinor)}
                      onChange={(e) => {
                        const dollars = parseMoneyInput(e.target.value);
                        handleFormChange('capMinor', String(Math.round(dollars * 100)));
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">
                  {formData.ruleType === 'floor_cap' 
                    ? 'Minimum and maximum retail price bounds.'
                    : 'Optional: Set min/max price limits after margin is applied.'}
                </p>
              </div>
            )}

            {/* Priority */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                step="1"
                placeholder="Higher = more priority (default: 0)"
                value={formData.priority}
                onChange={(e) => handleFormChange('priority', e.target.value)}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleFormChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Rule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditModalOpen(false);
          setEditingRuleId(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pricing Rule</DialogTitle>
            <DialogDescription>
              Update the pricing rule configuration. Note: Product ID cannot be changed after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {/* Product ID (read-only for edit) */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="editProductId">Scope</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted">
                {formData.productId !== '' ? (
                  <>
                    <span className="text-sm">Product-specific:</span>
                    <span className="text-sm font-medium truncate">{formData.productId}</span>
                  </>
                ) : (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Global Rule
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Scope cannot be changed after creation.
              </p>
            </div>

            {/* Rule Type */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="editRuleType">Rule Type *</Label>
              <Select
                value={formData.ruleType}
                onValueChange={(value) => handleFormChange('ruleType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rule type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="margin_percent">Margin Percent</SelectItem>
                  <SelectItem value="fixed_markup">Fixed Markup</SelectItem>
                  <SelectItem value="floor_cap">Floor/Cap Only</SelectItem>
                  <SelectItem value="dynamic_adjust">Dynamic Adjust</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.ruleType === 'margin_percent' && 'Add a percentage markup to the cost price.'}
                {formData.ruleType === 'fixed_markup' && 'Add a fixed dollar amount to the cost price.'}
                {formData.ruleType === 'floor_cap' && 'Only set minimum/maximum price bounds without markup.'}
                {formData.ruleType === 'dynamic_adjust' && 'Dynamically adjust margin based on market conditions.'}
              </p>
            </div>

            {/* Margin Percent - for margin_percent and dynamic_adjust types */}
            {(formData.ruleType === 'margin_percent' || formData.ruleType === 'dynamic_adjust') && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="editMarginPercent">Margin Percent (%)*</Label>
                <div className="relative">
                  <Input
                    id="editMarginPercent"
                    type="number"
                    step="0.01"
                    min="0"
                    max="500"
                    placeholder="e.g., 25"
                    value={formData.marginPercent}
                    onChange={(e) => handleFormChange('marginPercent', e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage added to cost. E.g., 25% on €10 cost = €12.50 retail.
                </p>
              </div>
            )}

            {/* Fixed Markup (for fixed_markup type) */}
            {formData.ruleType === 'fixed_markup' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="editFixedMarkupMinor">Fixed Markup (€)*</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    id="editFixedMarkupMinor"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 5.00"
                    value={formatCentsAsDollars(formData.fixedMarkupMinor)}
                    onChange={(e) => {
                      const dollars = parseMoneyInput(e.target.value);
                      handleFormChange('fixedMarkupMinor', String(Math.round(dollars * 100)));
                    }}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Fixed euro amount added to cost. E.g., €5 on €10 cost = €15 retail.
                </p>
              </div>
            )}

            {/* Floor/Cap - available for floor_cap, margin_percent, and dynamic_adjust */}
            {(formData.ruleType === 'floor_cap' || formData.ruleType === 'margin_percent' || formData.ruleType === 'dynamic_adjust') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="editFloorMinor">Floor Price {formData.ruleType === 'floor_cap' ? '*' : '(optional)'}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      id="editFloorMinor"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Min"
                      value={formatCentsAsDollars(formData.floorMinor)}
                      onChange={(e) => {
                        const dollars = parseMoneyInput(e.target.value);
                        handleFormChange('floorMinor', String(Math.round(dollars * 100)));
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="editCapMinor">Cap Price {formData.ruleType === 'floor_cap' ? '*' : '(optional)'}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      id="editCapMinor"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Max"
                      value={formatCentsAsDollars(formData.capMinor)}
                      onChange={(e) => {
                        const dollars = parseMoneyInput(e.target.value);
                        handleFormChange('capMinor', String(Math.round(dollars * 100)));
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">
                  {formData.ruleType === 'floor_cap' 
                    ? 'Minimum and maximum retail price bounds.'
                    : 'Optional: Set min/max price limits after margin is applied.'}
                </p>
              </div>
            )}

            {/* Priority */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="editPriority">Priority</Label>
              <Input
                id="editPriority"
                type="number"
                step="1"
                placeholder="Higher = more priority (default: 0)"
                value={formData.priority}
                onChange={(e) => handleFormChange('priority', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Higher priority rules override lower ones. Default is 0.
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-3 p-3 rounded-md border">
              <Switch
                id="editIsActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleFormChange('isActive', checked)}
              />
              <div className="flex flex-col">
                <Label htmlFor="editIsActive" className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.isActive ? 'Rule is being applied to pricing.' : 'Rule is disabled and not affecting prices.'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingRuleId(null);
              }}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
