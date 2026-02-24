import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';
const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Buy Nintendo Switch Keys with Crypto — eShop Codes & Games | BitLoot',
  description:
    'Buy Nintendo Switch game keys and eShop digital codes with Bitcoin, Ethereum, USDT and 100+ cryptocurrencies. Instant delivery, secure crypto checkout, no KYC.',
  keywords: [
    'buy nintendo switch keys crypto',
    'buy nintendo eshop codes bitcoin',
    'nintendo switch game keys usdt',
    'buy switch games with ethereum',
    'nintendo eshop crypto',
    'switch game codes bitcoin',
    'buy mario kart 8 deluxe key crypto',
    'buy zelda key bitcoin',
    'nintendo digital games crypto',
    'nintendo switch no kyc',
  ],
  alternates: {
    canonical: `${siteUrl}/buy-nintendo-keys-crypto`,
  },
  openGraph: {
    title: 'Buy Nintendo Switch Keys with Crypto | BitLoot',
    description:
      'Nintendo Switch game keys and eShop codes paid with Bitcoin, Ethereum, and 100+ cryptocurrencies. Instant delivery.',
    url: `${siteUrl}/buy-nintendo-keys-crypto`,
    siteName: 'BitLoot',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Buy Nintendo Switch Keys with Crypto on BitLoot',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Nintendo Switch Keys with Crypto | BitLoot',
    description:
      'Nintendo Switch digital game keys with Bitcoin, Ethereum, USDT and 100+ cryptocurrencies. Instant delivery.',
    images: [`${siteUrl}/og-image.png`],
  },
};

interface Product {
  id: string;
  title: string;
  slug?: string;
  imageUrl?: string;
  coverUrl?: string;
  retailPriceEur?: string;
  price?: string;
}

async function getNintendoProducts(): Promise<Product[]> {
  try {
    const response = await fetch(
      `${apiUrl}/catalog/products?platform=Nintendo&limit=16&page=1&sort=popular`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: Product[] };
    return payload.data ?? [];
  } catch {
    return [];
  }
}

function formatPrice(raw: string | undefined | null): string | null {
  if (raw == null || raw === '') return null;
  const parsed = parseFloat(raw);
  if (isNaN(parsed) || parsed <= 0) return null;
  return `€${parsed.toFixed(2)}`;
}

const FAQ_ITEMS = [
  {
    question: 'Can I buy Nintendo Switch game keys with Bitcoin?',
    answer:
      'Yes. BitLoot lets you buy Nintendo Switch digital game keys and eShop codes with Bitcoin, Ethereum, USDT, and 100+ other cryptocurrencies.',
  },
  {
    question: 'How fast are Nintendo keys delivered?',
    answer:
      'Most Nintendo orders are delivered instantly after payment confirmation. You can access your key directly from your order page.',
  },
  {
    question: 'Are Nintendo keys region-locked?',
    answer:
      'Some Nintendo products can be region-specific. Always check the product region details before purchase to ensure compatibility with your account.',
  },
  {
    question: 'How do I redeem a Nintendo eShop code?',
    answer:
      'Open Nintendo eShop on your Switch, select Redeem Code, then paste the code received from BitLoot. The game or balance is added immediately.',
  },
  {
    question: 'Can I buy Nintendo games without KYC?',
    answer:
      'Yes. Standard purchases on BitLoot do not require KYC. You can pay with crypto and receive your Nintendo key quickly and securely.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}` },
    { '@type': 'ListItem', position: 2, name: 'Nintendo', item: `${siteUrl}/buy-nintendo-keys-crypto` },
  ],
};

export default async function BuyNintendoKeysCryptoPage(): Promise<React.ReactElement> {
  const nintendoProducts = await getNintendoProducts();

  const productListSchema =
    nintendoProducts.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Nintendo Switch Games with Crypto',
          url: `${siteUrl}/buy-nintendo-keys-crypto`,
          itemListElement: nintendoProducts.slice(0, 12).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Product',
              name: product.title,
              url: `${siteUrl}/product/${product.slug !== undefined && product.slug !== '' ? product.slug : product.id}`,
              image: product.coverUrl ?? product.imageUrl,
              offers: {
                '@type': 'Offer',
                price:
                  product.retailPriceEur !== undefined && product.retailPriceEur !== ''
                    ? parseFloat(product.retailPriceEur).toFixed(2)
                    : undefined,
                priceCurrency: 'EUR',
                availability: 'https://schema.org/InStock',
              },
            },
          })),
        }
      : null;

  return (
    <>
      <Script
        id="faq-schema-nintendo"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {productListSchema !== null && (
        <Script
          id="product-list-schema-nintendo"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
        />
      )}

      <Script
        id="breadcrumb-schema-nintendo"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-red-600/10 via-background to-background py-16 text-center">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-600/30 bg-red-600/10 px-4 py-1.5 text-sm text-red-400">
              🎮 Nintendo Switch Game Keys · eShop Codes · 100+ Coins
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Buy Nintendo Switch Keys with Crypto
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Get Nintendo eShop game keys and digital codes with Bitcoin, Ethereum, USDT, and
              100+ cryptocurrencies. Fast delivery, secure checkout, no KYC for standard purchases.
            </p>
            <Link
              href="/catalog?platform=Nintendo"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse Nintendo Catalog →
            </Link>
          </div>
        </section>

        <section className="border-b border-border bg-muted/20 py-4">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-400">★★★★★</span> 4.8/5 from 2,000+ orders
            </span>
            <span>⚡ Instant key delivery</span>
            <span>🔒 Secure crypto processing</span>
            <span>🛡️ No KYC required</span>
            <span>✅ Nintendo digital codes</span>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Why Buy Nintendo Keys on BitLoot?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: '⚡',
                title: 'Instant Delivery',
                desc: 'Receive Nintendo game keys right after payment confirms.',
              },
              {
                icon: '🔐',
                title: 'Crypto Checkout',
                desc: 'Pay with BTC, ETH, USDT and 100+ cryptocurrencies.',
              },
              {
                icon: '🎮',
                title: 'Switch-Focused Catalog',
                desc: 'Nintendo eShop games and digital products in one place.',
              },
              {
                icon: '🛡️',
                title: 'Verified Products',
                desc: 'All products are sourced and delivered through secure flows.',
              },
              {
                icon: '🌍',
                title: 'Global Access',
                desc: 'Digital Nintendo products available for many regions.',
              },
              {
                icon: '💳',
                title: 'No Card Needed',
                desc: 'Buy Nintendo games without credit card or bank checkout.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 text-3xl">{item.icon}</div>
                <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {nintendoProducts.length > 0 && (
          <section className="bg-muted/30 py-12">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                Popular Nintendo Switch Games
              </h2>
              <p className="mb-8 text-muted-foreground">
                Pay with crypto and get your Nintendo key instantly.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {nintendoProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug !== undefined && product.slug !== '' ? product.slug : product.id}`}
                    className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-red-500/50 hover:shadow-lg"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      {(product.imageUrl ?? product.coverUrl) != null &&
                      (product.imageUrl ?? product.coverUrl) !== '' ? (
                        <Image
                          src={(product.imageUrl ?? product.coverUrl)!}
                          alt={product.title}
                          fill
                          className="object-contain p-2 transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <span className="text-2xl opacity-30">🎮</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="mb-1 line-clamp-2 text-sm font-medium text-foreground">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Nintendo</span>
                        {(() => {
                          const p = formatPrice(product.retailPriceEur ?? product.price);
                          return p !== null ? (
                            <span className="text-sm font-bold text-red-400">{p}</span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/catalog?platform=Nintendo"
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-600/10 px-6 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-600/20"
                >
                  View All Nintendo Games →
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            How to Buy Nintendo Games with Crypto
          </h2>
          <ol className="space-y-6">
            {[
              {
                step: '1',
                title: 'Choose your Nintendo game',
                desc: 'Open a product page and confirm region/platform details.',
              },
              {
                step: '2',
                title: 'Add to cart and checkout',
                desc: 'Proceed with email-based checkout in seconds.',
              },
              {
                step: '3',
                title: 'Select your cryptocurrency',
                desc: 'Pick BTC, ETH, USDT, SOL or any supported coin.',
              },
              {
                step: '4',
                title: 'Complete payment',
                desc: 'Send the exact amount shown at checkout.',
              },
              {
                step: '5',
                title: 'Redeem on Nintendo eShop',
                desc: 'Get your code instantly and redeem from your Nintendo account.',
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600/10 text-sm font-bold text-red-400">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-border py-12">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Nintendo FAQ</h2>
            <div className="space-y-6">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question} className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-2 font-semibold text-foreground">{item.question}</h3>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16 text-center">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Buy Nintendo Keys with Crypto Today
            </h2>
            <p className="mb-8 text-muted-foreground">
              Explore Nintendo Switch digital games and pay securely with crypto.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/catalog?platform=Nintendo"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Browse Nintendo Catalog →
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 py-3 text-base font-semibold text-foreground transition-opacity hover:opacity-80"
              >
                All Products →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
