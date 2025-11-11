# Level 3 — Implementation Summary

Status: Completed (core features), pending E2E tests and minor docs tidy-up
Date: November 10, 2025

---

## Overview

Level 3 upgrades BitLoot from stub/demo delivery to a real Kinguin-backed fulfillment pipeline with secure webhook handling, asynchronous processing (BullMQ), and encrypted key storage in Cloudflare R2. Admin APIs and UI provide visibility over reservations and webhooks.

Key highlights:
- Reservation-first flow: payment finished → enqueue `reserve` → webhook-driven finalize (`ready/delivered`).
- HMAC-SHA512 verified webhooks via `X-KINGUIN-SIGNATURE`.
- AES-256-GCM encrypted keys stored in R2, delivered via signed URLs.
- Idempotent webhook logging with audit and replay support.

---

## Architecture Flow

1) Payment finished (NOWPayments)
- PaymentsService → enqueue `reserve` job
- Order status set to `paid`

2) Reservation
- FulfillmentProcessor handles `reserve` → FulfillmentService.startReservation()
- Kinguin order created → reservation ID saved on order

3) Webhook (Kinguin → BitLoot)
- KinguinController validates HMAC signature and DTO, logs webhook
- Enqueues `kinguin.webhook` job

4) Finalize Delivery
- FulfillmentProcessor handles `kinguin.webhook`
- On `ready/delivered` → FulfillmentService.finalizeDelivery(reservationId)
- Encrypt key → upload to R2 → signed URL → update items → email customer
- Mark order `fulfilled`, mark webhook log `processed=true`

---

## Implemented Changes by Area

### Fulfillment (apps/api)
- FulfillmentService
  - `startReservation(orderId)`
  - `finalizeDelivery(reservationId)`
  - Creates `Key` records (storageRef), encrypts/upload to R2, generates signed URLs, emails customer
  - Uses `OrdersService.setReservationId` to persist reservation ID
- FulfillmentModule
  - Registers `Order`, `OrderItem`, `Key` repositories
  - Registers queue with `QUEUE_NAMES.FULFILLMENT`
  - Provides `OrdersService` for helper reuse

### Orders (apps/api)
- OrdersService
  - `setReservationId(orderId, reservationId)`
  - `findByReservation(reservationId)`
  - Existing state transition helpers (`markPaid`, `markFulfilled`, etc.)

### Kinguin Integration (apps/api)
- KinguinController
  - Webhook: DTO validation (`WebhookPayloadDto`) + `ValidationPipe`
  - HMAC verification via `KinguinService.validateWebhook`
  - Logs webhook to `webhook_logs` (idempotency) and enqueues `kinguin.webhook` job
  - Status endpoint: `GET /kinguin/status/:reservationId`
- KinguinService
  - `reserve(offerId, qty)`, `give(reservationId)`, `getDelivered(reservationId)`
  - `validateWebhook(payload, signature)` using HMAC-SHA512
- KinguinModule
  - Registers WebhookLog repository and Fulfillment queue

### Storage (apps/api)
- StorageService
  - `saveKeysJson(orderId, codes)` → encrypt + upload to R2 → return storageRef
  - `getSignedUrl(storageRef, expiresIn)` → generate signed URL from storageRef

### BullMQ / Jobs (apps/api)
- Queues config (`jobs/queues.ts`)
  - Defaults: attempts 5, exponential backoff (1s), removeOnComplete true
  - Centralized names: `QUEUE_NAMES.FULFILLMENT`
- FulfillmentProcessor
  - Routes by job name:
    - `reserve` → start reservation
    - `kinguin.webhook` → finalize delivery on `ready/delivered`
    - default → legacy `fulfillOrder` (MVP/testing)
  - Marks webhook log `processed=true` and attaches `orderId` + `result`

### Payments (apps/api)
- PaymentsService
  - On `payment_status === 'finished'` enqueue `reserve` job instead of direct fulfill

### Admin API (apps/api)
- AdminController/AdminService
  - `GET /admin/reservations` → paginated orders with `kinguinReservationId`
  - `GET /admin/webhook-logs`, `GET /admin/webhook-logs/:id` → webhook history and details
  - `POST /admin/webhook-logs/:id/replay` → mark for replay (`pending`)
  - `GET /admin/key-audit/:orderId` → key access trail

### Admin UI (apps/web)
- New: `apps/web/src/app/admin/reservations/page.tsx`
  - Lists reservations with filters (`kinguinReservationId`, `status`) and pagination
- Existing: `apps/web/src/app/admin/webhooks/page.tsx` (webhook history)

### Documentation
- Updated: `docs/developer-workflow/03-Level/LEVEL_3_EXECUTION_PLAN.md`
  - Status set to Implemented, security notes corrected (HMAC header), job defaults, and implementation notes added

---

## Endpoints & Jobs

- Webhooks
  - `POST /kinguin/webhooks` (HMAC-verified)
  - `POST /payments/ipn` (NOWPayments IPN)
- Admin
  - `GET /admin/reservations`
  - `GET /admin/webhook-logs`
  - `GET /admin/webhook-logs/:id`
  - `POST /admin/webhook-logs/:id/replay`
  - `GET /admin/key-audit/:orderId`
- Jobs
  - `reserve` → start reservation
  - `kinguin.webhook` → finalize on `ready/delivered`
  - `fulfillOrder` → legacy/MVP path

---

## Security & Idempotency
- HMAC-SHA512 verification on Kinguin webhooks (`X-KINGUIN-SIGNATURE`)
- Webhook logs stored in `webhook_logs` with unique constraint (externalId, webhookType, processed)
- Always respond 200 OK to webhook senders; duplicates are idempotent

---

## Environment Variables
- `KINGUIN_API_KEY`
- `KINGUIN_BASE_URL`
- `KINGUIN_WEBHOOK_SECRET`
- `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_BASE`, `NOWPAYMENTS_IPN_SECRET`
- `REDIS_URL`
- R2: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`

---

## Manual Verification (Smoke Test)
1) Create order → finish payment (`payments/ipn` with `finished`)
2) Check queue enqueued `reserve`
3) Post Kinguin webhook with valid HMAC signature `{ reservationId, status: 'ready', key }`
4) Verify:
   - Items updated with signed URL
   - Email attempted
   - Order status `fulfilled`
   - WebhookLog marked `processed=true` with `orderId`
5) View Admin → Reservations and Webhook Logs pages

---

## Known Gaps / Next Steps
- E2E tests to automate:
  - Happy path, idempotency (duplicate webhooks), retry on transient failures
- Docs tidy-up: ensure plan note under Phase 3 removes “optimistic give” wording
- Ensure a central `.env.example` (or setup doc) includes all env vars above

---

## Changelog (Key Files)

- API (NestJS)
  - `modules/fulfillment/fulfillment.service.ts` (new methods, R2, email)
  - `modules/fulfillment/fulfillment.module.ts` (repos, queue, providers)
  - `jobs/fulfillment.processor.ts` (job routing, webhook log processed)
  - `modules/payments/payments.service.ts` (enqueue `reserve`)
  - `modules/kinguin/kinguin.controller.ts` (DTO + HMAC + enqueue)
  - `modules/kinguin/kinguin.service.ts` (API + HMAC verify)
  - `modules/kinguin/kinguin.module.ts` (DI wiring)
  - `modules/storage/storage.service.ts` (saveKeysJson, getSignedUrl)
  - `modules/orders/orders.service.ts` (reservation helpers)
  - `jobs/queues.ts` (defaults + names)
  - `database/entities/webhook-log.entity.ts` (idempotency model)
  - `app.module.ts` (imports KinguinModule, queues)
- Web (Next.js)
  - `apps/web/src/app/admin/reservations/page.tsx` (new)
  - `apps/web/src/app/admin/webhooks/page.tsx` (existing)
- Docs
  - `docs/developer-workflow/03-Level/LEVEL_3_EXECUTION_PLAN.md` (updated)
  - `docs/developer-workflow/03-Level/LEVEL_3_COMPLETE.md` (this doc)
