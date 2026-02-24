import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

import '@/design-system/styles/globals.css';
import { Providers } from '../lib/providers';
import { OrganizationSchema, WebsiteSchema, OnlineStoreSchema } from '@/components/seo';

// Note: force-dynamic is NOT set here globally.
// Pages that need it (auth, profile, orders) set it individually.
// This allows catalog and product pages to benefit from ISR/edge caching.

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// Site URL for structured data
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: 'BitLoot — Crypto Gaming Marketplace',

    template: '%s | BitLoot',
  },
  description:
    'Instant delivery of game keys & software via crypto. Secure, fast, anonymous. Pay with Bitcoin, Ethereum, and 100+ cryptocurrencies.',
  keywords: [
    'crypto gaming',
    'game keys',
    'bitcoin games',
    'ethereum',
    'instant delivery',
    'software keys',
    'crypto marketplace',
    'anonymous purchase',
    'digital goods',
    'steam keys',
    'playstation keys',
    'xbox keys',
    'nintendo keys',
    'software license',
    'cdkey',
    'game code',
  ],
  authors: [{ name: 'BitLoot Team', url: 'https://bitloot.io' }],
  creator: 'BitLoot',
  publisher: 'BitLoot',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BitLoot',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bitloot.io',
    title: 'BitLoot — Crypto Gaming Marketplace | Buy Game Keys with Bitcoin',
    description:
      'Instant delivery of game keys & software via crypto. Pay with Bitcoin, Ethereum, and 100+ cryptocurrencies. Steam, PlayStation, Xbox, Nintendo keys.',
    siteName: 'BitLoot',
    images: [
      {
        url: '/og-image.png',   // PNG required — SVG is ignored by Facebook, Twitter, Google
        width: 1200,
        height: 630,
        alt: 'BitLoot - Crypto Gaming Marketplace - Buy Game Keys with Bitcoin',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BitLoot — Buy Game Keys with Bitcoin & Crypto',
    description:
      'Instant delivery of Steam, PlayStation, Xbox & Nintendo keys. Pay with Bitcoin, Ethereum, and 100+ cryptocurrencies. Anonymous & secure.',
    creator: '@bitloot_io',
    site: '@bitloot_io',
    images: ['/og-image.png'],
  },
  category: 'technology',
  // Verification tags
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION !== undefined &&
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION !== '' && {
      verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      },
    }),
  // Additional meta for e-commerce
  other: {
    'application-name': 'BitLoot',
    'msapplication-TileImage': '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0A0E1A' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0E1A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning className="dark scrollbar-thin" data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0A0E1A" />
        <meta name="msapplication-TileColor" content="#0A0E1A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Structured Data for SEO - Rich Snippets */}
        <OrganizationSchema 
          name="BitLoot"
          url={siteUrl}
          logo={`${siteUrl}/logo.png`}
          description="Crypto-powered digital gaming marketplace with instant delivery of game keys and software. Pay with Bitcoin, Ethereum, and 100+ cryptocurrencies."
          sameAs={[
            'https://x.com/bitloot_io',
            'https://discord.gg/mqjUpqxBtA',
            'https://t.me/its_bitloot',
          ]}
        />
        <WebsiteSchema siteUrl={siteUrl} searchPath="/catalog" />
        <OnlineStoreSchema />
      </head>
      <body
        className={`
          ${inter.variable}
          ${spaceGrotesk.variable}
          ${jetbrainsMono.variable}
          min-h-screen bg-gradient-dark font-sans antialiased
          text-foreground
          selection:bg-cyan-glow/20 selection:text-white
        `}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
