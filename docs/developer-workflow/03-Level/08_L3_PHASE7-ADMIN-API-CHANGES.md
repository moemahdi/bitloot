# Level 3 Phase 7 — Admin API Wiring and Fixes

This document summarizes the integration work completed to make the API consistent and production-ready for Level 3 Phase 7, focusing on the payment→fulfillment handoff, Kinguin webhook verification, encryption key storage, email delivery, and job processing.

## What Was Fixed

- **Payment → Fulfillment Handoff**
  - On NOWPayments IPN `status: finished`:
  - Order is marked `paid`.
  - A fulfillment job is enqueued on `fulfillment-queue` with jobId `fulfill-<orderId>`.

- **Kinguin Webhooks: HMAC-SHA512 Verification**
  - `KinguinService.validateWebhook(payload, signature)` verifies the webhook using HMAC-SHA512 with `KINGUIN_WEBHOOK_SECRET` and timing-safe comparison.
  - `KinguinController` rejects missing or invalid signature headers.

- **Fulfillment: Store Encryption Key + Email Delivery**
  - During fulfillment:
  - Generate 32-byte encryption key per order.
  - Store the key via `DeliveryService.storeEncryptionKey(orderId, key)` (MVP: in-memory vault).
  - Encrypt the product key, upload to R2, generate signed URLs, and update order items.
  - After all items: send one mock completion email using `EmailsService.sendOrderCompleted(email, signedUrl)`.

- **Processor Responsibilities**
  - `FulfillmentProcessor` executes the pipeline, then calls `ordersService.markFulfilled(orderId)` to finalize state, emitting WebSocket events throughout.
  - BullMQ retry strategy (exponential backoff) is used for robustness.

- **WebSocket Security**
  - `FulfillmentGateway` enforces JWT-based auth.
  - Users can only subscribe to orders they own (email match) unless admin.

## Affected Files (Key Edits)

- `modules/kinguin/kinguin.service.ts`
  - Implemented HMAC-SHA512 verification using `KINGUIN_WEBHOOK_SECRET` with timing-safe comparison.

- `modules/fulfillment/fulfillment.service.ts`
  - Injected `DeliveryService` and `EmailsService`.
  - Store the encryption key during fulfillment for later reveal.
  - Send completion email after item URLs are generated.
  - Removed direct order status overwrite to `fulfilled` (processor handles terminal state).

- `jobs/fulfillment.processor.ts`
  - Runs `fulfillOrder(orderId)` and then calls `ordersService.markFulfilled(orderId)`.
  - Emits WebSocket updates and handles retries; minor lint fix for unused variable.

- `modules/fulfillment/fulfillment.module.ts`
  - Registered `DeliveryService` and `EmailsService` providers for DI.

- `modules/fulfillment/websocket.module.ts`
  - Added `DeliveryService` and `EmailsService` to providers for gateway and related flows.

- `app.module.ts`
  - Imported `FulfillmentModule` and `WebSocketModule` so providers resolve across the app and processors.

## End-to-End Flow

- **IPN (NOWPayments)**
  - `POST /payments/ipn` with `x-nowpayments-signature` (HMAC-SHA512; secret: `NOWPAYMENTS_IPN_SECRET`).
  - Order transitions: `created → waiting → confirming → paid` depending on IPN `payment_status`.
  - On `finished`: enqueue fulfillment job.

- **Fulfillment Job**
  - Processor loads order, triggers **encryption → R2 upload → signed URL → item updates**.
  - Stores encryption key (in-memory MVP) so the reveal flow has the key.
  - Sends one completion email with the primary item’s signed URL.
  - Marks order `fulfilled`.

- **Kinguin Webhook**
  - `POST /kinguin/webhooks` with `X-KINGUIN-SIGNATURE`.
  - Verified by `KinguinService.validateWebhook` (HMAC-SHA512; secret: `KINGUIN_WEBHOOK_SECRET`).

- **Reveal**
  - `DeliveryService.revealKey(orderId, itemId, { ipAddress, userAgent })` retrieves encrypted key data, fetches the in-memory decryption key, decrypts, logs audit info, and returns the plaintext key.

## Environment Variables

- **Payments**
  - `NOWPAYMENTS_API_KEY`
  - `NOWPAYMENTS_BASE`
  - `NOWPAYMENTS_IPN_SECRET`

- **Kinguin**
  - `KINGUIN_API_KEY`
  - `KINGUIN_BASE`
  - `KINGUIN_WEBHOOK_SECRET`

- **Queues/Storage**
  - `REDIS_URL`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_ENDPOINT`
  - `R2_BUCKET`

- **App**
  - `FRONTEND_URL`
  - `WEBHOOK_BASE_URL`
  - `JWT_SECRET`
  - `DATABASE_URL`

## How to Test

- **NOWPayments IPN**
  - POST to `/payments/ipn` with valid `x-nowpayments-signature`.
  - Expect order to become `paid` and fulfillment job to be queued.

- **Fulfillment**
  - Observe processor logs: job started → items updated with signed URLs → email log shows mock email.
  - Expect order to become `fulfilled`.

- **Kinguin Webhook**
  - POST to `/kinguin/webhooks` with valid `X-KINGUIN-SIGNATURE`.
  - Invalid signature → 401; valid → `{ ok: true }`.

- **Reveal Key**
  - Call `DeliveryService.revealKey()`; expect successful decryption and audit log output.

## Notes / Future Hardening

- Add idempotency + event routing for Kinguin webhooks (mirror NOWPayments approach) with `webhook_logs` table integration.
- Move encryption key storage from in-memory to a secure KeyVault for durability and security.
