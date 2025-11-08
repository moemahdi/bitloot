# 🎯 BitLoot AI Agent Instructions

## 🚀 Short Brief Instructions for AI Agents

> Follow these core rules to ensure consistency, security, and production-quality updates across BitLoot’s PWA + NestJS platform.

---

## 📊 BitLoot Project Stats (Verified)

- **Core Value:** Crypto-only e-commerce for instant delivery of game/software keys & subscriptions (Kinguin + custom listings)
- **Frontend:** Next.js **16** (App Router), React **19**, Tailwind + Radix UI + shadcn/ui + Framer Motion; TanStack Query + Zustand; PWA-first
- **Backend:** NestJS (modular), PostgreSQL + TypeORM, Redis + BullMQ jobs, Webhooks/IPN; Docker + Nginx + GitHub Actions CI/CD
- **Payments:** **NOWPayments** (300+ assets) with IPN → `waiting → confirming → finished`
- **Fulfillment:** **Kinguin Sales Manager API (v1)** for catalog sync + delivery via webhook; custom BitLoot products too
- **Delivery:** Keys encrypted in **Cloudflare R2**, served via signed URLs (no plaintext in emails/logs)
- **Auth & Emails:** OTP (6-digit) + password setup; transactional + marketing via **Resend**

---

## 📚 Documentation Files Reference

**Before implementing any feature or answering questions, the AI agent should:**

- Review relevant documentation for context and details
- Check **Developer Workflow documentation** (Level 0 is COMPLETE ✅)

All documentation is located in root level (Level 0 Developer Workflow) and `docs/` directory:

- **`../docs/PRD.md`** — Product Requirements Document (feature specs, user flows)
- **`../docs/project-description.md`** — High-level project overview & architecture
- **`../docs/sdk.md`** — SDK design, structure, and generation workflow
- **`../docs/nowpayments-API-documentation.md`** — NOWPayments integration guide & IPN specs
- **`../docs/kinguin-API-documentation.md`** — Kinguin Sales Manager API (v1) full reference
- **`../docs/kinguin-API-documentation-summary.md`** — Kinguin API quick reference
- **`../docs/kinguin-technical-documentation.md`** — Kinguin technical details & webhook handling
- **`../docs/resend-API-documentation.md`** — Resend email service API & templates
- **`../docs/tawk-integration.md`** — Tawk live chat / support widget integration
- **`../docs/developer-roadmap/`** — Staged development plan:
  - **`../docs/developer-roadmap/Overview.md`** — Roadmap overview & sequencing
  - **`../docs/developer-roadmap/00-Level.md`** — Project setup & infrastructure
  - **`../docs/developer-roadmap/01-Level.md`** — Auth system (OTP, JWT, password)
  - **`../docs/developer-roadmap/02-Level.md`** — Product catalog & search
  - **`../docs/developer-roadmap/03-Level.md`** — Orders & cart management
  - **`../docs/developer-roadmap/04-Level.md`** — Payments integration (NOWPayments)
  - **`../docs/developer-roadmap/05-Level.md`** — Fulfillment (Kinguin API & delivery)
  - **`../docs/developer-roadmap/06-Level.md`** — Admin dashboard & reporting
  - **`../docs/developer-roadmap/07-Level.md`** — Advanced features (reviews, wishlists)
  - **`../docs/developer-roadmap/08-Level.md`** — Optimization & scaling

---

## ✅ Level 0 — Developer Workflow (COMPLETED)

**Status:** ✅ **COMPLETE** — All bootstrap tasks executed successfully

The following Level 0 documentation exists at the **root level** of the repository:

### Level 0 Bootstrap Documentation

- **[BOOTSTRAP_COMPLETE.md](../docs/developer-workflow/00-Level/BOOTSTRAP_COMPLETE.md)** — Level 0 bootstrap execution summary
- **[LEVEL_0_COMPLETE.md](../docs/developer-workflow/00-Level/LEVEL_0_COMPLETE.md)** — Detailed completion report with all deliverables
- **[LEVEL_0_VERIFICATION.md](../docs/developer-workflow/00-Level/LEVEL_0_VERIFICATION.md)** — Setup validation & smoke tests checklist
- **[QUICK_REFERENCE.md](../docs/developer-workflow/00-Level/QUICK_REFERENCE.md)** — Quick command reference card

### What Was Built in Level 0

✅ **Monorepo Structure** — `apps/api`, `apps/web`, `packages/sdk` workspaces  
✅ **Strict TypeScript + ESLint** — No `any`, runtime-safe rules enforced  
✅ **Docker Infrastructure** — Postgres 16 + Redis 7 (docker-compose.yml)  
✅ **NestJS API** — Bootstrap with Swagger docs, health check, validation  
✅ **Next.js PWA** — App Router, React 19, dark theme, manifest  
✅ **SDK Generator** — OpenAPI to TypeScript client framework  
✅ **GitHub Actions CI/CD** — Lint, type-check, test, build pipeline  
✅ **Configuration Files** — tsconfig.base.json, .eslintrc.cjs, .prettierrc, .env setup

### Getting Started After Level 0

1. `npm install` — Install all dependencies
2. `docker compose up -d` — Start Postgres + Redis
3. `npm run dev:all` — Start API + Web servers
4. Follow **LEVEL_0_VERIFICATION.md** for validation

### Next Phase

→ **Level 1 (Auth)** — See `../docs/developer-roadmap/01-Level.md` for OTP, JWT, password implementation

---

## 🥇 1) Golden Rules (Non-Negotiable)

- **SDK-first:** Frontend talks **only** to BitLoot’s own SDK (typed client over NestJS). **Never** call NOWPayments/Kinguin/Resend directly from the browser
- **No Secrets in Frontend:** Payment, webhook, email, and catalog secrets live server-side only (NestJS). Frontend uses your SDK clients
- **Type Safety Everywhere:** No `any`, no `@ts-ignore`. Types flow backend → OpenAPI → SDK → PWA.
- **Security by Default:** JWT/refresh, guards, **ownership** checks, **HMAC verification** for IPN/Webhooks, CAPTCHA + WAF where applicable
- **Mandatory Pagination:** All list endpoints paginate; `limit ≤ 100`.
- **Idempotency & Queues:** IPN/webhook handlers and email sends must be idempotent and queued (BullMQ) to avoid duplicates/retries storms
- **No Raw Keys in Email:** Keys delivered via short-lived R2 signed links only
- **Underpayment Policy:** Underpayment = failed, **non-refundable** — reflect across UI copy, order state, and email templates
  Always use context7 when I need code generation, setup or configuration steps, or
  library/API documentation. This means you should automatically use the Context7 MCP
  tools to resolve library id and get library docs without me having to explicitly ask.

---

## 🔧 2) Project Rules & Anti-Patterns

### Backend (NestJS)

- Use **class-based DTOs** + `class-validator` + Swagger decorators on **every** route for OpenAPI/SDK generation.
- Enforce **ownership** (`userId` scopes) in the service layer for reads/writes.
- **Transactions** for multi-entity ops (e.g., order + order_items + payment events).
- **HMAC verification** for NOWPayments IPN + Kinguin webhooks. Reject if invalid or replayed; log to `webhook_logs`. Keep handlers idempotent
- Queue heavy/side-effect work (email, R2 uploads) in BullMQ; retries/backoff; dead-letter queues
- **Indexes** for hot paths: `(userId, createdAt)`, `(status, createdAt)`, `(productId, createdAt)`.

### Frontend (Next.js PWA)

- Keep `app/` thin; all logic in `src/features/*`. Use TanStack Query + **BitLoot SDK** only (no raw fetch/axios/SWR).
- Forms: **React Hook Form + Zod** for all flows (checkout, OTP, reset, profile).
- Always wire **loading/error/empty** states; ensure a11y (labels/focus/keyboard).
- **Never** render raw secrets or keys; delivery flows always navigate to signed URLs only

### SDK (BitLoot)

- Generate from NestJS OpenAPI; one client per domain (auth, orders, payments, products, users, r2). Regenerate after API changes
- Central mutator handles JWT, refresh, and unified errors.

### Database

- TypeORM migrations only; **no** auto-sync in prod.
- Money/amounts use `decimal(20, 8)`. Composite indexes on common filters.
- Soft-delete where sensible (e.g., reviews).

### Emails (Resend)

- OTP + password reset + order created/completed + welcome + (optional) marketing via segments/broadcasts.
- OTP: 6-digit, Redis TTL (e.g., 5–10 min), rate-limited requests/attempts; never log full code; template variables only
- Use **Idempotency-Key** headers to avoid duplicate transactional emails on retries

---

## 🧱 3) Core Domains & Modules (MVP)

**Backend modules (suggested):** `auth`, `users`, `products` (Kinguin + custom), `orders`, `payments` (NOWPayments), `fulfillment` (Kinguin webhooks), `emails` (Resend), `storage` (R2), `reviews`, `admin`, `webhooks`, `logs` — aligned to PRD flows (guest checkout, OTP auth, IPN, delivery)

**Frontend features:** `home`, `catalog`, `product`, `checkout`, `auth` (login/signup/otp/reset), `account`, `admin`, `reviews`, `faq`, `support` — including **Quick View modal**, product page checkout (email → crypto → status → reveal link)

---

## 🛡️ 4) Runtime-Safety ESLint (Top Rules)

**Async Safety**

- `@typescript-eslint/no-floating-promises` (error)
- `@typescript-eslint/no-misused-promises` (error)
- `@typescript-eslint/await-thenable` (error)

**Type Safety**

- `@typescript-eslint/no-explicit-any` (error)
- `@typescript-eslint/no-unsafe-*` family (error)
- `@typescript-eslint/consistent-type-imports` (error)

**Null/Boolean Safety**

- `@typescript-eslint/prefer-nullish-coalescing` (error)
- `@typescript-eslint/prefer-optional-chain` (error)
- `@typescript-eslint/strict-boolean-expressions` (warn|error)

**Restricted Patterns**

- `no-restricted-syntax` for:
  - ❌ `Math.random()` for IDs → use `crypto.randomUUID()`
  - ❌ `parseInt(str)` without radix → `parseInt(str, 10)`
  - ❌ `fetch()`/`.json()` without `try/catch`

**React Safety**

- `react-hooks/rules-of-hooks` (error)
- `react-hooks/exhaustive-deps` (warn)

**Debug**

- `no-console` (warn; allow `warn`/`error`)
- `no-debugger` (error), `no-alert` (error)

✅ These map directly to BitLoot’s risk profile: **unhandled-async**, **unsafe-access**, **premature-state**, **missing-props** (same categories you used).

---

## 📋 5) ESLint Quick Patterns

**Safe Access**

```ts
// ✅
const email = user?.email ?? 'guest@bitloot.com';
const items = Array.isArray(order?.items) ? order.items : [];

// ❌
const email = user.email || 'guest@bitloot.com';
```

**Async Safety**

```ts
// ✅
try {
  const res = await sdk.payments.createPayment(payload);
  const json = res; // already parsed if SDK
} catch (e) {
  console.error('Payment create failed', e);
}

// ❌
const res = await fetch(url);
const data = await res.json();
```

**IDs & Parsing**

```ts
// ✅
const id = crypto.randomUUID();
const n = parseInt('42', 10);

// ❌
const id = Math.random().toString();
const n = parseInt('42');
```

---

## ⚙️ 6) Daily Workflow

```bash
npm run dev:all           # PWA + API
npm run sdk:dev           # Regenerate SDK after ANY API change
npm run type-check && npm run lint && npm run test && npm run build
```

Quality loop: `format` → `lint:fix` → `type-check` → `test` → `build`

**Why SDK-first here:** The SDK formalizes all BitLoot operations and keeps 3rd-party details server-side only

---

## ✅ 7) Pull Request Gates (Must Pass)

- Zero `any` / zero TS errors / zero lint errors.
- **Guards + ownership** on protected routes.
- DTO validation + **complete Swagger** decorators (so SDK responses aren’t `void`).
- Pagination + strategic DB indexes.
- SDK regenerated if API changed (clients/types updated)
- Tests updated; UI includes loading/error/empty states.
- No secrets/keys in frontend; delivery via signed URLs only
- IPN/Webhooks: **HMAC verified**, idempotent, logged. Underpayment path respected

---

## ⚡ 8) Performance Checklist

- Composite indexes on hot paths (orders by `status/createdAt`, user orders by `userId/createdAt`).
- Select minimal columns; prefer query builders for complex filters.
- Cache read-mostly endpoints (short TTL) where safe; invalidate on writes.
- TanStack Query: `staleTime 30s` for live checkout/payment status; 5–10m for profile/static pages.
- Virtualize long lists; dynamic import heavy components.
- Queue slow side-effects (emails, R2 ops) with retries/backoff.

---

## 🔐 9) Security Checklist

- **HMAC** verify NOWPayments IPN + Kinguin webhooks; reject replays; idempotent updates to `orders`/`payment_events`
- **JWT + refresh**, role checks, and **ownership** in services.
- **OTP** via Redis (TTL), request/verify rate-limits, mask logs, 6-digit crypto-random codes; password reset links via Resend templates
- **No plaintext keys** in emails or logs; signed URL delivery from R2 only
- Restrict CORS origins & headers; WAF + CAPTCHA for bots (Cloudflare)

---

## 🔄 10) Verification Commands

### Development

```bash
# Full env (web+api)
npm run dev:all

# API only
npm run dev:api

# Web only
npm run dev:web

# SDK (after ANY API change)
npm run sdk:dev
```

### Quality Check Suite (Unified)

```bash
# Run ALL quality checks with beautiful output
npm run quality

# Run ALL checks and continue on failure
npm run quality all --continue

# Individual checks
npm run quality:type-check     # Type checking only
npm run quality:lint           # Linting only
npm run quality:format         # Format verification only
npm run quality:test           # Testing only
npm run quality:build          # Build only

# Full check (all tasks, continues on failure)
npm run quality:full
```

### Traditional Commands

```bash
# Type & lint
npm run type-check && npm run lint --max-warnings 0

# Auto-fix issues
npm run lint:fix && npm run format:fix

# Tests
npm run test

# Build
npm run build
```

---

## 🧯 11) Quick Troubleshooting

| Problem                        | Solution                                                  |
| ------------------------------ | --------------------------------------------------------- |
| Types broken after API change  | `npm run sdk:dev` → `npm run type-check`                  |
| Duplicate transactional emails | Use Resend `Idempotency-Key`; dedupe in queue handler     |
| Payment/IPN mismatch           | Verify HMAC; ensure idempotency keying on `np_payment_id` |
| Keys appearing in logs         | Remove; store only R2 refs; deliver via signed URL        |
| OTP spam or brute force        | Redis counters; throttle requests & attempts; short TTLs  |

---

## 🤖 12) SDK — The Contract

**Frontend → BitLoot SDK → NestJS → (NOWPayments/Kinguin/Resend)**

- **Never** call 3rd-party APIs from the browser; secrets live server-side.
- Generate SDK from OpenAPI; one client per module; shared mutator for auth/errors

**Example structure & usage:** see `orders`, `payments`, `products`, `auth`, `user`, `r2` clients in your SDK plan

---

## 🧪 OTP/Email Patterns (BitLoot-specific)

- **OTP create:** crypto-random 6 digits; Redis `otp:verify:<email>` with 5–10m TTL; rate-limit sends; send via **Resend template** (variables only)
- **OTP verify:** compare from Redis; on success, delete key; lockout after N failed attempts; proceed to **set password** flow
- **Password reset:** token or HMAC link via Resend template; short expiry; single-use; generic responses to avoid email enumeration
- **Transactional emails:** Order Created (pending), Order Completed (delivery via link), Welcome; use templates + optional idempotency headers

---

## 🧭 Response Template for AI Agent (Use This)

```
# Task: <Title>

## Analysis
- Current state:
- Requirements:
- Impact:

## Plan
1) …
2) …
3) …

## Technical Approach
- Backend:
- Frontend:
- SDK:
- Data/Indexes:
- Security/HMAC:

## Implementation
<Code / diffs with safe patterns>

## Verification
- [ ] Type-check
- [ ] Lint
- [ ] Tests
- [ ] SDK regenerated
- [ ] Manual Steps

## Commands
<exact commands to run>
```

---

## 📝 BitLoot-Specific Gotchas (Never Miss)

- **Underpayments are final**: reflect clearly in product page checkout UI + emails; ensure status path shows “failed/non-refundable” when underpaid
- **No plaintext keys** anywhere; **only** signed URLs from R2; expire links fast; log `viewed_at` on reveal
- **SDK or bust**: Frontend calls **only** BitLoot SDK (your API), never 3rd-party SDKs (secrets!)
- **Webhooks/IPN** must be: verified, idempotent, logged, and resilient with retries/backoff

# 🧭 BitLoot – Complete Engineering Instructions (Backend + Frontend + SDK)

## What BitLoot is (context in one breath)

Crypto-only e-commerce for instant delivery of digital goods (game/software keys, subs). Users pay in crypto (NOWPayments), orders are fulfilled from Kinguin (plus your custom products), keys are stored in Cloudflare R2 and delivered via **short-lived signed URLs** (never plaintext in email). OTP-first auth + Resend for transactional mail. PWA frontend, NestJS backend, TypeORM + PostgreSQL, Redis + BullMQ, strict ESLint runtime-safety.

---

## 0) Golden Rules (non-negotiable)

1. **SDK-first**: Frontend calls your **BitLoot SDK** only (typed client generated from OpenAPI). Never call NOWPayments/Kinguin/Resend from the browser.
2. **Security by design**: JWT+refresh, role guards, **ownership checks in services**, **HMAC verification** for IPN/webhooks, strict rate limits for OTP.
3. **No secrets in frontend**. No plaintext keys anywhere. Delivery is **only** through short-lived signed R2 links.
4. **Idempotency & queues**: All webhook/IPN/email/fulfillment side effects go through BullMQ with dedupe, retry, and dead-letter queues.
5. **Pagination everywhere** (`limit ≤ 100`). **Indexes** on hot paths.
6. **Zero `any`** & **zero `@ts-ignore`**. Strict TS and ESLint runtime-safety rules enforced.

---

## 1) Monorepo Layout (authoritative)

```
bitloot/
├─ apps/
│  ├─ api/                     # NestJS backend (port 3001)
│  │  └─ src/
│  │     ├─ modules/
│  │     │  ├─ auth/           # login, OTP, password reset, tokens
│  │     │  ├─ users/
│  │     │  ├─ products/       # Kinguin sync + custom listings
│  │     │  ├─ orders/         # orders & order items
│  │     │  ├─ payments/       # NOWPayments integration (create/IPN)
│  │     │  ├─ fulfillment/    # Kinguin order fulfill + webhooks
│  │     │  ├─ storage/        # R2 signed URLs + key vault service
│  │     │  ├─ emails/         # Resend transactional emails
│  │     │  ├─ webhooks/       # shared webhook utils/logs
│  │     │  ├─ admin/          # admin APIs (catalog, price rules)
│  │     │  └─ logs/           # event/process/webhook logs
│  │     ├─ common/            # guards, interceptors, filters, dto base
│  │     ├─ database/          # entities, migrations, orm config
│  │     ├─ jobs/              # BullMQ processors (email, fulfillment…)
│  │     ├─ config/            # env schemas, config factories
│  │     └─ main.ts
│  └─ web/                     # Next.js PWA (port 3000)
│     └─ src/
│        ├─ app/               # thin routes only
│        └─ features/          # real logic here
├─ packages/
│  ├─ sdk/                     # generated TS SDK (OpenAPI -> Orval/etc.)
```

---

## 2) Backend – How to Write **Entities**, **DTOs**, **Services**, **Controllers**

### 2.1 Entities (TypeORM)

- Use `uuid` PK.
- Monetary values: `decimal(20, 8)`.
- Soft deletes where relevant.
- Composite indexes for hot filters.

```ts
// apps/api/src/database/entities/order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @ManyToOne(() => User, (u) => u.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirming', 'paid', 'underpaid', 'failed', 'cancelled', 'fulfilled'],
    default: 'pending',
  })
  status!: 'pending' | 'confirming' | 'paid' | 'underpaid' | 'failed' | 'cancelled' | 'fulfilled';

  @Column('decimal', { precision: 20, scale: 8 })
  totalCrypto!: string; // string for precise decimals (serialize as string)

  @Column({ nullable: true })
  npPaymentId?: string; // NOWPayments id, used for idempotency

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
  items!: OrderItem[];
}
```

### 2.2 DTOs & Swagger (class-based, never interfaces)

- Use `class-validator` & `class-transformer`.
- Every controller route has `@ApiResponse({ type })` or `@ApiResponse({ type: [T] })`.
- Include pagination DTOs.

```ts
// apps/api/src/common/dto/pagination.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class PaginatedResponse<T> {
  @ApiProperty({ isArray: true }) data!: T[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
}
```

```ts
// apps/api/src/modules/orders/dto/create-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsUUID, IsArray, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty({ type: [CreateOrderItemDto] }) @IsArray() items!: CreateOrderItemDto[];
  @ApiProperty({ description: 'User id if logged in; null for guest', required: false })
  @IsUUID()
  userId?: string | null;
}

export class OrderItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() quantity!: number;
}

export class OrderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() status!: string;
  @ApiProperty() totalCrypto!: string;
  @ApiProperty({ type: [OrderItemResponseDto] }) items!: OrderItemResponseDto[];
  @ApiProperty() createdAt!: Date;
}
```

### 2.3 Service Pattern (ownership + transactions + idempotency)

- **Ownership**: Every user-scoped read/write validates `userId` in the _service layer_.
- **Transactions** for multi-entity updates (order + items + payment event).
- **Idempotency**: for IPN/webhooks, upsert by external id and ignore repeats.
- **Queues**: heavy work → BullMQ.

```ts
// apps/api/src/modules/orders/orders.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectQueue('fulfillment') private readonly fulfillmentQ: Queue,
  ) {}

  async findUserOrderOrThrow(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
    // Ownership enforced here.
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // Compute totals, validate stock/prices, etc.
      const order = manager.create(Order, {
        userId: dto.userId ?? undefined,
        status: 'pending',
        totalCrypto: '0.00000000', // compute later when payment created
        items: dto.items.map((i) => manager.create('OrderItem' as any, i)),
      });
      const saved = await manager.save(order);

      // Enqueue payment creation (NOWPayments) as a background job
      await this.fulfillmentQ.add(
        'createPayment',
        { orderId: saved.id },
        { removeOnComplete: true },
      );

      return saved;
    });
  }

  async markPaidIdempotent(npPaymentId: string, orderId: string) {
    // Idempotent: if already processed with same npPaymentId, ignore.
    const updated = await this.orderRepo
      .createQueryBuilder()
      .update(Order)
      .set({ status: 'paid', npPaymentId })
      .where('id = :orderId AND (npPaymentId IS NULL OR npPaymentId = :npPaymentId)', {
        orderId,
        npPaymentId,
      })
      .returning('*')
      .execute();

    return updated.raw[0] ?? null;
  }

  async setStatus(orderId: string, status: Order['status']) {
    await this.orderRepo.update({ id: orderId }, { status });
  }
}
```

### 2.4 Controller Pattern (guards + swagger + errors)

- Always use guards for protected routes.
- Every route is documented (summary + responses).
- Validate inputs with DTOs (no inline validation).

```ts
// apps/api/src/modules/orders/orders.controller.ts
import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderResponseDto } from './dto/create-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order (guest or user)' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    const order = await this.orders.create(dto);
    return {
      id: order.id,
      status: order.status,
      totalCrypto: order.totalCrypto,
      items: order.items.map((i) => ({ id: i.id, productId: i.productId, quantity: i.quantity })),
      createdAt: order.createdAt,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order (requires ownership)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async getOne(@Param('id') id: string, @Request() req: any): Promise<OrderResponseDto> {
    const o = await this.orders.findUserOrderOrThrow(id, req.user.id);
    return {
      id: o.id,
      status: o.status,
      totalCrypto: o.totalCrypto,
      items: o.items.map((i) => ({ id: i.id, productId: i.productId, quantity: i.quantity })),
      createdAt: o.createdAt,
    };
  }
}
```

---

## 3) Integrations

### 3.1 NOWPayments (Payments Module)

**Flow**

1. Client hits `POST /payments` via SDK → Service calls NOWPayments **server-side** to create payment, stores `npPaymentId`, returns pay URL & amounts to frontend.
2. NOWPayments sends **IPN** (webhook) on status changes: `waiting → confirming → finished` (also possible `failed`/`underpaid`).
3. Your IPN controller verifies HMAC & idempotency, updates order status via `OrdersService`.
4. If `finished` (paid), enqueue fulfillment job (Kinguin / custom delivery). If `underpaid` → mark `underpaid (non-refundable)`.

**Verification helper**

```ts
// apps/api/src/modules/payments/np-signature.util.ts
import * as crypto from 'crypto';

export function verifyNpHmac(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature || '', 'hex'));
}
```

**Controller**

```ts
// apps/api/src/modules/payments/payments.controller.ts
import { Controller, Post, Headers, Req, Res, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { verifyNpHmac } from './np-signature.util';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('ipn')
  @HttpCode(200)
  async ipn(@Headers('x-nowpayments-signature') sig: string, @Req() req: any, @Res() res: any) {
    const raw = req.rawBody?.toString?.() ?? JSON.stringify(req.body);
    const ok = verifyNpHmac(raw, sig, process.env.NOWPAYMENTS_IPN_SECRET!);
    if (!ok) return res.status(401).send('Invalid signature');

    // Idempotent: dedupe by npPaymentId or invoice id
    await this.svc.handleIpn(req.body);
    return res.send('OK');
  }
}
```

**Service (idempotent state machine)**

```ts
// apps/api/src/modules/payments/payments.service.ts
import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly orders: OrdersService,
    @InjectQueue('fulfillment') private readonly fulfillmentQ: Queue,
  ) {}

  async handleIpn(payload: any) {
    const { payment_id: npPaymentId, payment_status, order_id } = payload;
    // order_id should map to our orderId; if not, map via stored reference

    if (payment_status === 'waiting' || payment_status === 'confirming') {
      await this.orders.setStatus(order_id, 'confirming');
    }

    if (payment_status === 'finished') {
      const updated = await this.orders.markPaidIdempotent(npPaymentId, order_id);
      if (updated) {
        await this.fulfillmentQ.add(
          'fulfillOrder',
          { orderId: order_id },
          { removeOnComplete: true },
        );
      }
    }

    if (payment_status === 'failed') {
      await this.orders.setStatus(order_id, 'failed');
    }

    if (payment_status === 'partially_paid' || payment_status === 'underpaid') {
      await this.orders.setStatus(order_id, 'underpaid'); // non-refundable
    }
  }
}
```

### 3.2 Kinguin (Products & Fulfillment)

**Catalog sync**

- Nightly/periodic job pulls products (price, stock, title, region), normalizes & stores in `products`.
- Respect categories/filters; maintain `externalId` for Kinguin product.

**Place order & delivery**

- After `paid`, create Kinguin order (server-side) and poll/webhook for keys; when keys arrive, **encrypt and store** in R2; mark order `fulfilled`; send email with **link**, not key text.

**Fulfillment queue processor**

```ts
// apps/api/src/jobs/fulfillment.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { OrdersService } from '../modules/orders/orders.service';
import { StorageService } from '../modules/storage/storage.service';
import { EmailsService } from '../modules/emails/emails.service';
import { KinguinService } from '../modules/fulfillment/kinguin.service';

@Processor('fulfillment')
export class FulfillmentProcessor extends WorkerHost {
  constructor(
    private readonly kinguin: KinguinService,
    private readonly storage: StorageService,
    private readonly emails: EmailsService,
    private readonly orders: OrdersService,
  ) {
    super();
  }

  async process(job: any) {
    const { orderId } = job.data;
    // 1) Call Kinguin to place/confirm order & retrieve keys
    const keys = await this.kinguin.fulfill(orderId); // array of strings

    // 2) Store keys securely in R2 (encrypted or private bucket)
    const url = await this.storage.saveAndGetSignedUrl({ orderId, keys });

    // 3) Mark fulfilled
    await this.orders.setStatus(orderId, 'fulfilled');

    // 4) Notify customer (Resend) with link (no plaintext keys)
    await this.emails.sendOrderDelivered({ orderId, link: url });
  }
}
```

### 3.3 Cloudflare R2 (Storage)

- Store raw keys in a **private** bucket, optionally client-side encrypted first.
- Deliver through **signed URL** with short expiry (e.g., 10–30 minutes).
- Log `deliveries` to track first-open.

```ts
// apps/api/src/modules/storage/storage.service.ts
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: { accessKeyId: process.env.R2_KEY!, secretAccessKey: process.env.R2_SECRET! },
  });

  async saveAndGetSignedUrl(input: { orderId: string; keys: string[] }) {
    const objectKey = `orders/${input.orderId}/keys.json`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: objectKey,
        Body: JSON.stringify({ keys: input.keys }),
        ContentType: 'application/json',
      }),
    );
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: objectKey,
        ResponseContentDisposition: 'attachment; filename="bitloot-keys.json"',
      }),
      { expiresIn: 60 * 15 },
    ); // 15 min
    return url;
  }
}
```

### 3.4 Resend (Emails)

- OTP, password reset, order created, order fulfilled.
- Use **Idempotency-Key** to prevent dupes on retry.
- Templates: pass only variables; never embed keys.

```ts
// apps/api/src/modules/emails/emails.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailsService {
  private resend = new Resend(process.env.RESEND_API_KEY!);

  async sendOrderDelivered({ orderId, link }: { orderId: string; link: string }) {
    await this.resend.emails.send({
      from: 'BitLoot <orders@bitloot.io>',
      to: [], // customer email looked up by order
      subject: 'Your BitLoot order is ready',
      headers: { 'Idempotency-Key': `order-delivered-${orderId}` },
      react: OrderDeliveredTemplate({ orderId, link }), // or html/text
    });
  }
}
```

---

## 4) Webhooks & IPN – **Universal Rules**

1. **Read raw body** (configure Nest to keep rawBody) for signature validation.
2. **Verify HMAC** with timing-safe compare; if invalid → `401`.
3. **Idempotent**: dedupe on external id (payment id / webhook id). One-row table `webhook_logs` with unique index on external id.
4. **Queue** heavy work; return 200 quickly after persistence.
5. **Observability**: log status transitions and handler results.

```ts
// apps/api/src/modules/webhooks/webhooks.module.ts
// Provide a WebhookLogsService with upsert(externalId, type, payloadHash)
```

---

## 5) Auth + OTP

- OTP: crypto-random 6 digits, store in Redis with TTL (e.g., 5–10 min), rate-limit requests & attempts per email/IP.
- On verify: delete key, proceed to set password.
- Password reset: short-lived token, single-use; anonymous responses to avoid enumeration.
- JWT: access (short), refresh (long); rotation with blacklist or versioning.

```ts
// apps/api/src/modules/auth/otp.service.ts
import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { Redis } from 'ioredis';

@Injectable()
export class OtpService {
  constructor(private readonly redis: Redis) {}

  async issue(email: string) {
    const code = randomInt(0, 999999).toString().padStart(6, '0');
    const key = `otp:${email}`;
    await this.redis.set(key, code, 'EX', 5 * 60); // 5 min TTL
    return code;
  }

  async verify(email: string, code: string) {
    const key = `otp:${email}`;
    const stored = await this.redis.get(key);
    if (!stored || stored !== code) return false;
    await this.redis.del(key);
    return true;
  }
}
```

---

## 6) Queues (BullMQ)

- Queues: `fulfillment`, `email`, `catalog-sync`, `payment-maintenance`.
- Each job: **retry strategy** (exponential), `removeOnComplete: true`, `removeOnFail: N`.
- Use concurrency carefully; consider rate limits at Kinguin/NOWPayments/resend.

```ts
// apps/api/src/jobs/queues.ts
import { BullModule } from '@nestjs/bullmq';

export const BullQueues = BullModule.forRoot({
  connection: { url: process.env.REDIS_URL! },
});

export const FulfillmentQueue = BullModule.registerQueue({ name: 'fulfillment' });
```

---

## 7) SDK Generation (OpenAPI → Typed Clients)

- Controllers **must** use `@ApiTags`, `@ApiOperation`, `@ApiResponse({ type })` for every route. DTOs are **classes** (no interfaces).
- Script: `npm run sdk:dev` does: pull OpenAPI (`/docs-json`) → generate clients & models → build package.
- Frontend imports clients & models from `@bitloot/sdk`.

```bash
# typical flow
npm run dev:api   # ensure swagger is up
npm run sdk:dev   # pull spec + generate + build
```

---

## 8) Frontend (Next.js PWA)

### Structure

```
src/
├─ app/                       # thin routes
│  ├─ (public)/product/[id]/page.tsx
│  └─ (auth)/login/page.tsx
└─ features/
   ├─ catalog/
   ├─ product/
   ├─ checkout/
   ├─ auth/
   ├─ account/
   ├─ admin/
   └─ components/ (ONLY design-system based)
```

### Data fetching pattern (TanStack Query + SDK)

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersControllerCreate, ordersControllerGet } from '@bitloot/sdk/clients/orders';

export function useOrder(orderId?: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersControllerGet({ id: orderId! }),
    enabled: Boolean(orderId),
    staleTime: 30_000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersControllerCreate,
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ['order', order.id] });
    },
  });
}
```

### Checkout flow (UI contract)

1. Product/Quick-View → “Checkout”
2. Enter email (OTP if guest), accept policy
3. Create order → receive payment instructions (asset/amount/address/url)
4. Show **real-time status** panel (waiting → confirming → paid/underpaid/failed)
5. When `fulfilled`, show “Reveal” → open **signed URL** (download keys.json)

### Forms

- React Hook Form + Zod in all forms (OTP, password set/reset, profile, checkout).
- Always handle **loading/error/empty** states and use accessible labels.

### Guards

- AuthGuard for protected pages; handle refresh transparently (SDK mutator).
- Avoid storing secrets; only store JWTs and safe user info.

---

## 9) Testing

- **Unit (Jest)**: services & utils (HMAC verify, idempotency upserts).
- **E2E (Nest testing / supertest)**: IPN/webhook routes, order → payment → fulfillment.
- **Component tests**: checkout states (waiting/confirming/paid/underpaid).

Key tests:

- Webhook HMAC invalid → 401
- Replayed IPN → no duplicate side effects
- Underpaid → UI shows non-refundable & order marked `underpaid`
- R2 link expires and never reveals plaintext in logs

---

## 10) CI/CD & PR Gates

**CI pipeline**

- `npm run format:check`
- `npm run lint --max-warnings 0`
- `npm run type-check`
- `npm run test`
- `npm run build`

**PR must pass**

- No `any` / no TS or ESLint errors
- Controllers fully documented (no `void` SDK types)
- Ownership checks in services
- Pagination & indexes verified
- SDK regenerated if API changed
- No secrets/keys in frontend or logs
- Webhooks/IPN idempotent & verified

---

## 11) Runtime-Safety ESLint (flat configs)

Apply strict rules (both web & api) to ensure:

- **unhandled-async**: no floating promises; only await real promises.
- **unsafe-access / unsafe-call**: no `any`; use optional chaining and nullish coalescing.
- **premature-state**: React hooks rules.
- **restricted**: no `Math.random()` for ids; `parseInt` must have radix; no raw `fetch().json()` without try/catch.

(If you want, I can paste ready-to-use `eslint.config.mjs` for `api` and `web` exactly aligned to these policies.)

---

## 12) Command Cheat Sheet

```bash
# Run everything
npm run dev:all

# Backend only / Frontend only
npm run dev:api
npm run dev:web

# SDK regeneration (after ANY API change)
npm run sdk:dev

# Quality loop
npm run format && npm run lint:fix && npm run type-check && npm run test && npm run build

# DB
npm run db:migrate
npm run db:seed
```

---

## 13) Copy-Paste Patterns (The “How” Summary)

### A) New Controller Checklist

1. `@ApiTags` + `@ApiOperation` per route
2. `@ApiResponse({ type })` on every route (no voids)
3. Guards for protected routes + `@ApiBearerAuth('JWT-auth')`
4. Accept only DTOs (no inline validation)
5. Return response DTOs (mapped from entities)

### B) New Service Checklist

1. All user-scoped reads/writes **validate ownership**
2. Multi-entity ops are **transactional**
3. Expose **idempotent** methods for webhooks/IPN
4. Push heavy side effects to **queue**
5. Add **indexes** for new filters/sorts

### C) New Webhook/IPN

1. Capture **raw body**
2. Verify **HMAC** (timing-safe)
3. **Upsert** webhook log by external id (unique index)
4. Perform state mutation → **enqueue** background work
5. Return 200 quickly

### D) Delivery Flow

1. Receive keys → store in **R2** (private), optionally encrypt
2. Generate **short-lived signed URL** (15 min)
3. Email **link only** via Resend (idempotency header)
4. Audit log (who/when revealed)

### E) Frontend Feature

1. Route in `app/` is thin, actual component in `features/xxx`
2. Use SDK client in TanStack Query
3. Forms = RHF + Zod
4. Loading/error/empty states
5. No secrets, no third-party direct calls

---

## 14) Example End-to-End: **Create order → Pay → Fulfill**

**Backend**

- `POST /orders` → validate DTO → `OrdersService.create()` (tx) → queue `createPayment`.
- Job `createPayment`: call NOWPayments, store `npPaymentId`, update order totals & return payment URL to frontend via the standard response next call.
- IPN `POST /payments/ipn`: verify HMAC → `PaymentsService.handleIpn()` → if `finished`, call `orders.markPaidIdempotent()` and queue `fulfillOrder`.
- Job `fulfillOrder`: Kinguin API → fetch keys → `StorageService.saveAndGetSignedUrl()` → mark `fulfilled` → `EmailsService.sendOrderDelivered()`.

**Frontend**

- `useCreateOrder` mutation → show payment instructions.
- Status panel polls `GET /orders/:id` (or use websocket if available) → transitions waiting/confirming/paid.
- On fulfilled → show “Reveal” → open **signed URL** (download JSON of keys).
