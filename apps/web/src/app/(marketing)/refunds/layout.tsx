import type { Metadata } from 'next';

/**
 * Refund Policy Layout — SEO Metadata
 *
 * Trust-building legal page. Buyers research refund policies before purchasing
 * from a new marketplace — clear policy = higher conversion + better rankings.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export const metadata: Metadata = {
  title: 'Refund Policy — Game Key Replacements & Guarantees | BitLoot',
  description:
    'BitLoot Refund Policy. Invalid or used game key? We replace it or refund you. Learn about our guarantee on digital game keys bought with cryptocurrency.',
  keywords: [
    'BitLoot refund policy',
    'game key refund',
    'invalid game key replacement',
    'crypto game key guarantee',
    'game key return policy',
    'BitLoot guarantee',
    'digital goods refund',
  ],
  alternates: {
    canonical: `${siteUrl}/refunds`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/refunds`,
    siteName: 'BitLoot',
    title: 'Refund Policy — Game Key Replacement Guarantee | BitLoot',
    description: 'BitLoot guarantees valid game keys. Get a replacement or refund for any invalid key purchased with crypto.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RefundsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
