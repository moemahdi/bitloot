/**
 * Cloudflare Turnstile CAPTCHA verification utility
 * Pure function for server-side token validation
 * No DI needed - called directly where CAPTCHA verification is required
 */

import axios from 'axios';
import type { AxiosError } from 'axios';

/**
 * Turnstile verification response from Cloudflare API
 */
interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  'error_codes'?: string[];
}

/**
 * Verify a Cloudflare Turnstile CAPTCHA token
 * Throws error if verification fails
 *
 * @param token The CAPTCHA token from client
 * @returns Promise<boolean> Always true if verification succeeds
 * @throws BadRequestException if token is invalid or verification fails
 */
export async function verifyCaptchaToken(token: string): Promise<boolean> {
  // Validate token is provided
  if (token.length === 0) {
    throw new Error('CAPTCHA token is required');
  }

  // Validate environment variable is configured
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (secretKey === undefined || secretKey.length === 0) {
    throw new Error('Server misconfiguration: TURNSTILE_SECRET_KEY not set');
  }

  try {
    // Call Cloudflare Turnstile verification endpoint
    const response = await axios.post<TurnstileVerifyResponse>(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: secretKey,
        response: token,
      },
      {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    // Check if verification succeeded
    if (!response.data.success) {
      const errorCodes = response.data['error-codes'] ?? response.data['error_codes'] ?? [];
      const errorMessage = errorCodes.length > 0 ? errorCodes.join(', ') : 'Unknown error';
      throw new Error(`CAPTCHA verification failed: ${errorMessage}`);
    }

    return true;
  } catch (error) {
    // Handle network/axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('CAPTCHA verification timeout');
      }
      throw new Error(`CAPTCHA service unavailable: ${axiosError.message}`);
    }

    // Re-throw our custom error messages
    if (error instanceof Error) {
      throw error;
    }

    // Unknown error type
    throw new Error('CAPTCHA verification failed: Unknown error');
  }
}
