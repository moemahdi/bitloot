import type { Metadata } from 'next';

/**
 * Catalog Layout with SEO Metadata
 * 
 * Provides metadata for the catalog browsing experience.
 */

export const metadata: Metadata = {
  title: 'Game Keys & Software',
  description: 'Browse thousands of game keys, software licenses, and digital products. Pay with Bitcoin, Ethereum, and 300+ cryptocurrencies. Instant delivery, anonymous checkout.',
  keywords: [
    'game keys',
    'steam keys',
    'software keys',
    'crypto gaming',
    'bitcoin games',
    'digital products',
    'instant delivery',
    'anonymous purchase',
  ],
  openGraph: {
    title: 'Game Keys & Software | BitLoot',
    description: 'Browse thousands of game keys, software licenses, and digital products. Pay with crypto, get instant delivery.',
    type: 'website',
  },
  alternates: {
    canonical: '/catalog',
  },
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
