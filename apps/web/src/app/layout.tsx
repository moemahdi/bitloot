import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

import '@/design-system/styles/globals.css';
import { Providers } from '../lib/providers';

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
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
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
    title: 'BitLoot — Crypto Gaming Marketplace',
    description:
      'Instant delivery of game keys & software via crypto. Pay with Bitcoin, Ethereum, and 300+ cryptocurrencies.',
    siteName: 'BitLoot',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BitLoot - Crypto Gaming Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BitLoot — Crypto Gaming Marketplace',
    description:
      'Instant delivery of game keys & software via crypto. Pay with Bitcoin, Ethereum, and 300+ cryptocurrencies.',
    creator: '@bitloot',
    site: '@bitloot',
    images: ['/og-image.png'],
  },
  category: 'technology',
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
