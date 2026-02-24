import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

const PRODUCTS_PER_SITEMAP = 500;
const MAX_PRODUCT_SITEMAPS = 20;

interface ProductForSitemap {
  id: string;
  slug?: string;
  updatedAt?: string;
  coverUrl?: string;
}

interface CategoryForSitemap {
  slug: string;
}

interface ApiProductsResponse {
  data?: ProductForSitemap[];
  total?: number;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';
}

function getApiUrl(): string {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}

async function getCategories(): Promise<CategoryForSitemap[]> {
  try {
    const response = await fetch(`${getApiUrl()}/catalog/categories`, {
      next: { revalidate: 86400 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { categories?: CategoryForSitemap[] };
    return payload.categories ?? [];
  } catch {
    return [];
  }
}

async function getProductsPage(page: number): Promise<ApiProductsResponse> {
  try {
    const response = await fetch(
      `${getApiUrl()}/catalog/products?limit=${PRODUCTS_PER_SITEMAP}&page=${page}&status=published`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return { data: [], total: 0 };
    return (await response.json()) as ApiProductsResponse;
  } catch {
    return { data: [], total: 0 };
  }
}

function getStaticPages(baseUrl: string): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/catalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/reviews`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/help`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/refunds`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/buy-steam-keys-with-bitcoin`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/buy-playstation-keys-crypto`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/buy-xbox-keys-crypto`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/buy-nintendo-keys-crypto`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/playstation-plus-games`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/xbox-game-pass-crypto`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ];
}

export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  const firstPage = await getProductsPage(1);
  const totalProducts = typeof firstPage.total === 'number' && firstPage.total > 0 ? firstPage.total : 0;
  const productSitemapCount = Math.min(
    Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_SITEMAP)),
    MAX_PRODUCT_SITEMAPS,
  );

  const ids: Array<{ id: number }> = [{ id: 0 }];
  for (let page = 1; page <= productSitemapCount; page++) {
    ids.push({ id: page });
  }
  return ids;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  if (id === 0) {
    const [staticPages, categories] = await Promise.all([
      Promise.resolve(getStaticPages(baseUrl)),
      getCategories(),
    ]);

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/catalog/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    }));

    return [...staticPages, ...categoryPages];
  }

  const pageData = await getProductsPage(id);
  const products = pageData.data ?? [];

  return products.map((product) => ({
    url: `${baseUrl}/product/${product.slug !== undefined && product.slug !== '' ? product.slug : product.id}`,
    lastModified:
      product.updatedAt !== undefined && product.updatedAt !== ''
        ? new Date(product.updatedAt)
        : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
    ...(product.coverUrl !== undefined && product.coverUrl !== '' && {
      images: [product.coverUrl],
    }),
  }));
}
