## ✅ Why SDK-based integration is a good idea

Using an SDK between your frontend and backend means:

- Your **frontend communicates with your own API**, not directly with third-party APIs (secure).
- You get a **typed interface** for all BitLoot operations (orders, payments, users, etc.).
- It enables **offline caching, optimistic updates**, and **version control** of your API layer.

Essentially, you’ll have a **BitLoot SDK** that the PWA imports — instead of calling raw REST endpoints.

---

## ⚙️ SDK Design for BitLoot

You can expose your NestJS endpoints (internal API routes) via a **typed client SDK**.

### Example SDK structure

```
sdk/
 ├── index.ts
 ├── api/
 │   ├── auth.ts
 │   ├── orders.ts
 │   ├── payments.ts
 │   ├── products.ts
 │   ├── user.ts
 │   └── r2.ts
 ├── types/
 │   ├── order.ts
 │   ├── product.ts
 │   └── user.ts
 └── utils/http.ts
```

Each file wraps your backend endpoints with type-safe methods (using OpenAPI, Axios, or Fetch).

Example:

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

This lets your frontend do:

```ts
import { createOrder, getOrderStatus } from '@bitloot/sdk';

const order = await createOrder({ email, items });
const status = await getOrderStatus(order.id);
```

---

## 🔒 Why you must NOT directly call 3rd-party SDKs in frontend

For example:

- **Kinguin API** requires Bearer tokens (merchant secrets).
- **NOWPayments** exposes crypto wallet addresses.
- **Resend API** sends emails and OTPs.
  All of these must remain **server-side only**.

➡️ The frontend SDK should only call your NestJS routes:

```
Frontend → BitLoot SDK → NestJS API → (NOWPayments / Kinguin / Resend)
```

Your backend handles:

- Auth & rate limiting
- HMAC verification
- IPN/webhook processing
- Secrets storage

This makes your frontend lightweight and secure.

---

## 🧩 SDK Integration Flow

| Layer                  | Purpose                             | Calls                                          |
| ---------------------- | ----------------------------------- | ---------------------------------------------- |
| **Frontend (Next.js)** | User UI + SDK calls                 | `sdk.orders.create()`, `sdk.auth.login()`      |
| **BitLoot SDK**        | Type-safe wrapper for NestJS routes | `/api/orders`, `/api/auth`, `/api/payments`    |
| **NestJS Backend**     | Business logic & integrations       | Calls **NOWPayments**, **Kinguin**, **Resend** |
| **3rd-Party APIs**     | External services                   | Fulfills payments, products, emails            |

---

## 💡 Recommended extras

1. **Auto-generate SDK types**
   Use OpenAPI + `nestjs-swagger` to auto-generate your client SDK with [openapi-typescript-codegen](https://www.npmjs.com/package/openapi-typescript-codegen).
   → This ensures every backend endpoint has matching frontend types.

2. **Error handling**
   Add unified response wrappers:

   ```ts
   { success: true, data: {...} } or { success: false, error: "Invalid OTP" }
   ```

3. **Auth-aware requests**
   Include access tokens or refresh logic (JWT) automatically in SDK headers.

4. **Offline & caching (optional)**
   Wrap with TanStack Query to handle caching, retry, and loading states in the PWA.

---

## 🚀 Summary

| Advantage                    | Why It Matters                                    |
| ---------------------------- | ------------------------------------------------- |
| ✅ Security                  | Keeps Kinguin/NOWPayments secrets in backend only |
| ✅ DX (Developer Experience) | Typed, versioned client layer                     |
| ✅ Maintainability           | One SDK update = frontend + backend sync          |
| ✅ Offline-ready             | Works seamlessly with TanStack Query & Zustand    |
| ✅ Easier scaling            | SDK can be reused for admin panel or mobile apps  |

---

### TL;DR

✅ Yes — using your own SDK between **frontend (Next.js)** and **backend (NestJS)** is the right approach.
⚠️ Just ensure the SDK talks **only to your NestJS API**, never directly to Kinguin, NOWPayments, or Resend.
💡 Generate the SDK from your NestJS OpenAPI schema for type safety and zero drift.

---
