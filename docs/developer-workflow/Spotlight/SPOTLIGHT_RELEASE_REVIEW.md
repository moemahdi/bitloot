# Game Spotlight — Final Release Review

Date: 2026-02-26
Scope: Game Spotlight feature (admin + homepage + `/games/[slug]`)

## 1) What Was Implemented

### Backend
- Extended `product_groups` with spotlight fields via migration:
  - `isSpotlight`, `heroImageUrl`, `heroVideoUrl`, `releaseDate`, `longDescription`, `accentColor`, `badgeText`, `metacriticScore`, `developerName`, `publisherName`, `genres`, `features`, `faqItems`, `spotlightOrder`
- Added public spotlight endpoints:
  - `GET /catalog/groups/spotlights`
  - `GET /catalog/groups/spotlight/:slug`
- Added spotlight-aware service logic:
  - create/update mapping for spotlight fields
  - list/filter support for `isSpotlight`
  - spotlight slug fetch constrained to `isActive=true` + `isSpotlight=true`

### SDK
- Regenerated/updated SDK surfaces for spotlight endpoints and fields:
  - `CatalogGroupsApi.groupsControllerListSpotlights`
  - `CatalogGroupsApi.groupsControllerGetSpotlight`
  - spotlight properties in group DTO models

### Web (Admin)
- Refactored admin group pages into spotlight management UX:
  - list page with spotlight cards and preview action
  - create page with spotlight-first form fields
  - edit page with spotlight metadata + product assignment
- Fixed currency formatting for spotlight product prices to EUR display.

### Web (Marketing)
- Added spotlight route:
  - `apps/web/src/app/(marketing)/games/[slug]/page.tsx`
  - `loading.tsx`, `not-found.tsx`, and `SpotlightPageClient.tsx`
- Added spotlight component module:
  - Hero, countdown, trailer modal, platform grid, edition selector, highlights, FAQ
- Added homepage section:
  - `SpotlightGamesSection` integrated in homepage flow.

## 2) Final Fixes Applied In This Review

- Resolved spotlight-scope utility diagnostics (Tailwind v4 class migrations) in:
  - `apps/web/src/features/game-spotlight/components/SpotlightHero.tsx`
  - `apps/web/src/app/(marketing)/games/[slug]/SpotlightPageClient.tsx`
  - `apps/web/src/app/(marketing)/games/[slug]/loading.tsx`
  - `apps/web/src/app/admin/catalog/groups/[id]/page.tsx`
  - `apps/web/src/app/admin/catalog/groups/new/page.tsx`
  - `apps/web/src/components/homepage/SpotlightGamesSection.tsx`
  - `apps/web/src/app/admin/catalog/groups/page.tsx`

Spotlight file diagnostics after fixes: **clean**.

## 3) Verification Performed

- Code review completed for backend/service/controller, SDK surfaces, admin pages, homepage section, and `/games/[slug]` route.
- Problems/diagnostics check completed for spotlight-modified files: no remaining errors/warnings in those files.
- Cache-staleness mitigation confirmed on spotlight page route:
  - `dynamic = 'force-dynamic'`
  - `revalidate = 0`
  - fetch with `cache: 'no-store'`

## 4) Remaining Non-Spotlight Workspace Issues (Not Changed Here)

- TypeScript deprecation diagnostics in tsconfig files:
  - `apps/api/tsconfig.json` (`moduleResolution: node` deprecation path)
  - `apps/web/tsconfig.json` (`baseUrl` deprecation note)
- Additional style diagnostics exist in unrelated modules (outside spotlight scope).

These do not come from spotlight files touched in this final review.

## 5) Production Readiness Decision

Spotlight feature is **ready to push** from a spotlight-scope perspective, with the following deploy prerequisites:

1. Run DB migration including `1790000000000-AddSpotlightFields`.
2. Ensure API + web deploy from the same commit (schema + UI consistency).
3. Execute final smoke test in staging/prod:
   - create spotlight
   - assign products
   - homepage card visible
   - `/games/[slug]` renders hero + editions + FAQ
   - delete and recreate same slug (no stale page)

## 6) Recommended Post-Deploy Smoke Checklist

- Admin:
  - create/edit spotlight, save advanced metadata
  - add/remove products in modal
  - preview opens `/games/[slug]`
- Public:
  - homepage spotlight carousel/cards render
  - spotlight page CTA and countdown behavior
  - crypto/payment trust section visible
- SEO:
  - metadata and JSON-LD present
  - canonical URL uses `/games/[slug]`

---

Owner note: this review intentionally avoids unrelated refactors and focuses on spotlight release stability.
