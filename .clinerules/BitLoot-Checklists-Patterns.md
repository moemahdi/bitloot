# 🚀 BitLoot Code Standards: Implementation Checklists & Patterns

**Companion to:** BitLoot-Code-Standards.md  
**Last Updated:** November 11, 2025  
**Purpose:** Practical checklists and copy-paste patterns for AI agents

---

## Checklist 1: New Controller Implementation

When creating a new NestJS controller, ensure:

- [ ] **@ApiTags** applied to class
- [ ] **@ApiOperation** on every public method
- [ ] **@ApiResponse** with explicit `type` (never `void`)
- [ ] **@ApiBearerAuth** on protected routes
- [ ] **@UseGuards(JwtAuthGuard)** on protected routes
- [ ] **Accept only DTOs** (no inline validation)
- [ ] **Return response DTOs** (mapped from entities)
- [ ] **Handle errors** with NestJS exceptions
- [ ] **Pass all ESLint rules** (no floating promises, etc.)
- [ ] **Tests exist** with 80%+ coverage

---

## Checklist 2: New Service Implementation

When creating a new service, ensure:

- [ ] **Ownership validation** in every user-scoped method
- [ ] **Transactions** for multi-entity operations
- [ ] **Idempotent methods** for webhook/IPN handlers
- [ ] **Heavy work enqueued** to BullMQ (not synchronous)
- [ ] **Error handling** with explicit try/catch
- [ ] **Logging** of operations and errors
- [ ] **No raw database queries** (use query builders)
- [ ] **Indexes added** for hot path filters
- [ ] **Type safety** enforced (no `any`)
- [ ] **Unit tests** for each public method

---

## Checklist 3: New Webhook/IPN Endpoint

When adding webhook/IPN handler, ensure:

- [ ] **Raw body captured** in NestJS middleware
- [ ] **HMAC verification** (timing-safe compare)
- [ ] **Signature validation** (reject invalid, 401 response)
- [ ] **Unique constraint** on `externalId` in database
- [ ] **Idempotency check** (upsert by external ID)
- [ ] **State mutation** (update order, payment, etc.)
- [ ] **Background job enqueued** (don't do heavy work)
- [ ] **Return 200 OK quickly** (within 30 seconds)
- [ ] **Logging** of all transitions and errors
- [ ] **Replay protection** (reject duplicate events)
- [ ] **Tests** for valid + invalid + replayed signatures

---

## Checklist 4: New Frontend Feature

When adding a new feature to Next.js app, ensure:

- [ ] **Thin routes** (logic in `features/`, not `app/`)
- [ ] **SDK-only calls** (no raw fetch, axios, or 3rd-party SDKs)
- [ ] **TanStack Query** for data fetching (useQuery, useMutation)
- [ ] **React Hook Form + Zod** for all forms
- [ ] **Loading state** shown during async operations
- [ ] **Error state** with user-friendly messages
- [ ] **Empty state** when no data
- [ ] **Accessibility** (labels, focus, keyboard navigation)
- [ ] **No secrets** stored or rendered (only safe user info + JWT)
- [ ] **TypeScript strict** (no `any`, all types explicit)

---

## Copy-Paste Template 1: Entity (TypeORM)

```typescript
// apps/api/src/database/entities/my-entity.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('my_entities')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class MyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @ManyToOne(() => User, (u) => u.myEntities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'deleted'],
    default: 'active',
  })
  status!: 'active' | 'inactive' | 'deleted';

  @Column({ nullable: true })
  description?: string;

  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  amount?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

---

## Copy-Paste Template 2: DTO (Request/Response)

```typescript
// apps/api/src/modules/my-module/dto/my.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMyEntityDto {
  @ApiProperty({ description: 'Unique identifier' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Optional description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ['active', 'inactive'],
    description: 'Status',
    default: 'active',
  })
  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive' = 'active';
}

export class MyEntityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class PaginatedMyEntityResponseDto {
  @ApiProperty({ type: [MyEntityResponseDto] })
  data!: MyEntityResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
```

---

## Copy-Paste Template 3: Service (with Ownership + Transactions)

```typescript
// apps/api/src/modules/my-module/my-module.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MyEntity } from '../../database/entities/my-entity.entity';
import { CreateMyEntityDto, MyEntityResponseDto } from './dto/my.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class MyModuleService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(MyEntity) private readonly repo: Repository<MyEntity>,
    @InjectQueue('my-queue') private readonly q: Queue,
  ) {}

  // ============ OWNERSHIP CHECK ============
  async findUserEntityOrThrow(id: string, userId: string): Promise<MyEntity> {
    const entity = await this.repo.findOne({
      where: { id, userId },
    });
    if (!entity) throw new NotFoundException('Entity not found');
    return entity;
  }

  // ============ CREATE (TRANSACTIONAL) ============
  async create(dto: CreateMyEntityDto, userId: string): Promise<MyEntity> {
    return this.dataSource.transaction(async (manager) => {
      const entity = manager.create(MyEntity, {
        ...dto,
        userId,
      });
      const saved = await manager.save(entity);

      // Enqueue background work
      await this.q.add('process', { id: saved.id }, { removeOnComplete: true });

      return saved;
    });
  }

  // ============ UPDATE (with OWNERSHIP) ============
  async update(id: string, userId: string, dto: Partial<CreateMyEntityDto>): Promise<MyEntity> {
    const entity = await this.findUserEntityOrThrow(id, userId);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  // ============ DELETE (with OWNERSHIP) ============
  async softDelete(id: string, userId: string): Promise<void> {
    await this.repo.update(
      { id, userId },
      { deletedAt: new Date() },
    );
  }

  // ============ FIND ALL (PAGINATED) ============
  async findUserEntities(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: MyEntity[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      where: { userId, deletedAt: null as any },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  // ============ IDEMPOTENT UPSERT (for webhooks) ============
  async upsertIdempotent(externalId: string, data: Partial<MyEntity>): Promise<MyEntity> {
    let entity = await this.repo.findOne({ where: { externalId } as any });
    if (!entity) {
      entity = this.repo.create({ externalId, ...data });
    } else {
      Object.assign(entity, data);
    }
    return this.repo.save(entity);
  }
}
```

---

## Copy-Paste Template 4: Controller (with Guards & Swagger)

```typescript
// apps/api/src/modules/my-module/my-module.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { MyModuleService } from './my-module.service';
import { CreateMyEntityDto, MyEntityResponseDto, PaginatedMyEntityResponseDto } from './dto/my.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('My Module')
@Controller('my-module')
export class MyModuleController {
  constructor(private readonly svc: MyModuleService) {}

  @Post()
  @ApiOperation({ summary: 'Create new entity' })
  @ApiResponse({ status: 201, type: MyEntityResponseDto })
  async create(@Body() dto: CreateMyEntityDto): Promise<MyEntityResponseDto> {
    const entity = await this.svc.create(dto, dto.userId ?? 'guest');
    return this.toResponse(entity);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List my entities (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedMyEntityResponseDto })
  async list(
    @Query() paginationDto: PaginationDto,
    @Request() req: any,
  ): Promise<PaginatedMyEntityResponseDto> {
    const { data, total } = await this.svc.findUserEntities(
      req.user.id,
      paginationDto.page,
      paginationDto.limit,
    );
    return {
      data: data.map((e) => this.toResponse(e)),
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
      totalPages: Math.ceil(total / paginationDto.limit),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get entity (requires ownership)' })
  @ApiResponse({ status: 200, type: MyEntityResponseDto })
  async getOne(@Param('id') id: string, @Request() req: any): Promise<MyEntityResponseDto> {
    const entity = await this.svc.findUserEntityOrThrow(id, req.user.id);
    return this.toResponse(entity);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update entity' })
  @ApiResponse({ status: 200, type: MyEntityResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateMyEntityDto>,
    @Request() req: any,
  ): Promise<MyEntityResponseDto> {
    const entity = await this.svc.update(id, req.user.id, dto);
    return this.toResponse(entity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete entity (soft delete)' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string, @Request() req: any): Promise<void> {
    await this.svc.softDelete(id, req.user.id);
  }

  // ============ HELPER ============
  private toResponse(entity: MyEntity): MyEntityResponseDto {
    return {
      id: entity.id,
      email: entity.user?.email ?? '',
      description: entity.description,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }
}
```

---

## Copy-Paste Template 5: Webhook/IPN Handler

```typescript
// apps/api/src/modules/webhooks/webhook.controller.ts
import { Controller, Post, Headers, Req, Res, HttpCode, RawBodyRequest } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { verifyHmac } from './hmac.util';
import { WebhookService } from './webhook.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly svc: WebhookService) {}

  @Post('payment')
  @HttpCode(200)
  async handlePaymentWebhook(
    @Headers('x-payment-signature') signature: string,
    @Req() req: RawBodyRequest<any>,
    @Res() res: any,
  ): Promise<void> {
    const raw = req.rawBody?.toString?.() ?? JSON.stringify(req.body);

    // ============ 1. VERIFY HMAC ============
    if (!verifyHmac(raw, signature, process.env.PAYMENT_WEBHOOK_SECRET!)) {
      console.warn('❌ Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    try {
      // ============ 2. IDEMPOTENT PROCESSING ============
      await this.svc.handlePaymentEvent(req.body);

      // ============ 3. RETURN 200 QUICKLY ============
      return res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook processing error:', error);
      // Even on error, return 200 so sender doesn't retry with bad data
      return res.status(200).send('Accepted (processing failed)');
    }
  }
}

// apps/api/src/modules/webhooks/webhook.service.ts
@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(WebhookLog) private readonly logRepo: Repository<WebhookLog>,
    private readonly ordersService: OrdersService,
  ) {}

  async handlePaymentEvent(payload: any): Promise<void> {
    const { payment_id, status } = payload;

    // ============ IDEMPOTENCY CHECK ============
    const existing = await this.logRepo.findOne({
      where: { externalId: payment_id },
    });
    if (existing) {
      console.log(`⏭️  Webhook already processed: ${payment_id}`);
      return; // Idempotent: skip if already seen
    }

    // ============ PROCESS STATE CHANGE ============
    if (status === 'paid') {
      const updated = await this.ordersService.markPaidIdempotent(payment_id, payload.order_id);
      if (updated) {
        console.log(`✅ Order ${payload.order_id} marked paid`);
      }
    }

    if (status === 'failed') {
      await this.ordersService.setStatus(payload.order_id, 'failed');
      console.log(`❌ Order ${payload.order_id} marked failed`);
    }

    // ============ AUDIT TRAIL ============
    await this.logRepo.save({
      externalId: payment_id,
      type: 'payment',
      payload,
      status: 'success',
    });
  }
}
```

---

## Copy-Paste Template 6: React Hook Form + Zod

```typescript
// apps/web/src/features/my-feature/MyForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { myModuleClient } from '@bitloot/sdk/clients/my-module';

// ============ SCHEMA ============
const myFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  description: z.string().min(1, 'Description required').max(500),
  status: z.enum(['active', 'inactive'], { message: 'Invalid status' }),
});

type MyFormData = z.infer<typeof myFormSchema>;

// ============ COMPONENT ============
export function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MyFormData>({
    resolver: zodResolver(myFormSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MyFormData) => myModuleClient.create(data),
    onSuccess: (result) => {
      console.log('✅ Created:', result);
      reset(); // Clear form
      // Show toast: "Entity created successfully"
    },
    onError: (error) => {
      console.error('❌ Error:', error);
      // Show toast: "Failed to create entity"
    },
  });

  async function onSubmit(data: MyFormData) {
    await createMutation.mutateAsync(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          placeholder="user@example.com"
          className={errors.email ? 'border-red-500' : ''}
          disabled={isSubmitting}
          aria-label="Email address"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" className="text-red-500 text-sm">
            {errors.email.message}
          </span>
        )}
      </div>

      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          {...register('description')}
          id="description"
          placeholder="Enter description"
          disabled={isSubmitting}
          aria-label="Description"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <span id="description-error" className="text-red-500 text-sm">
            {errors.description.message}
          </span>
        )}
      </div>

      {/* Status Select */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium">
          Status
        </label>
        <select
          {...register('status')}
          id="status"
          disabled={isSubmitting}
          aria-label="Status"
          aria-invalid={!!errors.status}
          aria-describedby={errors.status ? 'status-error' : undefined}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {errors.status && (
          <span id="status-error" className="text-red-500 text-sm">
            {errors.status.message}
          </span>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || createMutation.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>

      {/* Error Toast */}
      {createMutation.isError && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {createMutation.error?.message ?? 'Unknown error'}
        </div>
      )}
    </form>
  );
}
```

---

## Copy-Paste Template 7: TanStack Query with Loading/Error/Empty States

```typescript
// apps/web/src/features/my-feature/MyEntityList.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { myModuleClient } from '@bitloot/sdk/clients/my-module';

export function MyEntityList({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-entities', userId],
    queryFn: () => myModuleClient.list({ page: 1, limit: 20 }),
    enabled: !!userId,
    staleTime: 60_000, // 1 minute
  });

  // ============ LOADING STATE ============
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  // ============ ERROR STATE ============
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">
        <p className="font-semibold">Failed to load entities</p>
        <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  // ============ EMPTY STATE ============
  if (!data?.data || data.data.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No entities found</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Create First Entity
        </button>
      </div>
    );
  }

  // ============ DATA STATE ============
  return (
    <div className="space-y-4">
      {data.data.map((entity) => (
        <div key={entity.id} className="p-4 border rounded hover:bg-gray-50">
          <h3 className="font-semibold">{entity.email}</h3>
          <p className="text-sm text-gray-600">{entity.description}</p>
          <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
            {entity.status}
          </span>
        </div>
      ))}

      {/* Pagination info */}
      <p className="text-sm text-gray-600">
        Showing {data.data.length} of {data.total} entities
      </p>
    </div>
  );
}
```

---

## Copy-Paste Template 8: HMAC Verification Utility

```typescript
// apps/api/src/common/utils/hmac.util.ts
import * as crypto from 'crypto';

export interface HmacVerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Verify HMAC signature with timing-safe comparison
 * @param rawBody Raw request body (as string)
 * @param signature Incoming signature (hex format)
 * @param secret Signing secret
 * @returns Verification result
 */
export function verifyHmac(
  rawBody: string,
  signature: string,
  secret: string,
): HmacVerificationResult {
  if (!signature) {
    return { valid: false, error: 'Missing signature' };
  }

  try {
    // Generate expected HMAC
    const expectedHmac = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    // Timing-safe comparison (prevents timing attacks)
    const signatureBuffer = Buffer.from(signature || '', 'hex');
    const expectedBuffer = Buffer.from(expectedHmac, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: 'Signature length mismatch' };
    }

    const valid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    return { valid };
  } catch (error) {
    return { valid: false, error: 'HMAC verification failed' };
  }
}

// Usage
const result = verifyHmac(rawBody, incomingSignature, secret);
if (!result.valid) {
  console.warn(`❌ Signature verification failed: ${result.error}`);
  return res.status(401).send('Invalid signature');
}
```

---

## Copy-Paste Template 9: OTP Service

```typescript
// apps/api/src/modules/auth/otp.service.ts
import { Injectable, TooManyRequestsException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { Redis } from 'ioredis';

@Injectable()
export class OtpService {
  private readonly OTP_TTL = 5 * 60; // 5 minutes
  private readonly RATE_LIMIT_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW = 60; // 1 minute

  constructor(private readonly redis: Redis) {}

  /**
   * Generate and send OTP
   */
  async issue(email: string): Promise<void> {
    const rateLimitKey = `otp:ratelimit:send:${email}`;
    const attempts = await this.redis.incr(rateLimitKey);

    if (attempts > this.RATE_LIMIT_ATTEMPTS) {
      throw new TooManyRequestsException('Too many OTP requests. Try again later.');
    }

    if (attempts === 1) {
      await this.redis.expire(rateLimitKey, this.RATE_LIMIT_WINDOW);
    }

    // Generate 6-digit OTP
    const code = randomInt(0, 999999).toString().padStart(6, '0');
    const otpKey = `otp:verify:${email}`;

    // Store in Redis with TTL
    await this.redis.set(otpKey, code, 'EX', this.OTP_TTL);

    // Log (never full code!)
    console.log(`✅ OTP issued for ${email} (last 2 digits: ${code.slice(-2)})`);

    // Send via Resend (do NOT include full OTP in response)
    // await this.emailService.sendOtp(email, code);
  }

  /**
   * Verify OTP with rate limiting
   */
  async verify(email: string, code: string): Promise<boolean> {
    const rateLimitKey = `otp:ratelimit:verify:${email}`;
    const attempts = await this.redis.incr(rateLimitKey);

    if (attempts > 5) {
      throw new TooManyRequestsException('Too many OTP verification attempts. Try again later.');
    }

    if (attempts === 1) {
      await this.redis.expire(rateLimitKey, 60); // 1 minute window
    }

    const otpKey = `otp:verify:${email}`;
    const stored = await this.redis.get(otpKey);

    if (!stored || stored !== code) {
      console.warn(`❌ Invalid OTP for ${email} (attempt ${attempts})`);
      return false;
    }

    // Valid: clean up
    await this.redis.del(otpKey);
    await this.redis.del(rateLimitKey);

    console.log(`✅ OTP verified for ${email}`);
    return true;
  }
}
```

---

## Copy-Paste Template 10: Queue Processor (with Retries)

```typescript
// apps/api/src/jobs/my-job.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('my-queue')
export class MyJobProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    const { id } = job.data;

    try {
      console.log(`▶️  Processing job ${job.id}: ${id}`);

      // ============ IDEMPOTENCY CHECK ============
      const existing = await this.myService.getProcessed(id);
      if (existing) {
        console.log(`⏭️  Already processed: ${id}`);
        return;
      }

      // ============ ACTUAL WORK ============
      const result = await this.myService.process(id);
      console.log(`✅ Job ${job.id} completed:`, result);

      // ============ MARK AS PROCESSED ============
      await this.myService.markProcessed(id);
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      // BullMQ will retry based on strategy
      throw error;
    }
  }
}

// Module registration with retry strategy
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'my-queue',
      defaultJobOptions: {
        attempts: 5, // Retry up to 5 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start at 2s, exponential backoff
        },
        removeOnComplete: true, // Remove successful jobs
        removeOnFail: 100, // Keep last 100 failed jobs for debugging
      },
    }),
  ],
  providers: [MyJobProcessor],
})
export class JobsModule {}

// Enqueue usage
async enqueueJob(id: string) {
  await this.myQueue.add(
    'process',
    { id },
    {
      jobId: id, // Prevents duplicate jobs with same ID
      removeOnComplete: true,
    },
  );
}
```

---

## Quick Reference: Common Mistakes & Fixes

| Mistake | Fix |
|---|---|
| `async doWork() { await something(); }` | ❌ Floating promise. Change to: `async doWork() { await something(); return result; }` |
| `if (user.email)` | ❌ Doesn't handle empty string or `null`. Change to: `if (user?.email)` |
| `const result = data \|\| default` | ❌ Treats `0` and `''` as falsy. Change to: `const result = data ?? default` |
| `const id = Math.random().toString()` | ❌ Not unique. Change to: `const id = crypto.randomUUID()` |
| `parseInt('42')` | ❌ Missing radix. Change to: `parseInt('42', 10)` |
| `@Column() amount: number` | ❌ Floating-point errors. Change to: `@Column('decimal', { precision: 20, scale: 8 }) amount!: string` |
| `// @ts-ignore const x = ...` | ❌ Bypasses safety. Change to: Fix the type error properly |
| `fetch(url).json()` | ❌ No error handling. Change to: `try { const res = await fetch(url); const json = await res.json(); } catch (e) { ... }` |
| No `@ApiResponse` on endpoint | ❌ SDK type becomes `void`. Add: `@ApiResponse({ status: 200, type: MyDto })` |
| `return any` from service | ❌ Type lost. Change to: `return MyResponseDto` |

---

## End-to-End Example: Complete Feature

### 1. Create Entity

```typescript
// database/entities/product.entity.ts
@Entity('products')
@Index(['categoryId', 'createdAt'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('decimal', { precision: 20, scale: 8 })
  price!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
```

### 2. Create DTO

```typescript
// modules/products/dto/product.dto.ts
export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  price!: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  price!: string;
}
```

### 3. Create Service

```typescript
// modules/products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async findAll(): Promise<Product[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }
}
```

### 4. Create Controller

```typescript
// modules/products/products.controller.ts
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private svc: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async list(): Promise<ProductResponseDto[]> {
    const products = await this.svc.findAll();
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    }));
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.svc.create(dto);
    return {
      id: product.id,
      name: product.name,
      price: product.price,
    };
  }
}
```

### 5. Generate SDK

```bash
npm run sdk:dev
```

### 6. Use in Frontend

```typescript
// apps/web/src/features/products/ProductList.tsx
export function ProductList() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsClient.list(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No products</div>;

  return (
    <ul>
      {data.map((p) => (
        <li key={p.id}>
          {p.name} - ${p.price}
        </li>
      ))}
    </ul>
  );
}
```

---

## Final Checklist Before Creating PR

- [ ] All code passes `npm run type-check`
- [ ] All code passes `npm run lint --max-warnings 0`
- [ ] All code passes `npm run format`
- [ ] All tests pass `npm run test`
- [ ] Build succeeds `npm run build`
- [ ] SDK regenerated `npm run sdk:dev` (if API changed)
- [ ] No `any` types left in code
- [ ] No `@ts-ignore` comments
- [ ] No secrets or API keys in code
- [ ] No floating promises (all async properly awaited)
- [ ] Ownership checks on protected routes
- [ ] Pagination implemented (`limit ≤ 100`)
- [ ] DTOs have Swagger decorators
- [ ] Controllers have complete `@ApiResponse`
- [ ] Tests cover happy path + error cases
- [ ] Database indexes on hot paths
- [ ] Permissions/guards on protected endpoints

---

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Status:** Production-Ready ✅
