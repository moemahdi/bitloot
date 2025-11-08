# Integrating Resend Email Service into BitLoot (NestJS + REST API)

## Overview

This guide provides a comprehensive walkthrough for integrating the Resend email service (via REST API) into the BitLoot store’s NestJS backend. We will implement email-based OTP verification for login/signup, password reset emails, transactional notifications (order status), and optional promotional campaign support. We’ll cover how to generate and validate OTP codes with Redis, manage rate limiting to prevent abuse, set up Resend email templates, and ensure security best practices (API keys, HMAC tokens, etc.). Clear code examples and architecture notes are included to illustrate a production-ready implementation.

---

## 1. Email Verification via OTP (One-Time Password)

### Goal

When a user signs up or logs in, BitLoot should verify their email by sending a one-time password (OTP) to that address. The user must provide the correct 6-digit code within a short window (e.g. 5 minutes) to verify their account.

### OTP Generation & Storage

When a verification is needed, generate a secure 6-digit OTP code. Use a cryptographically strong method (e.g. Node’s `crypto.randomInt(0, 1000000)` and zero-pad to 6 digits) to avoid predictability. The OTP should then be stored in Redis with a short TTL (time-to-live), such as 5 minutes. Storing OTPs in Redis is fast and convenient – Redis allows setting an expiry so the code auto-deletes after the TTL, ensuring it cannot be reused past the expiration
psoc-docs.pages.dev
. For example, using a Redis key like `otp:verify:<email>` with value equal to the code and `EXPIRE = 300 seconds (5 minutes)`. This makes OTP storage ephemeral and memory-resident for quick access
psoc-docs.pages.dev.

### Rate Limiting OTP Requests

Implement a check to limit how often OTPs can be sent to the same email or IP. A common rule is to allow at most 3 OTP emails per 15 minutes per user/email address (and possibly per IP). Using Redis counters is an effective strategy here
dip-mazumder.medium.com
dip-mazumder.medium.com.
For example, maintain a key like `otp:requests:<email>` and increment it whenever an OTP is requested. On first request, set an expiry of 15 minutes on this counter. If the count exceeds 3 in that window, refuse to send a new OTP (and respond with a message like “Too many verification attempts, please try later”). This prevents abuse by spamming the endpoint
dip-mazumder.medium.com.

**Pseudocode:**

```ts
// Pseudocode for rate limiting OTP requests
const key = `otp:requests:${email}`;
const attempts = await redis.incr(key);
if (attempts === 1) {
  await redis.expire(key, 900); // 15 minutes in seconds
}
if (attempts > 3) {
  throw new TooManyRequestsException('Too many OTP requests. Try again later.');
}
```

By leveraging Redis atomic operations like INCR and expiry, we efficiently enforce a sliding window limit
dip-mazumder.medium.com
dip-mazumder.medium.com.
This protects against mass-request attacks while allowing legitimate use.

### Sending the OTP via Resend

Once an OTP is generated and stored, send it to the user’s email using the Resend REST API. BitLoot will use Resend’s transactional email endpoint (`POST https://api.resend.com/emails`) with an API key for authentication (bearer token)
resend.com.
We recommend creating a dedicated MailService in NestJS for sending emails (we’ll outline this service in section 8). This service can use Nest’s HttpService (Axios) to call Resend’s API.

Resend supports either sending raw HTML content or using pre-defined templates. Using a template is ideal for OTP emails: you can design an email template in the Resend dashboard with a placeholder for the OTP code (e.g. `{{CODE}}`). Then your API request can simply reference the template by ID and pass the dynamic code value.

**Example JSON payload:**

```json
{
  "from": "BitLoot <no-reply@bitloot.com>",
  "to": ["user@example.com"],
  "subject": "Your BitLoot Verification Code",
  "template": {
    "id": "bitloot-otp-code",
    "variables": { "CODE": "123456" }
  }
}
```

Using Resend templates this way means you don’t send the HTML from your backend; Resend will merge the CODE variable into the stored template and send the email
resend.com
resend.com.
Ensure the template is published on Resend (only published templates can be used via API)
resend.com.
Alternatively, you could send an `html` field directly with the OTP (for a simple text email), but templates allow for consistent styling and easier updates.

### Example – OTP Email Template

In Resend’s dashboard, create a template (e.g. “Email Verification Code”) with content like:

```html
<p>Hi,</p>
<p>Your BitLoot verification code is <strong>{{CODE}}</strong>.</p>
<p>This code will expire in 5 minutes. If you didn't request this, please ignore this email.</p>
```

Publish this template and note its ID or alias. The MailService will use that ID and inject the 6-digit CODE variable when calling Resend. (As Resend docs note, if a template is provided in the API call, do not also send an `html` or `text` field, or it will error
resend.com.)

### Validating the OTP

When the user submits the code back to BitLoot (via a verify API endpoint), retrieve the code from Redis and compare. The verification logic is straightforward:

- Accept input: email and OTP code.
- Look up the stored code in Redis for that email (`GET otp:verify:<email>`).
- If no code is found (key expired or doesn’t exist), respond that the code is invalid or expired.
- If found, compare the stored code with the user’s input. If they match, the email is verified (you can mark the user’s account/email as confirmed in your database). Then delete that Redis key (or let it expire naturally, but it’s good to proactively remove on success).
- If they do not match, increment an attempt counter (optionally) and respond with an error.

### Preventing Brute-force on OTP Verification

To prevent guessing the OTP, you should also rate-limit the verification attempts. For example, allow perhaps 5 attempts per code. You can track attempts in Redis (e.g. a key `otp:attempts:<email>`) and if it exceeds the limit, invalidate the OTP (delete it) and force the user to request a new one. This mitigates online brute-force attempts. Given a 6-digit numeric code has 1,000,000 possibilities, limiting attempts is crucial. Additionally, because the OTP expires quickly (5 minutes) and is one-time use, the window for brute force is very small. Still, implement checks to lock out or regenerate after several failures.

### OTP Flow Summary

Putting it all together, the OTP verification flow works like this: **OTP generation and verification flow using Redis and background job queue.** BitLoot’s backend generates a one-time code, stores it in Redis with a short TTL, and sends it via Resend to the user’s email
psoc-docs.pages.dev.
The user submits the code to the verify endpoint; the application checks Redis for a match (ensuring the code is correct and not expired)
psoc-docs.pages.dev.
Rate limiting is enforced at both the generation step (to avoid spam) and verification step (to prevent brute force). This architecture ensures the OTP is valid only once and for a limited time, greatly enhancing security.

---

## 2. Password Reset Flow

### Goal

Allow users who forget their password to reset it via email verification. The flow typically involves the user entering their email, receiving a secure reset token or code, and using that to set a new password.

### Initiating Password Reset

Provide an endpoint (e.g. `POST /auth/request-password-reset`) where the user submits their email. On receiving a request, if the email corresponds to a valid account, generate a **password reset token**. This token can be a random secure string (for example, a 32-byte random value hex-encoded, or a UUID). It should be unpredictable and single-use. As with OTP, we can store this token in Redis or a database with an expiration (commonly 15 or 30 minutes TTL)
authgear.com
nagibaba.medium.com.
For instance, store a key `pwdreset:<userId> -> token`, with TTL = 30 minutes. Alternatively, you can store a hash of the token for extra security (store a SHA-256 hash in DB, email the raw token, and verify by comparing hashes). This way, if your storage is compromised, the attacker still can’t use the token
security.stackexchange.com
dev.to.

### Sending Reset Email

Send the password reset link or code to the user via Resend. Typically, a **reset link** is more user-friendly: e.g. `https://bitloot.com/reset-password?token=<token>`. The email content should include a clear call-to-action (button or link) for the user to reset their password. Using a Resend template can simplify this. For example, create a “Password Reset” email template with a variable for a **reset URL**. You might include the user’s first name for personalization as well. The template could be like:

```html
<p>Hi {{FIRST_NAME}},</p>
<p>You requested to reset your BitLoot password. Click the link below to set a new password:</p>
<p><a href="{{RESET_LINK}}">Reset My Password</a></p>
<p>
  If you did not request this, you can ignore this email. This link will expire in 30 minutes for
  your security.
</p>
```

Here `RESET_LINK` would be a variable containing the full URL with the token. When your NestJS backend calls Resend’s API to send this email, pass the template ID and variables: `{ "RESET_LINK": "<generated_url>" }`. Ensure the `RESET_LINK` contains the token and perhaps an identifier for the user (or the token itself is sufficiently encoded to identify the user).

### HMAC-Signed Token (Alternative)

As a security best practice, consider using an HMAC-signed token instead of storing tokens in a database. In this approach, the link or token includes encoded information (like the user’s ID and an expiration timestamp) plus a signature. For example, you could create a token that is `base64(userId || expiry || HMAC(userId+expiry, secret))`. When the user clicks the link, the backend validates the HMAC signature and checks the timestamp has not expired. If valid, allow the password reset; if not, reject. This method means you don’t need to store anything server-side – the token itself carries the info – and it’s protected from tampering by the HMAC signature
reddit.com.
A StackExchange security discussion confirms that you can avoid storing reset tokens by using a SHA256 HMAC of data including a timestamp
reddit.com.
However, note: a drawback is that if a user requests multiple resets, previously issued links may remain valid until expiration. To counter that, you might embed the user’s current password hash or a reset counter in the HMAC so that it invalidates older tokens upon password change
reddit.com.
For simplicity, many implementations prefer storing the token (e.g. in Redis) and invalidating it once used
reddit.com.
Both approaches are acceptable; just ensure the token is sufficiently long/unpredictable and expires.

### Reset Token Email Delivery

Use Resend to send the reset email similarly to OTP emails, via REST API call. The “from” address should likely be something like `support@bitloot.com` or `no-reply@bitloot.com` (and ensure your domain is verified on Resend – see section 5). The subject could be “Reset Your BitLoot Password”. Include contextual info in the email, but do not include the user’s password or overly sensitive data. Only the reset link or code.

### Password Update

When the user clicks the reset link, they will land on a BitLoot frontend page (e.g. a form to enter a new password). The front-end should send the token (from the URL) and the new password to a backend endpoint (e.g. `POST /auth/reset-password`). The backend validates the token: if using stored tokens, look up the token in Redis/DB for that user; if using HMAC, verify the signature and timestamp. If valid, set the user’s new password (after hashing it with a strong algorithm like bcrypt). Invalidate the token so it cannot be reused (if in Redis, delete it; if HMAC approach, it’s inherently single-use after expiration or by design if using password hash in it). Finally, respond to confirm success. It’s also good practice to notify the user (maybe via email or on-screen) that their password was changed – and if it wasn’t them, to contact support immediately.

### Rate Limiting & Security for Reset

Similar to OTP, apply rate limiting to the password reset request endpoint. Don’t allow infinite submissions of the form (to avoid spamming emails). You might allow a few attempts per hour per email. Also, for security, always respond with a generic message like “If an account with that email exists, a reset link has been sent.” This prevents attackers from using the password reset feature to enumerate emails on your system. Additionally, include anti-CSRF measures if the reset link directs the user to an authenticated session, but typically the link simply lets them set a new password without being logged in.

---

## 3. Transactional Email Triggers

BitLoot should send transactional emails to users for important events, enhancing user experience and providing confirmations. We will integrate Resend to send these emails on specific triggers in the application:

### Order Created (Payment Initiated)

When a user places an order (e.g. buying a game key on BitLoot), send an “Order Confirmation” email. This email confirms that the order was received and payment is in process. It might include the order ID, summary of items, and next steps (e.g. “We’ll notify you once your game key is ready”). Trigger this right after the order is saved/created in the database (and after charging the user’s payment method). For example, in the OrderService, after creating the order record, call `mailService.sendOrderCreatedEmail(order)`. The Resend template for this can be “Order Confirmation” with variables for `orderId`, `orderTotal`, or item details. The email content can be something like: “Thank you for your order #{{ORDER_ID}}. We’re processing your payment of ${{TOTAL}}. You will receive another email when your product key is ready. [Order Details]…”. This provides immediate feedback to the user
resend.com.

### Order Completed (Key Ready for Download)

Once the purchase is fully processed and the digital product is ready (e.g. the game activation key or download link is available), send an “Order Completed” or “Your Key is Ready” email. This email should include the key itself or a secure link to retrieve it (depending on how BitLoot delivers products). For security, if delivering the actual key via email, ensure it’s a trusted action. Alternatively, the email can prompt the user to log in and view the key on their account. The template variables here could include `productName`, `keyLink` (if providing a URL to get the key), and possibly a partial key or order ID for reference. For example: “Good news! Your key for {{PRODUCT_NAME}} is now available. Your activation code is {{PRODUCT_KEY}}. Keep it safe. You can also find it in your BitLoot account dashboard. Thank you for shopping with us!”. This email is triggered by the order fulfillment logic (e.g. when you mark an order as completed or when a digital key is assigned).

### Signup Welcome Email

After a user successfully signs up and verifies their email (either via OTP or other confirmation), send a welcome email. This is a one-time message to greet the new user, perhaps provide some tips or a promo code for first purchase, and reinforce the brand. It can be triggered when a new user account’s status becomes “verified/active”. The Resend template for welcome can include the user’s name and a short onboarding message. For example: “Welcome to BitLoot, {{NAME}}! Thank you for joining our community of gamers. We’re excited to have you on board. Here’s a quick start guide... [or] Use code WELCOME10 for 10% off your first purchase. Happy gaming!”. This email helps engage the user from the start.

For each of these triggers, the implementation in NestJS would be similar: inject the MailService into the relevant service (OrderService or UserService) and call the appropriate method to send the email. Each MailService method will craft the API call to Resend with the right template and data. For instance, `sendOrderCreatedEmail(order)` would call Resend with the “order-confirmation” template ID and variables like order ID, amount, etc. Using templates ensures the email layout is consistent and easily maintainable (Resend’s template system is well-suited for transactional emails like auth, onboarding, ecommerce receipts
resend.com).

### Ensuring Delivery

For critical transactional emails, consider using Resend’s optional features such as setting a custom message-ID or using the `Idempotency-Key` header
resend.com.
The Idempotency-Key can be a unique value (like the order ID or a combination of orderID-eventType) included in the header of the API request. This prevents duplicate emails if, say, a retry or a duplicate event occurs
resend.com.
For example, if your order processing logic might call the email function twice by accident, the second call with the same idempotency key would be ignored by Resend (if within 24h). This is a nice safety for avoiding sending two receipts or two keys.

Also, ensure your “from” addresses are consistent (e.g. `sales@bitloot.com` for order emails, `no-reply@bitloot.com` for OTPs, etc.), and that these addresses are verified domains on Resend (see section 5 on domain setup). Transactional emails usually don’t include unsubscribe links (since they’re related to an active transaction the user initiated), but it’s still good to make them informative and not too frequent.

---

## 4. Promotional Campaign Support (Marketing Emails)

In addition to one-to-one transactional emails, BitLoot may want to send promotional or newsletter-style emails to multiple users (e.g. announcing a sale, new game arrivals, or seasonal promotions). Resend provides features to support these marketing campaigns, though this is an optional integration depending on BitLoot’s needs.

### Contact Lists & Segments

Resend allows you to create Contacts (individual recipients with attributes like email, name, etc.) and organize them into Segments
resend.com
resend.com.
For example, you could add all users who opted into marketing emails as contacts, and create a segment “All Subscribers” or segments by user preferences. This can be done via the Resend API (e.g. `POST /contacts` to add contacts, `POST /segments` to group them) or via the Resend dashboard. Each contact can have properties (like first name, signup date, etc.) that can be used in email templates for personalization
resend.com.

### Broadcast Emails

Resend’s Broadcast API is designed for sending an email to many contacts at once (essentially, a marketing campaign blast). The typical flow is:

- Create a Broadcast via API, specifying a `segmentId` (the group of contacts who should receive it) and the email content (subject, HTML template, etc.)
  resend.com
  resend.com.
- Then “send” the broadcast, optionally scheduling it for a future time
  resend.com
  resend.com.
  The send call is `POST /broadcasts/{broadcast_id}/send` and you can include a `scheduledAt` parameter (e.g. “2025-12-01T10:00:00Z” for an exact time, or relative times like “in 1 day”) to delay sending
  resend.com
  resend.com.

For instance, to announce a Black Friday sale, you might create a broadcast with a template that has variables like `FIRST_NAME` and perhaps some dynamic content, targeted to the “All Subscribers” segment. You could schedule it to send on Nov 25 at 8 AM. The Resend API would queue it and send to every contact in that segment at that time.

### Unsubscribe Handling

Promotional emails must include an unsubscribe option to comply with anti-spam laws. Resend simplifies this: in your broadcast HTML, you can use the special `{{{RESEND_UNSUBSCRIBE_URL}}}` variable which will be replaced with a unique unsubscribe link for each recipient
resend.com.
The example in Resend’s docs shows adding “you can unsubscribe here: `{{{RESEND_UNSUBSCRIBE_URL}}}`” in the email template
resend.com.
When the user clicks that link, Resend will handle removing them from the mailing list or marking them unsubscribed (you can configure topics for more granular control, but a simple global unsubscribe is default). **Important:** Always include that link (or at least a clear unsubscribe instruction) in bulk emails.

### Topics (Optional)

Resend supports “Topics” which can be used if you have multiple categories of emails (for example: Product Updates, Newsletters, Promotions). Users can unsubscribe from specific topics. If BitLoot plans to have multiple types of marketing emails, you could assign contacts to topics and include topic-specific unsubscribe links. This is more advanced usage (Resend’s API has endpoints for topics and contact topics
resend.com), so only implement if needed.

### Scheduling & Frequency

With Resend’s scheduling (either via the API or manually initiating the send at the right time), you can plan campaigns ahead. BitLoot’s backend could have an admin interface or cron job to trigger these broadcast sends. Alternatively, BitLoot’s team could use the Resend dashboard to create and send broadcasts without coding – Resend’s dashboard provides a UI for these tasks.

### Integration in NestJS

If automating via code, you might create a `CampaignService` that wraps Resend broadcast API calls. For example:

- A method to add a list of users to contacts (this could run periodically or whenever users opt in).
- A method to create a broadcast with given content and segment.
- A method to send the broadcast (immediately or scheduled).

However, unless there’s a strong need to fully automate via backend, an easier route is to manage contact lists and campaigns on Resend’s side directly for marketing. Still, it’s good to know that Resend’s API supports these operations if integration with BitLoot’s system (for example, syncing user emails who opt-in) is desired.

**Note:** Promotional emails should be sent only to users who have consented to receive them. Make sure BitLoot provides an opt-in (e.g. a checkbox on signup for “Receive news and offers”) and honor unsubscribes by removing those users from your Resend contact list or segment.

---

## 5. Email Template Setup and Management

A key advantage of using Resend is its template management. Templates allow you to design your emails (using HTML or even React components via Resend’s React Email integration) and then send them by referencing the template ID, rather than constructing the full email content in code. For BitLoot, we will create a set of templates in the Resend dashboard:

- **OTP Verification Email Template:** As discussed, containing a message and a placeholder for the OTP code. (e.g. Template name: “BitLoot OTP Code”). Variables: `CODE`. No unsubscribe link (since it’s transactional).
- **Password Reset Email Template:** Contains the reset password instructions and link. Variables: `RESET_LINK`, possibly `FIRST_NAME`. (Template name: “Password Reset”).
- **Order Confirmation Template:** For order created. Variables: `ORDER_ID`, `TOTAL`, maybe an order summary block.
- **Order Completed Template:** For delivery. Variables: `PRODUCT_NAME`, `PRODUCT_KEY` or `KEY_LINK`, etc.
- **Welcome Email Template:** For new users. Variables: `NAME` (and maybe a promo code variable if you include dynamic coupon).

### Creating Templates (Dashboard)

Log in to Resend’s dashboard and navigate to Templates. Click “Create template” to add a new one
resend.com.
You can either start from scratch (writing HTML or using their React email editor) or import existing HTML. Resend even allows building templates with Tailwind CSS via React components for responsive design
optymalista.medium.com
optymalista.medium.com.
For simplicity, you might use their visual editor or code editor to layout the email. Use **Template Variables** for dynamic content: in the editor, variables are defined by `{{VAR_NAME}}` or triple braces for safe HTML injection. You need to declare each variable’s key and (optionally) a fallback value and type
resend.com
resend.com.
For example, a variable `ORDER_ID` of type string, fallback “your order” could be defined so if for some reason it’s not provided, the email still says “your order”.

### Template Variables in Resend

Resend allows up to 20 custom variables per template
resend.com.
Some variable names are reserved (like `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`) and are auto-populated or restricted
resend.com.
For instance, in broadcast templates, `FIRST_NAME` can refer to the contact’s first name if that property is set
resend.com.
In BitLoot’s case, for transactional templates, you will explicitly pass the variables via the API. Always provide all required variables when sending, or Resend will return a validation error if any required variable is missing (unless it has a fallback)
resend.com.

### Testing and Publishing

While developing templates, you can use the “Send Test Email” feature in Resend’s dashboard to send a preview to yourself
resend.com.
This is useful to verify layout and variable interpolation. Once a template is ready, publish it so it becomes active for sending
resend.com.
Publishing creates a version that is locked for use; you can continue editing a draft version for future changes without affecting the published version until you publish again
resend.com.
In API calls, you can reference a template either by its ID (which is a UUID) or by an alias (a friendly name you set). Using aliases like “order-confirmation” is convenient
resend.com,
just ensure they are unique.

### Managing Templates

Over time, you may update templates (e.g. change the design or wording). Resend’s versioning means older emails that were sent remain as they were, while new sends use the latest published content
resend.com.
You can also duplicate or delete templates via the dashboard or API if needed
resend.com
resend.com.
BitLoot’s team (developers or marketers) can collaborate on templates without needing to redeploy code – a big win for agility.

### Template vs Code Tradeoff

We emphasize using Resend templates because it offloads the email formatting to Resend and keeps the NestJS code focused only on logic and data. However, for completeness, note that it’s possible to generate emails on the fly in code (like using a templating engine or React Email library and then sending raw HTML through Resend). For example, some developers use React components and pass them via the Node SDK (`react: <Component />` as seen in a NestJS example
optymalista.medium.com).
But since we’re not using SDK in this guide and to keep things simple, we use Resend’s templates + REST API. This approach is robust and less error-prone: define template once, re-use it.

### Domain and Sender Identity

Before sending from your custom domain (e.g. `@bitloot.com`), verify that domain in Resend. In the Resend dashboard’s Domains section, add your domain and follow the DNS instructions to set SPF/DKIM records
resend.com
resend.com.
Once verified, you can send from addresses on that domain with higher deliverability. For development/testing, Resend might allow sending from unverified domains to certain “sandbox” addresses, but for production you want the domain properly verified.

---

## 6. Security and Best Practices

Integrating an email service touches sensitive workflows (account access, password resets) so careful attention to security is a must. Here are best practices and how BitLoot can implement them:

### API Key Protection

The Resend API key (`re_xxxxxxxx`) is essentially a password to send emails from your account
resend.com.
Never hard-code it or expose it client-side. Store it in a secure place – typically an environment variable loaded via NestJS ConfigModule. For example, in `.env` file: `RESEND_API_KEY=re_live_xxx`. In the MailService, load it with `this.configService.get('RESEND_API_KEY')`. Also, limit its scope: Resend allows creating multiple API keys
resend.com,
so use separate keys for development and production, and revoke/regenerate if needed. Treat the key like any secret (don’t commit to git, etc.). You can also consider using Resend’s restriction features if any (for example, some services allow IP restrictions on keys; check Resend’s docs for API key options).

### Least Privilege for Services

If BitLoot’s architecture involves microservices or separate modules, ensure only the Auth module deals with OTP secrets, only the User module handles password resets, etc. The MailService should not store or log sensitive data. For instance, do not log the OTP code or reset token in plain text. If you must log events for debugging, mask tokens (e.g. log only the first 2 characters of an OTP or use an audit log accessible only by admins).

### Use HMAC/Signatures as needed

As discussed, HMAC signing can be used for password reset links
reddit.com
or email verification links (if you choose email link verification instead of OTP). If BitLoot ever implements magic link login (login via an emailed link, no password), a similar token generation strategy should be used. Consider using JWTs signed with a secret for short-lived tokens (with the token’s `exp` claim controlling expiration). If using JWT for password reset, do not include sensitive info in the payload (just user ID and maybe an issued-at timestamp), and use a separate secret key for these tokens.

### One-Time Use and Expiration

All tokens/OTP should be one-time use. For OTP, once validated, it should not be accepted again (even if within TTL). For reset tokens, once used to change password, invalidate it immediately. Implement checks on the server to enforce this. Also, tokens should expire relatively quickly to limit the window of misuse – 5-15 minutes for OTP, 30-60 minutes for reset links (per OWASP recommendations)
owasp.org
nagibaba.medium.com.
Longer than that and users may attempt to reuse old emails; shorter and they might expire too fast for users to act.

### HTTPS and Frontend Security

Ensure the BitLoot front-end is served over HTTPS so that the reset tokens or OTPs when submitted are not intercepted. The reset link should point to an HTTPS URL. On the backend, if you implement a link that automatically logs the user in (magic link), be very cautious: ideally those should be single-use and immediately expire upon clicking.

### Email Content Security

Avoid putting extremely sensitive info in emails. For instance, never email a plaintext password. In fact, BitLoot should never even know a user’s plaintext password (always store hashes). Emails can include user’s name, order info, etc., but remember that email is not a fully secure channel. However, sending activation keys or links is generally fine since the user must have access to the email to get it, and the keys are often meant for them. If a license key is very sensitive, you might prefer not to include it directly in email but rather a link for the user to login and get it (so that access is protected by account login as well).

### Resilience and Retries

Email sending can fail due to transient issues (network blip, API downtime). Implement basic retry logic for critical emails. For example, if Resend API call fails, you might retry it once or twice with a short delay. However, be careful not to duplicate emails in retry – use the `Idempotency-Key` header to guard against duplicates on retried requests
resend.com.
A better pattern is to offload email sending to a background job queue. Using a queue like BullMQ (with Redis) in NestJS, you can enqueue an email job and have a worker process send it. This way, if an attempt fails, the job can retry according to specified attempts/backoff without blocking the user’s initial request. The OTP email, for instance, could be sent asynchronously: the API can respond “OTP sent” even if the actual email sending is processing slightly after. The OTP is in Redis, so verification will work once the email arrives. Similarly, order emails can be done in background to not slow the order placement flow. A queue also allows collecting failures and possibly alerting on them (so engineers know if emails aren’t going out).

### Monitoring and Webhooks

Consider using Resend’s Webhooks to monitor delivery events (e.g., bounced emails, deliveries, opens if needed). For critical flows like OTP and password resets, if an email bounces (perhaps user entered wrong email), you might want to handle that (e.g. prompt user to correct their email). Resend can send webhook events to your app on delivery, bounce, open, click, etc. This might be beyond initial integration, but keep it in mind for improving reliability. Also, monitor your sending quota and reputation (ensure you aren’t hitting Resend’s default rate limit of 2 requests/second too often
resend.com
– if BitLoot scales, you may request higher rate limit or send batch requests if needed).

### Test Thoroughly

Use a testing strategy for emails. For instance, in staging environment, you might use Resend’s sandbox domain or a dummy recipient to ensure emails send properly. You can also utilize Resend’s logs (their dashboard shows recent email activity) to debug. Automated tests in NestJS could mock the MailService so you don’t actually send emails during unit tests, but you verify that the service is called with correct parameters when certain actions happen.

By following these practices, BitLoot can ensure its email integration is secure and robust, safeguarding users’ accounts and data while providing a smooth experience.

---

## 7. Rate Limiting and Abuse Protection

We already touched on rate limiting for OTP and password resets, but let’s summarize and expand on abuse prevention strategies across the board:

- **OTP Request Throttling:** Use Redis to cap OTP email frequency per user/IP
  dip-mazumder.medium.com
  . (E.g. 3 per 15 minutes as implemented earlier). Also possibly limit daily total OTP emails per user (e.g. no more than 10 per day) to avoid extreme cases. Implement similar limits on password reset emails (e.g. a user can only request a password reset email a certain number of times per hour).

- **IP-Based Limits:** In addition to per-email limits, consider IP rate limiting to stop a malicious actor from spamming OTP requests for many different emails. NestJS has a ThrottlerModule which can rate-limit requests by IP easily (e.g. 5 requests per minute on the OTP generation endpoint). A combination of IP and user-based limits is ideal. For instance, allow a single IP only, say, 10 OTP requests per hour in total. This helps mitigate bots or DoS attempts.

- **Verification Attempt Limits:** As discussed, limit OTP verification attempts. Possibly lock the user out or require a new OTP after, say, 5 failed tries. For login attempts with password, standard practices (like exponential backoff or temporary account lock after X fails) should also apply, but that’s outside email focus except that a locked account might trigger an email notification to the user for security.

- **Preventing Enumeration:** Ensure that none of the flows can be used to probe for user data. The password reset endpoint response should be generic. The OTP request for signup should not reveal if an email is already registered – if it is, maybe the flow should treat it as a login OTP rather than sign-up, or just say “OTP sent” and handle next steps internally. If someone tries to use OTP login for an email that doesn’t have an account, you could still send an email saying “No account exists, here’s a signup link” (as one Reddit discussion suggested)
  reddit.com
  reddit.com
  , but that can also be abused to spam arbitrary emails. Many sites simply don’t send anything if the email is not found, or send a generic “if that email exists, you’ll get a message.” Balance user experience vs security here.

- **Abuse Monitoring:** Log the usage of these endpoints. If you see a single IP or user triggering a lot of requests, you might manually intervene or ban IPs. In production, integrating with a WAF or rate limiting proxy (like Nginx or Cloudflare) can add another layer of protection before traffic even hits your NestJS app.

- **CAPTCHA for Automation Prevention:** For extremely sensitive or abuse-prone flows (like signup or reset), you can introduce a CAPTCHA (Google reCAPTCHA or similar) to ensure a human is initiating the request. This can be done on the front-end: require solving a CAPTCHA before allowing the OTP or reset request to be sent. It’s an effective spam/bot deterrent if BitLoot faces such problems.

- **Email Verification on Signup:** By using OTP verification during signup, BitLoot already ensures the email is valid and controlled by the user before allowing account use. This reduces fake accounts and spam. As an extra, BitLoot could enforce email uniqueness and perhaps use an email validation service or regex to prevent obviously fake emails.

- **Content Security:** If BitLoot has an open form where users can trigger emails (like a “contact us” form that sends an email confirmation), be careful of content injection. However, for our flows, the content is mostly fixed templates, with only specific fields injected (which we control, like code or user name). There’s minimal risk of email injection as long as we don’t directly take user input to craft the email headers or body without sanitization. (Resend’s API will treat the values as literal content for the template variables, and since templates are designed, there’s no open text from user except perhaps their name – if so, ensure to escape any special characters or just rely on templates which by default should escape variables unless explicitly using triple braces to inject HTML).

In summary, combine Redis-based counters, NestJS throttling, and good UI/UX practices (CAPTCHA, generic responses) to thwart abuse. These measures together make it extremely difficult for an attacker to mass-request OTPs or brute force codes, without significantly inconveniencing legitimate users.

---

## 8. NestJS Implementation Tips and Code Structure

Finally, let’s discuss how to architect the integration in NestJS, tying all the pieces together in clean, maintainable code.

### MailModule and MailService

Create a dedicated `MailModule` in your NestJS application. In `mail.module.ts`, you can import the ConfigModule (to access API keys, etc.) and provide the `MailService`. The `MailService` (in `mail.service.ts`) will encapsulate all email sending logic. This service will use an HTTP client to call Resend’s API. Since we are not using Resend’s SDK (per requirements), we can use Axios. NestJS provides `HttpModule` which wraps Axios and allows injection of `HttpService`. Alternatively, you can use the lower-level `axios` directly or even Node’s `fetch` in newer Node versions. Using `HttpService` is convenient as it integrates with Nest’s lifecycle (and you can globaly configure base URL, interceptors, etc., if needed).

**Example setup of MailService using Axios (HttpService):**

```ts
// mail.service.ts
import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly resendApiKey: string;
  private readonly resendBaseUrl = 'https://api.resend.com';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY');
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    const payload = {
      from: 'BitLoot <no-reply@bitloot.com>',
      to: [to],
      subject: 'Your BitLoot OTP Code',
      template: {
        id: 'bitloot-otp-code', // Resend template alias/ID for OTP email
        variables: { CODE: code },
      },
    };
    await this.httpService
      .post(`/emails`, payload, {
        baseURL: this.resendBaseUrl,
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
        },
      })
      .toPromise(); // In Nest v8, HttpService returns Observable, so convert to Promise
  }

  // ... other methods like sendPasswordResetEmail, sendOrderEmails, etc.
}
```

In this snippet, we configure the Authorization header with the Bearer token (Resend API key) on each request
resend.com.
We post to `/emails` endpoint with the JSON body. (We rely on the fact that Resend uses JSON; ensure `HttpModule.register({ baseURL: 'https://api.resend.com', timeout: ... })` is done or specify `baseURL` as above). We use `toPromise()` to execute the HTTP call (if using newer NestJS with RxJS 7+, you might use `firstValueFrom()` from RxJS instead). The MailService method doesn’t return the Resend API response to the caller in this example; it could, but for OTP or notifications, the calling function might not need to do anything with the response. You could choose to log the returned email ID from Resend for debugging.

Following this pattern, implement other methods:

- `sendPasswordResetEmail(userEmail: string, resetLink: string)` – similar structure but uses the password reset template and variables (`RESET_LINK`).
- `sendOrderConfirmationEmail(order: Order)` – uses order confirmation template, populating variables like `ORDER_ID`, `TOTAL`, etc.
- `sendOrderCompletedEmail(order: Order, productKey: string)` – uses key delivery template.
- `sendWelcomeEmail(user: User)` – uses welcome template.

Each method crafts the payload JSON accordingly. If certain templates have defaults (for example, your template already has a subject defined), you can omit subject in the payload to use the template’s default. Otherwise, provide it. (Resend will use the API-provided subject/from in preference to template defaults if both given
resend.com.)

### Service Structure and Usage

By organizing these into MailService, other parts of the application just call MailService methods. For instance, in AuthService, when a new user registers:

```ts
// auth.service.ts (inside signup method after creating user in DB)
await this.mailService.sendOtpEmail(user.email, otpCode);
```

Or for a password reset request:

```ts
// auth.service.ts (password reset request handler)
const token = generateRandomToken(); // store in Redis with TTL
const resetLink = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
await this.mailService.sendPasswordResetEmail(user.email, resetLink);
```

In OrderService:

```ts
// order.service.ts
if (orderCreated) {
  await this.mailService.sendOrderConfirmationEmail(order);
}
// ...
if (order.status === 'COMPLETED') {
  await this.mailService.sendOrderCompletedEmail(order, productKey);
}
```

This decouples email sending from business logic – the services just trigger emails and don’t worry about the details of the email content.

### Environment Configuration

As mentioned, use ConfigService to manage sensitive configs. Typically, define `RESEND_API_KEY` in your config schema. Also, define things like default “from” emails or front-end URL in config, so MailService can use them. For example, have `MAIL_FROM_NO_REPLY` or similar in `.env` and load it. This makes it easy to change the sender address or other settings without code changes.

### Handling Failures in Code

Wrap the actual HTTP call in try/catch inside MailService. If an exception occurs (HttpService throws on non-200 by default), you can handle it:

```ts
try {
  await this.httpService.post(...).toPromise();
} catch (err) {
  // log error, maybe throw a custom exception or swallow if not critical
  console.error('Resend API error sending email:', err.response?.data || err.message);
}
```

For OTP, you might want to propagate an error up if email failed (so the user can be informed or try again). For less critical emails (welcome email), you might just log and continue.

### Diagrams & Documentation

Internally, it’s helpful to document the flow (like the OTP diagram we included) for the team. Make sure everyone knows that emails are triggered via MailService and how the templates are structured. Over time, if templates change (say Marketing wants to tweak a welcome email), they can do so in Resend without code changes – just ensure variables remain consistent or update the code if new variables are added.

### Testing in NestJS

During development, you could use a test API key from Resend (if available) or a dummy setup. Alternatively, conditionally disable actual sends in non-production environment. For example, if `NODE_ENV=test`, MailService could short-circuit and log the email payload instead of calling Resend. This avoids sending real emails during automated tests. Resend might also have a feature to send to an internal testing address or something – check their knowledge base. At minimum, have integration tests for MailService that mock HttpService to ensure the payloads are correct.

### Example MailService Method (Complete)

```ts
async sendPasswordResetEmail(to: string, resetLink: string) {
  const payload = {
    from: 'BitLoot Support <support@bitloot.com>',
    to: [to],
    subject: 'Reset Your BitLoot Password',
    template: {
      id: 'bitloot-reset-password',
      variables: { RESET_LINK: resetLink }
    }
  };
  try {
    const res = await firstValueFrom(
      this.httpService.post('/emails', payload, {
        baseURL: this.resendBaseUrl,
        headers: { Authorization: `Bearer ${this.resendApiKey}` }
      })
    );
    // Optionally, use res.data.id (email ID) for logging
    console.log(`Password reset email queued: ${res.data.id}`);
  } catch (error) {
    // handle error (log or rethrow)
    throw new InternalServerErrorException('Failed to send email');
  }
}
```

This illustrates usage of `firstValueFrom` (for RxJS) instead of `toPromise` (which is deprecated in RxJS 7+). It posts to the same `/emails` endpoint with a different template ID.

### Module integration

Don’t forget to import HttpModule in MailModule:

```ts
@Module({
  imports: [HttpModule.register({}), ConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

This makes MailService available to other modules. Then, in AuthModule or OrderModule, import MailModule so you can inject MailService. This way, any part of BitLoot’s backend that needs to send an email can simply call the appropriate function.

---

By following this guide, BitLoot’s NestJS application will have a robust email integration powered by Resend’s API. The solution covers verification, password resets, order notifications, and marketing emails in a secure and scalable manner. Remember to keep templates updated, monitor email sending stats, and continuously refine rate limits and security as your userbase grows. Happy coding and emailing!

--
