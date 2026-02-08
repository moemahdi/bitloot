'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/context/CartContext';
import { MaintenanceModeProvider } from '@/components/MaintenanceMode';
import { Toaster } from '@/design-system/primitives/sonner';
import TawkToWidget from '@/components/TawkToWidget';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <MaintenanceModeProvider>
          <CartProvider>
            <AuthProvider>
              {children}
              <TawkToWidget />
            </AuthProvider>
          </CartProvider>
        </MaintenanceModeProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
