import type { Metadata } from 'next';

/**
 * Reviews Page Layout — SEO Metadata
 *
 * Trust-signal page. Ranking for "[brand] reviews" converts fence-sitters.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export const metadata: Metadata = {
  title: 'Customer Reviews — Verified Crypto Game Key Purchases | BitLoot',
  description:
    'Real customer reviews from verified BitLoot buyers. See what gamers say about our game keys, instant delivery, and crypto payment experience.',
  keywords: [
    'BitLoot reviews',
    'BitLoot legit',
    'crypto game key reviews',
    'BitLoot trustworthy',
    'game key site reviews',
    'buy game keys safely',
    'BitLoot customer feedback',
    'crypto gaming marketplace reviews',
  ],
  alternates: {
    canonical: `${siteUrl}/reviews`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/reviews`,
    siteName: 'BitLoot',
    title: 'BitLoot Reviews — What Gamers Say About Our Crypto Game Keys',
    description:
      'Verified customer reviews for BitLoot. Thousands of satisfied gamers buying game keys with crypto. See why we are trusted.',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'BitLoot Customer Reviews', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bitloot',
    title: 'BitLoot Reviews — Verified Crypto Game Key Purchases',
    description: 'Real reviews from verified gamers. See why BitLoot is trusted for crypto game key purchases.',
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
