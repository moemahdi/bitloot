/**
 * BitLoot Auth SDK Client
 * Custom client for OTP authentication endpoints
 * (AuthApi not auto-generated, created manually)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface RequestOtpResponse {
  success: boolean;
  expiresIn?: number;
  error?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
  error?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
}

/**
 * Custom Auth API Client
 * Handles passwordless OTP authentication flow
 */
export class AuthClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE;
  }

  /**
   * Request OTP code to be sent to email
   * @param email User email address
   * @param captchaToken Optional Cloudflare Turnstile token
   * @returns OTP response with expiry time
   */
  async requestOtp(email: string, captchaToken?: string | null): Promise<RequestOtpResponse> {
    const body: Record<string, unknown> = { email };
    if (captchaToken !== undefined && captchaToken !== null) {
      body.captchaToken = captchaToken;
    }

    const response = await fetch(`${this.baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as Record<string, unknown>;
      const errorMessage = typeof errorData.message === 'string'
        ? errorData.message
        : 'Failed to request OTP';
      return {
        success: false,
        error: errorMessage,
      };
    }

    return response.json() as Promise<RequestOtpResponse>;
  }

  /**
   * Verify OTP code and get JWT tokens
   * @param email User email
   * @param code 6-digit OTP code
   * @returns Auth response with tokens and user info
   */
  async verifyOtp(email: string, code: string): Promise<VerifyOtpResponse> {
    const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as Record<string, unknown>;
      const errorMessage = typeof errorData.message === 'string'
        ? errorData.message
        : 'Failed to verify OTP';
      return {
        success: false,
        error: errorMessage,
      };
    }

    return response.json() as Promise<VerifyOtpResponse>;
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken Current refresh token
   * @returns New tokens
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return response.json() as Promise<RefreshTokenResponse>;
  }

  /**
   * Logout: clear refresh token
   * @param refreshToken Current refresh token
   * @returns Logout response
   */
  async logout(refreshToken: string): Promise<LogoutResponse> {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return {
        success: false,
      };
    }

    return response.json() as Promise<LogoutResponse>;
  }
}

// Export singleton instance
export const authClient = new AuthClient();
