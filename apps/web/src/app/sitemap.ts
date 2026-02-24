import type { MetadataRoute } from 'next';

export const revalidate = 3600; // Revalidate every hour

const MAX_PRODUCTS = 5000; // Well within Google's 50k per sitemap limit
const PAGE_SIZE = 500;

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

async function getAllProducts(): Promise<ProductForSitemap[]> {
  const firstRes = await fetch(
    `${getApiUrl()}/catalog/products?limit=${PAGE_SIZE}&page=1&status=published`,
    { next: { revalidate: 3600 } },
  ).catch(() => null);

  if (firstRes?.ok !== true) return [];

  const firstPage = (await firstRes.json()) as ApiProductsResponse;
  const total = typeof firstPage.total === 'number' ? firstPage.total : 0;
  const products = firstPage.data ?? [];

  if (total <= PAGE_SIZE) return products;

  const totalPages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PRODUCTS / PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

  const remaining = await Promise.all(
    pageNumbers.map(async (page) => {
      const res = await fetch(
        `${getApiUrl()}/catalog/products?limit=${PAGE_SIZE}&page=${page}&status=published`,
        { next: { revalidate: 3600 } },
      ).catch(() => null);
      if (res?.ok !== true) return [];
      const json = (await res.json()) as ApiProductsResponse;
      return json.data ?? [];
    }),
  );

  return [...products, ...remaining.flat()];
}

async function getCategories(): Promise<CategoryForSitemap[]> {
  const res = await fetch(`${getApiUrl()}/catalog/categories`, {
    next: { revalidate: 86400 },
  }).catch(() => null);
  if (res?.ok !== true) return [];
  const payload = (await res.json()) as { categories?: CategoryForSitemap[] };
  return payload.categories ?? [];
}

function getStaticPages(baseUrl: string): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/catalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/playstation-plus-games`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/xbox-game-pass-crypto`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/buy-steam-keys-with-bitcoin`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/buy-playstation-keys-crypto`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/buy-xbox-keys-crypto`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/buy-nintendo-keys-crypto`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/reviews`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/help`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/refunds`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/catalog/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug !== undefined && product.slug !== '' ? product.slug : product.id}`,
    lastModified:
      product.updatedAt !== undefined && product.updatedAt !== ''
        ? new Date(product.updatedAt)
        : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
    ...(product.coverUrl !== undefined &&
      product.coverUrl !== '' && {
        images: [product.coverUrl],
      }),
  }));

  return [...getStaticPages(baseUrl), ...categoryPages, ...productPages];
}
