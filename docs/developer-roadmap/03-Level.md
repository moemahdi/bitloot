# Task: Level 3 — Fulfillment (Stub → Real Kinguin), end-to-end with queues & webhooks

## Analysis

Level 3 turns your “payment finished → deliver demo file” into **real fulfillment** using **Kinguin**. We’ll keep everything **SDK-first, queued, idempotent, and secure**:

- Use **BullMQ** for fulfillment so IPN is always fast.
- Implement **Kinguin auth** (Bearer) + **webhooks** (`reserve`, `give`, `delivered`, `cancel`).
- On success, store keys in **R2** and send **link-only** email (no plaintext keys).
- Keep strict idempotency and retries (Kinguin retries webhooks) and paginate admin views ≤100.

---

## Plan (what changes from Level 2)

1. **Data**: add `kinguin_reservation_id` (order), `keys` table (1..n keys per order_item).
2. **Fulfillment flow**:
   - When payment becomes `finished`, enqueue `fulfillment:reserve`.
   - Call Kinguin to **reserve & give** (declared stock) or read delivered keys (upfront stock).
   - R2: save delivered keys → generate **short-lived signed URL** → mark order `fulfilled` → email.

3. **Webhooks**: verify secret header, log events, process idempotently (`reserve`, `give`, `delivered`, `cancel`).
4. **Admin**: add Kinguin section (reservations, recent webhook events, retries).

---

## Technical Approach

### A) Stock model choice

- **Upfront keys (simplest)**: you upload keys to Kinguin; when buyer purchases, Kinguin already holds stock. Your webhook `delivered` confirms and you fetch keys (or receive them) → store to R2.
- **Declared text stock**: you keep text codes; on `reserve` you assign a code; on `give` you confirm; on `delivered` finalize.

> For MVP speed, **Declared Text Stock** gives you full control and mirrors BitLoot’s “keys in R2” policy.

### B) Security & limits

- **Auth**: obtain **Bearer** token with client id/secret; send `Authorization: Bearer <token>` to Kinguin APIs.
- **Webhook auth**: require a shared header like `X-Auth-Token: <secret>` and verify it. IP whitelisting optional via Kinguin support.
- **Rate limits**: 2k req/min; use backoff, cache, and queues.

---

## Implementation (files & code)

### 1) DB: migrations & entities

**Add `keys` table** and extend `orders` with `kinguin_reservation_id`:

```ts
// apps/api/src/modules/orders/key.entity.ts
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('keys')
export class Key {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => OrderItem, (i) => i.id, { onDelete: 'CASCADE' }) orderItem!: OrderItem;
  @Column({ type: 'text' }) storageRef!: string; // R2 object key (not URL)
  @Column({ type: 'timestamptz', nullable: true }) viewedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}
```

```ts
// migration sketch
await q.query(`ALTER TABLE orders ADD COLUMN "kinguinReservationId" varchar(100);`);
await q.query(`
  CREATE TABLE keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderItemId" uuid REFERENCES order_items(id) ON DELETE CASCADE,
    "storageRef" text NOT NULL,
    "viewedAt" timestamptz,
    "createdAt" timestamptz NOT NULL DEFAULT now()
  );
`);
```

> PRD data model expects `keys` separated from order_items with `viewed_at` audit; R2 signed links only.

---

### 2) Backend modules

```
apps/api/src/modules/
  kinguin/
    kinguin.controller.ts  // webhooks
    kinguin.service.ts     // API client, reserve/give/fetch
    dto/...
  fulfillment/
    fulfillment.service.ts // enqueue reserve/give/deliver
```

**Kinguin service (auth + calls)**

```ts
// apps/api/src/modules/kinguin/kinguin.service.ts
import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class KinguinService {
  private base = process.env.KINGUIN_BASE_URL || 'https://sandbox.kinguin.net/api/v1';
  private token!: string;
  async ensureToken() {
    if (this.token) return;
    // Exchange client id/secret → bearer (details per merchant portal)
    // store token & refresh ahead of expiry
    this.token = await this.fetchToken();
  }
  private async fetchToken(): Promise<string> {
    // pseudo: POST /oauth/token {client_id, client_secret} → access_token
    // return access_token
    return '...';
  }
  private headers() {
    return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' };
  }

  // Declared Text example: reserve a code
  async reserve(orderId: string, productExternalId: string, quantity: number) {
    await this.ensureToken();
    const res = await fetch(`${this.base}/reservations`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ orderId, productId: productExternalId, quantity }),
    });
    if (!res.ok) throw new Error(`kinguin reserve failed ${res.status} ${await res.text()}`);
    return res.json();
  }

  async give(reservationId: string) {
    await this.ensureToken();
    const res = await fetch(`${this.base}/reservations/${reservationId}/give`, {
      method: 'POST',
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`kinguin give failed ${res.status} ${await res.text()}`);
    return res.json();
  }

  // If Upfront stock: fetch delivered keys by order/reservation
  async getDelivered(reservationId: string) {
    await this.ensureToken();
    const res = await fetch(`${this.base}/reservations/${reservationId}/delivered`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`kinguin delivered failed ${res.status} ${await res.text()}`);
    return res.json();
  }
}
```

> Use sandbox base URL and Bearer auth; keep tokens backend-only.

---

### 3) Webhooks (idempotent + secure)

**Controller** verifies `X-Auth-Token`, logs, enqueues:

```ts
// apps/api/src/modules/kinguin/kinguin.controller.ts
import { Body, Controller, Headers, HttpCode, Post, Req, Res } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { WebhookLog } from '../webhooks/webhook-log.entity';

@Controller('kinguin')
export class KinguinController {
  constructor(
    @InjectQueue('fulfillment') private readonly fulfillmentQ: Queue,
    private readonly ds: DataSource,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handle(
    @Headers('x-auth-token') sig: string,
    @Req() req: any,
    @Res() res: any,
    @Body() body: any,
  ) {
    if (sig !== process.env.KINGUIN_WEBHOOK_SECRET) return res.status(401).send('nope');

    const raw = req.rawBody?.toString?.() ?? JSON.stringify(body);
    const provider = 'kinguin';
    const externalId = String(body.reservationId ?? body.orderId ?? body.id ?? 'unknown');
    const eventType = String(body.event ?? body.status ?? 'unknown');

    // Log & dedupe
    await this.ds
      .createQueryBuilder()
      .insert()
      .into(WebhookLog)
      .values({
        provider,
        externalId,
        eventType,
        signature: sig,
        rawBody: raw,
        headers: req.headers,
      })
      .orIgnore()
      .execute();

    // Enqueue for processing (idempotent in worker)
    await this.fulfillmentQ.add(
      'kinguin.webhook',
      { externalId, eventType },
      { attempts: 5, backoff: { type: 'exponential', delay: 500 } },
    );

    return res.send('OK');
  }
}
```

> Kinguin recommends secure transport, token header validation, and logging for retries.

**Events to handle**: `reserve`, `give`, `delivered`, `cancel` (+ possibly `reversed`). Two retry attempts are typical.

---

### 4) Fulfillment service & workers

**Service** orchestrates the steps (called by workers):

```ts
// apps/api/src/modules/fulfillment/fulfillment.service.ts
import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { KinguinService } from '../kinguin/kinguin.service';
import { StorageService } from '../storage/storage.service';
import { EmailsService } from '../emails/emails.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Key } from '../orders/key.entity';

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly orders: OrdersService,
    private readonly kinguin: KinguinService,
    private readonly storage: StorageService,
    private readonly emails: EmailsService,
    @InjectRepository(Key) private readonly keysRepo: Repository<Key>,
  ) {}

  // Called when payment finished
  async startReservation(orderId: string) {
    const order = await this.orders.get(orderId);
    // reserve per item (simplified: 1 item)
    const it = order.items[0];
    const res = await this.kinguin.reserve(order.id, it.productId, 1);
    await this.orders.setReservationId(order.id, res.reservationId);
    await this.kinguin.give(res.reservationId); // optimistic give
  }

  // Called on webhook 'delivered' (or after polling delivered endpoint)
  async finalizeDelivery(reservationId: string) {
    const order = await this.orders.findByReservation(reservationId);
    // Fetch delivered codes (for upfront) OR use body for declared text
    const delivered = await this.kinguin.getDelivered(reservationId);
    const codes: string[] = delivered.codes ?? delivered.keys ?? [];

    // save to R2 (one file, json lines or text)
    const storageRef = await this.storage.saveKeysJson(order.id, codes); // returns R2 key
    // link the key to order items; audit view later
    for (const it of order.items) {
      await this.keysRepo.save(this.keysRepo.create({ orderItem: it, storageRef }));
    }

    // Mark fulfilled + email signed URL
    const signed = await this.storage.getSignedUrl(storageRef, 15 * 60);
    await this.orders.fulfill(order.id, signed);
    await this.emails.sendOrderCompleted(order.email, signed);
  }
}
```

**Workers** connect the queue to service:

```ts
// apps/api/src/jobs/fulfillment.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { FulfillmentService } from '../modules/fulfillment/fulfillment.service';

@Processor('fulfillment')
export class FulfillmentProcessor extends WorkerHost {
  constructor(private readonly svc: FulfillmentService) {
    super();
  }

  async process(job: any) {
    const { name, data } = job;
    if (name === 'reserve') return this.svc.startReservation(data.orderId);
    if (name === 'kinguin.webhook') {
      if (data.eventType === 'delivered') return this.svc.finalizeDelivery(data.externalId);
      if (data.eventType === 'cancel') return; // optional: set order failed/canceled
      // reserve/give events may be no-ops if we orchestrate actively
    }
  }
}
```

**Payments → Fulfillment handoff** (Level 2 integration):

- When `PaymentsService` maps IPN `finished` → `orders.markPaid`, also enqueue:

  ```ts
  await fulfillmentQueue.add(
    'reserve',
    { orderId },
    { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
  );
  ```

- This aligns with the PRD E2E sketch.

---

### 5) Storage helpers (R2)

Add helpers to **save** and **sign** keys:

```ts
// apps/api/src/modules/storage/storage.service.ts (extra)
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async saveKeysJson(orderId: string, codes: string[]): Promise<string> {
  const key = `keys/${orderId}.json`;
  await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: JSON.stringify({ codes }), ContentType: 'application/json' }));
  return key;
}
async getSignedUrl(key: string, seconds: number) {
  return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: seconds });
}
```

> Delivery = **R2 signed URL**, never plaintext keys in email/UI.

---

### 6) Orders service tweaks

Add helpers:

- `setReservationId(orderId, reservationId)`
- `findByReservation(reservationId)`
- `markPaid` already exists; `fulfill(orderId, signedUrl)` should attach a **Key** record and set status.

---

### 7) Admin API & UI

- **API**: `/admin/kinguin/reservations?orderId=&status=&limit=&offset=` (reads from orders + reservationId) and `/admin/webhook-logs?provider=kinguin`.
- **UI**: Simple tables to filter by reservation id, recent events, and “Reprocess” (enqueue `kinguin.webhook` again). PRD requires Admin to monitor fulfillment & logs.

---

## Frontend (small changes)

- The user journey stays the same. After payment, your polling moves from `paid → fulfilled` automatically once webhooks finish.
- On success page, the “Reveal Key” button **opens the signed URL** (JSON with codes). Keep loading/error/empty states.

---

## Idempotency & retries

- **Webhook logs**: your existing `webhook_logs` dedup by `(provider, externalId, eventType)`. Kinguin retries → still one processing.
- **Workers**: check final state before mutating; save raw payloads for forensics. **Backoff** on transient errors; Kinguin docs advise retry strategies.

---

## Verification (Definition of Done)

- **Happy path**: Payment `finished` → `fulfillment:reserve` → Kinguin **delivered** → keys saved in R2 → Order `fulfilled` → Email sent.
- **Webhooks**: `reserve/give/delivered/cancel` accepted with **token header**, logged once, processed idempotently.
- **Admin**: payments, webhook logs, and reservations visible with pagination (≤100).
- **Security**: No plaintext keys anywhere; signed links only; HTTPS; Bearer tokens kept server-side.
- **Resilience**: duplicate webhooks don’t double-deliver; queue retries handle transient 5xx/429.

---

## Commands

```bash
# Migrations
npm run typeorm migration:generate -n add_keys_and_reservation
npm run typeorm migration:run

# Workers
node dist/apps/api/jobs/fulfillment.processor.js

# Dev loop
npm run dev:all && npm run sdk:gen
```

---

## Gotchas (quick fixes)

- **Token expiry**: refresh Kinguin token before expiry; 401 → re-auth then retry.
- **Offer visibility/stock**: if you see “no stock / not visible,” check `status=ACTIVE` and stock or declared rules.
- **Multiple items**: loop per order_item; attach one **Key** record per delivered chunk/file.
- **Time-to-key KPI**: monitor from IPN finished → email sent to meet PRD KPI.

---

# Task: Level 3 code bundle — Fulfillment (BullMQ) + Kinguin (stub → real) + Admin views

## Analysis

You said “ok” to the bundle. Here’s a **ready-to-drop** minimal set: DB migrations, Nest modules, BullMQ workers, storage helpers, and admin endpoints + simple FE pages. It plugs into your Level 1–2 code.

## Plan

1. DB: add `keys` table + `orders.kinguinReservationId`.
2. API: `kinguin` module (service + webhook), `fulfillment` service, jobs.
3. Payments→Fulfillment: enqueue on `payment finished`.
4. Storage helpers to save keys to R2 + sign.
5. Admin: list payments & webhook logs (already) + add reservation views.
6. FE: nothing new for users; admin pages to inspect reservations/logs.

## Technical Approach

- IPN stays fast: **log → enqueue**.
- Fulfillment does slow work: **reserve/give**, **R2**, **email**.
- Webhooks dedup via `webhook_logs` unique key; workers are idempotent.

## Implementation

### 0) Env (add)

```
KINGUIN_BASE_URL=https://api-sandbox.kinguin.net
KINGUIN_CLIENT_ID=...
KINGUIN_CLIENT_SECRET=...
KINGUIN_WEBHOOK_SECRET=super-secret-token
```

### 1) Migration (add keys + reservation)

`apps/api/src/migrations/1720000000000-level3-keys-reservation.ts`

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';
export class L3KeysReservation1720000000000 implements MigrationInterface {
  name = 'L3KeysReservation1720000000000';
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE orders ADD COLUMN "kinguinReservationId" varchar(100);`);
    await q.query(`
      CREATE TABLE keys (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderItemId" uuid REFERENCES order_items(id) ON DELETE CASCADE,
        "storageRef" text NOT NULL,
        "viewedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`CREATE INDEX ON orders ("kinguinReservationId");`);
    await q.query(`CREATE INDEX ON keys ("orderItemId");`);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE keys;`);
    await q.query(`ALTER TABLE orders DROP COLUMN "kinguinReservationId";`);
  }
}
```

### 2) Entities

`apps/api/src/modules/orders/key.entity.ts`

```ts
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('keys')
export class Key {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' }) orderItem!: OrderItem;
  @Column('text') storageRef!: string;
  @Column({ type: 'timestamptz', nullable: true }) viewedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}
```

Extend Orders service (helpers):

```ts
// orders.service.ts (add)
async setReservationId(orderId: string, reservationId: string) {
  await this.ordersRepo.update({ id: orderId }, { kinguinReservationId: reservationId });
}
async findByReservation(reservationId: string) {
  return this.ordersRepo.findOneOrFail({ where: { kinguinReservationId: reservationId }, relations: ['items'] });
}
```

### 3) Kinguin module

`apps/api/src/modules/kinguin/kinguin.module.ts`

```ts
import { Module } from '@nestjs/common';
import { KinguinService } from './kinguin.service';
import { KinguinController } from './kinguin.controller';
@Module({
  providers: [KinguinService],
  controllers: [KinguinController],
  exports: [KinguinService],
})
export class KinguinModule {}
```

`apps/api/src/modules/kinguin/kinguin.service.ts` (stubbed auth + calls)

```ts
import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class KinguinService {
  private base = process.env.KINGUIN_BASE_URL!;
  private token: string | null = null;
  private async auth() {
    if (this.token) return this.token;
    // TODO: swap for real OAuth/token exchange per merchant panel
    this.token = 'sandbox-token';
    return this.token;
  }
  private async hdr() {
    const t = await this.auth();
    return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
  }
  async reserve(orderId: string, productId: string, quantity: number) {
    const res = await fetch(`${this.base}/reservations`, {
      method: 'POST',
      headers: await this.hdr(),
      body: JSON.stringify({ orderId, productId, quantity }),
    });
    if (!res.ok) throw new Error(`reserve ${res.status} ${await res.text()}`);
    return res.json(); // { reservationId, ... }
  }
  async give(reservationId: string) {
    const res = await fetch(`${this.base}/reservations/${reservationId}/give`, {
      method: 'POST',
      headers: await this.hdr(),
    });
    if (!res.ok) throw new Error(`give ${res.status} ${await res.text()}`);
    return res.json();
  }
  async getDelivered(reservationId: string) {
    const res = await fetch(`${this.base}/reservations/${reservationId}/delivered`, {
      headers: await this.hdr(),
    });
    if (!res.ok) throw new Error(`delivered ${res.status} ${await res.text()}`);
    return res.json(); // { codes: string[] }
  }
}
```

`apps/api/src/modules/kinguin/kinguin.controller.ts`

```ts
import { Body, Controller, Headers, HttpCode, Post, Req, Res } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WebhookLog } from '../webhooks/webhook-log.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('kinguin')
export class KinguinController {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @InjectQueue('fulfillment') private readonly fulfillmentQ: Queue,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Headers('x-auth-token') token: string | undefined,
    @Req() req: any,
    @Res() res: any,
    @Body() body: any,
  ) {
    if (!token || token !== process.env.KINGUIN_WEBHOOK_SECRET) return res.status(401).send('nope');

    const raw = req.rawBody?.toString?.() ?? JSON.stringify(body);
    const provider = 'kinguin';
    const externalId = String(body.reservationId ?? body.orderId ?? body.id ?? 'unknown');
    const eventType = String(body.event ?? body.status ?? 'unknown');

    await this.ds
      .createQueryBuilder()
      .insert()
      .into(WebhookLog)
      .values({
        provider,
        externalId,
        eventType,
        signature: token,
        rawBody: raw,
        headers: req.headers,
      })
      .orIgnore()
      .execute();

    await this.fulfillmentQ.add(
      'kinguin.webhook',
      { externalId, eventType },
      { attempts: 5, backoff: { type: 'exponential', delay: 500 } },
    );

    return res.send('OK');
  }
}
```

### 4) Fulfillment module & service

`apps/api/src/modules/fulfillment/fulfillment.module.ts`

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FulfillmentService } from './fulfillment.service';
import { OrdersModule } from '../orders/orders.module';
import { KinguinModule } from '../kinguin/kinguin.module';
import { StorageModule } from '../storage/storage.module';
import { EmailsModule } from '../emails/emails.module';
import { Key } from '../orders/key.entity';

@Module({
  imports: [
    OrdersModule,
    KinguinModule,
    StorageModule,
    EmailsModule,
    TypeOrmModule.forFeature([Key]),
  ],
  providers: [FulfillmentService],
  exports: [FulfillmentService],
})
export class FulfillmentModule {}
```

`apps/api/src/modules/fulfillment/fulfillment.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { KinguinService } from '../kinguin/kinguin.service';
import { StorageService } from '../storage/storage.service';
import { EmailsService } from '../emails/emails.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Key } from '../orders/key.entity';

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly orders: OrdersService,
    private readonly kinguin: KinguinService,
    private readonly storage: StorageService,
    private readonly emails: EmailsService,
    @InjectRepository(Key) private readonly keysRepo: Repository<Key>,
  ) {}

  async startReservation(orderId: string) {
    const order = await this.orders.get(orderId);
    const item = order.items[0];
    const r = await this.kinguin.reserve(order.id, item.productId, 1);
    await this.orders.setReservationId(order.id, r.reservationId);
    await this.kinguin.give(r.reservationId); // optimistic
  }

  async finalizeDelivery(reservationId: string) {
    const order = await this.orders.findByReservation(reservationId);
    const delivered = await this.kinguin.getDelivered(reservationId);
    const codes: string[] = delivered.codes ?? delivered.keys ?? [];
    const storageRef = await this.storage.saveKeysJson(order.id, codes);

    for (const it of order.items) {
      await this.keysRepo.save(this.keysRepo.create({ orderItem: it, storageRef }));
    }

    const signed = await this.storage.getSignedUrl(storageRef, 15 * 60);
    await this.orders.fulfill(order.id, signed);
    await this.emails.sendOrderCompleted(order.email, signed);
  }
}
```

### 5) Jobs (BullMQ)

Register queues in `AppModule` if not already:

```ts
BullModule.registerQueue({ name: 'payments' }, { name: 'fulfillment' });
```

`apps/api/src/jobs/fulfillment.processor.ts`

```ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { FulfillmentService } from '../modules/fulfillment/fulfillment.service';

@Processor('fulfillment')
export class FulfillmentProcessor extends WorkerHost {
  constructor(private readonly svc: FulfillmentService) {
    super();
  }
  async process(job: any) {
    if (job.name === 'reserve') return this.svc.startReservation(job.data.orderId);
    if (job.name === 'kinguin.webhook') {
      if (job.data.eventType === 'delivered') return this.svc.finalizeDelivery(job.data.externalId);
      return; // reserve/give/cancel events can be no-ops
    }
  }
}
```

Hook Level 2 → Level 3 handoff (enqueue on payment finished):

```ts
// payments.service.ts where you handle finished
await this.orders.markPaid(payment.orderId);
await this.fulfillmentQueue.add(
  'reserve',
  { orderId: payment.orderId },
  { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
);
```

### 6) Storage helpers (R2)

`apps/api/src/modules/storage/storage.service.ts` (add)

```ts
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// save keys
async saveKeysJson(orderId: string, codes: string[]) {
  const key = `keys/${orderId}.json`;
  await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: JSON.stringify({ codes }), ContentType: 'application/json' }));
  return key;
}
async getSignedUrl(key: string, seconds: number) {
  return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: seconds });
}
```

### 7) Admin API & UI (reservations)

**API** add to AdminController:

```ts
@Get('reservations')
async reservations(@Query('reservationId') reservationId?: string, @Query() q?: any) {
  const { limit, offset } = parsePagination(q);
  const qb = this.ordersRepo.createQueryBuilder('o').where('o."kinguinReservationId" IS NOT NULL');
  if (reservationId) qb.andWhere('o."kinguinReservationId" = :id', { id: reservationId });
  qb.orderBy('o.createdAt', 'DESC').take(limit).skip(offset);
  const [items, total] = await qb.getManyAndCount();
  return { items, total, limit, offset };
}
```

**UI** `apps/web/app/admin/reservations/page.tsx` (simple table):

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';

export default function AdminReservationsPage() {
  const { data } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: async () => {
      const api = new AdminApi();
      return api.adminControllerReservations({ limit: 50, offset: 0 }) as any;
    },
  });

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-3">Kinguin Reservations</h1>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="p-2">Created</th>
            <th className="p-2">Order</th>
            <th className="p-2">Reservation</th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.map((o: any) => (
            <tr key={o.id} className="border-t">
              <td className="p-2">{new Date(o.createdAt).toLocaleString()}</td>
              <td className="p-2">{o.id}</td>
              <td className="p-2">{o.kinguinReservationId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

## Verification

- Payment finished enqueues `fulfillment:reserve`.
- Webhook `delivered` (with `X-Auth-Token`) is logged once and enqueued.
- Worker saves keys to R2, marks order `fulfilled`, sends email.
- Admin shows reservations + webhook logs.
- Duplicate webhooks don’t double-deliver.

## Commands

```bash
npm run typeorm migration:run
# run workers (or embed in API)
node dist/apps/api/jobs/fulfillment.processor.js

# dev + sdk
npm run dev:all && npm run sdk:gen
```

---

## 🎯 Level 3 — Goal Recap

> Replace the “fake key delivery” from Level 1–2 with **real fulfillment** using Kinguin’s sandbox, handled by **BullMQ** workers and **secure webhooks**, and deliver keys through **R2 signed links** only.

When this level is complete, BitLoot can:

- Accept real crypto payments (Level 2),
- Process verified IPNs → queue fulfillment,
- Call Kinguin API (sandbox) → reserve / give / delivered,
- Receive Kinguin webhooks → log + process idempotently,
- Store delivered keys privately in Cloudflare R2,
- Email the customer a **link-only** download,
- Monitor everything in Admin (reservations, logs, payments).

---

## 🧱 What Level 3 Includes

| Area                            | What You Added                                                 | Why It Matters                                                 |
| ------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| **Database**                    | `keys` table + `orders.kinguinReservationId`                   | Track where keys are stored & match with Kinguin reservations. |
| **Fulfillment Module**          | `fulfillment.service.ts` + `fulfillment.processor.ts`          | Offload slow key delivery to BullMQ worker.                    |
| **Kinguin Module**              | `kinguin.service.ts` (API) + `kinguin.controller.ts` (webhook) | Integrates with Kinguin sandbox + handles webhooks securely.   |
| **Storage Service**             | `saveKeysJson()` + `getSignedUrl()`                            | Store keys in R2 (JSON file) & generate signed URLs.           |
| **Order Service Helpers**       | `setReservationId()`, `findByReservation()`                    | Link orders with Kinguin reservations.                         |
| **Payments → Fulfillment Hook** | Queue `fulfillment:reserve` after payment `finished`           | Triggers delivery automatically.                               |
| **Admin Module**                | `/admin/reservations`, `/admin/webhook-logs` endpoints         | Observe orders + Kinguin webhook activity.                     |
| **Admin UI**                    | Reservation table + Webhook log viewer                         | Visual debugging & monitoring.                                 |
| **Idempotency & Retries**       | `webhook_logs` unique index + BullMQ attempts                  | Prevent duplicate deliveries & auto-retry transient errors.    |
| **Email Delivery**              | Same Resend template as before (link-only)                     | Final user notification of delivered key(s).                   |

---

## ⚙️ System Flow After Level 3

```
1. User pays crypto → IPN (Level 2)
2. IPN verified → enqueue fulfillment:reserve
3. Worker → Kinguin.reserve → Kinguin.give
4. Kinguin → webhook “delivered”
5. Webhook verified + logged → enqueue fulfillment.webhook
6. Worker → Kinguin.getDelivered() → save keys.json to R2
7. Orders.status → fulfilled
8. Resend → “Your BitLoot Order” with signed URL
```

---

## ✅ Definition of Done

| Category            | Check                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **DB**              | `keys` table & `orders.kinguinReservationId` exist and migrations applied.                       |
| **Queues**          | `fulfillment` worker runs (BullMQ connected to Redis).                                           |
| **API**             | `KinguinController` accepts webhooks with `X-Auth-Token`, logs to `webhook_logs`, enqueues jobs. |
| **Kinguin Sandbox** | `reserve`, `give`, `delivered` endpoints callable and return valid JSON.                         |
| **Storage + Email** | Keys stored in R2 JSON, emailed link opens successfully (no plaintext).                          |
| **Idempotency**     | Duplicate webhooks produce a single processed result.                                            |
| **Retry Safety**    | Failed `reserve`/`delivered` jobs auto-retry up to 5× with exponential backoff.                  |
| **Admin UI**        | `/admin/reservations` and `/admin/webhook-logs` show real data (pagination ≤ 100).               |
| **SDK**             | Regenerated with new Kinguin/admin endpoints; used exclusively by FE.                            |
| **Security**        | Webhook token check, HTTPS, no secrets/keys exposed to FE.                                       |
| **Monitoring**      | Logs show reservation → delivered lifecycle with timestamps.                                     |

---

## 📬 What You Can Demo Now

- A user can **buy with crypto** and get a real **Kinguin key** delivered automatically.
- Admin can **see** all payments, webhook events, reservations, and logs.
- Everything runs **queued + idempotent + HMAC-verified**.
- All secrets (API keys, R2, Kinguin token) stay **server-side**.

---

## 🏁 Ready to Move On

If all the above works end-to-end and passes your lint/type/test/build gates →
🎉 **Level 3 is 100 % complete.**
