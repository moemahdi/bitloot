# BitLoot Catalog Completion Plan

**Created:** January 27, 2026  
**Completed:** January 27, 2026  
**Status:** ✅ COMPLETE  
**Goal:** Complete the catalog system from admin management to customer-facing shopping experience

---

## 📋 Executive Summary

BitLoot's catalog system is **100% complete**. All phases have been implemented including category system simplification, admin UX improvements, customer catalog enhancements, and data cleanup. The full flow from **Kinguin Import → Admin Management → Customer Catalog** is now fully operational.

### Your 3 Product Categories
1. **Games** – Keys/Accounts (Steam, Epic, GOG, etc.)
2. **Software** – Windows, Office, Antivirus, etc.
3. **Subscriptions** – Game Pass, PS Plus, EA Play, etc.

---

## 🔍 Current State Analysis

### ✅ What's Working

| Component | Status | Notes |
|-----------|--------|-------|
| **Product Entity** | ✅ Complete | 50+ fields, Kinguin sync, hybrid fulfillment |
| **Kinguin Import** | ✅ Complete | Search + one-click import |
| **Kinguin Sync** | ✅ Complete | Price/stock updates for imported products |
| **Admin Products CRUD** | ✅ Complete | List, create, edit, publish/unpublish, delete |
| **Admin Pricing Rules** | ✅ Complete | Margin %, fixed markup, floor/cap |
| **Product Groups** | ✅ Complete | Group variants (editions, platforms) |
| **Public Catalog API** | ✅ Complete | `/catalog/products`, `/catalog/categories`, `/catalog/filters` |
| **Customer Catalog Page** | ✅ Complete | Search, filters, infinite scroll, pagination |
| **Product Detail Page** | ✅ Complete | Rich Kinguin data display |

### ✅ Problems Resolved

| Issue | Location | Resolution | Status |
|-------|----------|------------|--------|
| **Category Confusion** | Multiple places | Implemented `businessCategory` field with 4 types | ✅ FIXED |
| **CatalogFilters.tsx uses hardcoded genres** | `features/catalog/` | Replaced with BITLOOT_CATEGORIES | ✅ FIXED |
| **No category normalization** | Import flow | Auto-detection on Kinguin import | ✅ FIXED |
| **Admin Catalog Main Page** | `/admin/catalog` | Redesigned as dashboard overview | ✅ FIXED |
| **No bulk publish** | Admin Products | Added bulk publish/unpublish actions | ✅ FIXED |
| **Price display inconsistency** | Multiple pages | Standardized EUR display | ✅ FIXED |
| **Platform name inconsistency** | Multiple places | Created platform normalization utility | ✅ FIXED |

---

## ✅ Phase 1: Category System Simplification (COMPLETE)

### 1.1 Define Canonical Categories

**Goal:** Replace Kinguin genre-as-category with your 4 business categories.

```typescript
// New canonical categories for BitLoot
export const BITLOOT_CATEGORIES = [
  { id: 'games', label: 'Games', icon: 'Gamepad2', description: 'PC & Console game keys and accounts' },
  { id: 'software', label: 'Software', icon: 'Monitor', description: 'Windows, Office, antivirus & more' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'Clock', description: 'Game Pass, PS Plus, EA Play' },
] as const;

export type BitLootCategory = 'games' | 'software' | 'subscriptions';
```

### 1.2 Backend Changes

#### Task 1.2.1: Add `businessCategory` field to Product entity

**File:** `apps/api/src/modules/catalog/entities/product.entity.ts`

```typescript
// Add new field (keep existing 'category' for Kinguin genres)
@Column({ 
  type: 'varchar', 
  length: 50, 
  nullable: false,
  default: 'games' 
})
businessCategory!: 'games' | 'software' | 'subscriptions';
```

**Migration:** Create migration to add `businessCategory` column with default 'games'.

#### Task 1.2.2: Update Kinguin import to auto-detect category

**File:** `apps/api/src/modules/catalog/kinguin-catalog.client.ts`

```typescript
// Category detection based on Kinguin product data
function detectBusinessCategory(kinguinProduct: KinguinProductRaw): BitLootCategory {
  const name = kinguinProduct.name.toLowerCase();
  const genres = kinguinProduct.genres?.map(g => g.toLowerCase()) ?? [];
  
  // Subscriptions detection
  if (
    name.includes('game pass') ||
    name.includes('ps plus') ||
    name.includes('ea play') ||
    name.includes('ubisoft+') ||
    name.includes('subscription')
  ) {
    return 'subscriptions';
  }
  
  // Software detection
  if (
    name.includes('windows') ||
    name.includes('office') ||
    name.includes('antivirus') ||
    name.includes('vpn') ||
    genres.includes('software') ||
    genres.includes('application')
  ) {
    return 'software';
  }
  
  // Default to games
  return 'games';
}
```

#### Task 1.2.3: Update CatalogService.getCategories()

**File:** `apps/api/src/modules/catalog/catalog.service.ts`

Replace dynamic genre aggregation with your 3 business categories:

```typescript
async getCategories(): Promise<CategoriesResponseDto> {
  // Count products per business category
  const counts = await this.productRepo
    .createQueryBuilder('p')
    .select('p.businessCategory', 'category')
    .addSelect('COUNT(*)', 'count')
    .where('p.isPublished = true')
    .groupBy('p.businessCategory')
    .getRawMany();

  const categoryMap = new Map(counts.map(c => [c.category, parseInt(c.count, 10)]));

  return {
    categories: BITLOOT_CATEGORIES.map(cat => ({
      id: cat.id,
      label: cat.label,
      count: categoryMap.get(cat.id) ?? 0,
    })),
    totalProducts: counts.reduce((sum, c) => sum + parseInt(c.count, 10), 0),
  };
}
```

### 1.3 Frontend Changes

#### Task 1.3.1: Update CatalogFilters.tsx

**File:** `apps/web/src/features/catalog/components/CatalogFilters.tsx`

Replace hardcoded genres with your categories:

```typescript
const CATEGORIES = [
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'software', label: 'Software', icon: '💻' },
  { id: 'gift-cards', label: 'Gift Cards', icon: '🎁' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📅' },
];
```

#### Task 1.3.2: Update Customer Catalog Page category icons

**File:** `apps/web/src/app/(marketing)/catalog/page.tsx`

```typescript
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Sparkles,
  games: Gamepad2,
  software: Monitor,
  'gift-cards': Gift,
  subscriptions: Clock,
};
```

#### Task 1.3.3: Update Admin Create/Edit Product forms

Add `businessCategory` dropdown with your 4 options to:
- `apps/web/src/app/admin/catalog/products/new/page.tsx`
- `apps/web/src/app/admin/catalog/products/[id]/page.tsx`

---

## ✅ Phase 2: Admin Catalog UX Improvements (COMPLETE)

### 2.1 Simplify Admin Catalog Main Page

**File:** `apps/web/src/app/admin/catalog/page.tsx`

**Current:** Tabs with Products, Sync, Pricing Rules tables.  
**Problem:** Duplicates the dedicated subpages.

**Solution:** Convert to a **Dashboard Overview** with:
- Quick stats (total products, published, by category)
- Recent sync status
- Quick action buttons linking to subpages
- Activity feed (recent imports, price changes)

```tsx
// Simplified Admin Catalog Dashboard
export default function AdminCatalogPage() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Products" value={stats.total} icon={Package} />
        <StatsCard title="Published" value={stats.published} icon={CheckCircle} />
        <StatsCard title="Games" value={stats.games} icon={Gamepad2} />
        <StatsCard title="Gift Cards" value={stats.giftCards} icon={Gift} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction href="/admin/catalog/products" icon={Package} label="Manage Products" />
        <QuickAction href="/admin/catalog/import" icon={Crown} label="Import from Kinguin" />
        <QuickAction href="/admin/catalog/sync" icon={RefreshCw} label="Sync Prices" />
        <QuickAction href="/admin/catalog/rules" icon={DollarSign} label="Pricing Rules" />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {/* Last 10 imports, publishes, price changes */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.2 Add Bulk Actions to Admin Products Page

**File:** `apps/web/src/app/admin/catalog/products/page.tsx`

Already has bulk delete. Add:
- **Bulk Publish** – Publish all selected products
- **Bulk Unpublish** – Unpublish all selected products
- **Bulk Set Category** – Set business category for selected products

```typescript
// Add mutations
const bulkPublishMutation = useMutation({
  mutationFn: async (productIds: string[]) => {
    const api = new AdminCatalogProductsApi(apiConfig);
    return api.adminProductsControllerBulkPublish({ 
      bulkPublishDto: { ids: productIds } 
    });
  },
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'products'] });
    setSelectedProductIds(new Set());
  },
});
```

### 2.3 Improve Import Page UX

**File:** `apps/web/src/app/admin/catalog/import/page.tsx`

Add features:
1. **Import history** – Show recently imported products
2. **Bulk import mode** – Select multiple products, import all
3. **Category assignment on import** – Dropdown to set businessCategory before import
4. **Quick filters** – Filter Kinguin results by platform, price range

```tsx
// Add category selector above import button
<Select value={importCategory} onValueChange={setImportCategory}>
  <SelectTrigger>
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    {BITLOOT_CATEGORIES.map(cat => (
      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 2.4 Add "Genres" as Secondary Filter

Keep Kinguin genres (Action, RPG, etc.) as a secondary filter under the main category:

```typescript
// Filter hierarchy
- Business Category (games, software, gift-cards, subscriptions)
  - Genre (for games: Action, RPG, Strategy, etc.)
  - Platform (Steam, Epic, GOG, etc.)
  - Region (Global, Europe, NA, etc.)
  - Price Range
```

---

## ✅ Phase 3: Customer Catalog Enhancements (COMPLETE)

### 3.1 Category Landing Pages

Create dedicated landing pages for each category:

```
/catalog/games         → Pre-filtered to games
/catalog/software      → Pre-filtered to software
/catalog/gift-cards    → Pre-filtered to gift cards
/catalog/subscriptions → Pre-filtered to subscriptions
```

**Implementation:** Use the same catalog page with URL-based category preset.

### 3.2 Featured/Promoted Products Section

Add sections to catalog page:
- **Featured Products** – Admin-marked featured products
- **Best Sellers** – Based on order count (future)
- **New Arrivals** – Recently added products

Requires:
- Add `isFeatured` boolean to Product entity
- Add admin toggle to mark products as featured
- Query and display in catalog hero section

### 3.3 Quick Filters Bar

Replace the full sidebar with a horizontal quick filter bar on mobile:

```tsx
<div className="flex overflow-x-auto gap-2 pb-2 lg:hidden">
  {BITLOOT_CATEGORIES.map(cat => (
    <Button
      key={cat.id}
      variant={selectedCategory === cat.id ? 'default' : 'outline'}
      size="sm"
      onClick={() => setSelectedCategory(cat.id)}
    >
      {cat.label}
    </Button>
  ))}
</div>
```

### 3.4 Product Card Improvements

- Add **"Add to Cart"** button directly on card (hover state)
- Show **platform badge** (Steam, Epic, etc.)
- Show **stock indicator** (In Stock / Low Stock / Out of Stock)
- Show **discount badge** if originalPrice differs from price

---

## ✅ Phase 4: Data Consistency & Cleanup (COMPLETE)

### 4.1 Price Field Standardization

**Current State:** Prices stored as strings, some in EUR, some confusion with cents.

**Solution:**
- Ensure all prices are stored as `decimal(20, 8)` in EUR
- Frontend always displays EUR with € symbol
- Crypto conversion happens at checkout

### 4.2 Migrate Existing Products to businessCategory

Create a one-time migration script to set `businessCategory` for existing products:

```typescript
// Migration script
async function migrateBusinessCategories() {
  const products = await productRepo.find();
  
  for (const product of products) {
    product.businessCategory = detectBusinessCategory(product);
    await productRepo.save(product);
  }
}
```

### 4.3 Normalize Platform Names

Standardize platform names across the system:

```typescript
const PLATFORM_NORMALIZATION: Record<string, string> = {
  'steam': 'Steam',
  'STEAM': 'Steam',
  'epic': 'Epic Games',
  'Epic': 'Epic Games',
  'EPIC': 'Epic Games',
  'uplay': 'Ubisoft Connect',
  'Uplay': 'Ubisoft Connect',
  'origin': 'EA App',
  'Origin': 'EA App',
  // ... etc
};
```

---

## 📊 Implementation Checklist

### Phase 1: Category System ✅ COMPLETE
- [x] Add `businessCategory` column to Product entity
- [x] Create database migration (`1770000000000-AddBusinessCategory.ts`)
- [x] Update Kinguin import with category detection
- [x] Update CatalogService.getCategories()
- [x] Update CatalogFilters.tsx with BITLOOT_CATEGORIES
- [x] Update catalog page category icons (Gamepad2, Monitor, Gift, Clock)
- [x] Update admin product create/edit forms
- [x] Test full flow: Import → Categorize → Publish → View

### Phase 2: Admin UX ✅ COMPLETE
- [x] Redesign Admin Catalog main page as dashboard
- [x] Add bulk publish/unpublish to products page
- [x] Add category selector to import page
- [x] Add import history to import page
- [x] Keep genres as secondary filter (below category in filters)

### Phase 3: Customer Catalog ✅ COMPLETE
- [x] Create category landing page routes (`/catalog/[category]`)
- [x] Add featured products section
- [x] Add quick filters bar for mobile (horizontal scrollable)
- [x] Enhance product cards (stock status badges, hover overlay with Quick View + Add to Cart)
- [x] Test customer journey

### Phase 4: Data Cleanup ✅ COMPLETE
- [x] Run businessCategory migration on existing products
- [x] Standardize price display (EUR)
- [x] Normalize platform names (`1780000000000-NormalizePlatformNames.ts`)
- [x] Created `platform-normalizer.ts` utility (80+ variations → ~20 standardized names)
- [x] Final testing and polish

---

## 📁 Files to Modify

### Backend
| File | Changes |
|------|---------|
| `entities/product.entity.ts` | Add `businessCategory` field |
| `catalog.service.ts` | Update `getCategories()`, add category detection |
| `admin-products.controller.ts` | Add bulk publish/unpublish endpoints |
| `kinguin-catalog.client.ts` | Add category detection on import |
| `dto/product.dto.ts` | Add `businessCategory` to DTOs |

### Frontend - Admin
| File | Changes |
|------|---------|
| `/admin/catalog/page.tsx` | Redesign as dashboard |
| `/admin/catalog/products/page.tsx` | Add bulk actions |
| `/admin/catalog/products/new/page.tsx` | Add businessCategory dropdown |
| `/admin/catalog/products/[id]/page.tsx` | Add businessCategory dropdown |
| `/admin/catalog/import/page.tsx` | Add category selector, history |

### Frontend - Customer
| File | Changes |
|------|---------|
| `/(marketing)/catalog/page.tsx` | Update category icons, add sections |
| `features/catalog/components/CatalogFilters.tsx` | Replace genres with categories |
| `features/catalog/components/ProductCard.tsx` | Add hover actions, badges |

### SDK
| Changes |
|---------|
| Regenerate after API changes: `npm run sdk:dev` |

---

## ✅ Completed Quick Wins

1. ✅ **Update CATEGORY_ICONS** in catalog page to use your 4 categories
2. ✅ **Update CatalogFilters.tsx** CATEGORIES array
3. ✅ **Add businessCategory dropdown** to admin product forms
4. ✅ **Add stats cards** to admin catalog main page

---

## 📝 Notes

- Kinguin's `category` field (genres) kept for SEO and detailed filtering
- `businessCategory` is the primary organization for the store
- Product Groups handle editions/variants, businessCategory handles product type
- Platform names are now auto-normalized on import and via migration

---

## 🎉 Completion Summary

**All phases completed on January 27, 2026.**

### Key Files Created/Modified:

**Backend:**
- `apps/api/src/modules/catalog/utils/platform-normalizer.ts` (NEW) - Platform normalization utility
- `apps/api/src/database/migrations/1770000000000-AddBusinessCategory.ts` - businessCategory column
- `apps/api/src/database/migrations/1780000000000-NormalizePlatformNames.ts` (NEW) - Platform data cleanup
- `apps/api/src/modules/catalog/catalog.service.ts` - Integrated normalization at 3 entry points

**Frontend - Admin:**
- `/admin/catalog/page.tsx` - Redesigned as dashboard
- `/admin/catalog/products/page.tsx` - Bulk publish/unpublish actions
- `/admin/catalog/import/page.tsx` - Category selector, improved UX

**Frontend - Customer:**
- `/(marketing)/catalog/page.tsx` - Category icons, featured section, mobile quick filters
- `features/catalog/components/CatalogFilters.tsx` - BITLOOT_CATEGORIES, genres as secondary
- `features/catalog/components/ProductCard.tsx` - Stock badges, hover overlay improvements

**SDK:**
- Regenerated via `npm run sdk:dev`

### Run Platform Migration:
```bash
cd apps/api && npm run migration:run
```
