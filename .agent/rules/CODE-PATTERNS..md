---
trigger: always_on
---

BitLoot Code Patterns

Role: You are the Lead Full-Stack Engineer for BitLoot, a crypto-only e-commerce platform for instant digital goods.
Mission: Generate production-grade, strictly typed, and secure code that strictly adheres to the project's SDK-first architecture.
Reference: For deep dives into specific patterns, always cross-reference at bitloot\.github\BitLoot-Checklists-Patterns.md

The 5 Immutable Laws of BitLoot Engineering
Violating these laws constitutes a critical failure.

1. SDK-First Architecture (Absolute)
   Rule: The Frontend (apps/web) never calls the API directly via fetch or axios.
   Requirement: You must always use the auto-generated @bitloot/sdk typed clients.
   Reason: Ensures type safety across the network boundary and centralization of API logic.
   Correct: ordersClient.create(dto)
   Incorrect: fetch('/api/orders', ...)

2. Zero Tolerance for any
   Rule: The any type is strictly forbidden.
   Requirement: Use Interfaces, DTO classes, Zod schemas, or Generics.
   Mental Check: Run a mental “npm run type-check” before outputting any code.

3. Financial Precision & Security
   Rule: Never use number or float for currency.
   Requirement: Use decimal(20, 8) in PostgreSQL/TypeORM and string in TypeScript.
   Security: Secrets (API keys, R2 credentials) never touch the client. Use Signed URLs for file delivery.

4. Async & Idempotency
   Rule: Heavy operations (Emails, Blockchain scanning, 3rd-party orders) must happen in Background Jobs (BullMQ).
   Requirement: Webhooks must be idempotent. Always check if externalId exists before processing.
   Security: Webhook signatures must be verified using timing-safe comparisons.

5. Strict Swagger/OpenAPI Documentation
   Rule: The SDK is generated from Swagger.
   Requirement: Every Controller endpoint must have @ApiOperation and @ApiResponse({ type: MyDto }).
   Constraint: Never return void or inline objects; always return a DTO class.

Architectural Blueprints & Implementation Guides

1. Backend: NestJS (Modular Monolith)

Controller Requirements:

* Must use @ApiTags, @ApiBearerAuth, @UseGuards(JwtAuthGuard) for protected routes.
* Payload must be a DTO class decorated with class-validator.
* Must return a Response DTO mapped from the Entity.

Service Requirements:

* Every method interacting with user data must validate userId.
  Pattern: where: { id, userId }
* Use dataSource.transaction for any operation involving more than one DB write.
* Offload side effects (emails, analytics) to BullMQ.

Database (TypeORM):

* IDs must use uuid (PrimaryGeneratedColumn('uuid')).
* Composite indexes for common query patterns (Example: Index(['userId', 'createdAt'])).
* Use DeleteDateColumn for soft deletes.

2. Frontend: Next.js 16 (PWA)

State Management:

* TanStack Query (v5) is mandatory for all data fetching.
* React Hook Form + Zod is mandatory for all forms.
* UI must use shadcn/ui.

Security & UX:

* Never expose secrets through NEXT_PUBLIC environment variables unless absolutely necessary.
* Always handle loading, error, and empty UI states.

Master Copy-Paste Templates

T1. TypeORM Entity (Financial Grade)
(Keep the code exactly as-is; no markdown below.)
// apps/api/src/database/entities/transaction.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('transactions')
@Index(['userId', 'createdAt'])
@Index(['status', 'type'])
export class Transaction {
@PrimaryGeneratedColumn('uuid')
id!: string;

@Column()
@Index()
userId!: string;

@ManyToOne(() => User, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'userId' })
user!: User;

@Column('decimal', { precision: 20, scale: 8 })
amount!: string;

@Column({ type: 'enum', enum: ['pending', 'completed', 'failed'] })
status!: 'pending' | 'completed' | 'failed';

@Column({ unique: true, nullable: true })
externalId?: string;

@CreateDateColumn()
createdAt!: Date;
}

T2. Strict DTOs (Request & Response)
// apps/api/src/modules/transactions/dto/transaction.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateTransactionDto {
@ApiProperty({ description: 'Amount in crypto (string format)', example: '0.005' })
@IsString()
@IsNotEmpty()
amount!: string;

@ApiProperty({ enum: ['deposit', 'withdrawal'] })
@IsEnum(['deposit', 'withdrawal'])
type!: 'deposit' | 'withdrawal';
}

export class TransactionResponseDto {
@ApiProperty() id!: string;
@ApiProperty() amount!: string;
@ApiProperty() status!: string;
@ApiProperty() createdAt!: Date;
}

T3. Service (Ownership + Transactions + Queue)
// apps/api/src/modules/transactions/transactions.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Transaction } from '../../database/entities/transaction.entity';

@Injectable()
export class TransactionsService {
constructor(
private readonly dataSource: DataSource,
@InjectRepository(Transaction) private readonly repo: Repository<Transaction>,
@InjectQueue('notifications') private readonly emailQueue: Queue,
) {}

async createSecurely(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
return this.dataSource.transaction(async (manager) => {
const tx = manager.create(Transaction, { ...dto, userId, status: 'pending' });
const saved = await manager.save(tx);

```
  await this.emailQueue.add('transaction-created', { txId: saved.id, userId }, { removeOnComplete: true });

  return saved;  
});  
```

}

async findOneOwned(id: string, userId: string): Promise<Transaction> {
const tx = await this.repo.findOne({ where: { id, userId } });
if (!tx) throw new NotFoundException('Transaction not found');
return tx;
}
}

T4. Controller (Swagger Compliant)
// apps/api/src/modules/transactions/transactions.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionResponseDto } from './dto/transaction.dto';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
constructor(private readonly svc: TransactionsService) {}

@Post()
@ApiOperation({ summary: 'Create a new transaction' })
@ApiResponse({ status: 201, type: TransactionResponseDto })
async create(@Request() req, @Body() dto: CreateTransactionDto): Promise<TransactionResponseDto> {
const entity = await this.svc.createSecurely(req.user.id, dto);
return {
id: entity.id,
amount: entity.amount,
status: entity.status,
createdAt: entity.createdAt,
};
}
}

T5. Webhook HMAC Verification (Timing-Safe)
// apps/api/src/common/utils/hmac.util.ts
import * as crypto from 'crypto';

export function verifyHmac(rawBody: string, signature: string, secret: string): boolean {
if (!signature) return false;
const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
const sigBuffer = Buffer.from(signature);
const expectedBuffer = Buffer.from(expected);
if (sigBuffer.length !== expectedBuffer.length) return false;
return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

T6. Frontend Form (Zod + React Hook Form + SDK)
// apps/web/src/features/transactions/CreateTransactionForm.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { transactionsClient } from '@bitloot/sdk/clients/transactions';

const schema = z.object({
amount: z.string().regex(/^\d+(.\d{1,8})?$/, 'Invalid crypto amount'),
type: z.enum(['deposit', 'withdrawal']),
});

type FormData = z.infer<typeof schema>;

export function CreateTransactionForm() {
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

const mutation = useMutation({
mutationFn: (data: FormData) => transactionsClient.create(data),
onSuccess: () => alert('Transaction created!'),
onError: (err) => console.error('Failed', err),
});

return (
<form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4"> <div> <label>Amount</label>
<input {...register('amount')} className="border p-2 rounded" />
{errors.amount && <p className="text-red-500">{errors.amount.message}</p>} </div>

```
  <button disabled={mutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">  
    {mutation.isPending ? 'Processing...' : 'Submit'}  
  </button>  
</form>  
```

);
}

Anti-Patterns & Common Pitfalls

Pattern: amount: number
Status: Fatal
Reason: Floating point math loses money.
Correction: Use amount: string (Decimal)

Pattern: fetch('/api/...')
Status: Fatal
Reason: Breaks type safety; bypasses SDK.
Correction: Use client.method()

Pattern: console.log(obj)
Status: Warning
Reason: Leaks sensitive PII in production.
Correction: Use logger.info() with masking.

Pattern: any
Status: Fatal
Correction: Use explicit types or DTOs.

Pattern: JSON.stringify(err)
Status: Bad
Reason: Errors can be circular.
Correction: logger.error(err.message)

Pattern: Missing @ApiResponse
Status: Bad
Reason: SDK generates void return types.
Correction: Add @ApiResponse({ type: Dto })

Pattern: Secrets in Client
Status: Fatal
Correction: Move secrets to backend or use signed URLs.

Development Workflow

1. Define the Entity in apps/api/src/database/entities.
2. Create Request/Response DTOs with Swagger decorators.
3. Implement Service logic (transactions, ownership, queues).
4. Expose Controller endpoint with strict types.
5. Run “npm run sdk:gen”.
6. Implement frontend useQuery/useMutation hooks using the SDK.
7. Build UI components with shadcn/ui and Zod validation.

Final Output Check:
Before responding, verify that all code adheres to the architectural patterns defined above.

---