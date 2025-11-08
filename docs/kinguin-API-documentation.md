# Kinguin API Documentation

### Get Access to Our Digital Products Catalogue

Gain access to **over 50,000 digital products**, including game keys, software, gift cards, and more.  
Our API allows you to **import our entire catalog for free**, integrate it into your **e-commerce platform or marketplace**, and start selling immediately.

---

## Why Choose Our API?

### 🆓 Free Access

Import our entire catalog with **detailed product descriptions, images, and prices** — at no cost.

### 💸 No Stock Investment

You only pay when you sell a product, eliminating **inventory risks**.

### 💰 Full Pricing Control

Set your own **profit margins** and determine the **final price** for your customers.

### 🌍 Global Reach

Access **global and regional products** from around the world without additional infrastructure.

### ⚙️ Automated Fulfillment

Orders placed on your store trigger **automatic purchases and deliveries** via our API.

### 💳 Flexible Payment Methods

Fund your balance via **bank transfer, PayPal MassPay, cryptocurrency**, or **direct checkout**.

### 🔒 Reliable & Secure

Real-time stock updates, **24/7 support**, and a powerful API ensure a smooth experience.

### 🔗 Flexibility

Use our API to connect with **other marketplaces** or your **own online store**.

---

## Create Your FREE Account Today

Start selling with us and access everything you need to grow your digital business.

---

## 2-in-1 Solution: Retail and Wholesale

With our API, you can acquire products in **both retail and wholesale quantities**.  
Stay flexible by allowing your customers to choose products they want — or secure larger quantities at the **best possible prices** when opportunities arise.

You can find the **wholesale fees structure below** or [click here](#).

---

## Automate Your Wholesale Distribution

Whether you're a **developer, publisher, or wholesale business**, start distributing games on the **biggest gaming marketplace in the world**.

- 🌐 Global network of trusted suppliers
- 💼 Attractive commission structure
- 🚫 No hidden fees

---

## How It Works

You’ll need either **a developer** or sufficient **technical knowledge** to follow our GitHub documentation.  
The integration process is **manual**, allowing for a **tailored solution**.  
While we don’t provide a plug-and-play option or perform integrations for clients, we **offer consultation support** if needed.

Our **comprehensive documentation** and **GitHub repository** provide everything you need for easy setup — including dedicated support, webhook configurations, and sandbox environments.  
Integration is straightforward if you follow these steps:

1. **Create Your Free Account**  
   Sign up and access the API instantly.

2. **Obtain Your API Key**  
   Generate your unique key from the dashboard.

3. **Integrate Our Product Catalog**  
   Import 50,000+ digital products with full details.

4. **Start Selling**  
   List the products on your e-commerce store.

5. **Automate Purchases**  
   When a customer buys a product, the order is automatically processed by the API.

6. **Earn Profits**  
   Set your pricing and maximize your earnings.

7. **Contact Us**  
   Email **api@kinguin.com** for a welcome pack with promotional starting fees.  
   You can find the fee table below.

---

## Use the Kinguin API and Boost Your Sales

Visit our **Developers Portal** to learn how to make the most of our API.  
Unlock all its features and start selling **like a king!**

---

## Transparent Fee Structure

- Our API operates on a **pay-as-you-sell** model.
- **No monthly fees** or hidden charges.
- Fees depend on your **quarterly turnover**.

### Retail

_Distributor sales of Products_

| Turnover per Quarter (3 Calendar Months) | Custom Commission |
| ---------------------------------------- | ----------------- |
| under €50,000                            | 10%               |
| over €50,000                             | 9%                |
| over €150,000                            | 8%                |
| over €300,000                            | 7%                |
| over €600,000                            | 6%                |
| over €900,000                            | 5%                |
| over €1,200,000                          | 4%                |
| over €1,500,000                          | 3%                |

### Wholesale

| Quantity Range | Commission |
| -------------- | ---------- |
| 10–49          | 3%         |
| 50–149         | 3%         |
| 150–249        | 2.5%       |
| 250+           | 2%         |

---

## FAQ

### ❓ Does it cost anything to access the API?

No — integration and catalog access are **free**. Fees apply only when you sell a product, with **transparent rates** listed above.

### ❓ Can I set my own prices?

Yes — you have **full control** over the final price and your profit margins.

### ❓ What is EUR Balance?

EUR Balance represents the **funds available in your Kinguin account**.  
It’s required for placing orders via the API, as purchases are processed automatically and need sufficient balance to complete.

### ❓ How do I top up my balance?

You can fund your account via **bank transfers, PayPal MassPay, cryptocurrency**, or by purchasing **EUR Balance** on our platform.  
Contact your **account manager** for more details.

### ❓ Are there minimum purchase requirements?

No — you can sell individual products or buy in bulk with **wholesale pricing**.  
Bulk sales start from **10 products**.

### ❓ Do I need to import the full 50,000+ product catalog?

No — you can **choose and import only the products** that interest you, or import **everything we offer**.

### ❓ How do I get technical support?

We provide **dedicated support**, extensive documentation, and a **developer-friendly environment**.

### ❓ Can I get an invoice for my API purchases?

Yes — contact your **account manager** to receive **monthly invoices** for your API purchases.

## 1. Kinguin Dictionary — Documentation Nomenclature

| Kinguin Term     | API Context                                                                                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Merchant**     | A seller who lists offers on their account. Merchants can be categorized into those integrated with the API and those using only the Merchant Dashboard. Integrated sellers can use API functions to manage offers, deliver orders, etc., while non-integrated merchants operate solely through the platform’s interface. |
| **Buyer**        | A user of the Kinguin platform purchasing offers.                                                                                                                                                                                                                                                                         |
| **Product**      | A predefined item with a complete description, images, and other necessary details. Each product must be approved by customer support before becoming available on the platform. Products are integral to the creation of offers.                                                                                         |
| **Offer**        | A specific price proposal for a product. Each offer is associated with a specific product and includes details such as pricing, availability, and other relevant information. Merchants create and manage offers to showcase their products to potential buyers on the Kinguin platform.                                  |
| **Order**        | A purchase made by a buyer, which may include various offers for different products in varying quantities. An order is the result of a buyer’s selection from the available offers.                                                                                                                                       |
| **Reservation**  | A reference to each purchased key. The number of reservations equals the number of bought keys in an order.                                                                                                                                                                                                               |
| **Price**        | The amount charged for a key, specified in the API in eurocents. This is the price visible to buyers on the product page.                                                                                                                                                                                                 |
| **Price IWTR**   | The amount the seller will receive for selling a key. Price IWTR is specified in eurocents.                                                                                                                                                                                                                               |
| **Product Page** | The page on the Kinguin platform that provides a comprehensive description of the product, along with a list of available offers for that product, including prices.                                                                                                                                                      |
| **Webhook**      | An event informing about a reservation status change sent to specific URLs set by the merchant.                                                                                                                                                                                                                           |
| **SPA**          | Smart Pricing Assistant — a bot for price adjustment.                                                                                                                                                                                                                                                                     |

---

## 2. Price and Currency

For offer creation and updates, the `price` field in the request corresponds to the **IWTR price**.

Within the API system, two types of prices are supported:
`price` and `priceIWTR` (Price I Want To Receive).
Both consist of the fields:

- `amount` (in eurocents)
- `currency` (always `"EUR"`)

Below is detailed information about these fields and their usage in API requests and responses.

### 2.1 Price

The `price` field refers to the price visible to customers on the product page (it includes commissions).
It represents the price customers will see before making a purchase.

**Example JSON structure:**

```json
"price": {
  "amount": 200,
  "currency": "EUR"
}
```

### 2.2 Price IWTR

The `priceIWTR` field specifies the amount the seller will ultimately receive for sold products.

**Example JSON structure:**

```json
"priceIWTR": {
  "amount": 200,
  "currency": "EUR"
}
```

### 📌 Notes on Price and Currency Format

- Prices are **always provided in EUR cents** to avoid floating-point precision issues.
- Minimum amount: **0 eurocents**
- Maximum amount: **1,000,000 eurocents**
- Currency: **EUR only**
- For offer creation and updates, the `price` field corresponds to the **IWTR price**.
- To convert between `price` and `priceIWTR` (taking into account Kinguin commission), refer to the **Commissions** section.

---

## 3. Fees and Charges Policy

This section outlines the rules and processes related to various fees and charges that may apply to merchants.

---

### 3.1 Price Change Fee

For every price change (excluding Smart Pricing Assistant functionality), a fee is charged.
Merchants are allowed **3 free price changes per offer per day**.

**Fee Details:**

- The fee is charged **once per day** for all additional price changes beyond the free limit.
- A summary of charges is visible in the **Balance tab** on the Merchant Dashboard.

---

### 3.2 Smart Pricing Assistant (SPA) Fee

A fee for using the SPA functionality is charged **once a week**, based on the number of offers where SPA was active during the previous week.

**Fee Details:**

- Charged **weekly**, according to a tiered structure (see SPA Pricing section).
- A summary of weekly SPA charges is available in the **Balance tab** on the Merchant Dashboard.

---

### 3.3 Sales Booster Fee

An entry fee is charged for each activation of the **Sales Booster** functionality.
The frequency depends on the renewal option selected.

**Fee Details:**

- If the renewal option is **on**, the entry fee is charged **every 7 days**.
- If the renewal option is **off**, the entry fee is **one-time**, charged upon activation.
- Setting `maxBid=0` deactivates Sales Booster.
- Reactivating Sales Booster (`maxBid > 0`) incurs another entry fee.

---

## 4. Commissions

Commission refers to the fee charged by the platform, deducted from the final product price before transferring funds to the seller.
This commission is included in the **final buyer price** shown on Kinguin product pages.

The seller’s received amount (price without commission) is represented by the `priceIWTR` field.

Example commission field in an offer:

```json
"commissionRule": {
  "id": "86656332-4494-4834-87f2-1214a69ce70e",
  "ruleName": "KinguinBaseCommission",
  "fixedAmount": 10,
  "percentValue": 10
}
```

| Field            | Description                               |
| ---------------- | ----------------------------------------- |
| **id**           | Unique identifier for the commission rule |
| **ruleName**     | Name or identifier of the rule            |
| **fixedAmount**  | Fixed amount charged (if applicable)      |
| **percentValue** | Percentage value charged (if applicable)  |

### 4.1 Commission Calculation

To calculate `price` from `priceIWTR` or vice versa, use the endpoint:

```bash
curl -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://gateway.kinguin.net/sales-manager-api/api/v1/offers/calculations/priceAndCommission?kpcProductId=[kpcProductId]&price=[price]"
```

---

### 4.2 Price and Commission Calculation Discrepancy

The system allows calculating `priceIWTR` from the final `price`.
However, due to rounding to two decimal places, multiple distinct price values can produce the same IWTR value.

**Example:**

| Price | priceIWTR |
| ----- | --------- |
| 10524 | 10009     |
| 10525 | 10010     |
| 10526 | 10010     |
| 10527 | 10011     |

If a user queries `/priceAndCommission` with `priceIWTR = 10010`,
the system returns `price = 10525`, the **lowest** price that yields that IWTR value.

This ensures consistent, unique mapping between `priceIWTR` and final `price`.

---

### 📌 Notes on Commissions

- The `commissionRule` field also appears in offer responses.

---

## 5. Date and Time Format

All date-time fields follow the ISO 8601 format:

```
YYYY-MM-DDTHH:mm:ss.ms+0000
```

**Example:**

```
"createDate": "2021-08-31T13:00:38.914+0000"
```

---

# Part 2 — API Integration and Offer Management

## 6. API Integration Description

The **Kinguin API** is dedicated to sellers and enables a fully automated sales process.
Merchants can handle every stage of a transaction — from offer creation to key delivery — using only the API.

This integration allows sellers to:

- Create and modify offers easily.
- Manage key inventories effectively.
- Use the **declared stock approach** for accurate inventory tracking.
- Deliver keys automatically to customers.
- Sell wholesale with configurable quantity-based discounts.

---

## 7. Offer Creation

A **test product** is available in production:
👉 [Test Product](https://www.kinguin.net/category/49704/testowe-cd-key)
**Test productId:** `5c9b71292539a4e8f1809707`

To create an offer, use the endpoint below — **`productId`** and **`price`** are required fields.

> Remember: for offer creation and updates, the `price` field corresponds to the **IWTR price**.

### Example Request

```bash
curl -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "${PRODUCT_ID}",
    "price": {"amount": 2, "currency": "EUR"}
  }' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers
```

### Example Response

```json
{
  "id": "660691850f65d000010da229",
  "productId": "60d990172adc85b8f1b1ee96",
  "name": "Forspoken EU PS5 CD Key",
  "sellerId": 1066100,
  "status": "ACTIVE",
  "block": null,
  "priceIWTR": { "amount": 1500, "currency": "EUR" },
  "price": { "amount": 1660, "currency": "EUR" },
  "commissionRule": {
    "id": "86656332-4494-4834-87f2-1214a69ce70e",
    "ruleName": "super-deal",
    "fixedAmount": 10,
    "percentValue": 10
  },
  "declaredStock": 0,
  "maxDeliveryDate": null,
  "declaredTextStock": 0,
  "reservedStock": 0,
  "availableStock": 0,
  "buyableStock": 0,
  "updatedAt": "2024-03-29T10:01:42.177+0000",
  "createdAt": "2024-03-29T10:01:41.733+0000",
  "wholesale": {
    "name": "Default",
    "enabled": true,
    "tiers": [
      {
        "discount": 0,
        "level": 1,
        "price": { "amount": 1590, "currency": "EUR" },
        "priceIWTR": { "amount": 1500, "currency": "EUR" }
      },
      {
        "discount": 0,
        "level": 2,
        "price": { "amount": 1530, "currency": "EUR" },
        "priceIWTR": { "amount": 1500, "currency": "EUR" }
      },
      {
        "discount": 0,
        "level": 3,
        "price": { "amount": 1515, "currency": "EUR" },
        "priceIWTR": { "amount": 1500, "currency": "EUR" }
      },
      {
        "discount": 0,
        "level": 4,
        "price": { "amount": 1500, "currency": "EUR" },
        "priceIWTR": { "amount": 1500, "currency": "EUR" }
      }
    ]
  },
  "sold": 0,
  "productDetails": {
    "region": { "id": 3, "name": "Region Free" },
    "platform": { "id": 13, "name": "Other" },
    "imageUrl": "https://static.kinguin.net/media/images/products/_111.png",
    "productType": {
      "softwareMS": false,
      "prePaid": true,
      "skinsCSGO": false,
      "randomProduct": false,
      "indieValley": false,
      "nft": false,
      "businessStore": false
    },
    "marketingProductType": "GAME"
  },
  "preOrder": false,
  "sold1d": 0,
  "sold7d": 0,
  "sold30d": 0,
  "popularityBid": { "amount": 0, "currency": "EUR" },
  "popularityPosition": null,
  "popularity": 0.0,
  "merchantType": "MERCHANT",
  "spaActive": false,
  "salesBoosterRenewal": false
}
```

---

### Notes on Offer Creation

- `status` can be `"ACTIVE"` or `"INACTIVE"` (default: `"ACTIVE"`).
- Some products may be automatically **blocked** by the system. If blocked, the `block` field will contain the reason.
- An offer becomes **visible** on the product page when:
  - It’s **ACTIVE**.
  - It’s **not blocked** (`block = null`).
  - It has uploaded or declared stock (`buyableStock > 0`).
  - It’s not a **pre-order** or **pre-purchase** offer.

**📌 Important Notes:**

- The final price is **calculated automatically** by the system based on the merchant’s commission.
- You must **create an offer before uploading stock**.
- The declared stock approach is enabled by adding the `declaredStock` field (during creation or update).

---

## 8. Upfront Stock Upload

Before uploading stock, the offer **must exist**.
Each uploaded key can be text-based or an image (base64).

**Allowed MIME types:**

- `text/plain`
- `image/jpeg`
- `image/png`
- `image/gif`

### Example Request

```bash
curl -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"body": "key123", "mimeType": "text/plain"}' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/${OFFER_ID}/stock
```

### Example Response

```json
{
  "id": "f64e66d5-e26c-426a-ba8b-cfeb220972ff",
  "productId": "${PRODUCT_ID}",
  "offerId": "${OFFER_ID}",
  "sellerId": 5005408,
  "status": "AVAILABLE"
}
```

### Stock Status Values

| Status          | Description                                            |
| --------------- | ------------------------------------------------------ |
| **AVAILABLE**   | Key is available for purchase.                         |
| **DISABLED**    | Key is disabled and unavailable.                       |
| **DISPATCHED**  | Key has been delivered to the customer.                |
| **DISPATCHING** | Key is currently being delivered.                      |
| **REMOVED**     | Key has been deleted and is no longer available.       |
| **RETURNED**    | Key was returned by the customer and cannot be resold. |

### Stock Fields in Offers

```json
{
  "availableStock": 2,
  "buyableStock": 22,
  "declaredStock": 20,
  "reservedStock": 4
}
```

| Field              | Meaning                                        |
| ------------------ | ---------------------------------------------- |
| **availableStock** | Number of uploaded keys.                       |
| **buyableStock**   | Total available keys for purchase.             |
| **declaredStock**  | Number of declared (not yet uploaded) keys.    |
| **reservedStock**  | Keys that are purchased but not delivered yet. |

---

### 📌 Notes on Stock Upload

- To upload an image, send a **base64-encoded string** in `body`.
- After purchase, a key with `AVAILABLE` status is automatically marked `DISPATCHED`.
- To upload stock post-purchase, you must have **declared stock** enabled (`declaredStock > 0`).

---

## 9. Key Stock Removal

Deleting stock via API is **not supported**.
Keys can only be removed manually through the **Merchant Panel** under the _Offer Edit_ tab.
This operation requires **Two-Factor Authentication (2FA).**

---

## 10. Declared Stock Approach

Merchants using the **declared stock approach** must deliver the stock **within 15 minutes** of payment.

To use this feature, contact **[api@kinguin.io](mailto:api@kinguin.io)** to request access.

This approach automates key delivery:
Merchants receive webhook notifications and respond by sending keys via the API.

---

### 10.1 Stock Declaration Privileges

To enable declared stock, you must:

- Request access via **[api@kinguin.io](mailto:api@kinguin.io)**.
- Have a **declared stock limit** set by Kinguin.

If the declared stock exceeds your limit, the API will return:

```
HTTP 400 Bad Request
Max declared stock has been exceeded
```

Before declaring stock, ensure webhook integration is configured for key delivery.

---

### 10.2 Declared Stock Example

#### When Creating an Offer

```bash
curl -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "${PRODUCT_ID}",
    "price": {"amount": 2, "currency": "EUR"},
    "declaredStock": 100
  }' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers
```

#### When Updating an Offer

```bash
curl -X PATCH \
  -H "Authorization: Bearer ${BEARER}" \
  -H "Content-Type: application/json" \
  -d '{"declaredStock": 100}' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/${OFFER_ID}
```

---

### 10.3 Declared Text Stock

Some sales channels require **text-format keys**.
To support these, merchants must specify the number of text-based keys using the `declaredTextStock` field.

- The field defines how many declared keys are text-based.
- It must be **≤ declaredStock**.

#### When Creating an Offer

```bash
curl -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "${PRODUCT_ID}",
    "price": {"amount": 2, "currency": "EUR"},
    "declaredStock": 100,
    "declaredTextStock": 20
  }' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers
```

#### When Updating an Offer

```bash
curl -X PATCH \
  -H "Authorization: Bearer ${BEARER}" \
  -H "Content-Type: application/json" \
  -d '{"declaredStock": 100, "declaredTextStock": 20}' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/${OFFER_ID}
```

⚠️ **Note:**
Fees may apply for **undelivered orders** caused by `Cancel_Out_of_Stock`.
Fee amounts differ between **retail** and **wholesale**. Contact your account manager for updated pricing.

---

# Part 3 — Webhooks and Declared Stock Delivery Flow

## 11. Webhooks

To use **webhooks**, merchants must first obtain privileges for the **declared stock approach**.
Request activation by contacting:
📧 **[api@kinguin.io](mailto:api@kinguin.io)**

Webhooks are **events sent to merchant-defined URLs** that correspond to changes in **reservation status** (for individual purchased keys).

Webhooks are triggered per key, allowing handling of:

- Wholesale scenarios, and
- Mixed stock cases (part uploaded, part declared).

---

## 12. Webhook Subscription

To manage declared stock, merchants must register their webhook URLs.
This can be done via API or through the **Merchant Panel**.

### Example Request — Create Webhook Subscription

```bash
curl -i -X POST \
  https://gateway.kinguin.net/envoy2/api/v1/subscription \
  -H 'authorization: Bearer ${BEARER}' \
  -H 'content-type: application/json' \
  -d '{
    "endpoints": {
      "reserve": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "give": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "cancel": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "delivered": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "outofstock": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "returned": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "reversed": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "refunded": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "processingpreorder": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "offerblocked": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "processingingame": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "chatmessage": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c",
      "orderprocessing": "https://webhook.site/6e8ab695-872b-46a2-affe-218ac3b35c5c"
    },
    "headers": [{"name": "X-Auth-Token", "value": "xxxx"}]
  }'
```

> ✅ It is strongly recommended to set an authentication header (e.g. `X-Auth-Token`) for verifying Kinguin webhook calls.

Alternatively, webhook subscriptions can be configured from the **Merchant Panel** GUI.

Each webhook request is **retried twice** if delivery fails:

- 1st attempt: immediately
- 2nd attempt: 5 minutes after failure

---

### Notes on Webhook Subscription

- A **subscription can be created only once**, but updated anytime.
- Changes affect only **newly generated** webhooks — queued webhooks still use previous URLs.
- You can preview your webhook configuration using a dedicated endpoint.

---

## 13. Webhook Events Description

Below is a comprehensive table describing each webhook and its purpose.

| Webhook Name           | Reservation Status    | Description                                                                                          |
| ---------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| **reserve**            | `BUYING`              | Triggered when a buyer initiates the purchase process (enters payment gateway).                      |
| **give**               | `BOUGHT`              | Triggered when payment confirmation is received.                                                     |
| **cancel**             | `CANCELED`            | Sent when a reservation is canceled before delivery (e.g. payment canceled).                         |
| **delivered**          | `DELIVERED`           | Sent after key is successfully delivered to buyer.                                                   |
| **returned**           | `RETURNED`            | Buyer returned a key within 24 hours (not seen yet). Key returns to seller’s stock.                  |
| **outofstock**         | `OUT_OF_STOCK`        | Sent when there is no stock for an order marked as `BOUGHT`. Merchant must deliver the key manually. |
| **refunded**           | `REFUNDED`            | Buyer received a refund after viewing the key and filing a complaint.                                |
| **reversed**           | `REVERSED`            | Payment reversal occurred.                                                                           |
| **processingpreorder** | `PROCESSING_PREORDER` | Sent for pre-orders in `BOUGHT` state — informs merchant to deliver on release day.                  |
| **offerblocked**       | N/A                   | Sent when an offer becomes blocked (details in `block` field).                                       |
| **chatmessage**        | N/A                   | Sent when customer sends a message in in-game product chat.                                          |
| **orderprocessing**    | N/A                   | Triggered when a customer creates an order entering “processing” status.                             |

---

### 13.1 Webhook Body for Reservation Status Changes

Each webhook related to a reservation contains consistent structure:

```json
{
  "name": "Testowe CD Key",
  "price": { "amount": 2, "currency": "EUR" },
  "priceIWTR": { "amount": 2, "currency": "EUR" },
  "commissionRule": { "fixedAmount": 0, "percentValue": 0.0, "ruleName": "Zero" },
  "productId": "${PRODUCT_ID}",
  "offerId": "${OFFER_ID}",
  "status": "BUYING",
  "reservationId": "${RESERVATION_ID}",
  "availableStock": 0,
  "buyableStock": 0,
  "declaredStock": 1,
  "reservedStock": 1,
  "requestedKeyType": null,
  "updatedAt": "2020-03-06T15:58:49.088+0000",
  "popularityBid": { "amount": 0, "currency": "EUR" }
}
```

---

### 13.2 `offerblocked` Webhook

The body corresponds to the **offer structure**, identical to responses from the offer details endpoint.

---

### 13.3 `chatmessage` Webhook Example

```json
{
  "senderName": "name",
  "message": "test message",
  "createdAt": "2020-03-06T15:58:49.088+0000"
}
```

---

### 13.4 `orderprocessing` Webhook Example

```json
{
  "orderId": "123",
  "productId": "321",
  "qtyOrdered": "20"
}
```

---

## 14. Webhook History

Merchants using declared stock can review webhook delivery history via API.

### Example Request

```bash
curl -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  https://gateway.kinguin.net/envoy2/api/v1/requests
```

### Response Fields

| Field                      | Description                                       |
| -------------------------- | ------------------------------------------------- |
| **request.toSent.body**    | The body content of the sent webhook (as string). |
| **request.toSent.bodyId**  | Reservation ID referenced in the webhook.         |
| **request.deployAttempts** | Number of attempts to send the webhook.           |

---

## 15. Declared Stock Upload — Key Delivery Flow

### 15.1 Purchase Initiation

1. Buyer places an order → `reserve` webhook is sent.
   (Buyer has **not paid** yet.)
2. Buyer cancels order → `cancel` webhook is sent.
3. After payment confirmation → `give` webhook is sent.
   Kinguin attempts to send a key from merchant’s stock.

---

### 15.2 Delivery Process

After `give` webhook:

- If **no stock**:
  → `outofstock` webhook is sent — merchant must deliver keys quickly.
- If **pre-order product**:
  → `processingpreorder` webhook is sent — merchant must deliver on release date.

⏱️ **If the merchant fails to deliver within 15 minutes, the order is canceled.**

Once the key is delivered, a `delivered` webhook confirms completion.

---

### 15.3 Complaint Handling

- If buyer **has not seen** the key and requests a refund → `returned` webhook is sent.
  The key is re-added to stock automatically.

- If buyer **has seen** the key and files a complaint →
  Seller and buyer communicate through **Resolution Center** (Merchant Panel → Customer Support).
  If refunded, the seller receives a `refunded` webhook.

---

## 16. Key Delivery Implementation Guide

1. Listen for `reserve` → respond with HTTP **200 OK**.
2. Listen for `give` → respond with HTTP **200 OK**.
3. Listen for `outofstock` → respond with HTTP **200 OK**.
4. Listen for `cancel` → respond with HTTP **200 OK**.
5. Upload stock after `outofstock` event using one of the following methods:

---

### 16.1 Upload to Offer’s Stock

```bash
curl -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"body": "cd key", "mimeType": "text/plain"}' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/${OFFER_ID}/stock
```

---

### 16.2 Upload to Reservation

> Use this when you want **full control** over how keys are assigned per order.

```bash
curl -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"body": "cd key", "mimeType": "text/plain", "reservationId": ${RESERVATION_ID}}' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/${OFFER_ID}/stock
```

---

### 16.3 Confirmation

After successful delivery:
Listen for `delivered` webhook → respond **HTTP 200 OK**.

---

# Part 4 — Offer Blocking, Complaints, Wholesale, and Pre-Orders

## 17. Offer Blocking and Deactivation

Kinguin automatically performs **offer verification** and **blocking** based on various compliance, quality, or operational conditions.

If an offer becomes blocked, the merchant receives the **`offerblocked` webhook** (see Part 3).

Blocked offers include a **block reason** in the `block` field of the offer details endpoint.

### 17.1 Offer Block Reasons

Each blocked offer includes one or more codes identifying the reason.

| Block Reason          | Description                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------- |
| **ALLBLOCK**          | Global block affecting all offers.                                                       |
| **PRICEBLOCK**        | Offer blocked due to incorrect or extreme pricing.                                       |
| **MISSINGSTOCK**      | Offer blocked due to missing declared or uploaded stock.                                 |
| **PROHIBITEDPRODUCT** | Offer blocked because the product type is not allowed (e.g., Microsoft Office, Windows). |
| **DUPLICATEDPRODUCT** | Offer blocked because it duplicates another existing offer.                              |
| **INVALIDKEYS**       | Offer blocked due to issues with uploaded or declared keys.                              |
| **QUALITYISSUE**      | Offer blocked following customer complaints or poor quality reports.                     |
| **MERCHANTREQUEST**   | Offer blocked manually at the merchant’s request.                                        |
| **FRAUDSUSPECT**      | Offer blocked because of suspected fraudulent activity.                                  |
| **REGIONMISMATCH**    | Offer blocked because the region or language does not match the product definition.      |

---

### 17.2 Bulk Activation and Deactivation of Offers

To manage multiple offers simultaneously, use **bulk endpoints**.

#### Bulk Activate Offers

```bash
curl -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "offers": ["${OFFER_ID1}", "${OFFER_ID2}", "${OFFER_ID3}"],
    "active": true
  }' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/activation
```

#### Bulk Deactivate Offers

```bash
curl -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "offers": ["${OFFER_ID1}", "${OFFER_ID2}", "${OFFER_ID3}"],
    "active": false
  }' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/activation
```

**Response Example:**

```json
{
  "updated": ["OFFER_ID1", "OFFER_ID2"],
  "failed": []
}
```

✅ Successful offers are listed in `updated`.
❌ Failed updates (if any) appear in `failed`.

---

## 18. Key Returns and Complaints

Buyers can file complaints if they encounter issues with delivered keys.
Complaints are handled through the **Resolution Center** (accessible via Merchant Panel).

### 18.1 Complaint Types

| Complaint Type      | Description                                         |
| ------------------- | --------------------------------------------------- |
| **Key Not Working** | Buyer claims the key is invalid or already used.    |
| **Wrong Region**    | Key does not match the buyer’s region restrictions. |
| **Wrong Product**   | Delivered key activates a different product.        |
| **Other Issues**    | General or unclassified issues.                     |

### 18.2 Complaint Resolution Flow

1. Buyer opens a dispute in the **Resolution Center**.
2. Seller and buyer exchange messages and evidence.
3. Kinguin’s support team mediates when necessary.
4. Possible outcomes:
   - Refund issued to buyer → Seller receives `refunded` webhook.
   - Replacement key accepted → Seller uploads new key to reservation.
   - Dispute closed without action.

### 18.3 Returned Keys

If a buyer **has not viewed** the key and requests a return:

- Kinguin issues a **refund automatically**.
- Merchant receives a `returned` webhook.
- The key is **re-added** to merchant’s available stock.

---

## 19. Wholesale Offers

Wholesale functionality allows merchants to set **tier-based pricing**.
This enables discounts based on order quantity thresholds.

### 19.1 Wholesale Structure in Offers

Each offer contains a `wholesale` object with up to 4 levels.

```json
"wholesale": {
  "name": "Default",
  "enabled": true,
  "tiers": [
    {"discount": 0, "level": 1, "price": {"amount": 1590,"currency": "EUR"}, "priceIWTR": {"amount": 1500,"currency": "EUR"}},
    {"discount": 0, "level": 2, "price": {"amount": 1530,"currency": "EUR"}, "priceIWTR": {"amount": 1500,"currency": "EUR"}},
    {"discount": 0, "level": 3, "price": {"amount": 1515,"currency": "EUR"}, "priceIWTR": {"amount": 1500,"currency": "EUR"}},
    {"discount": 0, "level": 4, "price": {"amount": 1500,"currency": "EUR"}, "priceIWTR": {"amount": 1500,"currency": "EUR"}}
  ]
}
```

| Field         | Description                                 |
| ------------- | ------------------------------------------- |
| **enabled**   | Enables or disables wholesale pricing.      |
| **level**     | Tier number (1–4).                          |
| **discount**  | Optional discount percentage for the tier.  |
| **price**     | Buyer-facing price per unit for this tier.  |
| **priceIWTR** | Seller’s net amount per unit for this tier. |

---

### 19.2 Update Wholesale Prices in Bulk

Merchants can update wholesale pricing for multiple offers simultaneously.

**Example Request:**

```bash
curl -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "offers": ["${OFFER_ID1}", "${OFFER_ID2}"],
    "wholesale": {
      "enabled": true,
      "tiers": [
        {"level": 1, "priceIWTR": {"amount": 200,"currency": "EUR"}},
        {"level": 2, "priceIWTR": {"amount": 180,"currency": "EUR"}}
      ]
    }
  }' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/wholesale
```

**Response Example:**

```json
{
  "updated": ["OFFER_ID1", "OFFER_ID2"],
  "failed": []
}
```

---

## 20. Pre-Orders and Pre-Purchases

Kinguin supports **pre-orders** and **pre-purchases** for upcoming releases.

### 20.1 Key Differences

| Type             | Payment Timing                    | Delivery Timing          |
| ---------------- | --------------------------------- | ------------------------ |
| **Pre-Order**    | Paid before release               | Delivered on release day |
| **Pre-Purchase** | Paid and activated before release | Delivered immediately    |

---

### 20.2 Pre-Order Flow

1. Buyer pays → `processingpreorder` webhook sent.
2. Seller prepares to deliver keys on release day.
3. On release → Seller uploads keys via standard stock upload API.
4. Once uploaded → `delivered` webhook confirms completion.

---

### 20.3 Pre-Purchase Flow

For pre-purchase offers, the system handles them like regular purchases:

- Payment → `give` webhook
- Immediate delivery → `delivered` webhook

---

### 20.4 Important Notes for Pre-Orders

- Pre-order offers **must include** the release date in metadata.
- Delivery before release violates platform policy.
- Late deliveries (after release day) may incur penalties.
- Declared stock for pre-orders is not allowed — only **upfront stock upload** is accepted.

---

# Part 5 — Smart Pricing Assistant, Sales Booster, and Developer Tools

## 21. Smart Pricing Assistant (SPA)

The **Smart Pricing Assistant (SPA)** is an automated price management system provided by Kinguin.
It continuously adjusts offer prices to maintain competitiveness and optimize sales.

### 21.1 Overview

SPA automatically changes prices based on:

- Current competition prices
- Market activity
- Minimum and maximum limits set by the merchant

This feature helps sellers maintain the best position in product listings while respecting profit margins.

---

### 21.2 SPA Activation and Configuration

SPA can be enabled per offer using the `spaActive` field.

#### Enable SPA for an Offer

```bash
curl -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"spaActive": true}' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/${OFFER_ID}
```

#### Disable SPA for an Offer

```bash
curl -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"spaActive": false}' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/${OFFER_ID}
```

---

### 21.3 SPA Pricing Rules

When SPA is active, Kinguin adjusts prices dynamically based on:

- Competitors’ prices
- Offer’s historical sales
- Commission rates
- Configured min/max limits (defined internally or by merchant)

SPA ensures that prices **never drop below** the minimum IWTR threshold, protecting the seller’s profit margin.

---

### 21.4 SPA Fees

SPA usage incurs a **weekly fee**.
The fee is calculated based on how many offers had SPA enabled during the past week.

| Tier   | Number of Offers | Fee per Offer (Weekly) |
| ------ | ---------------- | ---------------------- |
| Tier 1 | 1–100 offers     | €0.05                  |
| Tier 2 | 101–1,000 offers | €0.03                  |
| Tier 3 | 1,001+ offers    | €0.02                  |

> Weekly charges are summarized in the **Balance tab** of the Merchant Dashboard.

---

### 21.5 SPA Logs and Monitoring

Merchants can monitor SPA activity and results through:

- API endpoints returning offer metadata (showing `spaActive: true`)
- Merchant Dashboard analytics
- Weekly email reports detailing adjustments and price trends

---

## 22. Sales Booster

The **Sales Booster** tool increases visibility and traffic to selected offers by boosting them in the Kinguin marketplace.

### 22.1 Activation

Sales Booster can be activated for specific offers using the `popularityBid` field.

#### Example Request

```bash
curl -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"popularityBid": {"amount": 100, "currency": "EUR"}}' \
  https://gateway.kinguin.net/sales-manager-api/api/v1/offers/${OFFER_ID}
```

Setting `popularityBid.amount` above 0 enables Sales Booster.
Setting it to 0 deactivates it.

---

### 22.2 Renewal Options

- **Auto-renewal enabled:** Entry fee charged every **7 days**.
- **Auto-renewal disabled:** Fee charged once at activation.
- Deactivation (by setting `maxBid = 0`) stops renewal billing.

---

### 22.3 Fee Structure

The entry fee and renewal fee depend on several factors:

- Product category
- Demand
- Positioning priority

Fees are charged in EUR and displayed transparently in the **Balance tab** on the Merchant Dashboard.

---

## 23. Commission Calculation via API

The **Commission Calculation Endpoint** helps merchants determine pricing structures before creating or updating offers.

### 23.1 Calculate Price and Commission

#### Endpoint

```bash
GET /sales-manager-api/api/v1/offers/calculations/priceAndCommission
```

#### Parameters

| Parameter      | Type    | Required | Description                             |
| -------------- | ------- | -------- | --------------------------------------- |
| `kpcProductId` | string  | Yes      | Product identifier                      |
| `price`        | integer | Optional | Buyer-facing price in eurocents         |
| `priceIWTR`    | integer | Optional | Seller’s target IWTR price in eurocents |

> Either `price` or `priceIWTR` must be provided.

#### Example Request

```bash
curl -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://gateway.kinguin.net/sales-manager-api/api/v1/offers/calculations/priceAndCommission?kpcProductId=60d990172adc85b8f1b1ee96&price=1500"
```

#### Example Response

```json
{
  "price": { "amount": 1500, "currency": "EUR" },
  "priceIWTR": { "amount": 1360, "currency": "EUR" },
  "commissionRule": {
    "id": "86656332-4494-4834-87f2-1214a69ce70e",
    "ruleName": "KinguinBaseCommission",
    "fixedAmount": 10,
    "percentValue": 10
  }
}
```

---

### 23.2 Handling Rounding Discrepancies

Due to rounding behavior, multiple prices may yield the same IWTR.
In such cases, the API always returns the **lowest possible buyer price** for the provided IWTR.

---

### 23.3 Commission Price Not Found

If neither `price` nor `priceIWTR` is supplied, the endpoint returns:

```json
{
  "status": 404,
  "message": "Commission Price not found"
}
```

---

## 24. Developer Tools and Environment Setup

To integrate with Kinguin’s API ecosystem, developers must use **OAuth2 authorization**, **sandbox testing**, and **secure webhooks**.

---

### 24.1 Authorization (Bearer Tokens)

Kinguin APIs require `Authorization: Bearer` tokens in every request.

Example header:

```bash
-H "Authorization: Bearer ${TOKEN}"
```

Tokens can be obtained via the Developer Portal after creating an **API Client**.

---

### 24.2 Sandbox Environment

Developers are encouraged to use the **sandbox environment** before going live.

| Environment    | Base URL                       |
| -------------- | ------------------------------ |
| **Sandbox**    | `https://sandbox.kinguin.net/` |
| **Production** | `https://gateway.kinguin.net/` |

Testing operations (offer creation, stock uploads, and webhooks) work identically in both environments.

---

### 24.3 Rate Limits

Default API rate limits for merchants:

| Request Type      | Limit                          | Timeframe  |
| ----------------- | ------------------------------ | ---------- |
| Offer creation    | 100 requests                   | per minute |
| Offer update      | 200 requests                   | per minute |
| Stock upload      | 50 requests                    | per minute |
| Webhook callbacks | No limit (Kinguin to merchant) | —          |

If exceeded, the system returns HTTP `429 Too Many Requests`.

---

### 24.4 Error Handling

| HTTP Status                 | Meaning                                               | Notes                                |
| --------------------------- | ----------------------------------------------------- | ------------------------------------ |
| `200 OK`                    | Request succeeded                                     | —                                    |
| `201 Created`               | Offer or stock successfully created                   | —                                    |
| `400 Bad Request`           | Validation error (e.g. exceeded declared stock limit) | Check message body                   |
| `401 Unauthorized`          | Invalid or missing token                              | Refresh your credentials             |
| `403 Forbidden`             | Insufficient privileges                               | Contact Kinguin support              |
| `404 Not Found`             | Resource not found                                    | Offer, product, or key doesn’t exist |
| `429 Too Many Requests`     | Rate limit exceeded                                   | Wait before retrying                 |
| `500 Internal Server Error` | Unexpected platform issue                             | Retry or contact support             |

---

### 24.5 Time Format and Localization

All date and time values follow the **ISO 8601** format in GMT:

```
YYYY-MM-DDTHH:mm:ss.ms+0000
```

Example:

```
2024-01-12T14:30:45.914+0000
```

All financial data is represented in **EUR cents**.

---

### 24.6 Contact and Support

For API integration, access requests, or issue reporting:

- 📧 **[api@kinguin.io](mailto:api@kinguin.io)** — technical API support
- 📧 **[support@kinguin.net](mailto:support@kinguin.net)** — general merchant support
- 🧭 **[https://kinguin.net/dev-portal/](https://kinguin.net/dev-portal/)** — official documentation portal

---

# Part 6 — Testing, Security, Glossary, and Versioning

## 25. Testing and Integration Checklist

Before going live with your Kinguin API integration, verify that your implementation passes the following key tests.
Each step ensures compliance, security, and correct synchronization between your system and Kinguin’s.

### 25.1 Offer Management

✅ Successfully create, update, and fetch offers via `/sales-manager-api/api/v1/offers`
✅ Verify price consistency between your IWTR and buyer price.
✅ Confirm offers appear on the Kinguin product page when active and stocked.
✅ Test bulk activation and deactivation of multiple offers.
✅ Validate commission calculations using `/calculations/priceAndCommission`.

### 25.2 Stock Management

✅ Upload text and image-based keys successfully.
✅ Upload stock to both offer and reservation endpoints.
✅ Confirm stock statuses transition correctly:

- AVAILABLE → DISPATCHED → DELIVERED
- RETURNED → AVAILABLE
  ✅ Validate that declared stock is reduced when orders are placed.
  ✅ Check that the system rejects uploads beyond your declared stock limit.

### 25.3 Declared Stock Webhooks

✅ Verify that your webhook endpoints respond with HTTP 200.
✅ Simulate payment confirmation → expect `give` webhook.
✅ Simulate out-of-stock → expect `outofstock` webhook.
✅ Deliver key after `outofstock` webhook → expect `delivered` confirmation.
✅ Test cancellation and returned key scenarios.

### 25.4 Pre-Orders and Wholesale

✅ Ensure pre-orders use upfront stock only.
✅ Confirm that pre-purchase keys are delivered instantly.
✅ Validate wholesale tiers and correct discount application per level.

### 25.5 Smart Pricing Assistant (SPA)

✅ Enable SPA on selected offers.
✅ Monitor automatic price updates.
✅ Ensure pricing never falls below the minimum IWTR threshold.

### 25.6 Sales Booster

✅ Activate and deactivate Sales Booster correctly.
✅ Validate weekly renewal fee and popularity position changes.

### 25.7 Error Recovery

✅ Handle 400, 401, 403, 404, and 429 responses gracefully.
✅ Implement exponential backoff or retry strategies where appropriate.
✅ Log failed webhook deliveries and reattempt them manually if needed.

---

## 26. Security and Data Protection

To maintain a secure integration, Kinguin enforces several key requirements and recommendations for all merchant APIs.

### 26.1 HTTPS Requirement

All API requests and webhook communications **must** use HTTPS.
HTTP connections are not accepted and will result in `403 Forbidden`.

### 26.2 Authorization Tokens

- Always use Bearer tokens in the Authorization header.
- Treat tokens as sensitive credentials — never log or expose them.
- Regenerate tokens regularly and store them securely (e.g., in an encrypted vault).
- If your token is compromised, contact **[api@kinguin.io](mailto:api@kinguin.io)** immediately.

### 26.3 IP Whitelisting

You can request IP whitelisting for your webhook URLs to increase security.
Contact the integration team at **[api@kinguin.io](mailto:api@kinguin.io)** to configure it.

### 26.4 Webhook Validation

Include a custom authentication header (e.g., `X-Auth-Token`) to verify webhook authenticity.
Compare the received value with a secret stored in your system.

### 26.5 Data Privacy

- Kinguin does not store uploaded keys longer than necessary for delivery.
- Merchants are responsible for ensuring their stock data and uploaded files contain no personal or sensitive information.
- All data transmissions comply with GDPR and EU data protection laws.

---

## 27. Best Practices for API Integration

### 27.1 Rate Limiting and Efficiency

- Group related requests where possible using bulk endpoints.
- Avoid unnecessary offer updates to minimize the price change fee.
- Implement caching for frequently requested resources like product details.
- Schedule non-urgent tasks during off-peak hours.

### 27.2 Offer Lifecycle Management

- Keep your offers updated — inactive or outdated offers can affect seller rating.
- Deactivate offers without stock to avoid out-of-stock penalties.
- Use webhooks for real-time synchronization of sales and deliveries.

### 27.3 Logging and Monitoring

- Log all API requests and responses with timestamps and correlation IDs.
- Retain logs securely for at least 30 days for troubleshooting.
- Use monitoring alerts for webhook failures or 5xx errors.

### 27.4 Business Continuity

- Implement backup delivery logic for declared stock keys.
- Use redundant servers for webhook endpoints.
- Regularly back up your offer and stock data.

---

## 28. Glossary Recap

| Term                              | Description                                                      |
| --------------------------------- | ---------------------------------------------------------------- |
| **Merchant**                      | Seller listing offers on Kinguin.                                |
| **Buyer**                         | End-user purchasing offers.                                      |
| **Product**                       | Approved item definition used as base for offers.                |
| **Offer**                         | Price listing for a product; may include multiple pricing tiers. |
| **Order**                         | Buyer’s purchase containing one or more offers.                  |
| **Reservation**                   | Individual purchased key reference.                              |
| **Price**                         | Buyer-visible price in eurocents (includes commission).          |
| **Price IWTR**                    | Seller’s net revenue per key (after commission).                 |
| **Webhook**                       | Event notification sent on reservation status changes.           |
| **SPA (Smart Pricing Assistant)** | Automated pricing optimization tool.                             |
| **Sales Booster**                 | Paid promotion increasing offer visibility.                      |
| **Declared Stock**                | Merchant-declared quantity to be delivered after purchase.       |
| **Available Stock**               | Uploaded and ready-to-sell keys.                                 |
| **Returned**                      | Key refunded before being viewed by the buyer.                   |
| **Commission Rule**               | Structure defining platform fee percentages and amounts.         |

---

## 29. Versioning and Changelog

The Kinguin API is versioned and continuously evolving.
Below is a summary of major versions and key changes.

| Version  | Date | Key Updates                                                                |
| -------- | ---- | -------------------------------------------------------------------------- |
| **v1.0** | 2019 | Initial Sales Manager API release with basic offer and stock management.   |
| **v1.1** | 2020 | Introduced declared stock approach and webhook system.                     |
| **v1.2** | 2021 | Added wholesale pricing tiers and commission calculator endpoint.          |
| **v1.3** | 2022 | Enabled Smart Pricing Assistant (SPA) and Sales Booster features.          |
| **v1.4** | 2023 | Expanded webhook events, including `chatmessage` and `orderprocessing`.    |
| **v1.5** | 2024 | Added bulk activation, bulk wholesale updates, and improved rate limiting. |
| **v1.6** | 2025 | Security enhancements, updated fee policies, and performance improvements. |

Future versions will continue improving automation, analytics, and merchant API capabilities.

---

## 30. Final Notes

The Kinguin API empowers merchants to automate and scale their digital key sales globally.
It provides full control over pricing, stock, and order fulfillment through a secure, efficient, and feature-rich integration.

Merchants are encouraged to:

- Stay updated via the [Kinguin Dev Portal](https://kinguin.net/dev-portal/)
- Subscribe to technical newsletters for release updates.
- Regularly review commission and fee changes to maintain optimal pricing.

For any questions, feedback, or feature requests, contact:

📧 **[api@kinguin.io](mailto:api@kinguin.io)** — API integration support
📧 **[support@kinguin.net](mailto:support@kinguin.net)** — Merchant helpdesk

---

## End of Kinguin API Documentation

**Total Document Parts:** 6
**Coverage:** All developer portal content (API Access, Guide, Documentation)
**Format:** Full Markdown with complete endpoint details, workflows, and examples

---
