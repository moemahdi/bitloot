/**
 * useNetworkStatus Hook
 * 
 * Monitors browser online/offline status with enhanced features:
 * - Real-time online/offline detection
 * - Connection quality (slow connection detection)
 * - Connection type (4g, 3g, 2g, etc.)
 * 
 * Used for network-aware UI components that need to
 * disable actions or show warnings when offline
 */

import { useEffect, useState, useCallback } from 'react';

export interface NetworkStatus {
  /** Whether browser is online */
  isOnline: boolean;
  /** Whether connection is slow (2g or slow-2g) */
  isSlowConnection: boolean;
  /** Connection type if available (4g, 3g, 2g, etc.) */
  connectionType: string | null;
}

/**
 * Hook to monitor network connectivity status
 * Returns boolean for simple usage, or full NetworkStatus object
 */
export function useNetworkStatus(): boolean;
export function useNetworkStatus(options: { detailed: true }): NetworkStatus;
export function useNetworkStatus(options?: { detailed?: boolean }): boolean | NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null,
  });

  const updateNetworkStatus = useCallback(() => {
    // Get Network Information API if available
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const connection = 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (navigator as any).connection ?? 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (navigator as any).mozConnection ?? 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (navigator as any).webkitConnection;

    let isSlowConnection = false;
    let connectionType: string | null = null;

    if (connection !== undefined && connection !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      connectionType = (connection.effectiveType as string) ?? null;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      isSlowConnection = connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
    }

    setStatus({
      isOnline: navigator.onLine,
      isSlowConnection,
      connectionType,
    });
  }, []);

  useEffect(() => {
    // Set initial status
    updateNetworkStatus();

    // Event handlers
    const handleOnline = (): void => updateNetworkStatus();
    const handleOffline = (): void => updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if Network Information API is available
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const connection = 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (navigator as any).connection ?? 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (navigator as any).mozConnection ?? 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (navigator as any).webkitConnection;

    if (connection !== undefined && connection !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      connection.addEventListener('change', updateNetworkStatus);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection !== undefined && connection !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus]);

  // Return full status object if detailed option is set
  if (options?.detailed === true) {
    return status;
  }

  // Default: return simple boolean
  return status.isOnline;
}

