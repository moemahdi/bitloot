import type { Metadata } from 'next';

/**
 * Help Center Layout — SEO Metadata
 *
 * Help pages rank well for brand + support queries and reduce support tickets.
 * Targets "how to buy games with crypto" educational intent.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export const metadata: Metadata = {
  title: 'Help Center — Crypto Game Key Support | BitLoot',
  description:
    'Get help with buying game keys using crypto on BitLoot. Find answers about payments, delivery, crypto wallets, account setup, and more.',
  keywords: [
    'BitLoot help',
    'crypto gaming support',
    'how to buy game keys with bitcoin',
    'game key help center',
    'crypto payment help',
    'game key delivery help',
    'BitLoot support',
    'how to use crypto for gaming',
    'buy games with bitcoin guide',
  ],
  alternates: {
    canonical: `${siteUrl}/help`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/help`,
    siteName: 'BitLoot',
    title: 'BitLoot Help Center — How to Buy Game Keys with Crypto',
    description:
      'Everything you need to know about buying game keys with Bitcoin, Ethereum and USDT on BitLoot. Payments, delivery, wallets and more.',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'BitLoot Help Center', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bitloot',
    title: 'BitLoot Help Center — Crypto Game Key Support',
    description: 'How to buy game keys with Bitcoin and 100+ cryptos. Answers to all your questions.',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
