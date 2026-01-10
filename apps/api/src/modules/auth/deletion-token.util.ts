import * as crypto from 'crypto';

/**
 * Deletion Token Utility (Level 4)
 * Generates and verifies HMAC-based tokens for account deletion cancellation
 *
 * Token format: base64url(userId.timestamp.signature)
 * - userId: User's UUID
 * - timestamp: Unix timestamp when token was created
 * - signature: HMAC-SHA256 of userId + timestamp
 *
 * Security features:
 * - Timing-safe comparison prevents timing attacks
 * - 30-day expiration matches deletion grace period
 * - Token is tied to specific user ID
 */

const TOKEN_EXPIRY_DAYS = 30;
const TOKEN_SEPARATOR = '.';

/**
 * Generate a secure deletion cancellation token
 * @param userId - User's UUID
 * @returns Base64URL-encoded token string
 */
export function generateDeletionCancelToken(userId: string): string {
  const secret = process.env.JWT_SECRET ?? 'bitloot-secret-key';
  const timestamp = Date.now().toString();

  // Create signature
  const dataToSign = `${userId}${TOKEN_SEPARATOR}${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');

  // Combine and encode
  const tokenData = `${userId}${TOKEN_SEPARATOR}${timestamp}${TOKEN_SEPARATOR}${signature}`;
  return Buffer.from(tokenData).toString('base64url');
}

/**
 * Result of token verification
 */
export interface DeletionTokenVerifyResult {
  valid: boolean;
  userId?: string;
  expired?: boolean;
  error?: string;
}

/**
 * Verify and decode a deletion cancellation token
 * @param token - Base64URL-encoded token string
 * @returns Verification result with userId if valid
 */
export function verifyDeletionCancelToken(token: string): DeletionTokenVerifyResult {
  const secret = process.env.JWT_SECRET ?? 'bitloot-secret-key';

  try {
    // Decode token
    const tokenData = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = tokenData.split(TOKEN_SEPARATOR);

    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [userId, timestampStr, providedSignature] = parts;

    // Validate UUID format (basic check)
    if (
      userId === undefined ||
      userId.length < 36 ||
      timestampStr === undefined ||
      providedSignature === undefined
    ) {
      return { valid: false, error: 'Invalid token structure' };
    }

    // Verify signature using timing-safe comparison
    const dataToSign = `${userId}${TOKEN_SEPARATOR}${timestampStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(dataToSign)
      .digest('hex');

    // Timing-safe comparison
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: 'Invalid signature' };
    }

    const signatureValid = crypto.timingSafeEqual(providedBuffer, expectedBuffer);

    if (!signatureValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Check expiration
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const expiryMs = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    if (now - timestamp > expiryMs) {
      return { valid: false, expired: true, userId, error: 'Token has expired' };
    }

    return { valid: true, userId };
  } catch {
    return { valid: false, error: 'Token decode failed' };
  }
}

/**
 * Mask email for privacy (show first 2 chars + domain)
 * Example: "john.doe@example.com" → "jo***@example.com"
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart === undefined || domain === undefined) {
    return '***@***';
  }
  const visibleChars = Math.min(2, localPart.length);
  return `${localPart.slice(0, visibleChars)}***@${domain}`;
}
