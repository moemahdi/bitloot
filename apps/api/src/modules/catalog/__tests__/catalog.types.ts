import { vi } from 'vitest';

/**
 * Type-safe mock interfaces for catalog tests
 * Ensures TypeScript strict mode compliance
 */

export type MockFn = ReturnType<typeof vi.fn>;

export interface CatalogServiceMocks {
  listProducts: MockFn;
  getProductDetail: MockFn;
  updateProduct: MockFn;
  publishProduct: MockFn;
  unpublishProduct: MockFn;
  deleteProduct: MockFn;
  listPricingRules: MockFn;
  getPricingRuleDetail: MockFn;
  createPricingRule: MockFn;
  updatePricingRule: MockFn;
  deletePricingRule: MockFn;
  triggerReprice: MockFn;
  getRepriceStatus: MockFn;
  cancelReprice: MockFn;
  triggerSync: MockFn;
  getSyncStatus: MockFn;
  getLatestSyncStatus: MockFn;
}

export function createMockCatalogService(): CatalogServiceMocks {
  return {
    listProducts: vi.fn(),
    getProductDetail: vi.fn(),
    updateProduct: vi.fn(),
    publishProduct: vi.fn(),
    unpublishProduct: vi.fn(),
    deleteProduct: vi.fn(),
    listPricingRules: vi.fn(),
    getPricingRuleDetail: vi.fn(),
    createPricingRule: vi.fn(),
    updatePricingRule: vi.fn(),
    deletePricingRule: vi.fn(),
    triggerReprice: vi.fn(),
    getRepriceStatus: vi.fn(),
    cancelReprice: vi.fn(),
    triggerSync: vi.fn(),
    getSyncStatus: vi.fn(),
    getLatestSyncStatus: vi.fn(),
  };
}

export interface KinguinServiceMocks {
  searchProducts: MockFn;
  getOffer: MockFn;
  getStockModels: MockFn;
}

export function createMockKinguinService(): KinguinServiceMocks {
  return {
    searchProducts: vi.fn(),
    getOffer: vi.fn(),
    getStockModels: vi.fn(),
  };
}

export interface CatalogProcessorMocks {
  handle: MockFn;
}

export function createMockCatalogProcessor(): CatalogProcessorMocks {
  return {
    handle: vi.fn(),
  };
}
