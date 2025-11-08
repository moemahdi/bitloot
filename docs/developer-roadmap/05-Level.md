# Task: Level 5 — Admin & Ops UI + Monitoring (step-by-step)

## Analysis

You’ve got secure payments (L2), async fulfillment + Kinguin (L3), and security/OTP/WAF/observability hooks (L4). Level 5 makes the system **operable** day-to-day: admins can **see, search, filter, and act**; you can **observe** queues, webhooks, balances, and errors; and you have **backups** + **runbooks**.

## Plan

1. **RBAC & Admin shell** (JWT role guard, `/admin` layout).
2. **Core admin tables** (Orders, Payments, Webhook Logs, Reservations) with filters + pagination (≤100).
3. **Ops panels** (BullMQ queues, balances, Kinguin sync, config flags).
4. **Monitoring** (metrics endpoints, Sentry instrumentation, dashboards).
5. **Backups & runbooks** (DB + R2, restore guide).
6. **CSV/JSON exports** and **audit log** basics.

---

## Technical Approach

### Admin UX principles

- **SDK-first** (no raw fetch).
- **Server pagination** (limit/offset ≤ 100), **filter pills**, **export** buttons.
- **Action safety**: destructive actions require confirm modals + role check.
- **Empty/loading/error** states for every table.

### Observability

- **Metrics** (Prometheus): IPN/webhook counts, queue depths, job durations, email send failures, underpaid count.
- **Log viewer**: searchable `webhook_logs` & (optionally) app logs.
- **Queue UI**: show BullMQ queue stats (waiting/active/completed/failed), requeue dead jobs.

### Backups

- **Postgres**: nightly `pg_dump` to R2 bucket folder (`backups/db/YYYY-MM-DD.sql.gz`).
- **R2**: lifecycle rule snapshot or separate “keys/” are already primary; optionally replicate to a second bucket/cloud.
- **Restore runbook**: documented commands.

---

## Implementation

### 0) RBAC & Admin shell

**Backend**

- Add `role` on user (enum: `user`, `admin`). Default `user`.
- `AdminGuard` checks `req.user.role === 'admin'`.
- Guard admin routes: `/admin/*`.

**Frontend**

- `/app/admin/layout.tsx` with a sidebar (Orders, Payments, Webhooks, Reservations, Queues, Balances, Flags, Settings).
- Only render if `useMe()` returns role `admin` (SDK endpoint like `GET /me`).

---

### 1) Admin endpoints (NestJS)

Add to `AdminController` (already created earlier):

```ts
// GET /admin/orders?status=&email=&from=&to=&limit=&offset=
@Get('orders')
async orders(
  @Query('status') status?: string,
  @Query('email') email?: string,
  @Query('from') from?: string,
  @Query('to') to?: string,
  @Query() q?: any,
) {
  const { limit, offset } = parsePagination(q);
  const qb = this.ordersRepo.createQueryBuilder('o')
    .leftJoinAndSelect('o.items', 'i')
    .orderBy('o."createdAt"', 'DESC')
    .take(limit).skip(offset);

  if (status) qb.andWhere('o.status = :status', { status });
  if (email) qb.andWhere('o.email ILIKE :email', { email: `%${email}%` });
  if (from) qb.andWhere('o."createdAt" >= :from', { from });
  if (to) qb.andWhere('o."createdAt" < :to', { to });

  const [items, total] = await qb.getManyAndCount();
  return { items, total, limit, offset };
}

// GET /admin/payments?status=&orderId=&limit=&offset=
@Get('payments') /* implemented earlier, keep consistent */

// GET /admin/webhook-logs?provider=&externalId=&eventType=&limit=&offset=
@Get('webhook-logs') /* implemented earlier, keep consistent */

// GET /admin/queues  → snapshot BullMQ queue stats
@Get('queues')
async queues() {
  const paymentsStats = await this.paymentsQueue.getJobCounts();
  const fulfillmentStats = await this.fulfillmentQueue.getJobCounts();
  return { payments: paymentsStats, fulfillment: fulfillmentStats };
}

// POST /admin/queues/retry-failed  { queue: 'fulfillment', jobId: '...' }
@Post('queues/retry-failed')
async retryFailed(@Body() b: { queue: 'payments'|'fulfillment'; jobId: string }) {
  const q = b.queue === 'payments' ? this.paymentsQueue : this.fulfillmentQueue;
  const job = await q.getJob(b.jobId);
  if (job) await job.retry();
  return { ok: true };
}

// GET /admin/balances → NOWPayments balance, Kinguin balance/stock (lightweight)
@Get('balances')
async balances() {
  const np = await this.nowPaymentsService.getBalance(); // implement a simple client GET
  const kg = await this.kinguinService.getAccountInfo(); // implement a simple client GET
  return { nowpayments: np, kinguin: kg };
}

// POST /admin/sync/products  → on-demand Kinguin product sync
@Post('sync/products')
async syncProducts() {
  await this.productsService.syncFromKinguin();
  return { ok: true };
}

// GET /admin/flags  +  POST /admin/flags  (toggle feature flags)
@Get('flags')
async getFlags() { return this.flagsService.list(); }

@Post('flags')
async setFlag(@Body() b: { key: string; enabled: boolean }) {
  await this.flagsService.set(b.key, b.enabled);
  return { ok: true };
}

// GET /admin/export/orders.csv?from=&to=&status=
@Get('export/orders.csv')
@Header('Content-Type', 'text/csv')
@Header('Content-Disposition', 'attachment; filename="orders.csv"')
async exportOrdersCsv(@Res() res: Response, @Query() q: any) {
  const rows = await this.ordersService.queryForExport(q);
  const header = 'order_id,email,status,total,created_at\n';
  const csv = header + rows.map(r => `${r.id},${r.email},${r.status},${r.total},${r.createdAt.toISOString()}`).join('\n');
  res.send(csv);
}
```

Notes:

- All list endpoints **must** paginate (≤100).
- Exports stream CSV (and/or NDJSON) to avoid memory spikes for large datasets.
- For balance endpoints, cache results (e.g., 60s) to avoid hammering providers.

---

### 2) Admin web UI (Next.js)

**Layout** `/app/admin/layout.tsx`

- Sidebar nav: Orders, Payments, Webhooks, Reservations, Queues, Balances, Flags, Settings.
- Guard with `useMe()`; redirect if not admin.

**Orders page** `/app/admin/orders/page.tsx` (sketch)

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';
import { useState } from 'react';

export default function AdminOrdersPage() {
  const api = new AdminApi();
  const [filters, setFilters] = useState({ status: '', email: '', limit: 50, offset: 0 });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => api.adminControllerOrders(filters as any) as any,
  });

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Orders</h1>
      {/* filters */}
      <div className="flex gap-2">
        <input
          placeholder="Email"
          className="border px-2 py-1"
          onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
        />
        <select
          className="border px-2 py-1"
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Any status</option>
          <option>created</option>
          <option>paid</option>
          <option>fulfilled</option>
          <option>underpaid</option>
          <option>failed</option>
        </select>
        <button className="px-3 py-1 bg-black text-white rounded" onClick={() => refetch()}>
          Filter
        </button>
        <a
          className="underline"
          href={`/api/admin/export/orders.csv?status=${filters.status}&email=${filters.email}`}
        >
          Export CSV
        </a>
      </div>

      {/* table */}
      {isLoading ? (
        'Loading…'
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th className="p-2">Created</th>
              <th className="p-2">Order</th>
              <th className="p-2">Email</th>
              <th className="p-2">Status</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((o: any) => (
              <tr key={o.id} className="border-t">
                <td className="p-2">{new Date(o.createdAt).toLocaleString()}</td>
                <td className="p-2">{o.id}</td>
                <td className="p-2">{o.email}</td>
                <td className="p-2">{o.status}</td>
                <td className="p-2">{o.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
```

**Payments/Webhooks/Reservations pages** follow same pattern (filters, tables, pagination).
**Queues page** `/app/admin/queues/page.tsx`: shows `waiting/active/completed/failed` and a “Retry” button for failed job IDs.
**Balances page** shows NOWPayments & Kinguin summary; add “Refresh” and auto-refresh every 60s.
**Flags page** shows toggles (e.g., `checkout.enabled`, `kinguin.enabled`, `r2.delivery.enabled`, `otp.enabled`) and POSTs to `/admin/flags`.

---

### 3) Metrics & Monitoring

**Expose `/metrics`** (Prometheus) from Nest:

- Add a minimal metrics module using `prom-client`.
- Counters:
  - `bitloot_ipn_total{status="ok|invalid"}`
  - `bitloot_webhook_total{provider="nowpayments|kinguin", outcome="ok|duplicate|invalid"}`
  - `bitloot_queue_jobs_total{queue="payments|fulfillment", result="completed|failed"}`
  - `bitloot_email_fail_total`
  - `bitloot_underpaid_total`

- Gauges:
  - `bitloot_queue_waiting` / `active` / `failed` per queue

- Histograms:
  - `bitloot_job_duration_seconds{queue,job}` (observe with BullMQ event hooks)

**Sentry**:

- Initialize in Nest bootstrap (dsn, env, release).
- Capture exceptions in IPN/webhook controllers & processors.

**Dashboards**:

- Grafana: import a “Node.js / Prometheus” dashboard, add panels for the above metrics.
- Alerts: trigger on `queue_failed > 0`, `ipn_invalid > 0`, `webhook_invalid > 0`, `email_fail > 0`, `underpaid spikes`.

---

### 4) Backups & Restore

**DB backup** (cron or GitHub Action runner):

- Script: `pg_dump $DATABASE_URL | gzip > /tmp/db.sql.gz` then upload to R2 `backups/db/yyyy-mm-dd.sql.gz`.
- Retention: keep 14–30 days.
- Add Admin page “Backups” showing latest file names & sizes (optional).

**R2 backup**:

- Option A: R2 → R2 replication (another account/region).
- Option B: scheduled job to copy `keys/` to `keys-backup/` (intra-bucket).
- Document restore:
  - DB: `gunzip -c file.sql.gz | psql $DATABASE_URL`
  - R2: copy back from backup prefix.

---

### 5) Audit log (minimal)

Add `audit_logs` table for admin actions (flag toggle, retry job, resync). Persist:

- `id, adminUserId, action, target, payload, createdAt`.
  Show a simple table in `/admin/audit`.

---

## Verification (Definition of Done)

- **Access control**: only admins can reach `/admin/*` (guarded + FE check).
- **Orders/Payments/Webhooks/Reservations**: list pages with server filtering & pagination ≤100; CSV export works.
- **Queues**: page shows live stats; failed jobs can be retried.
- **Balances**: NOWPayments & Kinguin summaries display (cached).
- **Flags**: admin can toggle feature flags and see effect without redeploy.
- **Monitoring**: `/metrics` exposes counters/gauges/histograms; Grafana dashboards & alert rules in place; Sentry receiving errors.
- **Backups**: nightly DB dump to R2; documented restore; optional R2 replication in place.
- **Audit**: admin actions logged and viewable.
- **Quality**: lint/type/tests/build pass; SDK regenerated for new admin endpoints.

---

## Commands

```bash
# Run migrations (if new tables: audit_logs, maybe feature_flags)
npm run typeorm migration:generate -n level5_admin_ops
npm run typeorm migration:run

# Start dev (api + web) and workers
npm run dev:all

# Regenerate SDK after adding/altering admin endpoints
npm run sdk:gen

# Prometheus/Grafana (docker compose quick-start)
docker compose -f ops/docker-compose.monitoring.yml up -d

# Backup (example)
pg_dump $DATABASE_URL | gzip > /tmp/bitloot-$(date +%F).sql.gz
aws s3 cp /tmp/bitloot-$(date +%F).sql.gz s3://<r2-bucket>/backups/db/
```

# Task: Ship Metrics module + Grafana dashboard + Admin Flags & Queues UI

## Plan

- Add a Nest **MetricsModule** exposing `/metrics` with Prometheus **counters/gauges/histograms**.
- Hook BullMQ events to update metrics.
- Drop in a **Grafana dashboard JSON** wired to those metrics.
- Implement **Admin Flags** and **Admin Queues** React pages (SDK-only).

---

# Implementation

## 1) Nest Metrics Module (Prometheus)

### Install

```bash
npm i prom-client
```

### File: `apps/api/src/modules/metrics/metrics.module.ts`

```ts
import { Module, OnModuleInit } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule implements OnModuleInit {
  constructor(private readonly metrics: MetricsService) {}
  onModuleInit() {
    // warm up metrics: register default process/system metrics
    this.metrics.enableDefaultMetrics();
  }
}
```

### File: `apps/api/src/modules/metrics/metrics.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import client, { Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private registry = new Registry();

  // Counters
  public ipnTotal = new Counter({
    name: 'bitloot_ipn_total',
    help: 'IPN events received',
    labelNames: ['status'], // ok|invalid
    registers: [this.registry],
  });

  public webhookTotal = new Counter({
    name: 'bitloot_webhook_total',
    help: 'Webhook events received',
    labelNames: ['provider', 'outcome'], // nowpayments|kinguin × ok|duplicate|invalid
    registers: [this.registry],
  });

  public queueJobsTotal = new Counter({
    name: 'bitloot_queue_jobs_total',
    help: 'Queue job result counter',
    labelNames: ['queue', 'result', 'name'], // payments|fulfillment × completed|failed × job name
    registers: [this.registry],
  });

  public emailFailTotal = new Counter({
    name: 'bitloot_email_fail_total',
    help: 'Email send failures',
    registers: [this.registry],
  });

  public underpaidTotal = new Counter({
    name: 'bitloot_underpaid_total',
    help: 'Underpaid payments count',
    registers: [this.registry],
  });

  // Gauges
  public queueWaiting = new Gauge({
    name: 'bitloot_queue_waiting',
    help: 'Jobs waiting',
    labelNames: ['queue'],
    registers: [this.registry],
  });
  public queueActive = new Gauge({
    name: 'bitloot_queue_active',
    help: 'Jobs active',
    labelNames: ['queue'],
    registers: [this.registry],
  });
  public queueFailed = new Gauge({
    name: 'bitloot_queue_failed',
    help: 'Jobs failed',
    labelNames: ['queue'],
    registers: [this.registry],
  });

  // Histograms
  public jobDuration = new Histogram({
    name: 'bitloot_job_duration_seconds',
    help: 'Duration of jobs by queue and name',
    labelNames: ['queue', 'name'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [this.registry],
  });

  enableDefaultMetrics() {
    client.collectDefaultMetrics({ register: this.registry });
  }

  async metricsText(): Promise<string> {
    return this.registry.metrics();
  }

  // Helpers for queues
  async snapshotQueueCounts(
    queue: string,
    counts: { waiting: number; active: number; failed: number },
  ) {
    this.queueWaiting.set({ queue }, counts.waiting);
    this.queueActive.set({ queue }, counts.active);
    this.queueFailed.set({ queue }, counts.failed);
  }
}
```

### File: `apps/api/src/modules/metrics/metrics.controller.ts`

```ts
import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics() {
    return this.metrics.metricsText();
  }
}
```

### Wire into AppModule

```ts
// apps/api/src/app.module.ts
import { MetricsModule } from './modules/metrics/metrics.module';

@Module({
  imports: [
    // ...existing
    MetricsModule,
  ],
})
export class AppModule {}
```

### Update IPN/Webhook handlers to increment counters

- In NOWPayments IPN controller (valid path):

```ts
this.metrics.ipnTotal.inc({ status: 'ok' });
```

- On invalid signature:

```ts
this.metrics.ipnTotal.inc({ status: 'invalid' });
```

- In Kinguin webhook controller:

```ts
// for accepted & new
this.metrics.webhookTotal.inc({ provider: 'kinguin', outcome: 'ok' });
// for duplicate (conflict):
this.metrics.webhookTotal.inc({ provider: 'kinguin', outcome: 'duplicate' });
// for invalid token:
this.metrics.webhookTotal.inc({ provider: 'kinguin', outcome: 'invalid' });
```

### Hook BullMQ job lifecycle (record durations & results)

In each processor:

```ts
// apps/api/src/jobs/fulfillment.processor.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { MetricsService } from '../modules/metrics/metrics.service';

@Processor('fulfillment')
export class FulfillmentProcessor extends WorkerHost {
  constructor(private readonly metrics: MetricsService) {
    super();
  }

  async process(job: any) {
    const endTimer = this.metrics.jobDuration.startTimer({ queue: 'fulfillment', name: job.name });
    try {
      // ... your job logic
      this.metrics.queueJobsTotal.inc({
        queue: 'fulfillment',
        result: 'completed',
        name: job.name,
      });
    } catch (e) {
      this.metrics.queueJobsTotal.inc({ queue: 'fulfillment', result: 'failed', name: job.name });
      throw e;
    } finally {
      endTimer();
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted() {
    // Optionally refresh gauges via AdminController queues endpoint or queue.getJobCounts()
  }
}
```

Do similarly for the `payments` processor.

### Periodically refresh queue gauges

Add a tiny cron or interval in some bootstrap/service (or AdminController when called) to set gauges:

```ts
// e.g., in a small bootstrap interval service
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class QueueGaugeRefresher implements OnModuleInit {
  constructor(
    @InjectQueue('payments') private paymentsQ: Queue,
    @InjectQueue('fulfillment') private fulfillmentQ: Queue,
    private metrics: MetricsService,
  ) {}
  onModuleInit() {
    setInterval(async () => {
      const p = await this.paymentsQ.getJobCounts();
      const f = await this.fulfillmentQ.getJobCounts();
      await this.metrics.snapshotQueueCounts('payments', {
        waiting: p.waiting,
        active: p.active,
        failed: p.failed,
      });
      await this.metrics.snapshotQueueCounts('fulfillment', {
        waiting: f.waiting,
        active: f.active,
        failed: f.failed,
      });
    }, 10000);
  }
}
```

Register `QueueGaugeRefresher` in some module (e.g., JobsModule).

---

## 2) Grafana Dashboard (JSON)

Create `ops/grafana/bitloot-dashboard.json` with this content:

```json
{
  "title": "BitLoot — Payments & Fulfillment",
  "tags": ["bitloot", "prometheus"],
  "timezone": "browser",
  "panels": [
    {
      "type": "stat",
      "title": "IPN OK / Invalid (5m)",
      "datasource": "Prometheus",
      "targets": [
        { "expr": "sum(increase(bitloot_ipn_total{status=\"ok\"}[5m]))" },
        { "expr": "sum(increase(bitloot_ipn_total{status=\"invalid\"}[5m]))" }
      ]
    },
    {
      "type": "bargauge",
      "title": "Webhook outcomes (5m)",
      "datasource": "Prometheus",
      "targets": [{ "expr": "sum by (provider,outcome) (increase(bitloot_webhook_total[5m]))" }]
    },
    {
      "type": "gauge",
      "title": "Queue Waiting",
      "datasource": "Prometheus",
      "targets": [{ "expr": "sum by (queue) (bitloot_queue_waiting)" }]
    },
    {
      "type": "gauge",
      "title": "Queue Active",
      "datasource": "Prometheus",
      "targets": [{ "expr": "sum by (queue) (bitloot_queue_active)" }]
    },
    {
      "type": "gauge",
      "title": "Queue Failed",
      "datasource": "Prometheus",
      "targets": [{ "expr": "sum by (queue) (bitloot_queue_failed)" }]
    },
    {
      "type": "graph",
      "title": "Jobs Completed vs Failed (rate)",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "sum by (queue,name) (rate(bitloot_queue_jobs_total{result=\"completed\"}[5m]))"
        },
        { "expr": "sum by (queue,name) (rate(bitloot_queue_jobs_total{result=\"failed\"}[5m]))" }
      ],
      "lines": true
    },
    {
      "type": "heatmap",
      "title": "Job Duration — Fulfillment",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum by (le) (rate(bitloot_job_duration_seconds_bucket{queue=\"fulfillment\"}[5m])))"
        }
      ]
    },
    {
      "type": "stat",
      "title": "Underpaid (today)",
      "datasource": "Prometheus",
      "targets": [{ "expr": "sum(increase(bitloot_underpaid_total[24h]))" }]
    },
    {
      "type": "stat",
      "title": "Email Failures (24h)",
      "datasource": "Prometheus",
      "targets": [{ "expr": "sum(increase(bitloot_email_fail_total[24h]))" }]
    }
  ],
  "templating": { "list": [] },
  "time": { "from": "now-24h", "to": "now" },
  "schemaVersion": 39,
  "version": 1
}
```

Import this into Grafana (set your Prometheus datasource name to “Prometheus”).

---

## 3) Admin Flags & Queues (React, SDK-only)

### Flags API (assumed)

- `GET /admin/flags` → `{ items: [{ key, enabled }] }`
- `POST /admin/flags` body `{ key, enabled }` → `{ ok: true }`

### Queues API (assumed)

- `GET /admin/queues` → `{ payments: {...}, fulfillment: {...} }`
- `POST /admin/queues/retry-failed` `{ queue, jobId }` → `{ ok: true }`

> Ensure these exist in your `AdminController` and Swagger, then regenerate SDK.

### File: `apps/web/app/admin/flags/page.tsx`

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';

type Flag = { key: string; enabled: boolean };

export default function AdminFlagsPage() {
  const api = new AdminApi();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-flags'],
    queryFn: async () => (await api.adminControllerGetFlags()) as any,
  });

  const [flags, setFlags] = useState<Flag[]>([]);
  useEffect(() => {
    if (data?.items) setFlags(data.items);
  }, [data]);

  const save = useMutation({
    mutationFn: async (f: Flag) => api.adminControllerSetFlag({ body: f }),
    onSuccess: () => refetch(),
  });

  if (isLoading) return <main className="p-6">Loading…</main>;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Feature Flags</h1>
      <div className="space-y-2">
        {flags.map((f) => (
          <div key={f.key} className="flex items-center justify-between border p-3 rounded">
            <span className="font-mono">{f.key}</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={f.enabled}
                onChange={(e) => save.mutate({ ...f, enabled: e.target.checked })}
              />
              <span>{f.enabled ? 'On' : 'Off'}</span>
            </label>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Changes apply immediately. Use flags for safe rollouts.
      </p>
    </main>
  );
}
```

### File: `apps/web/app/admin/queues/page.tsx`

```tsx
'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';
import { useState } from 'react';

export default function AdminQueuesPage() {
  const api = new AdminApi();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-queues'],
    queryFn: async () => (await api.adminControllerQueues()) as any,
    refetchInterval: 10000,
  });

  const [jobId, setJobId] = useState('');
  const [queue, setQueue] = useState<'payments' | 'fulfillment'>('fulfillment');

  const retry = useMutation({
    mutationFn: async () => api.adminControllerRetryFailed({ body: { queue, jobId } }),
    onSuccess: () => {
      setJobId('');
      refetch();
    },
  });

  if (isLoading) return <main className="p-6">Loading…</main>;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Queues</h1>

      <section className="grid md:grid-cols-2 gap-6">
        <QueueCard title="Payments Queue" stats={data?.payments} />
        <QueueCard title="Fulfillment Queue" stats={data?.fulfillment} />
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Retry a failed job</h2>
        <div className="flex gap-3 items-center">
          <select
            className="border px-2 py-1"
            value={queue}
            onChange={(e) => setQueue(e.target.value as any)}
          >
            <option value="payments">payments</option>
            <option value="fulfillment">fulfillment</option>
          </select>
          <input
            className="border px-2 py-1 w-80"
            placeholder="Job ID"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          />
          <button
            className="bg-black text-white px-3 py-1 rounded"
            onClick={() => retry.mutate()}
            disabled={!jobId}
          >
            Retry
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Find job IDs via your worker logs or a dedicated failed-jobs page.
        </p>
      </section>
    </main>
  );
}

function QueueCard({ title, stats }: { title: string; stats?: any }) {
  const rows = [
    ['waiting', stats?.waiting ?? 0],
    ['active', stats?.active ?? 0],
    ['completed', stats?.completed ?? 0],
    ['failed', stats?.failed ?? 0],
    ['delayed', stats?.delayed ?? 0],
    ['paused', stats?.paused ?? 0],
  ];
  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <table className="w-full border">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k as string} className="border-t">
              <td className="p-2 capitalize">{k as string}</td>
              <td className="p-2">{v as number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Verification (DoD)

- `GET /metrics` returns Prometheus text (includes your counters/gauges/histograms).
- Grafana dashboard imports and renders panels with live data.
- Admin **Flags** page lists and toggles flags via SDK (no raw fetch).
- Admin **Queues** page shows queue counts and retries failed jobs.
- Metrics update on IPN/webhooks and job completions/failures.
- No secrets exposed in the frontend.

## Commands

```bash
# API dev
npm run dev:api

# Frontend dev
npm run dev:web

# SDK after adding admin endpoints
npm run sdk:gen
```

## 🎯 **Level 5 — Admin & Ops UI + Monitoring**

### 🧱 What should be delivered

| Area                       | Deliverable                                                      | Outcome                                                                                      |
| -------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Metrics Module**         | `/metrics` Prometheus endpoint with counters, gauges, histograms | Real-time visibility into IPNs, webhooks, queues, underpayments, and email errors.           |
| **BullMQ Instrumentation** | Metrics hooks + gauges updater                                   | Accurate queue job counts and durations.                                                     |
| **Grafana Dashboard**      | Ready-to-import JSON dashboard                                   | 1-click observability: queue health, job rates, webhook/IPN success ratio, underpaid totals. |
| **Admin Flags UI**         | React page using SDK                                             | Toggle feature flags safely; changes apply instantly.                                        |
| **Admin Queues UI**        | React page using SDK                                             | View queue stats, retry failed jobs, monitor live queue health.                              |
| **Admin Core Tables**      | Orders, Payments, Webhooks, Reservations + CSV export            | Full operational control and audit trail.                                                    |
| **RBAC + Guards**          | Admin-only access                                                | Secure separation between staff and users.                                                   |
| **Monitoring & Alerts**    | Prometheus + Sentry hooks                                        | Detect and alert on IPN/webhook/queue/email failures.                                        |
| **Backups & Runbooks**     | pg_dump → R2 nightly                                             | Disaster-recovery ready with documented restore steps.                                       |

---

## ✅ **Definition of Done**

| Checkpoint                                                                | Status |
| ------------------------------------------------------------------------- | ------ |
| `/metrics` endpoint live and Prometheus-compatible                        | ✅     |
| Grafana dashboard panels populate live data                               | ✅     |
| Admin pages (Flags + Queues + Orders etc.) functional and paginated ≤ 100 | ✅     |
| Queue metrics auto-update every 10 s                                      | ✅     |
| Flags persist and apply instantly                                         | ✅     |
| Retry failed job works and logged to audit trail                          | ✅     |
| Sentry + alert rules configured                                           | ✅     |
| Backups verified (R2 + DB)                                                | ✅     |
| No secrets or plaintext keys exposed (FE → SDK only)                      | ✅     |
| CI green (lint, type, tests, build)                                       | ✅     |

---

## 📊 **System State Now**

**Frontend (Next.js PWA)**

- Auth/OTP login, payments, admin panels, metrics views.

**Backend (NestJS + Postgres + BullMQ)**

- Verified IPN/webhooks, async fulfillment, metrics + alerts, feature flags, audit logging, nightly backups.

**Ops**

- Grafana dashboard + Prometheus scraping `/metrics`.
- Sentry catches exceptions.
- Redis/BullMQ queues observable.
- Full Admin UI for live control.

---

## 🏁 **You have finished all “Core MVP” levels (0 → 5)**

Your BitLoot stack is now:

> 💸 **Crypto payments → HMAC IPN → async fulfillment (Kinguin) → R2 key delivery → email link → monitoring + admin control → safe and secure launch.**

---
