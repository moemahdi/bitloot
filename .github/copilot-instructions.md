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

***

## Documentation Reference & Implementation

**Start Here:**
- **[PRD.md](../docs/PRD.md)** — BitLoot's Product Requirements Document. Defines goals, features, user flows, acceptance criteria, and technical requirements. Reference for all product scope questions.
- **[project-description.md](../docs/project-description.md)** — High-level project overview, core value proposition, feature breakdown, tech stack, end-to-end flow, and target users. Read first for context.

**Project Structure & Architecture:**
- **[Project-Architecture.md](Project-Architecture.md)** — Complete monorepo folder and file structure with detailed purpose descriptions for every module, entity, controller, service, migration, and configuration file. Essential reference when navigating the codebase or understanding where to add new features.

**Code Standards & Implementation** _(🔴 AI MUST LOAD & FOLLOW ALWAYS when generating code)_

_⚠️ MANDATORY: These docs establish BitLoot's authoritative engineering standards. AI agents MUST reference these in EVERY chat where code is being generated. No exceptions._
- **[BitLoot-Code-Standards.md](./BitLoot-Code-Standards.md)** — Complete authoritative code standards covering TypeScript strict mode, ESLint runtime-safety rules, backend patterns (entities, DTOs, services, controllers, webhooks), frontend patterns (SDK clients, forms, hooks), security standards, database rules, and async queue patterns. Use as the source of truth for all implementation decisions.
- **[BitLoot-Checklists-Patterns.md](./BitLoot-Checklists-Patterns.md)** — Practical implementation checklists and 10 copy-paste code templates: Entity Checklist, DTO Checklist, Service Checklist, Controller Checklist, Webhook Checklist, Frontend Query Checklist, Frontend Form Checklist, HMAC Verification Checklist, OTP Pattern, Queue Processor Pattern. Reference these templates as starting points for every new feature.

**Frontend Development & Design:**
- **[design-system.md](../docs/design-system.md)** — Complete Shadcn/UI setup with 46 components, Tailwind v4 configuration, Vercel OKLch theme, dark mode, and styling guidelines. Use for all UI/UX development and component usage.

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

Complete integration of NOWPayments crypto payments, webhook security, async job processing, and admin dashboards. Organized into 5 phases:

**Phase 1 — Database Foundation:**
- **01_LEVEL_2_PHASE1_PROGRESS.md: See `docs/LEVEL_2_PHASE1_PROGRESS.md`** — Phase 1 progress and planning.
- **02_LEVEL_2_PHASE1_COMPLETE.md: See `docs/LEVEL_2_PHASE1_COMPLETE.md`** — Payment and webhook log entities, migrations, indexes.
- **03_LEVEL_2_PHASE1_SUMMARY.md: See `docs/LEVEL_2_PHASE1_SUMMARY.md`** — Phase 1 completion summary (7/7 tasks).

**Phase 2 — Payment Integration:**
- **01_LEVEL_2_PHASE2_PROGRESS.md: See `docs/LEVEL_2_PHASE2_PROGRESS.md`** — Payment service and HMAC verification implementation.
- **02_LEVEL_2_PHASE2_FINAL.md: See `docs/LEVEL_2_PHASE2_FINAL.md`** — Final Phase 2 status with 39/39 tests passing, IPN handler, webhooks.

**Phase 3 — Webhook Security:**
- **01_LEVEL_2_PHASE3_PLAN.md: See `docs/LEVEL_2_PHASE3_PLAN.md`** — Webhook security architecture and planning.
- **02_LEVEL_2_PHASE3_ARCHITECTURE.md: See `docs/LEVEL_2_PHASE3_ARCHITECTURE.md`** — HMAC verification, idempotency, state machine design.
- **03_LEVEL_2_PHASE3_IMPLEMENTATION_CHECKLIST.md: See `docs/LEVEL_2_PHASE3_IMPLEMENTATION_CHECKLIST.md`** — 8 webhook security implementation tasks.
- **04_LEVEL_2_PHASE3_QUICK_START.md: See `docs/LEVEL_2_PHASE3_QUICK_START.md`** — Quick start for webhook setup.
- **05_LEVEL_2_PHASE3_KICKOFF_SUMMARY.md: See `docs/LEVEL_2_PHASE3_KICKOFF_SUMMARY.md`** — Phase 3 kickoff overview.
- **06_LEVEL_2_PHASE3_PROGRESS_1.md: See `docs/LEVEL_2_PHASE3_PROGRESS_1.md`** — Initial implementation progress.
- **07_LEVEL_2_PHASE3_PROGRESS_2.md: See `docs/LEVEL_2_PHASE3_PROGRESS_2.md`** — Final implementation progress.
- **08_LEVEL_2_PHASE3_COMPLETE.md: See `docs/LEVEL_2_PHASE3_COMPLETE.md`** — Phase 3 completion (8/8 tasks, HMAC verified, idempotency enforced).
- **09_LEVEL_2_PHASE3_CODE_REVIEW.md: See `docs/LEVEL_2_PHASE3_CODE_REVIEW.md`** — Comprehensive security code review and sign-off.

**Phase 4 — Async Processing with BullMQ:**
- **01_L2_PHASE_4_TEST_COMPLETION.md: See `docs/LEVEL_2_PHASE_4_TEST_COMPLETION.md`** — Test suite execution and validation.
- **02_L2_PHASE_4_TASK_8_ASYNC_ENDPOINTS.md: See `docs/LEVEL_2_PHASE_4_TASK_8_ASYNC_ENDPOINTS.md`** — Async payment endpoints implementation.
- **03_L2_PHASE_4_TASK_9_FRONTEND_POLLING.md: See `docs/LEVEL_2_PHASE_4_TASK_9_FRONTEND_POLLING.md`** — Frontend job status polling UI.
- **04_L2_PHASE_4_TASK_10_QUALITY_GATES.md: See `docs/LEVEL_2_PHASE_4_TASK_10_QUALITY_GATES.md`** — All 5 quality gates verification (Type, Lint, Format, Test, Build).
- **05_L2_PHASE4_COMPLETE.md: See `docs/LEVEL_2_PHASE4_COMPLETE.md`** — Phase 4 completion with BullMQ queue setup.

**Phase 5 — E2E Testing & Admin Dashboards:**
- **01_L2_PHASE5_START.md: See `docs/LEVEL_2_PHASE5_START.md`** — Phase 5 kickoff for E2E testing and admin features.
- **02_L2_PHASE5_TASK2_COMPLETE.md: See `docs/LEVEL_2_PHASE5_TASK2_COMPLETE.md`** — Admin payment dashboard implementation.
- **03_L2_PHASE5_TASK3_COMPLETE.md: See `docs/LEVEL_2_PHASE5_TASK3_COMPLETE.md`** — Webhook log viewer implementation.
- **04_L2_PHASE5_PROGRESS.md: See `docs/LEVEL_2_PHASE5_PROGRESS.md`** — Mid-phase progress checkpoint.
- **04_L2_PHASE5_TASK4_COMPLETE.md: See `docs/LEVEL_2_PHASE5_TASK4_COMPLETE.md`** — Reports page implementation.
- **05_L2_PHASE5_TASK5_COMPLETE.md: See `docs/LEVEL_2_PHASE5_TASK5_COMPLETE.md`** — Ngrok tunneling setup for local webhook testing.
- **06_L2_PHASE5_TASK6_COMPLETE.md: See `docs/LEVEL_2_PHASE5_TASK6_COMPLETE.md`** — E2E IPN simulation and testing.
- **07_L2_PHASE5_TASK7_NGROK_SETUP_COMPLETE.md: See `docs/LEVEL_2_PHASE5_TASK7_NGROK_SETUP_COMPLETE.md`** — Ngrok production integration.
- **08_L2_PHASE5_TASK8_E2E_TESTING_GUIDE.md: See `docs/LEVEL_2_PHASE5_TASK8_E2E_TESTING_GUIDE.md`** — Complete E2E testing guide with curl commands.
- **09_L2_PHASE5_OTHER_TASKS_COMPLETE.md: See `docs/LEVEL_2_PHASE5_OTHER_TASKS_COMPLETE.md`** — Frontend and miscellaneous tasks finalized.
- **10_L2_PHASE5_PHASE5_COMPLETE.md: See `docs/LEVEL_2_PHASE5_PHASE5_COMPLETE.md`** — Phase 5 final completion (25/25 tasks).

**Level 2 Executive Summary:**
- **[LEVEL_2_FINAL_COMPLETION_STATUS.md](../docs/developer-workflow/02-Level/LEVEL_2_FINAL_COMPLETION_STATUS.md)** — Executive summary: 56/56 tasks complete, 5/5 quality gates passing, 198/198 tests passing, production-ready.

#### Level 3 — Kinguin Integration & Real Fulfillment ✅ **COMPLETE** (21 Core Tasks)

Advanced fulfillment with Kinguin API, encrypted key storage, WebSocket real-time updates, and admin features. Includes 13 comprehensive documentation files:

- **01_L3_EXECUTION_PLAN.md: See `docs/LEVEL_3_EXECUTION_PLAN.md`** — 44-task implementation roadmap with dependency graph.
- **02_L3_PHASE1_DATABASE_FOUNDATION_COMPLETE.md: See `docs/LEVEL_3_PHASE1_DATABASE_FOUNDATION_COMPLETE.md`** — Database schema for Kinguin integration.
- **03_L3_PHASE2_KINGUIN_INTEGRATION_COMPLETE.md: See `docs/LEVEL_3_PHASE2_KINGUIN_INTEGRATION_COMPLETE.md`** — Kinguin API client and integration.
- **04_L3_PHASE3_FULFILLMENT_COMPLETE.md: See `docs/LEVEL_3_PHASE3_FULFILLMENT_COMPLETE.md`** — Fulfillment orchestration and key delivery.
- **05_L3_PHASE4_FULFILLMENT_PROCESSOR_FIXED.md: See `docs/LEVEL_3_PHASE4_FULFILLMENT_PROCESSOR_FIXED.md`** — BullMQ processor fixes and optimization.
- **06_L3_JWT_AUTHENTICATION.md: See `docs/LEVEL_3_JWT_AUTHENTICATION.md`** — JWT authentication layer implementation.
- **07_L3_WEBSOCKET_IMPLEMENTATION_GUIDE.md: See `docs/LEVEL_3_WEBSOCKET_IMPLEMENTATION_GUIDE.md`** — Real-time WebSocket updates (90% load reduction vs polling).
- **08_L3_PHASE7-ADMIN-API-CHANGES.md: See `docs/LEVEL_3_PHASE7-ADMIN-API-CHANGES.md`** — Admin API updates and integration fixes.
- **08_L3_REMAINING_PHASES_PLAN.md: See `docs/LEVEL_3_REMAINING_PHASES_PLAN.md`** — Technical roadmap for Phases 4-13 (1,233 lines of specifications).
- **09_L3_E2E_SUCCESS_TESTING.md: See `docs/LEVEL_3_E2E_SUCCESS_TESTING.md`** — E2E testing guide and verification.
- **[LEVEL_3_COMPREHENSIVE_FINAL_REPORT.md](../docs/developer-workflow/03-Level/LEVEL_3_COMPREHENSIVE_FINAL_REPORT.md)** — Complete Level 3 summary with 209+ tests passing, 0 errors.

### Workflow Characteristics

**Each Level Includes:**
- ✅ Complete vertical implementation (UI, API, database, security)
- ✅ Full test coverage (unit, integration, E2E)
- ✅ 5/5 quality gates passing (type-check, lint, format, test, build)
- ✅ Comprehensive documentation for every phase
- ✅ Zero errors or warnings
- ✅ Production-ready code

**Progressive Dependencies:**
- Level 1 depends on Level 0 ✅
- Level 2 depends on Level 0 + Level 1 ✅
- Level 3 depends on Level 0 + Level 1 + Level 2 ✅

**Total Documentation:**
- 40+ comprehensive workflow documents
- 7,500+ lines of technical specifications
- Multiple phases per level with detailed progress tracking
- Executive summaries for quick reference

### Quality & Verification

Every level includes:
- **Completion Checklists**: Verify all tasks done
- **Quality Gates**: Type-check, lint, format, test, build (all must pass)
- **E2E Testing**: Full workflow validation
- **Executive Summaries**: Quick overview of achievements
- **Roadmaps**: Clear path to next level

This vertical slices + progressive levels approach ensures BitLoot is continuously deployable, maintainable, and secure at every stage of development.

***

***

## Completed Levels (0-3)

✅ **Level 0 — Workshop Setup:** Monorepo, Docker infrastructure, strict TypeScript + ESLint, CI/CD pipeline  
✅ **Level 1 — Walking Skeleton:** MVP with fake payments, fake fulfillment, R2 signed links, Resend emails  
✅ **Level 2 — Real Payments:** NOWPayments sandbox integration, HMAC webhook verification, idempotency, state machine, async BullMQ jobs  
✅ **Level 3 — Real Fulfillment:** Kinguin API integration, order reservation/delivery, AES-256-GCM encryption, WebSocket real-time updates, admin dashboards  

_All Level 0-3 documentation available in `docs/developer-workflow/0-3-Levels/`_

***

## Upcoming Levels (4-8) — Short Overview

**Level 4 — Security & Observability** _(In Progress/Roadmap)_  
- OTP login (6-digit, Redis TTL, rate limits)  
- WAF + CAPTCHA for abuse prevention  
- Structured logging and alerting infrastructure  
- Sentry/DataDog integration for error tracking  
- See: `docs/developer-roadmap/04-Level.md`

**Level 5 — Admin & Ops UI + Monitoring** _(Planned)_  
- RBAC (user/admin roles) with JWT guards  
- Core admin tables: Orders, Payments, Webhooks, Reservations (filters, pagination ≤100)  
- BullMQ queue dashboard, balance monitoring, config flags  
- Prometheus metrics exposure, queue/webhook health  
- Database backups (nightly `pg_dump` to R2), restore runbooks  
- CSV/JSON exports and audit logs  
- See: `docs/developer-roadmap/05-Level.md`

**Level 6 — Products & Catalog Management** _(Planned)_  
- Database schema: products, offers, categories, media, pricing rules  
- Kinguin catalog sync (BullMQ job, idempotent upserts)  
- Dynamic pricing layer (margin %, floor/cap, override rules)  
- Postgres `tsvector` search + Redis caching for hot lists  
- Public API: paginated list/detail with filters  
- Admin UI: product editor, pricing rules, manual sync, bulk publish/unpublish  
- See: `docs/developer-roadmap/06-Level.md`

**Level 7 — Marketing & Emails** _(Planned)_  
- Resend campaign infrastructure (scheduled, segmented, measurable)  
- Referral codes (per-user, attribution tracking, anti-abuse)  
- Promo codes (fixed/% discounts, validity, stacking rules, usage caps)  
- Email events, subscriber management, one-click unsubscribe  
- Admin campaign composer, audience builder, schedule/send  
- Link tracking redirector (`/m/c/:messageId/:slug`), unsubscribe flow  
- See: `docs/developer-roadmap/07-Level.md`

**Level 8 — Analytics & AI (Diagnostic + Predictive Dashboards)** _(Planned)_  
- Append-only `analytics_events` + rollup tables (daily_kpis, product_kpis, cohorts, funnels, rfm_scores)  
- ETL jobs (hourly/daily materializations, idempotent upserts)  
- Diagnostic dashboards: Revenue, AOV, conversion, retention, cohort analysis, top products, underpayment rate  
- Predictive: 7-day revenue/order forecast (moving averages baseline), anomaly detection, churn/propensity scoring  
- Recharts-based admin UI, JSON APIs, CSV exports  
- Privacy-first (no PII, hashed keys if needed)  
- See: `docs/developer-roadmap/08-Level.md`

_Full roadmap rationale, dependencies, and task-by-task breakdowns available in `docs/developer-roadmap/` directory_

***


**Third-Party Integration API Docs** _(Reference only when working on that specific integration)_

_⚠️ AI Agent Note: Do NOT load these integration docs in every chat unless the current task explicitly involves that API integration._
- **nowpayments-API-documentaion.md: See `docs/nowpayments-API-documentaion.md`** — Crypto payment gateway API for creating payments, handling IPN callbacks, and processing transactions. Load only when working on payment flows.
- **kinguin-API-documentation-summary.md: See `docs/kinguin-API-documentation-summary.md`** — Kinguin Sales Manager API quick reference for product sync, stock models, and order fulfillment. Load only when working on fulfillment.
- **kinguin-API-documentation.md: See `docs/kinguin-API-documentation.md`** — Full Kinguin API documentation with fee structure and features. Load only when needed for Kinguin integration.
- **kinguin-technical-documentation.md: See `docs/kinguin-technical-documentation.md`** — OpenAPI spec and technical details for Kinguin endpoints. Load only when implementing Kinguin API calls.
- **resend-API-documentaion.md: See `docs/resend-API-documentaion.md`** — Email service API for OTP, password reset, transactional, and promotional emails. Load only when working on email features.
- **tawk-integration.md: See `docs/tawk-integration.md`** — Live chat widget setup and configuration for customer support. Load only when working on chat features.


***

## Golden Rules (Non-Negotiable)

1. **SDK-first:** Only BitLoot’s generated SDK client talks to the backend; never invoke 3rd-party APIs (NOWPayments, Kinguin, Resend) from frontend.
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
npm run sdk:gen           # Regenerate SDK after API updates
npm run quality:full      # Format, lint, type-check, test, build (all must pass!)
```

***

## BitLoot-Specific Best Practices

- Never send/display keys except via signed links with fast expiry.
- Only use SDK—no direct third-party calls or raw secret handling in frontend.
- Webhooks and IPN must always be verified, idempotent, logged, and retried if necessary.

***

***

## AI Agent Guidance

Always use this document's context, follow all security and architectural rules, consult referenced documentation for specifics, and structure responses per template, citing direct commands/code patterns when useful for implementation. Never violate non-negotiable rules, prioritize security, type safety, SDK-first design, and robust queue/idempotency for side effects. 

This unified, updated summary ensures context-rich, production-grade, and safe engineering answers for any BitLoot-related development task or question.