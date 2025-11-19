/**
 * useNetworkStatus Hook
 * 
 * Monitors browser online/offline status
 * Returns true when online, false when offline
 * 
 * Used for network-aware UI components that need to
 * disable actions or show warnings when offline
 */

import { useEffect, useState } from 'react';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    // Event handlers
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
