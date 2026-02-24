/**
 * Structured Data Components (JSON-LD)
 * 
 * These components add Schema.org structured data to pages,
 * which helps search engines understand content and display rich snippets.
 */

import Script from 'next/script';

// ============ Types ============

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

interface ProductSchemaProps {
  name: string;
  description?: string;
  image?: string;
  sku?: string;
  brand?: string;
  price: string;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  url?: string;
  category?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface WebsiteSearchSchemaProps {
  siteUrl: string;
  searchPath?: string;
}

// ============ Organization Schema ============

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export function OrganizationSchema({
  name = 'BitLoot',
  url = SITE_URL,
  logo = `${SITE_URL}/logo.png`,
  description = 'Crypto-powered digital gaming marketplace with instant delivery of game keys and software.',
  sameAs = [],
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: `support@${SITE_URL.replace('https://', '').replace('http://', '')}`,
      availableLanguage: ['English'],
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/catalog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============ Website Schema with Search ============

export function WebsiteSchema({ siteUrl, searchPath = '/catalog' }: WebsiteSearchSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BitLoot',
    url: siteUrl,
    description: 'Crypto-powered digital gaming marketplace with instant delivery of game keys and software.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}${searchPath}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============ Product Schema (for Product Pages) ============

export function ProductSchema({
  name,
  description,
  image,
  sku,
  brand = 'BitLoot',
  price,
  priceCurrency = 'EUR',
  availability = 'InStock',
  url,
  category,
  aggregateRating,
}: ProductSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    sku,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      price: parseFloat(price).toFixed(2),
      priceCurrency,
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: 'BitLoot',
      },
      url,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
    },
    category,
  };

  if (aggregateRating !== undefined && aggregateRating !== null && aggregateRating.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue.toFixed(1),
      reviewCount: aggregateRating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <Script
      id="product-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============ Breadcrumb Schema ============

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============ FAQ Schema ============

export function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============ ItemList Schema (for Product Listings) ============

interface ProductListItem {
  name: string;
  url: string;
  image?: string;
  price?: string;
}

export function ProductListSchema({ 
  items, 
  name = 'Featured Products',
  description = 'Top products on BitLoot',
}: { 
  items: ProductListItem[];
  name?: string;
  description?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        url: item.url,
        image: item.image,
        ...(item.price !== undefined && item.price !== '' && {
          offers: {
            '@type': 'Offer',
            price: parseFloat(item.price).toFixed(2),
            priceCurrency: 'EUR',
          },
        }),
      },
    })),
  };

  return (
    <Script
      id="product-list-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============ Local Business Schema (Optional) ============

export function OnlineStoreSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'BitLoot',
    url: SITE_URL,
    description: 'Crypto-powered digital gaming marketplace with instant delivery of game keys and software.',
    currenciesAccepted: 'BTC,ETH,USDT,USDC,LTC,XRP,DOGE',
    paymentAccepted: 'Cryptocurrency',
    priceRange: '€1 - €200',
    image: `${SITE_URL}/og-image.png`,
    sameAs: [
      'https://x.com/bitloot_io',
      'https://discord.gg/mqjUpqxBtA',
      'https://t.me/its_bitloot',
    ],
  };

  return (
    <Script
      id="store-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
