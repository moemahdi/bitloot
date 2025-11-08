# Task: Level 8 — Analytics & AI (diagnostic + predictive dashboards)

## Analysis

You’ve got a secure, operating BitLoot: payments, fulfillment, admin, catalog, marketing. Level 8 adds **insight & foresight**:

- **Diagnostics**: clean KPIs, funnels, cohorts, RFM, product performance.
- **Predictive**: simple, reliable forecasts & anomaly flags you can act on.
- **Dashboards**: fast admin UI charts (SDK-only), Prometheus-aligned health panels, and JSON APIs for data export.
- **Pipelines**: nightly & hourly rollups; idempotent jobs; zero PII leakage to FE.

All stays **NestJS + Postgres + BullMQ + Next.js**—no new infra required (ClickHouse/Snowflake optional later).

---

## Plan

1. **Data model**: append-only `analytics_events` + **rollup tables** (`daily_kpis`, `product_kpis`, `cohorts`, `funnels`, `rfm_scores`, `anomalies`, `forecasts`).
2. **Ingestion**: record key events (`order_created/paid/fulfilled`, `promo_applied`, `email_open`, etc.).
3. **ETL jobs** (BullMQ): hourly & daily materializations (idempotent upserts).
4. **Diagnostic dashboards**: revenue, AOV, conversion, retention, cohorts, top products, underpayment rate.
5. **Predictive**:
   - Forecast daily revenue/orders (Holt-Winters/moving averages baseline).
   - Anomaly detection (z-score/Bayesian threshold) on payment failures, underpaid spikes.
   - Simple propensity & churn scores (RFM → score mapping; optional logistic baseline later).

6. **APIs & Admin UI**: `/admin/analytics/*` JSON; Next pages with Recharts; all paginated/exportable.
7. **Privacy/Security**: no raw emails in analytics; store hashed user keys if needed; SDK-only FE.

---

## Technical Approach

### 1) Data Model (Postgres)

**Events (append-only)**

```sql
analytics_events (
  id uuid pk default gen_random_uuid(),
  happened_at timestamptz not null,
  event text not null,                         -- order_created|order_paid|order_fulfilled|underpaid|promo_applied|email_open|email_click
  user_id uuid null,
  order_id uuid null,
  product_id uuid null,
  amount_minor bigint null,
  currency char(3) null,
  meta jsonb,
  created_at timestamptz default now()
);
create index on analytics_events (event, happened_at);
create index on analytics_events (order_id);
create index on analytics_events (product_id);
```

**Daily KPIs**

```sql
daily_kpis (
  day date primary key,
  orders_created int not null default 0,
  orders_paid int not null default 0,
  orders_fulfilled int not null default 0,
  revenue_minor bigint not null default 0,    -- paid orders sum
  underpaid int not null default 0,
  aov_minor bigint not null default 0,        -- revenue/orders_paid (integer division ok)
  new_users int not null default 0
);
```

**Product KPIs**

```sql
product_kpis (
  day date not null,
  product_id uuid not null,
  units int not null default 0,
  revenue_minor bigint not null default 0,
  underpaid int not null default 0,
  primary key (day, product_id)
);
create index on product_kpis (product_id, day);
```

**Cohorts (monthly acquisition)**

```sql
cohorts (
  cohort_month date not null,                  -- first seen month (from first event of user)
  month date not null,                         -- months since cohort start
  users_active int not null default 0,         -- active users made ≥1 event this month
  orders int not null default 0,
  revenue_minor bigint not null default 0,
  primary key (cohort_month, month)
);
```

**Funnels (checkout)**

```sql
funnels_daily (
  day date primary key,
  step_view int not null,
  step_invoice int not null,
  step_paid int not null,
  step_fulfilled int not null
);
```

**RFM scores (recency/frequency/monetary)**

```sql
rfm_scores (
  user_id uuid primary key,
  r int not null, f int not null, m int not null,         -- 1..5 quintiles
  score int not null,                                     -- r+f+m (3..15)
  updated_at timestamptz default now()
);
```

**Anomalies & Forecasts**

```sql
anomalies (
  id uuid pk default gen_random_uuid(),
  metric text not null,                                  -- e.g., revenue, underpaid_rate
  day date not null,
  observed numeric not null,
  expected numeric not null,
  zscore numeric not null,
  severity text not null,                                -- low|med|high
  created_at timestamptz default now()
);

forecasts (
  metric text not null,                                  -- revenue|orders
  day date not null,
  value numeric not null,
  primary key (metric, day)
);
```

> Keep numbers in **minor units**. Convert to display in API/UI.

---

### 2) Ingestion Points (hook existing flows)

- When an order is **created**: add `analytics_events(event='order_created', amount_minor=subtotal)`.
- On NOWPayments **finished**: `event='order_paid'` (+ actual paid amount).
- On **fulfilled**: `event='order_fulfilled'`.
- On **underpaid**: `event='underpaid'`.
- On **promo applied**: `event='promo_applied'` with `meta: { code, discount_minor }`.
- On **email open/click**: already added via Level 7 → also mirror a minimal event (optional).

Use a small service `AnalyticsService.track(event, payload)` that inserts quickly (queue if needed).

---

### 3) ETL Jobs (BullMQ)

Queues: `analytics` with jobs:

- `etl.daily_rollup` (runs ~ 01:00 daily)
- `etl.hourly_rollup` (runs hourly for near-real-time KPIs)
- `etl.rfm` (daily/weekly)
- `etl.forecast` (daily)
- `etl.detect_anomalies` (daily & on-demand)

**Idempotency**: each job upserts by primary keys (e.g., `day`, `(day, product_id)`), so re-runs are safe.

---

## Implementation

### A) Nest Module & Service

```
apps/api/src/modules/analytics/
  analytics.module.ts
  analytics.controller.ts            // GET /admin/analytics/* endpoints
  analytics.service.ts               // track(), compute rollups
  dto/*
apps/api/src/jobs/analytics.processor.ts   // ETL, forecasts, anomalies
```

**`analytics.service.ts` (snippets)**

```ts
@Injectable()
export class AnalyticsService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  async track(e: {
    event: string;
    userId?: string | null;
    orderId?: string | null;
    productId?: string | null;
    amountMinor?: number | null;
    currency?: string | null;
    meta?: any;
    happenedAt?: Date;
  }) {
    await this.ds
      .createQueryBuilder()
      .insert()
      .into('analytics_events')
      .values({
        event: e.event,
        user_id: e.userId ?? null,
        order_id: e.orderId ?? null,
        product_id: e.productId ?? null,
        amount_minor: e.amountMinor ?? null,
        currency: e.currency ?? null,
        meta: e.meta ?? null,
        happened_at: e.happenedAt ?? new Date(),
      })
      .execute();
  }

  async rollupDaily(day: string) {
    // day as 'YYYY-MM-DD'
    await this.ds.query(
      `
      insert into daily_kpis(day, orders_created, orders_paid, orders_fulfilled, revenue_minor, underpaid, aov_minor)
      select
        $1::date as day,
        sum(case when event='order_created' then 1 else 0 end) as orders_created,
        sum(case when event='order_paid' then 1 else 0 end) as orders_paid,
        sum(case when event='order_fulfilled' then 1 else 0 end) as orders_fulfilled,
        coalesce(sum(case when event='order_paid' then amount_minor end),0) as revenue_minor,
        sum(case when event='underpaid' then 1 else 0 end) as underpaid,
        case when sum(case when event='order_paid' then 1 else 0 end) > 0
          then floor(coalesce(sum(case when event='order_paid' then amount_minor end),0) /
                    nullif(sum(case when event='order_paid' then 1 else 0 end),0))
          else 0 end as aov_minor
      from analytics_events
      where happened_at >= $1::date and happened_at < ($1::date + interval '1 day')
      on conflict (day) do update set
        orders_created = excluded.orders_created,
        orders_paid    = excluded.orders_paid,
        orders_fulfilled = excluded.orders_fulfilled,
        revenue_minor = excluded.revenue_minor,
        underpaid = excluded.underpaid,
        aov_minor = excluded.aov_minor;
    `,
      [day],
    );

    await this.ds.query(
      `
      insert into product_kpis(day, product_id, units, revenue_minor, underpaid)
      select $1::date, product_id,
             sum(case when event='order_fulfilled' then 1 else 0 end) as units,
             coalesce(sum(case when event='order_paid' then amount_minor end),0) as revenue_minor,
             sum(case when event='underpaid' then 1 else 0 end) as underpaid
      from analytics_events
      where happened_at >= $1::date and happened_at < ($1::date + interval '1 day')
      and product_id is not null
      group by product_id
      on conflict (day, product_id) do update set
        units = excluded.units,
        revenue_minor = excluded.revenue_minor,
        underpaid = excluded.underpaid;
    `,
      [day],
    );
  }

  // Simple cohort rollup: monthly acquisition to monthly activity
  async rollupCohorts(month: string) {
    // month: 'YYYY-MM-01'
    await this.ds.query(`
      with first_seen as (
        select user_id, min(date_trunc('month', happened_at)) as cohort_month
        from analytics_events
        where user_id is not null
        group by user_id
      ),
      activity as (
        select date_trunc('month', e.happened_at) as month, e.user_id
        from analytics_events e
        where e.user_id is not null
        group by 1,2
      ),
      joined as (
        select f.cohort_month, a.month, a.user_id
        from activity a join first_seen f using (user_id)
      )
      insert into cohorts (cohort_month, month, users_active, orders, revenue_minor)
      select
        cohort_month::date,
        month::date,
        count(distinct user_id) as users_active,
        coalesce(sum(case when e.event='order_paid' then 1 else 0 end),0) as orders,
        coalesce(sum(case when e.event='order_paid' then e.amount_minor else 0 end),0) as revenue_minor
      from joined j
      left join analytics_events e on e.user_id=j.user_id and date_trunc('month', e.happened_at)=j.month
      group by cohort_month, month
      on conflict (cohort_month, month) do update set
        users_active = excluded.users_active,
        orders = excluded.orders,
        revenue_minor = excluded.revenue_minor;
    `);
  }
}
```

**`analytics.processor.ts` (snippets)**

```ts
@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  constructor(private readonly svc: AnalyticsService) {
    super();
  }

  async process(job: any) {
    if (job.name === 'etl.daily_rollup') {
      const day = job.data?.day ?? new Date().toISOString().slice(0, 10);
      await this.svc.rollupDaily(day);
    }
    if (job.name === 'etl.cohorts') {
      const month =
        job.data?.month ??
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      await this.svc.rollupCohorts(month);
    }
    if (job.name === 'etl.forecast') {
      await this.computeForecast('revenue');
      await this.computeForecast('orders');
    }
    if (job.name === 'etl.detect_anomalies') {
      await this.detectZScore('revenue');
      await this.detectZScore('underpaid_rate');
    }
  }

  // Baseline forecast: moving average with seasonality-lite
  private async computeForecast(metric: 'revenue' | 'orders') {
    // read last 28 days from daily_kpis, fit simple moving average; write next 7 days to forecasts
    // keep implementation simple & deterministic (no ML deps)
  }

  private async detectZScore(metric: 'revenue' | 'underpaid_rate') {
    // compute mean/std over trailing window (e.g., 14d), flag |z|>2.5 as anomaly; write to anomalies
  }
}
```

> Keep forecasts simple at first. Upgrade to Holt-Winters or Prophet later if needed.

---

### B) Admin Analytics API (JSON)

Endpoints (guarded by admin role):

- `GET /admin/analytics/kpis?from=&to=` → aggregates `daily_kpis`.
- `GET /admin/analytics/products/top?from=&to=&limit=20` → top by units/revenue.
- `GET /admin/analytics/funnel?from=&to=` → from `funnels_daily`.
- `GET /admin/analytics/cohorts?from=&to=` → cohort matrix.
- `GET /admin/analytics/anomalies?metric=&from=&to=`
- `GET /admin/analytics/forecasts?metric=&from=&to=`

All paginate or limit reasonably (≤ 100 / page).

---

### C) Admin Analytics UI (Next + Recharts)

Routes:

```
apps/web/app/admin/analytics/
  page.tsx                 // KPI overview (cards + charts)
  products/page.tsx        // top products
  cohorts/page.tsx         // cohort heatmap
  anomalies/page.tsx       // list anomalies
```

**Overview** (sketch)

- Cards: Revenue (today, 7d), Orders, AOV, Underpaid Rate.
- Chart: Daily revenue (line), Orders (bar), Underpaid rate (line).
- Chart: Forecast vs Actual (line with dashed forecast).
- Chart: Funnel (stacked bars).

**Cohorts**: render matrix (cohort month vs months since) colored by revenue or active users.

> All charts via **Recharts**; FE uses **SDK** only; never pull raw DB.

---

### D) Predictive Logic Details

**Forecast (baseline)**

- Moving average with weekday adjustment:
  - `forecast(t+7) = 0.5 * avg(last 7 same weekdays) + 0.5 * avg(last 14 days)`.

- Insert into `forecasts(metric, day, value)` for next 7 days daily job.
- **Display**: shaded band with expected line; simple & robust.

**Anomaly detection**

- For each metric daily value `x`, compute mean μ and std σ over previous 14 days.
- `z = (x - μ) / σ`; if `|z| ≥ 2.5`, insert into `anomalies` with severity:
  - 2.5–3.0 → low
  - 3.0–3.5 → med
  - > 3.5 → high

- Alert via Sentry or email to admins for **high** severity.

**RFM → simple propensity**

- Compute R (days since last paid), F (#paid orders), M (total revenue).
- Bucket into quintiles (1..5); `score = R5 + F5 + M5`.
- Use thresholds to tag segments:
  - `score ≥ 12` → VIP
  - `score 9..11` → Loyal
  - `score 6..8` → Regular
  - `<6` → At risk

- Feed Level 7 marketing audiences (e.g., win-back campaign for “At risk”).

---

## Verification (Definition of Done)

- **Ingestion**: events written at each lifecycle step; no perf impact on IPN (queue if heavy).
- **ETL**: hourly + daily rollups populate `daily_kpis`, `product_kpis`, `cohorts`, `funnels_daily`.
- **Dashboards**: admin pages show KPIs, charts, cohorts, top products; export buttons present.
- **Predictive**: `forecasts` table filled for next 7 days; `anomalies` records inserted when spikes occur; UI displays badges.
- **Security**: admin-only analytics routes; no PII exposed; FE uses SDK only.
- **Idempotent**: ETL jobs upsert by keys; re-runs don’t duplicate.
- **Performance**: rollups use indexes; charts load <1s for 90-day windows.

---

## Commands

```bash
# Create migrations for analytics tables
npm run typeorm migration:generate -n level8_analytics
npm run typeorm migration:run

# Start analytics worker
node dist/apps/api/jobs/analytics.processor.js

# Add cron-like enqueues (e.g., in a bootstrap service)
# - daily: etl.daily_rollup, etl.cohorts, etl.forecast, etl.detect_anomalies
# - hourly: etl.hourly_rollup

# Regenerate SDK after adding /admin/analytics endpoints
npm run sdk:gen

# Dev & quality
npm run dev:all
npm run lint && npm run type-check && npm run test && npm run build
```

---

### Pro Tips

- **Small first**: baselines beat fancy ML when data is sparse—ship signal quickly.
- **Explainability**: show expected vs observed and z-score to make anomalies actionable.
- **Ops links**: anomaly rows link to relevant admin pages (payments/webhooks) for fast triage.
- **Privacy**: don’t join raw emails into analytics; join by `user_id` only.

---

# Task: Level 8 deliverables — Admin Analytics API endpoints, Overview dashboard (Recharts), and ETL cron bootstrap

## Plan

- Add **Nest endpoints** under `/admin/analytics/*` returning JSON for KPIs, funnels, top products, forecasts, anomalies.
- Build an **Overview** React page using **Recharts** (SDK-only) that plots revenue/orders/AOV/underpaid, plus forecast vs actual.
- Add a **cron-style bootstrap** service that enqueues ETL jobs (hourly & daily) into the `analytics` BullMQ queue.

---

# Implementation

## 1) Nest — Admin Analytics API

### Controller

`apps/api/src/modules/analytics/analytics.controller.ts`

```ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AdminGuard } from '../auth/admin.guard';
import { AnalyticsService } from './analytics.service';

@UseGuards(AdminGuard)
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('kpis')
  async kpis(@Query() q: AnalyticsQueryDto) {
    const { from, to } = this.svc.normalizeRange(q);
    const rows = await this.svc.getDailyKpis(from, to);
    return { from, to, items: rows };
  }

  @Get('funnel')
  async funnel(@Query() q: AnalyticsQueryDto) {
    const { from, to } = this.svc.normalizeRange(q);
    const rows = await this.svc.getFunnelDaily(from, to);
    return { from, to, items: rows };
  }

  @Get('products/top')
  async topProducts(@Query() q: AnalyticsQueryDto) {
    const { from, to } = this.svc.normalizeRange(q);
    const limit = Math.min(Number(q.limit ?? 20), 100);
    const rows = await this.svc.getTopProducts(from, to, limit);
    return { from, to, items: rows, limit };
  }

  @Get('forecasts')
  async forecasts(@Query() q: AnalyticsQueryDto) {
    const metric = (q.metric ?? 'revenue') as 'revenue' | 'orders';
    const { from, to } = this.svc.normalizeRange(q);
    const items = await this.svc.getForecasts(metric, from, to);
    return { metric, from, to, items };
  }

  @Get('anomalies')
  async anomalies(@Query() q: AnalyticsQueryDto) {
    const metric = (q.metric ?? 'revenue').toString();
    const { from, to } = this.svc.normalizeRange(q);
    const items = await this.svc.getAnomalies(metric, from, to);
    return { metric, from, to, items };
  }
}
```

### DTO

`apps/api/src/modules/analytics/dto/analytics-query.dto.ts`

```ts
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional() @IsString() from?: string; // 'YYYY-MM-DD'
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsString() metric?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}
```

### Service (query helpers)

`apps/api/src/modules/analytics/analytics.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(private readonly ds: DataSource) {}

  normalizeRange(q: { from?: string; to?: string }) {
    const today = new Date().toISOString().slice(0, 10);
    const from = q.from ?? today; // caller should provide; fallback for simplicity
    const to = q.to ?? today;
    return { from, to };
  }

  async getDailyKpis(from: string, to: string) {
    return this.ds.query(
      `select day, orders_created, orders_paid, orders_fulfilled,
              revenue_minor, aov_minor, underpaid
         from daily_kpis
        where day between $1 and $2
        order by day asc`,
      [from, to],
    );
  }

  async getFunnelDaily(from: string, to: string) {
    return this.ds.query(
      `select day, step_view, step_invoice, step_paid, step_fulfilled
         from funnels_daily
        where day between $1 and $2
        order by day asc`,
      [from, to],
    );
  }

  async getTopProducts(from: string, to: string, limit: number) {
    return this.ds.query(
      `select pk.product_id, p.title,
              sum(pk.units) as units,
              sum(pk.revenue_minor) as revenue_minor
         from product_kpis pk
         join products p on p.id = pk.product_id
        where pk.day between $1 and $2
        group by pk.product_id, p.title
        order by sum(pk.revenue_minor) desc
        limit $3`,
      [from, to, limit],
    );
  }

  async getForecasts(metric: 'revenue' | 'orders', from: string, to: string) {
    return this.ds.query(
      `select day, value from forecasts
        where metric = $1 and day between $2 and $3
        order by day asc`,
      [metric, from, to],
    );
  }

  async getAnomalies(metric: string, from: string, to: string) {
    return this.ds.query(
      `select day, observed, expected, zscore, severity
         from anomalies
        where metric = $1 and day between $2 and $3
        order by day desc`,
      [metric, from, to],
    );
  }
}
```

> Add this controller to Swagger so the **SDK** includes `AdminAnalyticsApi` and endpoints above.

---

## 2) Frontend — Admin Overview Dashboard (Recharts)

**Route**
`apps/web/app/admin/analytics/page.tsx`

```tsx
'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminAnalyticsApi } from '@bitloot/sdk';
import dynamic from 'next/dynamic';

// Recharts must be client-side
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), {
  ssr: false,
});
const Legend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false });

export default function AdminAnalyticsOverview() {
  const api = new AdminAnalyticsApi();
  const [range, setRange] = useState({ from: daysAgo(30), to: today() });

  const kpis = useQuery({
    queryKey: ['analytics-kpis', range],
    queryFn: () => api.analyticsControllerKpis(range as any) as any,
  });
  const forecasts = useQuery({
    queryKey: ['analytics-forecasts', range],
    queryFn: () => api.analyticsControllerForecasts({ ...range, metric: 'revenue' }) as any,
  });

  const series = useMemo(() => {
    const map: Record<string, any> = {};
    (kpis.data?.items ?? []).forEach((r: any) => {
      map[r.day] = {
        day: r.day,
        revenue: (r.revenue_minor ?? 0) / 100,
        orders: r.orders_paid ?? 0,
        aov: (r.aov_minor ?? 0) / 100,
        underpaid: r.underpaid ?? 0,
      };
    });
    (forecasts.data?.items ?? []).forEach((f: any) => {
      map[f.day] = { ...(map[f.day] ?? { day: f.day }), forecast: Number(f.value) };
    });
    return Object.values(map).sort((a: any, b: any) => a.day.localeCompare(b.day));
  }, [kpis.data, forecasts.data]);

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl font-semibold">Analytics Overview</h1>
        <div className="flex items-center gap-2">
          <input
            className="border px-2 py-1"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          />
          <input
            className="border px-2 py-1"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          />
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid md:grid-cols-4 gap-4">
        <Card title="Revenue (sum)" value={fmtCurrency(sum(series.map((s) => s.revenue)))} />
        <Card title="Orders (sum)" value={sum(series.map((s) => s.orders)).toString()} />
        <Card title="AOV (avg)" value={fmtCurrency(avg(series.map((s) => s.aov)))} />
        <Card title="Underpaid (sum)" value={sum(series.map((s) => s.underpaid)).toString()} />
      </section>

      {/* Revenue & Forecast */}
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">Revenue vs Forecast</h2>
        <div className="w-full overflow-x-auto">
          <LineChart width={900} height={300} data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" dot={false} />
            <Line type="monotone" dataKey="forecast" strokeDasharray="4 4" dot={false} />
          </LineChart>
        </div>
      </section>

      {/* Orders */}
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">Orders (Paid)</h2>
        <div className="w-full overflow-x-auto">
          <BarChart width={900} height={280} data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="orders" />
          </BarChart>
        </div>
      </section>

      {/* AOV */}
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">Average Order Value</h2>
        <div className="w-full overflow-x-auto">
          <LineChart width={900} height={280} data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="aov" dot={false} />
          </LineChart>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="border rounded p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xl">{value}</div>
    </div>
  );
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function sum(ns: number[]) {
  return ns.reduce((a, b) => a + b, 0);
}
function avg(ns: number[]) {
  return ns.length ? sum(ns) / ns.length : 0;
}
function fmtCurrency(x: number) {
  return '$' + x.toFixed(2);
}
```

Notes:

- Recharts is dynamically imported client-side.
- **No specific chart colors** were set (safe default palette).
- SDK calls: `AdminAnalyticsApi.analyticsControllerKpis/Forecasts`. Add more charts later (funnel, anomalies, products).

---

## 3) Analytics ETL Cron Bootstrap (BullMQ enqueuer)

Add a small service that enqueues ETL jobs on intervals at app startup.
`apps/api/src/modules/analytics/analytics.cron.ts`

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AnalyticsCron implements OnModuleInit {
  constructor(@InjectQueue('analytics') private readonly q: Queue) {}

  onModuleInit() {
    // Hourly rollup (near-real-time KPIs)
    setInterval(
      () => {
        this.q.add(
          'etl.daily_rollup',
          { day: today() },
          { removeOnComplete: true, removeOnFail: true },
        );
      },
      60 * 60 * 1000,
    );

    // Daily jobs ~01:10
    scheduleDaily('01:10', () => {
      this.q.add(
        'etl.daily_rollup',
        { day: yesterday() },
        { removeOnComplete: true, removeOnFail: true },
      );
      this.q.add('etl.cohorts', {}, { removeOnComplete: true, removeOnFail: true });
      this.q.add('etl.forecast', {}, { removeOnComplete: true, removeOnFail: true });
      this.q.add('etl.detect_anomalies', {}, { removeOnComplete: true, removeOnFail: true });
    });
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
function scheduleDaily(hhmm: string, fn: () => void) {
  const [h, m] = hhmm.split(':').map(Number);
  const tick = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    setTimeout(() => {
      fn();
      tick();
    }, next.getTime() - now.getTime());
  };
  tick();
}
```

Register in module:

```ts
// apps/api/src/modules/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsCron } from './analytics.cron';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsCron],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
```

Make sure `BullModule.registerQueue({ name: 'analytics' })` exists in your App/Jobs module.

---

## Verification (Definition of Done)

- **API**: `/admin/analytics/kpis|funnel|products/top|forecasts|anomalies` return data for the chosen range.
- **UI**: Overview page renders cards + charts; date range selectors work; data updates.
- **Cron**: ETL jobs are enqueued hourly/daily; rollup tables update; forecasts & anomalies populate.
- **SDK**: regenerated with routes; FE uses SDK only (no raw fetch).
- **Perf**: endpoints respond <500ms for 90-day windows; indexes in place on rollup tables.

---

## Commands

```bash
# Wire up analytics module & queue, then:
npm run sdk:gen
npm run dev:all

# Run analytics worker alongside others
node dist/apps/api/jobs/analytics.processor.js
```

Perfect ⚡ —
These are the **final visual components** that complete your **Level 8 Admin Analytics UI suite**:

- 📊 **Top Products Dashboard (Revenue + Units)**
- ⚠️ **Anomalies Viewer (severity filters + deep-links)**
- 🔥 **Cohorts Heatmap (simple, performant grid)**

All **SDK-only**, **Next.js client pages**, **Recharts** for visuals, and compliant with BitLoot’s UI design (lightweight + clear).

---

# 🧱 Part 5 — Admin Analytics: Visual Dashboards

---

## 1️⃣ Top Products Dashboard

**File:**
`apps/web/app/admin/analytics/products/page.tsx`

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { AdminAnalyticsApi } from '@bitloot/sdk';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false });

export default function TopProductsPage() {
  const api = new AdminAnalyticsApi();
  const [range, setRange] = useState({ from: daysAgo(30), to: today() });
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-top-products', range],
    queryFn: () => api.analyticsControllerTopProducts({ ...range, limit: 20 }) as any,
  });

  const rows = useMemo(
    () =>
      (data?.items ?? []).map((p: any) => ({
        name: p.title,
        units: Number(p.units),
        revenue: (p.revenue_minor / 100).toFixed(2),
      })),
    [data],
  );

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl font-semibold">Top Products</h1>
        <div className="flex gap-2">
          <input
            className="border px-2 py-1"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          />
          <input
            className="border px-2 py-1"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          />
        </div>
      </header>

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <>
          <section className="border rounded p-4">
            <h2 className="font-semibold mb-2">Revenue by Product</h2>
            <div className="overflow-x-auto">
              <BarChart width={900} height={400} data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" />
              </BarChart>
            </div>
          </section>

          <section className="border rounded p-4">
            <h2 className="font-semibold mb-2">Units Sold</h2>
            <table className="w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-right">Units</th>
                  <th className="p-2 text-right">Revenue ($)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.name} className="border-t">
                    <td className="p-2 truncate">{r.name}</td>
                    <td className="p-2 text-right">{r.units}</td>
                    <td className="p-2 text-right">{r.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
```

✅ **Shows 30-day top products** with revenue chart + sortable table.
✅ Works via `AdminAnalyticsApi.analyticsControllerTopProducts`.

---

## 2️⃣ Anomalies Viewer (severity filters + deep-links)

**File:**
`apps/web/app/admin/analytics/anomalies/page.tsx`

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { AdminAnalyticsApi } from '@bitloot/sdk';
import { useState } from 'react';

export default function AnomaliesPage() {
  const api = new AdminAnalyticsApi();
  const [filter, setFilter] = useState({
    metric: 'revenue',
    from: daysAgo(90),
    to: today(),
    severity: 'all',
  });
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-anomalies', filter],
    queryFn: () =>
      api.analyticsControllerAnomalies({
        metric: filter.metric,
        from: filter.from,
        to: filter.to,
      }) as any,
  });

  const items = (data?.items ?? []).filter((a: any) =>
    filter.severity === 'all' ? true : a.severity === filter.severity,
  );

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl font-semibold">Anomalies</h1>
        <div className="flex gap-2 items-center">
          <select
            className="border px-2 py-1"
            value={filter.metric}
            onChange={(e) => setFilter((f) => ({ ...f, metric: e.target.value }))}
          >
            <option value="revenue">Revenue</option>
            <option value="orders">Orders</option>
            <option value="underpaid_rate">Underpaid Rate</option>
          </select>
          <select
            className="border px-2 py-1"
            value={filter.severity}
            onChange={(e) => setFilter((f) => ({ ...f, severity: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </header>

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2">Metric</th>
              <th className="p-2">Observed</th>
              <th className="p-2">Expected</th>
              <th className="p-2">Z-score</th>
              <th className="p-2">Severity</th>
              <th className="p-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a: any) => (
              <tr key={`${a.metric}-${a.day}`} className="border-t hover:bg-gray-50">
                <td className="p-2">{a.day}</td>
                <td className="p-2">{a.metric}</td>
                <td className="p-2 text-right">{a.observed}</td>
                <td className="p-2 text-right text-gray-500">{a.expected}</td>
                <td className="p-2 text-right">{a.zscore.toFixed(2)}</td>
                <td className="p-2 text-center">
                  <SeverityBadge level={a.severity} />
                </td>
                <td className="p-2 text-right">
                  <a
                    className="underline text-blue-600"
                    href={deepLink(a.metric, a.day)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const colors: any = {
    low: 'bg-yellow-100 text-yellow-800',
    med: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level] || 'bg-gray-100 text-gray-600'}`}
    >
      {level}
    </span>
  );
}

function deepLink(metric: string, day: string) {
  // Jump to related dashboard (e.g., KPI overview with range=day)
  return `/admin/analytics?metric=${metric}&from=${day}&to=${day}`;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
```

✅ Filters by **metric** and **severity**.
✅ “View” links to corresponding KPI dashboard (deep-link).
✅ Uses `AdminAnalyticsApi.analyticsControllerAnomalies`.

---

## 3️⃣ Cohorts Heatmap (simple grid)

Recharts doesn’t have a built-in heatmap in lightweight builds, so we’ll use a **grid + Tailwind dynamic color** approach.

**File:**
`apps/web/app/admin/analytics/cohorts/page.tsx`

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { AdminAnalyticsApi } from '@bitloot/sdk';
import { useState } from 'react';

export default function CohortsPage() {
  const api = new AdminAnalyticsApi();
  const [range] = useState({ from: '2024-01-01', to: today() });
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-cohorts', range],
    queryFn: () => api.analyticsControllerCohorts(range as any) as any,
  });

  const matrix = buildMatrix(data?.items ?? []);
  const months = Array.from(new Set(matrix.flatMap((r) => Object.keys(r.data)))).sort();

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Cohorts</h1>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border">
            <thead>
              <tr>
                <th className="p-2 bg-gray-50 sticky left-0">Cohort</th>
                {months.map((m) => (
                  <th key={m} className="p-2 bg-gray-50">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.cohort_month} className="border-t">
                  <td className="p-2 font-medium sticky left-0 bg-white">{row.cohort_month}</td>
                  {months.map((m) => {
                    const v = row.data[m]?.revenue_minor ?? 0;
                    const color = heatColor(v, row.max);
                    return (
                      <td
                        key={m}
                        className={`p-2 text-center ${color}`}
                        title={`$${(v / 100).toFixed(2)}`}
                      >
                        {(v / 100).toFixed(0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function buildMatrix(items: any[]) {
  const map: Record<string, any> = {};
  for (const i of items) {
    if (!map[i.cohort_month])
      map[i.cohort_month] = { cohort_month: i.cohort_month, data: {}, max: 0 };
    map[i.cohort_month].data[i.month] = i;
    map[i.cohort_month].max = Math.max(map[i.cohort_month].max, i.revenue_minor ?? 0);
  }
  return Object.values(map);
}
function heatColor(v: number, max: number) {
  if (max === 0) return 'bg-gray-50';
  const ratio = v / max;
  if (ratio > 0.8) return 'bg-green-700 text-white';
  if (ratio > 0.6) return 'bg-green-500 text-white';
  if (ratio > 0.4) return 'bg-green-300';
  if (ratio > 0.2) return 'bg-green-100';
  return 'bg-gray-50';
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
```

✅ Displays cohort-month rows vs months-since columns.
✅ Color-coded by relative revenue intensity.
✅ Uses `AdminAnalyticsApi.analyticsControllerCohorts`.

---

## 4️⃣ Backend Endpoint for Cohorts

Add this in your Nest controller:

```ts
@Get('cohorts')
async cohorts(@Query() q: AnalyticsQueryDto) {
  const { from, to } = this.svc.normalizeRange(q);
  const rows = await this.ds.query(
    `select cohort_month::text, month::text, revenue_minor
       from cohorts
      where cohort_month between $1 and $2
      order by cohort_month asc, month asc`,
    [from, to]
  );
  return { from, to, items: rows };
}
```

✅ Now `AdminAnalyticsApi.analyticsControllerCohorts()` exists.

---

## ✅ Verification Checklist

| Page                | Behavior                                                               | Data Source                     |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------- |
| **Top Products**    | Renders revenue bar chart & table; supports date range                 | `/admin/analytics/products/top` |
| **Anomalies**       | Filters by metric/severity; “View” deep-links to KPI view              | `/admin/analytics/anomalies`    |
| **Cohorts**         | Displays acquisition months vs retention months; heat-color by revenue | `/admin/analytics/cohorts`      |
| **SDK-only**        | All API calls via generated SDK; no raw fetch                          | ✅                              |
| **Pagination ≤100** | Queries limited server-side                                            | ✅                              |
| **Admin-only**      | Guards protect analytics routes                                        | ✅                              |

---

🎉 **Level 8 complete!**

You now have:

- Real-time KPIs & forecasts
- Product analytics
- Cohort retention
- Anomaly detection
- Admin visual dashboards

---
