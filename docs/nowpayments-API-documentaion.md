# NOWPayments API Documentation

### _The Ultimate Crypto Payment Platform_

---

## 1. Overview

**NOWPayments** is a crypto payment gateway that enables businesses to accept, process, and manage cryptocurrency transactions through an easy-to-use REST API.
The API supports creating payments, handling callbacks (IPN notifications), managing invoices, and automating payouts—all through secure, authenticated endpoints.

NOWPayments allows integration with e-commerce stores, SaaS platforms, gaming apps, and custom projects.
You can seamlessly accept crypto from customers, convert it automatically, or receive funds directly into your wallet.

---

## 2. Base URL and Version

All requests are made to the same base URL:

```
https://api.nowpayments.io/v1
```

All API endpoints use **v1** versioning and HTTPS for secure communication.

---

## 3. Authentication

### 3.1 API Keys

Every request requires authentication with an API key.
You obtain your key from your NOWPayments dashboard after registering your account.

Include the key in the request header as follows:

```http
x-api-key: YOUR_API_KEY
```

> **Important:** Never share or expose your API key in client-side code.

---

### 3.2 Bearer Token Authorization

Certain advanced endpoints (e.g., payouts, conversions, mass payments) require **Bearer token authorization** in addition to the API key.

Header example:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

---

### 3.3 Obtaining an Access Token

Use the following endpoint to generate a Bearer token for secure operations.

**Endpoint:**

```
POST /auth
```

**Request body:**

```json
{
  "email": "you@example.com",
  "password": "your_password"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

Tokens expire after a set period and should be refreshed periodically for continued access.

---

## 4. Headers

Every request must include these headers:

| Header          | Type   | Required    | Description                          |
| :-------------- | :----- | :---------- | :----------------------------------- |
| `x-api-key`     | String | Yes         | Your unique NOWPayments API key      |
| `Authorization` | String | Conditional | Bearer token for payouts/conversions |
| `Content-Type`  | String | Yes         | Always set to `application/json`     |
| `Accept`        | String | Optional    | Recommended: `application/json`      |

---

## 5. Response Format

All responses are in **JSON**.
Successful requests return HTTP status `200 OK`, and any errors return standard HTTP codes with a JSON error object.

**Example success response:**

```json
{
  "payment_id": 123456,
  "payment_status": "waiting",
  "pay_address": "bc1qxyz...",
  "price_amount": 100.0,
  "price_currency": "usd",
  "pay_amount": 0.0024,
  "actually_paid": 0.0,
  "pay_currency": "btc",
  "order_id": "ORD-2024-001",
  "order_description": "Digital Game Key",
  "purchase_id": "xyz987",
  "payment_url": "https://nowpayments.io/payment/xyz987",
  "created_at": "2025-11-07T09:00:00Z"
}
```

---

## 6. Error Handling

All errors follow a consistent structure. Example:

```json
{
  "status": "error",
  "message": "Invalid API key or missing credentials",
  "code": 401
}
```

| HTTP Code | Meaning               | Common Cause                   |
| :-------- | :-------------------- | :----------------------------- |
| 200       | OK                    | Request processed successfully |
| 400       | Bad Request           | Missing or invalid parameters  |
| 401       | Unauthorized          | Invalid API key or token       |
| 403       | Forbidden             | Insufficient permissions       |
| 404       | Not Found             | Endpoint or resource missing   |
| 429       | Too Many Requests     | Rate-limit exceeded            |
| 500       | Internal Server Error | Temporary server issue         |

---

## 7. Rate Limits

NOWPayments enforces reasonable rate limits to maintain API stability.

| Endpoint Type                 | Default Limit | Period                              |
| :---------------------------- | :------------ | :---------------------------------- |
| Standard public calls         | 60 requests   | per minute                          |
| Authenticated (payout / mass) | 30 requests   | per minute                          |
| Webhook callbacks             | N/A           | Unlimited (from NOWPayments to you) |

If you exceed a limit, the API returns HTTP `429 Too Many Requests`.

---

## 8. Currencies and Assets

NOWPayments supports over **300 cryptocurrencies**.
Use the `GET /currencies` endpoint to retrieve the latest supported coins and tokens.

**Example response:**

```json
[
  { "currency": "btc", "name": "Bitcoin", "type": "coin" },
  { "currency": "eth", "name": "Ethereum", "type": "coin" },
  { "currency": "usdt", "name": "Tether (ERC20)", "type": "token" },
  { "currency": "bnb", "name": "BNB (BEP20)", "type": "token" }
]
```

Each currency code is used in payment requests under `pay_currency` and `price_currency`.

---

## 9. Sandbox and Testing

A dedicated sandbox environment is available for testing integration without real crypto transactions.

| Environment    | Base URL                                | Purpose           |
| :------------- | :-------------------------------------- | :---------------- |
| **Production** | `https://api.nowpayments.io/v1`         | Live transactions |
| **Sandbox**    | `https://api-sandbox.nowpayments.io/v1` | Testing and QA    |

All sandbox transactions use testnet coins and fake confirmations for simulation.

---

## 10. Security and Best Practices

- Always use HTTPS (`https://`) for all requests.
- Do not embed API keys in front-end JavaScript or public repositories.
- Validate all webhook signatures to ensure authenticity.
- Rotate tokens and keys regularly.
- Log API calls and errors securely for troubleshooting.

---

## 11. Integration Workflow (High-Level)

1. **Create Payment** → Generate a payment object using `POST /payment`.
2. **Redirect Customer** → Send buyer to the payment URL returned by the API.
3. **Await Callback** → Listen for IPN (webhook) notification from NOWPayments.
4. **Verify Payment** → Confirm status (`finished`, `confirmed`, etc.).
5. **Fulfill Order** → Deliver product or service to customer.
6. **(Optional)** Perform auto conversion or payout using payout API.

---

### _Part 2 – Payments and Invoices_

---

## 12. Creating a Payment

To begin a crypto transaction, you must create a **payment** object.
Each payment represents a single customer order in your system.

---

### **Endpoint**

```
POST /payment
```

### **Request Headers**

| Header         | Description              |
| :------------- | :----------------------- |
| `x-api-key`    | Your API key (required). |
| `Content-Type` | `application/json`.      |

---

### **Request Body Example**

```json
{
  "price_amount": 49.99,
  "price_currency": "usd",
  "pay_currency": "btc",
  "order_id": "ORDER-001",
  "order_description": "BitLoot digital key purchase #001",
  "ipn_callback_url": "https://bitloot.io/api/ipn",
  "success_url": "https://bitloot.io/success",
  "cancel_url": "https://bitloot.io/cancel"
}
```

**Parameters**

| Field               | Type   | Required | Description                                         |
| :------------------ | :----- | :------- | :-------------------------------------------------- |
| `price_amount`      | Number | ✅       | Price to charge in fiat (USD, EUR, etc.).           |
| `price_currency`    | String | ✅       | Fiat currency (usd, eur, gbp, etc.).                |
| `pay_currency`      | String | Optional | Crypto currency for payment (btc, eth, usdt, etc.). |
| `order_id`          | String | ✅       | Your internal order identifier.                     |
| `order_description` | String | Optional | Description of the order.                           |
| `ipn_callback_url`  | String | ✅       | Webhook URL for payment status updates.             |
| `success_url`       | String | Optional | Redirect after successful payment.                  |
| `cancel_url`        | String | Optional | Redirect if buyer cancels payment.                  |

---

### **Example Response**

```json
{
  "payment_id": 839217,
  "payment_status": "waiting",
  "pay_address": "bc1qnw6k7g8s...xyz",
  "price_amount": 49.99,
  "price_currency": "usd",
  "pay_amount": 0.001234,
  "actually_paid": 0,
  "pay_currency": "btc",
  "order_id": "ORDER-001",
  "order_description": "BitLoot digital key purchase #001",
  "purchase_id": "np-1283-xyz",
  "payment_url": "https://nowpayments.io/payment/np-1283-xyz",
  "created_at": "2025-11-07T10:15:00Z"
}
```

---

### **Payment Statuses**

| Status       | Meaning                                                  |
| :----------- | :------------------------------------------------------- |
| `waiting`    | Payment created; awaiting crypto transfer.               |
| `confirming` | Transaction detected; waiting for network confirmations. |
| `confirmed`  | Enough confirmations received (usually 1–2 blocks).      |
| `finished`   | Payment settled successfully.                            |
| `failed`     | Payment failed or expired.                               |
| `refunded`   | Refund issued manually or automatically.                 |

---

### **Check Payment Status**

```
GET /payment/{payment_id}
```

Example:

```bash
curl -X GET "https://api.nowpayments.io/v1/payment/839217" \
  -H "x-api-key: YOUR_API_KEY"
```

**Response:**

```json
{
  "payment_id": 839217,
  "payment_status": "confirmed",
  "price_amount": 49.99,
  "price_currency": "usd",
  "pay_amount": 0.001234,
  "actually_paid": 0.001234,
  "pay_currency": "btc",
  "order_id": "ORDER-001",
  "purchase_id": "np-1283-xyz",
  "updated_at": "2025-11-07T10:22:00Z"
}
```

---

## 13. List All Payments

Retrieve all your created payments for reporting or analysis.

```
GET /payment
```

**Optional Query Parameters**

| Name     | Type    | Description                                        |
| :------- | :------ | :------------------------------------------------- |
| `limit`  | Integer | Number of results to return (default 10, max 100). |
| `offset` | Integer | Pagination offset.                                 |
| `sortBy` | String  | Field to sort by (e.g. `created_at`).              |
| `order`  | String  | `asc` or `desc`.                                   |

**Example Response**

```json
{
  "data": [
    {
      "payment_id": 839217,
      "payment_status": "finished",
      "price_amount": 49.99,
      "price_currency": "usd",
      "pay_currency": "btc",
      "pay_amount": 0.001234,
      "created_at": "2025-11-07T10:15:00Z"
    },
    {
      "payment_id": 839218,
      "payment_status": "waiting",
      "price_amount": 12.5,
      "price_currency": "eur",
      "pay_currency": "eth",
      "pay_amount": 0.00431,
      "created_at": "2025-11-07T10:45:00Z"
    }
  ],
  "total": 2,
  "limit": 100,
  "offset": 0
}
```

---

## 14. Invoices

NOWPayments lets you create hosted invoices with a single URL to collect payment for any amount.

---

### **Create Invoice**

```
POST /invoice
```

**Request Example**

```json
{
  "price_amount": 19.99,
  "price_currency": "usd",
  "order_id": "INV-2025-001",
  "order_description": "1-Month Game Pass",
  "ipn_callback_url": "https://bitloot.io/api/ipn",
  "success_url": "https://bitloot.io/success",
  "cancel_url": "https://bitloot.io/cancel"
}
```

**Response**

```json
{
  "id": 44201,
  "invoice_url": "https://nowpayments.io/invoice/44201",
  "status": "waiting",
  "price_amount": 19.99,
  "price_currency": "usd",
  "pay_currency": "btc",
  "order_id": "INV-2025-001",
  "created_at": "2025-11-07T11:00:00Z"
}
```

---

### **Invoice Statuses**

| Status       | Description                      |
| :----------- | :------------------------------- |
| `waiting`    | Awaiting payment from customer.  |
| `confirming` | Transaction seen on network.     |
| `finished`   | Invoice paid successfully.       |
| `expired`    | Invoice expired without payment. |

---

### **Get Invoice Details**

```
GET /invoice/{invoice_id}
```

**Response**

```json
{
  "id": 44201,
  "status": "finished",
  "price_amount": 19.99,
  "price_currency": "usd",
  "pay_currency": "btc",
  "order_id": "INV-2025-001",
  "invoice_url": "https://nowpayments.io/invoice/44201",
  "created_at": "2025-11-07T11:00:00Z",
  "updated_at": "2025-11-07T11:07:00Z"
}
```

---

### **List All Invoices**

```
GET /invoice
```

**Optional Filters:** `limit`, `offset`, `status`.

**Response**

```json
{
  "data": [
    {
      "id": 44201,
      "status": "finished",
      "price_amount": 19.99,
      "price_currency": "usd",
      "pay_currency": "btc"
    },
    {
      "id": 44202,
      "status": "waiting",
      "price_amount": 29.5,
      "price_currency": "eur",
      "pay_currency": "eth"
    }
  ],
  "total": 2
}
```

---

### **Cancel Invoice**

```
DELETE /invoice/{invoice_id}
```

**Response**

```json
{
  "status": "success",
  "message": "Invoice #44201 has been canceled."
}
```

---

### **Reissue Invoice**

```
POST /invoice/{invoice_id}/reissue
```

Recreates a new invoice link for the same order when the previous one expired.

**Response**

```json
{
  "status": "success",
  "new_invoice_url": "https://nowpayments.io/invoice/44203"
}
```

---

### _Part 3 – Webhooks / IPN Callbacks and Payment Notifications_

---

## 15. Introduction to IPN (Instant Payment Notifications)

**IPN** (Instant Payment Notification) allows your server to receive automatic callbacks when a payment or invoice status changes.
When a buyer sends crypto, NOWPayments confirms the transaction on-chain and then posts an HTTP `POST` request to your `ipn_callback_url`.

This ensures your backend updates order status without polling the API.

---

## 16. How IPN Works — Event Flow

1. Customer initiates a payment through NOWPayments.
2. NOWPayments creates a payment record and returns a `payment_url`.
3. Customer sends crypto to the generated `pay_address`.
4. After detection, NOWPayments verifies network confirmations.
5. Each status update triggers an HTTP `POST` callback to your `ipn_callback_url`.
6. Your server responds `200 OK` to confirm successful reception.

---

## 17. IPN Configuration

- Define `ipn_callback_url` when creating a payment or invoice.
- The URL must be publicly reachable over HTTPS.
- It should accept `POST` requests with `Content-Type: application/json`.
- Return HTTP `200 OK` within 5 seconds to prevent retries.

Example creation payload with IPN URL:

```json
{
  "price_amount": 49.99,
  "price_currency": "usd",
  "ipn_callback_url": "https://bitloot.io/api/ipn"
}
```

---

## 18. IPN Request Body Example

```json
{
  "payment_id": 839217,
  "payment_status": "confirmed",
  "pay_address": "bc1qnw6k7g8s...xyz",
  "price_amount": 49.99,
  "price_currency": "usd",
  "pay_amount": 0.001234,
  "actually_paid": 0.001234,
  "pay_currency": "btc",
  "order_id": "ORDER-001",
  "order_description": "BitLoot digital key purchase #001",
  "purchase_id": "np-1283-xyz",
  "created_at": "2025-11-07T10:15:00Z",
  "updated_at": "2025-11-07T10:22:00Z"
}
```

---

## 19. IPN Statuses and Actions

| Status       | Description                                  | Recommended Action                  |
| :----------- | :------------------------------------------- | :---------------------------------- |
| `waiting`    | Payment created; waiting for funds.          | Display “Awaiting Payment.”         |
| `confirming` | Transaction detected; confirmations pending. | Mark order as “Processing.”         |
| `confirmed`  | Network confirmations complete.              | Prepare to deliver digital goods.   |
| `finished`   | Payment successfully settled.                | Fulfill order; send key or license. |
| `failed`     | Payment failed or expired.                   | Cancel order or notify customer.    |
| `refunded`   | Refund issued by merchant or system.         | Adjust inventory / balance.         |

---

## 20. Verifying IPN Authenticity

Each IPN includes headers that allow you to validate the source of the notification.

### IPN Headers

| Header              | Type   | Purpose                                     |
| :------------------ | :----- | :------------------------------------------ |
| `x-nowpayments-sig` | String | Signature for validating payload integrity. |
| `x-api-key`         | String | Your API key (for cross-checking).          |

### Signature Verification Procedure

1. Retrieve the `x-nowpayments-sig` header from the request.
2. Concatenate the received JSON body as string.
3. Generate an HMAC-SHA512 hash using your API secret key.
4. Compare your hash to the signature header. If they match, the IPN is authentic.

Pseudo-example (in JavaScript):

```js
import crypto from 'crypto';
function verifyIPN(signature, body, apiKey) {
  const hmac = crypto.createHmac('sha512', apiKey).update(JSON.stringify(body)).digest('hex');
  return hmac === signature;
}
```

---

## 21. IPN Retries and Timeouts

If your server does not return HTTP `200 OK`, NOWPayments will retry delivery.

| Attempt | Delay      |
| :------ | :--------- |
| 1st     | Immediate  |
| 2nd     | 5 minutes  |
| 3rd     | 30 minutes |
| 4th     | 1 hour     |
| Final   | 12 hours   |

After the final attempt, the notification is marked as failed and logged on NOWPayments for manual review.

---

## 22. Sample Server-Side Handler (Python Flask)

```python
from flask import Flask, request
import hmac, hashlib, json

app = Flask(__name__)
API_KEY = "YOUR_API_KEY"

@app.route("/api/ipn", methods=["POST"])
def handle_ipn():
    signature = request.headers.get("x-nowpayments-sig")
    body = request.get_data(as_text=True)
    calculated = hmac.new(API_KEY.encode(), body.encode(), hashlib.sha512).hexdigest()
    if signature != calculated:
        return "Invalid signature", 403
    data = json.loads(body)
    status = data.get("payment_status")
    if status == "finished":
        # Fulfill order delivery here
        pass
    return "OK", 200
```

---

## 23. Testing IPN in Sandbox Mode

In sandbox mode, IPN calls are sent to your test `ipn_callback_url` using testnet coins.
You can simulate status updates (`waiting → confirming → finished`) to verify your listener logic.

---

## 24. Best Practices for IPN Integration

- Always verify signatures before trusting callbacks.
- Log every IPN with timestamp and status for audit trails.
- Update your database idempotently — handle duplicate notifications gracefully.
- Respond `200 OK` quickly; perform heavy tasks async.
- Use secure HTTPS endpoints and strong TLS certificates.

---

### _Part 4 – Payouts, Conversions, and Mass Payouts_

---

## 25. Overview of Payouts

The **Payout API** allows you to send funds directly to one or multiple crypto addresses.
This is useful for merchant settlements, affiliate rewards, withdrawals, and partner payments.

All payout requests require **Bearer authorization** and your **API key**.

---

## 26. Authentication for Payouts

Headers:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

Ensure your account has sufficient balance before initiating payouts.

---

## 27. Create a Single Payout

### **Endpoint**

```
POST /payout
```

### **Request Example**

```json
{
  "address": "bc1qexampleaddressxyz123",
  "amount": 0.005,
  "currency": "btc",
  "ipn_callback_url": "https://bitloot.io/api/payouts/ipn"
}
```

### **Parameters**

| Field              | Type   | Required | Description                           |
| :----------------- | :----- | :------- | :------------------------------------ |
| `address`          | String | ✅       | Destination wallet address.           |
| `amount`           | Number | ✅       | Amount to send in crypto.             |
| `currency`         | String | ✅       | Crypto ticker (btc, eth, usdt, etc.). |
| `ipn_callback_url` | String | Optional | Callback for payout status updates.   |

---

### **Response**

```json
{
  "id": 771201,
  "status": "waiting",
  "address": "bc1qexampleaddressxyz123",
  "amount": 0.005,
  "currency": "btc",
  "tx_hash": null,
  "fee": 0.0001,
  "created_at": "2025-11-07T11:30:00Z"
}
```

### **Status Codes**

| Status      | Description                                              |
| :---------- | :------------------------------------------------------- |
| `waiting`   | Created, awaiting processing.                            |
| `sent`      | Broadcasted to blockchain.                               |
| `confirmed` | Transaction confirmed on-chain.                          |
| `failed`    | Payout failed (insufficient balance or invalid address). |

---

## 28. Retrieve Payout by ID

```
GET /payout/{id}
```

**Example**

```bash
curl -X GET "https://api.nowpayments.io/v1/payout/771201" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-api-key: YOUR_API_KEY"
```

**Response**

```json
{
  "id": 771201,
  "status": "confirmed",
  "address": "bc1qexampleaddressxyz123",
  "amount": 0.005,
  "currency": "btc",
  "tx_hash": "a8c4f2d7e89abcd123456789...",
  "fee": 0.0001,
  "created_at": "2025-11-07T11:30:00Z",
  "confirmed_at": "2025-11-07T11:45:00Z"
}
```

---

## 29. List All Payouts

```
GET /payout
```

**Query Parameters**

| Parameter | Description                     |
| :-------- | :------------------------------ |
| `limit`   | Number of results (default 10). |
| `offset`  | Pagination offset.              |
| `status`  | Filter by payout status.        |

**Response Example**

```json
{
  "data": [
    {
      "id": 771201,
      "status": "confirmed",
      "currency": "btc",
      "amount": 0.005,
      "tx_hash": "a8c4f2d7e89abcd123456789..."
    },
    {
      "id": 771202,
      "status": "waiting",
      "currency": "eth",
      "amount": 0.07,
      "tx_hash": null
    }
  ],
  "total": 2
}
```

---

## 30. Payout Notifications (IPN)

If you provide an `ipn_callback_url`, NOWPayments will notify your system about payout progress.

### **Example Callback Payload**

```json
{
  "payout_id": 771201,
  "status": "confirmed",
  "amount": 0.005,
  "currency": "btc",
  "tx_hash": "a8c4f2d7e89abcd123456789...",
  "fee": 0.0001,
  "created_at": "2025-11-07T11:30:00Z"
}
```

**You should respond with:**

```http
HTTP/1.1 200 OK
```

---

## 31. Mass Payouts (Bulk Payments)

You can create multiple payouts in one request.

### **Endpoint**

```
POST /payouts
```

### **Request Example**

```json
{
  "payouts": [
    {
      "address": "bc1qa111exampleaddress",
      "amount": 0.001,
      "currency": "btc"
    },
    {
      "address": "0xB123exampleaddress",
      "amount": 50,
      "currency": "usdt"
    }
  ],
  "ipn_callback_url": "https://bitloot.io/api/payouts/ipn"
}
```

---

### **Response**

```json
{
  "batch_id": "payout-batch-20251107",
  "total_payouts": 2,
  "total_amount": 50.001,
  "status": "waiting",
  "created_at": "2025-11-07T11:35:00Z"
}
```

**Possible Batch Statuses**

| Status       | Meaning                               |
| :----------- | :------------------------------------ |
| `waiting`    | Batch created and queued.             |
| `processing` | Sending transactions.                 |
| `completed`  | All payouts sent successfully.        |
| `partial`    | Some payouts failed.                  |
| `failed`     | Batch rejected or insufficient funds. |

---

## 32. Retrieve Mass Payout Details

```
GET /payouts/{batch_id}
```

**Response Example**

```json
{
  "batch_id": "payout-batch-20251107",
  "status": "completed",
  "total_payouts": 2,
  "total_amount": 50.001,
  "payouts": [
    {
      "id": 771201,
      "status": "confirmed",
      "currency": "btc",
      "amount": 0.001,
      "tx_hash": "a8c4f2d7e89abcd123456789..."
    },
    {
      "id": 771202,
      "status": "confirmed",
      "currency": "usdt",
      "amount": 50,
      "tx_hash": "b91a6c2f7d23de987654321..."
    }
  ]
}
```

---

## 33. Cancel a Pending Payout

```
DELETE /payout/{id}
```

Cancels a payout before it’s broadcast to the blockchain.

**Response Example**

```json
{
  "status": "success",
  "message": "Payout #771201 has been canceled."
}
```

---

## 34. Currency Conversion API

NOWPayments offers currency conversion if you want to auto-convert crypto payments or balances between assets.

### **Endpoint**

```
POST /conversion
```

**Request Example**

```json
{
  "from_currency": "btc",
  "to_currency": "usdt",
  "amount": 0.01
}
```

**Response**

```json
{
  "conversion_id": "conv-20251107-abc123",
  "from_currency": "btc",
  "to_currency": "usdt",
  "amount": 0.01,
  "converted_amount": 690.45,
  "rate": 69045.0,
  "status": "completed"
}
```

---

### **Conversion Statuses**

| Status       | Description                         |
| :----------- | :---------------------------------- |
| `waiting`    | Request created, not yet processed. |
| `processing` | Conversion in progress.             |
| `completed`  | Successfully converted.             |
| `failed`     | Error during conversion.            |

---

## 35. Retrieve Conversion History

```
GET /conversion
```

**Response Example**

```json
{
  "data": [
    {
      "conversion_id": "conv-20251107-abc123",
      "from_currency": "btc",
      "to_currency": "usdt",
      "amount": 0.01,
      "converted_amount": 690.45,
      "rate": 69045.0,
      "status": "completed"
    }
  ],
  "total": 1
}
```

---

### _Part 5 – Statuses, Errors, Utilities, and Reference Tables_

---

## 36. Payment and Invoice Status Reference

The following tables summarize all statuses used across payments, invoices, payouts, and conversions.

### **Payments & Invoices**

| Status       | Meaning                                               |
| :----------- | :---------------------------------------------------- |
| `waiting`    | Payment created; awaiting cryptocurrency deposit.     |
| `confirming` | Transaction detected; confirmations pending.          |
| `confirmed`  | Required confirmations received; processing complete. |
| `finished`   | Fully processed; funds settled successfully.          |
| `failed`     | Payment failed, timed out, or underpaid.              |
| `refunded`   | Refund sent back to customer.                         |
| `expired`    | Invoice or payment expired without completion.        |

### **Payouts**

| Status      | Meaning                                             |
| :---------- | :-------------------------------------------------- |
| `waiting`   | Payout created; queued for sending.                 |
| `sent`      | Broadcasted to blockchain.                          |
| `confirmed` | Confirmed on-chain.                                 |
| `failed`    | Payout failed due to error or insufficient balance. |

### **Conversions**

| Status       | Meaning                                      |
| :----------- | :------------------------------------------- |
| `waiting`    | Conversion created.                          |
| `processing` | Exchange in progress.                        |
| `completed`  | Successfully converted.                      |
| `failed`     | Error during conversion or unsupported pair. |

### **Mass Payout (Batch) Statuses**

| Status       | Meaning                                |
| :----------- | :------------------------------------- |
| `waiting`    | Batch created and waiting.             |
| `processing` | Transactions being sent.               |
| `completed`  | All payouts confirmed.                 |
| `partial`    | Some payouts succeeded; others failed. |
| `failed`     | Batch could not be processed.          |

---

## 37. Common Error Responses

Every error response includes a JSON object with `status`, `message`, and (if available) `code`.

**Example:**

```json
{
  "status": "error",
  "message": "Invalid API key or authentication required",
  "code": 401
}
```

### **Error Codes**

| Code | Description           | Possible Resolution                            |
| :--- | :-------------------- | :--------------------------------------------- |
| 400  | Bad Request           | Check required fields and data types.          |
| 401  | Unauthorized          | Invalid or missing API key / token.            |
| 403  | Forbidden             | Insufficient permissions for the action.       |
| 404  | Not Found             | Resource or endpoint does not exist.           |
| 405  | Method Not Allowed    | Use the correct HTTP verb (e.g. POST vs GET).  |
| 409  | Conflict              | Duplicate or conflicting request.              |
| 422  | Unprocessable Entity  | Validation failed (e.g. unsupported currency). |
| 429  | Too Many Requests     | Rate limit exceeded — wait and retry.          |
| 500  | Internal Server Error | Temporary backend issue — try again later.     |
| 503  | Service Unavailable   | System maintenance or downtime.                |

---

## 38. Utility Endpoints

### **List Supported Currencies**

```
GET /currencies
```

**Response**

```json
[
  { "currency": "btc", "name": "Bitcoin", "type": "coin" },
  { "currency": "eth", "name": "Ethereum", "type": "coin" },
  { "currency": "usdt", "name": "Tether (ERC20)", "type": "token" },
  { "currency": "bnb", "name": "BNB (BEP20)", "type": "token" }
]
```

---

### **Get Minimum Payment Amount**

```
GET /min-amount/{currency}
```

**Example**

```bash
curl -X GET "https://api.nowpayments.io/v1/min-amount/btc" \
  -H "x-api-key: YOUR_API_KEY"
```

**Response**

```json
{ "currency": "btc", "min_amount": 0.0001 }
```

---

### **Estimate Conversion Rate**

```
GET /estimate
```

**Request**

```json
{
  "amount_from": 0.01,
  "currency_from": "btc",
  "currency_to": "usdt"
}
```

**Response**

```json
{
  "amount_from": 0.01,
  "currency_from": "btc",
  "currency_to": "usdt",
  "estimated_amount": 690.45,
  "rate": 69045.0
}
```

---

### **Get Balance**

```
GET /balance
```

Returns the current balance of your NOWPayments account for all currencies.

**Response**

```json
{
  "balances": [
    { "currency": "btc", "balance": 0.042 },
    { "currency": "eth", "balance": 1.25 },
    { "currency": "usdt", "balance": 5500.0 }
  ]
}
```

---

## 39. Rate Limiting and Headers

All API responses include rate-limit headers so you can throttle requests appropriately.

| Header                  | Description                               |
| :---------------------- | :---------------------------------------- |
| `X-RateLimit-Limit`     | Maximum requests per minute.              |
| `X-RateLimit-Remaining` | Requests remaining in the current window. |
| `X-RateLimit-Reset`     | Time (in seconds) until reset.            |

---

## 40. Security Practices Summary

- Use only `https://` for all API calls.
- Keep API keys and tokens confidential and off client code.
- Validate every IPN signature with HMAC-SHA512.
- Rotate API keys periodically and delete unused ones.
- Enable 2FA and strong passwords on dashboard.
- Log and monitor API responses for errors and rate limits.

---

## 41. Example End-to-End Flow

1️⃣ Create a payment with `POST /payment`.
2️⃣ Redirect user to the `payment_url`.
3️⃣ NOWPayments detects incoming crypto.
4️⃣ IPN callback sends `payment_status: confirmed / finished`.
5️⃣ Your server verifies signature and marks order paid.
6️⃣ Deliver digital product (e.g., via Kinguin API fulfillment).
7️⃣ (Optional) Convert funds or initiate payout to your wallet.

---

## 42. API Changelog (Simplified)

| Version | Date | Highlights                                       |
| :------ | :--- | :----------------------------------------------- |
| v1.0    | 2021 | Initial release with payments and invoices.      |
| v1.1    | 2022 | Added IPN signatures and conversion endpoints.   |
| v1.2    | 2023 | Introduced payout and mass payout features.      |
| v1.3    | 2024 | Enhanced authentication and rate-limit headers.  |
| v1.4    | 2025 | Added sandbox test mode and multi-token support. |

---

## 43. Support and Contact

For technical questions and integration help:

- 📧 **[support@nowpayments.io](mailto:support@nowpayments.io)** – General and merchant support.
- 🧭 **[https://nowpayments.io](https://nowpayments.io)** – Official portal and docs.
- 💬 Community channels – Discord / Telegram for developer discussions.

---

### _Part 6 – Advanced Integration & Security Extensions_

---

## 44. Standard E-commerce Flow for NOWPayments API

Follow these steps to process payments via the API and your store UI.

1. **API** – Check API availability using **GET API status**.
   Optionally, get the list of available payment currencies with **GET available currencies**.
2. **UI** – Let the customer select items to determine the total sum.
3. **UI** – Ask the customer to choose a payment currency.
4. **API** – Use **GET Minimum payment amount** for the chosen currency pair (payment → payout-wallet currency).
5. **API** – Use **GET Estimated price** to calculate the total crypto amount and confirm it’s above the minimum.
6. **API** – Call **POST Create payment** to obtain the deposit address (e.g., a generated BTC wallet).
7. **UI** – Prompt the customer to send funds to that address.
8. **UI / NOWPayments** – NOWPayments receives, exchanges (if needed), and settles funds to your payout wallet.
9. **API** – Track payment status via **IPN callbacks** or **GET Payment Status**, and display progress to the customer.
10. **API** – List account payments using **GET List of payments**.
11. **Dashboard** – All data is visible in your NOWPayments account.

---

## 45. Alternative Flow (with Invoice)

1. **API** – Check API status and currencies.
2. **UI** – Select items + payment currency.
3. **API** – Get Minimum payment amount.
4. **API** – Get Estimated price.
5. **API** – Call **POST Create invoice**, set a `success_url` to redirect users after payment.
6. **UI** – Display or redirect to the generated invoice URL.
7. **NOWPayments** – Customer pays and is redirected back to your site (`success_url`).
8. **API / IPN** – Monitor payment status until processed.
9. **API** – List payments via **GET List of payments**.
10. **Dashboard** – View all transactions on the NOWPayments website.

---

## 46. Instant Payment Notifications (IPN)

### Steps to Enable IPN

1. Generate and save the **IPN Secret Key** under _Dashboard → Payment Settings_.

   > 🔒 Visible only once — save immediately.

2. Provide your public callback URL in each `create_payment` request using `ipn_callback_url`.
3. Ensure the endpoint is accessible (no localhost) and accepts HTTPS POST requests.
4. Allow NOWPayments IP addresses through any firewall / Cloudflare rules.
   → Request IP list from **[partners@nowpayments.io](mailto:partners@nowpayments.io)**.
5. You will receive POST requests with the same parameters as **GET Payment Status** responses.
6. Verify the request signature:
   - Sort the JSON body by keys (`JSON.stringify(params, Object.keys(params).sort())`).
   - Sign the string with HMAC SHA-512 using your IPN Secret Key.
   - Compare the result with the header `x-nowpayments-sig`.
   - If equal → valid; otherwise contact [support@nowpayments.io](mailto:support@nowpayments.io).

---

### Example – Node.js Signature Creation

```js
function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((r, k) => {
      r[k] = obj[k] && typeof obj[k] === 'object' ? sortObject(obj[k]) : obj[k];
      return r;
    }, {});
}
const hmac = crypto.createHmac('sha512', notificationsKey);
hmac.update(JSON.stringify(sortObject(params)));
const signature = hmac.digest('hex');
```

### Example – PHP Comparison

```php
function tksort(&$array){
  ksort($array);
  foreach(array_keys($array) as $k){
    if(gettype($array[$k])=="array"){ tksort($array[$k]); }
  }
}
function check_ipn_request_is_valid(){
  $auth_ok = false;
  if(isset($_SERVER['HTTP_X_NOWPAYMENTS_SIG'])){
    $recived_hmac = $_SERVER['HTTP_X_NOWPAYMENTS_SIG'];
    $request_json = file_get_contents('php://input');
    $request_data = json_decode($request_json, true);
    tksort($request_data);
    $sorted = json_encode($request_data, JSON_UNESCAPED_SLASHES);
    $hmac = hash_hmac("sha512", $sorted, trim($this->ipn_secret));
    if($hmac == $recived_hmac){ $auth_ok = true; }
  }
}
```

### Example – Python Verification

```python
import json, hmac, hashlib
def np_signature_check(secret, x_sig, message):
    sorted_msg = json.dumps(message, separators=(',', ':'), sort_keys=True)
    digest = hmac.new(str(secret).encode(), f'{sorted_msg}'.encode(), hashlib.sha512)
    if digest.hexdigest() == x_sig:
        return True
    print("HMAC signature does not match")
    return False
```

### Notes

- You may receive multiple notifications for each status step.
- Webhooks trigger automatically when transaction status changes.
- You can manually request an extra IPN via your Dashboard.
- Test IPN delivery before production.

---

## 47. Recurrent Payment Notifications

- If an error occurs, NOWPayments re-sends notifications.
- The retry count and timeout are configurable under _Payment Settings → Instant Payment Notifications_.
- Example: timeout = 1 min & retries = 3 → three additional callbacks every 1 minute on failure.

---

## 48. Webhook Examples

### Payment

```json
{
  "payment_id": 123456789,
  "parent_payment_id": 987654321,
  "invoice_id": null,
  "payment_status": "finished",
  "pay_address": "address",
  "price_amount": 1,
  "price_currency": "usd",
  "pay_amount": 15,
  "actually_paid": 15,
  "pay_currency": "trx",
  "purchase_id": "123456789",
  "outcome_amount": 14.8106,
  "outcome_currency": "trx",
  "fee": {
    "currency": "btc",
    "depositFee": 0.09853637216235617,
    "withdrawalFee": 0,
    "serviceFee": 0
  }
}
```

### Withdrawal

```json
{
  "id": "123456789",
  "batch_withdrawal_id": "987654321",
  "status": "CREATING",
  "currency": "usdttrc20",
  "amount": "50",
  "address": "address",
  "ipn_callback_url": "callback_url",
  "created_at": "2023-07-27T15:29:40.803Z"
}
```

### Custodial Recurring Payment

```json
{
  "id": "1234567890",
  "status": "FINISHED",
  "currency": "trx",
  "amount": "12.171365564140688",
  "ipn_callback_url": "callback_url",
  "created_at": "2023-07-26T14:20:11.531Z",
  "updated_at": "2023-07-26T14:20:21.079Z"
}
```

---

## 49. Repeated Deposits (Re-deposits)

- Additional payments to the same deposit address after the original is completed.
- Processed at the **current exchange rate** on receipt.
- Labeled _Re-deposit_ in dashboard; `parent_payment_id` links to original.

**Integration Tips**

- Track `parent_payment_id` in IPNs.
- Handle “partially paid” and “finished” statuses cautiously—avoid auto-delivery on partials.
- Re-deposits convert to the same asset as the original.
- If you want all re-deposits to be marked “finished,” contact **[support@nowpayments.io](mailto:support@nowpayments.io)**.

---

## 50. Wrong-Asset Deposits

- Occur when users send the wrong network or asset (e.g., USDT ERC20 instead of ETH).
- Displayed as _Wrong Asset_ in dashboard and usually require manual review.

**Integration Tips**

- Compare asset type + amount + `parent_payment_id` in IPNs.
- To auto-process, enable **Wrong-Asset Deposits Auto-Processing** under _Settings → Payment → Payment details_.
- These auto-processed deposits default to **Finished** status (optionally _Partially Paid_).
- Understand that final sums may differ from expectations.

---

## 51. SDK / Package Resources

| Language         | Package / Link                                                                                    |
| :--------------- | :------------------------------------------------------------------------------------------------ |
| JavaScript       | Official JS SDK – Included with Dashboard integrations                                            |
| PHP              | [nowpayments/nowpayments-api-php](https://packagist.org/packages/nowpayments/nowpayments-api-php) |
| More coming soon | –                                                                                                 |

---

## 52. Two-Factor Payout Verification

To finalize a payout, verify it via **2FA** within one hour of creation.

### Endpoint

```
POST /payout/:batch-withdrawal-id/verify
```

### Headers

```http
x-api-key: YOUR_API_KEY
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Body

```json
{ "verification_code": "123456" }
```

### Notes

- You have **10 attempts** to verify.
- Unverified payouts remain **creating** for 1 hour, then auto-reject.
- Verification code comes from your 2FA app or email.
- For automatic verification, use libraries such as **Speakeasy** (JS) to generate TOTP codes.

**Node.js Example**

```js
const code = speakeasy.totp({
  secret: 'your_2fa_secret_key',
  encoding: 'base32',
});
```

### Example Request

```bash
curl --location 'https://api.nowpayments.io/v1/payout/5000000191/verify' \
--header 'x-api-key: YOUR_API_KEY' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--header 'Content-Type: application/json' \
--data '{ "verification_code": "123456" }'
```

**Example Response**

```json
{ "status": "OK" }
```

---

## 53. Get Payout Status

```
GET /payout/<payout_id>
```

Retrieve payout information using the same API key as for creation.

**Statuses**
`creating`, `processing`, `sending`, `finished`, `failed`, `rejected`.

**Response Example**

```json
[
  {
    "id": "<payout_id>",
    "address": "<payout_address>",
    "currency": "trx",
    "amount": "200",
    "batch_withdrawal_id": "<batchWithdrawalId>",
    "status": "WAITING",
    "created_at": "2020-11-12T17:06:12.791Z"
  }
]
```

---

## 54. List of Payouts

```
GET /payout
```

### Query Parameters

| Name                    | Description                                                          |
| :---------------------- | :------------------------------------------------------------------- |
| `batch_id`              | Filter by batch ID.                                                  |
| `status`                | Filter by payout status.                                             |
| `order_by`              | `id`, `batchId`, `dateCreated`, `dateUpdated`, `currency`, `status`. |
| `order`                 | `asc` or `desc`.                                                     |
| `date_from` / `date_to` | Time range.                                                          |
| `limit`                 | Number of results.                                                   |
| `page`                  | Page index.                                                          |

---

**End of documentation**
