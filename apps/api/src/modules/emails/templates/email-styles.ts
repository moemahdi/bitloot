/**
 * BitLoot Email Styles
 *
 * Centralized styling for all email templates.
 * Based on BitLoot Neon Cyberpunk Design System.
 * Edit colors and styles here to update all emails at once.
 *
 * @see docs/design-system.md for full design system reference
 */

// ============================================================================
// BRAND COLORS (from BitLoot Design System)
// ============================================================================

export const EmailColors = {
  // Primary Neon Accent Colors
  primary: '#00D9FF', // Cyan Glow - Primary action, focus ring, glow effects
  secondary: '#9D4EDD', // Purple Neon - Secondary accent, featured content
  success: '#39FF14', // Green Success - Success states, positive feedback
  warning: '#FF6B00', // Orange Warning - Warnings, caution states
  error: '#FF6B00', // Orange Warning (same as warning per design system)
  featured: '#FF006E', // Pink Featured - Featured products, highlights
  info: '#00D9FF', // Cyan (same as primary)

  // Background Colors (Deep Space)
  bgPrimary: '#0A0E1A', // Primary background (all pages)
  bgSecondary: '#0F1420', // Card, popover, sidebar backgrounds
  bgTertiary: '#161D2A', // Elevated surfaces, modals, tooltips

  // Text Colors
  textPrimary: '#FFFFFF', // Main text, high contrast
  textSecondary: '#B4BDD0', // Subtext, descriptions, labels
  textMuted: '#7A8599', // Disabled, subtle text, hints

  // Border Colors
  borderSubtle: '#2A3344', // Soft dividers (default borders)
  borderAccent: '#363F52', // Emphasized borders, hover states
} as const;

// ============================================================================
// REUSABLE STYLES
// ============================================================================

export const EmailStyles = {
  // Buttons - Neon Cyberpunk Style with Glow Effects
  buttonPrimary: `
    display: inline-block;
    padding: 14px 32px;
    background: linear-gradient(135deg, ${EmailColors.primary} 0%, ${EmailColors.secondary} 100%);
    color: #000000;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 0 20px rgba(0, 217, 255, 0.4), 0 0 40px rgba(0, 217, 255, 0.2);
  `,

  buttonSuccess: `
    display: inline-block;
    padding: 14px 32px;
    background: ${EmailColors.success};
    color: #000000;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 0 20px rgba(57, 255, 20, 0.4), 0 0 40px rgba(57, 255, 20, 0.2);
  `,

  buttonDanger: `
    display: inline-block;
    padding: 14px 32px;
    background: ${EmailColors.warning};
    color: #000000;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 0 20px rgba(255, 107, 0, 0.4), 0 0 40px rgba(255, 107, 0, 0.2);
  `,

  buttonSecondary: `
    display: inline-block;
    padding: 14px 32px;
    background: ${EmailColors.bgTertiary};
    color: ${EmailColors.textPrimary};
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid ${EmailColors.borderAccent};
    text-align: center;
  `,

  buttonOutline: `
    display: inline-block;
    padding: 12px 28px;
    background: transparent;
    color: ${EmailColors.primary};
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    border-radius: 8px;
    border: 2px solid ${EmailColors.primary};
    text-align: center;
  `,

  buttonFeatured: `
    display: inline-block;
    padding: 14px 32px;
    background: linear-gradient(135deg, ${EmailColors.featured} 0%, ${EmailColors.secondary} 100%);
    color: #FFFFFF;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 0 20px rgba(255, 0, 110, 0.4), 0 0 40px rgba(255, 0, 110, 0.2);
  `,

  // Text styles
  heading2: `
    color: ${EmailColors.textPrimary};
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 16px 0;
    line-height: 1.3;
  `,

  paragraph: `
    color: ${EmailColors.textSecondary};
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 16px 0;
  `,

  smallText: `
    color: ${EmailColors.textMuted};
    font-size: 13px;
    line-height: 1.5;
  `,

  // OTP code display - Neon Glow Effect
  otpCode: `
    display: inline-block;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 8px;
    color: ${EmailColors.primary};
    background: ${EmailColors.bgTertiary};
    padding: 16px 32px;
    border-radius: 12px;
    border: 2px solid ${EmailColors.primary};
    box-shadow: 0 0 20px rgba(0, 217, 255, 0.3), inset 0 0 10px rgba(0, 217, 255, 0.1);
  `,

  // Info/Warning/Error/Success boxes - Neon Style
  infoBox: `
    background: rgba(0, 217, 255, 0.08);
    border: 1px solid ${EmailColors.primary};
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    box-shadow: 0 0 10px rgba(0, 217, 255, 0.15);
  `,

  warningBox: `
    background: rgba(255, 107, 0, 0.08);
    border: 1px solid ${EmailColors.warning};
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    box-shadow: 0 0 10px rgba(255, 107, 0, 0.15);
  `,

  errorBox: `
    background: rgba(255, 107, 0, 0.08);
    border: 1px solid ${EmailColors.error};
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    box-shadow: 0 0 10px rgba(255, 107, 0, 0.15);
  `,

  successBox: `
    background: rgba(57, 255, 20, 0.08);
    border: 1px solid ${EmailColors.success};
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    box-shadow: 0 0 10px rgba(57, 255, 20, 0.15);
  `,

  featuredBox: `
    background: rgba(255, 0, 110, 0.08);
    border: 1px solid ${EmailColors.featured};
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    box-shadow: 0 0 10px rgba(255, 0, 110, 0.15);
  `,

  // Divider
  divider: `
    border: none;
    border-top: 1px solid ${EmailColors.borderSubtle};
    margin: 24px 0;
  `,

  // List styles
  list: `
    color: ${EmailColors.textSecondary};
    font-size: 15px;
    line-height: 1.8;
    margin: 0 0 16px 0;
    padding-left: 20px;
  `,

  listItem: `
    margin-bottom: 8px;
  `,
} as const;

// ============================================================================
// EMAIL WRAPPER TEMPLATE
// ============================================================================

export interface WrapperOptions {
  showFooter?: boolean;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
  unsubscribeEmail?: string; // If provided, generates unsubscribe URL from email
}

/**
 * Wraps email content with BitLoot header and footer
 * Uses Neon Cyberpunk Gaming aesthetic
 */
export function wrapEmailTemplate(content: string, options: WrapperOptions = {}): string {
  const { showFooter = true, showUnsubscribe = false, unsubscribeUrl = '', unsubscribeEmail = '' } = options;
  
  // Generate unsubscribe URL from email if not provided directly
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://bitloot.io';
  const finalUnsubscribeUrl = unsubscribeUrl !== '' ? unsubscribeUrl : (unsubscribeEmail !== '' ? `${frontendUrl}/unsubscribe?email=${encodeURIComponent(unsubscribeEmail)}` : '');

  const header = `
    <div style="text-align: center; padding: 32px 0; border-bottom: 1px solid ${EmailColors.borderSubtle};">
      <h1 style="margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 0 20px rgba(0, 217, 255, 0.5);">
        <span style="color: ${EmailColors.primary};">Bit</span><span style="color: ${EmailColors.textPrimary};">Loot</span>
      </h1>
      <p style="margin: 8px 0 0 0; color: ${EmailColors.textMuted}; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">
        Crypto Gaming Store
      </p>
    </div>
  `;

  const footer = showFooter
    ? `
    <div style="text-align: center; padding: 24px 0; border-top: 1px solid ${EmailColors.borderSubtle}; margin-top: 32px;">
      <p style="color: ${EmailColors.textMuted}; font-size: 13px; margin: 0 0 8px 0;">
        <a href="${frontendUrl}/help" style="color: ${EmailColors.primary}; text-decoration: none;">Support</a>
        &nbsp;&nbsp;•&nbsp;&nbsp;
        <a href="${frontendUrl}/terms" style="color: ${EmailColors.primary}; text-decoration: none;">Terms</a>
        &nbsp;&nbsp;•&nbsp;&nbsp;
        <a href="${frontendUrl}/privacy" style="color: ${EmailColors.primary}; text-decoration: none;">Privacy</a>
      </p>
      <p style="color: ${EmailColors.textMuted}; font-size: 12px; margin: 12px 0 0 0;">
        © ${new Date().getFullYear()} BitLoot. All rights reserved.
      </p>
      ${
        showUnsubscribe && finalUnsubscribeUrl !== ''
          ? `
        <p style="margin-top: 16px;">
          <a href="${finalUnsubscribeUrl}" style="color: ${EmailColors.textMuted}; font-size: 12px; text-decoration: underline;">
            Unsubscribe from these emails
          </a>
        </p>
      `
          : ''
      }
    </div>
  `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>BitLoot</title>
      <!--[if mso]>
      <style type="text/css">
        table { border-collapse: collapse; }
        td { font-family: Arial, sans-serif; }
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: ${EmailColors.bgSecondary}; border-radius: 16px; border: 1px solid ${EmailColors.borderSubtle}; max-width: 100%; box-shadow: 0 8px 24px rgba(10, 14, 26, 0.3);">
              <tr>
                <td style="padding: 0 40px;">
                  ${header}
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 40px;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px;">
                  ${footer}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
