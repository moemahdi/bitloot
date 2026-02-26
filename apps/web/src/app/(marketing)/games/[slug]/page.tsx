import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { SpotlightPageClient } from './SpotlightPageClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';
const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Spotlights can be deleted/recreated with the same slug from admin.
// Keep this route uncached so slug reuse never serves stale content.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SpotlightData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  tagline?: string;
  coverImageUrl?: string;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  accentColor?: string;
  badgeText?: string;
  releaseDate?: string;
  longDescription?: string;
  metacriticScore?: number;
  developerName?: string;
  publisherName?: string;
  genres?: string[];
  features?: string[];
  faqItems?: Array<{ question: string; answer: string }>;
  minPrice?: string;
  maxPrice?: string;
  products?: Array<{
    id: string;
    title: string;
    slug: string;
    platform?: string;
    region?: string;
    subtitle?: string;
    price: string;
    currency: string;
    coverImageUrl?: string;
    rating?: number;
  }>;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSpotlightData(slug: string): Promise<SpotlightData | null> {
  try {
    // Normalize slug to lowercase to match DB format
    const normalizedSlug = slug.toLowerCase();
    const res = await fetch(`${apiUrl}/catalog/groups/spotlight/${normalizedSlug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<SpotlightData>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getSpotlightData(resolvedParams.slug);

  if (data === null) {
    return {
      title: 'Game Not Found | BitLoot',
    };
  }

  const keywords = [
    `buy ${data.title} crypto`,
    `buy ${data.title} bitcoin`,
    `${data.title} key`,
    `${data.title} cheap`,
    `${data.title} digital`,
    ...(data.genres ?? []).map((g) => `${data.title} ${g}`),
  ];

  return {
    title: `Buy ${data.title} with Crypto | BitLoot`,
    description:
      data.longDescription ??
      data.description ??
      `Buy ${data.title} with Bitcoin, Ethereum, and 100+ cryptocurrencies. Instant digital delivery guaranteed.`,
    keywords,
    alternates: {
      canonical: `${siteUrl}/games/${data.slug}`,
    },
    openGraph: {
      title: `Buy ${data.title} with Crypto | BitLoot`,
      description:
        data.tagline ??
        `Buy ${data.title} with cryptocurrency. Instant digital delivery.`,
      url: `${siteUrl}/games/${data.slug}`,
      siteName: 'BitLoot',
      images: [
        {
          url: data.heroImageUrl ?? data.coverImageUrl ?? `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `Buy ${data.title} with Crypto on BitLoot`,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Buy ${data.title} with Crypto | BitLoot`,
      description: data.tagline ?? `Buy ${data.title} with cryptocurrency.`,
      images: [data.heroImageUrl ?? data.coverImageUrl ?? `${siteUrl}/og-image.png`],
    },
  };
}

export default async function GameSpotlightPage({ params }: PageProps): Promise<React.JSX.Element> {
  const resolvedParams = await params;
  const data = await getSpotlightData(resolvedParams.slug);

  if (data === null) {
    notFound();
  }

  // Generate structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Games', item: `${siteUrl}/games` },
      { '@type': 'ListItem', position: 3, name: data.title, item: `${siteUrl}/games/${data.slug}` },
    ],
  };

  const faqSchema =
    data.faqItems !== undefined && data.faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data.faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }
      : null;

  const productListSchema =
    data.products !== undefined && data.products.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${data.title} - All Editions`,
          description: `All available editions of ${data.title} on BitLoot`,
          url: `${siteUrl}/games/${data.slug}`,
          itemListElement: data.products.slice(0, 10).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Product',
              name: product.title,
              url: `${siteUrl}/product/${product.slug}`,
              image: product.coverImageUrl,
              offers: {
                '@type': 'Offer',
                price: parseFloat(product.price).toFixed(2),
                priceCurrency: 'EUR',
                availability: 'https://schema.org/InStock',
              },
            },
          })),
        }
      : null;

  const videoSchema =
    data.heroVideoUrl !== undefined && data.heroVideoUrl !== ''
      ? {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: `${data.title} Trailer`,
          description: `Official trailer for ${data.title}`,
          thumbnailUrl: data.heroImageUrl ?? data.coverImageUrl,
          embedUrl: data.heroVideoUrl,
        }
      : null;

  return (
    <>
      {/* Structured Data */}
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema !== null && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {productListSchema !== null && (
        <Script
          id="product-list-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
        />
      )}
      {videoSchema !== null && (
        <Script
          id="video-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
        />
      )}

      <SpotlightPageClient data={data} />
    </>
  );
}
