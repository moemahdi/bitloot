# 🔐 BitLoot Complete Code Standards & Lint Rules for AI Agents

**Last Updated:** November 11, 2025  
**Project:** BitLoot (Crypto-only e-commerce for instant key delivery)  
**Status:** Production-Ready (Levels 0-3 Complete ✅)

---

## Executive Summary

This document is the **authoritative source** for code standards, lint rules, and engineering practices for **all AI agents** generating code within the BitLoot project. It covers:

- **Type Safety Standards** (TypeScript strict mode, zero `any`)
- **Runtime-Safety ESLint Rules** (async safety, null-safety, restricted patterns)
- **Backend Patterns** (NestJS, DTOs, services, controllers, HMAC verification)
- **Frontend Patterns** (Next.js PWA, React 19, TanStack Query, forms)
- **Security Practices** (JWT, OTP, HMAC, ownership checks, signed URLs)
- **Code Quality Gates** (CI/CD, PR checks, test coverage)
- **Database Standards** (TypeORM, migrations, indexes, decimal precision)
- **Queue & Async Patterns** (BullMQ, idempotency, retries)

---

## Part 1: Type Safety Standards

### 1.1 TypeScript Compiler Options (Strict Mode)

**File:** `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitAny": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "target": "ES2022",
    "module": "ESNext",
    "baseUrl": ".",
    "paths": {
      "@bitloot/sdk": ["packages/sdk/src"]
    }
  }
}
```

### 1.2 Zero `any` Rule

**Rule:** No `any` type anywhere. Period.

✅ **Correct:**
```typescript
// Explicit types always
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

async function getUser(id: string): Promise<User | null> {
  // ...
}

// Type inference where safe
const name = user?.name ?? 'Guest';
const items = Array.isArray(order?.items) ? order.items : [];
```

❌ **Wrong:**
```typescript
// No any
const user: any = response.data;
function process(data: any): any { ... }

// No @ts-ignore
// @ts-ignore
const x = someWrongType();
```

### 1.3 Type Imports (Consistent)

**Rule:** Use `import type` for types, regular `import` for values.

✅ **Correct:**
```typescript
import type { User } from '@bitloot/sdk';
import { ordersClient } from '@bitloot/sdk/clients/orders';
import type { CreateOrderDto } from '@bitloot/sdk';
```

❌ **Wrong:**
```typescript
import { User, ordersClient } from '@bitloot/sdk';
```

---

## Part 2: Runtime-Safety ESLint Rules

### 2.1 Master ESLint Configuration

**File:** `.eslintrc.cjs` (both `apps/api` and `apps/web`)

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'unused-imports', 'import', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  rules: {
    // ============ ASYNC SAFETY ============
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',

    // ============ TYPE SAFETY ============
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'never' }],

    // ============ NULL / BOOLEAN SAFETY ============
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',

    // ============ RESTRICTED PATTERNS ============
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
        message: '❌ Use crypto.randomUUID() for IDs, NOT Math.random()',
      },
      {
        selector: 'CallExpression[callee.name="parseInt"][arguments.length=1]',
        message: '❌ parseInt() must have radix: parseInt(str, 10)',
      },
    ],

    // ============ REACT SAFETY ============
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ============ DEBUG / CONSOLE ============
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',

    // ============ IMPORTS ============
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [
          { pattern: '@bitloot/**', group: 'internal', position: 'after' },
        ],
        newlines: 'always',
      },
    ],
    'unused-imports/no-unused-imports': 'error',
  },
  ignorePatterns: ['dist', 'node_modules', '.next', 'coverage'],
};
```

### 2.2 Prettier Configuration

**File:** `.prettierrc`

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### 2.3 Safe Patterns by Risk Category

| Risk Category | Issue | ESLint Rule | Safe Pattern |
|---|---|---|---|
| **Unhandled Async** | Floating promise | `no-floating-promises` | `await` all promises; use `try/catch` |
| **Unsafe Access** | `any` type or unsafe access | `no-explicit-any`, `no-unsafe-*` | Type-safe access with optional chaining `?.` |
| **Null/Undefined** | Missing null checks | `prefer-nullish-coalescing` | Use `??` not `\|\|`; use optional chaining |
| **Premature State** | Hook deps missing | `exhaustive-deps` | List all dependencies or memoize carefully |
| **Restricted** | Crypto ID generation | `no-restricted-syntax` | Use `crypto.randomUUID()` |

---

## Part 3: Backend Patterns (NestJS)

### 3.1 Entity Standards (TypeORM)

**Rules:**
- Use `uuid` PK (not auto-increment)
- Monetary amounts: `decimal(20, 8)`
- Composite indexes on hot paths
- Soft deletes where sensible

✅ **Example:**
```typescript
// apps/api/src/database/entities/order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('orders')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirming', 'paid', 'underpaid', 'failed', 'fulfilled'],
    default: 'pending',
  })
  status!: 'pending' | 'confirming' | 'paid' | 'underpaid' | 'failed' | 'fulfilled';

  @Column('decimal', { precision: 20, scale: 8 })
  totalCrypto!: string; // Store as string for precision

  @Column({ nullable: true })
  npPaymentId?: string; // For idempotency

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

### 3.2 DTO Standards (Class-Based, Never Interfaces)

**Rules:**
- Use `class` not `interface`
- Add `class-validator` decorators
- Add `@ApiProperty` for Swagger/SDK generation
- Every DTO gets `@ApiResponse({ type })` in controller

✅ **Example:**
```typescript
// apps/api/src/modules/orders/dto/create-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsUUID, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  items!: CreateOrderItemDto[];

  @ApiProperty({
    description: 'User ID if logged in; null for guest',
    required: false,
  })
  @IsUUID()
  userId?: string | null;
}

export class OrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  totalCrypto!: string;

  @ApiProperty()
  createdAt!: Date;
}
```

### 3.3 Service Pattern (Ownership + Transactions + Idempotency)

**Rules:**
- Validate `userId` ownership in service layer
- Use transactions for multi-entity operations
- Idempotent methods for webhooks/IPN (upsert by external ID)
- Push heavy work to BullMQ

✅ **Example:**
```typescript
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

  // ============ OWNERSHIP CHECK ============
  async findUserOrderOrThrow(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // ============ TRANSACTIONAL CREATE ============
  async create(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        userId: dto.userId ?? undefined,
        status: 'pending',
        totalCrypto: '0.00000000',
        items: dto.items.map((i) =>
          manager.create(OrderItem, {
            productId: i.productId,
            quantity: i.quantity,
          }),
        ),
      });
      const saved = await manager.save(order);

      // Queue background work
      await this.fulfillmentQ.add(
        'createPayment',
        { orderId: saved.id },
        { removeOnComplete: true },
      );

      return saved;
    });
  }

  // ============ IDEMPOTENT UPDATE ============
  async markPaidIdempotent(npPaymentId: string, orderId: string): Promise<Order | null> {
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
}
```

### 3.4 Controller Pattern (Guards + Swagger + Error Handling)

**Rules:**
- `@ApiTags` + `@ApiOperation` on every route
- `@ApiResponse({ type })` on every route (never `void`)
- Guards for protected routes
- Always accept DTOs (never inline validation)
- Return response DTOs (mapped from entities)

✅ **Example:**
```typescript
// apps/api/src/modules/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
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
      createdAt: order.createdAt,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order (requires ownership)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async getOne(@Param('id') id: string, @Request() req: any): Promise<OrderResponseDto> {
    const order = await this.orders.findUserOrderOrThrow(id, req.user.id);
    return {
      id: order.id,
      status: order.status,
      totalCrypto: order.totalCrypto,
      createdAt: order.createdAt,
    };
  }
}
```

### 3.5 HMAC Verification (NOWPayments + Kinguin Webhooks)

**Rules:**
- **Never trust unsigned webhooks**
- Use **timing-safe compare** (prevents timing attacks)
- **Verify raw request body** (configure NestJS to keep `rawBody`)
- **Log signature mismatches** for audit

✅ **Example:**
```typescript
// apps/api/src/modules/payments/np-signature.util.ts
import * as crypto from 'crypto';

export function verifyNpHmac(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  // Timing-safe comparison
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature || '', 'hex'));
}

// Usage in controller
@Post('ipn')
@HttpCode(200)
async ipn(
  @Headers('x-nowpayments-signature') sig: string,
  @Req() req: any,
  @Res() res: any,
) {
  const raw = req.rawBody?.toString?.() ?? JSON.stringify(req.body);
  
  const isValid = verifyNpHmac(raw, sig, process.env.NOWPAYMENTS_IPN_SECRET!);
  if (!isValid) {
    console.warn('❌ Invalid IPN signature');
    return res.status(401).send('Invalid signature');
  }

  // Idempotent processing
  await this.paymentsService.handleIpn(req.body);
  return res.send('OK');
}
```

---

## Part 4: Frontend Patterns (Next.js PWA)

### 4.1 Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Thin routes (page.tsx, layout.tsx)
│   ├── features/               # Real logic here
│   │   ├── catalog/
│   │   ├── product/
│   │   ├── checkout/
│   │   ├── auth/
│   │   └── account/
│   ├── hooks/                  # Custom hooks (useQuery, useMutation)
│   ├── components/             # Reusable UI (shadcn/ui only)
│   ├── lib/                    # Utilities (formatters, validators)
│   └── types/                  # Type definitions
└── next.config.mjs
```

### 4.2 Data Fetching Pattern (TanStack Query + SDK)

**Rules:**
- **Only use SDK clients** (no raw `fetch` or `axios`)
- Use **TanStack Query** (React Query) for state management
- Set `staleTime` based on data freshness needs
- Handle **loading/error/empty** states
- **Never render secrets**

✅ **Example:**
```typescript
// apps/web/src/hooks/useOrder.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ordersControllerCreate,
  ordersControllerGet,
} from '@bitloot/sdk/clients/orders';

export function useOrder(orderId?: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersControllerGet({ id: orderId! }),
    enabled: !!orderId,
    staleTime: 30_000, // 30s for live payment status
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersControllerCreate,
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ['order', order.id] });
    },
    onError: (error) => {
      console.error('Order creation failed:', error);
    },
  });
}
```

### 4.3 Form Pattern (React Hook Form + Zod)

**Rules:**
- Use **React Hook Form** for form state
- Use **Zod** for runtime validation
- Always handle **submit errors**
- Show **loading state** during submission

✅ **Example:**
```typescript
// apps/web/src/features/checkout/CheckoutForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateOrder } from '@/hooks/useOrder';

const checkoutSchema = z.object({
  email: z.string().email('Invalid email'),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().min(1) })),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });
  const createOrder = useCreateOrder();

  async function onSubmit(data: CheckoutFormData) {
    try {
      await createOrder.mutateAsync(data);
      // Show success
    } catch (error) {
      console.error('Submit failed:', error);
      // Show error toast
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email')}
        type="email"
        placeholder="your@email.com"
        aria-label="Email address"
        disabled={isSubmitting}
      />
      {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Checkout'}
      </button>
    </form>
  );
}
```

### 4.4 Loading/Error/Empty States

**Rule:** Every async component must show **loading**, **error**, and **empty** states.

✅ **Example:**
```typescript
// apps/web/src/features/product/ProductCard.tsx
import { useQuery } from '@tanstack/react-query';

export function ProductCard({ productId }: { productId: string }) {
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productClient.getProduct(productId),
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-gray-200" />;
  if (error) return <div className="text-red-500">Failed to load product</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-card">
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <button onClick={() => addToCart(product.id)}>Add to Cart</button>
    </div>
  );
}
```

### 4.5 Protected Routes (Auth Guard)

✅ **Example:**
```typescript
// apps/web/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt')?.value;

  // Protect /account, /admin routes
  if (request.nextUrl.pathname.startsWith('/account') && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};
```

---

## Part 5: Security Standards

### 5.1 JWT + Refresh Token Pattern

**Rules:**
- Access token: short-lived (15 min)
- Refresh token: long-lived (7 days)
- Use HTTP-only cookies for refresh
- Validate ownership in services

✅ **Example:**
```typescript
// apps/api/src/modules/auth/auth.service.ts
export async function generateTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET!, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
}
```

### 5.2 OTP Pattern (6-Digit, Redis TTL)

**Rules:**
- Generate crypto-random 6-digit code
- Store in Redis with 5–10 min TTL
- Rate-limit requests per email
- Rate-limit verify attempts per email
- **Never log full OTP code** (log only last 2 digits)

✅ **Example:**
```typescript
// apps/api/src/modules/auth/otp.service.ts
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  constructor(private readonly redis: Redis) {}

  async issue(email: string): Promise<void> {
    const rateLimitKey = `otp:ratelimit:${email}`;
    const attempts = await this.redis.incr(rateLimitKey);
    
    if (attempts > 3) {
      throw new TooManyRequestsException('Too many OTP requests');
    }
    if (attempts === 1) {
      await this.redis.expire(rateLimitKey, 60); // 1 min cooldown
    }

    const code = randomInt(0, 999999).toString().padStart(6, '0');
    await this.redis.set(`otp:verify:${email}`, code, 'EX', 5 * 60); // 5 min TTL
    
    // Never log full code
    console.log(`✅ OTP issued for ${email} (ends with ${code.slice(-2)})`);

    // Send via Resend
    await this.emailsService.sendOtp(email, code);
  }

  async verify(email: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`otp:verify:${email}`);
    if (!stored || stored !== code) {
      return false;
    }
    await this.redis.del(`otp:verify:${email}`);
    return true;
  }
}
```

### 5.3 Ownership Checks (Service Layer)

**Rule:** **Always validate user ownership in services**, not just controllers.

✅ **Example:**
```typescript
// Bad: ownership check only in controller
@Get(':id')
@UseGuards(JwtAuthGuard)
async getOrder(@Param('id') id: string, @Request() req: any) {
  // ❌ What if another request bypasses the guard?
  return this.ordersService.findOne(id);
}

// Good: service validates ownership
@Get(':id')
@UseGuards(JwtAuthGuard)
async getOrder(@Param('id') id: string, @Request() req: any) {
  // ✅ Service will throw if userId doesn't match
  return this.ordersService.findUserOrderOrThrow(id, req.user.id);
}
```

### 5.4 Secure Key Delivery (R2 Signed URLs, Never Plaintext)

**Rules:**
- Store keys in **private** R2 bucket
- Deliver via **signed URL** only (never plaintext in email)
- Set **short expiry** (10–30 minutes)
- **Log access** for audit trail

✅ **Example:**
```typescript
// apps/api/src/modules/storage/storage.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function saveAndGetSignedUrl(orderId: string, keys: string[]): Promise<string> {
  const objectKey = `orders/${orderId}/keys.json`;
  
  // 1. Save to R2 (private bucket)
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: objectKey,
      Body: JSON.stringify({ keys }),
      ContentType: 'application/json',
    }),
  );

  // 2. Generate signed URL (15 min expiry)
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: objectKey,
      ResponseContentDisposition: 'attachment; filename="bitloot-keys.json"',
    }),
    { expiresIn: 60 * 15 }, // 15 minutes
  );

  // 3. Log access (never log URL itself)
  console.log(`✅ Keys stored for order ${orderId}, signed URL valid until ${new Date(Date.now() + 15 * 60 * 1000).toISOString()}`);

  return url;
}
```

### 5.5 No Secrets in Frontend

**Golden Rule:** Secrets live **server-side only**. Frontend uses SDK.

✅ **Correct:**
```typescript
// Frontend calls SDK (which calls NestJS backend)
// Backend (server-side only) has:
// - NOWPAYMENTS_IPN_SECRET
// - KINGUIN_API_KEY
// - R2_SECRET_ACCESS_KEY
// - RESEND_API_KEY
// - JWT_SECRET

// Frontend ONLY has:
// - Public API base URL
// - Public R2 bucket name (for downloads via signed URLs)
```

❌ **Wrong:**
```typescript
// ❌ Never do this
const NOWPAYMENTS_KEY = process.env.NEXT_PUBLIC_NOWPAYMENTS_KEY;
const R2_SECRET = process.env.NEXT_PUBLIC_R2_SECRET;

// ❌ Secrets in environment.ts
export const API_KEYS = {
  nowpayments: 'sk_live_...',
  kinguin: 'api_key_...',
};
```

---

## Part 6: Queue & Async Patterns (BullMQ)

### 6.1 Queue Configuration

**File:** `apps/api/src/jobs/queues.ts`

```typescript
import { BullModule } from '@nestjs/bullmq';

export const QueueConfig = BullModule.forRoot({
  connection: { url: process.env.REDIS_URL! },
});

export const FulfillmentQueue = BullModule.registerQueue({ name: 'fulfillment' });
export const EmailQueue = BullModule.registerQueue({ name: 'email' });
```

### 6.2 Queue Job Processor (with Retries & DLQ)

**Rules:**
- Retry with exponential backoff
- Max 5 retries
- Dead-letter queue for failures
- Idempotent processing

✅ **Example:**
```typescript
// apps/api/src/jobs/fulfillment.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('fulfillment')
export class FulfillmentProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    const { orderId } = job.data;

    try {
      // Idempotent processing
      const order = await this.orders.findOne(orderId);
      if (order.status === 'fulfilled') {
        // Already processed
        return;
      }

      // Fetch keys from Kinguin
      const keys = await this.kinguin.fulfill(orderId);

      // Save to R2
      const url = await this.storage.saveAndGetSignedUrl(orderId, keys);

      // Mark fulfilled
      await this.orders.setStatus(orderId, 'fulfilled');

      // Send email
      await this.emails.sendOrderDelivered(orderId, url);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error; // BullMQ will retry
    }
  }
}

// Register with retry strategy
@Module({
  providers: [
    FulfillmentProcessor,
    {
      provide: 'BullQueue_fulfillment',
      useFactory: async (queueFactory: QueueFactory) => {
        return queueFactory.createQueue('fulfillment', {
          defaultJobOptions: {
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 2000, // Start at 2s, exponential up to ~30min
            },
            removeOnComplete: true,
            removeOnFail: 100, // Keep 100 failed jobs in DLQ
          },
        });
      },
    },
  ],
})
export class JobsModule {}
```

### 6.3 Enqueue Job Pattern

✅ **Example:**
```typescript
// Service enqueues work
@InjectQueue('fulfillment') private readonly fulfillmentQ: Queue

async markPaid(orderId: string): Promise<void> {
  // Update order status
  await this.orders.setStatus(orderId, 'paid');

  // Enqueue fulfillment job (non-blocking)
  await this.fulfillmentQ.add(
    'fulfillOrder',
    { orderId },
    { removeOnComplete: true },
  );
}
```

---

## Part 7: Database Standards

### 7.1 Decimal Precision for Money

**Rule:** Use `decimal(20, 8)` for **all monetary amounts** (prevents floating-point errors).

✅ **Correct:**
```typescript
@Column('decimal', { precision: 20, scale: 8 })
totalCrypto!: string; // Always string in TypeScript

// In service
const total = '1.50000000'; // 8 decimal places
```

❌ **Wrong:**
```typescript
@Column('float')
totalCrypto!: number; // Floating-point errors!

@Column('decimal')
totalCrypto!: string; // Missing precision/scale
```

### 7.2 Migration Workflow (TypeORM)

**Rules:**
- Use `migrations/` folder (TypeORM only)
- **Never auto-sync** in production (`synchronize: false`)
- Generate + review + run migrations

```bash
# Generate migration after entity change
npm run typeorm migration:generate apps/api/src/database/migrations/AddNewColumn

# Run migrations
npm run typeorm migration:run

# Revert if needed
npm run typeorm migration:revert
```

### 7.3 Indexes for Hot Paths

**Rule:** Index on `(userId, createdAt)`, `(status, createdAt)`, `(externalId)` for webhook idempotency.

✅ **Example:**
```typescript
@Entity('orders')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Order {
  // ...
}

@Entity('webhook_logs')
@Index(['externalId'], { unique: true }) // Idempotency
export class WebhookLog {
  @Column({ unique: true })
  externalId!: string; // e.g., NOWPayments payment_id
}
```

---

## Part 8: Code Quality Gates (CI/CD)

### 8.1 Pre-Commit Hook (Husky)

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run format
npm run lint --max-warnings 0
npm run type-check
```

### 8.2 CI Pipeline (GitHub Actions)

**File:** `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: bitloot
          POSTGRES_PASSWORD: bitloot
          POSTGRES_DB: bitloot
        options: --health-cmd="pg_isready -U bitloot" --health-interval=10s --health-timeout=5s --health-retries=5
      redis:
        image: redis:7-alpine
        options: --health-cmd="redis-cli ping" --health-interval=10s --health-timeout=5s --health-retries=5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint --max-warnings 0
      - run: npm run test
      - run: npm run build
```

### 8.3 PR Checklist (Must Pass Before Merge)

- ✅ **No `any`** — Run `npm run lint`
- ✅ **Zero TS errors** — Run `npm run type-check`
- ✅ **Zero ESLint errors** — Run `npm run lint --max-warnings 0`
- ✅ **All tests passing** — Run `npm run test`
- ✅ **Build succeeds** — Run `npm run build`
- ✅ **SDK regenerated** (if API changed) — Run `npm run sdk:dev`
- ✅ **Controllers fully documented** — No `@ApiResponse({ type: void })`, use DTOs
- ✅ **No secrets in code** — Review for API keys, tokens, secrets
- ✅ **Ownership checks in services** — Services validate `userId`
- ✅ **Webhooks HMAC verified** — Review webhook handlers
- ✅ **Pagination implemented** — `limit ≤ 100`

---

## Part 9: Daily Development Workflow

### 9.1 Start Development

```bash
# Install dependencies
npm install

# Start infrastructure (Postgres + Redis)
docker compose up -d

# Start both API and Web
npm run dev:all

# Or individually
npm run dev:api    # API on port 4000
npm run dev:web    # Web on port 3000
```

### 9.2 Make Code Changes

```bash
# After API changes, regenerate SDK
npm run sdk:dev

# Run quality checks
npm run format
npm run lint:fix
npm run type-check
npm run test
npm run build
```

### 9.3 Verify Before PR

```bash
# One command for all quality gates
npm run quality:full

# Or step by step
npm run type-check          # TypeScript strict mode
npm run lint --max-warnings 0  # ESLint runtime safety
npm run format              # Prettier formatting
npm run test                # Unit/integration tests
npm run build               # Webpack build
```

---

## Part 10: Common Anti-Patterns to Avoid

| Anti-Pattern | Why It's Wrong | Correct Approach |
|---|---|---|
| `const id = Math.random().toString()` | Not secure for IDs | `crypto.randomUUID()` |
| `parseInt('42')` | Missing radix (base 10) | `parseInt('42', 10)` |
| `await fetch(url).json()` | No error handling | `try/catch` block around fetch |
| `data?.field \|\| default` | Doesn't handle `0` or `''` | `data?.field ?? default` |
| `async function foo() { doAsync() }` | Floating promise | `async function foo() { await doAsync() }` |
| `export const secrets = { key: 'sk_...' }` | Secrets in frontend code | Environment variables, server-side only |
| `@Column() amount: number` | Floating-point errors | `@Column('decimal', { precision: 20, scale: 8 })` |
| `return any` | Type safety lost | Define explicit return type DTO |
| `// @ts-ignore` | Bypasses type safety | Fix the type error instead |
| `const x: any = response.data` | No type checking | Define interface + use type guards |

---

## Part 11: SDK Generation Workflow

### 11.1 After API Changes

```bash
# 1. Make controller changes (with @ApiProperty, @ApiResponse)
# 2. Start API
npm run dev:api

# 3. Generate SDK from OpenAPI spec
npm run sdk:dev

# 4. Verify SDK generated successfully
ls packages/sdk/src/generated/models/
ls packages/sdk/src/generated/api/

# 5. Use in frontend
import { ordersClient } from '@bitloot/sdk/clients/orders';
```

### 11.2 Controller Requirements for SDK Generation

Every controller endpoint **must have**:

1. `@ApiTags('Feature')` — For grouping
2. `@ApiOperation({ summary: '...' })` — Endpoint description
3. `@ApiResponse({ status: 200, type: ResponseDto })` — Response type (never `void`)
4. DTO classes (not interfaces)
5. `@ApiProperty()` on all DTO fields

---

## Part 12: Troubleshooting Guide

| Issue | Solution |
|---|---|
| **"Type error after API change"** | Run `npm run sdk:dev` to regenerate SDK |
| **"ESLint: no-floating-promises"** | Add `await` before promise or use `.catch()` |
| **"ESLint: no-explicit-any"** | Define explicit type or use type guard |
| **"Prettier formatting fails"** | Run `npm run format:fix` |
| **"Build fails with TS errors"** | Run `npm run type-check` to see all errors |
| **"Payment duplicate on retry"** | Check IPN handler idempotency key (`npPaymentId`) |
| **"OTP email not sent"** | Verify `RESEND_API_KEY` in `.env` |
| **"Webhook HMAC verification fails"** | Ensure `rawBody` is captured in NestJS middleware |
| **"Database migration fails"** | Check migration file syntax with `npm run typeorm migration:show` |
| **"Redis connection refused"** | Run `docker compose up -d` to start Redis |

---

## Part 13: Summary Table: All ESLint Rules

| Rule | Severity | Purpose |
|---|---|---|
| `no-floating-promises` | Error | Catch unhandled async |
| `no-explicit-any` | Error | Enforce type safety |
| `prefer-nullish-coalescing` | Error | Use `??` instead of `\|\|` |
| `prefer-optional-chain` | Error | Use `?.` instead of `&&` |
| `strict-boolean-expressions` | Warn | Boolean logic clarity |
| `exhaustive-deps` (React) | Warn | Hook dependency completeness |
| `no-debugger` | Error | Remove debug code |
| `no-console` (except warn/error) | Warn | Clean logs |
| `no-unsafe-*` | Error | Type-safe assignments/calls |
| `consistent-type-imports` | Error | Use `import type` for types |

---

## Part 14: References & Commands

### All Scripts

```bash
npm run dev:all          # Start API + Web (concurrent)
npm run dev:api          # API only
npm run dev:web          # Web only
npm run sdk:dev          # Generate SDK from OpenAPI
npm run type-check       # TypeScript strict mode
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format check
npm run format:fix       # Prettier auto-format
npm run test             # Run tests
npm run build            # Build all workspaces
npm run quality:full     # Run all quality gates
```

### Key Endpoints

- **API Swagger:** `http://localhost:4000/api/docs`
- **OpenAPI JSON:** `http://localhost:4000/api/docs-json`
- **Web:** `http://localhost:3000`
- **Health Check:** `http://localhost:4000/api/healthz`

### Environment Files

- `.env.example` — Template with all required variables
- `.env` — Local development (never commit)
- `tsconfig.base.json` — Shared TypeScript config
- `.eslintrc.cjs` — Runtime safety rules
- `.prettierrc` — Code formatting

---

## Conclusion

This document is the **definitive guide** for all AI agents generating code in the BitLoot project. Follow these standards rigorously:

1. **Type Safety First** — No `any`, strict TS, explicit types
2. **Runtime Safety** — ESLint rules prevent class of bugs
3. **Security by Default** — HMAC, JWT, ownership checks, signed URLs
4. **Quality Gates** — Every PR must pass all checks
5. **SDK-First** — Frontend talks only to BitLoot SDK

**Questions?** Refer to the project documentation at `docs/` or the Level 0–3 completion reports.

**Last Updated:** November 11, 2025  
**Status:** Production-Ready ✅
