# BitLoot Project Folder & File Structure

This document describes the current BitLoot monorepo structure, with a concise 1–2 sentence purpose for each folder and file. It reflects the actual Next.js web app, NestJS API, TypeORM/PostgreSQL, Redis/BullMQ queues, NOWPayments and Kinguin integrations, JWT auth, email service, and Cloudflare R2 secure storage with signed URLs.

## Monorepo Root
- **package.json** — Monorepo root manifest with workspaces (`apps/*`, `packages/*`), dev/build/lint/test scripts, and shared dependencies.
- **package-lock.json** — Deterministic dependency lockfile for reproducible installs.
- **tsconfig.json** — Composite TypeScript project configuration pointing to `tsconfig.base.json` and project references.
- **tsconfig.base.json** — Base TypeScript options shared across workspaces (module/target, strictness, path aliases).
- **eslint.config.mjs** — Root ESLint configuration and quality rules shared across packages.
- **.prettierrc / .prettierignore** — Prettier formatting configuration and ignore patterns.
- **.eslintignore** — Global lint ignore list (e.g., build artifacts and vendor folders).
- **.editorconfig** — Editor normalization for whitespace, newlines, and charset.
- **.nvmrc** — Node version pin for consistent local and CI environments.
- **.gitignore** — VCS ignore patterns for node_modules, builds, env files, etc.
- **.env / .env.example** — Runtime configuration (example includes API/DB/Redis, R2, NOWPayments, Kinguin, Resend). The `.env` file is local-only and should never be committed.
- **openapitools.json** — OpenAPI generator config used by the SDK package.
- **docker-compose.yml** — Local services stack for Postgres and Redis with health checks and persistent volumes.
- **README.md** — Project overview and quickstart information.

## CI/CD & Docs
- **.github/** — GitHub workflows and engineering docs.
  - **workflows/ci.yml** — Continuous integration pipeline (lint, type-check, tests, build).
  - **BitLoot-Code-Standards.md / BitLoot-Checklists-Patterns.md** — Development standards and checklists.
  - **copilot-instructions.md** — AI coding assistant guidelines for this repo.
- **docs/** — Product and engineering documentation.
  - **PRD.md, project-description.md** — Product requirements and descriptive docs.
  - **kinguin-*.md, nowpayments-*.md, resend-*.md** — Integration notes and API documentation.
  - **developer-roadmap/** — Multi-level roadmap and milestones.
  - **developer-workflow/** — Step-by-step workflow and phase-based guides.

## Applications
- **apps/** — First-party applications.

### Frontend: apps/web (Next.js 16, React 19)
- **apps/web/package.json** — Web app scripts (dev/build/start), Next lint, React 19/Next 16 dependencies.
- **apps/web/next.config.mjs** — Next.js config with React Compiler enabled; references local `tsconfig.json`.
- **apps/web/eslint.config.mjs** — Frontend ESLint with React/Next/TypeScript rules and runtime-safety checks.
- **apps/web/tailwind.config.ts** — Tailwind setup scanning `app/`, `design-system/`, `features/`, and `lib/` paths.
- **apps/web/postcss.config.mjs** — PostCSS pipeline with Tailwind plugin.
- **apps/web/tsconfig.json** — TypeScript config with `@/*` alias to `src/` and Next.js plugin.
- **apps/web/public/** — Static assets and PWA manifest.
  - **manifest.json** — PWA metadata (name, icons, theme) for installable web app.
  - **icon.svg** — App icon used in PWA and metadata.
- **apps/web/components.json** — shadcn/ui registry config, CSS paths, and alias mapping for design system.
- **apps/web/src/** — Application source code organized by App Router, features, hooks, lib, and design-system.
  - **app/** — App Router routes, layouts, and pages.
    - **layout.tsx** — Root UI layout and providers composition.
    - **page.tsx** — Landing page route entry.
    - **admin/** — Admin pages (e.g., dashboards) built on App Router.
    - **orders/** — Customer order views.
    - **pay/** — Payment initiation/redirect handling pages.
    - **product/** — Product detail pages.
  - **features/** — Feature-focused modules for clear domain boundaries.
    - **account/** — Placeholder for account/profile flows.
    - **admin/** — Placeholder for admin feature flows.
    - **auth/** — Placeholder for auth UX (JWT-ready; OTP UI primitives available).
    - **catalog/** — Placeholder for browsing/catalog flows.
    - **checkout/** — Checkout UI and logic.
      - **CheckoutForm.tsx** — Customer checkout form integrating with SDK/API for order/payment creation.
    - **product/** — Placeholder for product list/detail logic.
  - **hooks/** — Reusable client hooks.
    - **useFulfillmentWebSocket.ts** — Real-time order updates via Socket.IO using JWT; replaces polling and streams payment/fulfillment/key-delivery events.
  - **lib/** — Client-side utilities and providers.
    - **providers.tsx** — Global providers (e.g., QueryClient, theme, toasts) wired into App Router layout.
  - **design-system/** — Centralized UI primitives and styling (shadcn/ui based).
    - **primitives/** — Reusable components (buttons, forms, dialogs, input-otp, etc.); strongly typed and themeable.
    - **hooks/** — UI-specific hooks supporting primitives.
    - **styles/** — Global Tailwind/CSS theme tokens and variables.
    - **utils/** — Style and class utilities.

### Backend: apps/api (NestJS 10)
- **apps/api/package.json** — API scripts (start/build, `start:dev` with watch) and test setup.
- **apps/api/tsconfig.json** — API TypeScript configuration with path-mapped module resolution.
- **apps/api/eslint.config.mjs** — API-specific ESLint configuration and test overrides.
- **apps/api/src/main.ts** — Nest bootstrap: CORS, JSON/urlencoded parsers, raw-body capture for HMAC verification, global validation pipes, and Swagger at `/api/docs`.
- **apps/api/src/app.module.ts** — Root module wiring Config, TypeORM (`synchronize: false`), BullMQ queues, entities, and feature modules (Webhooks, Admin, Fulfillment/WebSocket, Kinguin). Registers services and NOWPayments/R2 client factories.

#### API: Common & Config
- **apps/api/src/common/** — Cross-cutting infrastructure (guards, interceptors, filters, DTO infrastructure).
  - **guards/admin.guard.ts** — Ensures admin-only access based on JWT role claims.
- **apps/api/src/health/health.controller.ts** — Lightweight liveness/readiness endpoints for orchestration/monitoring.
- **apps/api/src/config/** — Placeholder for centralized typed config schemas and loaders (ENV-driven).

#### API: Database (PostgreSQL + TypeORM)
- **apps/api/src/database/data-source.ts** — TypeORM `DataSource` configured from `.env`; registers entities and ordered migrations; `synchronize: false` to protect schema.
- **apps/api/src/database/entities/webhook-log.entity.ts** — Persistent webhook audit log (source, processed status, signature validity, errors).
- **apps/api/src/database/migrations/** — Versioned schema migrations (idempotent, ordered).
  - **1710000000000-InitOrders.ts** — Initial orders, items, and key-related tables.
  - **1720000000000-add-keys-reservation.ts** — Key reservation schema updates.
  - **1730000000001-CreatePayments.ts** — Payments table for NOWPayments tracking and reconciliation.
  - **1730000000002-CreateWebhookLogs.ts** — Webhook log storage for audit and replay.
  - **1730000000003-UpdateOrdersStatusEnum.ts** — Order status enum refinement.

#### API: Asynchronous Processing (Redis + BullMQ)
- **apps/api/src/jobs/queues.ts** — Central BullMQ config (Redis URL, default job options) and named queues (`payments-queue`, `fulfillment-queue`, DLQ) plus typed job payloads.
- **apps/api/src/jobs/payment-processor.service.ts** — Consumer/processor orchestrating NOWPayments polling and state transitions.
- **apps/api/src/jobs/fulfillment.processor.ts** — Consumer/processor for fulfillment pipeline and key delivery orchestration.
- **apps/api/src/jobs/dlq-handler.service.ts** — Dead-letter queue processing/alerting for failed jobs and retries.

#### API: Auth & Security
- **apps/api/src/modules/auth/auth.module.ts** — JWT-based authentication module using Passport; central JWT signing/verification with 24h expiry.
- **apps/api/src/modules/auth/guards/jwt-auth.guard.ts** — Guard that enforces JWT validation for routes and WebSocket gateways.
- **apps/api/src/modules/auth/strategies/jwt.strategy.ts** — JWT strategy (Bearer header / query token) validating signature/expiration and attaching user claims.
- Note: OTP flows are not currently implemented server-side; frontend provides `input-otp` primitive for UX, and OTP can be added as a future module under `modules/auth/otp/`.

#### API: Payments (NOWPayments)
- **apps/api/src/modules/payments/payments.controller.ts** — REST endpoints to initiate payments and retrieve statuses.
- **apps/api/src/modules/payments/payments.service.ts** — Business logic for payment lifecycle and queueing follow-ups.
- **apps/api/src/modules/payments/payment.entity.ts** — TypeORM entity for persisted payment state.
- **apps/api/src/modules/payments/payment-state-machine.ts** — Declarative state transitions for payment statuses.
- **apps/api/src/modules/payments/hmac-verification.util.ts** — HMAC-SHA512 verification utilities for IPN authenticity and timing-safe comparisons.
- **apps/api/src/modules/payments/nowpayments.client.ts** — Typed NOWPayments client (Axios) for invoices, statuses, currencies, and health checks.

#### API: Webhooks (NOWPayments IPN)
- **apps/api/src/modules/webhooks/webhooks.module.ts** — Webhooks module exposing IPN endpoints and admin listing.
- **apps/api/src/modules/webhooks/ipn-handler.controller.ts** — IPN endpoint that extracts signature header and delegates to service; always 200 OK to avoid retries.
- **apps/api/src/modules/webhooks/ipn-handler.service.ts** — Validates HMAC, deduplicates events, updates orders/payments, and queues fulfillment on `finished`.
- **apps/api/src/modules/webhooks/dto/nowpayments-ipn.dto.ts** — DTOs for typed request/response validation and Swagger documentation.

#### API: Fulfillment (Kinguin + Delivery)
- **apps/api/src/modules/fulfillment/fulfillment.module.ts** — Orchestrates reservation→delivery→encryption→R2 upload→signed URL generation; wires Kinguin and R2 clients.
- **apps/api/src/modules/fulfillment/fulfillment.controller.ts** — Fulfillment endpoints for triggering/retrying delivery and admin operations.
- **apps/api/src/modules/fulfillment/fulfillment.service.ts** — Core orchestration logic; interacts with orders, Kinguin, storage, and email notification.
- **apps/api/src/modules/fulfillment/fulfillment.gateway.ts** — WebSocket gateway (namespace "/fulfillment") broadcasting status/job/key-delivery events to authenticated clients.
- **apps/api/src/modules/fulfillment/websocket.module.ts** — Gateway module with JWT for auth; exports the gateway for cross-module usage.
- **apps/api/src/modules/fulfillment/kinguin.client.ts** — Typed Kinguin API client (Axios) for order creation/status/key retrieval with robust error messages.
- **apps/api/src/modules/fulfillment/kinguin.mock.ts** — Mocked Kinguin client for development/testing to avoid external calls and costs.
- **apps/api/src/modules/fulfillment/delivery.service.ts** — Delivery workflow: confirms key readiness, stores encrypted keys, and prepares customer handoff.
- **apps/api/src/modules/fulfillment/dto/** — DTOs for fulfillment commands and event payloads.
- **apps/api/src/modules/kinguin/** — Public Kinguin-facing controller/service for admin/testing and documentation alignment.

#### API: Orders & Admin
- **apps/api/src/modules/orders/order.entity.ts** — Order aggregate root (status, items, totals, relations).
- **apps/api/src/modules/orders/order-item.entity.ts** — Line items for orders with product/quantity links.
- **apps/api/src/modules/orders/key.entity.ts** — Reserved/fulfilled keys associated with order items.
- **apps/api/src/modules/orders/orders.controller.ts** — Order management endpoints.
- **apps/api/src/modules/orders/orders.service.ts** — Business logic for order creation, reservation, and updates.
- **apps/api/src/modules/admin/** — Admin controller/service for operational tasks, dashboards, and admin-only routes.

#### API: Storage (Cloudflare R2 + Signed URLs + Encryption)
- **apps/api/src/modules/storage/r2.client.ts** — S3-compatible client for Cloudflare R2 with upload, signed URL generation, deletion, and health checks.
- **apps/api/src/modules/storage/encryption.util.ts** — AES-256-GCM utilities (generate key, encrypt, decrypt) used before storage.
- **apps/api/src/modules/storage/storage.service.ts** — High-level service: encrypts keys, uploads to R2, issues short-lived signed URLs, and audits access.
- **apps/api/src/modules/storage/r2-storage.mock.ts** — Mock R2 client for local/test environments when credentials are absent.

#### API: Emails
- **apps/api/src/modules/emails/emails.service.ts** — Email notifications abstraction (mocked now; integrates with Resend in production) for sending order-ready links.

## Shared Packages
- **packages/** — Cross-application packages.
  - **sdk/** — TypeScript fetch SDK generated from API OpenAPI.
    - **package.json** — SDK scripts including `generate` (points to `http://localhost:4000/api/docs-json`) and `build`.
    - **openapi-config.yaml / openapitools.json** — Generator settings for consistent output.
    - **fix-sdk-runtime.js / fix-generated.sh** — Post-generation patches to ensure runtime/typing compatibility in Next.
    - **src/index.ts** — SDK exports (`export * from './generated'`), version, and `API_BASE` for web consumption.
    - **src/generated/** — OpenAPI generated clients and models. These are auto-generated; do not hand-edit.

## Scripts & Quality Gates
- **scripts/** — Project automation and quality scripts.
  - **quality-check.js / quality-check.sh** — Aggregated quality gates: type-check, lint, test, and build.
  - **e2e/** — End-to-end testing guides and unified curl/test scripts for Kinguin and payment flows.

## Local Infrastructure (docker-compose)
- **services: db (Postgres 16)** — Exposes `5432`, persists data via `db_data` volume, and includes health checks. Use `DATABASE_URL` in `.env` to connect.
- **services: redis (Redis 7)** — Exposes `6379`, AOF enabled, persists via `redis_data` volume with health checks. Used by BullMQ queues.
- **volumes: db_data, redis_data** — Persistent volumes to retain state across restarts.
- **networks: bitloot** — Local bridge network for inter-service communication.

## Environment Variables (from .env.example)
- **API_PORT** — API HTTP port (default 4000).
- **DATABASE_URL** — Postgres connection URL for TypeORM.
- **REDIS_URL** — Redis connection URL used by BullMQ.
- **JWT_SECRET / REFRESH_TOKEN_SECRET** — Token signing secrets; set strong values in production.
- **CORS_ORIGIN** — Allowed origins for CORS (comma-separated); defaults to `http://localhost:3000`.
- **R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_ENDPOINT** — Cloudflare R2 credentials and target bucket for secure key storage.
- **RESEND_API_KEY / EMAIL_FROM** — Email provider credentials and default sender.
- **NOWPAYMENTS_API_KEY / NOWPAYMENTS_IPN_SECRET / NOWPAYMENTS_BASE / NOWPAYMENTS_CALLBACK_URL** — NOWPayments API and IPN settings (use sandbox for dev).
- **KINGUIN_API_KEY / KINGUIN_BASE_URL / KINGUIN_WEBHOOK_SECRET** — Kinguin API credentials and webhook secret for validation.
- **NODE_ENV** — Runtime environment (`development`, `test`, `production`).

## Communication & Realtime
- **WebSockets (Socket.IO, namespace "/fulfillment")** — Clients authenticate with JWT (handshake `auth.token`) and subscribe to order updates; gateway emits `payment:confirmed`, `fulfillment:status-change`, `fulfillment:key-delivered`, and admin events.
- **Frontend Hook (`useFulfillmentWebSocket.ts`)** — Provides a typed React hook to manage connection, subscriptions, events, errors, and reconnection strategies, replacing REST polling.

## Security & Compliance Highlights
- **JWT Auth Everywhere** — Guards and strategies protect HTTP routes and WebSocket connections; tokens signed with `JWT_SECRET` and 24h expiry.
- **HMAC-Verified Webhooks** — NOWPayments IPN verified with SHA512 HMAC using `NOWPAYMENTS_IPN_SECRET`; raw-body capture ensures canonical signature verification.
- **Principle of Least Privilege** — Cloudflare R2 access via limited keys; signed URLs are short-lived and never email plaintext keys.
- **TypeORM `synchronize: false`** — Schema changes are applied via audited migrations for safety and traceability.
- **Dead-letter Queues** — Failed jobs flow to DLQ for analysis; processors implement retry/backoff to reduce flakiness.

## Notes
- **Users/Products Modules** — Present as placeholders and can be expanded with proper entities/services/controllers.
- **Observability** — Queue and webhook events are structured; consider central logging/metrics (e.g., OpenTelemetry) for production.