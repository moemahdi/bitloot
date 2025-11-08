# Task: Level 1 — Walking Skeleton (fake checkout: order → fake pay → email a signed link)

## Analysis

Level 1 proves your core pipeline _without real vendors_: a user enters an email, “pays” (fake), your API marks the order paid, a queue (or direct call for now) “fulfills,” you upload a **test file** to R2, and the user receives an **email containing a short-lived signed link** (never plaintext keys). When this level is done, you have a real end-to-end experience you can click through.

---

## Plan

1. **Data model (minimal)**: `orders` (email, status, total), `order_items` (productId, signedUrl).
2. **API routes**:
   - `POST /orders` (create an order)
   - `POST /payments/create` (return a fake `payment_url` + externalId)
   - `POST /payments/ipn` (fake IPN to mark paid and trigger fulfillment)

3. **Fulfillment stub**: Generate an R2 **signed URL** for a static “demo key file” and store it on the order item.
4. **Emails**: Send “Order Completed” with the **signed URL** via Resend.
5. **Frontend**: Product page with a tiny checkout drawer (email + pay). After “pay,” hit the fake IPN, then show “Reveal” button that opens the signed link.
6. **Tests + verification**: minimal unit/E2E checks; end-to-end manual run.

---

## Technical Approach

- **State machine**: `order.status` → `created → paid → fulfilled`.
- **Fake payment**: backend returns a dummy URL (we’ll just navigate there), then we call IPN back into API.
- **Fulfillment**: in Level 1, do it inline after IPN (no queue yet).
- **R2 storage**: use AWS SDK v3 S3-compatible client; save a small text file (e.g., `YOUR-KEY-EXAMPLE.txt`) on first run or generate one dynamically. Provide signed GET URL (~10–15 min).
- **Email**: Resend transactional template with a **button to the signed link**.
- **Frontend**: Next.js app router, **TanStack Query** for API calls, **React Hook Form + Zod** for the email form, all network via **BitLoot SDK**.

---

## Implementation

### 1) Folders & files (API)

```
apps/api/src/modules/
  orders/
    order.entity.ts
    order-item.entity.ts
    dto/create-order.dto.ts
    orders.controller.ts
    orders.service.ts
  payments/
    dto/create-payment.dto.ts
    payments.controller.ts
    payments.service.ts
  storage/
    storage.service.ts
  emails/
    emails.service.ts
```

#### `order.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'created' | 'paid' | 'fulfilled';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({ type: 'varchar', length: 20, default: 'created' })
  status!: OrderStatus;

  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  total!: string; // store as string to avoid FP issues

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
  items!: OrderItem[];

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
```

#### `order-item.entity.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  order!: Order;

  @Column({ type: 'varchar', length: 100 })
  productId!: string; // e.g., "demo-product"

  @Column({ type: 'text', nullable: true })
  signedUrl!: string | null;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
```

#### `create-order.dto.ts`

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty({ default: 'demo-product' }) @IsString() @IsNotEmpty() productId!: string;
  @ApiProperty({ required: false }) @IsOptional() note?: string;
}
```

#### `orders.service.ts` (minimal, no transactions yet)

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemsRepo: Repository<OrderItem>,
  ) {}

  async create(dto: CreateOrderDto) {
    const order = this.ordersRepo.create({
      email: dto.email,
      status: 'created',
      total: '1.00', // for level 1, hardcode a price
      items: [this.itemsRepo.create({ productId: dto.productId })],
    });
    return this.ordersRepo.save(order);
  }

  async markPaid(orderId: string) {
    await this.ordersRepo.update({ id: orderId }, { status: 'paid' });
    return this.ordersRepo.findOneOrFail({ where: { id: orderId }, relations: ['items'] });
  }

  async fulfill(orderId: string, signedUrl: string) {
    const order = await this.ordersRepo.findOneOrFail({
      where: { id: orderId },
      relations: ['items'],
    });
    order.items.forEach((i) => (i.signedUrl = signedUrl));
    await this.itemsRepo.save(order.items);
    await this.ordersRepo.update({ id: orderId }, { status: 'fulfilled' });
    return this.ordersRepo.findOneOrFail({ where: { id: orderId }, relations: ['items'] });
  }

  async get(id: string) {
    return this.ordersRepo.findOneOrFail({ where: { id }, relations: ['items'] });
  }
}
```

#### `orders.controller.ts`

```ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.get(id);
  }
}
```

---

### 2) Fake payments (API)

#### `create-payment.dto.ts`

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty() @IsUUID() orderId!: string;
}
```

#### `payments.service.ts` (fake)

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  createFakePayment(orderId: string) {
    const externalId = `fake_${orderId}`;
    // A pretend checkout page the web app can navigate to (front-end route)
    const paymentUrl = `/pay/${orderId}?ext=${externalId}`;
    return { externalId, paymentUrl };
  }
}
```

#### `payments.controller.ts`

```ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { StorageService } from '../storage/storage.service';
import { EmailsService } from '../emails/emails.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService,
    private readonly storage: StorageService,
    private readonly emails: EmailsService,
  ) {}

  @Post('create')
  create(@Body() dto: CreatePaymentDto) {
    return this.payments.createFakePayment(dto.orderId);
  }

  // Fake IPN — in Level 1 we call this directly once the "payment" is "done"
  @Post('ipn')
  async ipn(@Body() body: { orderId: string; externalId: string }) {
    // 1) mark paid
    const order = await this.orders.markPaid(body.orderId);

    // 2) "fulfill": generate signed URL for a demo file
    const signedUrl = await this.storage.ensureDemoFileAndGetSignedUrl(order.id);
    const fulfilled = await this.orders.fulfill(order.id, signedUrl);

    // 3) email customer
    await this.emails.sendOrderCompleted(fulfilled.email, signedUrl);

    return { ok: true };
  }
}
```

---

### 3) Storage (R2, demo file, signed URL)

#### `storage.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  private bucket = process.env.R2_BUCKET!;

  private demoKey = 'demo/YOUR-KEY-EXAMPLE.txt';

  async ensureDemoFileAndGetSignedUrl(orderId: string) {
    // upload demo file if missing
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.demoKey }));
    } catch {
      const body = Buffer.from('SAMPLE-KEY-1234-5678-ABCD\n');
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.demoKey,
          Body: body,
          ContentType: 'text/plain',
        }),
      );
    }

    // generate per-order short-lived signed URL
    const url = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        // NOTE: to *download*, use GetObjectCommand
        // we want a GET link for download, not PUT; fix below:
      } as any),
      { expiresIn: 15 * 60 },
    );
    return url;
  }
}
```

> ⚠️ Correction for signed GET: replace the signing call with `GetObjectCommand`:

```ts
import { GetObjectCommand } from '@aws-sdk/client-s3';
// ...
const url = await getSignedUrl(
  this.s3,
  new GetObjectCommand({ Bucket: this.bucket, Key: this.demoKey }),
  { expiresIn: 15 * 60 },
);
```

---

### 4) Emails (Resend)

#### `emails.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailsService {
  private resend = new Resend(process.env.RESEND_API_KEY!);
  private from = process.env.EMAIL_FROM!;

  async sendOrderCompleted(to: string, signedUrl: string) {
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Your BitLoot Order — Download Link',
      html: `
        <p>Thanks for your purchase!</p>
        <p>Your download link (expires soon):</p>
        <p><a href="${signedUrl}">Reveal your key</a></p>
        <p>Keep this link private. We never email plaintext keys.</p>
      `,
    });
  }
}
```

---

### 5) Wire the module (API `AppModule`)

Add repositories + modules + controllers.

```ts
// apps/api/src/app.module.ts (additions)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './modules/orders/order.entity';
import { OrderItem } from './modules/orders/order-item.entity';
import { OrdersController } from './modules/orders/orders.controller';
import { OrdersService } from './modules/orders/orders.service';
import { PaymentsController } from './modules/payments/payments.controller';
import { PaymentsService } from './modules/payments/payments.service';
import { StorageService } from './modules/storage/storage.service';
import { EmailsService } from './modules/emails/emails.service';

@Module({
  imports: [
    // existing ConfigModule, TypeORM root, Bull root...
    TypeOrmModule.forFeature([Order, OrderItem]),
  ],
  controllers: [OrdersController, PaymentsController],
  providers: [OrdersService, PaymentsService, StorageService, EmailsService],
})
export class AppModule {}
```

> Create a migration for `orders` + `order_items` (or temporarily use `synchronize: true` _only in dev_). Recommended to switch to migrations immediately after first run.

---

### 6) SDK (regenerate)

Start API, then:

```bash
npm run sdk:gen
```

You should get `POST /orders`, `GET /orders/{id}`, `POST /payments/create`, `POST /payments/ipn` available in your TypeScript SDK.

---

### 7) Frontend (Next.js)

**Structure**

```
apps/web/
  features/
    checkout/CheckoutForm.tsx
    checkout/PayPage.tsx           // fake pay page at /pay/[orderId]
    orders/OrderSuccess.tsx
  app/
    product/[id]/page.tsx
    pay/[orderId]/page.tsx
```

#### `CheckoutForm.tsx`

- RHF + Zod email field
- On submit: `sdk.ordersCreate` → get `order.id`
- Call `sdk.paymentsCreate` → get `paymentUrl`
- `router.push(paymentUrl)`

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { OrdersApi, PaymentsApi } from '@bitloot/sdk'; // adjust import path

const schema = z.object({ email: z.string().email() });

export default function CheckoutForm() {
  const router = useRouter();
  const params = useParams(); // product id from route
  const form = useForm<{ email: string }>({ resolver: zodResolver(schema) });

  const createOrder = useMutation({
    mutationFn: async (email: string) => {
      const orders = new OrdersApi();
      const res = await orders.ordersControllerCreate({
        createOrderDto: { email, productId: String(params.id) },
      });
      return res as any; // use proper typing from SDK
    },
  });

  const createPayment = useMutation({
    mutationFn: async (orderId: string) => {
      const payments = new PaymentsApi();
      const res = await payments.paymentsControllerCreate({ createPaymentDto: { orderId } });
      return res as any;
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        const order = await createOrder.mutateAsync(values.email);
        const payment = await createPayment.mutateAsync(order.id);
        router.push(payment.paymentUrl);
      })}
    >
      <input
        {...form.register('email')}
        placeholder="Your email"
        className="border rounded px-3 py-2 w-full"
      />
      {form.formState.errors.email && <p className="text-red-500 text-sm">Enter a valid email</p>}
      <button className="rounded px-4 py-2 bg-black text-white">Pay</button>
    </form>
  );
}
```

#### Product page to show the form: `app/product/[id]/page.tsx`

```tsx
import CheckoutForm from '@/features/checkout/CheckoutForm';

export default function ProductPage() {
  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Demo Product</h1>
      <CheckoutForm />
    </main>
  );
}
```

#### Fake pay page: `app/pay/[orderId]/page.tsx`

- Shows “Complete Payment” button → calls IPN → navigate to success page.

```tsx
'use client';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { PaymentsApi } from '@bitloot/sdk';

export default function PayPage() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const ext = search.get('ext') ?? '';

  const confirm = useMutation({
    mutationFn: async () => {
      const api = new PaymentsApi();
      await api.paymentsControllerIpn({
        body: { orderId: String(params.orderId), externalId: ext },
      });
    },
    onSuccess: () => router.push(`/orders/${params.orderId}/success`),
  });

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold mb-4">Fake Checkout</h1>
      <p className="mb-6">Pretend you paid crypto…</p>
      <button className="rounded px-4 py-2 bg-black text-white" onClick={() => confirm.mutate()}>
        Complete Payment
      </button>
    </main>
  );
}
```

#### Success page (reveal button): `app/orders/[id]/success/page.tsx`

- Fetch order and show “Reveal” (opens the signed URL in a new tab).

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { OrdersApi } from '@bitloot/sdk';
import { useParams } from 'next/navigation';

export default function OrderSuccessPage() {
  const params = useParams();
  const { data } = useQuery({
    queryKey: ['order', params.id],
    queryFn: async () => {
      const api = new OrdersApi();
      return api.ordersControllerGet({ id: String(params.id) }) as any;
    },
  });

  const url = data?.items?.[0]?.signedUrl;

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold mb-2">Payment Successful</h1>
      <p className="mb-6">Thanks! Your download link is ready.</p>
      <a
        className="rounded px-4 py-2 bg-black text-white inline-block"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        Reveal Key
      </a>
    </main>
  );
}
```

> In Level 1, this “Reveal Key” page is safe because the **link is short-lived** and we do not render keys.

---

### 8) Minimal migrations (recommended)

Create an initial migration for `orders` and `order_items`. Example TypeORM migration outline:

```ts
// apps/api/src/migrations/1710000000000-init.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1710000000000 implements MigrationInterface {
  name = 'Init1710000000000';
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(320) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'created',
        total numeric(20,8) NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`
      CREATE TABLE order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid REFERENCES orders(id) ON DELETE CASCADE,
        "productId" varchar(100) NOT NULL,
        "signedUrl" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await q.query(`CREATE INDEX ON orders ("createdAt");`);
    await q.query(`CREATE INDEX ON order_items ("orderId");`);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE order_items;`);
    await q.query(`DROP TABLE orders;`);
  }
}
```

---

## Verification (Definition of Done for Level 1)

- ✅ **Local infra** runs (Postgres, Redis).
- ✅ `POST /orders` creates an order with `status=created`.
- ✅ `POST /payments/create` returns `{ paymentUrl, externalId }`.
- ✅ Visiting `/pay/:orderId` and clicking “Complete Payment” calls `POST /payments/ipn`, which:
  - marks the order **paid**,
  - generates an R2 **signed URL**,
  - marks the order **fulfilled**,
  - sends an **email** to the provided address.

- ✅ Success page `/orders/:id/success` shows a **Reveal Key** button that opens the signed link.
- ✅ No plaintext keys in UI or email—**link only**.
- ✅ Lint/type-check/tests/build pass.

---

## Commands

```bash
# Run infra
docker compose up -d

# API
npm run dev:api
# Open http://localhost:4000/api/docs and /api/healthz

# Web
npm run dev:web
# Open http://localhost:3000/product/demo-product

# Generate SDK (after API running)
npm run sdk:gen

# Quality loop
npm run format && npm run lint --max-warnings 0 && npm run type-check && npm run test && npm run build
```

---

### Common Gotchas (and fixes)

- **Signed URL uses PUT instead of GET** → make sure you sign `GetObjectCommand`.
- **CORS issues** → set `CORS_ORIGIN=http://localhost:3000` and enable credentials.
- **Email not received** → verify domain, use a test inbox, check Resend logs.
- **SDK types off** → re-run `npm run sdk:gen` _after_ any API change.
- **No secrets in FE** → all calls go through the SDK; never paste API keys in the web app.

---

### Summary

✅ **that’s _everything_ Level 1 includes**, from start → finish.
Let’s recap it cleanly so you can see the full scope and know when to move to **Level 2 (real payments)**.

---

## 🎯 **Goal of Level 1**

Build a _fake but complete_ version of BitLoot’s entire purchase loop:

> “User enters email → ‘pays’ → order marked paid → fulfillment uploads a test file → email with R2 signed link → user reveals it.”

No real vendors yet — it’s a sandbox proving your architecture.

---

## 🧩 **Everything Level 1 Includes**

### 🏗 1. Data Model & Database

- Tables:
  - `orders` → `id, email, status, total, createdAt`
  - `order_items` → `id, orderId, productId, signedUrl`

- Status flow: `created → paid → fulfilled`
- TypeORM entities + one migration.

---

### ⚙️ 2. API Modules

**New directories under `apps/api/src/modules/`:**

| Module      | What it does                                                         |
| ----------- | -------------------------------------------------------------------- |
| `orders/`   | Create/get orders, update status, attach key link.                   |
| `payments/` | Fake checkout (create + fake IPN).                                   |
| `storage/`  | Connects to Cloudflare R2, uploads demo key, returns signed GET URL. |
| `emails/`   | Uses Resend to send “Order Completed” email.                         |

Each has a controller + service with DTO validation.

---

### 🔁 3. Workflow

1. `POST /orders` → creates order.
2. `POST /payments/create` → returns a fake `payment_url`.
3. User visits `/pay/:orderId` on the web → clicks “Complete Payment.”
4. FE calls `POST /payments/ipn`.
5. API:
   - Marks order **paid**.
   - Uploads demo file to R2 (if not there).
   - Generates short-lived signed URL.
   - Marks order **fulfilled**.
   - Sends email with the link.

6. User clicks “Reveal Key” in email or UI → downloads the file.

---

### 💻 4. Frontend (App Router)

| File                                  | Purpose                                    |
| ------------------------------------- | ------------------------------------------ |
| `/features/checkout/CheckoutForm.tsx` | Email input + “Pay” button.                |
| `/app/product/[id]/page.tsx`          | Displays the form.                         |
| `/app/pay/[orderId]/page.tsx`         | Fake pay page → triggers IPN.              |
| `/app/orders/[id]/success/page.tsx`   | Shows “Reveal Key” button (opens R2 link). |

Uses **React Hook Form + Zod**, **TanStack Query**, and the generated **BitLoot SDK**.

---

### 📦 5. SDK

- Auto-generated from Nest Swagger (`npm run sdk:gen`).
- Exposes: `ordersCreate`, `ordersGet`, `paymentsCreate`, `paymentsIpn`.
- Used exclusively by the frontend — no raw fetch.

---

### ✉️ 6. Email Template

HTML email from Resend:

```
Subject: Your BitLoot Order — Download Link
Body: Thanks! Click here to reveal your key → [Signed URL]
```

> 🔒 Never send plaintext keys, only signed URLs.

---

### 🧪 7. Verification Checklist

| ✅ Item              | Description                                       |
| -------------------- | ------------------------------------------------- |
| Dev envs up          | `docker compose up -d` → Postgres & Redis healthy |
| API running          | `GET /api/healthz → {ok:true}`                    |
| SDK builds           | `npm run sdk:gen` succeeds                        |
| Create order         | Works via Swagger or UI                           |
| Fake payment flow    | Marks order fulfilled + email sent                |
| Email received       | Contains signed R2 link (valid ≈ 15 min)          |
| Lint/tests/typecheck | All green before commit & CI                      |

---

### 🧱 8. Why Level 1 Matters

It’s your **proof of architecture**:

- End-to-end vertical slice works.
- Email, storage, DB, FE ↔ API ↔ SDK all connected.
- Lets you test queues, HMAC, and payment logic later without rewiring.

---

### 🏁 9. When Level 1 Is Done

Move to **Level 2** only when:

- You can **create → fake pay → receive email → open link** in under 30 seconds.
- Logs show no unhandled errors.
- Lint/type/test/build all pass.
- No secrets appear in frontend or emails.

Then you’re ready to plug in **NOWPayments sandbox** for real crypto flow.

---
