# BitLoot SDK Integration Guide

**Status:** ✅ Production-Ready  
**Package:** `@bitloot/sdk`  
**Generator:** OpenAPI Generator (typescript-fetch)

---

## 🔒 SDK-First Principle

**All frontend API calls MUST use `@bitloot/sdk`.** No direct fetch/axios to backend.

```
Frontend (Next.js) → @bitloot/sdk → NestJS API → (3rd-party APIs)
```

Secrets (Kinguin, NOWPayments, Resend) stay server-side only.

---

## 📁 SDK Structure

```
packages/sdk/
├── src/
│   ├── index.ts           # Main exports
│   ├── auth-client.ts     # Custom auth client (OTP flow)
│   ├── catalog-client.ts  # Custom catalog wrapper
│   └── generated/         # Auto-generated from OpenAPI
│       ├── apis/          # AdminApi, OrdersApi, CatalogApi, etc.
│       ├── models/        # DTOs (OrderResponseDto, ProductResponseDto, etc.)
│       └── runtime.ts     # Fetch configuration
├── openapi-config.yaml    # Generator config
├── fix-sdk-runtime.js     # Post-gen TypeScript fix
└── package.json
```

---

## ⚙️ Generation Commands

```bash
# Generate SDK from running API
npm run sdk:dev          # Runs: generate + build

# Manual steps
npm run generate         # Fetch OpenAPI spec → generate code
npm run build            # Compile TypeScript
```

**openapi-config.yaml:**
```yaml
generatorName: typescript-fetch
inputSpec: http://localhost:4000/api/docs-json
output: ./src/generated
additionalProperties:
  supportsES6: true
  withInterfaces: true
  typescriptThreePlus: true
  modelPropertyNaming: camelCase
```

---

## 🔌 Frontend Integration Patterns

### 1. API Configuration with Auth

```ts
// apps/web/src/lib/api-config.ts
import { Configuration } from '@bitloot/sdk';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts[1]?.split(';')[0] ?? null;
  return null;
}

export const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  accessToken: (): string => getCookie('accessToken') ?? '',
});

// Pre-configured instance for reuse
export const adminApi = new AdminApi(apiConfig);
```

### 2. Using Generated API Clients

```tsx
// Admin pages use typed API clients
import { AdminApi, AuditLogsApi, Configuration } from '@bitloot/sdk';
import type { PaginatedAuditLogsDto, OrderResponseDto } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const auditLogsApi = new AuditLogsApi(apiConfig);

// With TanStack Query
const { data, isLoading } = useQuery<PaginatedAuditLogsDto>({
  queryKey: ['audit-logs', page],
  queryFn: () => auditLogsApi.auditLogControllerQuery({ limit: 50, offset: page * 50 }),
  staleTime: 30_000,
});
```

### 3. Custom Clients (Auth, Catalog)

```tsx
// Auth uses custom client (not auto-generated)
import { authClient } from '@bitloot/sdk';

// Request OTP
const result = await authClient.requestOtp(email, captchaToken);

// Verify OTP
const auth = await authClient.verifyOtp(email, code);
// Returns: { success, accessToken, refreshToken, user }

// Refresh token
const tokens = await authClient.refreshToken(refreshToken);
```

```tsx
// Catalog uses wrapper for convenience
import { catalogClient } from '@bitloot/sdk';

// Simplified API
const products = await catalogClient.findAll({
  q: 'gta',
  platform: 'steam',
  sort: 'price_asc',
  limit: 12,
  page: 1,
});

const categories = await catalogClient.getCategories();
const filters = await catalogClient.getFilters();
```

---

## 📦 Exports from SDK

```ts
// Generated APIs
export { AdminApi, OrdersApi, CatalogApi, UsersApi, FulfillmentApi, ... } from './generated';

// Generated Models (types)
export type { OrderResponseDto, ProductResponseDto, UserResponseDto, ... } from './generated';

// Configuration
export { Configuration } from './generated';

// Custom Clients
export { authClient, AuthClient } from './auth-client';
export { catalogClient } from './catalog-client';

// Constants
export const VERSION = '0.0.1';
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
```

---

## 🛠️ Common Usage Patterns

### Admin Dashboard

```tsx
import { AdminOperationsApi, AdminApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminOpsApi = new AdminOperationsApi(apiConfig);
const adminApi = new AdminApi(apiConfig);

// Get feature flags
const flags = await adminOpsApi.adminOpsControllerGetFlags();

// Get orders with pagination
const orders = await adminApi.adminControllerGetOrders({ limit: 50, offset: 0 });
```

### Public Catalog

```tsx
import { catalogClient } from '@bitloot/sdk';

// No auth needed for public endpoints
const products = await catalogClient.findAll({ featured: true, limit: 8 });
const product = await catalogClient.catalogControllerGetProduct({ slug: 'gta-v' });
```

### Authenticated User Actions

```tsx
import { UsersApi, OrdersApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const usersApi = new UsersApi(apiConfig);
const ordersApi = new OrdersApi(apiConfig);

// Get current user
const me = await usersApi.usersControllerGetMe();

// Get user orders
const orders = await ordersApi.ordersControllerGetUserOrders({ limit: 10 });
```

---

## ⚠️ Post-Generation Fix

The `fix-sdk-runtime.js` script patches a TypeScript strict mode issue:

```js
// Fixes FetchError class for noImplicitOverride
// Old: constructor(public cause: Error, ...)
// New: constructor(public override cause: Error, ...)
```

Runs automatically after `npm run generate`.

---

## ✅ Checklist

- [ ] API running at `localhost:4000` before generation
- [ ] Run `npm run sdk:dev` after any backend API changes
- [ ] Use `Configuration` with `accessToken` for authenticated calls
- [ ] Import types with `import type { ... }` for tree-shaking
- [ ] Use TanStack Query for data fetching (caching, loading states)

---

## 🚫 Never Do This

```tsx
// ❌ Direct fetch to backend
const res = await fetch('http://localhost:4000/api/orders');

// ❌ Hardcoded URLs
const data = await axios.get('/api/admin/orders');

// ❌ Manual token headers
headers: { Authorization: `Bearer ${token}` }
```

**Always use SDK clients instead.**
