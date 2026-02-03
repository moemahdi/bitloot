import type { Metadata, ResolvingMetadata } from 'next';
import { ProductSchema, BreadcrumbSchema } from '@/components/seo';

/**
 * Product Layout with Dynamic Metadata & Structured Data
 * 
 * Fetches product data on the server to generate:
 * - SEO metadata (title, description, keywords)
 * - Open Graph tags for social sharing
 * - Twitter cards
 * - Canonical URLs
 * - JSON-LD Product schema for rich snippets
 * - Breadcrumb schema for search navigation
 */

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

interface ProductData {
  id: string;
  title: string;
  description?: string;
  retailPriceEur?: string;
  platform?: string;
  category?: string;
  coverUrl?: string;
  slug?: string;
  inStock?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

async function getProduct(id: string): Promise<ProductData | null> {
  try {
    const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/catalog/products/${id}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });
    
    if (!response.ok) return null;
    return response.json() as Promise<ProductData>;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.com';
  
  // Fallback metadata if product not found
  if (product === null) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found on BitLoot.',
    };
  }

  // Truncate description for meta tags (160 chars max)
  const description = product.description !== undefined && product.description !== ''
    ? product.description.slice(0, 155) + (product.description.length > 155 ? '...' : '')
    : `Buy ${product.title} with crypto on BitLoot. Instant delivery, anonymous payment.`;
  
  // Format price for structured data
  const priceText = product.retailPriceEur !== undefined && product.retailPriceEur !== ''
    ? `€${parseFloat(product.retailPriceEur).toFixed(2)}` 
    : '';
  
  return {
    title: product.title,
    description,
    keywords: [
      product.title,
      product.platform ?? 'game key',
      product.category ?? 'digital',
      'crypto payment',
      'bitcoin gaming',
      'instant delivery',
    ].filter(Boolean),
    openGraph: {
      title: `${product.title}${priceText !== '' ? ` - ${priceText}` : ''} | BitLoot`,
      description,
      url: `${baseUrl}/product/${id}`,
      siteName: 'BitLoot',
      images: product.coverUrl !== undefined && product.coverUrl !== '' ? [
        {
          url: product.coverUrl,
          width: 460,
          height: 215,
          alt: product.title,
        },
      ] : [],
      type: 'website', // Could use 'product' with og:product namespace
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | BitLoot`,
      description,
      images: product.coverUrl !== undefined && product.coverUrl !== '' ? [product.coverUrl] : [],
    },
    alternates: {
      canonical: `${baseUrl}/product/${product.slug ?? id}`,
    },
    other: {
      // Structured data hints
      'product:price:amount': product.retailPriceEur ?? '',
      'product:price:currency': 'EUR',
    },
  };
}

export default async function ProductLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.com';

  // Don't render structured data if product not found
  if (product === null) {
    return children;
  }

  // Build breadcrumb trail
  const breadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: 'Catalog', url: `${baseUrl}/catalog` },
  ];
  
  breadcrumbs.push({ 
    name: product.title, 
    url: `${baseUrl}/product/${product.slug ?? id}` 
  });

  // Add category breadcrumb if exists
  const categoryBreadcrumb = product.category !== undefined && product.category !== '' 
    ? [{ 
        name: product.category, 
        url: `${baseUrl}/catalog/${product.category.toLowerCase().replace(/\s+/g, '-')}` 
      }]
    : [];
  
  const fullBreadcrumbs = [
    ...breadcrumbs.slice(0, 2), // Home, Catalog
    ...categoryBreadcrumb,
    breadcrumbs[breadcrumbs.length - 1]!, // Product
  ];

  return (
    <>
      {/* Product Structured Data for Rich Snippets */}
      <ProductSchema
        name={product.title}
        description={product.description?.slice(0, 500)}
        image={product.coverUrl}
        sku={product.id}
        brand={product.platform ?? 'BitLoot'}
        price={product.retailPriceEur ?? '0'}
        priceCurrency="EUR"
        availability={product.inStock !== false ? 'InStock' : 'OutOfStock'}
        url={`${baseUrl}/product/${product.slug ?? id}`}
        category={product.category}
        aggregateRating={
          typeof product.reviewCount === 'number' && product.reviewCount > 0
            ? {
                ratingValue: product.averageRating ?? 4.5,
                reviewCount: product.reviewCount,
              }
            : undefined
        }
      />
      
      {/* Breadcrumb Structured Data */}
      <BreadcrumbSchema items={fullBreadcrumbs} />
      
      {children}
    </>
  );
}
