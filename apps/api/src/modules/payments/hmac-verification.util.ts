import * as crypto from 'crypto';

/**
 * Verify HMAC signature for NOWPayments IPN webhook
 *
 * NOWPayments sends an `x-nowpayments-signature` header with all webhooks.
 * This signature is computed as HMAC-SHA512 of the request body, using the
 * IPN Secret as the key.
 *
 * Uses timing-safe comparison to prevent timing-attack vulnerabilities.
 *
 * @param rawBody - Raw request body bytes (exact string sent by NOWPayments)
 * @param signature - Hex-encoded signature from x-nowpayments-signature header
 * @param secret - IPN secret (configured in NOWPayments dashboard)
 * @returns true if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = verifyNowPaymentsSignature(
 *   rawBody,
 *   headers['x-nowpayments-signature'],
 *   process.env.NOWPAYMENTS_IPN_SECRET!
 * );
 * if (!isValid) {
 *   throw new UnauthorizedException('Invalid webhook signature');
 * }
 * ```
 */
export function verifyNowPaymentsSignature(
  rawBody: string,
  signature: string | undefined,
  secret: string,
): boolean {
  // Validate inputs
  if (rawBody === '' || signature === undefined || signature === '' || secret === '') {
    return false;
  }

  try {
    // Compute expected signature: HMAC-SHA512(body, secret)
    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (_error) {
    // If comparison fails (e.g., different lengths), signature is invalid
    return false;
  }
}

/**
 * Extract and validate signature header
 *
 * Safely extracts and validates the x-nowpayments-signature header.
 * Returns undefined if header is missing or invalid.
 *
 * @param headers - Request headers object
 * @returns Signature string if valid, undefined otherwise
 */
export function extractSignature(headers: Record<string, unknown>): string | undefined {
  const sig = headers['x-nowpayments-signature'];
  if (typeof sig === 'string' && sig.length > 0) {
    return sig;
  }
  return undefined;
}
