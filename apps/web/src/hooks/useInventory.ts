/**
 * Inventory Management Hooks
 *
 * TanStack Query hooks for managing product inventory
 * Used in admin catalog inventory management page
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminInventoryApi } from '@bitloot/sdk';
import type {
  AddInventoryItemDto,
  BulkImportInventoryDto,
  UpdateItemStatusDto,
  InventoryItemResponseDto,
  InventoryStatsDto,
  PaginatedInventoryDto,
  BulkImportResultDto,
  AdminInventoryControllerListItemsStatusEnum,
  AdminInventoryControllerListItemsSortByEnum,
  AdminInventoryControllerListItemsSortDirEnum,
} from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

// Query keys for cache management
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (productId: string, filters: InventoryFilters) =>
    [...inventoryKeys.lists(), productId, JSON.stringify(filters)] as const,
  stats: (productId: string) => [...inventoryKeys.all, 'stats', productId] as const,
  item: (productId: string, itemId: string) =>
    [...inventoryKeys.all, 'item', productId, itemId] as const,
};

// Filter parameters for listing inventory items
export interface InventoryFilters {
  status?: AdminInventoryControllerListItemsStatusEnum;
  supplier?: string;
  page?: number;
  limit?: number;
  sortBy?: AdminInventoryControllerListItemsSortByEnum;
  sortDir?: AdminInventoryControllerListItemsSortDirEnum;
}

/**
 * Hook to fetch inventory items for a product
 */
export function useInventoryItems(productId: string, filters: InventoryFilters = {}) {
  return useQuery<PaginatedInventoryDto>({
    queryKey: inventoryKeys.list(productId, filters),
    queryFn: async () => {
      const api = new AdminInventoryApi(apiConfig);
      return await api.adminInventoryControllerListItems({
        productId,
        status: filters.status,
        supplier: filters.supplier,
        page: filters.page ?? 1,
        limit: filters.limit ?? 25,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
      });
    },
    enabled: Boolean(productId),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to fetch inventory statistics for a product
 */
export function useInventoryStats(productId: string) {
  return useQuery<InventoryStatsDto>({
    queryKey: inventoryKeys.stats(productId),
    queryFn: async () => {
      const api = new AdminInventoryApi(apiConfig);
      return await api.adminInventoryControllerGetStats({ productId });
    },
    enabled: Boolean(productId),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to add a single item to inventory
 */
export function useAddInventoryItem(productId: string) {
  const queryClient = useQueryClient();

  return useMutation<InventoryItemResponseDto, Error, AddInventoryItemDto>({
    mutationFn: async (dto) => {
      const api = new AdminInventoryApi(apiConfig);
      return await api.adminInventoryControllerAddItem({
        productId,
        addInventoryItemDto: dto,
      });
    },
    onSuccess: () => {
      // Invalidate both items list and stats
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.stats(productId) });
    },
  });
}

/**
 * Hook to bulk import items to inventory
 */
export function useBulkImportInventory(productId: string) {
  const queryClient = useQueryClient();

  return useMutation<BulkImportResultDto, Error, BulkImportInventoryDto>({
    mutationFn: async (dto) => {
      const api = new AdminInventoryApi(apiConfig);
      return await api.adminInventoryControllerBulkImport({
        productId,
        bulkImportInventoryDto: dto,
      });
    },
    onSuccess: () => {
      // Invalidate both items list and stats
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.stats(productId) });
    },
  });
}

/**
 * Hook to delete an inventory item
 */
export function useDeleteInventoryItem(productId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (itemId) => {
      const api = new AdminInventoryApi(apiConfig);
      await api.adminInventoryControllerDeleteItem({
        productId,
        itemId,
      });
    },
    onSuccess: () => {
      // Invalidate both items list and stats
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.stats(productId) });
    },
  });
}

/**
 * Hook to update inventory item status
 */
export function useUpdateInventoryItemStatus(productId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    InventoryItemResponseDto,
    Error,
    { itemId: string; dto: UpdateItemStatusDto }
  >({
    mutationFn: async ({ itemId, dto }) => {
      const api = new AdminInventoryApi(apiConfig);
      return await api.adminInventoryControllerUpdateStatus({
        productId,
        itemId,
        updateItemStatusDto: dto,
      });
    },
    onSuccess: () => {
      // Invalidate both items list and stats
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.stats(productId) });
    },
  });
}
