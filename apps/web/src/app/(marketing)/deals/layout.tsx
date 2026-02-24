import type { Metadata } from 'next';

/**
 * Deals Page Layout — SEO Metadata
 *
 * Targets high-intent commercial keywords for gamers hunting discounts.
 * Flash deals + bundle deals are conversion goldmines — ranking here matters.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export const metadata: Metadata = {
  title: 'Flash Game Key Deals & Bundles — Up to 90% Off | BitLoot',
  description:
    'Exclusive flash deals on game keys with crypto payments. Up to 90% off Steam, PlayStation, Xbox and Nintendo titles. Limited-time offers with instant delivery.',
  keywords: [
    'cheap game keys deals',
    'flash sale game keys',
    'game key discounts crypto',
    'cheap steam keys sale',
    'game bundles bitcoin',
    'discounted game keys',
    'game deals crypto',
    'steam sale crypto',
    'cheap playstation keys',
    'xbox deals bitcoin',
    'game key flash sale',
    'crypto gaming deals',
  ],
  alternates: {
    canonical: `${siteUrl}/deals`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/deals`,
    siteName: 'BitLoot',
    title: 'Flash Game Key Deals — Up to 90% Off | Pay with Crypto | BitLoot',
    description:
      'Limited-time flash deals on Steam, PlayStation, Xbox and Nintendo game keys. Pay with Bitcoin, Ethereum or USDT. Instant delivery.',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'BitLoot Flash Deals', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bitloot',
    title: 'Flash Game Key Deals — Up to 90% Off | BitLoot',
    description: 'Limited-time game key flash deals. Steam, PS, Xbox, Nintendo. Pay crypto. Instant delivery.',
  },
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
