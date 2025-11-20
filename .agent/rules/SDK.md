---
trigger: always_on
---

# BitLoot SDK Integration Guide

## ✅ Why SDK-based integration is a good idea

Using an SDK between your frontend and backend means:

- Your **frontend communicates exclusively with your own NestJS API**, never directly with third-party APIs like Kinguin, NOWPayments, or Resend, ensuring **security** by keeping secrets and tokens server-side only.
- You get a **type-safe interface** for all BitLoot operations (orders, payments, users, fulfillment, etc.), generated from the backend OpenAPI schema for zero drift and improved developer experience.
- It enables integration with caching, optimistic updates, and version control of your API layer — allowing offline-ready UX and smoother frontend state management.

Essentially, you’ll have a **BitLoot SDK** imported in the PWA frontend that wraps strong typing and consistent backend route calls instead of accessing raw REST endpoints.

***

## ⚙️ SDK Design for BitLoot

The SDK is a typed client wrapped around your NestJS backend API routes, auto-generated with OpenAPI tools and enhanced manually for additional utilities.

### Example SDK structure

```
sdk/
 ├── index.ts
 ├── api/
 │   ├── auth.ts
 │   ├── orders.ts
 │   ├── payments.ts
 │   ├── products.ts
 │   ├── fulfillment.ts
 │   ├── user.ts
 │   └── r2.ts
 ├── types/
 │   ├── order.ts
 │   ├── product.ts
 │   ├── user.ts
 │   ├── fulfillment.ts
 │   └── payment.ts
 └── utils/http.ts
```

Each file precisely wraps backend endpoints with typed methods using Axios or Fetch with OpenAPI generated types.

### SDK example usage:

```ts
// sdk/api/orders.ts
import { http } from '../utils/http';
import { Order, PaymentStatus } from '../types/order';

export async function createOrder(data: {
  email: string;
  items: { productId: string; qty: number }[];
}): Promise<Order> {
  return http.post('/orders', data);
}

export async function getOrderStatus(id: string): Promise<PaymentStatus> {
  return http.get(`/orders/${id}/status`);
}
```

Frontend usage:

```ts
import { createOrder, getOrderStatus } from '@bitloot/sdk';

const order = await createOrder({ email, items });
const status = await getOrderStatus(order.id);
```

***

## 🔒 Why NOT call 3rd-party SDKs directly from frontend

Examples:

- **Kinguin API** requires secret Bearer tokens.
- **NOWPayments** exposes sensitive crypto wallet addresses.
- **Resend API** handles email/OTP sending with private keys.

These secrets and sensitive operations **must remain server-side only** for security and compliance.

Frontend calls should always be:

```
Frontend (Next.js) → BitLoot SDK → NestJS API → (3rd-party APIs)
```

Your backend manages:

- Authentication, authorization, and rate limiting.
- HMAC signature verification for webhooks.
- IPN and webhook processing.
- Secure secret storage (API keys, tokens).
- Data validation and business logic orchestration.

This keeps frontend lightweight, secure, and focused solely on UI and SDK calls.

***

## 🧩 SDK Integration Flow

| Layer                  | Purpose                                | Calls                                        |
| ---------------------- | ------------------------------------- | -------------------------------------------- |
| **Frontend (Next.js)** | User interface + calls BitLoot SDK     | `sdk.orders.create()`, `sdk.auth.login()`, `sdk.fulfillment.getStatus()` |
| **BitLoot SDK**        | Typed wrapper around NestJS routes     | `/api/orders`, `/api/auth`, `/api/fulfillment`, `/api/payments`           |
| **NestJS Backend**     | Business logic, security, 3rd-party API wrappers | Calls Kinguin, NOWPayments, Resend APIs, Cloudflare R2 storage             |
| **3rd-Party APIs**     | External services                      | Process payments, orders, email OTP, keys storage                         |

***

## 💡 Recommended Extras

1. **Auto-generate SDK types**  
   Use OpenAPI + `nestjs-swagger` to generate client SDK with [openapi-typescript-codegen](https://www.npmjs.com/package/openapi-typescript-codegen). This guarantees type-safe frontend/backend contract with zero divergence.

2. **Unified Error Handling**  
   Wrap all responses in a consistent format:  
   ```ts
   { success: true, data: {...} } | { success: false, error: "Error message" }
   ```

3. **Auth-aware Requests**  
   Automatically inject JWT access tokens and handle refresh logic within the SDK HTTP client.

4. **Offline & Caching Support**  
   Integrate TanStack Query (React Query) to handle caching, background retries, and loading states seamlessly in the PWA.

***

## 🚀 Summary

| Advantage                    | Explanation                                      |
| ---------------------------- | ------------------------------------------------- |
| ✅ Security                  | Secrets remain only on backend (Kinguin, NOWPayments, Resend) |
| ✅ Developer Experience      | Typed, versioned client SDK generated from backend OpenAPI |
| ✅ Maintainability           | One SDK update keeps frontend and backend in sync |
| ✅ Offline-ready             | Works well with TanStack Query & Zustand for caching and offline support |
| ✅ Scalability                | SDK reusable across frontend, admin panel, mobile apps |

***

### TL;DR

Using your own SDK between **Next.js frontend** and **NestJS backend** is the recommended approach.  
Do **not** call Kinguin, NOWPayments, or Resend APIs directly from frontend.  
Generate SDK from your backend OpenAPI schema for type safety and to prevent API drift.

***