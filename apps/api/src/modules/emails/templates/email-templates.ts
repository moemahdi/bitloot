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
 * 2.  Order Confirmation       - orderConfirmationEmail()
 * 3.  Products Delivery        - keyDeliveryEmail()
 * 4.  Underpayment Notice      - underpaymentNoticeEmail()
 * 5.  Payment Failed           - paymentFailedEmail()
 * 6.  Payment Expired          - paymentExpiredEmail()
 * 7.  Email Changed (Old)      - emailChangedOldEmail()
 * 8.  Email Changed (New)      - emailChangedNewEmail()
 * 9.  Deletion Scheduled       - deletionScheduledEmail()
 * 10. Deletion Cancelled       - deletionCancelledEmail()
 * 11. Generic Email            - genericEmail()
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
    <h2 style="${EmailStyles.heading2}">🎮 Welcome to BitLoot!</h2>

    <p style="${EmailStyles.paragraph}">
      Enter this code to verify your email and start shopping:
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
      Your free account unlocks <strong>purchase history</strong>, <strong>wishlists</strong>, and <strong>instant access to all your purchases</strong> — no more digging through emails.
    </p>

    <p style="${EmailStyles.paragraph}">
      Didn't request this? You can safely ignore this email.
    </p>
  `;

  return {
    subject: 'Your BitLoot Verification Code',
    html: wrapEmailTemplate(content, { showFooter: true }),
  };
}

// ============================================================
// 2. ORDER CONFIRMATION EMAIL
// ============================================================

export interface OrderConfirmationParams {
  orderId: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  currency: string;
  paymentLink: string;
  email: string;
  createdAt?: string; // ISO date string
}

/**
 * Format price to €XX.XX format
 */
function formatEuroPrice(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return `€0.00`;
  return `€${numValue.toFixed(2)}`;
}

/**
 * Format individual item price
 */
function formatItemPrice(price: string, quantity: number): string {
  const numValue = parseFloat(price);
  if (isNaN(numValue)) return `€0.00`;
  const total = numValue * quantity;
  return `€${total.toFixed(2)}`;
}

export function orderConfirmationEmail(params: OrderConfirmationParams): EmailTemplate {
  const { orderId, items, total, paymentLink, createdAt } = params;
  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';
  
  // Format the order date
  const dateFormatOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  const orderDate = createdAt !== undefined && createdAt !== null && createdAt.length > 0
    ? new Date(createdAt).toLocaleDateString('en-US', dateFormatOptions)
    : new Date().toLocaleDateString('en-US', dateFormatOptions);

  // Build items table rows
  const itemsTableRows = items
    .map(item => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid ${EmailColors.borderSubtle}; color: ${EmailColors.textPrimary}; font-size: 15px;">
          ${item.name}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid ${EmailColors.borderSubtle}; color: ${EmailColors.textSecondary}; text-align: center; font-size: 15px;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid ${EmailColors.borderSubtle}; color: ${EmailColors.primary}; text-align: right; font-weight: 600; font-size: 15px;">
          ${formatItemPrice(item.price, item.quantity)}
        </td>
      </tr>
    `)
    .join('');

  const content = `
    <h2 style="${EmailStyles.heading2}">📦 Order Confirmation</h2>

    <p style="${EmailStyles.paragraph}">
      Thank you for your order! Your BitLoot purchase is ready for payment.
    </p>

    <!-- Order Summary Card -->
    <div style="background: ${EmailColors.bgTertiary}; border: 1px solid ${EmailColors.borderAccent}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Order ID</td>
          <td style="padding: 8px 0; color: ${EmailColors.textPrimary}; text-align: right; font-weight: 600; font-size: 14px; font-family: 'SF Mono', 'Monaco', monospace;">
            #${shortOrderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Full Reference</td>
          <td style="padding: 8px 0; color: ${EmailColors.textMuted}; text-align: right; font-size: 12px; font-family: 'SF Mono', 'Monaco', monospace; word-break: break-all;">
            ${orderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Date</td>
          <td style="padding: 8px 0; color: ${EmailColors.textPrimary}; text-align: right; font-size: 14px;">
            ${orderDate}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Status</td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="display: inline-block; background: rgba(255, 107, 0, 0.15); color: ${EmailColors.warning}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">
              ⏳ Awaiting Payment
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Order Items Table -->
    <h3 style="${EmailStyles.heading2}">🛒 Order Items</h3>
    
    <div style="background: ${EmailColors.bgSecondary}; border: 1px solid ${EmailColors.borderSubtle}; border-radius: 12px; overflow: hidden; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: ${EmailColors.bgTertiary};">
            <th style="padding: 12px 16px; text-align: left; color: ${EmailColors.textSecondary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Product
            </th>
            <th style="padding: 12px 16px; text-align: center; color: ${EmailColors.textSecondary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Qty
            </th>
            <th style="padding: 12px 16px; text-align: right; color: ${EmailColors.textSecondary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Price
            </th>
          </tr>
        </thead>
        <tbody>
          ${itemsTableRows}
        </tbody>
        <tfoot>
          <tr style="background: ${EmailColors.bgTertiary};">
            <td colspan="2" style="padding: 16px; color: ${EmailColors.textPrimary}; font-size: 16px; font-weight: 600;">
              Total
            </td>
            <td style="padding: 16px; text-align: right; color: ${EmailColors.primary}; font-size: 20px; font-weight: 700;">
              ${formatEuroPrice(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Payment CTA -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${paymentLink}" style="${EmailStyles.buttonPrimary}">
        💳 Pay Now with Crypto
      </a>
    </div>

    <!-- Payment Timer Warning -->
    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0; color: ${EmailColors.warning}; font-size: 15px;">
        <strong>⏰ Payment window expires in 1 hour.</strong><br>
        <span style="color: ${EmailColors.textSecondary}; font-size: 14px;">Please send the exact amount shown on the payment page.</span>
      </p>
    </div>

    <!-- Next Steps -->
    <h3 style="${EmailStyles.heading2}">📋 What Happens Next?</h3>
    
    <div style="background: ${EmailColors.bgSecondary}; border: 1px solid ${EmailColors.borderSubtle}; border-radius: 12px; padding: 20px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top; width: 32px;">
            <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%); color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">1</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Click the <strong style="color: ${EmailColors.textPrimary};">Pay Now</strong> button above
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%); color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">2</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Select your <strong style="color: ${EmailColors.textPrimary};">preferred cryptocurrency</strong> and send the exact amount
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%); color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">3</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Wait for <strong style="color: ${EmailColors.textPrimary};">blockchain confirmation</strong> (typically 1-10 minutes)
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: ${EmailColors.success}; color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">✓</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Receive your <strong style="color: ${EmailColors.success};">products instantly.</strong>
          </td>
        </tr>
      </table>
    </div>

    <hr style="${EmailStyles.divider}">

    <p style="${EmailStyles.smallText}; text-align: center;">
      Need help? Visit our <a href="${frontendUrl}/help" style="color: ${EmailColors.primary};">Help Center</a> or reply to this email.
    </p>
  `;

  return {
    subject: `Order #${shortOrderId} — Order Confirmation — BitLoot`,
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 4. PRODUCTS DELIVERY EMAIL
// ============================================================

export interface KeyDeliveryParams {
  orderId: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  successPageUrl: string; // URL to the order success page
  email: string;
}

export function keyDeliveryEmail(params: KeyDeliveryParams): EmailTemplate {
  const { orderId, items, total, successPageUrl } = params;
  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';

  // Build items table rows
  const itemsTableRows = items
    .map(item => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid ${EmailColors.borderSubtle}; color: ${EmailColors.textPrimary}; font-size: 15px;">
          ${item.name}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid ${EmailColors.borderSubtle}; color: ${EmailColors.textSecondary}; text-align: center; font-size: 15px;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid ${EmailColors.borderSubtle}; color: ${EmailColors.primary}; text-align: right; font-weight: 600; font-size: 15px;">
          ${formatItemPrice(item.price, item.quantity)}
        </td>
      </tr>
    `)
    .join('');

  const content = `
    <h2 style="${EmailStyles.heading2}">🎉 Your Purchase is Ready!</h2>

    <!-- Success Banner -->
    <div style="background: rgba(57, 255, 20, 0.1); border: 1px solid ${EmailColors.success}; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: ${EmailColors.success}; font-size: 18px; font-weight: 600;">
        ✅ Order Fulfilled Successfully!
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      Great news! Your purchase has been processed and your products are ready to view.
    </p>

    <!-- Order Details Card -->
    <div style="background: ${EmailColors.bgTertiary}; border: 1px solid ${EmailColors.borderAccent}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Order ID</td>
          <td style="padding: 8px 0; color: ${EmailColors.textPrimary}; text-align: right; font-weight: 600; font-size: 14px; font-family: 'SF Mono', 'Monaco', monospace;">
            #${shortOrderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Full Reference</td>
          <td style="padding: 8px 0; color: ${EmailColors.textMuted}; text-align: right; font-size: 12px; font-family: 'SF Mono', 'Monaco', monospace; word-break: break-all;">
            ${orderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Status</td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="display: inline-block; background: rgba(57, 255, 20, 0.15); color: ${EmailColors.success}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">
              ✅ Completed
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Order Items Table -->
    <h3 style="${EmailStyles.heading2}">🎮 Your Products</h3>
    
    <div style="background: ${EmailColors.bgSecondary}; border: 1px solid ${EmailColors.borderSubtle}; border-radius: 12px; overflow: hidden; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: ${EmailColors.bgTertiary};">
            <th style="padding: 12px 16px; text-align: left; color: ${EmailColors.textSecondary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Product
            </th>
            <th style="padding: 12px 16px; text-align: center; color: ${EmailColors.textSecondary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Qty
            </th>
            <th style="padding: 12px 16px; text-align: right; color: ${EmailColors.textSecondary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Price
            </th>
          </tr>
        </thead>
        <tbody>
          ${itemsTableRows}
        </tbody>
        <tfoot>
          <tr style="background: ${EmailColors.bgTertiary};">
            <td colspan="2" style="padding: 16px; color: ${EmailColors.textPrimary}; font-size: 16px; font-weight: 600;">
              Total Paid
            </td>
            <td style="padding: 16px; text-align: right; color: ${EmailColors.success}; font-size: 20px; font-weight: 700;">
              ${formatEuroPrice(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- View Products CTA -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${successPageUrl}" style="${EmailStyles.buttonSuccess}">
        🔑 View & Reveal Your Products
      </a>
    </div>

    <!-- How to Access -->
    <h3 style="${EmailStyles.heading2}">📋 How to Access Your Products</h3>
    
    <div style="background: ${EmailColors.bgSecondary}; border: 1px solid ${EmailColors.borderSubtle}; border-radius: 12px; padding: 20px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top; width: 32px;">
            <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%); color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">1</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Click <strong style="color: ${EmailColors.success};">View & Reveal Your Products</strong> above
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%); color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">2</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Click <strong style="color: ${EmailColors.textPrimary};">Reveal</strong> to view your product keys or codes
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: ${EmailColors.success}; color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">✓</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            <strong style="color: ${EmailColors.success};">Activate</strong> your products using the provided instructions
          </td>
        </tr>
      </table>
    </div>

    <!-- Access Anytime Info -->
    <div style="background: rgba(0, 217, 255, 0.08); border: 1px solid ${EmailColors.primary}; border-radius: 12px; padding: 16px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top; width: 32px; padding-right: 12px;">
            <span style="font-size: 24px;">💡</span>
          </td>
          <td style="color: ${EmailColors.textSecondary}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${EmailColors.textPrimary};">Access anytime:</strong> Your purchases are saved to your account. 
            Visit <a href="${frontendUrl}/profile" style="color: ${EmailColors.primary}; text-decoration: none; font-weight: 500;">your profile</a> 
            and go to the <strong style="color: ${EmailColors.textPrimary};">Purchases</strong> tab to view all your orders.
          </td>
        </tr>
      </table>
    </div>

    <hr style="${EmailStyles.divider}">

    <p style="color: ${EmailColors.textMuted}; font-size: 13px; text-align: center; margin: 0;">
      Need help? Visit our <a href="${frontendUrl}/help" style="color: ${EmailColors.primary}; text-decoration: none;">Help Center</a> or reply to this email.
    </p>
  `;

  return {
    subject: `Your BitLoot Purchase is Ready — Order #${shortOrderId}`,
    html: wrapEmailTemplate(content, { showUnsubscribe: true, unsubscribeEmail: params.email }),
  };
}

// ============================================================
// 5. UNDERPAYMENT NOTICE EMAIL
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

    <!-- Error Banner -->
    <div style="${EmailStyles.errorBox}">
      <p style="margin: 0; color: ${EmailColors.error}; font-size: 16px;">
        <strong>Payment Status: FAILED — NON-REFUNDABLE</strong>
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      We received your payment for the order below, but the amount was insufficient.
    </p>

    <!-- Order Details Card -->
    <div style="background: ${EmailColors.bgTertiary}; border: 1px solid ${EmailColors.borderAccent}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Order ID</td>
          <td style="padding: 8px 0; color: ${EmailColors.textPrimary}; text-align: right; font-weight: 600; font-size: 14px; font-family: 'SF Mono', 'Monaco', monospace;">
            #${shortOrderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Full Reference</td>
          <td style="padding: 8px 0; color: ${EmailColors.textMuted}; text-align: right; font-size: 12px; font-family: 'SF Mono', 'Monaco', monospace; word-break: break-all;">
            ${orderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Status</td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="display: inline-block; background: rgba(255, 107, 0, 0.15); color: ${EmailColors.warning}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">
              ❌ Failed
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Payment Details -->
    <div style="background: ${EmailColors.bgSecondary}; border: 1px solid ${EmailColors.borderSubtle}; border-radius: 12px; overflow: hidden; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 16px; color: ${EmailColors.textSecondary}; font-size: 15px; border-bottom: 1px solid ${EmailColors.borderSubtle};">
            Amount Sent
          </td>
          <td style="padding: 16px; color: ${EmailColors.warning}; text-align: right; font-weight: 600; font-size: 16px; border-bottom: 1px solid ${EmailColors.borderSubtle};">
            ${amountSent}
          </td>
        </tr>
        <tr>
          <td style="padding: 16px; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Amount Required
          </td>
          <td style="padding: 16px; color: ${EmailColors.success}; text-align: right; font-weight: 600; font-size: 16px;">
            ${amountRequired}
          </td>
        </tr>
      </table>
    </div>

    <h3 style="${EmailStyles.heading2}">❓ Why Is This Non-Refundable?</h3>

    <p style="${EmailStyles.paragraph}">
      Blockchain transactions are <strong style="color: ${EmailColors.textPrimary};">irreversible</strong>. Once sent, funds cannot be returned.
    </p>

    <h3 style="${EmailStyles.heading2}">📋 What Can You Do?</h3>
    
    <div style="background: ${EmailColors.bgSecondary}; border: 1px solid ${EmailColors.borderSubtle}; border-radius: 12px; padding: 20px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top; width: 32px;">
            <span style="display: inline-block; width: 28px; height: 28px; background: ${EmailColors.bgTertiary}; border: 1px solid ${EmailColors.borderAccent}; color: ${EmailColors.textSecondary}; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">1</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Check your <strong style="color: ${EmailColors.textPrimary};">wallet</strong> for the transaction confirmation
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: ${EmailColors.bgTertiary}; border: 1px solid ${EmailColors.borderAccent}; color: ${EmailColors.textSecondary}; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">2</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            If you need assistance, please <strong style="color: ${EmailColors.textPrimary};">contact our support team</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: ${EmailColors.bgTertiary}; border: 1px solid ${EmailColors.borderAccent}; color: ${EmailColors.textSecondary}; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">3</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            To place a new order, start fresh and send the <strong style="color: ${EmailColors.success};">exact amount</strong>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${orderStatusUrl}" style="${EmailStyles.buttonDanger}">
        View Order Status
      </a>
    </div>

    <hr style="${EmailStyles.divider}">

    <p style="color: ${EmailColors.textMuted}; font-size: 13px; text-align: center; margin: 0;">
      We're sorry we couldn't complete this order. Need help?
      <a href="${frontendUrl}/help" style="color: ${EmailColors.primary}; text-decoration: none;">Visit our Help Center</a>
    </p>
  `;

  return {
    subject: `Payment Underpaid — Order #${shortOrderId} — BitLoot`,
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 6. PAYMENT FAILED EMAIL
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

    <!-- Error Banner -->
    <div style="${EmailStyles.errorBox}">
      <p style="margin: 0; color: ${EmailColors.error}; font-size: 16px;">
        Your payment could not be processed.
      </p>
    </div>

    <!-- Order Details Card -->
    <div style="background: ${EmailColors.bgTertiary}; border: 1px solid ${EmailColors.borderAccent}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Order ID</td>
          <td style="padding: 8px 0; color: ${EmailColors.textPrimary}; text-align: right; font-weight: 600; font-size: 14px; font-family: 'SF Mono', 'Monaco', monospace;">
            #${shortOrderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Full Reference</td>
          <td style="padding: 8px 0; color: ${EmailColors.textMuted}; text-align: right; font-size: 12px; font-family: 'SF Mono', 'Monaco', monospace; word-break: break-all;">
            ${orderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Status</td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="display: inline-block; background: rgba(255, 107, 0, 0.15); color: ${EmailColors.warning}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">
              ❌ Failed
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Reason</td>
          <td style="padding: 8px 0; color: ${EmailColors.textPrimary}; text-align: right; font-size: 14px;">
            ${reason ?? 'Payment processing error'}
          </td>
        </tr>
      </table>
    </div>

    <h3 style="${EmailStyles.heading2}">📋 What Happens Next?</h3>

    <!-- Info Box -->
    <div style="background: rgba(0, 217, 255, 0.08); border: 1px solid ${EmailColors.primary}; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
        Your order has been cancelled and <strong style="color: ${EmailColors.success};">no funds have been charged</strong>.
      </p>
    </div>
    
    <div style="background: ${EmailColors.bgSecondary}; border: 1px solid ${EmailColors.borderSubtle}; border-radius: 12px; padding: 20px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top; width: 32px;">
            <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%); color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">1</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Place a <strong style="color: ${EmailColors.textPrimary};">new order</strong> and try a different cryptocurrency
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%); color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">2</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Visit our <a href="${frontendUrl}/help" style="color: ${EmailColors.primary}; text-decoration: none; font-weight: 500;">Help Center</a> for troubleshooting tips
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${orderStatusUrl}" style="${EmailStyles.buttonDanger}">
        View Order Status
      </a>
    </div>

    <hr style="${EmailStyles.divider}">

    <p style="color: ${EmailColors.textMuted}; font-size: 13px; text-align: center; margin: 0;">
      We apologize for the inconvenience. Need help?
      <a href="${frontendUrl}/help" style="color: ${EmailColors.primary}; text-decoration: none;">Contact Support</a>
    </p>
  `;

  return {
    subject: `Payment Failed — Order #${shortOrderId} — BitLoot`,
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 7. PAYMENT EXPIRED EMAIL
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

    <!-- Warning Banner -->
    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0; color: ${EmailColors.warning}; font-size: 16px;">
        The payment window has expired.
      </p>
    </div>

    <!-- Order Details Card -->
    <div style="background: ${EmailColors.bgTertiary}; border: 1px solid ${EmailColors.borderAccent}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Order ID</td>
          <td style="padding: 8px 0; color: ${EmailColors.textPrimary}; text-align: right; font-weight: 600; font-size: 14px; font-family: 'SF Mono', 'Monaco', monospace;">
            #${shortOrderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Full Reference</td>
          <td style="padding: 8px 0; color: ${EmailColors.textMuted}; text-align: right; font-size: 12px; font-family: 'SF Mono', 'Monaco', monospace; word-break: break-all;">
            ${orderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Status</td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="display: inline-block; background: rgba(255, 107, 0, 0.15); color: ${EmailColors.warning}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">
              ⏰ Expired
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${EmailColors.textSecondary}; font-size: 14px;">Reason</td>
          <td style="padding: 8px 0; color: ${EmailColors.textPrimary}; text-align: right; font-size: 14px;">
            ${reason ?? 'Payment window timed out (1 hour)'}
          </td>
        </tr>
      </table>
    </div>

    <!-- Info Box -->
    <div style="background: rgba(0, 217, 255, 0.08); border: 1px solid ${EmailColors.primary}; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top; width: 32px; padding-right: 12px;">
            <span style="font-size: 24px;">💡</span>
          </td>
          <td style="color: ${EmailColors.textSecondary}; font-size: 15px; line-height: 1.5;">
            <strong style="color: ${EmailColors.success};">Don't worry!</strong> No funds have been charged.
          </td>
        </tr>
      </table>
    </div>

    <h3 style="${EmailStyles.heading2}">📋 Tips for Next Time</h3>
    
    <div style="background: ${EmailColors.bgSecondary}; border: 1px solid ${EmailColors.borderSubtle}; border-radius: 12px; padding: 20px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top; width: 32px;">
            <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%); color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">1</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Have your <strong style="color: ${EmailColors.textPrimary};">crypto wallet ready</strong> before checkout
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%); color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">2</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            Complete the <strong style="color: ${EmailColors.textPrimary};">transfer promptly</strong> when you see the payment address
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 16px 10px 0; vertical-align: top;">
            <span style="display: inline-block; width: 28px; height: 28px; background: ${EmailColors.success}; color: #000; font-weight: 700; font-size: 14px; line-height: 28px; text-align: center; border-radius: 50%;">✓</span>
          </td>
          <td style="padding: 10px 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
            <strong style="color: ${EmailColors.success};">Ready?</strong> Start a new order when you're prepared to pay
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${retryUrl}" style="${EmailStyles.buttonPrimary}">
        🛒 Shop Again
      </a>
    </div>

    <hr style="${EmailStyles.divider}">

    <p style="color: ${EmailColors.textMuted}; font-size: 13px; text-align: center; margin: 0;">
      Need help? Visit our <a href="${frontendUrl}/help" style="color: ${EmailColors.primary}; text-decoration: none;">Help Center</a>
    </p>
  `;

  return {
    subject: `Payment Expired — Order #${shortOrderId} — BitLoot`,
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 8. EMAIL CHANGED (NOTIFICATION TO OLD EMAIL)
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

    <!-- Info Box with explicit colors -->
    <div style="background: rgba(0, 217, 255, 0.08); border: 1px solid ${EmailColors.primary}; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: ${EmailColors.textSecondary}; font-size: 15px;">
        Your BitLoot account email has been changed to:
      </p>
      <p style="margin: 8px 0 0 0; color: ${EmailColors.primary}; font-size: 16px; font-weight: 600;">
        ${newEmail}
      </p>
    </div>

    <p style="${EmailStyles.paragraph}">
      This email address will no longer be associated with your BitLoot account.
    </p>

    <!-- Warning Box -->
    <div style="${EmailStyles.warningBox}">
      <p style="margin: 0; color: ${EmailColors.warning}; font-size: 15px;">
        <strong>⚠️ Didn't make this change?</strong>
      </p>
      <p style="margin: 8px 0 0 0; color: ${EmailColors.textSecondary}; font-size: 14px;">
        <a href="${frontendUrl}/help" style="color: ${EmailColors.primary}; text-decoration: none; font-weight: 500;">Contact support immediately</a> to secure your account.
      </p>
    </div>
  `;

  return {
    subject: 'Your BitLoot Email Has Been Changed',
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 9. EMAIL CHANGED (WELCOME TO NEW EMAIL)
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
      <a href="${frontendUrl}/login" style="${EmailStyles.buttonPrimary}">
        Sign In to BitLoot
      </a>
    </div>

    <p style="${EmailStyles.paragraph}">
      Your account is ready! All your order history and settings have been preserved.
    </p>
  `;

  return {
    subject: 'Email Updated — BitLoot',
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 10. ACCOUNT DELETION SCHEDULED EMAIL
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
      This link is valid for 30 days. If you didn't request this deletion,
      please <a href="${frontendUrl}/help" style="color: ${EmailColors.primary};">contact support</a>
      immediately to secure your account.
    </p>
  `;

  return {
    subject: 'Account Deletion Scheduled — BitLoot',
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 11. ACCOUNT DELETION CANCELLED EMAIL
// ============================================================

export interface DeletionCancelledParams {
  email: string;
}

export function deletionCancelledEmail(_params: DeletionCancelledParams): EmailTemplate {
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
        <a href="${frontendUrl}/help" style="color: ${EmailColors.primary};">Contact support</a> immediately to secure your account.
      </p>
    </div>
  `;

  return {
    subject: 'Account Deletion Cancelled — BitLoot',
    html: wrapEmailTemplate(content),
  };
}

// ============================================================
// 12. GENERIC EMAIL (for custom messages)
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

  const ctaButton = ctaText !== undefined && ctaText !== '' && ctaUrl !== undefined && ctaUrl !== '' ? `
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
    html: wrapEmailTemplate(htmlContent, { showUnsubscribe: email !== undefined && email !== '', unsubscribeEmail: email }),
  };
}

// ============================================================
// EXPORT ALL TEMPLATES
// ============================================================

export const EmailTemplates = {
  otpVerification: otpVerificationEmail,
  orderConfirmation: orderConfirmationEmail,
  keyDelivery: keyDeliveryEmail,
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
