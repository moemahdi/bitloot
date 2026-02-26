'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Filter Tawk.to console noise in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    // Filter out Tawk's internal `console.error(true)` calls
    if (args.length === 1 && args[0] === true) return;
    // Filter out Tawk Knowledge Base 410 errors
    if (typeof args[0] === 'string' && args[0].includes('tawk.to') && args[0].includes('410')) return;
    originalError.apply(console, args);
  };
}

// Tawk.to API types
declare global {
  interface Window {
    Tawk_API?: {
      visitor?: {
        name?: string;
        email?: string;
      };
      onLoad?: () => void;
      onBeforeLoad?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      maximize?: () => void;
      minimize?: () => void;
      toggle?: () => void;
      popup?: () => void;
      endChat?: () => void;
      isChatMaximized?: () => boolean;
      isChatMinimized?: () => boolean;
      isChatHidden?: () => boolean;
      isChatOngoing?: () => boolean;
      setAttributes?: (attributes: Record<string, string | number | boolean>, callback?: (error?: Error) => void) => void;
      addTags?: (tags: string[], callback?: (error?: Error) => void) => void;
      removeTags?: (tags: string[], callback?: (error?: Error) => void) => void;
    };
    Tawk_LoadStart?: Date;
  }
}

// BitLoot Tawk.to Property ID
const TAWK_PROPERTY_ID = '6988d5294dc0851c3b27d9df';
const TAWK_WIDGET_ID = '1jgv81ajl';

// Routes where chat widget should be hidden
const HIDDEN_ROUTES = [
  '/checkout',
  '/admin',
  '/auth',
  '/cancel-deletion',
];

// Get page context for support agents
function getPageContext(pathname: string): string {
  if (pathname === '/') return 'Homepage';
  if (pathname.startsWith('/product/')) return 'Product Page';
  if (pathname.startsWith('/catalog')) return 'Catalog';
  if (pathname.startsWith('/cart')) return 'Cart';
  if (pathname.startsWith('/orders')) return 'Order Tracking';
  if (pathname.startsWith('/help')) return 'Help Center';
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'Other';
}

/**
 * TawkToWidget - Live chat integration for BitLoot
 * 
 * Features:
 * - Auto-hides on checkout, admin, and auth pages
 * - Identifies logged-in users for support context
 * - Cleans up properly on route changes
 * - Prevents duplicate script loading
 */
export default function TawkToWidget() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const scriptLoadedRef = useRef(false);
  const widgetReadyRef = useRef(false);

  // Check if current route should hide the widget
  const shouldHide = HIDDEN_ROUTES.some((route) => pathname.startsWith(route));

  // Load Tawk.to script
  useEffect(() => {
    if (shouldHide) {
      // Hide widget if it exists and we're on a restricted route
      if (widgetReadyRef.current && window.Tawk_API?.hideWidget !== undefined) {
        window.Tawk_API.hideWidget();
      }
      return;
    }

    // Show widget if it was hidden and we're back on allowed routes
    if (widgetReadyRef.current && window.Tawk_API?.showWidget !== undefined) {
      window.Tawk_API.showWidget();
      return;
    }

    // Prevent duplicate script loading
    if (scriptLoadedRef.current || document.getElementById('tawk-to-script') !== null) {
      return;
    }

    const injectScript = () => {
      if (scriptLoadedRef.current || document.getElementById('tawk-to-script') !== null) return;

      // Initialize Tawk API
      window.Tawk_API = window.Tawk_API ?? {};
      window.Tawk_LoadStart = new Date();

      // Set up onLoad callback
      window.Tawk_API.onLoad = () => {
        widgetReadyRef.current = true;

        // Hide immediately if on restricted route when widget loads
        if (shouldHide && window.Tawk_API?.hideWidget !== undefined) {
          window.Tawk_API.hideWidget();
        }
      };

      // Create and inject script
      const script = document.createElement('script');
      script.id = 'tawk-to-script';
      script.async = true;
      script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');

      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript?.parentNode !== null && firstScript?.parentNode !== undefined) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }

      scriptLoadedRef.current = true;

      // Remove interaction listeners once loaded
      USER_INTERACTION_EVENTS.forEach((event) => {
        window.removeEventListener(event, injectScript);
      });
    };

    // Delay loading until user interaction OR 7 seconds — whichever comes first.
    // This keeps Tawk.to off the critical path and improves LCP/TBT significantly.
    const USER_INTERACTION_EVENTS = ['scroll', 'mousemove', 'touchstart', 'keydown'] as const;
    const timer = setTimeout(injectScript, 7000);

    USER_INTERACTION_EVENTS.forEach((event) => {
      window.addEventListener(event, injectScript, { once: true, passive: true });
    });

    return () => {
      clearTimeout(timer);
      USER_INTERACTION_EVENTS.forEach((event) => {
        window.removeEventListener(event, injectScript);
      });
    };
  }, [shouldHide, pathname]);

  // Update visitor info when user logs in/out
  useEffect(() => {
    if (window.Tawk_API === undefined || window.Tawk_API === null) return;

    if (isAuthenticated && user !== null) {
      window.Tawk_API.visitor = {
        name: user.email.split('@')[0], // Use email prefix as name
        email: user.email,
      };
    } else {
      // Clear visitor info for guests
      window.Tawk_API.visitor = {
        name: 'Guest',
        email: '',
      };
    }
  }, [isAuthenticated, user]);

  // Update page context for support agents
  useEffect(() => {
    if (window.Tawk_API === undefined || window.Tawk_API === null) return;
    if (window.Tawk_API.setAttributes === undefined) return;

    const pageContext = getPageContext(pathname);
    
    window.Tawk_API.setAttributes({
      'current-page': pathname,
      'page-context': pageContext,
    }, (error) => {
      // Silently handle errors - attributes are optional
      if (error !== undefined && error !== null) {
        // Tawk may not be fully loaded yet, ignore
      }
    });
  }, [pathname]);

  // This component doesn't render anything visible
  return null;
}

// Export helper functions for programmatic control
export const TawkChat = {
  hide: () => window.Tawk_API?.hideWidget?.(),
  show: () => window.Tawk_API?.showWidget?.(),
  maximize: () => window.Tawk_API?.maximize?.(),
  minimize: () => window.Tawk_API?.minimize?.(),
  toggle: () => window.Tawk_API?.toggle?.(),
  endChat: () => window.Tawk_API?.endChat?.(),
  isMaximized: () => window.Tawk_API?.isChatMaximized?.() ?? false,
  isMinimized: () => window.Tawk_API?.isChatMinimized?.() ?? false,
  isHidden: () => window.Tawk_API?.isChatHidden?.() ?? true,
  isOngoing: () => window.Tawk_API?.isChatOngoing?.() ?? false,
  /** Open BitLoot Help Center */
  openHelpCenter: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/help';
    }
  },
  /** Set custom attributes visible to support agents */
  setAttributes: (attrs: Record<string, string | number | boolean>) => {
    window.Tawk_API?.setAttributes?.(attrs);
  },
  /** Add tags to the conversation */
  addTags: (tags: string[]) => {
    window.Tawk_API?.addTags?.(tags);
  },
};
