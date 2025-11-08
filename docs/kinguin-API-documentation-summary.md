# Kinguin API — Developer Documentation (Summary)

> This is a consolidated, end-to-end guide for integrating with **Kinguin’s Sales Manager API (v1)** and the surrounding platform features (merchant onboarding, stock models, offers, wholesale, webhooks, SPA, Sales Booster, checkout SDK, and operational policies). It’s structured so you can onboard from zero to production.

---

## 0) At-a-Glance

- **Base URLs**
  - **Production API:** `https://www.kinguin.net/api/v1`
  - **Sandbox API:** `https://sandbox.kinguin.net/api/v1`

- **Auth:** Bearer tokens. Merchant client + secret + 2FA required to obtain a token.
- **Formats:** JSON for request/response bodies. Prices expressed in **cents**. Currency defaults to **EUR** unless otherwise specified.
- **Rate limits:** Up to **2000 requests/min** per merchant client (exceed -> **429 Too Many Requests**).
- **Stock models:** _Upfront keys_, _Declared stock_, and _Declared text stock_ (code-in-text). Reservation-driven workflows for declared models.
- **Key business features:** Offers, Wholesale tiers, Smart Pricing Assistant (SPA), Sales Booster (paid placement), Webhooks (order + ops), Complaints/returns.
- **Checkout SDK:** Embed Kinguin checkout on your storefront (popup/iframe).

---

## 1) Getting Access

### 1.1 Create Merchant Accounts

- **Production merchant account**
  1. Create customer account on Kinguin, then request merchant upgrade (“Sell on Kinguin” → “Start selling”).
  2. Complete merchant profile & verification steps in the Merchant Panel.

- **Sandbox merchant account**
  1. Create a customer account on **sandbox.kinguin.net**.
  2. Email the sandbox team (typically **[api@kinguin.net](mailto:api@kinguin.net)**) to enable sandbox merchant features (include your sandbox email).

### 1.2 Create an API Client (Production/Sandbox)

1. In the Merchant Panel, go to **Developer**.
2. Click **Connect** → set a **Client name**.
3. **Enable 2FA** (Google Authenticator or similar). Scan QR, enter the 6-digit code, and save recovery codes.
4. Confirm to view your **client ID** and one-time **secret**. **Copy the secret now** (it won’t be shown again; you can only reset).

You can:

- **Edit client** (rename)
- **Reset secret** (requires 2FA code)
- **Delete client** (requires 2FA code)

### 1.3 Authentication & Tokens

Use your **client ID + secret** to exchange for a **Bearer token**.

- **Header:** `Authorization: Bearer <token>`
- **Token expiration:** Returned with token (track and refresh before expiry).
- **Errors:** `401 Unauthorized` for invalid/expired tokens.

> **Note:** Keep client secrets safe. Consider storing rotated tokens in your backend and never expose secrets in the browser.

---

## 2) General Concepts & Data

### 2.1 Kinguin Dictionary (Key Terms)

- **Merchant** – You, the seller on Kinguin.
- **Buyer** – Customer purchasing on Kinguin.
- **Product** – The catalog entity (e.g., “Game XYZ global key”).
- **Offer** – Your sellable listing for a product (price, stock, status, etc.).
- **Reservation** – A buyer’s temporary lock to purchase an item/stock (declared stock flow).
- **Price** – What a buyer sees.
- **Price IWTR** – _“I Want To Receive”_ (net price you want after commissions). Commission rules translate between Price and IWTR.

### 2.2 Price, Currency, Format

- **Currency:** EUR by default (unless overridden by API param).
- **Integers in cents:** `price.amount = 1099` means €10.99.

### 2.3 Commission & IWTR

- Commission rules define how **price** and **IWTR** convert.
- Use **Calculate Merchant Commission** endpoint to calculate one from the other (see §8.8).

---

## 3) Rate Limits & Errors

- **Limit:** ~**2000 req/min** per client. Exceed → **HTTP 429** with back-off recommended.
- **Common errors**
  - `400 Bad Request` – invalid payload or business rule violation.
  - `401 Unauthorized` – missing/invalid token.
  - `403 Forbidden` – privilege/account not authorized.
  - `404 Not Found` – missing resource.
  - `409 Conflict` – e.g., merchant already created, business conflict.
  - `422 Unprocessable Entity` – semantic errors in request.
  - `5xx` – transient platform errors. Retry with exponential backoff.

---

## 4) Stock Models

You can sell keys via three models:

### 4.1 Upfront Key Stock (classic)

- You **upload real keys** to Kinguin for an offer.
- Pros: Instant delivery. Cons: Must maintain pooled keys.

**Offer Visibility Requirements** (for offer to appear on product page):

- `status = ACTIVE`
- offer not blocked
- available stock (for upfront model)
- not pre-order unless product supports it

#### Upload upfront keys (example)

```bash
curl -X POST "https://www.kinguin.net/api/v1/offers/{offerId}/stock" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "keys": [
          "AAAAA-BBBBB-CCCCC",
          "DDDDD-EEEEE-FFFFF"
        ]
      }'
```

### 4.2 Declared Stock

- You **do not** pre-upload keys. You **declare a stock count** (e.g., 100 units).
- Kinguin handles **reservation** events when buyers purchase. You **deliver** on reservation.
- **Fields**: `declaredStock`
- Requires privilege enablement by Kinguin.

### 4.3 Declared Text Stock (code-in-text)

- Variation of declared stock for **textual code strings**.
- **Fields**: `declaredTextStock` (must be ≤ `declaredStock`).
- On each text order, deliver the specific code referencing `reservationId`.

---

## 5) Reservation Lifecycle (for Declared Models)

**Events you’ll receive** (also via webhooks, see §10):

1. **reserve / buying** – Buyer starts purchase; reservation created.
2. **give / bought / delivered** – You deliver the code/content; Kinguin confirms.
3. **cancel** – Buyer cancels within window; release reservation.
4. **outofstock** – You report stock unavailability (should be rare).
5. **reversed / refunded** – Payment reversed/refunded.
6. **processingpreorder / orderprocessing** – Pre-order flow / processing updates.
7. **offerblocked** – Offer blocked (policy reasons).
8. **chatmessage** – Buyer sent a message in order chat.

**Respond to webhooks with `HTTP 200`** to acknowledge (more in §10).

---

## 6) Complaints & Returns

- **Unclaimed key returns**: If buyer hasn’t claimed, can request return to pool.
- **Complaints**: Buyer opens a dispute, you resolve via Resolution Center.
- Refund/return events propagate with the related webhooks.

---

## 7) Wholesale

Wholesale lets you sell **in bulk** at **tiered discounts**.

- **Tier structure**: `tiers = [{pieces, discountPercent}, ...]`
- **Config**: Visibility (`wholesaleVisibility`), `maxWholesaleStockDisplay`.
- **Disable**: set `wholesale.enabled = false`.

**Retrieval examples**

- Get wholesale offers for product
- Get best wholesale offer
- Get wholesale offers (paged list)
- Get wholesale configuration / Edit configuration
- Get default wholesale tier for product

(Endpoints in §11.)

---

## 8) Offers

### 8.1 Create Offer

```bash
curl -X POST "https://www.kinguin.net/api/v1/offers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "123456",
    "price": { "amount": 999, "currency": "EUR" },
    "status": "ACTIVE",
    "declaredStock": 0,
    "declaredTextStock": 0,
    "wholesale": {
      "name": "Wholesale A",
      "enabled": true,
      "tiers": [
        { "pieces": 10, "discountPercent": 5 },
        { "pieces": 50, "discountPercent": 10 }
      ]
    },
    "maxDeliveryDate": "2025-12-31",
    "minQuantity": 1,
    "deliveryTime": "instant",
    "deliveryMethods": ["DIGITAL"]
  }'
```

### 8.2 Get Offers (paged list)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://www.kinguin.net/api/v1/offers?filter[status]=ACTIVE&page[number]=0&page[size]=50"
```

### 8.3 Get Offer by ID

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://www.kinguin.net/api/v1/offers/{offerId}"
```

### 8.4 Update Offer (PUT)

```bash
curl -X PUT "https://www.kinguin.net/api/v1/offers/{offerId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACTIVE",
    "price": { "amount": 1299, "currency": "EUR" },
    "declaredStock": 25,
    "declaredTextStock": 10,
    "wholesale": { "enabled": true, "tiers": [{ "pieces": 20, "discountPercent": 8 }] }
  }'
```

### 8.5 Patch Offer (partial update)

```bash
curl -X PATCH "https://www.kinguin.net/api/v1/offers/{offerId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "INACTIVE" }'
```

### 8.6 Bulk Actions

**Bulk Activate**

```bash
curl -X PATCH "https://www.kinguin.net/api/v1/offers/status/bulkActivate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '["offerId1","offerId2","offerId3"]'
```

**Bulk Deactivate**

```bash
curl -X PATCH "https://www.kinguin.net/api/v1/offers/status/bulkDeactivate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '["offerId1","offerId2"]'
```

**Bulk Update Wholesale Options**

```bash
curl -X PATCH "https://www.kinguin.net/api/v1/offers/wholesale/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wholesale": { "enabled": true, "tiers": [{ "pieces": 10, "discountPercent": 5 }] },
    "offersIds": ["offerId1","offerId2"]
  }'
```

### 8.7 Get Position for Offer (for Sales Booster bidding insight)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://www.kinguin.net/api/v1/offers/{offerId}/position?bid=50&price=1099"
```

Returns buy-button probability and tier boundaries.

### 8.8 Calculate Merchant Commission

Given either **IWTR** or **Price**, get the other + rule info.

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://www.kinguin.net/api/v1/offers/priceElements?brokerId=...&kpcProductId=...&priceIWTR=999"
```

or

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://www.kinguin.net/api/v1/offers/priceElements?brokerId=...&kpcProductId=...&price=1299"
```

### 8.9 Get Block Reasons

Reasons & counts of offer blocks (compliance, manual verification, etc.).

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://www.kinguin.net/api/v1/offers/blockReasons"
```

> **Offer Block Types** (examples): Required manual verification on game/subscription categories, product-specific compliance checks, suspicious activity flags. Listen for **offerblocked** webhooks and inspect the `block` field on offer details.

---

## 9) In-Game Goods, Accounts, Pre-Purchase

### 9.1 In-Game Goods / Accounts

- Special categories requiring **additional permissions**.
- Orders create an **Order Chat**; seller uploads **Proof of Delivery**.

**Create In-Game Offer (example)**

```bash
curl -X POST "https://www.kinguin.net/api/v1/offers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "987654",
    "price": { "amount": 9999, "currency": "EUR" },
    "declaredStock": 100,
    "status": "ACTIVE",
    "deliveryMethods": ["IN_GAME_TRADE"],
    "minQuantity": 1,
    "description": "Trade in NA server within 24h.",
    "deliveryTime": "24h"
  }'
```

**Upload Proof of Delivery**

```bash
curl -X POST "https://www.kinguin.net/api/v1/orders/{orderId}/proof" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/screenshot.png"
```

### 9.2 Pre-Purchase Offers

- Buyer purchases, but delivery/claim is deferred.
- **Note:** Pre-purchase offers can’t be converted to standard; you must inactivate and create a new standard one.

---

## 10) Webhooks

### 10.1 Subscribe to Events

You can set endpoints for:

- `reserve`, `give`, `cancel`, `delivered`, `outofstock`, `reversed`, `refunded`,
  `processingpreorder`, `offerblocked`, `chatmessage`, `orderprocessing`, etc.

**Create subscription (example)**

```bash
curl -X POST "https://www.kinguin.net/api/v1/webhooks/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["reserve","give","cancel","delivered","chatmessage","offerblocked"],
    "url": "https://yourdomain.com/kinguin/webhooks",
    "headers": { "X-Webhook-Token": "your-shared-secret" }
  }'
```

- **Delivery & Retries:** Kinguin retries failed webhooks up to **2** times with short intervals.
- **Security:** Include your shared token or HMAC header and verify on your side. Always **return 200** promptly.

### 10.2 Webhook Payloads (example — reservation)

```json
{
  "type": "reserve",
  "reservationId": "abc123",
  "status": "BUYING",
  "price": { "amount": 1299, "currency": "EUR" },
  "commissionRule": { "fixedAmount": 0, "percentValue": 0.1 },
  "offer": { "...": "offer fields snapshot" },
  "timestamp": "2025-05-01T12:34:56Z"
}
```

### 10.3 Webhook History & Monitoring

Use Merchant Panel to review webhook logs; replays may be available through panel actions.

---

## 11) Endpoint Reference (Selected)

> All requests require `Authorization: Bearer <token>` unless noted. Treat all responses as JSON.

### 11.1 Alerts

- **GET** `/api/v1/alerts` — fetch alerts (operational/platform notices).

### 11.2 Reservations

- **GET** `/api/v1/reservations` — list reservations (filters, paging).
- **GET** `/api/v1/reservations/archive` — list archived reservations.
- **GET** `/api/v1/reservations/stats` — aggregated stats.
- **GET** `/api/v1/reservations/csv` — export CSV.

### 11.3 Wholesale

- **GET** `/api/v1/wholesale/products/{productId}/offers` — wholesale offers for a product (query: `outOfStock`).
- **GET** `/api/v1/wholesale/products/{productId}/best` — best wholesale offer for a product.
- **GET** `/api/v1/wholesale/offers` — list wholesale offers (filters, page).
- **GET** `/api/v1/wholesale/configuration` — get wholesale config (visibility, etc.).
- **POST** `/api/v1/wholesale/configuration` — edit wholesale configuration.
- **GET** `/api/v1/products/{productId}/defaultWholesaleTier` — default wholesale tier.

### 11.4 Cards (Key Units)

- **POST** `/api/v1/returns/ktcId/{cardId}` — return item to stock by **cardId** (ktcId).

### 11.5 Merchants

- **GET** `/api/v1/merchants` — get current merchant.
- **POST** `/api/v1/merchants` — create merchant (admin/ops workflows).
- **GET** `/api/v1/merchants/status` — merchant + config status.
- **GET** `/api/v1/merchants/findByName?name=...` — exact match.
- **GET** `/api/v1/merchants/findByNameLike?name=...` — partial match.

### 11.6 Products

- **GET** `/api/v1/product/minimal/{productId}` — minimal Microsoft product price (special case endpoint).

### 11.7 Offers

- **POST** `/api/v1/offers` — create offer.
- **GET** `/api/v1/offers` — list offers (filters, paging).
- **GET** `/api/v1/offers/{offerId}` — get offer.
- **PUT** `/api/v1/offers/{offerId}` — update offer.
- **PATCH** `/api/v1/offers/{offerId}` — partial update.
- **PATCH** `/api/v1/offers/status/bulkActivate` — bulk activate.
- **PATCH** `/api/v1/offers/status/bulkDeactivate` — bulk deactivate.
- **PATCH** `/api/v1/offers/wholesale/bulk` — bulk update wholesale options.
- **GET** `/api/v1/offers/{offerId}/position` — get position (bid simulation).
- **GET** `/api/v1/offers/priceElements` — commission calculator (via `price` or `priceIWTR`).
- **GET** `/api/v1/offers/blockReasons` — block reasons.

---

## 12) Smart Pricing Assistant (SPA)

SPA auto-adjusts your prices to reach a targeted position (e.g., best price), considering **cost** and **minimum profit** constraints.

- **Activation**: enable per-offer (API). Often limited daily (e.g., up to 5 offers/day — platform policy may change).

- **Behavior**:
  - **ACTIVE / PAUSED / INACTIVE** states.
  - Reacts to stock changes & marketplace competition.
  - Avoids manual churn if SPA is in control (deactivate SPA to take manual control).

- **Pricing**: SPA is a **paid** feature with **weekly** billing tiers based on active offers count (e.g., 0–100, 101–250, etc.). Re-activations within the billing week may count separately depending on policy.

**Activate SPA (example)**

```bash
curl -X POST "https://www.kinguin.net/api/v1/spa/offers/{offerId}/activate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "cost": 799, "minProfit": 100 }'
```

**Deactivate SPA**

```bash
curl -X POST "https://www.kinguin.net/api/v1/spa/offers/{offerId}/deactivate" \
  -H "Authorization: Bearer $TOKEN"
```

> Use **Get Position** endpoint (§8.7) to preview price/bid dynamics.

---

## 13) Sales Booster (Paid Visibility)

**Sales Booster** increases buy-button visibility via **bids**. You can:

- **Create/renew boosts** with a `maxBid`.
- **Pause/Resume** boosts during campaign.
- **Fees**: Based on placement rules and renewal options; charges apply per visibility period.

**Create Boost (example)**

```bash
curl -X POST "https://www.kinguin.net/api/v1/salesBooster/offers/{offerId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "maxBid": 50, "renewal": "AUTO" }'
```

---

## 14) Checkout SDK (Embedded Checkout)

Add Kinguin checkout to your site (popup or iframe).

### 14.1 Include Script

```html
<!-- Head -->
<script src="https://www.kinguin.net/checkout/sdk.js" defer></script>
```

> **CSP**: If you enforce CSP headers, allow the SDK domain.

### 14.2 HTML Structure & JS Init

```html
<div id="products">
  <div class="product" data-product-id="123456">Awesome Game</div>
  <div class="product" data-product-id="987654">Another Game</div>
</div>

<script>
  window.addEventListener('load', function () {
    window.kinguinCheckoutSDK.init({
      wrapperSelector: '#products',
      productSelector: '.product',
      paymentMethodId: 'crypto-or-card', // optional in SDK context
      iframe: {
        id: 'kinguin-checkout',
        width: '100%',
        height: '720px',
      },
      popup: { enabled: true }, // alternatively open in a new window instead of iframe
      translations: {
        payButton: 'Pay now',
        continueShopping: 'Continue shopping',
      },
      discountCode: 'SPRINGSALE',
      language: 'en',
      currency: 'EUR',
    });
  });
</script>
```

**Options Overview**

- **wrapperSelector / productSelector**: Click handler zone and product item elements (must have `data-product-id`).
- **paymentMethodId**: Preselect a payment method (if exposed).
- **iframe**: `{ id, width, height }` for inline experience.
- **popup**: `{ enabled: true }` to open in new window.
- **discountCode**, **language**, **currency**: Defaults/overrides.

---

## 15) Security, Compliance & Ops

- **2FA required** for client management actions (secret resets, deletes).
- **Key exposure**: Never send real keys to browsers; post keys only to Kinguin or deliver via server-side flows.
- **Offer blocks**: Maintain **Get Block Reasons** and webhook handling to react promptly (e.g., manual verification).
- **Logging**: Log request IDs and webhook IDs for traceability.
- **Backoff**: On 429/5xx, implement exponential backoff retries.
- **Idempotency**: For sensitive operations (deliver/give, cancellations) ensure your server is idempotent; if endpoint supports idempotency keys, include one (header) — else deduplicate by reservation/order ID.

---

## 16) Data Model Cheatsheet (Selected)

### 16.1 Price

```json
{
  "amount": 1099,
  "currency": "EUR"
}
```

### 16.2 Offer (representative)

```json
{
  "id": "offerId",
  "productId": "123456",
  "sellerId": 999,
  "name": "Game XYZ Global Key",
  "status": "ACTIVE",
  "priceIWTR": { "amount": 899, "currency": "EUR" },
  "price": { "amount": 1099, "currency": "EUR" },
  "commissionRule": { "id": "rule-1", "fixedAmount": 0, "percentValue": 0.1 },
  "declaredStock": 0,
  "declaredTextStock": 0,
  "buyableStock": 42,
  "maxDeliveryDate": "2025-12-31",
  "wholesale": {
    "name": "Wholesale A",
    "enabled": true,
    "tiers": [{ "pieces": 10, "discountPercent": 5 }]
  },
  "block": null
}
```

### 16.3 Webhook (reserve — minimal)

```json
{
  "type": "reserve",
  "reservationId": "res-123",
  "status": "BUYING",
  "offerId": "offerId",
  "price": { "amount": 1299, "currency": "EUR" },
  "timestamp": "2025-05-01T12:34:56Z"
}
```

---

## 17) End-to-End Integration Guide

1. **Get sandbox merchant + client** → obtain **Bearer token**.
2. **Pick stock model** (Upfront vs Declared vs Declared Text).
3. **Create offers** for target products.
   - Upfront: upload keys.
   - Declared: set `declaredStock` and implement reservation flow.

4. **Set wholesale tiers** if offering bulk.
5. **(Optional) Enable SPA** on important offers; set cost + min profit.
6. **(Optional) Start Sales Booster** for visibility; tune **maxBid**.
7. **Subscribe to webhooks**:
   - `reserve`, `give`, `cancel`, `delivered`, `reversed`, `offerblocked`, `chatmessage`…

8. **Implement reservation handlers**:
   - `reserve` → allocate/deliver; `give` → confirm delivery; `cancel` → release.

9. **Monitor**:
   - Rate limits, errors, block reasons, webhook deliveries.

10. **Move to production**:
    - Upgrade to production merchant, create production client, swap base URL, rotate tokens.

---

## 18) Troubleshooting

- **401 Unauthorized** – Token expired/invalid → refresh token; ensure header spelled correctly.
- **403 Forbidden** – Feature requires privilege (e.g., declared stock) → contact account manager.
- **404 Not Found** – Wrong IDs or environment mismatch (prod vs sandbox).
- **409 Conflict** – Duplicated creation (merchant, client, etc.).
- **429 Too Many Requests** – Back off and retry; optimize batching & caching.
- **Offer not visible** – Check `status=ACTIVE`, stock present (or declared logic correct), not blocked, not pre-order unless supported.

---

## 19) Changelog Pointers (Implementation Notes)

- **Webhooks**: Two retry attempts by default (short intervals).
- **Commission calc**: Provide either `price` **or** `priceIWTR` (not both).
- **Declared Text Stock**: Must not exceed `declaredStock`.
- **SPA**: Weekly billing; re-activation rules may incur extra fees.
- **Sales Booster**: Max bid + renewal logic; fees apply.

---

## 20) Example Workflows

### 20.1 Upfront Keys (simple)

1. Create offer (`status=ACTIVE`).
2. Upload keys to stock.
3. Done. Kinguin delivers keys automatically on purchase.

### 20.2 Declared Text Stock (code strings)

1. Create offer with `declaredStock`, `declaredTextStock`.
2. Subscribe to webhooks; on **reserve**: pick a text code; on **give** confirm.
3. On **delivered**: mark success. On **cancel**/**reversed**: put code back to pool.

### 20.3 Wholesale Campaign

1. Configure `wholesale.enabled=true` + tiers.
2. Share product page; buyers selecting bigger quantities see tier discounts.
3. Use “Get wholesale offers” endpoints to monitor competition.

---

## 21) Support

- **Sandbox access & issues**: `api@kinguin.net`
- **Merchant operations & permissions**: Your Kinguin account manager.
- **Outages / Status**: Check alerts & communications in Merchant Panel.

---

### Appendix A — Filters & Pagination Hints

- Most list endpoints accept:
  - `filter[field]=value` (repeatable)
  - `page[number]=0` `page[size]=50`

- Responses often include:
  - `content`: array of items
  - `metadata`: `{ page, size, totalElements, totalPages }`
  - In wholesale/position endpoints: extra summaries/probabilities

### Appendix B — Common Headers

```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
User-Agent: YourAppName/1.0
```

---
