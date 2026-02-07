import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

import '@/design-system/styles/globals.css';
import { Providers } from '../lib/providers';
import { OrganizationSchema, WebsiteSchema, OnlineStoreSchema } from '@/components/seo';

// Force dynamic rendering for all pages - Providers use React context
// which fails during static prerendering on Railway
export const dynamic = 'force-dynamic';

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
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.com';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: 'BitLoot — Crypto Gaming Marketplace',

    template: '%s | BitLoot',
  },
  description:
    'Instant delivery of game keys & software via crypto. Secure, fast, anonymous. Pay with Bitcoin, Ethereum, and 300+ cryptocurrencies.',
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
  authors: [{ name: 'BitLoot Team', url: 'https://bitloot.com' }],
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
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', type: 'image/svg+xml', sizes: '512x512' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
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
    url: 'https://bitloot.com',
    title: 'BitLoot — Crypto Gaming Marketplace | Buy Game Keys with Bitcoin',
    description:
      'Instant delivery of game keys & software via crypto. Pay with Bitcoin, Ethereum, and 300+ cryptocurrencies. Steam, PlayStation, Xbox, Nintendo keys.',
    siteName: 'BitLoot',
    images: [
      {
        url: '/og-image.svg', // Note: Convert to PNG for better compatibility before launch
        width: 1200,
        height: 630,
        alt: 'BitLoot - Crypto Gaming Marketplace - Buy Game Keys with Bitcoin',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BitLoot — Buy Game Keys with Bitcoin & Crypto',
    description:
      'Instant delivery of Steam, PlayStation, Xbox & Nintendo keys. Pay with Bitcoin, Ethereum, and 300+ cryptocurrencies. Anonymous & secure.',
    creator: '@bitloot',
    site: '@bitloot',
    images: ['/og-image.svg'],
  },
  category: 'technology',
  // Verification tags - Add your verification codes before launch
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
    // yandex: '',
    // bing: '',
  },
  // Additional meta for e-commerce
  other: {
    'application-name': 'BitLoot',
    'msapplication-TileImage': '/logo.svg',
    'apple-itunes-app': 'app-id=XXXXXX', // Replace with App Store ID if applicable
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
          description="Crypto-powered digital gaming marketplace with instant delivery of game keys and software. Pay with Bitcoin, Ethereum, and 300+ cryptocurrencies."
          sameAs={[
            // Add social media URLs when available
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
