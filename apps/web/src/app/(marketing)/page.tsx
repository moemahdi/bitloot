/**
 * BitLoot Homepage - Server Component
 *
 * Thin server wrapper: exports page-specific metadata and renders HomepageClient.
 * The marketing layout already injects FAQSchema globally.
 */

import type { Metadata } from 'next';
import { ProductListSchema } from '@/components/seo';
import HomepageClient from '@/features/homepage/HomepageClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

interface SchemaProduct {
  title: string;
  slug?: string;
  id: string;
}

async function getHomepageSchemaProducts(): Promise<SchemaProduct[]> {
  try {
    const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/catalog/products?limit=12&page=1&status=published`, {
      next: { revalidate: 1800 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: SchemaProduct[] };
    return payload.data ?? [];
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Buy Game Keys with Bitcoin and Crypto - Instant Delivery | BitLoot',
  description: 'BitLoot: Buy Steam, PlayStation, Xbox and Nintendo game keys with Bitcoin, Ethereum, USDT and 100+ cryptocurrencies. Instant delivery, anonymous checkout.',
  keywords: [
    'buy game keys with bitcoin',
    'buy steam keys with crypto',
    'crypto gaming marketplace',
    'buy game keys with ethereum',
    'anonymous game purchase',
    'instant game key delivery',
    'buy playstation keys crypto',
    'buy xbox keys bitcoin',
    'buy nintendo keys crypto',
    'cheap game keys crypto',
    'digital games bitcoin',
    'usdt game keys',
  ],
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'BitLoot',
    title: 'BitLoot - Buy Game Keys with Bitcoin and 100+ Cryptos',
    description: 'The #1 crypto gaming marketplace. Buy Steam, Xbox, PlayStation and Nintendo keys with BTC, ETH, USDT. Instant delivery, anonymous payment.',
    images: [{ url: siteUrl + '/og-image.png', width: 1200, height: 630, alt: 'BitLoot - Crypto Gaming Marketplace', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bitloot_io',
    creator: '@bitloot_io',
    title: 'BitLoot - Buy Game Keys with Bitcoin and Crypto',
    description: 'Instant Steam, Xbox, PlayStation and Nintendo keys. Pay with BTC, ETH, USDT and 100+ cryptos. Anonymous, instant, secure.',
    images: [siteUrl + '/og-image.png'],
  },
};

export default async function HomePage(): Promise<React.ReactElement> {
  const products = await getHomepageSchemaProducts();
  const productListItems = products.map((product) => ({
    name: product.title,
    url: `${siteUrl}/product/${product.slug !== undefined && product.slug !== '' ? product.slug : product.id}`,
  }));

  return (
    <>
      {productListItems.length > 0 && (
        <ProductListSchema
          items={productListItems}
          name="Featured Game Keys"
          description="Top game keys and digital products available on BitLoot"
        />
      )}
      <HomepageClient />
    </>
  );
}
