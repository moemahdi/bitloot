import type { Metadata } from 'next';

/**
 * Privacy Policy Layout — SEO Metadata
 *
 * Privacy pages are E-E-A-T trust signals. Gamers increasingly search for
 * privacy-focused marketplaces — crypto-native anonymity is our USP.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export const metadata: Metadata = {
  title: 'Privacy Policy — Anonymous Crypto Game Key Purchases | BitLoot',
  description:
    'BitLoot Privacy Policy. Learn how we protect your data when you buy game keys with cryptocurrency. We collect minimal data and support anonymous purchases.',
  keywords: [
    'BitLoot privacy policy',
    'anonymous game purchase privacy',
    'crypto gaming privacy',
    'buy games anonymously',
    'BitLoot data protection',
    'private game key purchase',
  ],
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/privacy`,
    siteName: 'BitLoot',
    title: 'Privacy Policy — Anonymous Game Key Purchases | BitLoot',
    description: 'How BitLoot protects your privacy when buying game keys with crypto. Minimal data, maximum anonymity.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
