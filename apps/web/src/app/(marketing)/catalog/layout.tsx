import type { Metadata } from 'next';
import { ProductListSchema } from '@/components/seo';

/**
 * Catalog Layout — SEO Metadata
 *
 * High-intent commercial keywords targeting gamers who want to buy cheap game
 * keys with crypto. This page is the highest-value landing page after the homepage.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

interface CatalogSchemaProduct {
  title: string;
  slug?: string;
  id: string;
}

async function getCatalogSchemaProducts(): Promise<CatalogSchemaProduct[]> {
  try {
    const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/catalog/products?limit=24&page=1&status=published`, {
      next: { revalidate: 1800 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: CatalogSchemaProduct[] };
    return payload.data ?? [];
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Buy Cheap Game Keys with Crypto — Full Catalog | BitLoot',
  description:
    'Browse 1,000+ cheap game keys, software licenses, gift cards and DLC. Pay with Bitcoin, Ethereum, USDT and 100+ cryptocurrencies. Instant delivery guaranteed.',
  keywords: [
    'cheap game keys',
    'buy steam keys crypto',
    'buy game keys bitcoin',
    'game keys with ethereum',
    'cheap steam keys',
    'buy playstation keys',
    'xbox game keys crypto',
    'nintendo keys bitcoin',
    'software license crypto',
    'gift cards bitcoin',
    'digital games crypto',
    'game keys instant delivery',
    'anonymous game purchase',
    'crypto gaming store',
  ],
  alternates: {
    canonical: `${siteUrl}/catalog`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/catalog`,
    siteName: 'BitLoot',
    title: 'Cheap Game Keys with Crypto | 1,000+ Titles | BitLoot',
    description:
      'Browse 1,000+ game keys for Steam, PlayStation, Xbox and Nintendo. Pay with Bitcoin, Ethereum, USDT. Instant delivery, anonymous checkout.',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'BitLoot Game Key Catalog', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bitloot',
    title: 'Cheap Game Keys with Crypto | BitLoot Catalog',
    description: '1,000+ Steam, PlayStation, Xbox & Nintendo keys. Pay with BTC, ETH, USDT. Instant delivery.',
  },
};

export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const products = await getCatalogSchemaProducts();
  const productListItems = products.map((product) => ({
    name: product.title,
    url: `${siteUrl}/product/${product.slug !== undefined && product.slug !== '' ? product.slug : product.id}`,
  }));

  return (
    <>
      {productListItems.length > 0 && (
        <ProductListSchema
          items={productListItems}
          name="Catalog Products"
          description="Browse game keys, software licenses, gift cards and subscriptions on BitLoot"
        />
      )}
      {children}
    </>
  );
}
