# 🎯 LEVEL 5 — Complete Implementation Plan & Roadmap

**Status:** ⏳ **IN PROGRESS**  
**Start Date:** November 13, 2025  
**Target Completion:** 2-3 days  
**Overall Progress:** 0/45 Tasks Complete  

---

## 📋 TABLE OF CONTENTS

1. [Phase Overview](#phase-overview)
2. [Phase 0: RBAC & Admin Shell (10 Tasks)](#phase-0-rbac--admin-shell-10-tasks)
3. [Phase 1: Core Admin Tables (15 Tasks)](#phase-1-core-admin-tables-15-tasks)
4. [Phase 2: Metrics & Observability (8 Tasks)](#phase-2-metrics--observability-8-tasks)
5. [Phase 3: Ops Panels & Monitoring (7 Tasks)](#phase-3-ops-panels--monitoring-7-tasks)
6. [Phase 4: Backups & Disaster Recovery (3 Tasks)](#phase-4-backups--disaster-recovery-3-tasks)
7. [Phase 5: Audit Logging & Exports (2 Tasks)](#phase-5-audit-logging--exports-2-tasks)
8. [Quality Gates & Verification](#quality-gates--verification)
9. [Deployment Checklist](#deployment-checklist)

---

## PHASE OVERVIEW

| Phase | Name | Tasks | Estimated Time | Status |
|-------|------|-------|---|---|
| **0** | RBAC & Admin Shell | 10 | 2 hrs | ⏳ Pending |
| **1** | Core Admin Tables | 15 | 4 hrs | ⏳ Pending |
| **2** | Metrics & Observability | 8 | 2 hrs | ⏳ Pending |
| **3** | Ops Panels & Monitoring | 7 | 2 hrs | ⏳ Pending |
| **4** | Backups & Disaster Recovery | 3 | 1 hr | ⏳ Pending |
| **5** | Audit Logging & Exports | 2 | 1 hr | ⏳ Pending |
| **TOTAL** | | **45** | **~12 hrs** | ⏳ In Progress |

---

## PHASE 0: RBAC & ADMIN SHELL (10 Tasks)

### Goal
Establish admin role infrastructure, guards, and foundational admin layout.

### Tasks

#### 0.1 - Verify User Entity Has Role Field (Backend)
- **File:** `apps/api/src/database/entities/user.entity.ts`
- **Action:** Ensure `role` enum field exists (user/admin)
- **Status:** ⏳ Pending
- **Expected Output:** User entity with role: 'user' | 'admin', default 'user'

#### 0.2 - Create/Verify AdminGuard (Backend)
- **File:** `apps/api/src/common/guards/admin.guard.ts`
- **Action:** Guard that checks `req.user.role === 'admin'` + throws 403 if not
- **Status:** ⏳ Pending
- **Expected Output:** Guard rejecting non-admin users with 403 Forbidden

#### 0.3 - Apply AdminGuard to Admin Routes (Backend)
- **Files:**
  - `apps/api/src/modules/admin/admin.controller.ts`
- **Action:** Add `@UseGuards(JwtAuthGuard, AdminGuard)` to all admin endpoints
- **Status:** ⏳ Pending
- **Expected Output:** All `/admin/*` routes now protected

#### 0.4 - Create Admin Layout (Frontend)
- **File:** `apps/web/src/app/admin/layout.tsx`
- **Action:** Create root admin layout with sidebar navigation
- **Components Needed:**
  - AdminSidebar (orders, payments, webhooks, reservations, queues, balances, flags, audit)
  - Admin role guard (redirect to /auth/login if not admin)
- **Status:** ⏳ Pending
- **Expected Output:** `/admin` layout renders with protected access

#### 0.5 - Create AdminSidebar Component (Frontend)
- **File:** `apps/web/src/features/admin/components/AdminSidebar.tsx`
- **Action:** Sidebar with navigation links to all admin pages
- **Nav Items:**
  - Orders (icon: list)
  - Payments (icon: credit-card)
  - Webhooks (icon: webhook)
  - Reservations (icon: box)
  - Queues (icon: activity)
  - Balances (icon: dollar-sign)
  - Flags (icon: flag)
  - Audit Log (icon: file-text)
- **Status:** ⏳ Pending
- **Expected Output:** Responsive sidebar with active route highlighting

#### 0.6 - Create Admin Guard Hook (Frontend)
- **File:** `apps/web/src/hooks/useAdminGuard.ts`
- **Action:** Hook that verifies user is admin, redirects if not
- **Status:** ⏳ Pending
- **Expected Output:** Hook used in admin layout to guard all admin routes

#### 0.7 - Update useMe Hook (Frontend)
- **File:** `apps/web/src/hooks/useAuth.ts` or `useMe.ts`
- **Action:** Add role field to user response DTO
- **Status:** ⏳ Pending
- **Expected Output:** useMe hook returns `{ id, email, role, ... }`

#### 0.8 - Regenerate SDK (SDK)
- **Command:** `npm run sdk:gen`
- **Action:** Regenerate SDK clients after user.role changes
- **Status:** ⏳ Pending
- **Expected Output:** SDK updated with role field

#### 0.9 - Create Admin Dashboard Index Page (Frontend)
- **File:** `apps/web/src/app/admin/page.tsx`
- **Action:** Main admin dashboard with quick stats/overview
- **Status:** ⏳ Pending
- **Expected Output:** `/admin` page with welcome and quick links

#### 0.10 - Verify Quality Gates (CI)
- **Command:** `npm run quality:full`
- **Action:** Type-check, lint, test, build all pass
- **Status:** ⏳ Pending
- **Expected Output:** 5/5 gates passing

---

## PHASE 1: CORE ADMIN TABLES (15 Tasks)

### Goal
Implement 4 core admin tables with server-side filtering, pagination, and CSV export.

### Tasks

#### 1.1 - Create Admin Orders Endpoint (Backend)
- **File:** `apps/api/src/modules/admin/admin.controller.ts`
- **Action:** Add `GET /admin/orders` endpoint with query filters
- **Filters:** status, email, from, to, limit, offset
- **Status:** ⏳ Pending
- **Expected Output:** Paginated orders list with 100+ items max

#### 1.2 - Create Admin Orders Service Method (Backend)
- **File:** `apps/api/src/modules/admin/admin.service.ts`
- **Action:** Implement `queryOrders()` with TypeORM query builder
- **Status:** ⏳ Pending
- **Expected Output:** Service returns paginated/filtered results

#### 1.3 - Create Admin Orders Page (Frontend)
- **File:** `apps/web/src/app/admin/orders/page.tsx`
- **Action:** Orders table with filters, pagination, CSV export button
- **Status:** ⏳ Pending
- **Expected Output:** `/admin/orders` page functional

#### 1.4 - Create Admin Payments Endpoint (Backend)
- **File:** `apps/api/src/modules/admin/admin.controller.ts`
- **Action:** Add `GET /admin/payments` endpoint with filters
- **Filters:** status, orderId, from, to, limit, offset
- **Status:** ⏳ Pending
- **Expected Output:** Paginated payments endpoint

#### 1.5 - Create Admin Payments Service Method (Backend)
- **File:** `apps/api/src/modules/admin/admin.service.ts`
- **Action:** Implement `queryPayments()` service method
- **Status:** ⏳ Pending
- **Expected Output:** Service returns paginated/filtered payments

#### 1.6 - Create Admin Payments Page (Frontend)
- **File:** `apps/web/src/app/admin/payments/page.tsx`
- **Action:** Payments table with filters, pagination, CSV export
- **Status:** ⏳ Pending
- **Expected Output:** `/admin/payments` page functional

#### 1.7 - Create Admin Webhooks Endpoint (Backend)
- **File:** `apps/api/src/modules/admin/admin.controller.ts`
- **Action:** Add `GET /admin/webhook-logs` endpoint
- **Filters:** provider, externalId, eventType, status, from, to, limit, offset
- **Status:** ⏳ Pending
- **Expected Output:** Webhook logs paginated endpoint

#### 1.8 - Create Admin Webhooks Service Method (Backend)
- **File:** `apps/api/src/modules/admin/admin.service.ts`
- **Action:** Implement `queryWebhookLogs()` service method
- **Status:** ⏳ Pending
- **Expected Output:** Service returns paginated/filtered logs

#### 1.9 - Create Admin Webhooks Page (Frontend)
- **File:** `apps/web/src/app/admin/webhooks/page.tsx`
- **Action:** Webhook logs table with filters, replay button
- **Status:** ⏳ Pending
- **Expected Output:** `/admin/webhooks` page functional

#### 1.10 - Create Admin Reservations Endpoint (Backend)
- **File:** `apps/api/src/modules/admin/admin.controller.ts`
- **Action:** Add `GET /admin/reservations` endpoint
- **Filters:** status, kinguinOfferId, from, to, limit, offset
- **Status:** ⏳ Pending
- **Expected Output:** Reservations paginated endpoint

#### 1.11 - Create Admin Reservations Service Method (Backend)
- **File:** `apps/api/src/modules/admin/admin.service.ts`
- **Action:** Implement `queryReservations()` service method
- **Status:** ⏳ Pending
- **Expected Output:** Service returns paginated/filtered reservations

#### 1.12 - Create Admin Reservations Page (Frontend)
- **File:** `apps/web/src/app/admin/reservations/page.tsx`
- **Action:** Reservations table with filters, pagination
- **Status:** ⏳ Pending
- **Expected Output:** `/admin/reservations` page functional

#### 1.13 - Create CSV Export Endpoint (Backend)
- **File:** `apps/api/src/modules/admin/admin.controller.ts`
- **Action:** Add `GET /admin/export/orders.csv` endpoint
- **Action:** Add `GET /admin/export/payments.csv` endpoint
- **Status:** ⏳ Pending
- **Expected Output:** CSV file download endpoints

#### 1.14 - Implement CSV Export Logic (Backend)
- **File:** `apps/api/src/modules/admin/admin.service.ts`
- **Action:** Implement `exportOrdersCsv()` and `exportPaymentsCsv()` methods
- **Status:** ⏳ Pending
- **Expected Output:** CSV serialization logic

#### 1.15 - Verify All Admin Tables Quality (CI)
- **Command:** `npm run quality:full`
- **Action:** Type-check, lint, test, build all pass
- **Status:** ⏳ Pending
- **Expected Output:** 5/5 gates passing

---

## PHASE 2: METRICS & OBSERVABILITY (8 Tasks)

### Goal
Create Prometheus metrics collection, Grafana dashboard, and instrument code.

### Tasks

#### 2.1 - Install Prometheus Client (Backend)
- **Command:** `npm install prom-client`
- **Status:** ⏳ Pending
- **Expected Output:** prom-client dependency added

#### 2.2 - Create MetricsService (Backend)
- **File:** `apps/api/src/modules/metrics/metrics.service.ts`
- **Action:** Service with 6 custom counters/gauges/histograms
- **Metrics:**
  - `bitloot_ipn_total` (counter)
  - `bitloot_webhook_total` (counter)
  - `bitloot_queue_jobs_total` (counter)
  - `bitloot_email_fail_total` (counter)
  - `bitloot_underpaid_total` (counter)
  - `bitloot_queue_waiting|active|failed` (gauges)
  - `bitloot_job_duration_seconds` (histogram)
- **Status:** ⏳ Pending
- **Expected Output:** MetricsService class with all metrics

#### 2.3 - Create MetricsController (Backend)
- **File:** `apps/api/src/modules/metrics/metrics.controller.ts`
- **Action:** `GET /metrics` endpoint returning Prometheus text format
- **Status:** ⏳ Pending
- **Expected Output:** `/metrics` endpoint working

#### 2.4 - Create MetricsModule (Backend)
- **File:** `apps/api/src/modules/metrics/metrics.module.ts`
- **Action:** Module registering MetricsService and MetricsController
- **Status:** ⏳ Pending
- **Expected Output:** MetricsModule exported and ready to import

#### 2.5 - Register MetricsModule in AppModule (Backend)
- **File:** `apps/api/src/app.module.ts`
- **Action:** Import MetricsModule in imports array
- **Status:** ⏳ Pending
- **Expected Output:** Metrics available globally

#### 2.6 - Instrument IPN/Webhook Handlers (Backend)
- **Files:**
  - `apps/api/src/modules/webhooks/ipn-handler.service.ts`
  - `apps/api/src/modules/kinguin/kinguin.controller.ts`
- **Action:** Inject MetricsService and increment counters on events
- **Status:** ⏳ Pending
- **Expected Output:** Metrics incremented on each webhook

#### 2.7 - Create Grafana Dashboard JSON (DevOps)
- **File:** `grafana-provisioning/dashboards/bitloot-level5.json`
- **Action:** Dashboard with 4 panels (OTP Activity, Payment Processing, Email Delivery, Webhook Security)
- **Status:** ⏳ Pending
- **Expected Output:** Ready-to-import Grafana dashboard

#### 2.8 - Update docker-compose for Prometheus/Grafana (DevOps)
- **File:** `docker-compose.prometheus.yml` (already exists, verify)
- **Action:** Ensure Prometheus + Grafana configured and running
- **Status:** ⏳ Pending
- **Expected Output:** `docker-compose -f docker-compose.prometheus.yml up -d` works

---

## PHASE 3: OPS PANELS & MONITORING (7 Tasks)

### Goal
Implement Flags, Queues, Balances

### Tasks

#### 3.1 - Create Flags Service (Backend)
- **File:** `apps/api/src/modules/flags/flags.service.ts`
- **Action:** Service managing feature flags (Redis or in-memory for L5)
- **Status:** ⏳ Pending
- **Expected Output:** Flag CRUD operations

#### 3.2 - Create Flags Controller (Backend)
- **File:** `apps/api/src/modules/flags/flags.controller.ts`
- **Action:** Endpoints: `GET /admin/flags`, `POST /admin/flags`
- **Status:** ⏳ Pending
- **Expected Output:** Flag management endpoints

#### 3.3 - Create Admin Flags Page (Frontend)
- **File:** `apps/web/src/app/admin/flags/page.tsx`
- **Action:** Flags toggles UI with on/off switches
- **Status:** ⏳ Pending
- **Expected Output:** `/admin/flags` page functional

#### 3.4 - Create Queues Endpoint (Backend)
- **File:** `apps/api/src/modules/admin/admin.controller.ts`
- **Action:** `GET /admin/queues` endpoint returning BullMQ queue stats
- **Status:** ⏳ Pending
- **Expected Output:** Queue statistics endpoint

#### 3.5 - Create Admin Queues Page (Frontend)
- **File:** `apps/web/src/app/admin/queues/page.tsx`
- **Action:** Queues dashboard with live stats, retry button
- **Status:** ⏳ Pending
- **Expected Output:** `/admin/queues` page functional

#### 3.6 - Create Balances Endpoint (Backend)
- **File:** `apps/api/src/modules/admin/admin.controller.ts`
- **Action:** `GET /admin/balances` returning Kinguin balances
- **Status:** ⏳ Pending
- **Expected Output:** Balances endpoint with caching (60s)


---

## PHASE 4: BACKUPS & DISASTER RECOVERY (3 Tasks)

### Goal
Implement database backups and restore runbook.

### Tasks

#### 4.1 - Create Database Backup Script (DevOps)
- **File:** `scripts/backup-db.sh`
- **Action:** Script: `pg_dump → gzip → upload to R2`
- **Status:** ⏳ Pending
- **Expected Output:** Backup script ready for cron

#### 4.2 - Create Database Restore Runbook (Documentation)
- **File:** `docs/DISASTER_RECOVERY.md`
- **Action:** Document restore from R2 backup
- **Status:** ⏳ Pending
- **Expected Output:** Step-by-step restore instructions

#### 4.3 - Setup Backup Job (DevOps/CI)
- **File:** `.github/workflows/backup-nightly.yml` (optional for L5)
- **Action:** GitHub Action for nightly backups (or cron on server)
- **Status:** ⏳ Pending
- **Expected Output:** Automated nightly backup scheduled

---

## PHASE 5: AUDIT LOGGING & EXPORTS (2 Tasks)

### Goal
Add audit trail and comprehensive export capabilities.

### Tasks

#### 5.1 - Create Audit Logs Table (Backend)
- **File:** `apps/api/src/database/entities/audit-log.entity.ts`
- **Action:** Entity: id, adminUserId, action, target, payload, createdAt
- **Action:** Create TypeORM migration
- **Status:** ⏳ Pending
- **Expected Output:** Audit logs table in database

#### 5.2 - Create Admin Audit Page (Frontend)
- **File:** `apps/web/src/app/admin/audit/page.tsx`
- **Action:** Audit logs table with filtering by admin, action, date range
- **Status:** ⏳ Pending
- **Expected Output:** `/admin/audit` page functional

---

## QUALITY GATES & VERIFICATION

### All Phases Must Pass These Gates

- ✅ **Type Check:** `npm run type-check` → 0 errors
- ✅ **Lint:** `npm run lint --max-warnings 0` → 0 violations
- ✅ **Format:** `npm run format` → 100% compliant
- ✅ **Tests:** `npm run test` → All passing (209+/210)
- ✅ **Build:** `npm run build` → All workspaces compile
- ✅ **SDK:** `npm run sdk:gen` → Updated after API changes

### Task Completion Verification

After each phase:

```bash
# Verify code quality
npm run quality:full

# Regenerate SDK
npm run sdk:gen

# Run tests
npm run test

# Commit changes
git add .
git commit -m "Level 5: Phase X - [description]"
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment (Production)

- [ ] All 45 tasks completed
- [ ] 5/5 quality gates passing
- [ ] 209+ tests passing
- [ ] No console errors or warnings
- [ ] API documentation updated (Swagger)
- [ ] Admin features documented
- [ ] Backup strategy verified
- [ ] Sentry integration tested
- [ ] Feature flags setup complete
- [ ] Database migrations reviewed
- [ ] Environment variables documented

### Deployment Steps

```bash
# Ensure on main branch with all L5 changes
git checkout main
git pull origin main

# Run migrations
npm run migration:run

# Start services
npm run dev:all

# Verify all endpoints
curl http://localhost:4000/healthz
curl -H "Authorization: Bearer <ADMIN_JWT>" http://localhost:4000/metrics

# Start monitoring stack
docker-compose -f docker-compose.prometheus.yml up -d

# Verify Prometheus + Grafana
open http://localhost:9090
open http://localhost:3001  # admin/admin
```

### Post-Deployment Verification

- [ ] Admin can access all pages (`/admin/*`)
- [ ] Tables load and filter correctly
- [ ] CSV exports work
- [ ] Prometheus metrics visible at `/metrics`
- [ ] Grafana dashboard displays data
- [ ] Flags can be toggled
- [ ] Queue stats update live
- [ ] Sentry captures test errors

---

## SUCCESS CRITERIA (Definition of Done)

| Criterion | Expected | Actual | Status |
|-----------|----------|--------|--------|
| **Phase 0 Complete** | RBAC guards + admin layout | - | ⏳ |
| **Phase 1 Complete** | 4 admin tables + CSV export | - | ⏳ |
| **Phase 2 Complete** | `/metrics` + Grafana dashboard | - | ⏳ |
| **Phase 3 Complete** | Flags + Queues + Balances + Sentry | - | ⏳ |
| **Phase 4 Complete** | DB backup script + runbook | - | ⏳ |
| **Phase 5 Complete** | Audit logs + export page | - | ⏳ |
| **Quality Gates** | 5/5 passing | - | ⏳ |
| **Tests** | 209+/210 passing | - | ⏳ |
| **Documentation** | Complete and linked | - | ⏳ |
| **Deployment Ready** | No blockers | - | ⏳ |

---

## NEXT STEPS

**Start:** Phase 0 — RBAC & Admin Shell (Tasks 0.1-0.10)

**Commands to Run:**

```bash
# Verify current state
cd /c/Users/beast/bitloot
git status
npm run type-check

# Start Phase 0
# Begin with task 0.1: Verify User Entity
```

---

**Document Created:** November 13, 2025  
**Status:** ✅ **COMPREHENSIVE IMPLEMENTATION PLAN READY**  
**Next Action:** Proceed to Phase 0 Implementation

