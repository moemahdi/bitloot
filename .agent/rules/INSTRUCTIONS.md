---
trigger: always_on
---

# **BitLoot — Ultra-Condensed Engineering Summary**

This is a summerized version of beast\bitloot\.github\copilot-instructions.md file that will always updated frequently for latest version make sure to read bitloot\.github\copilot-instructions.md

## **What BitLoot Is**

BitLoot is a *crypto-only digital marketplace* for instant delivery of digital goods (game keys, subscriptions).
It uses:

* **Frontend:** Next.js 16 PWA, React 19, Tailwind, shadcn/ui, Zustand, TanStack Query, SDK-first
* **Backend:** NestJS modular architecture, PostgreSQL, Redis, BullMQ, Docker, Nginx
* **Payments:** NOWPayments crypto API (300+ assets)
* **Fulfillment:** Kinguin API (catalog + order fulfillment)
* **Delivery:** Encrypted keys stored in Cloudflare R2 with secure signed URLs
* **Email:** Resend (OTP, transactional, marketing)
* **Security:** OTP login, JWT, guards, HMAC webhooks, RBAC admin
* **Observability:** Prometheus, Grafana, structured logs
* **Quality:** 100% type-safe, 100% SDK-first, 0 raw fetch, 300+ tests per level

---

# **Documentation Pillars**

AI must follow these **3 mandatory sources** when generating code:

1. **BitLoot-Code-Standards.md** (Strict TypeScript, DTO/Entity patterns, backend/FE standards)
2. **BitLoot-Checklists-Patterns.md** (10+ checklists: Entities, DTOs, Controllers, Queries, Webhooks, OTP, Queues)
3. **design-system.md** (UI rules, components, theme, shadcn config)

Supporting docs:

* **PRD.md** — product requirements
* **project-description.md** — system overview
* **Project-Architecture.md** — full monorepo structure
* **sdk.md** — SDK-first design

---

# **Development Method — Vertical Slices (Level System)**

Each level delivers **full-stack increments** (DB → API → UI → Tests → Docs).

**Levels 0–6 are fully complete (production-ready).**

## **Level 0 — Bootstrap**

Docker, CI, linting, formatters, TypeScript strict mode, base NestJS + Next.js skeleton.

## **Level 1 — Walking Skeleton**

Basic end-to-end checkout (FE + BE + DB) with mock data.

## **Level 2 — Real Payments (56 tasks)**

* NOWPayments real crypto payments
* IPN webhooks (HMAC, idempotent, state machine)
* Async queues with BullMQ
* Admin dashboards
* E2E IPN simulator
* **198+ tests passing**

## **Level 3 — Fulfillment (21 tasks)**

* Kinguin catalog + order fulfillment
* Encrypted key storage in R2
* WebSockets for real-time order status
* JWT auth
* **209+ tests**

## **Level 4 — Security & Observability (45 tasks)**

* OTP authentication (Redis-backed)
* User system + JWT (access 15m, refresh 7d)
* SDK-first migration (10/10 calls)
* CAPTCHA (Turnstile)
* Prometheus metrics (6 custom + 13 system)
* Grafana dashboards
* Structured logs (20+ points)
* RFC 8058 email unsubscribe
* **209+ tests**

## **Level 5 — Admin & Ops (47 tasks)**

* Full admin console: Orders, Payments, Webhooks, Reservations
* Ops pages: Flags, Queues, Balances
* Automated backups to R2
* Disaster recovery playbook (RTO 15–30m)
* Immutable audit logs
* Real-time metrics UI
* Exponential-backoff error handling
* **209 tests + monitoring**

---

# **Level 6 — Products & Catalog (45+ tasks)**

**STATUS: 100% COMPLETE**

Transforms BitLoot into a full digital marketplace.

### **Delivered**

* **5-table DB schema**
  products, product_offers, product_media, pricing_rules, search_index
* **Kinguin catalog sync** (delta, idempotent, BullMQ)
* **Dynamic pricing engine** (margin%, floor/cap, category overrides, priority rules)
* **Full-text search** (GIN + tsvector + Redis cache)
* **Public catalog API** (filters, sorting, search, pricing)
* **Admin UI:**
  product editor, pricing rules manager, sync status panel
* **333+ tests**, 5/5 quality gates

### **6 Completed Phases**

1. **DB schema** (12–20 columns per table, 7 indexes, materialized view)
2. **Backend services** (CatalogService, PricingService, KinguinSyncService, SearchService)
3. **Public API** (list, detail, search, categories, pricing)
4. **Admin API** (CRUD + filters + pricing rule management)
5. **Admin UI** (editor, rule manager, images, media sort, sync dashboard)
6. **End-to-End tests** (333 tests)

---

# **In One Sentence**

BitLoot is now a fully production-ready **crypto-powered digital goods marketplace** with payments, fulfillment, catalog, admin dashboards, observability, backup systems, pricing engine, and complete search — all tested and documented through a 6-level vertical-slice architecture.

---