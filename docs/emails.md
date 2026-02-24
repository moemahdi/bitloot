## 📧 All BitLoot Emails - Complete Review

Here are **ALL 12 email types** currently being sent to users in the BitLoot system:

---

### 1. **OTP Verification Email**
**File:** emails.service.ts
**Subject:** `Your BitLoot OTP Code`

```html
<p>Hi,</p>
<p>Your BitLoot verification code is <strong>${code}</strong>.</p>
<p>This code will expire in 5 minutes. If you didn't request this, please ignore this email.</p>
<p>Best regards,<br/>The BitLoot Team</p>
```

---

### 2. **Welcome Email (New Users)**
**File:** emails.service.ts
**Subject:** `Welcome to BitLoot, ${displayName}!`

```html
<p>Hi ${displayName},</p>

<p>Welcome to <strong>BitLoot</strong> — the crypto-first digital marketplace for instant key delivery!</p>

<p><strong>What you can do on BitLoot:</strong></p>
<ul>
  <li>🎮 Browse verified game keys and software licenses</li>
  <li>💳 Checkout with 100+ cryptocurrencies (Bitcoin, Ethereum, etc.)</li>
  <li>⚡ Receive your keys instantly — no waiting</li>
  <li>🔒 Secure, encrypted storage with signed download links</li>
</ul>

<p><strong>Getting Started:</strong></p>
<ol>
  <li>Browse our catalog at <a href="https://bitloot.io">bitloot.io</a></li>
  <li>Add items to your cart</li>
  <li>Checkout with your preferred cryptocurrency</li>
  <li>Receive your keys instantly in your email</li>
</ol>

<p><strong>Quick Tips:</strong></p>
<ul>
  <li>Your account is now active and ready to shop</li>
  <li>All payments are processed via secure blockchain transactions</li>
  <li>Keys are encrypted and never stored in plaintext</li>
  <li>Need help? Visit our <a href="https://bitloot.io/support">Support Center</a></li>
</ul>

<p>We're excited to have you onboard. Happy shopping!</p>
<p>Best regards,<br/><strong>The BitLoot Team</strong></p>

<hr/>
<small>You received this email because you created a BitLoot account. <a href="https://bitloot.io/unsubscribe?email=${to}">Manage preferences</a></small>
```

---

### 3. **Order Confirmation Email**
**File:** emails.service.ts
**Subject:** `Order Confirmation #${shortOrderId} - BitLoot`

```html
<p>Hi,</p>

<p>Thank you for your order! Your BitLoot purchase is ready for payment.</p>

<p><strong>Order Details:</strong></p>
<ul>
  <li><strong>Order ID:</strong> #${shortOrderId}</li>
  <li><strong>Items:</strong>
    <ul>
      ${itemsList}
    </ul>
  </li>
  <li><strong>Total:</strong> <strong>${total} ${currency}</strong></li>
</ul>

<p style="margin: 20px 0;">
  <a href="${paymentLink}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
    Pay Now with Crypto
  </a>
</p>

<p><strong>Important Information:</strong></p>
<ul>
  <li>⏰ Payment link expires in 30 minutes</li>
  <li>💰 We accept 100+ cryptocurrencies (BTC, ETH, XRP, BNB, USDT, etc.)</li>
  <li>⚠️ <strong>Underpayments are non-refundable</strong> due to blockchain immutability</li>
  <li>✅ Once payment is confirmed, your keys will be delivered instantly</li>
  <li>🔒 Keys are never stored in plaintext and delivered via 15-minute secure links only</li>
</ul>

<p><strong>What happens next:</strong></p>
<ol>
  <li>Click the payment button above</li>
  <li>Choose your cryptocurrency and send the exact amount</li>
  <li>Wait for blockchain confirmation (typically 1-5 minutes)</li>
  <li>Receive your keys instantly via secure email link</li>
</ol>

<p>Questions? Visit our <a href="https://bitloot.io/faq">FAQ</a> or <a href="https://bitloot.io/support">Support Center</a>.</p>
<p>Best regards,<br/><strong>The BitLoot Team</strong></p>

<hr/>
<small>This is an automated message. Do not reply to this email.</small>
```

---

### 4. **Order Completed / Key Delivery Email**
**File:** emails.service.ts
**Subject:** `Your BitLoot Key is Ready — Order #${shortOrderId}`

```html
<p>Hi,</p>

<p>🎉 <strong>Your order has been fulfilled!</strong></p>

<p>Your purchase of <strong>${productName}</strong> is ready to download.</p>

<p style="margin: 20px 0;">
  <a href="${downloadUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
    Download Your Key
  </a>
</p>

<p><strong>Order Details:</strong></p>
<ul>
  <li>Order ID: #${shortOrderId}</li>
  <li>Product: ${productName}</li>
  <li>Status: ✅ Completed</li>
</ul>

<p><strong>⚠️ Important Security Notice:</strong></p>
<ul>
  <li>🔗 Download available for <strong>${expiresIn}</strong> — after that, sign in to get a new link</li>
  <li>🔒 The link is encrypted and only accessible by you</li>
  <li>📝 We never email plaintext keys — always use the secure link</li>
  <li>🚫 Do not share this link with others</li>
  <li>💾 Save your key immediately after downloading</li>
</ul>

<p><strong>Next Steps:</strong></p>
<ol>
  <li>Click the button above to download your key</li>
  <li>Save the key file in a secure location</li>
  <li>Activate your product using the provided instructions</li>
  <li>If you need help, visit our <a href="https://bitloot.io/support">Support Center</a></li>
</ol>

<p><strong>Link expired?</strong></p>
<p><a href="https://bitloot.io/auth/login">Sign in</a> and visit your <a href="https://bitloot.io/account/orders">order history</a> to get a fresh download link.</p>

<p>Thank you for shopping with BitLoot!</p>
<p>Best regards,<br/><strong>The BitLoot Team</strong></p>

<hr/>
<small>This is an automated message. Do not reply to this email. <a href="https://bitloot.io/unsubscribe?email=${to}">Unsubscribe</a></small>
```

---

### 5. **Password Reset Email**
**File:** emails.service.ts
**Subject:** `Reset Your BitLoot Password`

```html
<p>Hi,</p>
<p>We received a request to reset your BitLoot password. Click the link below to proceed:</p>
<p style="margin: 20px 0;">
  <a href="${resetLink}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
    Reset Password
  </a>
</p>
<p><strong>Link expires in 1 hour.</strong> If you didn't request this, you can safely ignore this email.</p>
<p style="font-size: 12px; color: #666; margin-top: 30px;">
  For security: Never share this link with anyone. We will never ask for your password via email.
</p>
<p>Best regards,<br/>The BitLoot Team</p>
```

---

### 6. **Underpayment Notice Email**
**File:** emails.service.ts
**Subject:** (Not explicitly set - likely needs fixing)

```html
<h2>BitLoot Payment Underpaid — Non-Refundable</h2>
<p>Dear Customer,</p>
<p>We received your payment for order <strong>#${orderId.substring(0, 8)}</strong>, but the amount was insufficient.</p>

<p><strong>Payment Status: FAILED & NON-REFUNDABLE</strong></p>

<p>Details:</p>
<ul>
  <li>Amount Sent: <strong>${amountSent ?? 'N/A'}</strong></li>
  <li>Amount Required: <strong>${amountRequired ?? 'N/A'}</strong></li>
</ul>

<p><strong>Why is this non-refundable?</strong></p>
<p>Blockchain transactions are irreversible. Our payment processor (NOWPayments) cannot refund underpaid amounts due to the nature of cryptocurrency transactions.</p>

<p><strong>Next Steps:</strong></p>
<ol>
  <li>Check your wallet for the transaction confirmation</li>
  <li>If you need assistance, please contact our support team</li>
  <li>To place a new order, please start fresh and send the exact amount</li>
</ol>

<p style="margin: 24px 0;">
  <a href="${orderStatusUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order Status</a>
</p>

<p>We're sorry we couldn't complete this order. Our support team is here to help if you have questions.</p>
<p>Best regards,<br/>The BitLoot Team</p>

<hr/>
<small>This is an automated message. Do not reply to this email. Visit our <a href="https://bitloot.io/support">Support Center</a> for help.</small>
```

---

### 7. **Payment Failed Notice Email**
**File:** emails.service.ts
**Subject:** (Not explicitly set - likely needs fixing)

```html
<h2>BitLoot Payment Failed</h2>
<p>Dear Customer,</p>
<p>Your payment for order <strong>#${orderId.substring(0, 8)}</strong> could not be processed.</p>

<p><strong>Reason:</strong> ${reason ?? 'Payment processing error'}</p>

<p><strong>What happens next?</strong></p>
<p>Your order has been cancelled and no funds have been charged. You can:</p>
<ul>
  <li>Try placing a new order with a different payment method</li>
  <li>Contact our support team for assistance</li>
</ul>

<p style="margin: 24px 0;">
  <a href="${orderStatusUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order Status</a>
</p>

<p>We apologize for the inconvenience. Our support team is here to help.</p>
<p>Best regards,<br/>The BitLoot Team</p>

<hr/>
<small>This is an automated message. Do not reply to this email. Visit our <a href="https://bitloot.io/support">Support Center</a> for help.</small>
```

---

### 8. **Payment Expired Notice Email**
**File:** emails.service.ts
**Subject:** (Not explicitly set - likely needs fixing)

```html
<h2>BitLoot Payment Expired</h2>
<p>Dear Customer,</p>
<p>The payment window for order <strong>#${orderId.substring(0, 8)}</strong> has expired.</p>

<p><strong>Reason:</strong> ${reason ?? 'Payment window timed out (1 hour)'}</p>

<p><strong>Don't worry!</strong> No funds have been charged. Our checkout has a 1-hour window to complete payment.</p>

<p><strong>What can you do?</strong></p>
<ul>
  <li>Visit our checkout page to create a new order</li>
  <li>Ensure you have your wallet ready before starting payment</li>
  <li>Complete the transfer promptly once you receive the payment address</li>
</ul>

<p style="margin: 24px 0;">
  <a href="${retryUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Create New Order</a>
</p>

<p>We're here to help if you have any questions!</p>
<p>Best regards,<br/>The BitLoot Team</p>

<hr/>
<small>This is an automated message. Do not reply to this email. Visit our <a href="https://bitloot.io/support">Support Center</a> for help.</small>
```

---

### 9. **Email Changed Notification (to OLD email)**
**File:** auth.controller.ts
**Subject:** `Your BitLoot email has been changed`

```html
<h2>Email Changed Successfully</h2>
<p>Your BitLoot account email has been changed to <strong>${pendingEmail}</strong>.</p>
<p>If you did not make this change, please contact support immediately at support@bitloot.io</p>
<p>This is a security notification - no action is needed if you initiated this change.</p>
```

---

### 10. **Email Changed Welcome (to NEW email)**
**File:** auth.controller.ts
**Subject:** `Welcome to your updated BitLoot account`

```html
<h2>Email Updated</h2>
<p>Your BitLoot account email has been successfully changed to this address.</p>
<p>You can now use <strong>${pendingEmail}</strong> to log in to your account.</p>
```

---

### 11. **Account Deletion Scheduled Email**
**File:** auth.controller.ts
**Subject:** `Account Deletion Scheduled - BitLoot`

```html
<h2>Account Deletion Scheduled</h2>
<p>Your BitLoot account is scheduled for deletion on <strong>${deletionDate.toLocaleDateString()}</strong>.</p>
<p>You have <strong>${daysRemaining} days</strong> to cancel this request if you change your mind.</p>
<p>Once deleted, all your data will be permanently removed and cannot be recovered.</p>
<hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
<p><strong>Changed your mind?</strong></p>
<p>
  <a href="${cancelUrl}" 
     style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; 
            text-decoration: none; border-radius: 6px; font-weight: bold;">
    Cancel Deletion
  </a>
</p>
<p style="color: #666; font-size: 12px; margin-top: 20px;">
  This link is secure and expires in 30 days. If you didn't request this deletion, 
  please <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/profile?tab=security">secure your account</a> immediately.
</p>
```

---

### 12. **Account Deletion Cancelled Email**
**File:** auth.controller.ts (and auth.controller.ts)
**Subject:** `Account Deletion Cancelled - BitLoot`

```html
<h2>Account Deletion Cancelled</h2>
<p>Your BitLoot account deletion has been cancelled. Your account is now active again.</p>
<p>If you did not make this request, please contact support immediately.</p>
```

(Alternative version for public token-based cancellation:)
```html
<h2>Account Deletion Cancelled</h2>
<p>Your BitLoot account deletion has been cancelled successfully. Your account is now active again.</p>
<p>If you did not make this request, please contact support immediately and consider changing your password.</p>
<p><a href="${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard/security">View Account Settings</a></p>
```

---

## 📋 Summary Table

| # | Email Type | Subject | Location |
|---|------------|---------|----------|
| 1 | OTP Verification | `Your BitLoot OTP Code` | emails.service.ts |
| 2 | Welcome | `Welcome to BitLoot, ${name}!` | emails.service.ts |
| 3 | Order Confirmation | `Order Confirmation #XXX - BitLoot` | emails.service.ts |
| 4 | Key Delivery | `Your BitLoot Key is Ready — Order #XXX` | emails.service.ts |
| 5 | Password Reset | `Reset Your BitLoot Password` | emails.service.ts |
| 6 | Underpayment Notice | *(needs subject line)* | emails.service.ts |
| 7 | Payment Failed | *(needs subject line)* | emails.service.ts |
| 8 | Payment Expired | *(needs subject line)* | emails.service.ts |
| 9 | Email Changed (Old) | `Your BitLoot email has been changed` | auth.controller.ts |
| 10 | Email Changed (New) | `Welcome to your updated BitLoot account` | auth.controller.ts |
| 11 | Deletion Scheduled | `Account Deletion Scheduled - BitLoot` | auth.controller.ts |
| 12 | Deletion Cancelled | `Account Deletion Cancelled - BitLoot` | auth.controller.ts |

---

**⚠️ Issues Found:**
1. Emails #6, #7, #8 (Underpayment, Failed, Expired) are **mock-only** and don't have proper subject lines in the actual send calls
2. Some emails use hardcoded `bitloot.io` URLs instead of using `process.env.FRONTEND_URL`

Let me know which emails you'd like to modify and what changes you want to make!