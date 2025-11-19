# Level 6 — Comprehensive Testing Roadmap

**Status:** 🟡 In Progress (333/450+ tests passing)  
**Date:** November 15, 2025  
**Phase:** 6 of 8 Testing Tasks  
**Quality Gate:** All 5 gates passing (Type ✅, Lint ✅, Format ✅, Test ✅, Build ✅)

---

## 📊 Current Test Coverage Summary

### Existing Tests (4 Files, 333 Total Tests Passing)

| Test File | Purpose | Tests | Lines | Status |
|-----------|---------|-------|-------|--------|
| **pricing-engine.spec.ts** | Core pricing computation logic | ~15+ | 190 | ✅ |
| **pricing.service.spec.ts** | Pricing service (rule selection, application) | ~12+ | 150+ | ✅ |
| **catalog.service.spec.ts** | CatalogService (upsert, reprice workflows) | ~18+ | 343 | ✅ |
| **catalog.controller.spec.ts** | Public API endpoints (GET /catalog/products) | ~30+ | 595 | ✅ |
| **Backend Total** | | ~332 | | ✅ |
| **Frontend Total** | 1 placeholder test in apps/web | ~1 | | ✅ |
| **GRAND TOTAL** | All workspaces | **333** | **1,278+** | ✅ |

### Test Framework

- **Backend:** Vitest (JavaScript/TypeScript test runner)
- **Frontend:** Jest or Vitest (likely)
- **Pattern:** Module-specific `__tests__/` directories
- **Naming:** `{component}.spec.ts` or `{component}.test.tsx`
- **Mocking:** Vitest `vi.mock()` for dependencies
- **Testing Library:** React Testing Library (for frontend)

---

## 🎯 Tests to Create (120+ Additional Tests Needed)

### Phase 6a: Missing Admin Controller Tests (40-50 Tests)

#### 1. **admin-products.controller.spec.ts** (15-20 Tests)

**File Location:** `apps/api/src/modules/catalog/__tests__/admin-products.controller.spec.ts`

**Purpose:** Test CRUD endpoints for product management with admin authorization

```typescript
describe('AdminProductsController', () => {
  // Tests for protected endpoints
  describe('Authorization', () => {
    it('should require JWT authentication');
    it('should require admin role (403 for non-admin)');
    it('should accept valid bearer token');
    it('should reject expired tokens');
    it('should reject invalid signatures');
  });

  describe('GET /admin/catalog/products', () => {
    it('should list all products with pagination');
    it('should support limit parameter (10, 25, 50, 100)');
    it('should support offset for pagination');
    it('should sort by field (created_at, title, platform)');
    it('should filter by category');
    it('should filter by platform');
    it('should support search query (title, external_id)');
    it('should return 401 if not authenticated');
  });

  describe('GET /admin/catalog/products/:id', () => {
    it('should return product detail with offers');
    it('should return pricing rules applied');
    it('should return 404 for non-existent product');
    it('should return 401 if not authenticated');
  });

  describe('PATCH /admin/catalog/products/:id', () => {
    it('should update product fields (title, description)');
    it('should validate input (title required, max 255 chars)');
    it('should return 404 for non-existent product');
    it('should return 400 for invalid payload');
  });

  describe('POST /admin/catalog/products/:id/publish', () => {
    it('should set product.is_published = true');
    it('should enqueue indexing job');
    it('should return 400 if no offers available');
    it('should update published_at timestamp');
  });

  describe('POST /admin/catalog/products/:id/unpublish', () => {
    it('should set product.is_published = false');
    it('should remove from catalog search');
    it('should return 200 OK');
  });

  describe('DELETE /admin/catalog/products/:id', () => {
    it('should soft-delete product (set deleted_at)');
    it('should be recoverable');
    it('should return 204 No Content');
  });
});
```

**Expected Outcome:** 15-20 new passing tests

---

#### 2. **admin-pricing.controller.spec.ts** (12-15 Tests)

**File Location:** `apps/api/src/modules/catalog/__tests__/admin-pricing.controller.spec.ts`

**Purpose:** Test pricing rules CRUD with authorization and validation

```typescript
describe('AdminPricingController', () => {
  describe('GET /admin/catalog/pricing-rules', () => {
    it('should list all pricing rules');
    it('should support pagination (limit, offset)');
    it('should filter by scope (global, category, region)');
    it('should filter by status (active, inactive)');
    it('should require admin role');
  });

  describe('GET /admin/catalog/pricing-rules/:id', () => {
    it('should return rule detail');
    it('should include usage count');
    it('should return 404 for non-existent rule');
  });

  describe('POST /admin/catalog/pricing-rules', () => {
    it('should create new pricing rule');
    it('should validate margin_pct (required, numeric)');
    it('should validate floor_cents (optional, >= 0)');
    it('should validate cap_cents (optional, > margin)');
    it('should validate scope (global, category, region)');
    it('should return 400 for invalid input');
    it('should enqueue repricing job after creation');
  });

  describe('PATCH /admin/catalog/pricing-rules/:id', () => {
    it('should update rule fields');
    it('should validate updated fields');
    it('should enqueue repricing job');
  });

  describe('DELETE /admin/catalog/pricing-rules/:id', () => {
    it('should soft-delete rule');
    it('should revert affected products to previous price');
  });
});
```

**Expected Outcome:** 12-15 new passing tests

---

#### 3. **admin-sync.controller.spec.ts** (8-10 Tests)

**File Location:** `apps/api/src/modules/catalog/__tests__/admin-sync.controller.spec.ts`

**Purpose:** Test Kinguin catalog sync trigger and status endpoints

```typescript
describe('AdminSyncController', () => {
  describe('POST /admin/catalog/sync', () => {
    it('should enqueue sync job to BullMQ');
    it('should return 202 Accepted with jobId');
    it('should prevent concurrent syncs (return 409 if running)');
    it('should require admin role');
    it('should accept optional filters (platform, region)');
    it('should set sync_started_at timestamp');
  });

  describe('GET /admin/catalog/sync-status/:jobId', () => {
    it('should return job status (queued, running, completed)');
    it('should return processed/total counts');
    it('should return 404 for non-existent job');
    it('should include ETA for running jobs');
  });

  describe('GET /admin/catalog/sync-status', () => {
    it('should return status of most recent sync');
    it('should return last_sync_at timestamp');
  });
});
```

**Expected Outcome:** 8-10 new passing tests

---

#### 4. **admin-reprice.controller.spec.ts** (8-10 Tests)

**File Location:** `apps/api/src/modules/catalog/__tests__/admin-reprice.controller.spec.ts`

**Purpose:** Test repricing job operations

```typescript
describe('AdminRepriceController', () => {
  describe('POST /admin/catalog/reprice', () => {
    it('should enqueue reprice job with product IDs');
    it('should accept optional rule_id filter');
    it('should return 202 Accepted with jobId');
    it('should validate product IDs exist');
    it('should require admin role');
    it('should support batching (max 1000 products)');
  });

  describe('GET /admin/catalog/reprice/status/:jobId', () => {
    it('should return reprice job status');
    it('should include updated count');
  });

  describe('POST /admin/catalog/reprice/cancel/:jobId', () => {
    it('should cancel running reprice job');
    it('should rollback partial updates');
  });
});
```

**Expected Outcome:** 8-10 new passing tests

---

### Phase 6b: Missing Integration Tests (25-35 Tests)

#### 5. **kinguin-catalog.client.spec.ts** (10-12 Tests)

**File Location:** `apps/api/src/modules/catalog/__tests__/kinguin-catalog.client.spec.ts`

**Purpose:** Test external Kinguin API client integration

```typescript
describe('KinguinCatalogClient', () => {
  describe('fetchPage', () => {
    it('should fetch paginated offers from Kinguin API');
    it('should handle pagination (page, size parameters)');
    it('should parse response correctly');
    it('should throw error on 401 (invalid API key)');
    it('should throw error on 429 (rate limited)');
    it('should retry on 503 (service unavailable)');
    it('should handle timeout (> 30s)');
    it('should validate response schema');
    it('should map offer objects to internal types');
    it('should handle empty results (last page)');
    it('should support filtering by category');
    it('should support filtering by platform');
  });

  describe('Error Handling', () => {
    it('should log API errors with context');
    it('should include retry count in error');
  });
});
```

**Expected Outcome:** 10-12 new passing tests

---

#### 6. **catalog.processor.spec.ts** (15-20 Tests)

**File Location:** `apps/api/src/modules/catalog/__tests__/catalog.processor.spec.ts`

**Purpose:** Test BullMQ worker processors for sync and reprice jobs

```typescript
describe('CatalogProcessor', () => {
  describe('syncProducts Job', () => {
    it('should process sync job from queue');
    it('should fetch products from Kinguin API');
    it('should upsert products to database');
    it('should handle job failure and retry');
    it('should emit progress events');
    it('should handle partial failures');
    it('should be idempotent (safe to retry)');
    it('should handle empty API responses');
    it('should update last_synced_at timestamp');
    it('should track sync statistics (added, updated, failed)');
  });

  describe('repriceProducts Job', () => {
    it('should apply pricing rules to products');
    it('should update prices in database');
    it('should emit progress events');
    it('should handle rule deletion during job');
    it('should rollback on error');
    it('should compute new prices correctly');
    it('should log price changes');
  });

  describe('Job Failure Scenarios', () => {
    it('should move to DLQ after max retries');
    it('should log error details');
    it('should include context in error message');
  });

  describe('Idempotency', () => {
    it('should produce same result on retry');
    it('should not create duplicate products');
  });
});
```

**Expected Outcome:** 15-20 new passing tests

---

### Phase 6c: Frontend Component Tests (45-55 Tests)

#### 7. **products/page.spec.tsx** (20-25 Tests)

**File Location:** `apps/web/src/app/admin/catalog/products/__tests__/page.spec.tsx`

**Purpose:** Test admin products dashboard page

```typescript
describe('Admin Catalog - Products Page', () => {
  describe('Page Rendering', () => {
    it('should render products table');
    it('should show loading state initially');
    it('should display column headers (title, platform, category, price)');
    it('should require admin authentication');
    it('should redirect non-admins to /login');
  });

  describe('Data Fetching', () => {
    it('should fetch products via SDK on mount');
    it('should handle API errors gracefully');
    it('should retry on network error');
    it('should show empty state if no products');
  });

  describe('Filtering', () => {
    it('should filter by search query');
    it('should filter by category (dropdown)');
    it('should filter by platform (checkbox)');
    it('should filter by region (dropdown)');
    it('should apply multiple filters');
    it('should clear all filters');
  });

  describe('Pagination', () => {
    it('should display page controls');
    it('should load next page on pagination click');
    it('should show total count');
    it('should handle page size change (10/25/50/100)');
  });

  describe('Actions', () => {
    it('should publish product via toggle');
    it('should unpublish product via toggle');
    it('should show publish confirmation');
    it('should disable publish if no offers');
    it('should show loading state during action');
    it('should display success toast');
    it('should display error message on failure');
  });

  describe('Sorting', () => {
    it('should sort by title (A-Z, Z-A)');
    it('should sort by created_at (newest, oldest)');
    it('should sort by price (low-high, high-low)');
  });
});
```

**Expected Outcome:** 20-25 new passing tests

---

#### 8. **rules/page.spec.tsx** (15-20 Tests)

**File Location:** `apps/web/src/app/admin/catalog/rules/__tests__/page.spec.tsx`

**Purpose:** Test pricing rules editor page

```typescript
describe('Admin Catalog - Rules Page', () => {
  describe('Page Rendering', () => {
    it('should render rules table');
    it('should show "Create Rule" button');
    it('should display rule columns (scope, margin, floor, cap)');
  });

  describe('Rules List', () => {
    it('should fetch and display rules via SDK');
    it('should handle empty state');
    it('should support pagination');
    it('should filter by scope (global, category, region)');
  });

  describe('Create Rule Form', () => {
    it('should open create form modal');
    it('should require scope selection');
    it('should require margin percentage');
    it('should validate margin is numeric');
    it('should validate floor >= 0');
    it('should validate cap > margin');
    it('should show form validation errors');
    it('should submit form via SDK');
    it('should display success message');
  });

  describe('Edit Rule', () => {
    it('should open edit form for existing rule');
    it('should pre-fill form with current values');
    it('should update rule via SDK');
  });

  describe('Delete Rule', () => {
    it('should show delete confirmation');
    it('should delete rule via SDK');
    it('should display success message');
  });
});
```

**Expected Outcome:** 15-20 new passing tests

---

#### 9. **sync/page.spec.tsx** (10-15 Tests)

**File Location:** `apps/web/src/app/admin/catalog/sync/__tests__/page.spec.tsx`

**Purpose:** Test Kinguin sync controls and status page

```typescript
describe('Admin Catalog - Sync Page', () => {
  describe('Page Rendering', () => {
    it('should display "Run Sync Now" button');
    it('should show last sync timestamp');
    it('should display sync status indicator');
  });

  describe('Sync Trigger', () => {
    it('should trigger sync on button click');
    it('should show loading state during sync');
    it('should disable button while syncing');
    it('should display jobId after triggering');
  });

  describe('Status Polling', () => {
    it('should poll job status every 2 seconds');
    it('should update progress display');
    it('should show processed/total counts');
    it('should show ETA time remaining');
    it('should stop polling when job completes');
  });

  describe('Sync Results', () => {
    it('should display added count');
    it('should display updated count');
    it('should display error count');
    it('should show completion timestamp');
  });

  describe('Error Handling', () => {
    it('should show error if sync fails');
    it('should allow retry after error');
    it('should display error details in tooltip');
  });
});
```

**Expected Outcome:** 10-15 new passing tests

---

### Phase 6d: E2E & Integration Tests (15-20 Tests)

#### 10. **E2E Full Workflow Test** (15-20 Tests)

**File Location:** `apps/api/src/modules/catalog/__tests__/e2e-workflow.spec.ts`

**Purpose:** Test complete catalog workflow end-to-end

```typescript
describe('Catalog E2E - Full Workflow', () => {
  describe('Workflow: Sync → Publish → List → Checkout', () => {
    it('should sync products from Kinguin API');
    it('should upsert products to database');
    it('should create product offers');
    it('should apply pricing rules (margin, floor, cap)');
    it('should publish products');
    it('should list published products via public API');
    it('should find product by slug');
    it('should calculate correct retail price');
    it('should add product to order');
    it('should handle out-of-stock gracefully');
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent sync + reprice');
    it('should handle concurrent publishes');
    it('should maintain data consistency');
  });

  describe('Data Integrity', () => {
    it('should not create duplicate products on retry');
    it('should maintain price history');
    it('should track all state changes in audit log');
  });

  describe('Performance', () => {
    it('should sync 1000 products in < 30s');
    it('should reprice 1000 products in < 15s');
    it('should list 100 products in < 500ms');
  });
});
```

**Expected Outcome:** 15-20 new passing tests

---

## 📈 Test Count Breakdown

| Category | Current | Additional | Total | Status |
|----------|---------|------------|-------|--------|
| **Pricing Logic** | 15+ | - | 15+ | ✅ |
| **Service Layer** | 18+ | - | 18+ | ✅ |
| **Public API** | 30+ | - | 30+ | ✅ |
| **Admin Controllers** | 0 | 40-50 | 40-50 | 🟡 |
| **Integration** | 0 | 25-35 | 25-35 | 🟡 |
| **Frontend Components** | 1 | 45-55 | 45-55 | 🟡 |
| **E2E Tests** | 0 | 15-20 | 15-20 | 🟡 |
| **TOTAL** | **333** | **120-180** | **450-520** | 🎯 |

---

## ⚡ Implementation Priority

### Tier 1 (Critical Path - Must Do First)

1. ✅ **pricing-engine.spec.ts** — Already done
2. ✅ **pricing.service.spec.ts** — Already done
3. ✅ **catalog.service.spec.ts** — Already done
4. ✅ **catalog.controller.spec.ts** — Already done
5. 🟡 **admin-products.controller.spec.ts** (15-20 tests)
   - Blocks: Admin UI functionality
   - Prevents: Integration testing
6. 🟡 **kinguin-catalog.client.spec.ts** (10-12 tests)
   - Blocks: Sync integration validation
   - Prevents: End-to-end testing

### Tier 2 (High Value)

7. 🟡 **admin-pricing.controller.spec.ts** (12-15 tests)
8. 🟡 **products/page.spec.tsx** (20-25 tests)
9. 🟡 **catalog.processor.spec.ts** (15-20 tests)

### Tier 3 (Important)

10. 🟡 **admin-sync.controller.spec.ts** (8-10 tests)
11. 🟡 **rules/page.spec.tsx** (15-20 tests)
12. 🟡 **e2e-workflow.spec.ts** (15-20 tests)

### Tier 4 (Final Polish)

13. 🟡 **admin-reprice.controller.spec.ts** (8-10 tests)
14. 🟡 **sync/page.spec.tsx** (10-15 tests)

---

## 🚀 Execution Plan

### Step 1: Admin Controllers (Recommended: 2-3 hours)

**Command to run existing tests first:**
```bash
npm run test -- admin-products.controller  # When ready (not yet created)
```

**Create in this order:**
1. `admin-products.controller.spec.ts` (15-20 tests)
2. `admin-pricing.controller.spec.ts` (12-15 tests)
3. `admin-sync.controller.spec.ts` (8-10 tests)
4. `admin-reprice.controller.spec.ts` (8-10 tests)

**Outcome:** +40-50 tests, all admin endpoints validated

### Step 2: Integration Tests (1-2 hours)

1. `kinguin-catalog.client.spec.ts` (10-12 tests)
2. `catalog.processor.spec.ts` (15-20 tests)

**Outcome:** +25-35 tests, full workflow validated

### Step 3: Frontend Components (2-3 hours)

1. `products/page.spec.tsx` (20-25 tests)
2. `rules/page.spec.tsx` (15-20 tests)
3. `sync/page.spec.tsx` (10-15 tests)

**Outcome:** +45-55 tests, all UI pages validated

### Step 4: E2E Testing (1 hour)

1. `e2e-workflow.spec.ts` (15-20 tests)

**Outcome:** +15-20 tests, complete workflows validated

### Step 5: Full Validation (30 min)

```bash
npm run quality:full  # Validate all 5 gates

# Expected output:
# ✅ npm run type-check — 0 errors
# ✅ npm run lint — 0 violations
# ✅ npm run format — 100% compliant
# ✅ npm run test — 450-520 tests passing
# ✅ npm run build — all workspaces compile
```

---

## 📝 Quality Assurance Checklist

### Before Creating Each Test File

- [ ] Review existing test patterns in catalog module
- [ ] Use Vitest mocking (`vi.mock()`) for dependencies
- [ ] Use TestingModule for NestJS tests
- [ ] Mock external APIs (Kinguin client, repositories)
- [ ] Mock BullMQ queues for job tests
- [ ] Use React Testing Library for component tests
- [ ] Mock SDK calls for frontend tests
- [ ] Add @ApiResponse decorators if creating new endpoints

### During Test Creation

- [ ] Write descriptive test names (what it does, what's expected)
- [ ] Group related tests in `describe` blocks
- [ ] Mock external dependencies (never call real APIs)
- [ ] Test both happy path and error cases
- [ ] Include authorization tests (JWT, role checks)
- [ ] Include validation tests (request/response DTOs)
- [ ] Add comments explaining complex test setup

### After Creating Each Test File

- [ ] Run: `npm run test -- test-file.spec`
- [ ] Verify: All tests pass (0 failures)
- [ ] Verify: No TypeScript errors
- [ ] Verify: No ESLint violations
- [ ] Add test to this roadmap with ✅ status

---

## 🎯 Success Criteria

### For Phase 6 Completion (100%)

- ✅ All 5 quality gates passing
- ✅ 450-520 total tests (from current 333)
- ✅ 0 TypeScript errors
- ✅ 0 ESLint violations
- ✅ 100% test pass rate
- ✅ All endpoints covered (public + admin)
- ✅ All workflows validated (sync, reprice, publish)
- ✅ All admin pages tested (products, rules, sync)
- ✅ All error scenarios covered

### Documentation Requirements

- [ ] Create `LEVEL_6_TESTING_COMPLETE.md` with test counts
- [ ] List all new test files created (14+ files)
- [ ] Document test organization and patterns
- [ ] Include examples of test structure
- [ ] Create completion checklist

---

## 📞 Testing Patterns Reference

### NestJS Controller Test Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductsController } from '../admin-products.controller';
import { CatalogService } from '../catalog.service';

describe('AdminProductsController', () => {
  let controller: AdminProductsController;
  let service: CatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductsController],
      providers: [
        {
          provide: CatalogService,
          useValue: {
            findProducts: vi.fn(),
            updateProduct: vi.fn(),
            // Mock other methods
          },
        },
      ],
    }).compile();

    controller = module.get(AdminProductsController);
    service = module.get(CatalogService);
  });

  it('should get products', async () => {
    const mockProducts = [{ id: '1', title: 'Game' }];
    vi.spyOn(service, 'findProducts').mockResolvedValue(mockProducts);

    const result = await controller.getProducts({ limit: 10 });
    expect(result).toEqual(mockProducts);
  });
});
```

### React Component Test Pattern

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductsPage } from './page';

describe('Products Page', () => {
  it('should render products table', async () => {
    render(<ProductsPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('should call SDK on filter change', async () => {
    render(<ProductsPage />);
    
    const filterInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(filterInput, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(mockSdk.getProducts).toHaveBeenCalledWith({ q: 'test' });
    });
  });
});
```

---

## ✅ Current Status

**What We Have:**
- ✅ 4 test files with comprehensive coverage of core logic
- ✅ 333 tests passing with 0 failures
- ✅ All quality gates validated
- ✅ Solid test patterns established

**What's Missing:**
- 🟡 40-50 admin controller tests
- 🟡 25-35 integration/processor tests
- 🟡 45-55 frontend component tests
- 🟡 15-20 E2E workflow tests

**Total Remaining:** 120-180 tests across 10+ new files

**Estimated Time:** 6-8 hours of focused development

**Next Action:** Create `admin-products.controller.spec.ts` with 15-20 tests covering CRUD + auth

---

**Document Version:** 1.0  
**Last Updated:** November 15, 2025  
**Next Phase:** Begin implementing Tier 1 tests (admin controllers)
