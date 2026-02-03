import type { MetadataRoute } from 'next';

/**
 * Dynamic sitemap generation for BitLoot
 * 
 * This generates a sitemap.xml at /sitemap.xml
 * Includes static pages and dynamic product pages from the API.
 * 
 * For large catalogs (10,000+ products), consider:
 * - Multiple sitemap files (sitemap index)
 * - Incremental static regeneration
 */

interface ProductForSitemap {
  id: string;
  slug?: string;
  updatedAt?: string;
}

interface CategoryForSitemap {
  slug: string;
  name: string;
}

async function getProducts(): Promise<ProductForSitemap[]> {
  try {
    const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/catalog/products?limit=1000&status=published`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    
    if (!response.ok) return [];
    const data = (await response.json()) as { data?: ProductForSitemap[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<CategoryForSitemap[]> {
  try {
    const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/catalog/categories`, {
      next: { revalidate: 86400 }, // Revalidate daily
    });
    
    if (!response.ok) return [];
    return (await response.json()) as CategoryForSitemap[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.com';
  
  // Fetch dynamic content
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  
  // Static pages - Core site structure
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: new Date(),
      changeFrequency: 'hourly', // Flash deals update frequently
      priority: 0.9,
    },
    {
      url: `${baseUrl}/bundles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Legal/Info pages
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refunds`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // Category pages - High priority for navigation
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/catalog/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // Product pages - Primary content
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug !== undefined && product.slug !== '' ? product.slug : product.id}`,
    lastModified: product.updatedAt !== undefined && product.updatedAt !== '' ? new Date(product.updatedAt) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}

