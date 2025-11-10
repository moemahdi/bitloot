import type { Metadata, Viewport } from 'next';

import '@/design-system/styles/globals.css';
import { Providers } from '../lib/providers';

export const metadata: Metadata = {
  title: 'BitLoot — Crypto E-Commerce',
  description: 'Instant delivery of game keys & subscriptions via crypto',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BitLoot',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
