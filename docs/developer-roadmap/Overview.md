# Task: BitLoot — the fastest way to start (kid-simple, step-by-step)

## Analysis

Think of BitLoot like building a tiny theme park ride. Don’t build the whole park (auth! payments! admin!) one area at a time. Instead, build **one thin ride** that goes **all the way** from “buy” → “pay” → “get key”, then make it nicer.

## Plan (what to do first, next, and when to move on)

**Rule of thumb:** finish each “Level” before starting the next. Move on only when the “Done” box is ✅.

### Level 0 — Set up your workshop

- Monorepo ready (api, web, sdk), strict TypeScript, lint/tests/CI, Docker up.
- Home page says “It works”, API `/healthz` says “ok”.
- ✅ Done when: you can `npm run dev:all` and both web & api run clean.

### Level 1 — Walking skeleton (fake money, fake key)

- Web: simple product page → “Checkout” drawer (enter email → Pay button).
- API: `POST /orders` makes an order; `POST /payments/create` returns a fake pay URL; `POST /payments/ipn` pretends payment succeeded.
- Delivery: upload a **test file** to R2; email a **signed link** (Resend). No plaintext keys.
- ✅ Done when: you can click through and receive an email with a signed link that opens the file.

### Level 2 — Real payments (sandbox only)

- Replace fake with **NOWPayments sandbox**:
  - Server creates real sandbox payment.
  - IPN endpoint verifies HMAC, updates order state:
    `waiting → confirming → finished/underpaid/failed`.

- Web shows live status (loading/error/success/underpaid).
- ✅ Done when: a sandbox payment marks the order **finished** via IPN, and UI updates automatically.

### Level 3 — Real fulfillment (stubbed first)

- Queue a “fulfill order item” job on **finished**.
- Call Kinguin **sandbox**, but if it’s not ready, return a fixed **stub key** (so the pipeline still works).
- Save key **only** in R2 (signed URL). Email the link.
- ✅ Done when: after a sandbox payment, an order gets a (stub) key via R2 link automatically.

### Level 4 — Real Kinguin (no stubs)

- Subscribe to Kinguin webhooks/events (`reserve/give/delivered/cancel`).
- Make handlers **idempotent** + HMAC/secret verify. Retries → queue.
- Store the real key securely; never email plaintext; only signed link.
- Web: “Reveal key” opens the signed URL page.
- ✅ Done when: real Kinguin sandbox keys flow end-to-end, with retries and logs, and keys are only accessible via short-lived links.

### Level 5 — Safety & policy

- Underpayment path marks **underpaid (non-refundable)**; show clear copy in UI/email.
- OTP login (6-digit, Redis TTL + rate limits), JWT guards.
- WAF/CAPTCHA, structured logs/alerts for IPN/webhooks.
- ✅ Done when: you can prove underpaid gets blocked, OTP rounds work, and alerts fire on bad webhooks.

### Level 6 — Admin & ops

- Admin pages: product sync (Kinguin → DB), pricing controls, orders/users.
- Webhook/IPN log viewer; balance/health dashboard.
- ✅ Done when: you can re-sync products, change a price, view an order, and see webhook/IPN histories.

### Level 7 — Polish & ship

- UX states (loading/error/empty) everywhere; account → order history.
- FAQ/Reviews/Contact; chat widget (hidden on `/checkout` & `/admin/*`).
- Perf: indexes, caching, list virtualization; a11y/SEO basics.
- ✅ Done when: lighthouse doesn’t scream, pages feel snappy, and the happy path is buttery.

---

## Technical Approach (keep it simple)

- **Vertical slices**: each Level runs front → SDK → API → queues → vendors → email/R2.
- **Feature flags**: `checkout.enabled`, `nowpayments.enabled`, `kinguin.enabled`, `r2.delivery.enabled`, `otp.enabled`. Flip on per Level.
- **SDK-first**: FE talks only to the BitLoot SDK (generated from Swagger).
- **Idempotent webhooks**: save raw body, verify HMAC, upsert by external id, enqueue, `200 OK` fast.
- **No plaintext keys**: only R2 signed URLs.

## Implementation (tiny checklist you can copy)

1. **Repo**: create `apps/api`, `apps/web`, `packages/sdk`; add strict TS, ESLint, Jest/Vitest, Docker.
2. **API skeleton**: Nest modules `auth, products, orders, payments, fulfillment, storage, emails, webhooks`.
3. **SDK**: add OpenAPI generation; wire the web app to use SDK only.
4. **Level 1**: basic order + fake payment + fake IPN + R2 + Resend.
5. **Level 2**: NOWPayments sandbox + HMAC verify + order state machine + UI states.
6. **Level 3–4**: queue jobs + Kinguin (stub → real) + R2 signed links + email.
7. **Level 5**: underpayment rule, OTP, WAF/CAPTCHA, logs/alerts.
8. **Level 6–7**: admin, polish, performance, a11y, SEO.

## Verification (how you know it’s safe to move on)

- **Green checks**: type/lint/tests/build pass on every PR.
- **DoD per Level** (above) is **true** in sandbox.
- **Observability**: you can see IPN/webhook successes/failures; alerts reach you.
- **Security**: HMAC verified, OTP rate-limited, no secrets on FE, no plaintext keys.

## Commands

```bash
# Dev loop
npm run format && npm run lint --max-warnings 0 && npm run type-check && npm run test && npm run build
npm run dev:all          # run web + api

# After API changes
npm run sdk:dev          # regenerate SDK used by the frontend

# DB
npm run typeorm migration:generate -n init
npm run typeorm migration:run
```

**TL;DR:** Start with a tiny **end-to-end ride** (fake → real), one Level at a time. Don’t build big horizontal chunks. Ship a slice, flip a flag, repeat.

Perfect — now we’re going to turn your **8 levels** into a **practical roadmap** that tells you _exactly what to build, in what order, and which files/folders to touch_ for BitLoot.

We’ll go from “open VS Code” → “what to edit” → “when to move on.”

---

# 🚀 BitLoot MVP — 8 Levels + File Guide

## 🧩 Level 0 – Workshop (Setup)

**Goal:** Make sure everything runs clean and type-safe before coding features.

### 🔧 What to do

- Setup your monorepo:

  ```
  /apps/api         → NestJS backend
  /apps/web         → Next.js frontend
  /packages/sdk     → auto-generated API SDK
  ```

- Add config & tooling:
  - `.env`, `.env.example`
  - `docker-compose.yml` → Postgres + Redis
  - `eslint`, `prettier`, `tsconfig.json`
  - `jest.config.js` (or `vitest.config.ts`)
  - `ci.yml` in `.github/workflows/` → lint + test + build

- Run:

  ```bash
  npm run dev:all
  ```

  You should see both **API** and **Web** start clean.

### 🗂 Files to work on

| File                                         | Purpose                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `apps/api/src/main.ts`                       | Boot NestJS app. Add global pipes, filters, versioning. |
| `apps/api/src/app.module.ts`                 | Import core modules (Config, TypeORM, Redis).           |
| `apps/web/next.config.mjs`                   | PWA + env setup.                                        |
| `packages/sdk/openapi-generator-config.json` | Auto SDK config (from Swagger).                         |

✅ **Done when:** `localhost:3000` (web) and `localhost:4000` (api) both respond “ok”.

---

## 🧩 Level 1 – Walking Skeleton (Fake checkout)

**Goal:** End-to-end fake flow: order → fake payment → fake delivery.

### 🔧 What to do

**Backend (`/apps/api`):**

1. `modules/orders/`
   - `order.entity.ts` → id, email, status, total.
   - `orders.controller.ts` → `POST /orders`
   - `orders.service.ts` → saves order.

2. `modules/payments/`
   - `payments.controller.ts` → `/create`, `/ipn` (mocked).

3. `modules/storage/`
   - R2 upload mock file and return signed link.

4. `modules/emails/`
   - Resend integration (send email with link).

**Frontend (`/apps/web`):**

1. `features/checkout/`
   - Form (email input + “Pay” button).
   - Calls SDK → `/orders` → `/payments/create`.

2. Show “Payment Successful” → fetch order → show download link.

### 🗂 Files to work on

| File                                              | Purpose                        |
| ------------------------------------------------- | ------------------------------ |
| `apps/api/src/modules/orders/*.ts`                | Entity + controller + service. |
| `apps/api/src/modules/payments/*.ts`              | Fake payment + IPN endpoints.  |
| `apps/api/src/modules/storage/storage.service.ts` | Upload file to R2.             |
| `apps/api/src/modules/emails/emails.service.ts`   | Send email using Resend.       |
| `apps/web/features/checkout/CheckoutForm.tsx`     | Email + fake pay button.       |
| `apps/web/features/orders/OrderSuccess.tsx`       | Shows signed link.             |

✅ **Done when:** You can create an order, see “paid”, and get an email with a test file link.

---

## 🧩 Level 2 – Real Payments (NOWPayments Sandbox)

**Goal:** Replace fake payments with real crypto sandbox.

### 🔧 What to do

**Backend:**

1. In `payments.service.ts`:
   - Add NOWPayments API call → `createInvoice()`.
   - Save payment record with external ID.

2. In `payments.controller.ts`:
   - Add `POST /ipn` → verify HMAC, update order state.

3. Update `.env`:

   ```
   NOWPAYMENTS_API_KEY=...
   NOWPAYMENTS_IPN_SECRET=...
   ```

4. Add `payments.entity.ts` for status tracking.

**Frontend:**

1. `CheckoutForm.tsx` → redirect to `payment_url` from API.
2. Add order status page that polls `/orders/:id`.

### 🗂 Files to work on

| File                                                   | Purpose                        |
| ------------------------------------------------------ | ------------------------------ |
| `apps/api/src/modules/payments/payments.service.ts`    | NOWPayments integration.       |
| `apps/api/src/modules/payments/payments.controller.ts` | IPN HMAC verify endpoint.      |
| `apps/api/src/modules/orders/orders.service.ts`        | Update order status after IPN. |
| `apps/web/features/checkout/PaymentStatus.tsx`         | Poll status, show result.      |

✅ **Done when:** Real sandbox payment confirms and marks order as “finished.”

---

## 🧩 Level 3 – Fulfillment (Stub)

**Goal:** Deliver fake key automatically (using queues + R2).

### 🔧 What to do

**Backend:**

1. Add BullMQ worker: `/jobs/fulfillment.processor.ts`.
2. On order `finished` → enqueue “fulfill order.”
3. Worker uploads stub key file to R2, stores link, sends email.
4. Add table: `order_items` (orderId, productId, keyUrl).

**Frontend:**

1. Order details page → “Reveal Key” → opens R2 signed URL.

### 🗂 Files to work on

| File                                               | Purpose                         |
| -------------------------------------------------- | ------------------------------- |
| `apps/api/src/jobs/fulfillment.processor.ts`       | Queue worker for key delivery.  |
| `apps/api/src/modules/orders/order-item.entity.ts` | Stores key link.                |
| `apps/api/src/modules/emails/emails.service.ts`    | Add “Order Completed” template. |
| `apps/web/features/orders/OrderDetails.tsx`        | Show “Reveal Key” button.       |

✅ **Done when:** A paid order automatically emails a key link (fake key).

---

## 🧩 Level 4 – Real Kinguin Fulfillment

**Goal:** Replace fake key with real key from Kinguin.

### 🔧 What to do

**Backend:**

1. `modules/kinguin/`:
   - `kinguin.service.ts` → call `reserveOrder`, `getProduct`, etc.
   - `kinguin.controller.ts` → webhook `/kinguin/webhook` (auth header check).

2. On “delivered” → store real key in R2, mark order item complete.
3. Add retry logic, idempotent webhook logging.

### 🗂 Files to work on

| File                                                 | Purpose                            |
| ---------------------------------------------------- | ---------------------------------- |
| `apps/api/src/modules/kinguin/kinguin.service.ts`    | API client to Kinguin.             |
| `apps/api/src/modules/kinguin/kinguin.controller.ts` | Webhook listener.                  |
| `apps/api/src/modules/orders/orders.service.ts`      | Handle key delivery after webhook. |
| `apps/api/src/modules/storage/storage.service.ts`    | Generate signed link for real key. |

✅ **Done when:** Real sandbox Kinguin order → key → email via R2 link.

---

## 🧩 Level 5 – Safety & Policy

**Goal:** Add protections, OTP, and underpayment rules.

### 🔧 What to do

**Backend:**

1. `auth/` module:
   - `sendOtp`, `verifyOtp` endpoints.
   - Store codes in Redis.

2. Enforce ownership guards (order.ownerId).
3. Add underpayment rule: mark as `underpaid`, non-refundable.
4. Add logging + alert jobs for IPN/Webhook errors.

**Frontend:**

1. Add OTP login form (email + code).
2. Show “underpaid = non-refundable” in checkout UI.

### 🗂 Files to work on

| File                                              | Purpose        |
| ------------------------------------------------- | -------------- |
| `apps/api/src/modules/auth/auth.controller.ts`    | OTP endpoints. |
| `apps/api/src/modules/auth/auth.service.ts`       | Redis logic.   |
| `apps/web/features/auth/OTPLogin.tsx`             | OTP UI.        |
| `apps/web/features/checkout/UnderpaymentNote.tsx` | UI notice.     |

✅ **Done when:** OTP works, underpaid orders are flagged, and logs show all webhook/IPN events.

---

## 🧩 Level 6 – Admin & Ops

**Goal:** Manage products, users, orders, and logs.

### 🔧 What to do

**Backend:**

1. `modules/admin/` → guarded by JWT.
   - Endpoints: `/admin/products`, `/admin/orders`, `/admin/users`, `/admin/logs`.

2. Product sync job from Kinguin → DB.
3. Include pagination (limit ≤100).

**Frontend:**

1. `/admin` layout with tabs.
2. Pages: Orders, Products, Logs (use TanStack tables).

### 🗂 Files to work on

| File                                             | Purpose                                 |
| ------------------------------------------------ | --------------------------------------- |
| `apps/api/src/modules/admin/admin.controller.ts` | Admin endpoints.                        |
| `apps/web/features/admin/*`                      | UI dashboards (Orders, Products, Logs). |

✅ **Done when:** You can view/sync products, see orders/logs in UI.

---

## 🧩 Level 7 – Polish & Ship

**Goal:** Make it smooth, fast, and ready to launch.

### 🔧 What to do

1. Add loading/error/empty states for all queries.
2. Improve design (Tailwind + motion + responsive).
3. Add chat widget (Tawk integration).
4. SEO titles/descriptions, manifest, favicon.
5. Security: CAPTCHA, CSP, WAF, DKIM/SPF.
6. Monitor performance & logs.

### 🗂 Files to work on

| File                                               | Purpose                 |
| -------------------------------------------------- | ----------------------- |
| `apps/web/src/design-system/primitives/*`         | Reusable UI components. |
| `apps/web/src/design-system/styles/globals.css`   | Global styles & theme.  |
| `apps/web/src/features/chat/TawkWidget.tsx`       | Chat integration.       |
| `.env.production`                                  | Real API keys, domains. |

✅ **Done when:** Everything feels fast, secure, and smooth — ready for public release.

---

## 💡 Pro tip: Focus order

> **Each Level is one “vertical slice.”**
>
> Don’t start the next until you can _demo the current end-to-end._

That means:

- Don’t build OTP before fake checkout works.
- Don’t touch Kinguin before sandbox payments run.
- Don’t polish UI before real keys deliver.

---

## 🧭 TL;DR Cheat Sheet

| Level | Goal             | Folder Focus                              |
| ----- | ---------------- | ----------------------------------------- |
| 0     | Setup            | `/apps/api`, `/apps/web`, `/packages/sdk` |
| 1     | Fake flow        | `orders`, `payments`, `storage`, `emails` |
| 2     | Real crypto      | `payments`, `orders`, SDK                 |
| 3     | Stub fulfillment | `jobs`, `storage`, `emails`               |
| 4     | Kinguin real     | `kinguin`, `orders`, `storage`            |
| 5     | Safety           | `auth`, `orders`, `emails`, `logs`        |
| 6     | Admin            | `admin`, `orders`, `products`             |
| 7     | Polish           | `web/features/*`, UI, chat, SEO           |

---

Would you like me to make this into a **Notion-style checklist template** (you can literally check off each step)?
