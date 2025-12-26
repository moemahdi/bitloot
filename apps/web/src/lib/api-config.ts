/**
 * Shared API Configuration with Authentication
 *
 * This module provides a properly configured SDK Configuration that includes
 * the accessToken from cookies for authenticated API calls.
 *
 * Usage:
 *   import { getApiConfig } from '@/lib/api-config';
 *   const config = getApiConfig();
 *   const api = new UsersApi(config);
 */

import { Configuration } from '@bitloot/sdk';

/**
 * Helper to read a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts[1]?.split(';')[0] ?? null;
  }
  return null;
}

/**
 * Creates an SDK Configuration with authentication
 * Reads the accessToken from cookies automatically
 */
export function getApiConfig(): Configuration {
  return new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: (): string => {
      if (typeof window !== 'undefined') {
        return getCookie('accessToken') ?? '';
      }
      return '';
    },
  });
}

/**
 * Pre-configured API Configuration instance
 * Use this for static/module-level API client creation
 */
export const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  accessToken: (): string => {
    if (typeof window !== 'undefined') {
      return getCookie('accessToken') ?? '';
    }
    return '';
  },
});
