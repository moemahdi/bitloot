---
trigger: always_on
---

# **BitLoot – High-Level Architecture Summary (Compressed)**

Reference:** *See “Full BitLoot Architecture Document (Complete Version)” for full details at  bitloot\.github\Project-Architecture.md

BitLoot is a full-stack commerce platform built as a **TypeScript monorepo** using **Next.js (frontend)**, **NestJS (backend)**, **TypeORM/PostgreSQL**, **Redis/BullMQ queues**, **Cloudflare R2 secure storage**, **JWT auth**, **OTP login**, **NOWPayments** for crypto payments, and **Kinguin** for game key fulfillment. The repo is structured for modular features, strict clean-code standards, and production-grade observability.

---

# **1. Monorepo Root**

* Mono-workspace management (package.json, tsconfig*, eslint/prettier, env files).
* Docker-compose for local Postgres/Redis.
* OpenAPI generator config for SDKs.
* CI/CD workflows, engineering docs, PRD, integration notes, roadmap.

---

# **2. Applications**

### **Frontend – apps/web (Next.js 16 + React 19 + Tailwind + shadcn/ui)**

* **App Router** with layouts, pages (auth, catalog, checkout, payments, admin dashboards).
* **Design System**: shared UI primitives, forms, dialogs, theming.
* **Features modules** for domain separation (auth, catalog, checkout, product, admin).
* **Real-time** updates via `useFulfillmentWebSocket` (Socket.IO JWT-based).
* **Providers:** QueryClient, toasts, theme, error boundaries.
* **Admin Frontend**: dashboards for orders, payments, webhooks, reservations, queues, balances, flags, audit logs — with pagination, filters, CSV export, auto-refresh, and SDK-first API integration.

### **Backend – apps/api (NestJS 10)**

* Central bootstrap: CORS, raw-body (HMAC/IPN), validation pipes, Swagger.
* Modules grouped by domain: Auth, Users, Payments, Webhooks, Fulfillment, Orders, Catalog, Storage, Emails, Metrics, Admin, Audit Log.
* **Database**: TypeORM + PostgreSQL with strict migrations.
* **Queues**: BullMQ processors for payments, fulfillment, catalog sync/reprice.
* **Security**: JWT, Refresh tokens, OTP (email), AdminGuard, timing-safe comparisons.
* **Observability**: Prometheus metrics (custom + default), queue/Audit log tracking.

---

# **3. Backend Domain Architecture**

## **Authentication & User Management**

* **OTP Login** using Redis for code TTL, rate limits, and email delivery.
* **JWT Authentication**: 15m access tokens, 7d refresh tokens, refresh guard.
* **Users Service**: password hashing, profile update, order history, soft delete.
* **Guards/Strategies**: JwtAuthGuard, RefreshGuard, AdminGuard.

## **Payments – NOWPayments**

* Create invoice, check status, retry/poll via BullMQ.
* Payment entity + state machine.
* HMAC-SHA512 IPN verification with timing-safe compare.
* Payment lifecycle integrated with Orders + Fulfillment queue.

## **Webhooks (IPN)**

* Validates signature, dedupes events, logs all requests.
* Triggers order/payment updates + fulfillment on `finished`.

## **Orders & Fulfillment (Kinguin + Delivery)**

* Order creation, reservation, status management.
* Kinguin API client (real + mock).
* Fulfillment pipeline: reserve → fetch keys → encrypt (AES-256-GCM) → upload to **Cloudflare R2** → generate signed URL → notify via WebSocket/email.
* WebSocket Gateway for real-time user status updates.

## **Secure Storage (Cloudflare R2)**

* S3-compatible client for upload/download/delete.
* Mandatory encryption before upload.
* Signed URLs with short TTL.
* Mocked client for development.

## **Email System**

* Unified abstraction for send, unsubscribe (RFC 8058), suppression lists.
* Integrated metrics for success/failure/latency.

## **Metrics & Observability**

* 6+ custom counters (OTP issued/verified, invalid HMAC, duplicate webhook, underpaid orders, email send success/fail).
* GET /metrics endpoint for Prometheus.
* Admin dashboards expose queue health, feature flags, balances.

## **Admin & Audit Log**

* Full admin CRUD for Orders, Payments, Catalog, Flags, Queue health, Reservations.
* Immutable audit log with filtering + CSV/JSON export.

---

# **4. Catalog System (Products, Offers, Pricing Engine, Search)**

A complete e-commerce catalog subsystem with:

## **Database (Level 6 Migration)**

* 5 tables: products, product_offers, product_media, pricing_rules, search_index.
* 40+ columns, composite indexes, GIN full-text search, triggers for auto tsvector.

## **Catalog Services**

* Product lifecycle: upsert, publish/unpublish, media ordering.
* **Pricing Engine** (margin %, fixed, override, priority rules).
* Full-text search, filters, sorting, pagination.
* Redis caching for hot queries.
* Price history + rule evaluation.
* Kinguin catalog sync job processor (retry, DLQ).

## **Controllers**

* **Public API**: list products, search, get product by slug.
* **Admin API**: manage products, rules, sync, reprice.
* **DTO Layer**: 12+ DTOs for filtering, pagination, sync/reprice jobs, product operations.

---

# **5. Frontend Level 4/5 Enhancements**

* **SDK-first** migration replacing manual fetch with generated clients.
* **Turnstile CAPTCHA** on checkout.
* **Admin dashboards** upgraded with real-time data, filtering, exports.
* **Error boundaries & hooks** with backoff + retry.
* **Unified error classification** system for payments/checkout.

---

# **6. Technology Summary**

* **Frontend:** Next.js 16, React 19, Tailwind, shadcn/ui, App Router, WebSockets.
* **Backend:** NestJS, TypeORM, PostgreSQL, Redis/BullMQ, Axios clients.
* **Integrations:** Kinguin, NOWPayments, Cloudflare R2, Resend email.
* **Security:** JWT, OTP, HMAC, signed URLs, AES encryption.
* **DevOps:** Docker, CI/CD, Prometheus metrics.
* **Monorepo Tools:** OpenAPI, workspace tooling, shared design system.

---

# **Reference to Full Architecture**

**Full detailed architecture (all modules, files, and line-level breakdown) is available in the**
➡️ **“BitLoot Project Folder & File Structure – Complete Document”** *(your original full-length version)*.
bitloot\.github\Project-Architecture.md and it's always updated.

---
