# BitLoot Project — Complete Unified Engineering Instructions for AI Agent

## Main Takeaway

BitLoot is a crypto-only e-commerce platform specializing in instant delivery of digital goods (game/software keys, subscriptions). It features a robust PWA frontend (Next.js/React) and secure NestJS backend, integrating NOWPayments for crypto, Kinguin API for catalog/fulfillment, Resend for emails, and Cloudflare R2 for encrypted key storage. Strict security, workflow, type-safety, and operational best practices are enforced throughout.

***

## Project Overview

**Core Value:**  
Crypto-only digital goods marketplace delivering instant keys from Kinguin and custom listings.  
**Architecture:**  
- **Frontend:** Next.js 16, React 19, Tailwind, Radix UI, shadcn/ui, TanStack Query, Zustand, PWA-first.
- **Backend:** NestJS (modular), PostgreSQL + TypeORM, Redis + BullMQ, Docker, Nginx, CI/CD via GitHub Actions.
- **Payments:** NOWPayments (crypto, 300+ assets) with IPN webhooks, strict underpayment policy.
- **Fulfillment:** Kinguin API for product sync and order fulfillment via secure server-side integration.
- **Delivery:** Keys are encrypted and stored in Cloudflare R2, delivered only through short-lived signed URLs.
- **Auth & Emails:** OTP-first (6-digit), password setup, transactional/marketing emails via Resend, with templates and idempotency.
- **Testing:** Unit, integration, and end-to-end tests for all critical flows (webhook, payment, key reveal) using vitest.
- **sdk-first:** Typed SDK clients for all backend-frontend interactions, no direct API calls from frontend.
***

## Documentation Reference & Implementation

**Start Here:**
- **[PRD.md](/docs/PRD.md)** — BitLoot's Product Requirements Document. Defines goals, features, user flows, acceptance criteria, and technical requirements. Reference for all product scope questions.
- **[project-description.md](/docs/project-description.md)** — High-level project overview, core value proposition, feature breakdown, tech stack, end-to-end flow, and target users. Read first for context.

**Project Structure & Architecture:**
- **[Project-Architecture.md](Project-Architecture.md)** — Complete monorepo folder and file structure with detailed purpose descriptions for every module, entity, controller, service, migration, and configuration file. Essential reference when navigating the codebase or understanding where to add new features.

**Code Standards & Implementation** _(🔴 AI MUST LOAD & FOLLOW ALWAYS when generating code)_

_⚠️ MANDATORY: These docs establish BitLoot's authoritative engineering standards. AI agents MUST reference these in EVERY chat where code is being generated. No exceptions._
- **[BitLoot-Code-Standards.md](./BitLoot-Code-Standards.md)** — Complete authoritative code standards covering TypeScript strict mode, ESLint runtime-safety rules, backend patterns (entities, DTOs, services, controllers, webhooks), frontend patterns (SDK clients, forms, hooks), security standards, database rules, and async queue patterns. Use as the source of truth for all implementation decisions.
- **[BitLoot-Checklists-Patterns.md](./BitLoot-Checklists-Patterns.md)** — Practical implementation checklists and 10 copy-paste code templates: Entity Checklist, DTO Checklist, Service Checklist, Controller Checklist, Webhook Checklist, Frontend Query Checklist, Frontend Form Checklist, HMAC Verification Checklist, OTP Pattern, Queue Processor Pattern. Reference these templates as starting points for every new feature.

_⚠️ MANDATORY: Always use design-system when designing or coding UI components or pages._
**Frontend Development & Design:**
- **[design-system.md](../docs/design-system.md)** — Complete Shadcn/UI setup with 46 components, Tailwind v4 configuration, Vercel OKLch theme, dark mode, and styling guidelines. Use for all UI/UX development and component usage.

_⚠️ MANDATORY: Always use sdk-first for all frontend-backend interactions._
**Backend & SDK Development:** 
- **[sdk.md](../docs/sdk.md)** — SDK design rationale, structure, and integration guide. Covers why SDK-first is essential for security and how to use typed clients instead of direct third-party API calls.


## Development Workflow — Vertical Slices & Level-Based Architecture

BitLoot follows a **vertical slices** development approach, structured in **progressive levels**. Each level builds upon the previous one, with every feature spanning the full stack (frontend → backend → database → security) within that level's scope. This ensures continuous delivery of working features while maintaining clean architecture and high quality standards.

### Development Methodology

**Vertical Slices:** Each feature is implemented completely (UI, API, database, security, tests) rather than layer-by-layer.

**Progressive Levels:** Development is organized into sequential levels where:
- Level 0: **Bootstrap & Infrastructure** — Project setup, tooling, CI/CD, Docker, databases.
- Level 1: **Walking Skeleton** — Minimal end-to-end flow (order → payment → fulfillment).
- Level 2: **Real Payments & Fulfillment** — NOWPayments integration, Kinguin API, webhooks, encryption.
- Level 3: **Advanced Fulfillment & Scaling** — WebSocket real-time updates, admin dashboards, monitoring.
- Level 4+: **Optimization, Features, Analytics** — Performance tuning, advanced features, reporting.

**Key Principle:** Each level depends on the previous level. No level starts until the prior level is completed, tested (100%), and fully documented.

### Complete Development Workflow Documentation

BitLoot maintains comprehensive documentation for every development phase and level. All workflow docs are organized in `docs/developer-workflow/`:

#### Level 0 — Bootstrap & Infrastructure ✅ **COMPLETE**

- **LEVEL_0_COMPLETE.md: See `docs/LEVEL_0_COMPLETE.md`** — Infrastructure setup, Docker, TypeScript, ESLint configuration.
- **BOOTSTRAP_COMPLETE.md: See `docs/BOOTSTRAP_COMPLETE.md`** — Complete bootstrap verification and setup confirmation.
- **LEVEL_0_VERIFICATION.md: See `docs/LEVEL_0_VERIFICATION.md`)** — Verification checklist for successful bootstrap.
- **FINAL_STATUS.md: See `docs/FINAL_STATUS.md`** — Final status and readiness for Level 1.
- **QUICK_REFERENCE.md: See `docs/QUICK_REFERENCE.md`** — Quick commands and setup reference.

#### Level 1 — Walking Skeleton (End-to-End MVP) ✅ **COMPLETE**

- **LEVEL_1_COMPLETE.md: See `docs/LEVEL_1_COMPLETE.md`** — Full walking skeleton implementation with 3 pages and checkout flow.
- **LEVEL_1_FINAL_STATUS.md: See `docs/LEVEL_1_FINAL_STATUS.md`** — Final status, metrics, and quality validation.
- **LEVEL_1_VERIFICATION.md: See `docs/LEVEL_1_VERIFICATION.md`** — E2E verification checklist for walking skeleton.
- **SUMMARY.md: See `docs/SUMMARY.md`** — Summary of completed features and next steps.
- **QUICK_REFERENCE.md: See `docs/QUICK_REFERENCE.md`** — Quick reference for Level 1 commands and flows.

#### Level 2 — Real Payments & Fulfillment ✅ **COMPLETE** (56/56 Tasks)

NOWPayments crypto payments, HMAC webhook security, BullMQ async processing. 5 phases covering database, payment integration, webhook security, async processing, and E2E testing.

_See `docs/developer-workflow/02-Level/` for detailed phase documentation._

#### Level 3 — Kinguin Integration & Real Fulfillment ✅ **COMPLETE** (21 Core Tasks)

Kinguin API integration, encrypted key storage (AES-256-GCM), WebSocket real-time updates, admin features.

_See `docs/developer-workflow/03-Level/` for detailed phase documentation._

---

## Completed Levels Summary (0-6)

| Level | Name | Key Deliverables |
|-------|------|------------------|
| **0** | Workshop Setup | Monorepo, Docker, TypeScript strict, ESLint, CI/CD |
| **1** | Walking Skeleton | MVP flow, fake payments/fulfillment, R2 signed links, Resend emails |
| **2** | Real Payments | NOWPayments sandbox, HMAC webhooks, idempotency, BullMQ jobs |
| **3** | Real Fulfillment | Kinguin API, order reservation/delivery, AES-256-GCM encryption, WebSocket updates |
| **4** | Security & Observability | OTP auth (6-digit Redis), JWT (15m/7d), SDK-first migration, Prometheus + Grafana |
| **5** | Admin & Ops UI | RBAC, 8 admin pages, automated backups (R2), disaster recovery, audit logging |
| **6** | Products & Catalog | 5-table schema, Kinguin sync, dynamic pricing, full-text search, 333+ tests |

**Quality Status:** All levels complete with 5/5 quality gates passing, 333+ tests, 0 errors.

_Detailed level documentation available in `docs/developer-workflow/`_

---

# Post-Level 6 Features (January 2026)

**Status:** All features ✅ Production-Ready  
**Branch:** `catalog-development`

## Quick Reference Table

| Feature | Status | Key Files |
|---------|--------|-----------|
| Custom Products & Kinguin Integration | ✅ | `fulfillment.service.ts`, `kinguin.client.ts` |
| Product Groups (Variants) | ✅ | `catalog-groups.service.ts`, `/admin/catalog/groups` |
| Product Reviews | ✅ | `reviews.service.ts`, `/admin/reviews` |
| Watchlist | ✅ | `watchlist.service.ts`, `/watchlist` |
| Promo Codes | ✅ | `promos.service.ts`, `/admin/promos` |
| Account Deletion (30-day) | ✅ | `auth.controller.ts`, `user-deletion-cleanup.processor.ts` |
| Dual-OTP Email Change | ✅ | `auth.controller.ts` |
| Retry Fulfillment (Admin) | ✅ | `admin.controller.ts` |
| Kinguin Balance Dashboard | ✅ | `kinguin-balance.service.ts`, `/admin/balances` |
| Kinguin Profit Analytics | ✅ | `kinguin-profit.service.ts` |
| Admin Payments Management | ✅ | `/admin/payments` with 4-tab modal |
| Admin Orders Enhancement | ✅ | `/admin/orders` with bulk ops |
| Webhook Logs Dashboard | ✅ | `/admin/webhooks` |
| Payment/Fulfillment Fixes | ✅ | 8 critical fixes for race conditions |

---

## 1. Custom Products & Kinguin Integration

**Purpose:** Hybrid fulfillment — products sourced from Custom (manual keys) or Kinguin (automated API).

**Schema:**
- `products.sourceType`: `'custom' | 'kinguin'`
- `products.kinguinOfferId`: Kinguin offer ID (nullable)
- `orders.sourceType`, `order_items.productSourceType`

**Fulfillment Dispatcher Pattern:**
```typescript
if (item.productSourceType === 'kinguin') {
  await this.fulfillOrderViaKinguin(item);
} else {
  await this.fulfillOrderViaCustom(item);
}
```

**Kinguin Client Methods:** `createOrder()`, `getOrderStatus()`, `getKey()`, `searchOrders()`

---

## 2. Product Groups (Variants)

**Purpose:** Group variants (e.g., GTA V Standard/Deluxe/Ultimate) for modal selection.

**Entities:** `ProductGroup`, `ProductGroupMember`

**API:**
- Public: `GET /catalog/groups`, `GET /catalog/groups/:slug`
- Admin: Full CRUD at `/admin/catalog/groups`

**Service:** `CatalogGroupsService` — create, findAll, findBySlug, addProduct, removeProduct

---

## 3. Product Reviews

**Purpose:** Customer reviews with admin moderation.

**Statuses:** `pending` → `approved`/`rejected`

**API (12 endpoints):**
- Customer: Submit, edit, delete own reviews
- Admin: Full CRUD, approve/reject, bulk actions, homepage curation
- Public: Display approved reviews

**Frontend:** `/admin/reviews` dashboard + product page display

---

## 4. Watchlist

**Purpose:** Save products for later.

**Entity:** `WatchlistItem` (userId + productId unique constraint)

**API (5 endpoints):**
- `GET/POST/DELETE /watchlist`
- `GET /watchlist/check/:productId`
- `GET /watchlist/count`

**Hooks:** `useWatchlist`, `useAddToWatchlist`, `useToggleWatchlist`, `useWatchlistCount`

---

## 5. Promo Codes

**Purpose:** Discount campaigns with flexible rules.

**Features:**
- Discount types: Percent (0-100%) or fixed amount (EUR)
- Scope: Global, category, or product-specific
- Usage limits: Total + per-user caps
- Stacking rules: Configurable prevention
- **Hard delete** (not soft-delete) to avoid unique constraint issues

**Validation (12 checks):** Active, dates, usage, scope, stacking

**Cart Revalidation:** Auto-clears invalid promos when cart changes (via `useEffect` in `CartContext`)

**API:**
- Public: `POST /promos/validate`
- Admin: CRUD at `/admin/promos`, redemption history

---

## 6. Account Management

### Account Deletion (30-day Grace Period)
- Request → 30-day wait → Cron soft-deletes
- Cancel via profile page OR email link (HMAC-signed token)
- Cron: Daily 2AM in `user-deletion-cleanup.processor.ts`
- Deleted users can't login; system returns "account deleted" message

### Dual-OTP Email Change
- OTP sent to BOTH current AND new email
- Both codes required to confirm change
- Confirmation emails to both addresses

### Account Recovery SOP
- User contacts support, provides 2-3 verification points
- 24-hour cooling period before admin updates email

---

## 7. Retry Fulfillment (Admin)

**Purpose:** Recover stuck orders (paid but keys not delivered).

**Endpoint:** `POST /admin/orders/:id/retry-fulfillment`

**Allowed statuses:** `paid`, `failed`, `waiting`, `confirming`

**Recovery Logic:**
1. If Kinguin order exists but reservation ID lost → search by `orderExternalId`
2. After reservation, poll Kinguin for completed status
3. Queue `fetch-keys` job if ready

**Bug Fixed:** `finalizeDelivery()` was using BitLoot order ID instead of Kinguin order ID

---

## 8. Kinguin Balance Dashboard

**Location:** `/admin/balances`

**Features:**
- Live EUR balance from Kinguin API
- Spending stats: 24h, 7d, 30d with order counts
- Recent orders table with copy-to-clipboard
- Balance history chart (30 days)
- Alert system: Low balance warnings
- Runway calculation: Days until depleted

**Profit Analytics:**
- Cross-references Kinguin costs with BitLoot selling prices
- Summary: Revenue, cost, profit, margin %
- Trend chart by day
- Per-product profitability
- Duration filter: 24h, 7d, 30d, total

---

## 9. Admin Payments Management

**Location:** `/admin/payments`

**Features:**
- Payment list with Order ID column, status badges, filtering, search
- **4-tab detail modal:** Overview, Transaction, Timeline, IPN History
- IPN History Viewer: All webhooks per payment
- Manual Status Override with confirmation + audit
- Auto-refresh pending payments (10s)
- Statistics: Total, Successful, Pending, Revenue
- CSV export with date range
- Blockchain explorer links, copy-to-clipboard
- Underpayment/overpayment detection

---

## 10. Admin Orders Enhancement

**Location:** `/admin/orders`

**Phases Complete:**
1. Frontend Data Display (Payment info in list)
2. Advanced Filtering (source type, date range)
3. Admin Actions (status update, resend keys)
4. Bulk Operations (export with date range, bulk status update)
5. Analytics Widgets (Total Orders, Revenue, Fulfillment Rate, Avg Order Value)

**Features:**
- Audit trail display with real API data
- Checkbox selection for bulk operations
- Resend keys email button for fulfilled orders

---

## 11. Webhook Logs Dashboard

**Location:** `/admin/webhooks`

**Features:**
- Dashboard overview with stats cards (success rate, failed count)
- Webhook logs list with filtering
- Webhook detail page with full payload
- Order-embedded webhook history
- **Bulk replay** for failed webhooks
- Navigation: Previous/Next webhook
- Timeline chart showing activity

**Common Scenarios:**
- Invalid signatures = Security alert (do NOT replay)
- Failed with DB error = Safe to replay
- Multiple webhooks per payment = Normal (status transitions)

---

## 12. Payment & Fulfillment Flow Fixes (8 Critical)

1. **Email Idempotency:** `completionEmailSent` flag prevents duplicate emails
2. **Cache Invalidation (paid):** Invalidate after `markPaid()`
3. **Race Condition Guard:** Skip `markPaid()` if already `fulfilled`
4. **Cache Invalidation (fulfilled):** Invalidate after fulfillment
5. **Payment Record Sync:** IPN handler now updates Payment entity (not just Order)
6. **Sandbox Auto-Trigger Removed:** Success page no longer triggers sandbox
7. **Order ID Bug Fixed:** Use `reservationId` for Kinguin API, not BitLoot `order.id`
8. **Cache utilities:** `invalidateOrderCache()` added

---

## 13. Order System Reference

**Guest Checkout Flow:**
1. Create order → Get `orderSessionToken` (JWT, 1hr)
2. Store in localStorage: `order_session_${orderId}`
3. Redirect to NOWPayments
4. IPN webhook → `markPaid()` → Queue fulfillment
5. Kinguin/Custom keys → Encrypt (AES-256-GCM) → Upload to R2
6. Success page → Verify token → Generate signed URL (15min) → Reveal key

**Token Verification:** `verifyOrderSessionToken(orderId, token)` checks `type === 'order_session' && orderId matches`

---

## Key Implementation Patterns

### SDK-First (No Raw Fetch)
All frontend API calls use `@bitloot/sdk`:
```typescript
import { PromosApi, AdminPromosApi } from '@bitloot/sdk';
```

### Idempotency
- Webhooks: Check `externalId` in webhook_logs before processing
- Emails: Check `completionEmailSent` flag before sending
- Promo redemptions: Check existing `promoredemptions` record

### Cache Invalidation
```typescript
import { invalidateOrderCache } from '../utils/cache';
// Call after any order status change
invalidateOrderCache(orderId);
```

### Admin Guards
All admin endpoints use: `@UseGuards(JwtAuthGuard, AdminGuard)`

### HMAC Tokens (Email Links)
Account deletion cancel links use HMAC-SHA256 signed tokens for stateless verification.

---

## Testing Notes

- **E2E Sandbox:** Use ngrok for webhook testing, configure NOWPayments/Kinguin webhooks to ngrok URL
- **Promo Stacking:** Tested manually; unit tests pending
- **Dual-OTP:** Resend test sender only sends to account owner email; full test requires verified domain

---

## File Locations Quick Reference

| Module | Backend Service | Admin Page |
|--------|-----------------|------------|
| Promos | `modules/promos/` | `/admin/promos` |
| Reviews | `modules/reviews/` | `/admin/reviews` |
| Watchlist | `modules/watchlist/` | Profile → Watchlist tab |
| Product Groups | `modules/catalog/services/catalog-groups.service.ts` | `/admin/catalog/groups` |
| Kinguin Balance | `modules/kinguin/kinguin-balance.service.ts` | `/admin/balances` |
| Kinguin Profit | `modules/kinguin/kinguin-profit.service.ts` | `/admin/balances` (Profit tab) |
| Account Deletion | `modules/auth/auth.controller.ts` | Profile → Security tab |
| Retry Fulfillment | `modules/admin/admin.controller.ts` | `/admin/orders/[id]` |
| Webhooks | `modules/webhooks/` | `/admin/webhooks` |

***

**Third-Party Integration API Docs** _(Reference only when working on that specific integration)_

_⚠️ AI Agent Note: Do NOT load these integration docs in every chat unless the current task explicitly involves that API integration._
- **nowpayments-API-documentaion.md: See `docs/nowpayments-API-documentaion.md`** — Crypto payment gateway API for creating payments, handling IPN callbacks, and processing transactions. Load only when working on payment flows.
- **[Kinguin_API_DOCS](../docs//Kinguin-eCommerce-API-master/README.md)** — Kinguin Sales Manager API quick reference for product sync, stock models, and order fulfillment. Load only when working on fulfillment.
- **resend-API-documentaion.md: See `docs/resend-API-documentaion.md`** — Email service API for OTP, password reset, transactional, and promotional emails. Load only when working on email features.
- **tawk-integration.md: See `docs/tawk-integration.md`** — Live chat widget setup and configuration for customer support. Load only when working on chat features.


***

## Golden Rules (Non-Negotiable)

### 🔴 **RULE #1 — SDK-FIRST ARCHITECTURE (ABSOLUTE)**

**Every single frontend API call MUST flow through `@bitloot/sdk`.** This is non-negotiable.

**Prohibited (❌ NEVER DO THIS):**
```typescript
// ❌ Direct fetch to backend
const res = await fetch('http://localhost:4000/api/endpoint');

// ❌ Direct axios calls
import axios from 'axios';
const data = await axios.get('/api/data');

// ❌ Hardcoded API URLs
const url = 'http://localhost:4000/admin/list?page=1';

// ❌ Manual Bearer token construction
const headers = { Authorization: `Bearer ${token}` };
```

**Required (✅ ALWAYS DO THIS):**
```typescript
// ✅ Use SDK clients
import { authClient, AdminApi, Configuration } from '@bitloot/sdk';

// ✅ Use Configuration for base URL
const config = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

// ✅ Let SDK handle auth headers
const result = await authClient.refreshToken(token);

// ✅ Use auto-generated API clients
const adminApi = new AdminApi(config);
const data = await adminApi.adminControllerGetReservations({ limit: 20 });
```

**Consequences of Not Following SDK-First:**
- ❌ Secrets potentially exposed
- ❌ API changes require frontend updates everywhere
- ❌ Type safety lost (no auto-generated types)
- ❌ Manual auth token handling (security risk)
- ❌ Inconsistent error handling
- ❌ Hard to test (can't mock easily)

---

### Additional Golden Rules

2. **Security by Design:** JWT with refresh, ownership checks, HMAC verification (webhooks/IPN), strict rate limits for OTP, keys only via signed R2 URL (never plaintext in frontend or emails).
3. **No Secrets in Frontend:** API keys/passwords/crypto secrets live only on backend.
4. **Idempotent & Queued:** All fulfillment, email, IPN/webhook work via BullMQ jobs, dedupe, retries, dead-letter queue.
5. **Pagination & Indexes:** All list endpoints must paginate (`limit ≤ 100`), composite indexes for hot queries.
6. **Zero `any` or `@ts-ignore`:** Strict TypeScript and ESLint rules enforce type- and runtime-safety everywhere.

***

## Engineering Standards

### Backend (NestJS)
- **DTOs:** Class-based, validated, and fully documented for OpenAPI/SDK generation.
- **Services:** Multi-entity operations require transactions. IPN/webhook/services are idempotent and ownership-aware.
- **Webhooks:** Validate raw payload HMAC (timing-safe), deny replays, log via `webhook_logs`, always idempotent.
- **Database:** TypeORM migrations, soft deletes as needed, `decimal(20, 8)` types for money, indexed queries on common fields.

### Frontend (Next.js PWA)
- **App Structure:** Thin routes in `app/`, logic/features in `features/*`. All API/data flows through SDK (no raw fetch).
- **Forms:** React Hook Form + Zod, always handle loading/error/empty states, ensure accessibility.
- **Data:** TanStack Query, state management via Zustand, optimistic updates and cache settings per context.
- **Key Delivery:** Always via signed Cloudflare R2 URL; never store/retrieve plaintext keys in browser or emails.

### SDK (BitLoot)
- **Generation:** API regenerated from OpenAPI on every change, strictly typed, domain clients, unified error handling.
- **Frontend Use:** SDK handles JWT, refresh tokens, and all data contracts. No direct third-party API calls.

### Emails (Resend)
- Transactional emails (OTP, password reset, order updates) use template variables—never send keys directly.
- Idempotency keys used on every transactional send to prevent duplication on retries.
- Rate-limit OTP; store OTP in Redis with TTL; never log sensitive codes.

***

## Security & Verification

- HMAC signature verification for all webhooks/IPN.
- JWT + role checks + ownership in service layer.
- No plaintext keys or secrets exposed anywhere.
- Underpayment = failed/non-refundable—reflected across UI and email flows.
- Restrictive CORS, WAF and CAPTCHA on bot-prone endpoints.
- Signed key delivery URLs expire fast (≤ 15 min), track audit logs upon reveal.

***

## Workflow & Quality

- **Bootstrap, Skeleton, Payments, Fulfillment:** Each phase completed, tested (100% passing), and fully documented.
- **CI/CD Gates:** Format, lint (no warnings/errors), type-check, unit & integration tests, full build, SDK regeneration.
- **Performance:** Indexed DB queries, minimal selects, caching for read-mostly endpoints, virtualized long lists, background queue for slow tasks.
- **Testing:** Unit, integration, end-to-end (NestJS Supertest); all critical flows (webhook, payment, key reveal) are covered.
- **Troubleshooting:** SDK regeneration on API changes, deduplication of emails, immediate reaction to payment/status/key delivery errors.

## Implementation Patterns

### Backend Example (Order Creation)
- Use transactions, creation via DTO, offload heavy async to BullMQ.
- Mark paid state idempotently with NOWPayments payment ID.
- Validate ownership and responses via DTO classes.

### Frontend Example (Order/Checkout)
- Use SDK query/mutation hooks via TanStack Query.
- Form validation with RHF + Zod, state panels for payment/fulfillment status.
- “Reveal” step always opens signed R2 URL for JSON key file.

### Security Example (Webhook Verification)
- Read raw body for signature.
- HMAC verification (timing-safe).
- Dedupe using webhook logs.
- Enqueue side-effect jobs, fast response to webhook sender.

***

## Command Cheat Sheet

```bash
npm run dev:all           # Start both PWA + API
npm run sdk:dev           # Regenerate SDK after API updates
npm run quality:full      # Format, lint, type-check, test, build (all must pass!)
```

***

## BitLoot-Specific Best Practices

- Never send/display keys except via signed links with fast expiry.
- Only use SDK—no direct third-party calls or raw secret handling in frontend.
- Webhooks and IPN must always be verified, idempotent, logged, and retried if necessary.

***

## AI Agent Guidance

Always use this document's context, follow all security and architectural rules, consult referenced documentation for specifics, and structure responses per template, citing direct commands/code patterns when useful for implementation. Never violate non-negotiable rules, prioritize security, type safety, SDK-first design, and robust queue/idempotency for side effects.