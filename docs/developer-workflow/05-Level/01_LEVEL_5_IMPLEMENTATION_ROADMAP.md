# 🚀 LEVEL 5 — ADMIN & OPS UI + MONITORING
## Complete Implementation Roadmap

**Status:** 🟡 **IMPLEMENTATION PHASE** (Starting November 13, 2025)  
**Branch:** `level5`  
**Target Completion:** 12 working days  
**Quality Gates Required:** 5/5 (Type-check, Lint, Format, Test, Build)

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Phase Breakdown](#phase-breakdown)
3. [Detailed Task List](#detailed-task-list)
4. [Dependencies & Sequencing](#dependencies--sequencing)
5. [File Structure](#file-structure)
6. [Success Criteria](#success-criteria)
7. [Git Workflow](#git-workflow)

---

## EXECUTIVE SUMMARY

**Goal:** Make BitLoot **fully operable** with complete admin visibility, real-time monitoring, disaster recovery, and safe feature flag management.

**What L5 Delivers:**

| Category | Deliverables | Impact |
|----------|---|---|
| **Admin Shell** | `/admin` layout + sidebar navigation + RBAC guards | Secure admin-only access |
| **Core Tables** | Orders, Payments, Webhooks, Reservations pages | Full operational visibility |
| **Ops Panels** | Queues, Balances, Flags, Audit logs | Real-time system control |
| **Monitoring** | Prometheus metrics + Grafana dashboards + Sentry | Observability & alerting |
| **Backup & Recovery** | Nightly pg_dump to R2 + runbooks | Disaster recovery ready |
| **CSV/JSON Exports** | Admin data export capabilities | Reporting & auditing |

**Before L5 (L4 State):**
- ❌ No admin UI (API exists but no UI)
- ❌ No operational visibility into queues
- ❌ No feature flag management
- ❌ No backup automation
- ❌ No comprehensive metrics dashboard

**After L5 (Complete):**
- ✅ Full-featured admin dashboard (8+ pages)
- ✅ Real-time queue monitoring + retry capability
- ✅ Feature flag toggles (apply instantly)
- ✅ Nightly encrypted backups to R2
- ✅ Prometheus + Grafana complete observability stack
- ✅ Sentry error tracking + alerts
- ✅ Audit log of all admin actions
- ✅ CSV exports for compliance & reporting

---

## PHASE BREAKDOWN

```
PHASE 1: RBAC & ADMIN SHELL (1-2 days)
├─ User entity role field + migrations
├─ AdminGuard implementation
├─ Admin layout + sidebar
└─ Route protection

PHASE 2: CORE ADMIN TABLES (3-4 days)
├─ Orders page + filters + export
├─ Payments page + filtering
├─ Webhook logs page + replay
├─ Reservations page
└─ SDK endpoint generation

PHASE 3: OPS PANELS (2-3 days)
├─ Queues page (stats + retry)
├─ Balances page (NOWPayments + Kinguin)
├─ Feature flags page (toggle)
├─ Audit logs page
└─ Admin endpoints for each

PHASE 4: MONITORING & OBSERVABILITY (2-3 days)
├─ MetricsModule (Prometheus)
├─ BullMQ instrumentation
├─ Sentry integration
├─ Grafana dashboard JSON
└─ Alert rules

PHASE 5: BACKUP & RECOVERY (1-2 days)
├─ pg_dump automation
├─ R2 backup upload
├─ Restore runbooks
└─ Backup status UI

PHASE 6: QUALITY & DEPLOYMENT (1 day)
├─ All 5 quality gates passing
├─ E2E admin workflow testing
├─ Documentation completion
└─ Ready for production merge
```

**Total Estimated Duration:** 10-15 working days

---

## DETAILED TASK LIST

### PHASE 1: RBAC & ADMIN SHELL (8 Tasks)

#### 1.1 User Entity Extension
**Files:**
- `apps/api/src/database/migrations/1735000000001-AddRoleToUsers.ts` (NEW)
- `apps/api/src/database/entities/user.entity.ts` (MODIFY)

**Tasks:**
- [ ] Add `role` enum column to users table (values: `'user'` | `'admin'`)
- [ ] Default value: `'user'`
- [ ] Add migration with `ALTER TABLE users ADD COLUMN role`
- [ ] Create db migration file with proper timestamps
- [ ] Update User entity with role field

**Success Criteria:**
- Migration executes without errors
- User has role field (queryable)
- Existing users default to 'user'

---

#### 1.2 AdminGuard Implementation
**Files:**
- `apps/api/src/common/guards/admin.guard.ts` (NEW or VERIFY)

**Tasks:**
- [ ] Extend JwtAuthGuard (validate JWT first)
- [ ] Check `req.user.role === 'admin'`
- [ ] Throw 403 Forbidden if not admin
- [ ] Export from guards index
- [ ] Add Swagger `@ApiBearerAuth()` documentation

**Success Criteria:**
- Guard returns 403 for non-admin JWT tokens
- Guard allows admin JWT tokens
- Guard properly integrated into NestJS

---

#### 1.3 Admin Controller Base
**Files:**
- `apps/api/src/modules/admin/admin.controller.ts` (VERIFY/EXTEND)
- `apps/api/src/modules/admin/admin.service.ts` (VERIFY/EXTEND)

**Tasks:**
- [ ] Verify base controller exists with @UseGuards(JwtAuthGuard, AdminGuard)
- [ ] Add comprehensive Swagger documentation
- [ ] Verify service exists for database queries
- [ ] Add pagination helper utility

**Success Criteria:**
- All /admin/* endpoints require JWT + admin role
- Swagger docs complete for all endpoints
- Pagination consistently applied

---

#### 1.4 Admin Layout & Sidebar (Frontend)
**Files:**
- `apps/web/src/app/admin/layout.tsx` (NEW)
- `apps/web/src/components/admin/AdminNav.tsx` (NEW)

**Tasks:**
- [ ] Create `/app/admin/layout.tsx` root layout
- [ ] Load current user via `useMe()` hook (SDK)
- [ ] Redirect to login if no user or not admin
- [ ] Create sidebar with navigation links:
  - Dashboard
  - Orders
  - Payments
  - Webhooks
  - Reservations
  - Queues
  - Balances
  - Flags
  - Audit Logs
  - Settings
- [ ] Add responsive design (mobile sidebar collapse)
- [ ] Add logout button

**Success Criteria:**
- Admin users see sidebar
- Non-admin users redirected to home
- All nav items styled and clickable
- Mobile-responsive design

---

#### 1.5 Admin Protected Routes
**Files:**
- `apps/web/src/middleware.ts` (MODIFY)

**Tasks:**
- [ ] Add middleware to protect `/admin/*` routes
- [ ] Check JWT token exists (via cookies)
- [ ] Verify user role claim (optional in middleware, enforced in component)
- [ ] Redirect unauthenticated users to login

**Success Criteria:**
- Unauthenticated users can't access /admin pages
- Authenticated non-admin users redirected
- Admin users can access admin pages

---

**Phase 1 Success Criteria (All Must Pass):**
- ✅ Role field added to users table
- ✅ AdminGuard enforces role check
- ✅ Admin layout renders correctly
- ✅ Navigation sidebar functional
- ✅ Protected routes redirect appropriately

---

### PHASE 2: CORE ADMIN TABLES (15 Tasks)

#### 2.1 Orders Page
**Files:**
- `apps/api/src/modules/admin/admin.controller.ts` (ADD METHOD)
- `apps/api/src/modules/admin/admin.service.ts` (ADD METHOD)
- `apps/web/src/app/admin/orders/page.tsx` (NEW)

**Backend Tasks:**
- [ ] `GET /admin/orders` endpoint with filters:
  - `status` (pending, paid, fulfilled, failed, underpaid)
  - `email` (substring search)
  - `from` / `to` (date range)
  - `limit` / `offset` (pagination, ≤100)
- [ ] Query with joins: orders → items → keys
- [ ] Return: items array + total count
- [ ] Add Swagger @ApiResponse with DTO

**Frontend Tasks:**
- [ ] Create `/app/admin/orders/page.tsx`
- [ ] Use SDK AdminApi client (auto-generated)
- [ ] Build filter UI (status dropdown, email input, date pickers)
- [ ] Paginated table with columns: ID, Email, Status, Total, Created
- [ ] "Export CSV" button
- [ ] "View Details" action → modal with order items
- [ ] Loading/error/empty states

**Success Criteria:**
- `/admin/orders` page loads
- Filters work (status, email, date)
- Pagination works (max 100 per page)
- CSV export downloads file
- SDK used (no raw fetch)

---

#### 2.2 Payments Page
**Files:**
- `apps/api/src/modules/admin/admin.controller.ts` (ADD METHOD)
- `apps/api/src/modules/admin/admin.service.ts` (ADD METHOD)
- `apps/web/src/app/admin/payments/page.tsx` (NEW)

**Backend Tasks:**
- [ ] `GET /admin/payments` endpoint with filters:
  - `status` (waiting, confirming, finished, failed)
  - `orderId` (exact match)
  - `from` / `to` (date range)
  - `limit` / `offset` (pagination)
- [ ] Query payments table with order joins
- [ ] Return: items + total

**Frontend Tasks:**
- [ ] Create `/app/admin/payments/page.tsx`
- [ ] Table columns: Payment ID, Order ID, Status, Crypto Amount, Created
- [ ] Filters: status, orderId, date range
- [ ] "View Raw Payload" button → modal with JSON
- [ ] CSV export

**Success Criteria:**
- Page loads and displays payments
- Filters functional
- Pagination works
- Raw payload viewable

---

#### 2.3 Webhook Logs Page
**Files:**
- `apps/api/src/modules/admin/admin.controller.ts` (ADD METHOD)
- `apps/api/src/modules/admin/admin.service.ts` (ADD METHOD)
- `apps/web/src/app/admin/webhooks/page.tsx` (EXTEND if exists)

**Backend Tasks:**
- [ ] `GET /admin/webhook-logs` endpoint with filters:
  - `provider` (nowpayments, kinguin)
  - `eventType` (payment.finished, order.reserved, etc.)
  - `status` (processed, failed, duplicate)
  - `limit` / `offset`
- [ ] Query webhook_logs table
- [ ] Return: items + total

**Frontend Tasks:**
- [ ] Create `/app/admin/webhooks/page.tsx`
- [ ] Table columns: ID, Provider, Event Type, Status, Processed At
- [ ] Filters: provider, event type, status, date
- [ ] "View Payload" button → modal with JSON
- [ ] "Replay" button (POST to replay endpoint)
- [ ] CSV export

**Success Criteria:**
- Webhook logs displayed
- Filters work
- Payload viewable
- Replay functionality works

---

#### 2.4 Reservations Page
**Files:**
- `apps/api/src/modules/admin/admin.controller.ts` (ADD METHOD)
- `apps/api/src/modules/admin/admin.service.ts` (ADD METHOD)
- `apps/web/src/app/admin/reservations/page.tsx` (NEW)

**Backend Tasks:**
- [ ] `GET /admin/reservations` endpoint with filters:
  - `status` (reserved, delivered, failed)
  - `from` / `to` (date range)
  - `limit` / `offset`
- [ ] Join with orders to show customer email
- [ ] Return: items + total

**Frontend Tasks:**
- [ ] Create `/app/admin/reservations/page.tsx`
- [ ] Table: Reservation ID, Order ID, Email, Status, Created
- [ ] Filters: status, date range
- [ ] "View Details" → modal with order info
- [ ] CSV export

**Success Criteria:**
- Reservations displayed
- Filters functional
- Details modal works

---

#### 2.5 CSV Export Utilities
**Files:**
- `apps/api/src/utils/csv.util.ts` (NEW)

**Tasks:**
- [ ] Create `convertToCsv(rows, headers)` function
- [ ] Escape CSV special chars (commas, quotes, newlines)
- [ ] Return CSV string
- [ ] Add helper for HTTP response headers

**Success Criteria:**
- CSV generated correctly
- Special characters escaped
- Downloads work in browser

---

#### 2.6 SDK Generation & AdminApi
**Files:**
- `packages/sdk/src/generated/apis/AdminApi.ts` (AUTO-GENERATED)

**Tasks:**
- [ ] Add all 4 admin endpoints to AdminController Swagger
- [ ] Run `npm run sdk:gen`
- [ ] Verify AdminApi client generated with methods:
  - `adminControllerOrders(filters)`
  - `adminControllerPayments(filters)`
  - `adminControllerWebhookLogs(filters)`
  - `adminControllerReservations(filters)`

**Success Criteria:**
- SDK regenerates without errors
- AdminApi client exists
- Frontend can import and use SDK

---

**Phase 2 Success Criteria (All Must Pass):**
- ✅ All 4 admin table pages render
- ✅ Filters work on all pages
- ✅ Pagination works (max 100)
- ✅ CSV exports work
- ✅ SDK AdminApi client generated

---

### PHASE 3: OPS PANELS (12 Tasks)

#### 3.1 Queues Page (BullMQ Monitoring)
**Files:**
- `apps/api/src/modules/admin/admin.controller.ts` (ADD METHOD)
- `apps/web/src/app/admin/queues/page.tsx` (NEW)

**Backend Tasks:**
- [ ] `GET /admin/queues` endpoint:
  - Return queue stats for 'payments' and 'fulfillment' queues
  - Stats: waiting, active, completed, failed counts
  - Include queue names and health status
- [ ] `POST /admin/queues/retry-failed` endpoint:
  - Body: `{ queue: 'payments' | 'fulfillment', jobId: string }`
  - Find job by ID
  - Call `job.retry()` via BullMQ API
  - Log to audit trail
  - Return: `{ ok: true }`

**Frontend Tasks:**
- [ ] Create `/app/admin/queues/page.tsx`
- [ ] Show 2 queue cards (Payments, Fulfillment)
- [ ] Each card displays:
  - Waiting count (yellow)
  - Active count (blue)
  - Completed count (green)
  - Failed count (red)
- [ ] Auto-refresh stats every 10 seconds
- [ ] Failed jobs list with "Retry" button
- [ ] Retry triggers POST and shows toast notification
- [ ] CSV export of failed jobs

**Success Criteria:**
- Queue stats display
- Numbers update every 10s
- Retry button works
- Failed jobs can be retried

---

#### 3.2 Balances Page
**Files:**
- `apps/api/src/modules/admin/admin.controller.ts` (ADD METHOD)
- `apps/web/src/app/admin/balances/page.tsx` (NEW)

**Backend Tasks:**
- [ ] `GET /admin/balances` endpoint:
  - Call NOWPayments API: get balance (cached 60s)
  - Call Kinguin API: get account info (cached 60s)
  - Return: `{ nowpayments: { balance, lastUpdated }, kinguin: { balance, credits, lastUpdated } }`
- [ ] Implement caching (Redis or in-memory) to avoid API hammering

**Frontend Tasks:**
- [ ] Create `/app/admin/balances/page.tsx`
- [ ] Show 2 balance cards:
  - NOWPayments: balance + last updated
  - Kinguin: credits + balance + last updated
- [ ] "Refresh" button to invalidate cache and fetch fresh
- [ ] Display warning if balance low
- [ ] Auto-refresh every 60 seconds

**Success Criteria:**
- Balance data displays
- Cache works (60s)
- Refresh button updates
- Auto-refresh works

---

#### 3.3 Feature Flags Page
**Files:**
- `apps/api/src/modules/flags/flags.service.ts` (NEW or VERIFY)
- `apps/api/src/modules/flags/flags.controller.ts` (ADD to AdminController)
- `apps/web/src/app/admin/flags/page.tsx` (NEW)

**Backend Tasks:**
- [ ] Create `FlagsService` with Redis storage:
  - `get(key: string): boolean`
  - `set(key: string, value: boolean): void`
  - `list(): { key, enabled }[]`
- [ ] Define default flags:
  - `checkout.enabled` (payment creation)
  - `kinguin.enabled` (fulfillment)
  - `r2.delivery.enabled` (key delivery)
  - `otp.enabled` (login)
  - `email.notifications.enabled`
- [ ] Add admin endpoints:
  - `GET /admin/flags` → list all flags
  - `POST /admin/flags` body `{ key, enabled }` → update flag
- [ ] Changes apply instantly (no cache, no redeploy)

**Frontend Tasks:**
- [ ] Create `/app/admin/flags/page.tsx`
- [ ] Show toggles for each flag
- [ ] On toggle, POST to `/admin/flags`
- [ ] Show confirmation toast
- [ ] List current flag states
- [ ] Display which services are affected by each flag

**Success Criteria:**
- Flags display
- Toggles work
- Changes apply instantly
- Services respect flag state

---

#### 3.4 Audit Logs Page
**Files:**
- `apps/api/src/database/entities/audit-log.entity.ts` (NEW)
- `apps/api/src/database/migrations/1735000000002-CreateAuditLogs.ts` (NEW)
- `apps/api/src/modules/audit/audit.service.ts` (NEW)
- `apps/api/src/modules/admin/admin.controller.ts` (ADD METHOD)
- `apps/web/src/app/admin/audit/page.tsx` (NEW)

**Backend Tasks:**
- [ ] Create `AuditLog` entity:
  - `id` (uuid)
  - `adminUserId` (uuid, foreign key to users)
  - `action` (string: 'flag_toggle', 'job_retry', 'sync_products', etc.)
  - `target` (string: entity type)
  - `payload` (jsonb: action details)
  - `createdAt`
- [ ] Create migration to add audit_logs table
- [ ] Create `AuditService`:
  - `log(adminUserId, action, target, payload)`
  - Store to database
- [ ] Wire into all admin operations:
  - Flag toggle → audit.log(userId, 'flag_toggle', 'feature_flags', {...})
  - Job retry → audit.log(userId, 'job_retry', 'queue', {...})
  - Etc.
- [ ] `GET /admin/audit-logs` endpoint:
  - Filters: action, from, to
  - Pagination
  - Return: items + total

**Frontend Tasks:**
- [ ] Create `/app/admin/audit/page.tsx`
- [ ] Table: Admin User, Action, Target, Timestamp
- [ ] Filters: action type, date range
- [ ] "View Payload" button → modal with JSON
- [ ] CSV export
- [ ] Color-code by action type

**Success Criteria:**
- Audit logs created on admin actions
- Page displays logs
- Filters work
- Payload viewable

---

**Phase 3 Success Criteria (All Must Pass):**
- ✅ Queues page shows live stats
- ✅ Failed job retry works
- ✅ Balances page displays (cached)
- ✅ Flags toggles apply instantly
- ✅ Audit logs recorded and displayed

---

### PHASE 4: MONITORING & OBSERVABILITY (10 Tasks)

#### 4.1 MetricsModule (Prometheus)
**Files:**
- `apps/api/src/modules/metrics/metrics.module.ts` (NEW or VERIFY)
- `apps/api/src/modules/metrics/metrics.service.ts` (NEW or EXTEND)
- `apps/api/src/modules/metrics/metrics.controller.ts` (NEW or VERIFY)

**Tasks:**
- [ ] Install `prom-client` (if not present)
- [ ] Create MetricsService with Prometheus registry
- [ ] Define 6+ custom metrics:
  - `bitloot_ipn_total` (counter, status label)
  - `bitloot_webhook_total` (counter, provider + outcome labels)
  - `bitloot_queue_jobs_total` (counter, queue + result labels)
  - `bitloot_email_fail_total` (counter)
  - `bitloot_underpaid_total` (counter)
  - `bitloot_queue_waiting` / `active` / `failed` (gauges per queue)
  - `bitloot_job_duration_seconds` (histogram, queue + job name)
- [ ] Enable default Node.js metrics (CPU, memory, uptime, GC)
- [ ] Create `/metrics` endpoint (GET) returning Prometheus text format
- [ ] Protect `/metrics` with AdminGuard

**Success Criteria:**
- `GET /metrics` returns valid Prometheus text
- Includes all 6+ custom metrics
- Includes default Node.js metrics
- Protected by AdminGuard

---

#### 4.2 BullMQ Instrumentation
**Files:**
- `apps/api/src/jobs/fulfillment.processor.ts` (MODIFY)
- `apps/api/src/jobs/payment-processor.service.ts` (MODIFY)
- `apps/api/src/modules/metrics/queue-gauge-refresher.service.ts` (NEW)

**Tasks:**
- [ ] In each processor (fulfillment, payments):
  - Start timer on job start: `endTimer = metrics.jobDuration.startTimer({...})`
  - End timer on completion: `endTimer()`
  - Increment counters on completion/failure
- [ ] Create `QueueGaugeRefresher` service:
  - Periodically (10s interval) query queue.getJobCounts()
  - Update gauges: waiting, active, failed
- [ ] Wire service into AppModule (OnModuleInit)
- [ ] Hook IPN/webhook handlers:
  - On valid IPN: `metrics.ipnTotal.inc({ status: 'ok' })`
  - On invalid signature: `metrics.ipnTotal.inc({ status: 'invalid' })`

**Success Criteria:**
- Metrics increment on IPN/webhooks
- Queue gauges update every 10s
- Job durations histogram recorded

---

#### 4.3 Sentry Integration
**Files:**
- `apps/api/src/main.ts` (MODIFY)
- `apps/api/src/app.module.ts` (MODIFY)

**Tasks:**
- [ ] Install `@sentry/node`
- [ ] Initialize Sentry in bootstrap:
  ```ts
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.RELEASE_VERSION,
  });
  ```
- [ ] Create Sentry exception filter (global)
- [ ] Attach to AppModule: `@UseFilters(SentryExceptionFilter)`
- [ ] Automatically capture:
  - Unhandled exceptions
  - IPN/webhook errors
  - Job processor errors
  - Service errors
- [ ] Add optional profiling (if Sentry tier supports)

**Success Criteria:**
- Sentry initialized on startup
- Exceptions captured automatically
- Errors visible in Sentry dashboard

---

#### 4.4 Grafana Dashboard JSON
**Files:**
- `grafana-provisioning/dashboards/bitloot-level5.json` (NEW)

**Tasks:**
- [ ] Create JSON dashboard with 6+ panels:
  1. **OTP Activity** - Stat panel showing otp_issued_total + otp_verified_total
  2. **Payment Processing** - Time series: underpaid_orders_total
  3. **Email Delivery** - Gauge panel: email_send_success vs email_send_failed
  4. **Webhook Security** - Bar chart: invalid_hmac_count, duplicate_webhook_count
  5. **Queue Health** - Gauge panels: queue_waiting, queue_active, queue_failed (per queue)
  6. **Job Durations** - Histogram: job_duration_seconds by queue
- [ ] Add auto-refresh (30s)
- [ ] Set appropriate colors and thresholds
- [ ] Include drill-down links to job/webhook details (optional)

**Success Criteria:**
- Dashboard JSON valid
- Panels render in Grafana
- Metrics populate correctly
- Auto-refresh works

---

#### 4.5 Alert Rules
**Files:**
- `prometheus.yml` (MODIFY to add alert rules section)

**Tasks:**
- [ ] Define alert rules in Prometheus:
  - Alert on `queue_failed > 0` (critical)
  - Alert on `ipn_invalid_total > 5 in 5m` (warning)
  - Alert on `webhook_invalid_total > 5 in 5m` (warning)
  - Alert on `email_fail_total > 10 in 1h` (critical)
  - Alert on `underpaid_total spike` (warning)
- [ ] Configure webhook notification (optional: Slack, PagerDuty)

**Success Criteria:**
- Alert rules loaded in Prometheus
- Rules trigger on metric conditions

---

**Phase 4 Success Criteria (All Must Pass):**
- ✅ `/metrics` endpoint live and returning metrics
- ✅ Queue gauges update every 10s
- ✅ Sentry initialized and capturing errors
- ✅ Grafana dashboard displays all panels
- ✅ Alert rules configured

---

### PHASE 5: BACKUP & RECOVERY (5 Tasks)

#### 5.1 Database Backup Script
**Files:**
- `scripts/backup-db.sh` (NEW)

**Tasks:**
- [ ] Create bash script:
  ```bash
  #!/bin/bash
  DATE=$(date +%Y-%m-%d)
  pg_dump $DATABASE_URL | gzip > /tmp/bitloot-$DATE.sql.gz
  echo "DB backed up to /tmp/bitloot-$DATE.sql.gz"
  ```
- [ ] Make executable: `chmod +x scripts/backup-db.sh`
- [ ] Test locally

**Success Criteria:**
- Script executes without errors
- Creates gzip file
- File is valid SQL

---

#### 5.2 R2 Upload Integration
**Files:**
- `scripts/backup-db.sh` (EXTEND)
- `apps/api/src/modules/backup/backup.service.ts` (NEW, optional - can be in scripts)

**Tasks:**
- [ ] Extend backup script to upload to R2:
  ```bash
  aws s3 cp /tmp/bitloot-$DATE.sql.gz s3://$R2_BUCKET/backups/db/
  ```
- [ ] Verify AWS CLI configured with R2 credentials
- [ ] Add retention policy: keep last 30 days
- [ ] Test upload locally

**Success Criteria:**
- File uploads to R2
- Accessible via R2 dashboard
- Cleanup of old backups works

---

#### 5.3 Backup Automation (Cron or GitHub Actions)
**Files:**
- `.github/workflows/backup.yml` (NEW, recommended)
- `crontab` (alternative, less reliable)

**Tasks:**
- [ ] Create GitHub Actions workflow to run nightly:
  - Trigger: schedule `0 2 * * *` (2 AM UTC daily)
  - Steps:
    1. Checkout repo
    2. Run backup script
    3. Upload to R2
    4. Send success/failure notification (optional)
- [ ] Alternative: cron job on server (if self-hosted)

**Success Criteria:**
- Workflow runs on schedule
- Backup created and uploaded
- Backup file exists in R2

---

#### 5.4 Restore Runbook
**Files:**
- `docs/BACKUP_RESTORE_GUIDE.md` (NEW)

**Tasks:**
- [ ] Document complete restore procedure:
  1. Download backup file from R2
  2. Decompress: `gunzip -c bitloot-YYYY-MM-DD.sql.gz`
  3. Restore to DB: `psql $DATABASE_URL < bitloot-YYYY-MM-DD.sql`
  4. Verify: run migration checks, health endpoint
- [ ] Include troubleshooting section
- [ ] Document R2 restoration (if needed)
- [ ] Test procedure (dry run)

**Success Criteria:**
- Runbook complete and tested
- Restore procedure verified
- Time to restore documented

---

#### 5.5 Backup Status UI (Optional)
**Files:**
- `apps/api/src/modules/admin/admin.controller.ts` (ADD METHOD)
- `apps/web/src/app/admin/backups/page.tsx` (NEW, optional)

**Tasks:**
- [ ] `GET /admin/backups` endpoint:
  - List files in R2 `backups/db/` folder
  - Include: filename, size, created date
  - Show retention countdown
- [ ] Frontend page to display backups
- [ ] Manual download button
- [ ] Latest backup highlighted

**Success Criteria:**
- Admin can see backup history
- File info displayed correctly
- Download links work (optional)

---

**Phase 5 Success Criteria (All Must Pass):**
- ✅ Backup script executes successfully
- ✅ Files uploaded to R2
- ✅ Nightly automation running
- ✅ Restore runbook tested
- ✅ (Optional) Backup UI working

---

### PHASE 6: QUALITY & DEPLOYMENT (6 Tasks)

#### 6.1 TypeScript Strict Mode
**Tasks:**
- [ ] Run `npm run type-check`
- [ ] Fix any errors (should be zero)
- [ ] Verify all new files have proper types
- [ ] No `any` types anywhere

**Success Criteria:**
- ✅ 0 TypeScript errors

---

#### 6.2 ESLint & Code Quality
**Tasks:**
- [ ] Run `npm run lint --max-warnings 0`
- [ ] Fix any violations
- [ ] Ensure runtime-safety rules enforced

**Success Criteria:**
- ✅ 0 ESLint violations

---

#### 6.3 Code Formatting
**Tasks:**
- [ ] Run `npm run format:fix`
- [ ] Verify all files formatted
- [ ] Commit formatted files

**Success Criteria:**
- ✅ 100% Prettier compliance

---

#### 6.4 Unit & Integration Tests
**Tasks:**
- [ ] Write tests for:
  - AdminService methods (get orders, payments, etc.)
  - AdminGuard (allow admin, deny non-admin)
  - Metrics service (counter/gauge increments)
  - Audit service (log creation)
- [ ] Run `npm run test`
- [ ] Target: 80%+ coverage on admin modules
- [ ] All tests pass

**Success Criteria:**
- ✅ 210+/210 tests passing
- ✅ 80%+ coverage on new code

---

#### 6.5 Build & SDK Regeneration
**Tasks:**
- [ ] Run `npm run sdk:gen` (regenerate after all changes)
- [ ] Run `npm run build`
- [ ] Verify all workspaces compile:
  - apps/api
  - apps/web
  - packages/sdk

**Success Criteria:**
- ✅ All workspaces compile without errors
- ✅ SDK clients generated correctly

---

#### 6.6 Final Quality Check
**Tasks:**
- [ ] Run `npm run quality:full` (all 5 gates):
  1. Type-check ✅
  2. Lint ✅
  3. Format ✅
  4. Test ✅
  5. Build ✅
- [ ] All gates pass
- [ ] No regressions from Level 4

**Success Criteria:**
- ✅ 5/5 Quality Gates PASSING
- ✅ Ready for production merge

---

---

## DEPENDENCIES & SEQUENCING

```
PHASE 1 (Foundation)
    ↓ (must complete before Phase 2-3)
┌─ PHASE 2 (Admin Tables) ← can run in parallel with Phase 3
│   └─ PHASE 6 Quality ← runs after all phases
└─ PHASE 3 (Ops Panels) ← can run in parallel with Phase 2
    └─ PHASE 4 (Monitoring) ← after Phase 3
        └─ PHASE 5 (Backups) ← after Phase 4
            └─ PHASE 6 (Deployment) ← final gate
```

**Critical Path:**
1. Phase 1 (2 days) - BLOCKER for everything
2. Phase 2 + 3 (7 days) - Parallel development
3. Phase 4 (3 days)
4. Phase 5 (2 days)
5. Phase 6 (1 day)

**Total:** 10-15 working days

---

## FILE STRUCTURE

```
apps/api/src/
├─ modules/
│  ├─ admin/
│  │  ├─ admin.controller.ts ✨ EXTEND with all new endpoints
│  │  ├─ admin.service.ts ✨ EXTEND with query methods
│  │  └─ admin.module.ts (exists)
│  ├─ metrics/
│  │  ├─ metrics.service.ts ✨ NEW
│  │  ├─ metrics.controller.ts ✨ NEW
│  │  ├─ metrics.module.ts ✨ NEW
│  │  └─ queue-gauge-refresher.service.ts ✨ NEW
│  ├─ audit/
│  │  ├─ audit.service.ts ✨ NEW
│  │  ├─ audit.module.ts ✨ NEW
│  │  └─ dto/audit-log.dto.ts ✨ NEW
│  ├─ flags/
│  │  ├─ flags.service.ts ✨ NEW
│  │  ├─ flags.module.ts ✨ NEW
│  │  └─ dto/flag.dto.ts ✨ NEW
│  └─ backup/
│     ├─ backup.service.ts ✨ NEW (optional)
│     └─ backup.module.ts ✨ NEW (optional)
├─ database/
│  ├─ entities/
│  │  ├─ user.entity.ts ✨ MODIFY (add role)
│  │  ├─ audit-log.entity.ts ✨ NEW
│  │  └─ (others exist)
│  └─ migrations/
│     ├─ 1735000000001-AddRoleToUsers.ts ✨ NEW
│     └─ 1735000000002-CreateAuditLogs.ts ✨ NEW
├─ common/
│  └─ guards/
│     └─ admin.guard.ts ✨ VERIFY/EXTEND
└─ utils/
   └─ csv.util.ts ✨ NEW

apps/web/src/
├─ app/
│  ├─ admin/
│  │  ├─ layout.tsx ✨ NEW
│  │  ├─ orders/
│  │  │  └─ page.tsx ✨ NEW
│  │  ├─ payments/
│  │  │  └─ page.tsx ✨ NEW
│  │  ├─ webhooks/
│  │  │  └─ page.tsx ✨ NEW (or EXTEND if exists)
│  │  ├─ reservations/
│  │  │  └─ page.tsx ✨ NEW
│  │  ├─ queues/
│  │  │  └─ page.tsx ✨ NEW
│  │  ├─ balances/
│  │  │  └─ page.tsx ✨ NEW
│  │  ├─ flags/
│  │  │  └─ page.tsx ✨ NEW
│  │  └─ audit/
│  │     └─ page.tsx ✨ NEW
│  └─ (other routes exist)
├─ components/
│  └─ admin/
│     ├─ AdminNav.tsx ✨ NEW
│     ├─ DataTable.tsx ✨ NEW (reusable)
│     └─ FilterBar.tsx ✨ NEW (reusable)
└─ hooks/
   └─ useAdminQuery.ts ✨ NEW (optional wrapper)

scripts/
├─ backup-db.sh ✨ NEW
└─ (other scripts exist)

docs/
├─ BACKUP_RESTORE_GUIDE.md ✨ NEW
└─ (other docs exist)

.github/
└─ workflows/
   └─ backup.yml ✨ NEW (optional)

grafana-provisioning/
├─ dashboards/
│  └─ bitloot-level5.json ✨ NEW
└─ datasources/
   └─ prometheus.yml (exists, verify config)
```

---

## SUCCESS CRITERIA

### All 6 Phases Must Meet:

| Phase | Main Deliverable | Success Criteria |
|-------|---|---|
| **1** | RBAC + Admin Shell | Role field exists, guards work, layout renders |
| **2** | Core Admin Tables | 4 pages (Orders, Payments, Webhooks, Reservations), filters work, CSV exports |
| **3** | Ops Panels | Queues, Balances, Flags, Audit pages functional |
| **4** | Monitoring | Prometheus `/metrics`, Grafana dashboard, Sentry capturing errors |
| **5** | Backup & Recovery | Nightly backups to R2, restore runbook tested |
| **6** | Quality & Deploy | 5/5 gates passing, 210+/210 tests, zero errors |

### Definition of Done (All Must Pass):

- ✅ `/admin/*` routes protected (JwtAuthGuard + AdminGuard)
- ✅ All 8+ admin pages load and display data
- ✅ Filters work on all list pages (max 100 items per page)
- ✅ CSV/JSON exports functional
- ✅ Queue monitoring with live stats (update every 10s)
- ✅ Feature flags toggle instantly (no cache/redeploy)
- ✅ Audit logs recorded for all admin actions
- ✅ Prometheus `/metrics` endpoint live (AdminGuard protected)
- ✅ Grafana dashboard displays 6+ panels
- ✅ Sentry initialized and capturing exceptions
- ✅ Database backups running nightly
- ✅ Backup files stored in R2
- ✅ Restore runbook documented and tested
- ✅ All SDK-first (zero raw fetch calls in admin UI)
- ✅ 5/5 Quality gates passing
- ✅ 210+/210 tests passing
- ✅ 0 TypeScript errors
- ✅ 0 ESLint violations
- ✅ 100% Prettier compliance
- ✅ All workspaces compile successfully

---

## GIT WORKFLOW

### Branching Strategy

```
main (production)
  ↓
level5 (current feature branch)
  ├─ Feature commits (daily)
  ├─ Quality checks (each commit)
  └─ Ready for merge after Phase 6
```

### Daily Commits

Commit after each phase or subtask:

```bash
# After Phase 1 completion
git add .
git commit -m "🔐 Level 5, Phase 1: RBAC & Admin Shell

- Add role field to users table (migration)
- Implement AdminGuard (JWT + role check)
- Create admin layout + sidebar navigation
- Protect /admin/* routes
- Quality: 5/5 gates passing"

git push origin level5

# After Phase 2 completion
git commit -m "📊 Level 5, Phase 2: Core Admin Tables

- Orders, Payments, Webhooks, Reservations pages
- Server-side filtering + pagination (max 100)
- CSV exports on all pages
- SDK AdminApi client generated
- Quality: 5/5 gates passing"

git push origin level5

# ... continue for each phase

# Final commit before merge
git commit -m "✅ Level 5: Complete - Admin & Ops UI + Monitoring

All 6 phases complete:
1. RBAC & Admin Shell ✅
2. Core Admin Tables ✅
3. Ops Panels (Queues, Balances, Flags, Audit) ✅
4. Monitoring (Prometheus + Grafana + Sentry) ✅
5. Backup & Recovery ✅
6. Quality & Deployment ✅

Quality Metrics:
- 5/5 gates passing
- 210+/210 tests passing
- 0 TypeScript errors
- 0 ESLint violations
- All features SDK-first

Ready for merge to main and production deployment."

git push origin level5
```

### Merge to Main (After Phase 6)

```bash
git checkout main
git pull origin main
git merge level5 --no-ff -m "Merge Level 5: Admin & Ops UI + Monitoring into production"
git push origin main
git tag -a v2.1.0 -m "Level 5 Release: Admin Dashboard + Observability"
git push origin v2.1.0
```

---

## IMPLEMENTATION NOTES

### SDK-First Principle

All admin UI pages must use generated SDK clients. **Never** use raw fetch:

```typescript
// ❌ WRONG
const res = await fetch('http://localhost:4000/api/admin/orders');

// ✅ CORRECT
import { AdminApi } from '@bitloot/sdk';
const api = new AdminApi();
const result = await api.adminControllerOrders({ limit: 50 });
```

### Pagination Rule

All list endpoints must paginate with `limit ≤ 100`:

```typescript
// Backend
const ADMIN_PAGE_SIZE = 100;
const offset = (page - 1) * ADMIN_PAGE_SIZE;
const [items, total] = await repo.findAndCount({ skip: offset, take: ADMIN_PAGE_SIZE });

// Frontend
const [page, setPage] = useState(1);
const { data } = useQuery(() => api.adminControllerOrders({ 
  limit: 100, 
  offset: (page - 1) * 100 
}));
```

### Error Handling Pattern

All admin pages must handle loading/error/empty states:

```typescript
if (isLoading) return <div>Loading...</div>;
if (error) return <div className="text-red-500">Error: {error.message}</div>;
if (!data?.items?.length) return <div>No results found</div>;
return <table>...</table>;
```

### Metrics Pattern

Increment metrics at key points:

```typescript
// On IPN receive
this.metrics.ipnTotal.inc({ status: 'ok' });

// On job completion
const endTimer = this.metrics.jobDuration.startTimer({ queue: 'fulfillment' });
// ... do work ...
endTimer(); // records duration automatically
```

---

## RISK MITIGATION

| Risk | Mitigation |
|------|---|
| Admin page lag with large datasets | Pagination limit (100), server-side filtering, indexes |
| Queue update lag | 10s auto-refresh interval, manual refresh button |
| Backup failure silent | GitHub Actions logging, email notification on failure |
| Sentry quota exceeded | Monitor Sentry usage, sample errors if needed |
| Flag changes take time to apply | Use Redis (instant), not database |
| Audit table grows large | Retention policy (30 days), archive old logs |

---

## ESTIMATED TIMELINE

| Phase | Subtasks | Est. Duration | Cumulative |
|-------|---|---|---|
| **Phase 1** | RBAC setup, AdminGuard, layout, routes | 1-2 days | 1-2 days |
| **Phase 2** | 4 admin tables, filters, CSV, SDK gen | 3-4 days | 4-6 days |
| **Phase 3** | Queues, Balances, Flags, Audit pages | 2-3 days | 6-9 days |
| **Phase 4** | Prometheus, Sentry, Grafana, instrumentation | 2-3 days | 8-12 days |
| **Phase 5** | Backup script, R2 upload, automation, runbook | 1-2 days | 9-14 days |
| **Phase 6** | Type-check, lint, test, build, final validation | 1 day | 10-15 days |

**Total Estimated:** 10-15 working days

---

## NEXT STEPS

1. ✅ **This document created** - Comprehensive roadmap ready
2. 🟡 **Phase 1 starting** - RBAC & Admin Shell implementation
3. 🔲 Phase 2-3 - Core tables & ops panels
4. 🔲 Phase 4 - Monitoring stack
5. 🔲 Phase 5 - Backup automation
6. 🔲 Phase 6 - Final quality gates
7. 🔲 Merge to main → Production deployment

---

**Document Created:** November 13, 2025  
**Status:** 🟡 Implementation Phase Started  
**Branch:** level5  
**Ready to Proceed:** Yes ✅
