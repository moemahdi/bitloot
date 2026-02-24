## SEO Audit: BitLoot (Implementation Status Update)

**Last reviewed:** 2026-02-24  
**Scope:** What is already implemented in this work session vs what is still pending

---

## Session Summary

### Completed in this session ✅

- Homepage moved to a **server component wrapper** with page-specific metadata and canonical:
  - `apps/web/src/app/(marketing)/page.tsx`
- Catalog now has dedicated SEO metadata (title/description/OG/canonical) via layout:
  - `apps/web/src/app/(marketing)/catalog/layout.tsx`
- Root layout no longer forces dynamic rendering globally:
  - `apps/web/src/app/layout.tsx`
- Open Graph image references are now PNG across metadata/structured data:
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/components/seo/StructuredData.tsx`
  - marketing landing pages and section layouts
- `NEXT_PUBLIC_SITE_URL` standardization applied broadly for canonical/OG URLs:
  - root layout, sitemap, robots, product/category metadata, marketing pages
- Added metadata/canonical coverage for major marketing routes via route layouts:
  - `deals`, `reviews`, `help`, `refunds`, `terms`, `privacy`
- FAQ schema is injected server-side at marketing layout level:
  - `apps/web/src/app/(marketing)/layout.tsx`
- Product URL canonicalization improved with **301 redirect UUID → slug** at edge proxy:
  - `apps/web/src/proxy.ts`
- Added/expanded SEO landing pages and included in sitemap:
  - `buy-steam-keys-with-bitcoin`
  - `buy-playstation-keys-crypto`
  - `buy-xbox-keys-crypto`
  - `buy-nintendo-keys-crypto`
  - `playstation-plus-games`
  - `xbox-game-pass-crypto`
- Added `ProductListSchema` ItemList JSON-LD to homepage and catalog surfaces:
  - `apps/web/src/app/(marketing)/page.tsx`
  - `apps/web/src/app/(marketing)/catalog/layout.tsx`
- Migrated sitemap to segmented index strategy using `generateSitemaps()`:
  - `apps/web/src/app/sitemap.ts`

---

## Critical Bugs & Gaps — Current Status

| # | Item | Previous Impact | Current Status |
|---|---|---|---|
| 1 | Homepage was client-only with no page metadata | HIGH | ✅ **Fixed** (server wrapper + metadata in `(marketing)/page.tsx`) |
| 2 | Catalog had no dedicated page metadata | HIGH | ✅ **Fixed** (metadata in `catalog/layout.tsx`) |
| 3 | `force-dynamic` on root layout | HIGH | ✅ **Fixed** (removed from root; scoped to specific layouts/routes) |
| 4 | OG image `.svg` usage | HIGH | ✅ **Fixed** in metadata references (`og-image.png` now used) |
| 5 | Domain consistency (`NEXT_PUBLIC_SITE_URL`) | HIGH | ✅ **Largely fixed** (standardized in key SEO files) |
| 6 | Missing metadata on marketing pages | MEDIUM | ✅ **Fixed** for target pages via route layouts |
| 7 | FAQ schema not wired to homepage | MEDIUM | ✅ **Fixed** via marketing layout server injection |
| 8 | `ProductListSchema` component not used on home/catalog | MEDIUM | ✅ **Fixed** (ItemList JSON-LD now injected on homepage and catalog layout) |
| 9 | Sitemap limited/no index strategy | MEDIUM | ✅ **Fixed** (segmented sitemap index via `generateSitemaps()` with static/category + paged product sitemaps) |
|10| No blog/content strategy | HIGH long-term | ❌ **Not started** |
|11| `sameAs` empty | LOW-MEDIUM | ✅ **Fixed for OrganizationSchema usage in root layout**; ⚠️ `OnlineStoreSchema.sameAs` still empty |
|12| Product URL duplication risk (`/product/[id]` vs slug) | MEDIUM | ✅ **Fixed** with 301 UUID→slug redirect in `proxy.ts` |

---

## Priority Plan — Remaining Work

### P1/P2 items still open

1. **OnlineStore `sameAs` parity**
   - Populate `sameAs` in `OnlineStoreSchema` to match root organization links.

2. **Contact SEO behavior (optional hardening)**
   - `/contact` currently redirects to `/help#support`.
   - This is acceptable, but can be upgraded to explicit metadata/redirect policy if needed.

### P3/P4 strategic items still open

3. **Content hub (blog/guides)**
   - Not started.
   - Required for long-tail organic growth and authority.

4. **Merchant Center + promotion schema enhancements**
   - Not started.

---

## Updated Implementation Sequence

### Week 1 (Completed)

- ✅ Homepage metadata architecture fix
- ✅ Catalog metadata coverage
- ✅ Root dynamic caching fix
- ✅ OG PNG migration in metadata refs
- ✅ Canonical/URL consistency improvements

### Week 2 (Completed)

- ✅ Static marketing route metadata coverage (`deals`, `reviews`, `help`, `refunds`, `terms`, `privacy`)
- ✅ FAQ schema wired server-side
- ✅ Additional high-intent landing pages shipped

### Week 3 (Partially Completed)

- ✅ UUID→slug 301 redirect for products
- ✅ Sitemap index split implemented via `generateSitemaps()`
- ✅ Homepage/catalog ItemList schema (`ProductListSchema`) implemented

### Next Sprint (Recommended)

1. Populate OnlineStore `sameAs`  
2. Start `/blog` (minimum 3 launch articles)  
3. Add Merchant Center feed + promotion schema

---

## Notes

- The previous audit was directionally correct; most critical technical SEO blockers are now fixed.
- Remaining gaps are primarily entity completeness (`OnlineStore sameAs`) and growth strategy (`content/blog`).
- Current state is materially better for crawlability, metadata quality, canonicalization, and rich-result readiness.
