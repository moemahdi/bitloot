# Level 2 — Deep dive: Real Payments (NOWPayments Sandbox) — full step-by-step, files, code, tests, verification

Great — Level 2 plugs the real crypto payment flow into your walking skeleton. The goal: replace the fake payment with **NOWPayments sandbox** payments, verify IPNs (HMAC/shared secret), drive the order state machine reliably and idempotently, and surface status to the frontend.

This guide walks you from environment variables → DB changes → backend services/controllers → SDK → frontend changes → tests → verification and common gotchas.

---

# Overview — what changes from Level 1

1. Add a `payments` table/entity to persist payment records (external id, status, raw payload).
2. Replace `payments.create` fake with a server-side call to NOWPayments sandbox API to create an invoice (or payment).
3. Implement `POST /payments/ipn` to accept NOWPayments IPNs, verify the HMAC signature using the `NOWPAYMENTS_IPN_SECRET`, ensure idempotency (process each external ID once), update `orders` accordingly, and enqueue/trigger fulfillment.
4. Frontend navigates to an external `payment_url` (NOWPayments-hosted) and polls order status or handles redirect back.
5. Add logging, metrics points, and tests for HMAC verification and idempotency.

---

# Environment variables (add to `.env` / `.env.example`)

```
# NOWPayments
NOWPAYMENTS_API_KEY=sk_test_xxx
NOWPAYMENTS_IPN_SECRET=ipn_secret_xxx
NOWPAYMENTS_BASE=https://api-sandbox.nowpayments.io
NOWPAYMENTS_CALLBACK_URL=https://your-staging.example.com/api/payments/ipn  # publicly reachable in staging; for local use use ngrok
```

> Important: For local development you’ll need a public endpoint for NOWPayments to reach your IPN endpoint. Use `ngrok http 4000` or a staging server.

---

# DB changes & Entities

## New entity: `payment.entity.ts`

File: `apps/api/src/modules/payments/payment.entity.ts`

```ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type PaymentStatus =
  | 'created'
  | 'waiting'
  | 'confirmed'
  | 'finished'
  | 'failed'
  | 'underpaid';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  externalId!: string; // NOWPayments id (or our generated id)

  @Column({ type: 'uuid', nullable: false })
  orderId!: string;

  @Column({ type: 'varchar', length: 50 })
  provider!: string; // 'nowpayments'

  @Column({ type: 'varchar', length: 30, default: 'created' })
  status!: PaymentStatus;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload?: any;

  @CreateDateColumn() createdAt!: Date;
}
```

### Add migration

Create a migration that creates `payments` table, unique index on `externalId`, index on `orderId`.

---

# Payment state machine (recommended)

- `created` → server created payment record before contacting provider.
- `waiting` → invoice created, waiting for payment (IPN shows waiting).
- `confirmed` → provider acknowledged payment (intermediate).
- `finished` → payment complete and funds confirmed.
- `underpaid` → received but < expected amount.
- `failed` → expired / cancelled.

Orders: map payments into order states:

- If payment reaches `finished` → `orders.status = paid` (then fulfillment job enqueued).
- If `underpaid` → `orders.status = underpaid` (non-refundable path).
- If `failed` → `orders.status = failed`.

Make sure transitions are idempotent.

---

# NOWPayments API integration (server-side)

## Client wrapper

File: `apps/api/src/modules/payments/nowpayments.client.ts`

```ts
import fetch from 'node-fetch';

export type NowCreateResponse = {
  id: string;
  price_amount: string;
  price_currency: string;
  pay_address?: string;
  pay_amount?: string;
  payment_url: string;
  // ...other fields returned by the sandbox
};

export class NowPaymentsClient {
  constructor(
    private apiKey: string,
    private base = process.env.NOWPAYMENTS_BASE,
  ) {}

  async createInvoice({
    orderId,
    amount,
    currency = 'USD',
    callbackUrl,
    outCurrency = 'BTC', // optional: what crypto the client will pay
  }: {
    orderId: string;
    amount: string;
    currency?: string;
    callbackUrl: string;
    outCurrency?: string;
  }): Promise<NowCreateResponse> {
    const res = await fetch(`${this.base}/v1/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: currency,
        order_id: orderId,
        order_description: `BitLoot order ${orderId}`,
        ipn_callback_url: callbackUrl,
        pay_currency: outCurrency,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`nowpayments create failed ${res.status} ${t}`);
    }
    return (await res.json()) as NowCreateResponse;
  }
}
```

> Adjust endpoints and payload to NOWPayments sandbox docs. The sandbox API path and exact keys may differ — verify with their docs (use sandbox base URL).

## Payments service

File: `apps/api/src/modules/payments/payments.service.ts`

```ts
import { Injectable, Logger } from '@nestjs/common';
import { NowPaymentsClient } from './nowpayments.client';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  private logger = new Logger(PaymentsService.name);
  private client: NowPaymentsClient;

  constructor(
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    private readonly orders: OrdersService,
  ) {
    this.client = new NowPaymentsClient(
      process.env.NOWPAYMENTS_API_KEY!,
      process.env.NOWPAYMENTS_BASE,
    );
  }

  async createPaymentForOrder(orderId: string) {
    // load order to know amount (orders.service should expose)
    const order = await this.orders.get(orderId);
    const amount = order.total; // string

    // create local payment record
    const payment = this.paymentsRepo.create({
      externalId: `tmp_${orderId}_${Date.now()}`,
      orderId,
      provider: 'nowpayments',
      status: 'created',
      rawPayload: null,
    });
    const saved = await this.paymentsRepo.save(payment);

    // create invoice at NOWPayments
    const callbackUrl = process.env.NOWPAYMENTS_CALLBACK_URL!;
    const nowResp = await this.client.createInvoice({
      orderId: saved.id, // we can pass our payment id or order id
      amount,
      callbackUrl,
    });

    // update payment record with provider id and status
    saved.externalId = nowResp.id; // NOWPayments id
    saved.status = 'waiting';
    saved.rawPayload = nowResp;
    await this.paymentsRepo.save(saved);

    // return the payment_url to frontend
    return {
      paymentId: saved.id,
      externalId: saved.externalId,
      paymentUrl: nowResp.payment_url,
      amount: nowResp.price_amount,
      currency: nowResp.price_currency,
    };
  }

  // This handles incoming IPN payload after verification (controller will call)
  async handleIpn(payload: any) {
    const externalId =
      payload.id ?? payload.payment_id ?? payload.transaction_id ?? payload.order_id;
    if (!externalId) {
      throw new Error('no external id in ipn');
    }

    // find payment by externalId
    const existing = await this.paymentsRepo.findOne({ where: { externalId } });
    if (!existing) {
      this.logger.warn(
        `IPN for unknown payment externalId=${externalId} payload=${JSON.stringify(payload)}`,
      );
      return { ok: false, reason: 'unknown_payment' };
    }

    // idempotent: if we already processed to finished/underpaid/failed, just return
    if (
      existing.status === 'finished' ||
      existing.status === 'underpaid' ||
      existing.status === 'failed'
    ) {
      this.logger.debug(
        `IPN for already-finalized payment ${externalId} status=${existing.status}`,
      );
      return { ok: true, idempotent: true };
    }

    // rawPayload append
    existing.rawPayload = payload;
    // determine status mapping (depends on NOWPayments payload fields)
    const status = payload.status?.toLowerCase?.() ?? payload.payment_status?.toLowerCase?.();

    // map provider statuses -> internal
    if (status === 'finished' || status === 'successful' || payload.payment_status === 'finished') {
      existing.status = 'finished';
      await this.paymentsRepo.save(existing);

      // mark order paid -> this will enqueue fulfillment in orders.service (or call directly)
      await this.orders.markPaid(existing.orderId);

      return { ok: true };
    }

    if (status === 'underpaid') {
      existing.status = 'underpaid';
      await this.paymentsRepo.save(existing);

      await this.orders.markUnderpaid(existing.orderId);
      return { ok: true };
    }

    if (status === 'failed' || status === 'expired' || status === 'cancelled') {
      existing.status = 'failed';
      await this.paymentsRepo.save(existing);

      await this.orders.markFailed(existing.orderId);
      return { ok: true };
    }

    // otherwise update to waiting
    existing.status = 'waiting';
    await this.paymentsRepo.save(existing);
    return { ok: true };
  }
}
```

> Note: Adjust mapping based on NOWPayments exact IPN payload. The key principle is idempotency: if payment already final, return success without double processing.

---

# IPN controller & HMAC verification

## Security: verify IPN

NOWPayments sends webhook notifications. They may include an HMAC or use an `x-nowpayments-signature` header (example — confirm in docs). The pattern:

1. Read the raw request body (important — Nest must be configured with `rawBody` or express raw body capture).
2. Compute HMAC (e.g., `sha512`) over the raw body with `NOWPAYMENTS_IPN_SECRET`. Compare with header using timing-safe comparison.
3. If mismatch, return 400 and log.

### Controller: `payments.controller.ts` (update)

File: `apps/api/src/modules/payments/payments.controller.ts` (replace fake ipn logic)

```ts
import { Body, Controller, Header, Post, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import * as crypto from 'crypto';

@Controller('payments')
export class PaymentsController {
  private logger = new Logger(PaymentsController.name);
  constructor(private readonly payments: PaymentsService) {}

  @Post('create')
  async create(@Body() body: { orderId: string }) {
    return this.payments.createPaymentForOrder(body.orderId);
  }

  // IPN endpoint — expects raw body
  @Post('ipn')
  async ipn(@Req() req: Request, @Res() res: Response) {
    try {
      const raw = (req as any).rawBody ?? ''; // ensure rawBody middleware set
      const sigHeader = req.headers['x-nowpayments-signature'] as string | undefined;
      const secret = process.env.NOWPAYMENTS_IPN_SECRET!;
      if (!sigHeader || !secret) {
        this.logger.warn('Missing signature or secret');
        return res.status(400).send('missing signature or secret');
      }

      // compute HMAC (e.g., sha512) — confirm algorithm with provider docs
      const computed = crypto.createHmac('sha512', secret).update(raw).digest('hex');

      // timing-safe
      const headerIsHex = /^[0-9a-fA-F]+$/.test(sigHeader);
      const signature = headerIsHex ? sigHeader : Buffer.from(sigHeader).toString('hex');
      const valid = crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
      if (!valid) {
        this.logger.warn(`Invalid IPN signature. computed=${computed} provided=${signature}`);
        return res.status(400).send('invalid signature');
      }

      // parse JSON then pass to service
      const payload = JSON.parse(raw.toString());
      await this.payments.handleIpn(payload);
      // respond 200 quickly
      return res.status(200).send('OK');
    } catch (err) {
      this.logger.error('Error in IPN', err as any);
      return res.status(500).send('error');
    }
  }
}
```

### Important: capture raw request body

In `main.ts` we already used `NestFactory.create(AppModule, { rawBody: true })` in Level 0. If you didn't, ensure Express middleware provides raw body before JSON parser. For Nest/Express, add:

```ts
// in main.ts before app.use(json())
app.use((req, res, next) => {
  let data = '';
  req.on('data', (chunk) => (data += chunk));
  req.on('end', () => {
    (req as any).rawBody = data;
    next();
  });
});
app.use(json({ limit: '1mb' }));
```

But a safer approach is to use `bodyParser.raw` for that route only.

---

# Idempotency & webhook logs

Create `webhook_logs` table or reuse `payments.rawPayload`. For resilience:

- Store each incoming IPN raw body and provider headers in `webhook_logs` with unique constraint on `provider_id`/`external_id`.
- On receipt, try to insert log with unique externalId; if duplicate, skip processing but return 200 (idempotent).

Suggested table: `webhook_logs(id, provider, externalId, rawPayload, createdAt)`.

Implement quick upsert pattern — if insert unique violation -> treat as already processed.

---

# Orders service updates

Extend `orders.service.ts` with helpers:

- `markPaid(orderId)`: transition only if not already paid/fulfilled; enqueue fulfillment (BullMQ) or call storage/emails same as Level 1.
- `markUnderpaid(orderId)`: mark `underpaid` and send notification email.
- `markFailed(orderId)`: mark `failed`, send cancellation email.

Example snippets (append to service):

```ts
async markUnderpaid(orderId: string) {
  await this.ordersRepo.update({ id: orderId }, { status: 'underpaid' });
  const order = await this.get(orderId);
  // optionally send an email informing non-refundable
  // this.emails.sendUnderpaidNotice(order.email, order.id)
}

async markFailed(orderId: string) {
  await this.ordersRepo.update({ id: orderId }, { status: 'failed' });
}
```

Make sure `markPaid` triggers the same fulfillment flow as Level 1 (upload demo key / real later).

---

# Frontend changes

## Payment creation flow

Replace the fake `payments.create` call with the new SDK call that returns the `paymentUrl` from NOWPayments.

Paths/files updated:

- `apps/web/features/checkout/CheckoutForm.tsx`: when create order returns, call `payments.create` and `router.push(paymentUrl)`.

Example:

```ts
const payment = await createPayment.mutateAsync(order.id);
window.location.href = payment.paymentUrl; // navigate to NOWPayments payment page
```

## Payment status UI

NOWPayments supports redirect or callbacks. Two options:

1. **Poll**: After creating invoice, show a waiting page that polls `GET /orders/:id` (this endpoint returns order.status). When status becomes `paid`/`fulfilled`, continue.
2. **Redirect/CMS**: When provider redirects back, you can read query params and confirm by querying API.

Prefer polling for reliability: the IPN may arrive before redirect or not.

### `PaymentStatus.tsx` (polling example)

```tsx
const { data, refetch } = useQuery(
  ['order', orderId],
  async () => {
    const api = new OrdersApi();
    return api.ordersControllerGet({ id: orderId }) as any;
  },
  { refetchInterval: 5000 }, // poll every 5s
);

useEffect(() => {
  if (data?.status === 'fulfilled') {
    router.push(`/orders/${orderId}/success`);
  }
}, [data?.status]);
```

---

# Tests

## Unit tests (payments service)

- Test `NowPaymentsClient.createInvoice` error path (mock fetch).
- Test `PaymentsService.handleIpn` mapping logic: send a payload with `status=finished` and ensure paymentsRepo updated and `orders.markPaid` called.
- Test idempotency: call `handleIpn` twice for same externalId and assert that `orders.markPaid` only called once (use spies/mocks).

## Integration / E2E test (local)

- Start API server and DB.
- Mock NOWPayments by stub server (or use the real sandbox but easier to mock).
- Flow:
  1. Create an order via `POST /orders`.
  2. Call `POST /payments/create` → get `paymentUrl`.
  3. Simulate provider IPN: POST to `/payments/ipn` with signed payload. Use HMAC secret to sign raw JSON body.
  4. Assert order transitions to `fulfilled` and email-sending stub executed.

Example HMAC test helper:

```ts
import * as crypto from 'crypto';
function signPayload(secret: string, payload: any) {
  const raw = JSON.stringify(payload);
  return crypto.createHmac('sha512', secret).update(raw).digest('hex');
}
```

Use this to set the `x-nowpayments-signature` header.

---

# Observability & logging

- Log each created payment (id, amount, url).
- Log IPN headers and externalId at INFO level.
- Add metrics: IPN received count, IPN verification failures, payment-created count, underpaid count.
- Add Sentry error capture for exceptions.

---

# Edge cases & Gotchas

1. **Raw body capture**: If you fail to capture raw body for HMAC, verification fails. Ensure `rawBody` middleware works and only for `ipn` route if you want.
2. **Signature algorithm mismatch**: Confirm algorithm (sha512/sha256) used by NOWPayments. Adjust `crypto.createHmac` accordingly.
3. **IPN payload keys change**: Provider may use `id`, `payment_id`, or `order_id`. Inspect raw payload and map correctly.
4. **Provider external id vs your local id**: Save both. Use your local `payment.id` in DB and `externalId` from provider. Don’t overwrite local `externalId` until you saved both — prefer separate columns `id`, `providerId`.
5. **Clocks & confirmation**: Provider might mark `waiting` then `finished` after confirmations. Polling frequency and timeouts should handle eventual consistency.
6. **Duplicate IPNs**: Providers may send multiple IPNs. Your logic must be idempotent.
7. **Underpayment detection**: Compare `price_amount` vs `paid_amount`. For decimals, parse strings to BigInt-style or use decimal library (e.g., `decimal.js`) to avoid float errors.
8. **Sandbox callback URLs**: NOWPayments may require registered callback URL; for local dev use ngrok and register URL in provider settings.
9. **CORS / redirect loops**: Payment flow typically redirects to provider; ensure FE doesn't leak secrets or expose API keys.
10. **Refund/chargebacks**: Not in MVP scope; mark underpayment as non-refundable. Document policy clearly.

---

# Verification checklist (Definition of Done for Level 2)

- [ ] Env vars set and reachable (`NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, `NOWPAYMENTS_CALLBACK_URL`).
- [ ] DB migration created and applied (payments table).
- [ ] `POST /payments/create` calls NOWPayments sandbox and returns `paymentUrl` and `externalId`.
- [ ] Provider IPN arrives at `/payments/ipn` (simulate with signed payload locally), signature verified and request accepted.
- [ ] IPN processing is idempotent: duplicate IPNs do not double-fulfill.
- [ ] Order transitions: `created → paid → fulfilled` (or `underpaid` / `failed`) according to payload.
- [ ] Frontend navigates to provider `paymentUrl` and polls `GET /orders/:id` → reacts when order becomes `fulfilled`.
- [ ] Logs capture key events (payment created, ipn received, verification failures).
- [ ] Unit tests for HMAC verify and `handleIpn` mapping pass.
- [ ] No secrets in FE, no plaintext keys in emails.

---

# Example flow (end-to-end)

1. User submits email on checkout page → `POST /orders` returns `order.id`.
2. `POST /payments/create` called with `orderId`. Backend:
   - Creates local payment record.
   - Calls NOWPayments sandbox `POST /v1/invoice` with `ipn_callback_url`.
   - Updates payment record with provider id & status `waiting`.
   - Returns `payment.paymentUrl`.

3. Frontend navigates to `paymentUrl`. User completes payment on provider UI.
4. Provider posts IPN JSON to your `NOWPAYMENTS_CALLBACK_URL` with header signature.
5. Your IPN endpoint validates signature, parses payload, finds `payment` by `externalId`, updates status.
6. When status maps to `finished`:
   - Payment record set to `finished`.
   - `orders.markPaid` is called → `orders.status = paid`.
   - Fulfillment flow (same as Level 1) runs, uploading file to R2 and emailing signed link.

7. Frontend polling detects order status updated to `fulfilled` → shows success page.

---

# Recommended small utility & libraries

- `node-fetch` or built-in `fetch` (Node 18+ has fetch).
- `crypto` (Node core) for HMAC + timing-safe compare.
- `decimal.js` or `big.js` for accurate money comparisons.
- `pino` or Nest logger + Sentry for error capture.
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` for R2 signed links (already used in Level 1).

---

# Command snippets

```bash
# Run local infra
docker compose up -d

# Run API
npm run dev:api

# Generate SDK (after updating swagger)
npm run sdk:gen

# Run unit tests
npm run test

# Simulate IPN locally (example using curl)
RAW='{"id":"abc123","status":"finished","payment_status":"finished","price_amount":"1.00","paid_amount":"1.00"}'
SIG=$(node -e "console.log(require('crypto').createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET).update(process.argv[1]).digest('hex'))" "$RAW")
curl -X POST http://localhost:4000/api/payments/ipn -H "Content-Type: application/json" -H "x-nowpayments-signature: $SIG" -d "$RAW"
```

---

# Task: Idempotent IPNs + Async Fulfillment + Admin UI (payments & webhook logs)

## Analysis

You want three upgrades:

1. **Idempotency** via a `webhook_logs` table so duplicate/late IPNs don’t double-process.
2. **Async fulfillment** using **BullMQ** so the IPN handler is fast and never blocks.
3. **Admin UI** to **view payments & webhook logs** with filters/pagination.

These fit perfectly with BitLoot’s golden rules: HMAC-verified, idempotent webhooks; queue heavy work; pagination ≤ 100; no plaintext keys; SDK-first.

---

## Plan

- DB: add `webhook_logs` and (optionally) `webhook_failures` tables, unique index on `(provider, externalId, eventType)` (or `(provider, eventId)` if provider supplies an event id).
- IPN controller: **log first** (upsert). If the insert **conflicts**, return 200 immediately (duplicate). If inserted, **enqueue** a job and return 200 quickly.
- Worker (BullMQ): fetch payment + order, map status, update order state, enqueue **fulfillment job**; in fulfillment job, do R2 + email.
- Admin: backend endpoints for listing payments & logs (filters, date range, pagination); frontend tables.

---

## Technical Approach

### 1) Schema — new tables & indexes

**`webhook_logs`** (stores every accepted IPN):

- `id` (uuid)
- `provider` (e.g., `nowpayments`)
- `externalId` (provider payment/invoice id)
- `eventType` (e.g., `ipn.payment_status_changed` or `payment_status`)
- `requestId` (optional correlation id from provider)
- `signature` (header you verified)
- `rawBody` (text)
- `headers` (jsonb)
- `receivedAt` (timestamptz default now)
- **Unique index** on `(provider, externalId, eventType)` (or `(provider, requestId)` if guaranteed unique)

**(Optional) `webhook_failures`** (if signature invalid or processing error):

- `id`, `provider`, `rawBody`, `headers`, `error`, `receivedAt`

**Migration sketch (TypeORM)**:

```ts
await q.query(`
  CREATE TABLE webhook_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(50) NOT NULL,
    "externalId" varchar(255) NOT NULL,
    "eventType" varchar(100) NOT NULL,
    signature text,
    "rawBody" text NOT NULL,
    headers jsonb,
    "receivedAt" timestamptz NOT NULL DEFAULT now()
  );
`);
await q.query(`
  CREATE UNIQUE INDEX webhook_logs_unique
  ON webhook_logs (provider, "externalId", "eventType");
`);
```

> If NOWPayments provides a unique event id, prefer `UNIQUE(provider, requestId)`.

---

### 2) NestJS: entity + repository

`apps/api/src/modules/webhooks/webhook-log.entity.ts`

```ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('webhook_logs')
@Index('webhook_logs_unique', ['provider', 'externalId', 'eventType'], { unique: true })
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  provider!: string;

  @Column({ length: 255 })
  externalId!: string;

  @Column({ length: 100 })
  eventType!: string;

  @Column({ type: 'text', nullable: true })
  signature!: string | null;

  @Column({ type: 'text' })
  rawBody!: string;

  @Column({ type: 'jsonb', nullable: true })
  headers!: Record<string, any> | null;

  @CreateDateColumn()
  receivedAt!: Date;
}
```

Register it in `AppModule` via `TypeOrmModule.forFeature([WebhookLog])`.

---

### 3) IPN controller: log + enqueue (idempotent)

**Flow:**

- Verify HMAC signature (as you do now).
- Parse payload minimally to extract:
  - `externalId` (provider payment/invoice id)
  - `eventType` (e.g., status name)

- Try to **insert** a `webhook_logs` row with `(provider, externalId, eventType, rawBody, headers, signature)`.
- If **unique violation** → duplicate; return `200 OK` without re-enqueueing.
- If inserted → enqueue `payments:ipn` job with `{ externalId, eventType }` and return `200 OK`.

`apps/api/src/modules/payments/payments.controller.ts` (snippet around IPN):

```ts
import { DataSource } from 'typeorm';
import { WebhookLog } from '../webhooks/webhook-log.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { BullQueue } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('payments')
export class PaymentsController {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @InjectQueue('payments') private readonly paymentsQueue: BullQueue, // define in AppModule
  ) {}

  @Post('ipn')
  async ipn(@Req() req: Request, @Res() res: Response) {
    // 1) verify HMAC (same as before). If invalid -> 400.
    const raw = (req as any).rawBody ?? '';
    const payload = JSON.parse(raw.toString());

    const provider = 'nowpayments';
    const externalId = String(payload.id ?? payload.payment_id ?? payload.order_id ?? '');
    const eventType = String(payload.status ?? payload.payment_status ?? 'unknown');
    const signature = req.headers['x-nowpayments-signature'] as string | undefined;

    if (!externalId) {
      return res.status(200).send('OK');
    } // ignore unknown but do not error-bomb provider

    // 2) insert webhook log with ON CONFLICT DO NOTHING
    try {
      await this.ds
        .createQueryBuilder()
        .insert()
        .into(WebhookLog)
        .values({
          provider,
          externalId,
          eventType,
          signature: signature ?? null,
          rawBody: raw.toString(),
          headers: req.headers as any,
        })
        .orIgnore()
        .execute();
    } catch {
      /* ignore */
    }

    // 3) check if it existed already (unique conflict → nothing inserted)
    const exists = await this.ds
      .getRepository(WebhookLog)
      .findOne({ where: { provider, externalId, eventType } });
    // If this is the first time we're seeing it (i.e., just inserted), enqueue processing marker
    // We can also detect via a RETURNING clause if your driver supports it; simplest is try a separate insert with a unique token.
    await this.paymentsQueue.add(
      'ipn.process',
      { provider, externalId, eventType },
      { attempts: 5, backoff: { type: 'exponential', delay: 500 } },
    );

    // 4) return 200 immediately
    return res.status(200).send('OK');
  }
}
```

> Note: The `orIgnore()` prevents throwing on duplicates; you can also inspect `generatedMaps` or `affected` to learn if it inserted. If you want strict detection, first **attempt insert**, then `select` — either way is fine; duplicates will just enqueue again, but the **worker** must be idempotent too.

---

### 4) BullMQ setup: queue + processors

**Queue registration (AppModule):**

```ts
import { BullModule } from '@nestjs/bullmq';

BullModule.forRoot({ connection: { url: process.env.REDIS_URL } }),
BullModule.registerQueue(
  { name: 'payments' },
  { name: 'fulfillment' },
),
```

**Payments processor** — consumes IPN jobs and updates payment + order:
`apps/api/src/jobs/payments.processor.ts`

```ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PaymentsService } from '../modules/payments/payments.service';

@Processor('payments')
export class PaymentsProcessor extends WorkerHost {
  constructor(private readonly payments: PaymentsService) {
    super();
  }

  async process(job: any) {
    const { provider, externalId } = job.data;
    // Re-fetch the raw payload from webhook_logs if needed
    // Option A: parse again from log
    // Option B: hit provider to retrieve latest payment status (more robust)
    // Here we’ll parse from the last log for that externalId
    const payload = await this.payments.findLatestWebhookPayload(provider, externalId);
    if (!payload) return;

    await this.payments.applyIpnPayload(payload); // pure idempotent mapping (no I/O heavy ops)
  }
}
```

**Fulfillment processor** — does slow work (R2 + email):
`apps/api/src/jobs/fulfillment.processor.ts`

```ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { OrdersService } from '../modules/orders/orders.service';
import { StorageService } from '../modules/storage/storage.service';
import { EmailsService } from '../modules/emails/emails.service';

@Processor('fulfillment')
export class FulfillmentProcessor extends WorkerHost {
  constructor(
    private readonly orders: OrdersService,
    private readonly storage: StorageService,
    private readonly emails: EmailsService,
  ) {
    super();
  }

  async process(job: any) {
    const { orderId } = job.data;

    // generate signed URL (demo key for now)
    const signedUrl = await this.storage.ensureDemoFileAndGetSignedUrl(orderId);

    // set items & mark fulfilled
    const order = await this.orders.fulfill(orderId, signedUrl);

    // notify customer
    await this.emails.sendOrderCompleted(order.email, signedUrl);
  }
}
```

**Wire processors in a JobsModule** and import to `AppModule`.

---

### 5) PaymentsService: idempotent “apply” + enqueue fulfillment

Extend your payments service with two pure helpers:

```ts
async findLatestWebhookPayload(provider: string, externalId: string) {
  const repo = this.ds.getRepository(WebhookLog);
  const latest = await repo.findOne({
    where: { provider, externalId },
    order: { receivedAt: 'DESC' },
  });
  return latest ? JSON.parse(latest.rawBody) : null;
}

async applyIpnPayload(payload: any) {
  const externalId = String(payload.id ?? payload.payment_id ?? payload.order_id);
  const status = String(payload.status ?? payload.payment_status ?? '').toLowerCase();

  const payment = await this.paymentsRepo.findOne({ where: { externalId } });
  if (!payment) return;

  // Already finalized? exit
  if (['finished', 'failed', 'underpaid'].includes(payment.status)) return;

  // map status
  if (status === 'finished') {
    payment.status = 'finished';
    payment.rawPayload = payload;
    await this.paymentsRepo.save(payment);

    // order paid → enqueue fulfillment
    await this.orders.markPaid(payment.orderId);
    await this.fulfillmentQueue.add('deliver', { orderId: payment.orderId }, { attempts: 5, backoff: { type: 'exponential', delay: 1000 }});
    return;
  }

  if (status === 'underpaid') {
    payment.status = 'underpaid';
    payment.rawPayload = payload;
    await this.paymentsRepo.save(payment);
    await this.orders.markUnderpaid(payment.orderId);
    return;
  }

  if (['failed', 'expired', 'cancelled'].includes(status)) {
    payment.status = 'failed';
    payment.rawPayload = payload;
    await this.paymentsRepo.save(payment);
    await this.orders.markFailed(payment.orderId);
    return;
  }

  // otherwise: waiting/confirming
  payment.status = 'waiting';
  payment.rawPayload = payload;
  await this.paymentsRepo.save(payment);
}
```

> Note: inject `@InjectQueue('fulfillment') private readonly fulfillmentQueue: BullQueue` into the service.

---

### 6) Admin API: list payments & webhook logs

Add a minimal **AdminController** with guarded routes.

`apps/api/src/modules/admin/admin.controller.ts`

```ts
import { Controller, Get, Query } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../payments/payment.entity';
import { WebhookLog } from '../webhooks/webhook-log.entity';

function parsePagination(q: any) {
  const limit = Math.min(Math.max(Number(q.limit) || 20, 1), 100);
  const offset = Math.max(Number(q.offset) || 0, 0);
  return { limit, offset };
}

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(WebhookLog) private readonly logsRepo: Repository<WebhookLog>,
  ) {}

  @Get('payments')
  async payments(
    @Query('status') status?: string,
    @Query('orderId') orderId?: string,
    @Query() q?: any,
  ) {
    const { limit, offset } = parsePagination(q);
    const qb = this.paymentsRepo
      .createQueryBuilder('p')
      .orderBy('p.createdAt', 'DESC')
      .take(limit)
      .skip(offset);
    if (status) qb.andWhere('p.status = :status', { status });
    if (orderId) qb.andWhere('p.orderId = :orderId', { orderId });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, limit, offset };
  }

  @Get('webhook-logs')
  async webhookLogs(
    @Query('provider') provider?: string,
    @Query('externalId') externalId?: string,
    @Query('eventType') eventType?: string,
    @Query() q?: any,
  ) {
    const { limit, offset } = parsePagination(q);
    const qb = this.logsRepo
      .createQueryBuilder('w')
      .orderBy('w.receivedAt', 'DESC')
      .take(limit)
      .skip(offset);
    if (provider) qb.andWhere('w.provider = :provider', { provider });
    if (externalId) qb.andWhere('w.externalId = :externalId', { externalId });
    if (eventType) qb.andWhere('w.eventType = :eventType', { eventType });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, limit, offset };
  }
}
```

Add JWT guard as you prefer. Expose via Swagger; regenerate SDK.

---

### 7) Admin UI (Next.js + TanStack Table)

Routes:

```
apps/web/app/admin/payments/page.tsx
apps/web/app/admin/webhooks/page.tsx
```

**Payments table** (sketch):

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';

export default function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', { limit: 50, offset: 0 }],
    queryFn: async () => {
      const api = new AdminApi();
      return api.adminControllerPayments({ limit: 50, offset: 0 }) as any;
    },
  });

  if (isLoading) return <p className="p-6">Loading…</p>;

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-3">Payments</h1>
      <table className="w-full border">
        <thead>
          <tr className="text-left">
            <th className="p-2">Created</th>
            <th className="p-2">Payment ID</th>
            <th className="p-2">External ID</th>
            <th className="p-2">Order ID</th>
            <th className="p-2">Provider</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.map((p: any) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{new Date(p.createdAt).toLocaleString()}</td>
              <td className="p-2">{p.id}</td>
              <td className="p-2">{p.externalId}</td>
              <td className="p-2">{p.orderId}</td>
              <td className="p-2">{p.provider}</td>
              <td className="p-2">{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

**Webhook logs table** (sketch):

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '@bitloot/sdk';

export default function AdminWebhooksPage() {
  const { data } = useQuery({
    queryKey: ['admin-webhooks', { limit: 50, offset: 0 }],
    queryFn: async () => {
      const api = new AdminApi();
      return api.adminControllerWebhookLogs({ limit: 50, offset: 0 }) as any;
    },
  });

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-3">Webhook Logs</h1>
      <table className="w-full border">
        <thead>
          <tr className="text-left">
            <th className="p-2">Received</th>
            <th className="p-2">Provider</th>
            <th className="p-2">External ID</th>
            <th className="p-2">Event</th>
            <th className="p-2">Signature</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.map((w: any) => (
            <tr key={w.id} className="border-t">
              <td className="p-2">{new Date(w.receivedAt).toLocaleString()}</td>
              <td className="p-2">{w.provider}</td>
              <td className="p-2">{w.externalId}</td>
              <td className="p-2">{w.eventType}</td>
              <td className="p-2">{(w.signature || '').slice(0, 16)}…</td>
              <td className="p-2">
                <details>
                  <summary className="cursor-pointer underline">View</summary>
                  <pre className="text-xs whitespace-pre-wrap">{w.rawBody}</pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

> Add filters (status, externalId) with a simple form + query string; paginate with `limit/offset`.

---

## Verification (Definition of Done)

- **Idempotency:**
  - Duplicate IPNs (same `(provider, externalId, eventType)`) yield **single** processed result.
  - IPN endpoint returns **200 quickly** (<100ms typical) regardless of duplicates.

- **Security:**
  - HMAC signature must pass; invalid signature → 400 and **not** logged to `webhook_logs` (optionally log to `webhook_failures`).

- **Async flow:**
  - IPN → enqueued `payments:ipn.process` → updates payment & order → enqueues `fulfillment:deliver` → R2 + email done in worker.

- **Observability:**
  - `webhook_logs` shows every accepted IPN.
  - Admin pages show payments & logs with pagination (≤100).

- **No leakage:**
  - No plaintext keys in emails/UI; **only R2 signed links**.

- **SDK:**
  - Admin endpoints documented in Swagger; SDK regenerated; FE uses SDK only.

---

## Commands

```bash
# Migrations
npm run typeorm migration:generate -n add_webhook_logs
npm run typeorm migration:run

# Workers (you can run them within the API process or separately)
node dist/apps/api/jobs/payments.processor.js
node dist/apps/api/jobs/fulfillment.processor.js

# Dev both apps + workers (add scripts)
npm run dev:all
```

---

## Pro tips

- Keep **heavy work out of IPN**. It must be fast and reliable.
- Make workers **idempotent** too — double-checked reads and final state checks.
- Log **rawBody** for forensics; never store secrets from headers beyond signature needed.
- For money math (underpaid), use **decimal.js**; never floats.
- In Admin UI, add a **“Reprocess”** button that re-enqueues a payment by `externalId` — lifesaver in ops.

---

### Summary

---

## 🧩 Level 2 Summary — Real Payments (NOWPayments Sandbox)

### 🎯 **Goal**

> Replace the fake payment with the **real crypto sandbox flow** — from invoice → IPN → order update → (queued) fulfillment — safely, idempotently, and verifiably.

You now have a **fully functional real crypto checkout**.

---

### ⚙️ **What Level 2 Adds (vs Level 1)**

| Area                   | What you built                                                                   | Why                                          |
| ---------------------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| **Payments DB**        | `payments` table (`id, externalId, status, orderId, rawPayload`)                 | Track real provider invoices and statuses.   |
| **NOWPayments Client** | Server-side class that calls `POST /v1/invoice` (sandbox)                        | Real crypto invoice creation.                |
| **IPN Endpoint**       | `/payments/ipn` with HMAC verification (`x-nowpayments-signature`)               | Verifies authenticity of provider callbacks. |
| **Idempotency Layer**  | `webhook_logs` table + `ON CONFLICT DO NOTHING` + async queue                    | Prevents duplicate processing of IPNs.       |
| **Async Workers**      | BullMQ queues (`payments`, `fulfillment`) + processors                           | Decouple slow work → IPN stays fast.         |
| **State Machine**      | `payments.status` and `orders.status` mapping (`waiting → finished → fulfilled`) | Consistent status transitions.               |
| **Admin UI + API**     | View payments & webhook logs with filters/pagination (≤ 100)                     | Observe and debug real-world payment events. |
| **SDK Update**         | Swagger → regenerate → new Admin and Payments methods                            | FE uses SDK only – no raw fetch.             |
| **Frontend Checkout**  | Redirects to NOWPayments `payment_url`, polls order status                       | Real user crypto payment experience.         |

---

### 🧱 **Architecture Now**

```
Frontend  (Next.js + SDK)
   │
   ├── POST /orders                → create order
   ├── POST /payments/create       → server calls NOWPayments API
   └── redirect → payment_url (sandbox)
        ↓
 NOWPayments  (sandbox)
        ↓  (POST /api/payments/ipn)
 BitLoot API
   ├── Verify HMAC
   ├── Upsert webhook_logs
   ├── Enqueue BullMQ job (payments:ipn)
   └── Return 200 fast
        ↓
 BullMQ Worker
   ├── Apply IPN payload → update payments + orders
   ├── Enqueue fulfillment:deliver
   └── Logs metrics
        ↓
 Fulfillment Worker
   ├── Upload demo key → R2
   ├── Send “Order Completed” email (Resend)
   └── Done ✅
```

---

### ✅ **Definition of Done (Checklist)**

| Category                  | Check                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Env**                   | `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, `NOWPAYMENTS_CALLBACK_URL` set and sandbox reachable                |
| **DB**                    | `payments` and `webhook_logs` tables exist + migrations applied                                                      |
| **API**                   | `POST /payments/create` → returns real `sandbox payment_url`; `POST /payments/ipn` verifies HMAC and enqueues worker |
| **Idempotent Processing** | Duplicate IPNs = single log row + no duplicate fulfillment                                                           |
| **Queue Workers**         | `payments.processor` and `fulfillment.processor` running clean in background                                         |
| **Order Flow**            | Order `created → paid → fulfilled` on successful payment                                                             |
| **Underpayment**          | Orders marked `underpaid` and non-refundable path active                                                             |
| **Admin Dashboard**       | `/admin/payments` + `/admin/webhook-logs` show records with filters/pagination                                       |
| **SDK**                   | Regenerated and frontend uses it (no raw fetch)                                                                      |
| **Frontend Flow**         | User → redirects to sandbox → IPN → auto redirect to “Success” page                                                  |
| **Security**              | HMAC verified with timing-safe compare; no plaintext keys; no API keys in browser                                    |
| **Tests**                 | Unit test for HMAC verify, IPN mapping, and idempotency pass                                                         |
| **CI**                    | `lint + typecheck + tests + build` green                                                                             |

---

### ⚡ **Deliverables**

- `apps/api/src/modules/payments/` → client, service, controller, entity.
- `apps/api/src/modules/webhooks/` → entity + repo.
- `apps/api/src/jobs/payments.processor.ts` + `fulfillment.processor.ts`.
- Migrations for `payments` and `webhook_logs`.
- Admin API + Admin UI tables.
- Updated SDK & frontend checkout logic.

When all that is in place and working end-to-end — **Level 2 is done**.

---
