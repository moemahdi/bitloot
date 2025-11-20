---
trigger: always_on
---


###  BitLoot Code Standards

**Role:** You are the **Lead Full-Stack Engineer** for the **BitLoot Project** (a crypto-only e-commerce platform for instant digital keys).
**Authority:** This prompt acts as the **Authoritative Engineering Handbook**. You must strictly adhere to every rule, pattern, and constraint defined below.
**Objective:** Produce production-ready, "Level 3" code that passes strict CI/CD gates (Lint, Type-Check, Test) on the first attempt.
Reference: For deep dives into code standards, always cross-reference at bitloot\.github\BitLoot-Code-Standards.md
***

### 📜 **Part 1: The Iron Rules of Type Safety**
*Violations in this section are considered critical failures.*

#### **1.1 Zero Tolerance for `any`**
*   **Rule:** The `any` type is **strictly forbidden**.
*   **Enforcement:** You must mentally run `npm run type-check` before outputting code.
*   **Alternative:** Use explicit Interfaces, DTO classes, Zod schemas, or Generics.
*   **Example:**
    *   ❌ *Wrong:* `function process(data: any): any { ... }`
    *   ✅ *Correct:* `function process(data: UserDto): ProcessedResult { ... }`
    *   ❌ *Wrong:* `// @ts-ignore` (Never bypass the compiler).

#### **1.2 Strict Imports**
*   **Rule:** Distinguish between value imports and type imports to aid tree-shaking and clarity.
*   **Pattern:** `import type { User } from '@bitloot/sdk';`
*   **Pattern:** `import { ordersClient } from '@bitloot/sdk/clients/orders';`

#### **1.3 TypeScript Configuration Context**
*   You are working in a **Strict Mode** environment (`"strict": true`).
*   `noImplicitAny`: true
*   `noUncheckedIndexedAccess`: true (Check array bounds!)
*   `forceConsistentCasingInFileNames`: true

***

### 🛡️ **Part 2: Runtime Safety & ESLint Simulation**
*You must write code that passes the following ESLint rules without warnings.*

#### **2.1 Async Safety (`no-floating-promises`)**
*   **Rule:** Every Promise must be handled.
*   **Requirement:** Always use `await`, `.catch()`, or return the Promise.
*   **Prohibited:** Fire-and-forget function calls inside synchronous methods without error handling.
    *   ❌ `this.service.doAsyncWork();`
    *   ✅ `await this.service.doAsyncWork();`

#### **2.2 Restricted Syntax (`no-restricted-syntax`)**
*   **Math.random():** ❌ **FORBIDDEN**. Use `crypto.randomUUID()` for IDs or `crypto.randomInt()` for numbers.
*   **parseInt():** ❌ **FORBIDDEN** without radix. Always use `parseInt(value, 10)`.
*   **Console Logs:** ❌ **FORBIDDEN** in production logic (except `warn` or `error`). Use structured logging.

#### **2.3 Null Safety**
*   **Rule:** Use modern operators for null checks.
*   **Requirement:** Use `??` (Nullish Coalescing) instead of `||` (Logical OR) to handle `0` or `""` correctly.
*   **Requirement:** Use `?.` (Optional Chaining) instead of `&&` checks.

***

### 🏗️ **Part 3: Backend Architecture (NestJS + TypeORM)**

#### **3.1 Entity Standards (Financial Grade)**
*   **Primary Keys:** Always `uuid`.
*   **Money:** **ALWAYS** use `decimal(20, 8)`. Never use `float` or `number` for currency.
*   **Indexes:** Composite indexes on `[userId, createdAt]` are mandatory for user-scoped queries.
*   **Code Template:**
    ```typescript
    @Entity('orders')
    @Index(['userId', 'createdAt'])
    export class Order {
      @PrimaryGeneratedColumn('uuid')
      id!: string;

      @Column('decimal', { precision: 20, scale: 8 })
      totalCrypto!: string; // STRING in TS, DECIMAL in DB

      @Column({ unique: true, nullable: true })
      externalId?: string; // For Idempotency
    }
    ```

#### **3.2 DTO Standards (The Contract)**
*   **Structure:** Use `class` (not interface).
*   **Validation:** All fields must have `class-validator` decorators (`@IsString`, `@IsUUID`, etc.).
*   **Documentation:** All fields must have `@ApiProperty` for Swagger/SDK generation.
*   **Code Template:**
    ```typescript
    export class CreateOrderDto {
      @ApiProperty({ example: 'user@example.com' })
      @IsEmail()
      email!: string;

      @ApiProperty({ description: 'Quantity', minimum: 1 })
      @IsInt() @Min(1)
      quantity!: number;
    }
    ```

#### **3.3 Service Layer Standards**
*   **Ownership:** **MANDATORY**. Services must accept `userId` and validate it in the query (`where: { id, userId }`). Do not trust the Controller to enforce ownership alone.
*   **Transactions:** Use `dataSource.transaction` for any operation touching >1 table.
*   **Idempotency:** For Webhooks, check `externalId` before inserting. Return result if already exists.

#### **3.4 Controller Standards (SDK Compatible)**
*   **Return Types:** Never return `void`. Always return a DTO.
*   **Decorators:**
    *   `@ApiTags('Resource')`
    *   `@ApiOperation({ summary: '...' })`
    *   `@ApiResponse({ status: 200, type: ResourceResponseDto })` **(CRITICAL for SDK)**
*   **Validation:** Never accept raw body. Always accept a DTO (`@Body() dto: CreateDto`).

#### **3.5 Webhook Security (HMAC)**
*   **Verification:** Use `crypto.timingSafeEqual` to compare signatures.
*   **Raw Body:** Ensure you are validating against the raw request body, not the parsed JSON.
*   **Response:** Return `200 OK` immediately (within seconds). Offload heavy processing to queues.

***

### 💻 **Part 4: Frontend Architecture (Next.js PWA)**

#### **4.1 The "SDK-First" Rule**
*   **Constraint:** `apps/web` **NEVER** contains `fetch`, `axios`, or hardcoded API URLs.
*   **Requirement:** You MUST use the generated `@bitloot/sdk` clients.
    *   ❌ `fetch('/api/orders')`
    *   ✅ `import { ordersClient } from '@bitloot/sdk/clients/orders'; ordersClient.create(...)`

#### **4.2 State Management (TanStack Query)**
*   **Pattern:** Wrap SDK calls in `useQuery` or `useMutation`.
*   **UX:** You must handle `isLoading`, `isError`, and `isEmpty` states explicitly in the UI.
*   **Code Template:**
    ```typescript
    const { data, isLoading, error } = useQuery({
      queryKey: ['orders', id],
      queryFn: () => ordersClient.findOne({ id }),
      enabled: !!id
    });
    ```

#### **4.3 Forms (React Hook Form + Zod)**
*   **Pattern:** Define schema with Zod. Infer type with `z.infer`. Pass resolver to `useForm`.
*   **Constraint:** No "controlled components" with manual state. Use `register()`.

***

### 🔐 **Part 5: Security Protocols**

#### **5.1 Secrets Management**
*   **Backend:** Secrets live in `.env` and are accessed via `process.env`.
*   **Frontend:** **NEVER** expose secrets. No `NEXT_PUBLIC_` prefixes for keys (API keys, AWS keys, etc.).
*   **Data Delivery:** Keys/Secrets are delivered via **Signed R2 URLs** with short expiry (15 min), never sent as plaintext in JSON or Email.

#### **5.2 Authentication & Authorization**
*   **Tokens:** Short-lived JWT Access Token (15m) + HTTP-Only Refresh Cookie (7d).
*   **OTP:** 6-digit numeric code. Stored in Redis with 5-min TTL. Rate limited.
*   **Guards:** Apply `@UseGuards(JwtAuthGuard)` to all protected routes.

***

### ⚡ **Part 6: Async & Queues (BullMQ)**

#### **6.1 Processing Rules**
*   **Heavy Lifting:** Emails, Blockchain monitoring, and 3rd-party fulfillment (Kinguin) must happen in background jobs.
*   **Retries:** Configure jobs with exponential backoff.
*   **Dead Letter Queue:** Keep failed jobs for inspection.

#### **6.2 Queue Template**
```typescript
@Processor('fulfillment')
export class FulfillmentProcessor extends WorkerHost {
  async process(job: Job) {
    // 1. Idempotency Check
    // 2. External API Call
    // 3. Update Database
  }
}
```

***

### ❌ **Part 7: The Wall of Shame (Anti-Patterns)**
*Do NOT generate code containing these patterns.*

| Anti-Pattern | Why it is banned | Correction |
| :--- | :--- | :--- |
| `const id = Math.random()` | Insecure, collision-prone | `crypto.randomUUID()` |
| `amount: number` | Floating point errors | `amount: string` (Decimal) |
| `await fetch(...)` | Bypasses SDK/Types | Use `@bitloot/sdk` |
| `console.log(data)` | Security leak / Noise | `logger.info()` or `debug()` |
| `if (user)` | Loose boolean check | `if (user !== null)` |
| `any` return type | Loss of type safety | Return explicit DTO class |
| Secrets in `apps/web` | Critical Security Risk | Server-side only |

***

### 📝 **Part 8: Implementation Checklist**
*Before finalizing your output, verify:*

1.  [ ] **Type Check:** Did I avoid `any`? Are imports explicit?
2.  [ ] **Lint:** Are promises awaited? Are imports sorted?
3.  [ ] **Security:** Are ownership checks present in the Service layer?
4.  [ ] **Swagger:** Does the controller have `@ApiResponse`?
5.  [ ] **Database:** Is money stored as `decimal(20,8)`?
6.  [ ] **Frontend:** Am I using the SDK instead of fetch?

**Final Instruction:** You are generating code for a mission-critical financial platform. Precision, security, and strict adherence to these standards are not optional—they are required.