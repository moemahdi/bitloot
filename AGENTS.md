# BitLoot Agent Context

This file is the root Codex/AI-agent briefing for BitLoot. It condenses the
project context from `.github/` and `docs/` so future agents start with the
right assumptions.

## Current Project State

BitLoot is already launched, live on Railway, and feature complete. Treat
pre-launch, roadmap, and phase-plan documents as historical context or runbooks
unless the user explicitly asks to revive a planned item.

Do not assume the project is still an MVP or unfinished because older docs use
phrases like "pre-launch", "MVP", "next step", or "planned". If a document and
the live code disagree, inspect the code and current Railway/live configuration
before changing behavior.

BitLoot is a crypto-only digital goods marketplace for instant delivery of game
keys, software licenses, subscriptions, and premium accounts. Customers browse,
pay with crypto through NOWPayments, and receive keys through secure encrypted
Cloudflare R2 delivery. Catalog and automated fulfillment are integrated with
Kinguin, while custom BitLoot products are also supported.

## Core Architecture

- Monorepo with npm workspaces: `apps/api`, `apps/web`, and `packages/sdk`.
- Frontend: Next.js 16 App Router, React 19, PWA-first, Tailwind CSS v4,
  Radix/shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod.
- Backend: NestJS, PostgreSQL, TypeORM migrations, Redis, BullMQ queues,
  Socket.IO WebSockets, Prometheus metrics, Helmet, throttling, Swagger/OpenAPI.
- SDK: `@bitloot/sdk`, generated from backend OpenAPI using `typescript-fetch`.
  Frontend must use this SDK for backend calls.
- Payments: NOWPayments API plus HMAC-verified IPN webhooks.
- Fulfillment: hybrid source model, `custom` or `kinguin`; Kinguin order,
  status, key, balance, and profit APIs are server-side only.
- Storage: Cloudflare R2 private bucket; keys are encrypted before storage and
  delivered through short-lived signed URLs. Never expose plaintext keys in
  frontend code, email, logs, or responses.
- Email: Resend for OTP, welcome, order, payment-state, account, deletion, and
  marketing/unsubscribe flows.
- Deployment: Railway for production services and databases. GitHub push/merge
  to `main` triggers Railway deployment. Nightly database backup workflow uploads
  compressed backups to R2 with 30-day retention.

## Non-Negotiable Rules

- SDK-first architecture is absolute. Frontend API calls must use
  `@bitloot/sdk`; no raw `fetch`, no direct `axios`, no manual backend URL
  strings, no browser-side third-party API calls, and no browser secrets.
- Keep secrets server-side only: NOWPayments, Kinguin, Resend, R2, JWT, webhook,
  and encryption secrets must stay in backend env vars.
- Strict TypeScript: no `any`, no `@ts-ignore`, no unsafe assignments, use
  `import type` for type-only imports, and prefer explicit DTO/result types.
- Backend DTOs are classes with `class-validator` decorators and `@ApiProperty`.
  Controllers must have `@ApiTags`, `@ApiOperation`, and `@ApiResponse({ type })`
  so SDK generation remains typed.
- Validate ownership in service-layer logic, not only in controllers or UI.
- Use TypeORM migrations. Never enable `synchronize` in production.
- Money/crypto values use decimal precision, normally `decimal(20, 8)` stored
  as strings. Avoid floating-point arithmetic for persisted money.
- All webhooks/IPN handlers must verify raw-body HMAC with timing-safe compare,
  reject invalid signatures, be idempotent, log webhook events, and enqueue
  slow side effects.
- Fulfillment, email, payment polling, catalog sync, cleanup, and long-running
  side effects should use BullMQ with retries/backoff and idempotent job logic.
- All list endpoints must paginate and cap limits. Use indexes for hot filters.
- Underpayments are failed/non-refundable and must be reflected consistently in
  UI, emails, admin, and order/payment state.
- Product keys are never sent directly by email. Emails may contain secure
  reveal/download links only.
- Preserve production data. Never sync production user/order/payment data into
  local dev. Use migrations for schema changes and admin/Kinguin sync for
  products.

## Commands

Common commands from `package.json` and docs:

```bash
npm run dev:all
npm run dev:api
npm run dev:web
npm run type-check
npm run lint
npm run lint:fix
npm run format
npm run format:fix
npm run test
npm run build
npm run quality:full
npm run sdk:gen
npm --workspace packages/sdk run sdk:dev
npm --workspace apps/api run migration:run
docker compose up -d
```

Use `npm run sdk:gen` or `npm --workspace packages/sdk run sdk:dev` after
backend API/DTO/controller changes. The API must be running at
`http://localhost:4000/api/docs-json` for SDK generation.

Local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/api/docs`
- Health: `http://localhost:4000/api/healthz`

Production operations:

- Railway deploys from `main`.
- Run production migrations through Railway, for example:
  `railway run npm --workspace apps/api run migration:run`.
- Monitor Railway logs, admin dashboards, Kinguin balance, webhook logs, queue
  status, payment success, and fulfillment rate.

## Low-Budget Codex Operating Mode

Use this project in a cost-conscious way by default. The goal is to solve the
user's task with the smallest useful context, smallest safe edit, and smallest
credible verification.

- Start from `AGENTS.md`, then read only the docs and files directly relevant
  to the task. Do not reread the entire `.github/` or `docs/` tree unless the
  user explicitly asks for a full audit or context rebuild.
- Prefer `rg`, `rg --files`, `Select-String`, file headings, and targeted
  snippets before opening large files. Avoid `Get-Content -Raw` on long docs,
  generated SDK output, lockfiles, CSV/JSON exports, or API reference dumps
  unless the task truly requires their full contents.
- Batch independent reads with parallel tool calls, but keep each read narrow.
  Search first, then open the specific files and line ranges that matter.
- Treat these as on-demand only: `docs/audit.md`, historical
  `docs/developer-workflow/**` phase reports, `docs/Kinguin-eCommerce-API-master/**`,
  `docs/Products/product-images-export.*`, large CSVs, `swagger*.json`,
  generated SDK folders, `node_modules`, build output, and logs.
- For small bug fixes, inspect the failing file, its nearest tests/types, and
  the immediate caller/callee chain. Avoid broad architecture reviews.
- Make surgical patches. Do not rewrite whole files, reformat unrelated code,
  rename modules, regenerate assets, or refactor surrounding systems unless
  that is necessary for the requested change.
- Do not run expensive workflows by default. Prefer targeted checks first:
  type-check affected workspace, targeted tests, lint for touched workspace,
  then broader `npm run quality:full` only when the change is risky or the user
  asks for full verification.
- Do not start dev servers, run Playwright/browser tests, generate screenshots,
  crawl routes, run load tests, or call external APIs unless UI/runtime
  verification requires it or the user asks.
- Regenerate the SDK only when backend API/DTO/controller contracts change.
  Do not regenerate SDK for frontend-only or docs-only edits.
- Avoid web browsing unless the user asks for current external information, the
  task depends on current third-party docs/pricing/policy, or local docs are
  clearly stale. Prefer official docs for OpenAI, Railway, NOWPayments,
  Kinguin, Resend, Cloudflare, and Tawk.to.
- Before any high-budget task, pause and give the user a short estimate/tradeoff
  and ask for confirmation. High-budget tasks include full repo audits, reading
  all docs, broad security reviews, dependency upgrades, large UI redesigns,
  full E2E suites, production log investigations, and cross-module refactors.
- For answers, keep summaries compact and point to files instead of pasting long
  excerpts. For docs updates, prefer durable checklists and routing instructions
  over copying whole source documents.
- If a task is ambiguous, choose the smallest reversible interpretation and
  note the assumption. Ask a question only when the wrong assumption could cause
  production risk, data loss, or a large wasted run.

## Frontend Rules

- Keep App Router route files thin. Put real logic in feature modules, hooks,
  SDK clients, and shared design-system primitives.
- Use TanStack Query for server state and set explicit `staleTime`.
- Every async UI must cover loading, error, empty, success, disabled, hover,
  focus, and active states where applicable.
- Forms use React Hook Form and Zod.
- Use shadcn/ui and Radix primitives from the project design system. Use Lucide
  icons only.
- Always use Next.js `Image`, never raw `<img>`. Provide `alt`, `sizes`, and
  priority only for true above-fold/LCP images.
- No eager below-fold API calls. Gate below-fold data with `useInView` and
  `enabled: inView`.
- Lazy-load below-fold sections/components with `next/dynamic` where appropriate.
- Wrap scroll/resize layout reads in `requestAnimationFrame`.
- Virtualize or window long carousels/lists over 12 items.
- Do not use JS-driven infinite decorative animations. Prefer CSS animations and
  respect reduced-motion behavior.
- Defer third-party scripts such as Tawk.to until interaction or timeout; do not
  load them eagerly during LCP.
- Tawk.to should not appear on checkout/payment, admin, or auth-sensitive routes.

## Design System

BitLoot uses permanent deep-space dark mode with a neon cyberpunk gaming brand.
The design must feel premium, secure, responsive, and gaming-forward.

Primary design tokens/classes:

- Primary action/focus/glow: `cyan-glow` / `text-cyan-glow` / `bg-cyan-glow`
- Secondary accent: `purple-neon`
- Success: `green-success`
- Warning: `orange-warning`
- Featured/highlight: `pink-featured`
- Backgrounds: `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-tertiary`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Borders: `border-border-subtle`, `border-border-accent`
- Effects: `shadow-glow-cyan`, `shadow-glow-purple`,
  `shadow-glow-success`, `shadow-card-*`, `glass`, `text-gradient-*`

Do not hardcode colors. Use Tailwind classes and CSS variables already defined
by the design system. Touch targets should be at least 44px. Use mobile-first
responsive layout and safe-area utilities for PWA surfaces.

## Backend Rules

- Services own business rules, ownership checks, state transitions, transactions,
  and idempotency.
- Controllers accept DTOs and return response DTOs. Avoid returning entities
  directly from public APIs.
- Admin endpoints require JWT plus admin guard.
- Use `@Throttle` or equivalent rate limiting for bot-prone, auth, order lookup,
  payment, and webhook surfaces.
- JWT access tokens are short-lived and refresh/session logic must be handled
  carefully. Be aware older audit docs defer the larger httpOnly/BFF refactor.
- OTPs are 6-digit numeric codes stored in Redis with TTL and rate limiting.
  Never log full OTP codes.
- Payment/order state transitions must be guarded by a state machine or explicit
  allowed-transition logic.
- Cache invalidation is required after order status changes and product/catalog
  changes.
- Queue processors must be idempotent and safe to retry.

## Complete Feature Map

Core launched features include:

- Public storefront, catalog, product pages, quick views, filters, sorting,
  search, recently viewed, reviews, FAQs, SEO metadata, structured data, and
  landing pages.
- Guest checkout and account checkout.
- NOWPayments payment creation, status tracking, IPN processing, underpayment,
  failed, expired, and finished states.
- Order session tokens for guest access.
- Hybrid fulfillment for Kinguin and custom products.
- Encrypted key storage in R2 and signed URL reveal/download flow.
- OTP authentication, refresh/session management, password setup/reset where
  applicable, dual-OTP email change, account deletion with 30-day grace period,
  cancellation links signed with HMAC, and account recovery SOP.
- Resend transactional emails and unsubscribe support.
- Admin dashboards for orders, payments, webhooks, audit logs, queues, feature
  flags, reservations, balances/profit, catalog, groups, imports, reviews,
  promos, marketing sections/deals, users, and custom products.
- Product groups/variants, product reviews with moderation, watchlist, promo
  codes, marketing flash/bundle deals, spotlight/game sections, and SEO pages.
- Observability with Prometheus/Grafana docs, structured logs, audit logs,
  webhook replay, queue monitoring, and nightly backups.

## Important Historical Context

- Development was documented in vertical levels 0 through 6 and post-level-6
  features. Levels 0-6 are complete. Post-level-6 modules are also documented as
  production-ready.
- `docs/audit.md` includes older security findings and later remediation. Its
  remediation table says all Critical/High/Medium/Low tracked items are fixed,
  false positive, deferred, or open=0. Do not resurrect old findings as current
  bugs without checking code.
- Level 7/8 roadmap files describe marketing/email/referral/promo and analytics
  ideas. Some related features exist post-level-6, but treat roadmap-only items
  as planning unless implementation docs/code confirm completion.
- Pre-launch docs are useful runbooks, but the project is already live. Do not
  tell the user they still need to launch unless they explicitly ask for launch
  planning.

## Documentation Loading Policy

For code work, first consult:

- `.github/copilot-instructions.md`
- `.github/BitLoot-Code-Standards.md`
- `.github/BitLoot-Checklists-Patterns.md`

For UI work, also consult:

- `docs/design-system.md`
- `.github/prompts/design.prompt.md`

For frontend/backend API integration work, also consult:

- `docs/sdk.md`

For product behavior, flows, or scope:

- `docs/project-description.md`
- `docs/PRD.md`
- `.github/Project-Architecture.md`

For integration-specific work, consult only when relevant:

- NOWPayments: `docs/nowpayments-API-documentaion.md`
- Kinguin: `docs/Kinguin-eCommerce-API-master/`
- Resend/email: `docs/resend-API-documentaion.md`, `docs/emails.md`
- Tawk.to: `docs/tawk-integration.md`
- Webhooks/admin: `docs/developer-workflow/Webhooks/webhooks.md`
- Payments: `docs/developer-workflow/Payments/`
- Orders: `docs/developer-workflow/Orders/`
- Custom products: `docs/developer-workflow/CustomProducts/`
- Catalog/products: `docs/developer-workflow/CatalogDevelopment/`,
  `docs/Products/`
- Production ops: `docs/day2daydev.md`, `docs/DATABASE_SYNC.md`,
  `docs/Pre-Launch/`, `.github/workflows/`

## Documentation Index

`.github/`:

- `.github/copilot-instructions.md`: unified AI agent instructions, project
  summary, golden rules, performance rules, feature map, and doc loading policy.
- `.github/BitLoot-Code-Standards.md`: strict TypeScript, ESLint, backend,
  frontend, security, database, queue, CI, and SDK standards.
- `.github/BitLoot-Checklists-Patterns.md`: implementation checklists and
  copy-paste patterns for controllers, services, webhooks, forms, queries,
  HMAC, OTP, and queues.
- `.github/Project-Architecture.md`: monorepo structure, apps, modules,
  entities, migrations, frontend pages, environment variables, and feature
  status.
- `.github/prompts/design.prompt.md`: production UI prompt and full neon
  cyberpunk design rules.
- `.github/workflows/ci.yml`: CI build, SDK build, type-check, lint
  continue-on-error, build, and npm audit.
- `.github/workflows/backup-nightly.yml`: scheduled/manual PostgreSQL backup to
  R2 with logs and failure issue creation.

Core docs:

- `docs/project-description.md`: high-level product, value proposition, stack,
  integrations, flows, KPIs, compliance, and target users.
- `docs/PRD.md`: product requirements, personas, pages, core flows,
  acceptance criteria, and risks.
- `docs/design-system.md`: complete production-ready BitLoot design system.
- `docs/sdk.md`: SDK-first guide, generated clients, custom clients, and
  generation workflow.
- `docs/day2daydev.md`: daily dev workflow, Railway auto-deploy, monitoring,
  hotfix, and common tasks.
- `docs/DATABASE_SYNC.md`: local vs Railway DB sync policy; never sync
  production orders/payments/users.
- `docs/audit.md`: comprehensive security/logic audit plus remediation status.
- `docs/emails.md`: inventory of 12 email types and noted email issues.
- `docs/tawk-integration.md`: Tawk.to live-chat integration and hidden-route
  behavior.
- `docs/SEO/SEO-review.md`: SEO implementation status and remaining strategic
  SEO work.

Developer roadmap:

- `docs/developer-roadmap/Overview.md`
- `docs/developer-roadmap/00-Level.md`
- `docs/developer-roadmap/01-Level.md`
- `docs/developer-roadmap/02-Level.md`
- `docs/developer-roadmap/03-Level.md`
- `docs/developer-roadmap/04-Level.md`
- `docs/developer-roadmap/05-Level.md`
- `docs/developer-roadmap/06-Level.md`
- `docs/developer-roadmap/07-Level.md`
- `docs/developer-roadmap/08-Level.md`

Developer workflow completion docs:

- `docs/developer-workflow/00-Level/BOOTSTRAP_COMPLETE.md`
- `docs/developer-workflow/00-Level/FINAL_STATUS.md`
- `docs/developer-workflow/00-Level/LEVEL_0_COMPLETE.md`
- `docs/developer-workflow/00-Level/LEVEL_0_VERIFICATION.md`
- `docs/developer-workflow/00-Level/QUICK_REFERENCE.md`
- `docs/developer-workflow/01-Level/LEVEL_1_COMPLETE.md`
- `docs/developer-workflow/01-Level/LEVEL_1_FINAL_STATUS.md`
- `docs/developer-workflow/01-Level/LEVEL_1_VERIFICATION.md`
- `docs/developer-workflow/01-Level/QUICK_REFERENCE.md`
- `docs/developer-workflow/01-Level/SUMMARY.md`
- `docs/developer-workflow/02-Level/LEVEL_2_FINAL_COMPLETION_STATUS.md`
- `docs/developer-workflow/02-Level/PHASE1/`
- `docs/developer-workflow/02-Level/PHASE2/`
- `docs/developer-workflow/02-Level/PHASE3/`
- `docs/developer-workflow/02-Level/PHASE4/`
- `docs/developer-workflow/02-Level/PHASE5/`
- `docs/developer-workflow/03-Level/`
- `docs/developer-workflow/04-Level/`
- `docs/developer-workflow/05-Level/`
- `docs/developer-workflow/06-Level/`

Feature-specific workflow docs:

- `docs/developer-workflow/Account/ACCOUNT_DELETION_FEATURE.md`
- `docs/developer-workflow/Account/ACCOUNT_RECOVERY_SOP.md`
- `docs/developer-workflow/Account/DUAL_OTP_EMAIL_CHANGE_IMPLEMENTATION.md`
- `docs/developer-workflow/CatalogDevelopment/500_kinguin_titles.md`
- `docs/developer-workflow/CatalogDevelopment/CATALOG_COMPLETION_PLAN.md`
- `docs/developer-workflow/CatalogDevelopment/implementation_guide.md`
- `docs/developer-workflow/CatalogDevelopment/PRODUCT_GROUPS_FEATURE_COMPLETE.md`
- `docs/developer-workflow/CatalogDevelopment/REVIEWS_FEATURE_COMPLETE_DOCUMENTATION.md`
- `docs/developer-workflow/CatalogDevelopment/WATCHLIST_FEATURE_COMPLETE.md`
- `docs/developer-workflow/CustomProducts/CustomProductV2.md`
- `docs/developer-workflow/CustomProducts/CustomProductsV3.md`
- `docs/developer-workflow/Kinguin/KINGUIN_BALANCE_DASHBOARD_PLAN.md`
- `docs/developer-workflow/Kinguin/RETRY_FULFILLMENT_FEATURE.md`
- `docs/developer-workflow/Marketing/ADMIN_DESIGN_CUSTOMIZATION.md`
- `docs/developer-workflow/Marketing/PROMO_CODES_IMPLEMENTATION.md`
- `docs/developer-workflow/Orders/ADMIN_ORDERS_ENHANCEMENT_PLAN.md`
- `docs/developer-workflow/Orders/ORDER_SYSTEM_COMPLETE_REFERENCE.md`
- `docs/developer-workflow/Payments/PAYMENT_FULFILLMENT_FIXES_SUMMARY.md`
- `docs/developer-workflow/Payments/PaymentScenarios.md`
- `docs/developer-workflow/Payments/PaymentsManagment.md`
- `docs/developer-workflow/Payments/Payments-Review.md`
- `docs/developer-workflow/Spotlight/SPOTLIGHT_RELEASE_REVIEW.md`
- `docs/developer-workflow/Testing/E2E_SANDBOX_TESTING_GUIDE.md`
- `docs/developer-workflow/Users/UsersManagment.md`
- `docs/developer-workflow/Webhooks/webhooks.md`

Third-party/API docs:

- `docs/nowpayments-API-documentaion.md`
- `docs/resend-API-documentaion.md`
- `docs/Kinguin-eCommerce-API-master/README.md`
- `docs/Kinguin-eCommerce-API-master/Kinguin-API-Documentation.md`
- `docs/Kinguin-eCommerce-API-master/CHANGELOG.md`
- `docs/Kinguin-eCommerce-API-master/quickstart/README.md`
- `docs/Kinguin-eCommerce-API-master/api/README.md`
- `docs/Kinguin-eCommerce-API-master/api/ErrorsCodes.md`
- `docs/Kinguin-eCommerce-API-master/api/balance/v1/README.md`
- `docs/Kinguin-eCommerce-API-master/api/order/v1/README.md`
- `docs/Kinguin-eCommerce-API-master/api/order/v2/README.md`
- `docs/Kinguin-eCommerce-API-master/api/products/v1/README.md`
- `docs/Kinguin-eCommerce-API-master/api/products/v2/README.md`
- `docs/Kinguin-eCommerce-API-master/features/BuyingPreorders.md`
- `docs/Kinguin-eCommerce-API-master/features/ProductUpdates.md`
- `docs/Kinguin-eCommerce-API-master/features/README.md`
- `docs/Kinguin-eCommerce-API-master/features/ReturnKeys.md`
- `docs/Kinguin-eCommerce-API-master/features/StoreIpWhitelist.md`
- `docs/Kinguin-eCommerce-API-master/features/Webhooks.md`
- `docs/Kinguin-eCommerce-API-master/features/Wholesale.md`

Launch/ops docs:

- `docs/Pre-Launch/LAUNCH_CHECKLIST.md`
- `docs/Pre-Launch/LAUNCH_PREPARATION_GUIDE.md`
- `docs/Pre-Launch/cleanup_script.sql`

Product/catalog data docs:

- `docs/Products/Kinguin_Products_List.md`
- `docs/Products/playstation_700_ranked.md`
- `docs/Products/playstation_games_filteredall.md`
- `docs/Products/software.md`
- `docs/Products/software-ranked-by-sales.md`
- `docs/Products/subscriptions.md`
- `docs/Products/kinguin_playstation_products.csv`
- `docs/Products/kinguin_products_filtered_unique.csv`
- `docs/Products/kinguin_software_products.csv`
- `docs/Products/product-images-export.csv`
- `docs/Products/product-images-export.json`
- `docs/developer-workflow/bitloot-products-2026-02-24.csv`

## Data Assets Notes

- `docs/developer-workflow/bitloot-products-2026-02-24.csv` exports product
  rows with ID, title, slug, platform, category, genres, region, cost, price,
  source, delivery type, published/featured flags, Kinguin ID, and timestamps.
- `docs/Products/product-images-export.json` contains image export stats and
  image URLs for 1,584 products and 18,350 images.
- `docs/Products/product-images-export.csv` contains image rows by type, title,
  platform, and URL.
- `docs/Pre-Launch/cleanup_script.sql` is a destructive pre-production cleanup
  script. Do not run it against live production unless the user explicitly asks
  and the target database is verified.

## When Changing Code

- Read the relevant docs above and inspect the current code before editing.
- Keep changes narrowly scoped. This is a live production project.
- Preserve existing behavior unless the user requests a behavior change or a bug
  demands it.
- Add or update tests in proportion to risk.
- Regenerate SDK after backend API/DTO/controller changes.
- Run the smallest useful verification first; prefer `npm run type-check`,
  targeted tests, then broader `npm run quality:full` when practical.
- If you cannot run a verification command, tell the user exactly what was not
  run and why.
