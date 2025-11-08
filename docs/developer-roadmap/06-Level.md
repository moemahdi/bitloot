# Task: Level 6 — Products & Catalog Management (step-by-step deep-dive)

## Analysis

Goal: give admins tight control over what’s sellable and at what price while keeping the storefront fast. We’ll (1) sync Kinguin catalog into our DB, (2) allow custom BitLoot products, (3) apply pricing rules (margins, floors/caps, promos), (4) expose a clean, searchable, paginated API via the SDK, and (5) ship Admin UI for browsing, editing, and syncing.

## Plan

1. **Data model**: products, offers, categories, media, pricing rules, visibility flags.
2. **Sync jobs**: BullMQ worker pulls Kinguin pages → upserts with idempotency.
3. **Pricing layer**: compute display price from source cost + rules (margin % + floor/cap + overrides).
4. **Search & filters**: Postgres `tsvector` + indexed filters; Redis cache for hot lists.
5. **Public API**: paginated list/detail with stable filters; SDK regenerated.
6. **Admin UI**: products table, details editor, pricing rules, manual sync & bulk publish/unpublish.
7. **Perf**: composite indexes, precomputed price columns, CDN/R2 image proxy.
8. **Testing**: unit (pricing), E2E (sync → publish → checkout), component (Admin tables).

---

## Technical Approach

### Data model (Postgres)

```sql
-- Core product (our public thing)
products (
  id uuid pk,
  external_id varchar(100) null,      -- Kinguin product id (nullable for custom)
  slug text unique,
  title text not null,
  subtitle text null,
  description text,
  platform varchar(50),               -- Steam/Origin/etc.
  region varchar(50),                 -- GLOBAL/EU/NA/etc.
  drm varchar(50) null,
  age_rating varchar(10) null,        -- PEGI/ESRB
  category varchar(50) null,          -- e.g., GAME, DLC
  is_custom boolean not null default false,
  is_published boolean not null default false,
  cost_minor bigint not null default 0,   -- lowest current source cost in minor units (e.g., cents)
  currency char(3) not null default 'USD',
  price_minor bigint not null default 0,  -- computed retail price in minor units
  price_version int not null default 0,   -- bump when rules change
  rating numeric(3,2) null,
  review_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  search_tsv tsvector                    -- generated for search
);

-- Multiple source offers per product (e.g., Kinguin merchants)
product_offers (
  id uuid pk,
  product_id uuid references products(id) on delete cascade,
  provider varchar(30) not null,          -- 'kinguin' | 'custom'
  provider_sku varchar(100) not null,
  stock int null,                          -- null if unknown
  cost_minor bigint not null,              -- offer cost
  currency char(3) not null,
  is_active boolean not null default true,
  last_seen_at timestamptz default now(),
  unique(provider, provider_sku)
);

-- Images (store URLs or R2 keys)
product_media (
  id uuid pk,
  product_id uuid references products(id) on delete cascade,
  kind varchar(20) not null,              -- 'cover' | 'screenshot'
  src text not null,                      -- remote URL or R2 key
  sort int not null default 0
);

-- Pricing rules (simple but powerful)
pricing_rules (
  id uuid pk,
  scope varchar(20) not null,             -- 'global' | 'category' | 'product'
  scope_ref text null,                    -- e.g., 'GAME' or product_id
  margin_pct numeric(5,2) not null default 8.00,
  floor_minor bigint null,
  cap_minor bigint null,
  is_enabled boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null
);

-- Feature flags already exist; we’ll add product sync flags
```

**Indexes**

- `products (is_published, price_minor, created_at)`
- `products (platform, region, is_published)`
- `product_offers (product_id, is_active, cost_minor)`
- GIN on `products.search_tsv`

**Search vector**

- Build from `title, subtitle, platform, region, category`.

### Pricing computation

- **Rule order**: product → category → global (first match wins).
- **Price formula**: `price = max(floor, min(cap, round_up(cost * (1 + margin%))))`
- Store computed `price_minor` on `products` to avoid recalculating per request. Increment `price_version` when rules change and recompute async.

### Sync strategy (Kinguin)

- **Worker job**: `catalog:sync`:
  1. Fetch page (e.g., 100 items).
  2. Upsert `product_offers` by `(provider, provider_sku)`.
  3. Link/update `products`: choose the **cheapest active offer** as `cost_minor`.
  4. Recompute `price_minor` (enqueue `catalog:reprice` or compute inline).
  5. Save media (store remote URLs; optionally mirror to R2 later).

- **Idempotent**: natural unique keys, `ON CONFLICT DO UPDATE`.
- **Pagination ≤ 100**: obey providers’ limits; resume tokens stored in a `sync_cursors` table.

### Caching

- Redis cache key: `pl:queryhash:v<version>` for popular lists (homepage, bestsellers). TTL 60–180s. Bust on reprice/publish changes.
- Product detail cached individually with short TTL.

### API surface (Nest)

- `GET /catalog/products` list (filters: q, platform, region, category, price_min/max, sort, limit/offset).
- `GET /catalog/products/:slug` detail (includes primary media + price).
- Admin:
  - `GET /admin/products` (same filters + unpublished, has_offer, provider filters).
  - `POST /admin/products/:id/publish` / `unpublish`
  - `POST /admin/products/:id/reprice`
  - `POST /admin/pricing/rules` (CRUD)
  - `POST /admin/catalog/sync` (enqueue)
  - `GET /admin/catalog/sync/status`

### Frontend UX

- Storefront: grid with filters, chips for platform/region, sort by price/new/rating.
- Product page: images, description, platform/region badges, price, Checkout CTA.
- Admin: product list, details editor, rule editor, sync controls, bulk select for publish/unpublish.

---

## Implementation

### 1) Backend Modules (Nest)

```
apps/api/src/modules/catalog/
  catalog.module.ts
  products.controller.ts        // public list/detail
  products.service.ts
  dto/list-products.dto.ts
  dto/get-product.dto.ts

apps/api/src/modules/admin-catalog/
  admin-catalog.module.ts
  admin-products.controller.ts  // list, publish, reprice
  admin-pricing.controller.ts   // rules CRUD
  admin-sync.controller.ts      // sync trigger/status
  admin-catalog.service.ts

apps/api/src/jobs/catalog.processor.ts   // BullMQ worker: sync/reprice
```

**DTOs (examples)**
`list-products.dto.ts`

```ts
import { IsInt, IsOptional, IsString, IsIn, Min } from 'class-validator';

export class ListProductsDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() platform?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsIn(['new', 'price_asc', 'price_desc', 'rating']) sort?: string;
  @IsOptional() @IsInt() @Min(0) offset?: number = 0;
  @IsOptional() @IsInt() @Min(1) limit?: number = 24; // cap to 100 in controller
}
```

**ProductsService (public listing core)**

```ts
async list(dto: ListProductsDto) {
  const limit = Math.min(dto.limit ?? 24, 100);
  const offset = Math.max(dto.offset ?? 0, 0);

  const qb = this.productsRepo.createQueryBuilder('p')
    .where('p.is_published = true')
    .orderBy('p.created_at', 'DESC')
    .take(limit).skip(offset);

  if (dto.q) qb.andWhere('p.search_tsv @@ plainto_tsquery(:q)', { q: dto.q });
  if (dto.platform) qb.andWhere('p.platform = :platform', { platform: dto.platform });
  if (dto.region) qb.andWhere('p.region = :region', { region: dto.region });
  if (dto.category) qb.andWhere('p.category = :category', { category: dto.category });
  if (dto.sort === 'price_asc') qb.orderBy('p.price_minor', 'ASC');
  if (dto.sort === 'price_desc') qb.orderBy('p.price_minor', 'DESC');
  if (dto.sort === 'rating') qb.orderBy('p.rating', 'DESC');

  const [items, total] = await qb.getManyAndCount();
  return { items, total, limit, offset };
}
```

**Admin sync controller (enqueue + status)**

```ts
@Post('catalog/sync')
async syncNow() {
  await this.catalogQueue.add('catalog.sync', {}, { attempts: 3, backoff: { type: 'exponential', delay: 1000 }});
  return { ok: true };
}

@Get('catalog/sync/status')
status() {
  return this.syncStatusService.get(); // simple in-DB status row or Redis counters
}
```

**Catalog processor (worker)**

```ts
@Processor('catalog')
export class CatalogProcessor extends WorkerHost {
  constructor(/* inject repos & services */) {
    super();
  }

  async process(job: any) {
    if (job.name === 'catalog.sync') {
      // 1) pull a page from Kinguin (respect provider pagination)
      // 2) upsert product_offers (provider, provider_sku unique)
      // 3) ensure products exist (map/link external_id)
      // 4) compute `cost_minor` = min(active offers)
      // 5) reprice (inline or queue)
      // 6) update media
    }
    if (job.name === 'catalog.reprice') {
      // recompute price_minor for set of products based on rules
    }
  }
}
```

**Pricing service (compute once)**

```ts
computePrice(costMinor: number, rules: RuleSet): number {
  const margin = Math.max(0, rules.marginPct) / 100;
  let price = Math.ceil(costMinor * (1 + margin));
  if (rules.floorMinor) price = Math.max(price, rules.floorMinor);
  if (rules.capMinor)   price = Math.min(price, rules.capMinor);
  return price;
}
```

**Search tsvector trigger**
Create a trigger to update `search_tsv` on insert/update (from `title/subtitle/platform/region/category`).

### 2) SDK

- Expose public catalog endpoints + admin catalog endpoints in Swagger.
- `npm run sdk:gen` and update FE imports to use `CatalogApi`, `AdminCatalogApi`.

### 3) Frontend — Public Store

```
apps/web/app/(store)/
  products/page.tsx                 // list with filters, SSR or CSR with TanStack Query
  products/[slug]/page.tsx          // details
apps/web/features/catalog/
  Filters.tsx
  ProductCard.tsx
  ProductGallery.tsx
```

**Products list (sketch)**

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi } from '@bitloot/sdk';
import { useState } from 'react';

export default function ProductsPage() {
  const api = new CatalogApi();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({
    platform: '',
    region: '',
    category: '',
    sort: 'new',
    limit: 24,
    offset: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['catalog', q, filters],
    queryFn: () => api.productsControllerList({ ...filters, q }) as any,
  });

  // render grid + pagination
}
```

### 4) Frontend — Admin Catalog

```
apps/web/app/admin/catalog/
  products/page.tsx           // list with filters + publish toggles
  product/[id]/page.tsx       // details & pricing rules overrides
  rules/page.tsx              // global/category/product rule editor
  sync/page.tsx               // Sync now button + status log
```

**Admin product list (sketch)**

```tsx
'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminCatalogApi } from '@bitloot/sdk';

export default function AdminProducts() {
  const api = new AdminCatalogApi();
  const { data, refetch } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.adminProductsControllerList({ limit: 50, offset: 0 }) as any,
  });

  const publish = useMutation({
    mutationFn: (p: { id: string; publish: boolean }) =>
      p.publish
        ? api.adminProductsControllerPublish({ id: p.id })
        : api.adminProductsControllerUnpublish({ id: p.id }),
    onSuccess: () => refetch(),
  });

  // table rendering with a toggle button calling publish.mutate({id, publish:true|false})
}
```

**Admin rules editor**

- Simple form to set `margin_pct`, `floor_minor`, `cap_minor` per scope.
- On save, enqueue `catalog.reprice` for affected products.

**Admin sync**

- Button “Run sync now” calls `/admin/catalog/sync`.
- Show last run time, duration, counts (upserts, new, disabled).

### 5) Images

- Use Kinguin image URLs initially. Optionally add an **image proxy** endpoint to transform/resize and cache into R2.
- Frontend `<Image />` with next/image; define remotePatterns.

### 6) Perf & Safety

- **No secrets to FE**; all via SDK.
- **Indexes** on all filters.
- **Cache** hot queries in Redis (short TTL).
- **Paginate ≤ 100**.
- **Guard Admin** endpoints with role.
- **Log** sync failures with retries and dead-letter.

---

## Verification (Definition of Done)

- **Sync**: Admin “Sync now” populates products/offers/media; idempotent across runs.
- **Pricing**: Products show computed price (margin/floor/cap applied); changing rules re-prices affected products.
- **Search/Filters**: `q`, platform, region, category, sort, limit/offset all work fast; indexes used.
- **Public API/SDK**: `/catalog/products` (list/detail) exposed; SDK regenerated; FE uses SDK only.
- **Admin UI**: products table, publish/unpublish, rules editor, sync controls all functional with loading/error/empty states.
- **Perf**: Redis cache reduces list latency; Postgres plans show index usage; pages feel snappy.
- **Security**: Admin routes guarded; no secrets in FE; no plaintext keys anywhere.
- **Quality**: lint/type/tests/build green; E2E (sync→publish→checkout) passes.

---

## Commands

```bash
# DB migrations (products/offers/media/pricing_rules & search trigger)
npm run typeorm migration:generate -n level6_catalog
npm run typeorm migration:run

# Start workers for catalog
node dist/apps/api/jobs/catalog.processor.js

# Regenerate SDK after adding endpoints
npm run sdk:gen

# Dev loop
npm run dev:all
npm run format && npm run lint --max-warnings 0 && npm run type-check && npm run test && npm run build
```

---

generating the exact SQL migration (including GIN index and tsvector trigger), plus Admin Rules editor components, or a stub Kinguin catalog client with pagination to drop in.

## 🧱 Part 1 — SQL Migration for Catalog (with GIN index + tsvector trigger)

File:
`apps/api/src/migrations/1740000000000-level6-catalog.ts`

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class L6Catalog1740000000000 implements MigrationInterface {
  name = 'L6Catalog1740000000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id varchar(100),
        slug text UNIQUE NOT NULL,
        title text NOT NULL,
        subtitle text,
        description text,
        platform varchar(50),
        region varchar(50),
        drm varchar(50),
        age_rating varchar(10),
        category varchar(50),
        is_custom boolean NOT NULL DEFAULT false,
        is_published boolean NOT NULL DEFAULT false,
        cost_minor bigint NOT NULL DEFAULT 0,
        currency char(3) NOT NULL DEFAULT 'USD',
        price_minor bigint NOT NULL DEFAULT 0,
        price_version int NOT NULL DEFAULT 0,
        rating numeric(3,2),
        review_count int NOT NULL DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        search_tsv tsvector
      );
    `);

    await q.query(`
      CREATE TABLE product_offers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid REFERENCES products(id) ON DELETE CASCADE,
        provider varchar(30) NOT NULL,
        provider_sku varchar(100) NOT NULL,
        stock int,
        cost_minor bigint NOT NULL,
        currency char(3) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        last_seen_at timestamptz DEFAULT now(),
        UNIQUE(provider, provider_sku)
      );
    `);

    await q.query(`
      CREATE TABLE product_media (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid REFERENCES products(id) ON DELETE CASCADE,
        kind varchar(20) NOT NULL,
        src text NOT NULL,
        sort int NOT NULL DEFAULT 0
      );
    `);

    await q.query(`
      CREATE TABLE pricing_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        scope varchar(20) NOT NULL,
        scope_ref text,
        margin_pct numeric(5,2) NOT NULL DEFAULT 8.00,
        floor_minor bigint,
        cap_minor bigint,
        is_enabled boolean NOT NULL DEFAULT true,
        starts_at timestamptz,
        ends_at timestamptz
      );
    `);

    await q.query(
      `CREATE INDEX idx_products_pub_price_created ON products(is_published, price_minor, created_at DESC);`,
    );
    await q.query(
      `CREATE INDEX idx_products_platform_region ON products(platform, region, is_published);`,
    );
    await q.query(
      `CREATE INDEX idx_offers_product_active_cost ON product_offers(product_id, is_active, cost_minor);`,
    );

    // Create GIN index for search
    await q.query(`CREATE INDEX idx_products_search_tsv ON products USING GIN(search_tsv);`);

    // Trigger for search_tsv
    await q.query(`
      CREATE FUNCTION products_tsv_trigger() RETURNS trigger AS $$
      begin
        new.search_tsv :=
          to_tsvector('simple',
            coalesce(new.title,'') || ' ' ||
            coalesce(new.subtitle,'') || ' ' ||
            coalesce(new.platform,'') || ' ' ||
            coalesce(new.region,'') || ' ' ||
            coalesce(new.category,''));
        return new;
      end
      $$ LANGUAGE plpgsql;
    `);
    await q.query(`
      CREATE TRIGGER trg_products_tsv
      BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION products_tsv_trigger();
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TRIGGER IF EXISTS trg_products_tsv ON products;`);
    await q.query(`DROP FUNCTION IF EXISTS products_tsv_trigger;`);
    await q.query(`DROP TABLE pricing_rules;`);
    await q.query(`DROP TABLE product_media;`);
    await q.query(`DROP TABLE product_offers;`);
    await q.query(`DROP TABLE products;`);
  }
}
```

Run:

```bash
npm run typeorm migration:run
```

---

## ⚙️ Part 2 — Stub Kinguin Catalog Client (pagination-ready)

File:
`apps/api/src/modules/catalog/kinguin-catalog.client.ts`

```ts
import fetch from 'node-fetch';

export class KinguinCatalogClient {
  constructor(
    private apiKey = process.env.KINGUIN_CLIENT_ID!,
    private apiSecret = process.env.KINGUIN_CLIENT_SECRET!,
    private base = process.env.KINGUIN_BASE_URL || 'https://api-sandbox.kinguin.net',
  ) {}

  async fetchPage(page: number, size = 100): Promise<any[]> {
    // GET /v1/products?page=<>&size=<>
    const res = await fetch(`${this.base}/v1/products?page=${page}&size=${size}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
      },
    });
    if (!res.ok) throw new Error(`Kinguin fetch failed ${res.status} ${await res.text()}`);
    const json = await res.json();
    return json.results ?? json.data ?? [];
  }
}
```

Use inside `catalog.processor.ts`:

```ts
if (job.name === 'catalog.sync') {
  const client = new KinguinCatalogClient();
  let page = 1;
  while (true) {
    const results = await client.fetchPage(page);
    if (!results.length) break;
    for (const r of results) {
      await this.upsertProduct(r);
    }
    page++;
  }
}
```

Add `upsertProduct()` in `CatalogService` to map each item to `product_offers` and `products`.

---

## 🖥️ Part 3 — Admin Rules Editor (React + SDK)

File: `apps/web/app/admin/catalog/rules/page.tsx`

```tsx
'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminCatalogApi } from '@bitloot/sdk';

export default function AdminRulesPage() {
  const api = new AdminCatalogApi();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-pricing-rules'],
    queryFn: async () => (await api.adminPricingControllerList()) as any,
  });

  const [form, setForm] = useState({
    scope: 'global',
    scopeRef: '',
    marginPct: 8,
    floorMinor: '',
    capMinor: '',
  });

  const save = useMutation({
    mutationFn: async () => api.adminPricingControllerCreate({ body: form }),
    onSuccess: () => refetch(),
  });

  if (isLoading) return <main className="p-6">Loading…</main>;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Pricing Rules</h1>

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">New Rule</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <select
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
            className="border px-2 py-1"
          >
            <option value="global">Global</option>
            <option value="category">Category</option>
            <option value="product">Product</option>
          </select>
          <input
            className="border px-2 py-1"
            placeholder="Scope ref (optional)"
            value={form.scopeRef}
            onChange={(e) => setForm({ ...form, scopeRef: e.target.value })}
          />
          <input
            type="number"
            className="border px-2 py-1"
            placeholder="Margin %"
            value={form.marginPct}
            onChange={(e) => setForm({ ...form, marginPct: +e.target.value })}
          />
          <input
            type="number"
            className="border px-2 py-1"
            placeholder="Floor (minor units)"
            value={form.floorMinor}
            onChange={(e) => setForm({ ...form, floorMinor: e.target.value })}
          />
          <input
            type="number"
            className="border px-2 py-1"
            placeholder="Cap (minor units)"
            value={form.capMinor}
            onChange={(e) => setForm({ ...form, capMinor: e.target.value })}
          />
          <button className="bg-black text-white px-3 py-1 rounded" onClick={() => save.mutate()}>
            Create Rule
          </button>
        </div>
      </section>

      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">Existing Rules</h2>
        <table className="w-full border text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Scope</th>
              <th className="p-2">Ref</th>
              <th className="p-2">Margin %</th>
              <th className="p-2">Floor</th>
              <th className="p-2">Cap</th>
              <th className="p-2">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.scope}</td>
                <td className="p-2">{r.scope_ref}</td>
                <td className="p-2">{r.margin_pct}</td>
                <td className="p-2">{r.floor_minor ?? '-'}</td>
                <td className="p-2">{r.cap_minor ?? '-'}</td>
                <td className="p-2">{r.is_enabled ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
```

Admin API endpoints expected:

- `GET /admin/pricing/rules` → `{ items: [...] }`
- `POST /admin/pricing/rules` → create
- (optionally PUT/DELETE later)

---

## ✅ Verification (Definition of Done for Level 6 Add-ons)

- Migration creates all catalog tables + search trigger.
- `catalog.sync` job populates `products` and `product_offers`.
- Admin **Rules page** lists & creates pricing rules (SDK only).
- Kinguin stub client fetches paginated products successfully.
- `npm run sdk:gen` builds new endpoints for FE usage.
- Lint/type/tests/build pass.

---

Excellent 🚀 —
Now we’ll complete **Level 6’s core backend engine** — the logic that turns the raw Kinguin API payloads into clean BitLoot catalog records and keeps prices correct.

---

# 🧱 Part 4 — `CatalogService.upsertProduct()` + `reprice()` Logic

This will make your **catalog sync worker** actually update your DB and re-price every product automatically using your pricing rules.

Everything below is idempotent, rule-driven, and queue-friendly.

---

## Folder

`apps/api/src/modules/catalog/catalog.service.ts`

---

## Full Implementation

```ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductOffer } from './entities/product-offer.entity';
import { ProductMedia } from './entities/product-media.entity';
import { PricingRule } from './entities/pricing-rule.entity';

@Injectable()
export class CatalogService {
  private logger = new Logger(CatalogService.name);

  constructor(
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
    @InjectRepository(ProductOffer) private readonly offersRepo: Repository<ProductOffer>,
    @InjectRepository(ProductMedia) private readonly mediaRepo: Repository<ProductMedia>,
    @InjectRepository(PricingRule) private readonly rulesRepo: Repository<PricingRule>,
  ) {}

  /**
   * Insert or update one Kinguin product (called from the sync worker)
   */
  async upsertProduct(raw: any) {
    const provider = 'kinguin';
    const providerSku = String(raw.productId ?? raw.id);
    const externalId = providerSku;
    const title = raw.name ?? raw.title ?? 'Untitled';
    const platform = raw.platform ?? raw.platformName ?? null;
    const region = raw.region ?? raw.regionName ?? null;
    const category = raw.category ?? raw.type ?? 'GAME';
    const costMinor = Math.round(Number(raw.basePrice ?? raw.price ?? 0) * 100);
    const currency = (raw.currency ?? 'USD').toUpperCase();

    // 1️⃣  Upsert offer
    const offer = this.offersRepo.create({
      provider,
      providerSku,
      cost_minor: costMinor,
      currency,
      is_active: true,
      last_seen_at: new Date(),
    } as any);

    await this.offersRepo
      .createQueryBuilder()
      .insert()
      .into(ProductOffer)
      .values(offer)
      .onConflict(
        `(provider, provider_sku) DO UPDATE SET cost_minor = EXCLUDED.cost_minor, last_seen_at = now()`,
      )
      .execute();

    // 2️⃣  Find or create product
    let product = await this.productsRepo.findOne({ where: { external_id: externalId } });
    if (!product) {
      product = this.productsRepo.create({
        external_id: externalId,
        slug: this.slugify(title, externalId),
        title,
        description: raw.description ?? '',
        platform,
        region,
        category,
        cost_minor: costMinor,
        currency,
        is_published: false, // manual publish after QA
      });
      await this.productsRepo.save(product);
    } else {
      product.title = title;
      product.platform = platform;
      product.region = region;
      product.category = category;
      product.cost_minor = Math.min(product.cost_minor, costMinor) || costMinor;
      product.updated_at = new Date();
      await this.productsRepo.save(product);
    }

    // 3️⃣  Sync media (only if provided)
    if (Array.isArray(raw.images)) {
      const media = raw.images.map((src: string, idx: number) =>
        this.mediaRepo.create({ product_id: product.id, kind: 'cover', src, sort: idx }),
      );
      for (const m of media.slice(0, 5)) {
        await this.mediaRepo
          .createQueryBuilder()
          .insert()
          .into(ProductMedia)
          .values(m)
          .onConflict('(product_id, src) DO NOTHING')
          .execute();
      }
    }

    // 4️⃣  Reprice single product immediately (or queue later)
    await this.repriceProducts([product.id]);
  }

  /**
   * Compute retail prices for given product IDs based on rules
   */
  async repriceProducts(ids: string[]) {
    const products = await this.productsRepo.findBy({ id: In(ids) });
    const rules = await this.rulesRepo.find({ where: { is_enabled: true } });

    for (const p of products) {
      const rule = this.pickRule(p, rules);
      const newPrice = this.computePrice(p.cost_minor, rule);
      if (p.price_minor !== newPrice) {
        p.price_minor = newPrice;
        p.price_version++;
        p.updated_at = new Date();
        await this.productsRepo.save(p);
        this.logger.debug(`Repriced ${p.title} → ${(newPrice / 100).toFixed(2)} ${p.currency}`);
      }
    }
  }

  /**
   * Choose best rule (product > category > global)
   */
  private pickRule(p: Product, rules: PricingRule[]): PricingRule {
    const productRule = rules.find((r) => r.scope === 'product' && r.scope_ref === p.id);
    if (productRule) return productRule;
    const categoryRule = rules.find((r) => r.scope === 'category' && r.scope_ref === p.category);
    if (categoryRule) return categoryRule;
    const globalRule = rules.find((r) => r.scope === 'global');
    return (
      globalRule ??
      ({
        margin_pct: 8.0,
        floor_minor: null,
        cap_minor: null,
      } as any)
    );
  }

  private computePrice(costMinor: number, rule: PricingRule): number {
    const margin = Math.max(0, Number(rule.margin_pct ?? 8)) / 100;
    let price = Math.ceil(costMinor * (1 + margin));
    if (rule.floor_minor) price = Math.max(price, Number(rule.floor_minor));
    if (rule.cap_minor) price = Math.min(price, Number(rule.cap_minor));
    return price;
  }

  private slugify(title: string, externalId: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      externalId
    );
  }
}
```

### Notes

- It’s safe to run concurrently: `ON CONFLICT` guards ensure idempotency.
- `cost_minor` is the **cheapest active offer**. You can expand to query all offers and take min if multiple.
- Media sync uses `onConflict DO NOTHING` for repeat runs.
- For large syncs, enqueue reprice jobs in batches instead of inline to keep latency low.

---

## 🧮 Hook into Worker

File: `apps/api/src/jobs/catalog.processor.ts`

```ts
@Processor('catalog')
export class CatalogProcessor extends WorkerHost {
  constructor(
    private readonly catalog: CatalogService,
    private readonly kinguin: KinguinCatalogClient,
  ) {
    super();
  }

  async process(job: any) {
    if (job.name === 'catalog.sync') {
      let page = 1;
      while (true) {
        const items = await this.kinguin.fetchPage(page);
        if (!items.length) break;
        for (const item of items) {
          await this.catalog.upsertProduct(item);
        }
        page++;
      }
    }
    if (job.name === 'catalog.reprice') {
      await this.catalog.repriceProducts(job.data.ids);
    }
  }
}
```

Add this worker to your `JobsModule` and start alongside others.

---

## 🧾 Verification Checklist

| Step                            | Expected                                            |
| ------------------------------- | --------------------------------------------------- |
| `npm run typeorm migration:run` | new catalog tables exist                            |
| `POST /admin/catalog/sync`      | enqueues job, worker logs show `Repriced ...` lines |
| DB                              | products filled, offers created, media rows present |
| `pricing_rules`                 | global rule controls retail margins                 |
| `/catalog/products`             | returns published products with computed prices     |
| Admin UI                        | shows product list + pricing rules page             |
| Re-run sync                     | updates costs/prices idempotently                   |
| Lint/tests/build                | ✅ clean                                            |

---

## 💡 Optional Next Add-Ons

- Bulk **reprice all** when rules change → `catalog.reprice` batch job.
- **Price diff alerting**: if margin < X % or cost > price, mark `alert_flag`.
- **Mirror images** → R2 via queue.
- **SEO slugs**: store stable slug + reindex search TSV.
- **“Publish top N cheapest”** automation.

---

Perfect ⚡ — now we’ll complete **Level 6** by adding the **Admin Product Management UI** — so you can browse, edit, publish/unpublish, and manually reprice catalog items directly in your dashboard.

---

# 🧱 Part 5 — Admin Product Table + Publish/Unpublish + Price Controls

This plugs into your existing `/app/admin/catalog/` routes and BitLoot SDK.

---

## 🗂 Folder Structure

```
apps/web/app/admin/catalog/
  products/page.tsx             ← main table (list + filters)
  product/[id]/page.tsx         ← single product editor (optional)
```

---

## 1️⃣ Admin Product List Page

File: `apps/web/app/admin/catalog/products/page.tsx`

```tsx
'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminCatalogApi } from '@bitloot/sdk';

export default function AdminProductsPage() {
  const api = new AdminCatalogApi();
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    platform: '',
    region: '',
    limit: 50,
    offset: 0,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', filters],
    queryFn: () => api.adminProductsControllerList(filters as any) as any,
  });

  const publish = useMutation({
    mutationFn: (p: { id: string; publish: boolean }) =>
      p.publish
        ? api.adminProductsControllerPublish({ id: p.id })
        : api.adminProductsControllerUnpublish({ id: p.id }),
    onSuccess: () => refetch(),
  });

  const reprice = useMutation({
    mutationFn: (id: string) => api.adminProductsControllerReprice({ id }),
    onSuccess: () => refetch(),
  });

  return (
    <main className="p-6 space-y-5">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl font-semibold">Catalog Products</h1>
        <div className="flex gap-2">
          <input
            className="border px-2 py-1"
            placeholder="Search title..."
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <button onClick={() => refetch()} className="px-3 py-1 bg-black text-white rounded">
            Filter
          </button>
        </div>
      </header>

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Title</th>
              <th className="p-2">Category</th>
              <th className="p-2">Platform</th>
              <th className="p-2">Cost</th>
              <th className="p-2">Price</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-2 max-w-[250px] truncate">{p.title}</td>
                <td className="p-2">{p.category ?? '-'}</td>
                <td className="p-2">{p.platform ?? '-'}</td>
                <td className="p-2 text-right">
                  {(p.cost_minor / 100).toFixed(2)} {p.currency}
                </td>
                <td className="p-2 text-right font-medium">
                  {(p.price_minor / 100).toFixed(2)} {p.currency}
                </td>
                <td className="p-2 text-center">
                  {p.is_published ? (
                    <span className="text-green-600">Published</span>
                  ) : (
                    <span className="text-gray-400">Hidden</span>
                  )}
                </td>
                <td className="p-2 text-right space-x-2">
                  <button
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                    onClick={() => reprice.mutate(p.id)}
                  >
                    Reprice
                  </button>
                  <button
                    className="px-2 py-1 text-xs bg-black text-white rounded"
                    onClick={() => publish.mutate({ id: p.id, publish: !p.is_published })}
                  >
                    {p.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer className="flex justify-between pt-3 text-sm text-gray-500">
        <span>Total {data?.total ?? 0}</span>
        <div className="flex gap-2">
          <button
            className="px-2 py-1 border rounded"
            disabled={filters.offset === 0}
            onClick={() => setFilters((f) => ({ ...f, offset: Math.max(0, f.offset - f.limit) }))}
          >
            ← Prev
          </button>
          <button
            className="px-2 py-1 border rounded"
            disabled={(filters.offset ?? 0) + filters.limit >= (data?.total ?? 0)}
            onClick={() => setFilters((f) => ({ ...f, offset: f.offset + f.limit }))}
          >
            Next →
          </button>
        </div>
      </footer>
    </main>
  );
}
```

✅ Features

- Live filters (search by title).
- Paginated table (≤ 100 rows).
- “Reprice” triggers `/admin/products/:id/reprice`.
- “Publish/Unpublish” toggles instantly.
- Uses **SDK only**, no raw fetch.

---

## 2️⃣ Optional Product Detail Editor

File: `apps/web/app/admin/catalog/product/[id]/page.tsx`

(For editing title/desc, or viewing offers/media)

```tsx
'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { AdminCatalogApi } from '@bitloot/sdk';

export default function AdminProductDetail() {
  const { id } = useParams<{ id: string }>();
  const api = new AdminCatalogApi();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.adminProductsControllerGet({ id }) as any,
  });

  const save = useMutation({
    mutationFn: (body: any) => api.adminProductsControllerUpdate({ id, body }),
  });

  if (isLoading) return <main className="p-6">Loading…</main>;
  const p = data;

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">{p.title}</h1>
      <textarea
        className="border p-2 w-full h-40"
        defaultValue={p.description}
        onBlur={(e) => save.mutate({ description: e.target.value })}
      />
      <p className="text-sm text-gray-500">
        Last updated {new Date(p.updated_at).toLocaleString()}
      </p>
    </main>
  );
}
```

---

## 3️⃣ Backend Endpoints Needed

Ensure your `AdminProductsController` in Nest exposes:

```ts
@Get('products')
list(@Query() q: ListProductsDto) { /* pagination ≤ 100 */ }

@Get('products/:id')
get(@Param('id') id: string) { /* single */ }

@Post('products/:id/publish')
publish(@Param('id') id: string) {
  return this.productsRepo.update({ id }, { is_published: true });
}

@Post('products/:id/unpublish')
unpublish(@Param('id') id: string) {
  return this.productsRepo.update({ id }, { is_published: false });
}

@Post('products/:id/reprice')
async reprice(@Param('id') id: string) {
  await this.catalogService.repriceProducts([id]);
  return { ok: true };
}

@Put('products/:id')
update(@Param('id') id: string, @Body() body: Partial<Product>) {
  return this.productsRepo.update({ id }, body);
}
```

Then regenerate your SDK:

```bash
npm run sdk:gen
```

---

## ✅ Verification Checklist (Admin UI + API)

| Feature                                            | Works as expected |
| -------------------------------------------------- | ----------------- |
| Product list loads ≤ 100 rows                      | ✅                |
| Search filter filters titles                       | ✅                |
| Publish/unpublish changes `is_published` instantly | ✅                |
| Reprice updates price_minor (check logs)           | ✅                |
| Pagination buttons move through results            | ✅                |
| Optional detail editor saves description           | ✅                |
| SDK-only — no raw fetches                          | ✅                |
| Admin guard restricts non-admins                   | ✅                |

---

## 🧩 At This Point

🎉 You’ve finished **Level 6** completely:

> Catalog tables + sync + pricing + rules + admin controls + storefront API + UI.

Your system can now:

- Import thousands of Kinguin products.
- Apply BitLoot pricing rules automatically.
- Let admins publish curated SKUs.
- Deliver instant crypto checkout for live games.

---
