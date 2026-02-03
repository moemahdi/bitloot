import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Email colors (from email-styles.ts)
const EmailColors = {
  primary: '#00D9FF',
  secondary: '#9D4EDD',
  success: '#39FF14',
  warning: '#FF6B00',
  error: '#FF6B00',
  bgPrimary: '#0A0E1A',
  bgSecondary: '#0F1420',
  bgTertiary: '#161D2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B4BDD0',
  textMuted: '#7A8599',
  borderSubtle: '#2A3344',
  borderAccent: '#363F52',
};

// Sample test data
const testData = {
  orderId: '36de58a7-7c59-4571-b150-ad324f1fe9d0',
  productName: 'Grand Theft Auto V - Premium Edition',
  downloadUrl: 'https://bitloot.io/orders/36de58a7/keys',
  expiresIn: '24 hours',
};

const shortOrderId = testData.orderId.substring(0, 8).toUpperCase();

// Build the email HTML
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${EmailColors.bgPrimary}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: ${EmailColors.primary}; font-size: 32px; font-weight: 700; margin: 0; font-style: italic;">BitLoot</h1>
      <p style="color: ${EmailColors.textMuted}; font-size: 12px; letter-spacing: 2px; margin: 8px 0 0 0; text-transform: uppercase;">Crypto Gaming Store</p>
    </div>
    
    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid ${EmailColors.borderSubtle}; margin: 24px 0;">
    
    <!-- Content -->
    <div style="background: ${EmailColors.bgSecondary}; border-radius: 16px; padding: 32px; border: 1px solid ${EmailColors.borderSubtle};">
      <h2 style="color: ${EmailColors.textPrimary}; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">🎉 Your Purchase is Ready!</h2>

      <div style="background: rgba(57, 255, 20, 0.08); border: 1px solid ${EmailColors.success}; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; color: ${EmailColors.success};">
          ✅ Order <strong>#${shortOrderId}</strong> has been fulfilled successfully!
        </p>
      </div>

      <p style="color: ${EmailColors.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Your purchase of <strong style="color: ${EmailColors.textPrimary};">${testData.productName}</strong> is ready to download.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${testData.downloadUrl}" style="display: inline-block; padding: 14px 32px; background: ${EmailColors.success}; color: #000000; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; text-align: center;">
          🔑 View Your Product
        </a>
      </div>

      <div style="background: rgba(0, 217, 255, 0.08); border: 1px solid ${EmailColors.primary}; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: ${EmailColors.textSecondary};"><strong style="color: ${EmailColors.textPrimary};">Order ID:</strong> #${shortOrderId}</p>
        <p style="margin: 0 0 8px 0; color: ${EmailColors.textSecondary};"><strong style="color: ${EmailColors.textPrimary};">Product:</strong> ${testData.productName}</p>
        <p style="margin: 0; color: ${EmailColors.textSecondary};"><strong style="color: ${EmailColors.textPrimary};">Status:</strong> <span style="color: ${EmailColors.success};">✅ Completed</span></p>
      </div>

      <h3 style="color: ${EmailColors.textPrimary}; font-size: 24px; font-weight: 600; margin: 24px 0 16px 0;">⚠️ Important Security Notice</h3>

      <ul style="color: ${EmailColors.textSecondary}; font-size: 16px; line-height: 1.6; padding-left: 20px;">
        <li style="margin-bottom: 8px;">🔗 Download available for <strong style="color: ${EmailColors.textPrimary};">${testData.expiresIn}</strong> — after that, sign in to get a new link</li>
        <li style="margin-bottom: 8px;">🔒 The link is encrypted and only accessible by you</li>
        <li style="margin-bottom: 8px;">🚫 Do not share this link with others</li>
        <li style="margin-bottom: 8px;">💾 Save your digital product immediately after downloading</li>
      </ul>

      <h3 style="color: ${EmailColors.textPrimary}; font-size: 24px; font-weight: 600; margin: 24px 0 16px 0;">Next Steps</h3>

      <ol style="color: ${EmailColors.textSecondary}; font-size: 16px; line-height: 1.6; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Click the button above to view your product</li>
        <li style="margin-bottom: 8px;">Save the product key in a secure location</li>
        <li style="margin-bottom: 8px;">Activate your product using the provided instructions</li>
      </ol>

      <hr style="border: none; border-top: 1px solid ${EmailColors.borderSubtle}; margin: 24px 0;">

      <p style="color: ${EmailColors.textMuted}; font-size: 13px;">
        <strong>Link expired?</strong> Sign in and visit your order history.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid ${EmailColors.borderSubtle};">
      <p style="color: ${EmailColors.textMuted}; font-size: 13px; margin: 0 0 16px 0;">
        <a href="https://bitloot.io/help" style="color: ${EmailColors.primary}; text-decoration: none;">Support</a>
        &nbsp;•&nbsp;
        <a href="https://bitloot.io/terms" style="color: ${EmailColors.primary}; text-decoration: none;">Terms</a>
        &nbsp;•&nbsp;
        <a href="https://bitloot.io/privacy" style="color: ${EmailColors.primary}; text-decoration: none;">Privacy</a>
      </p>
      <p style="color: ${EmailColors.textMuted}; font-size: 12px; margin: 0;">
        © 2026 BitLoot. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

async function sendTestEmail() {
  console.log('📧 Sending test Products Delivery email...');
  console.log('To: bitloot.biz@gmail.com');
  console.log('Subject: Your BitLoot order is Ready — Order #' + shortOrderId);
  
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'BitLoot <noreply@bitloot.io>',
      to: 'bitloot.biz@gmail.com',
      subject: `Your BitLoot order is Ready — Order #${shortOrderId}`,
      html: html,
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

sendTestEmail();
