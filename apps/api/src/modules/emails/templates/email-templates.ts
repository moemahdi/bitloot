/**
 * ============================================================
 * BITLOOT EMAIL TEMPLATES - All Emails in One Place
 * ============================================================
 *
 * This file contains ALL email templates used in BitLoot.
 * Edit the templates here to update email content system-wide.
 *
 * Each template function returns: { subject: string, html: string }
 *
 * TEMPLATE INDEX:
 * ---------------
 * 1.  OTP Verification         - otpVerificationEmail()
 * 2.  Welcome                  - welcomeEmail()
 * 3.  Order Confirmation       - orderConfirmationEmail()
 * 4.  Key Delivery             - keyDeliveryEmail()
 * 5.  Password Reset           - passwordResetEmail()
 * 6.  Underpayment Notice      - underpaymentNoticeEmail()
 * 7.  Payment Failed           - paymentFailedEmail()
 * 8.  Payment Expired          - paymentExpiredEmail()
 * 9.  Email Changed (Old)      - emailChangedOldEmail()
 * 10. Email Changed (New)      - emailChangedNewEmail()
 * 11. Deletion Scheduled       - deletionScheduledEmail()
 * 12. Deletion Cancelled       - deletionCancelledEmail()
 * 13. Generic Email            - genericEmail()
 */

import { EmailStyles, EmailColors, wrapEmailTemplate } from './email-styles';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface EmailTemplate {
  subject: string;
  html: string;
}

// ============================================================
// 1. OTP VERIFICATION EMAIL
// ============================================================

export interface OtpEmailParams {
  code: string;
  email: string;
}

export function otpVerificationEmail(params: OtpEmailParams): EmailTemplate {
  const { code } = params;

  const content = `
    <h2 style="${EmailStyles.heading2}">🔐 Verification Code</h2>

    <p style="${EmailStyles.paragraph}">
      Use this code to verify your identity:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <span style="${EmailStyles.otpCode}">${code}</span>
    </div>

    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0; color: ${EmailColors.warning};">
        ⏰ <strong>This code expires in 5 minutes.</strong>
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      If you didn't request this code, you can safely ignore this email.
      Someone may have entered your email address by mistake.
    </p>

    <p style="${EmailStyles.paragraph}">
      For security, never share this code with anyone. BitLoot staff will never ask for your verification code.
    </p>
  `;

  return {
    subject: 'Your BitLoot Verification Code',
    html: wrapEmailTemplate(content, { showFooter: true }),
  };
}

// ============================================================
// 2. WELCOME EMAIL
// ============================================================

export interface WelcomeEmailParams {
  displayName: string;
  email: string;
}

export function welcomeEmail(params: WelcomeEmailParams): EmailTemplate {
  const { displayName } = params;
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const content = `
    <h2 style="${EmailStyles.heading2}">
      🎉 Welcome to BitLoot, ${displayName}!
    </h2>

    <p style="${EmailStyles.paragraph}">
      You've joined the <strong>crypto-first digital marketplace</strong> for instant key delivery!
    </p>

    <div style="${EmailStyles.successBox}">
      <p style="margin: 0; color: ${EmailColors.success};">
        ✅ Your account is now <strong>active and ready to shop</strong>
      </p>
    </div>

    <h3 style="${EmailStyles.heading2}">What You Can Do on BitLoot</h3>

    <ul style="${EmailStyles.list}">
      <li style="${EmailStyles.listItem}">🎮 Browse verified game keys and software licenses</li>
      <li style="${EmailStyles.listItem}">💳 Pay with <strong>300+ cryptocurrencies</strong> (BTC, ETH, XRP, USDT, etc.)</li>
      <li style="${EmailStyles.listItem}">⚡ Receive your keys <strong>instantly</strong> — no waiting</li>
      <li style="${EmailStyles.listItem}">🔒 Secure, encrypted storage with time-limited download links</li>
    </ul>

    <h3 style="${EmailStyles.heading2}">Getting Started</h3>

    <ol style="${EmailStyles.list}">
      <li style="${EmailStyles.listItem}">Browse our catalog</li>
      <li style="${EmailStyles.listItem}">Add items to your cart</li>
      <li style="${EmailStyles.listItem}">Checkout with your preferred cryptocurrency</li>
      <li style="${EmailStyles.listItem}">Receive your keys instantly via secure email link</li>
    </ol>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${frontendUrl}/catalog" style="${EmailStyles.buttonPrimary}">
        🛒 Start Shopping
      </a>
    </div>

    <hr style="${EmailStyles.divider}">

    <p style="${EmailStyles.smallText}">
      <strong>Quick Tips:</strong> All payments are processed via secure blockchain transactions.
      Keys are encrypted and never stored in plaintext. Need help? Visit our
      <a href="${frontendUrl}/support" style="color: ${EmailColors.primary};">Support Center</a>.
    </p>
  `;

  return {
    subject: `Welcome to BitLoot, ${displayName}!`,
    html: wrapEmailTemplate(content, { showUnsubscribe: true, unsubscribeEmail: params.email }),
  };
}

// ============================================================
// 3. ORDER CONFIRMATION EMAIL
// ============================================================

export interface OrderConfirmationParams {
  orderId: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  currency: string;
  paymentLink: string;
  email: string;
}

export function orderConfirmationEmail(params: OrderConfirmationParams): EmailTemplate {
  const { orderId, items, total, currency, paymentLink } = params;
  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const itemsList = items
    .map(item => `<li style="${EmailStyles.listItem}">${item.name} x${item.quantity} — ${item.price}</li>`)
    .join('');

  const content = `
    <h2 style="${EmailStyles.heading2}">📦 Order Confirmation</h2>

    <p style="${EmailStyles.paragraph}">
      Thank you for your order! Your BitLoot purchase is ready for payment.
    </p>

    <div style="${EmailStyles.infoBox}">
      <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #${shortOrderId}</p>
      <p style="margin: 0;"><strong>Total:</strong> ${total} ${currency}</p>
    </div>

    <h3 style="${EmailStyles.heading2}">Order Items</h3>
    <ul style="${EmailStyles.list}">
      ${itemsList}
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${paymentLink}" style="${EmailStyles.buttonPrimary}">
        💳 Pay Now with Crypto
      </a>
    </div>

    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0 0 8px 0; color: ${EmailColors.warning};">
        <strong>⏰ Payment link expires in 30 minutes</strong>
      </p>
      <p style="margin: 0; color: ${EmailColors.textSecondary}; font-size: 14px;">
        ⚠️ Underpayments are <strong>non-refundable</strong> due to blockchain immutability.
        Please send the exact amount.
      </p>
    </div>

    <h3 style="${EmailStyles.heading2}">What Happens Next?</h3>
    <ol style="${EmailStyles.list}">
      <li style="${EmailStyles.listItem}">Click the payment button above</li>
      <li style="${EmailStyles.listItem}">Choose your cryptocurrency and send the exact amount</li>
      <li style="${EmailStyles.listItem}">Wait for blockchain confirmation (typically 1-5 minutes)</li>
      <li style="${EmailStyles.listItem}">Receive your keys instantly via secure email link</li>
    </ol>

    <p style="${EmailStyles.paragraph}">
      Questions? Visit our <a href="${frontendUrl}/faq" style="color: ${EmailColors.primary};">FAQ</a>
      or <a href="${frontendUrl}/support" style="color: ${EmailColors.primary};">Support Center</a>.
    </p>
  `;

  return {
    subject: `Order Confirmation #${shortOrderId} — BitLoot`,
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 4. KEY DELIVERY EMAIL
// ============================================================

export interface KeyDeliveryParams {
  orderId: string;
  productName: string;
  downloadUrl: string;
  expiresIn: string;
  email: string;
}

export function keyDeliveryEmail(params: KeyDeliveryParams): EmailTemplate {
  const { orderId, productName, downloadUrl, expiresIn } = params;
  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const content = `
    <h2 style="${EmailStyles.heading2}">🎉 Your Key is Ready!</h2>

    <div style="${EmailStyles.successBox}">
      <p style="margin: 0; color: ${EmailColors.success};">
        ✅ Order <strong>#${shortOrderId}</strong> has been fulfilled successfully!
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      Your purchase of <strong>${productName}</strong> is ready to download.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${downloadUrl}" style="${EmailStyles.buttonSuccess}">
        🔑 Download Your Key
      </a>
    </div>

    <div style="${EmailStyles.infoBox}">
      <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #${shortOrderId}</p>
      <p style="margin: 0 0 8px 0;"><strong>Product:</strong> ${productName}</p>
      <p style="margin: 0;"><strong>Status:</strong> ✅ Completed</p>
    </div>

    <h3 style="${EmailStyles.heading2}">⚠️ Important Security Notice</h3>

    <ul style="${EmailStyles.list}">
      <li style="${EmailStyles.listItem}">🔗 Download available for <strong>${expiresIn}</strong> — after that, sign in to get a new link</li>
      <li style="${EmailStyles.listItem}">🔒 The link is encrypted and only accessible by you</li>
      <li style="${EmailStyles.listItem}">📝 We never email plaintext keys — always use the secure link</li>
      <li style="${EmailStyles.listItem}">🚫 Do not share this link with others</li>
      <li style="${EmailStyles.listItem}">💾 Save your key immediately after downloading</li>
    </ul>

    <h3 style="${EmailStyles.heading2}">Next Steps</h3>

    <ol style="${EmailStyles.list}">
      <li style="${EmailStyles.listItem}">Click the button above to download your key</li>
      <li style="${EmailStyles.listItem}">Save the key file in a secure location</li>
      <li style="${EmailStyles.listItem}">Activate your product using the provided instructions</li>
    </ol>

    <hr style="${EmailStyles.divider}">

    <p style="${EmailStyles.smallText}">
      <strong>Link expired?</strong> <a href="${frontendUrl}/auth/login" style="color: ${EmailColors.primary};">Sign in</a>
      and visit your <a href="${frontendUrl}/account/orders" style="color: ${EmailColors.primary};">order history</a>
      to get a fresh download link.
    </p>
  `;

  return {
    subject: `Your BitLoot Key is Ready — Order #${shortOrderId}`,
    html: wrapEmailTemplate(content, { showUnsubscribe: true, unsubscribeEmail: params.email }),
  };
}

// ============================================================
// 5. PASSWORD RESET EMAIL
// ============================================================

export interface PasswordResetParams {
  resetLink: string;
  email: string;
}

export function passwordResetEmail(params: PasswordResetParams): EmailTemplate {
  const { resetLink } = params;

  const content = `
    <h2 style="${EmailStyles.heading2}">🔐 Password Reset Request</h2>

    <p style="${EmailStyles.paragraph}">
      We received a request to reset your BitLoot password.
      Click the button below to create a new password:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" style="${EmailStyles.buttonPrimary}">
        Reset Password
      </a>
    </div>

    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0; color: ${EmailColors.warning};">
        ⏰ <strong>This link expires in 1 hour.</strong>
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      If you didn't request this password reset, you can safely ignore this email.
      Your password will remain unchanged.
    </p>

    <hr style="${EmailStyles.divider}">

    <p style="${EmailStyles.smallText}">
      <strong>Security Notice:</strong> Never share this link with anyone.
      BitLoot staff will never ask for your password via email.
    </p>
  `;

  return {
    subject: 'Reset Your BitLoot Password',
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 6. UNDERPAYMENT NOTICE EMAIL
// ============================================================

export interface UnderpaymentParams {
  orderId: string;
  amountSent: string;
  amountRequired: string;
  orderStatusUrl: string;
  email: string;
}

export function underpaymentNoticeEmail(params: UnderpaymentParams): EmailTemplate {
  const { orderId, amountSent, amountRequired, orderStatusUrl } = params;
  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const content = `
    <h2 style="${EmailStyles.heading2}">⚠️ Payment Underpaid</h2>

    <div style="${EmailStyles.errorBox}">
      <p style="margin: 0; color: ${EmailColors.error};">
        <strong>Payment Status: FAILED — NON-REFUNDABLE</strong>
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      We received your payment for order <strong>#${shortOrderId}</strong>,
      but the amount was insufficient.
    </p>

    <div style="${EmailStyles.infoBox}">
      <p style="margin: 0 0 8px 0;"><strong>Amount Sent:</strong> ${amountSent}</p>
      <p style="margin: 0;"><strong>Amount Required:</strong> ${amountRequired}</p>
    </div>

    <h3 style="${EmailStyles.heading2}">Why Is This Non-Refundable?</h3>

    <p style="${EmailStyles.paragraph}">
      Blockchain transactions are <strong>irreversible</strong>. Our payment processor
      (NOWPayments) cannot refund underpaid amounts due to the immutable nature of
      cryptocurrency transactions.
    </p>

    <h3 style="${EmailStyles.heading2}">What Can You Do?</h3>

    <ol style="${EmailStyles.list}">
      <li style="${EmailStyles.listItem}">Check your wallet for the transaction confirmation</li>
      <li style="${EmailStyles.listItem}">If you need assistance, please contact our support team</li>
      <li style="${EmailStyles.listItem}">To place a new order, please start fresh and send the <strong>exact amount</strong></li>
    </ol>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${orderStatusUrl}" style="${EmailStyles.buttonDanger}">
        View Order Status
      </a>
    </div>

    <p style="${EmailStyles.paragraph}">
      We're sorry we couldn't complete this order. Our
      <a href="${frontendUrl}/support" style="color: ${EmailColors.primary};">support team</a>
      is here to help if you have questions.
    </p>
  `;

  return {
    subject: `Payment Underpaid — Order #${shortOrderId} — BitLoot`,
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 7. PAYMENT FAILED EMAIL
// ============================================================

export interface PaymentFailedParams {
  orderId: string;
  reason: string;
  orderStatusUrl: string;
  email: string;
}

export function paymentFailedEmail(params: PaymentFailedParams): EmailTemplate {
  const { orderId, reason, orderStatusUrl } = params;
  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const content = `
    <h2 style="${EmailStyles.heading2}">❌ Payment Failed</h2>

    <div style="${EmailStyles.errorBox}">
      <p style="margin: 0; color: ${EmailColors.error};">
        Your payment for order <strong>#${shortOrderId}</strong> could not be processed.
      </p>
    </div>

    <div style="${EmailStyles.infoBox}">
      <p style="margin: 0;"><strong>Reason:</strong> ${reason || 'Payment processing error'}</p>
    </div>

    <h3 style="${EmailStyles.heading2}">What Happens Next?</h3>

    <p style="${EmailStyles.paragraph}">
      Your order has been cancelled and <strong>no funds have been charged</strong>. You can:
    </p>

    <ul style="${EmailStyles.list}">
      <li style="${EmailStyles.listItem}">Try placing a new order with a different payment method</li>
      <li style="${EmailStyles.listItem}">Contact our support team for assistance</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${orderStatusUrl}" style="${EmailStyles.buttonDanger}">
        View Order Status
      </a>
    </div>

    <p style="${EmailStyles.paragraph}">
      We apologize for the inconvenience. Our
      <a href="${frontendUrl}/support" style="color: ${EmailColors.primary};">support team</a>
      is here to help.
    </p>
  `;

  return {
    subject: `Payment Failed — Order #${shortOrderId} — BitLoot`,
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 8. PAYMENT EXPIRED EMAIL
// ============================================================

export interface PaymentExpiredParams {
  orderId: string;
  reason?: string;
  retryUrl: string;
  email: string;
}

export function paymentExpiredEmail(params: PaymentExpiredParams): EmailTemplate {
  const { orderId, reason, retryUrl } = params;
  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const content = `
    <h2 style="${EmailStyles.heading2}">⏰ Payment Expired</h2>

    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0; color: ${EmailColors.warning};">
        The payment window for order <strong>#${shortOrderId}</strong> has expired.
      </p>
    </div>

    <div style="${EmailStyles.infoBox}">
      <p style="margin: 0;"><strong>Reason:</strong> ${reason || 'Payment window timed out (1 hour)'}</p>
    </div>

    <p style="${EmailStyles.paragraph}">
      <strong>Don't worry!</strong> No funds have been charged. Our checkout has a
      1-hour window to complete payment.
    </p>

    <h3 style="${EmailStyles.heading2}">What Can You Do?</h3>

    <ul style="${EmailStyles.list}">
      <li style="${EmailStyles.listItem}">Visit our checkout page to create a new order</li>
      <li style="${EmailStyles.listItem}">Ensure you have your wallet ready before starting payment</li>
      <li style="${EmailStyles.listItem}">Complete the transfer promptly once you receive the payment address</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${retryUrl}" style="${EmailStyles.buttonSecondary}">
        🛒 Create New Order
      </a>
    </div>

    <p style="${EmailStyles.paragraph}">
      We're here to help if you have any questions!
      <a href="${frontendUrl}/support" style="color: ${EmailColors.primary};">Contact Support</a>
    </p>
  `;

  return {
    subject: `Payment Expired — Order #${shortOrderId} — BitLoot`,
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 9. EMAIL CHANGED (NOTIFICATION TO OLD EMAIL)
// ============================================================

export interface EmailChangedOldParams {
  oldEmail: string;
  newEmail: string;
}

export function emailChangedOldEmail(params: EmailChangedOldParams): EmailTemplate {
  const { newEmail } = params;
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const content = `
    <h2 style="${EmailStyles.heading2}">📧 Email Changed Successfully</h2>

    <div style="${EmailStyles.infoBox}">
      <p style="margin: 0;">
        Your BitLoot account email has been changed to: <strong>${newEmail}</strong>
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      This email address will no longer be associated with your BitLoot account.
    </p>

    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0; color: ${EmailColors.warning};">
        <strong>Didn't make this change?</strong><br>
        Contact support immediately at
        <a href="mailto:support@bitloot.com" style="color: ${EmailColors.primary};">support@bitloot.com</a>
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      This is a security notification — no action is needed if you initiated this change.
    </p>
  `;

  return {
    subject: 'Your BitLoot Email Has Been Changed',
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 10. EMAIL CHANGED (WELCOME TO NEW EMAIL)
// ============================================================

export interface EmailChangedNewParams {
  newEmail: string;
}

export function emailChangedNewEmail(params: EmailChangedNewParams): EmailTemplate {
  const { newEmail } = params;
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const content = `
    <h2 style="${EmailStyles.heading2}">📧 Email Updated Successfully</h2>

    <div style="${EmailStyles.successBox}">
      <p style="margin: 0; color: ${EmailColors.success};">
        ✅ Your BitLoot account email has been successfully changed to this address.
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      You can now use <strong>${newEmail}</strong> to log in to your account.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${frontendUrl}/auth/login" style="${EmailStyles.buttonPrimary}">
        Sign In to BitLoot
      </a>
    </div>

    <p style="${EmailStyles.paragraph}">
      Welcome to your updated account! All your order history and settings have been preserved.
    </p>
  `;

  return {
    subject: 'Welcome to Your Updated BitLoot Account',
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 11. ACCOUNT DELETION SCHEDULED EMAIL
// ============================================================

export interface DeletionScheduledParams {
  email: string;
  deletionDate: Date;
  daysRemaining: number;
  cancelUrl: string;
}

export function deletionScheduledEmail(params: DeletionScheduledParams): EmailTemplate {
  const { deletionDate, daysRemaining, cancelUrl } = params;
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const content = `
    <h2 style="${EmailStyles.heading2}">🗑️ Account Deletion Scheduled</h2>

    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0; color: ${EmailColors.warning};">
        Your BitLoot account is scheduled for deletion on
        <strong>${deletionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      You have <strong>${daysRemaining} days</strong> to cancel this request if you change your mind.
    </p>

    <div style="${EmailStyles.errorBox}">
      <p style="margin: 0; color: ${EmailColors.error};">
        ⚠️ <strong>Once deleted, all your data will be permanently removed and cannot be recovered.</strong>
      </p>
    </div>

    <h3 style="${EmailStyles.heading2}">Changed Your Mind?</h3>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${cancelUrl}" style="${EmailStyles.buttonSuccess}">
        ❌ Cancel Deletion
      </a>
    </div>

    <p style="${EmailStyles.smallText}">
      This link is secure and expires in 30 days. If you didn't request this deletion,
      please <a href="${frontendUrl}/profile?tab=security" style="color: ${EmailColors.primary};">secure your account</a>
      immediately.
    </p>
  `;

  return {
    subject: 'Account Deletion Scheduled — BitLoot',
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 12. ACCOUNT DELETION CANCELLED EMAIL
// ============================================================

export interface DeletionCancelledParams {
  email: string;
}

export function deletionCancelledEmail(params: DeletionCancelledParams): EmailTemplate {
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  const content = `
    <h2 style="${EmailStyles.heading2}">✅ Account Deletion Cancelled</h2>

    <div style="${EmailStyles.successBox}">
      <p style="margin: 0; color: ${EmailColors.success};">
        Your BitLoot account deletion has been cancelled successfully.
        Your account is now <strong>active again</strong>.
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      All your data, order history, and settings have been preserved.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${frontendUrl}/profile" style="${EmailStyles.buttonPrimary}">
        View Your Account
      </a>
    </div>

    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0; color: ${EmailColors.warning};">
        <strong>Didn't request this cancellation?</strong><br>
        Contact support immediately and consider changing your password.
        <a href="${frontendUrl}/profile?tab=security" style="color: ${EmailColors.primary};">Account Settings</a>
      </p>
    </div>
  `;

  return {
    subject: 'Account Deletion Cancelled — BitLoot',
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 13. GENERIC EMAIL (for custom messages)
// ============================================================

export interface GenericEmailParams {
  subject: string;
  heading: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  email?: string;
}

export function genericEmail(params: GenericEmailParams): EmailTemplate {
  const { subject, heading, content: messageContent, ctaText, ctaUrl, email } = params;

  const ctaButton = ctaText && ctaUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl}" style="${EmailStyles.buttonPrimary}">
        ${ctaText}
      </a>
    </div>
  ` : '';

  const htmlContent = `
    <h2 style="${EmailStyles.heading2}">${heading}</h2>
    <div style="${EmailStyles.paragraph}">${messageContent}</div>
    ${ctaButton}
  `;

  return {
    subject,
    html: wrapEmailTemplate(htmlContent, { showUnsubscribe: !!email, unsubscribeEmail: email }),
  };
}

// ============================================================
// EXPORT ALL TEMPLATES
// ============================================================

export const EmailTemplates = {
  otpVerification: otpVerificationEmail,
  welcome: welcomeEmail,
  orderConfirmation: orderConfirmationEmail,
  keyDelivery: keyDeliveryEmail,
  passwordReset: passwordResetEmail,
  underpaymentNotice: underpaymentNoticeEmail,
  paymentFailed: paymentFailedEmail,
  paymentExpired: paymentExpiredEmail,
  emailChangedOld: emailChangedOldEmail,
  emailChangedNew: emailChangedNewEmail,
  deletionScheduled: deletionScheduledEmail,
  deletionCancelled: deletionCancelledEmail,
  generic: genericEmail,
} as const;

export type EmailTemplateType = keyof typeof EmailTemplates;
