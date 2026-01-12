'use client';

import { useQuery } from '@tanstack/react-query';
import { OrdersApi } from '@bitloot/sdk';
import type { OrderAccessStatusDto } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useAuth } from '@/hooks/useAuth';

// Initialize SDK client
const ordersClient = new OrdersApi(apiConfig);

export interface OrderAccessStatus {
  canAccess: boolean;
  reason: 'owner' | 'admin' | 'email_match' | 'session_token' | 'guest_order' | 'not_authenticated' | 'not_owner';
  isAuthenticated: boolean;
  isFulfilled: boolean;
  message: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Get order session token from localStorage
 * @param orderId - The order ID
 * @returns The session token or undefined
 */
function getOrderSessionToken(orderId: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const token = localStorage.getItem(`order_session_${orderId}`);
  return token ?? undefined;
}

/**
 * Hook to check if the current user can access keys for an order
 * 
 * This checks:
 * - Session token (from localStorage, stored after order creation)
 * - userId match (logged-in user who placed the order)
 * - email match (guest checkout user who later created account with same email)
 * - admin role (admins can access all orders)
 * 
 * @param orderId - The order ID to check access for
 * @returns OrderAccessStatus with canAccess boolean and reason
 */
export function useOrderAccess(orderId: string): OrderAccessStatus {
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();

  // Get session token for immediate guest access
  const sessionToken = getOrderSessionToken(orderId);

  const { data, isLoading, error } = useQuery<OrderAccessStatusDto>({
    queryKey: ['order-access', orderId, accessToken, sessionToken],
    queryFn: async () => {
      const response = await ordersClient.ordersControllerGetAccessStatus({ 
        id: orderId,
        xOrderSessionToken: sessionToken,
      });
      return response;
    },
    enabled: orderId.length > 0,
    staleTime: 30_000, // 30 seconds - recheck periodically
    retry: 1,
  });

  // While auth is loading, return loading state
  if (authLoading) {
    return {
      canAccess: false,
      reason: 'not_authenticated',
      isAuthenticated: false,
      isFulfilled: false,
      message: 'Loading...',
      isLoading: true,
      error: null,
    };
  }

  // If we have data from the API
  if (data !== undefined) {
    return {
      canAccess: data.canAccess,
      reason: data.reason,
      isAuthenticated: data.isAuthenticated,
      isFulfilled: data.isFulfilled,
      message: data.message,
      isLoading: false,
      error: null,
    };
  }

  // Default state while loading
  return {
    canAccess: false,
    reason: isAuthenticated ? 'not_owner' : 'not_authenticated',
    isAuthenticated,
    isFulfilled: false,
    message: isAuthenticated ? 'Checking access...' : 'Login to access your keys',
    isLoading: isLoading || authLoading,
    error: error instanceof Error ? error : null,
  };
}
