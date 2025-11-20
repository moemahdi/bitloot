import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import '@/design-system/styles/globals.css';
import { Providers } from '../lib/providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BitLoot — Crypto E-Commerce',
    template: '%s | BitLoot',
  },
  description: 'Instant delivery of game keys & subscriptions via crypto. Secure, fast, and anonymous.',
  keywords: ['crypto', 'game keys', 'software', 'bitcoin', 'ethereum', 'instant delivery'],
  authors: [{ name: 'BitLoot Team' }],
  creator: 'BitLoot',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BitLoot',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bitloot.com',
    title: 'BitLoot — Crypto E-Commerce',
    description: 'Instant delivery of game keys & subscriptions via crypto.',
    siteName: 'BitLoot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BitLoot — Crypto E-Commerce',
    description: 'Instant delivery of game keys & subscriptions via crypto.',
    creator: '@bitloot',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`min-h-screen bg-background font-sans antialiased ${inter.variable}`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
