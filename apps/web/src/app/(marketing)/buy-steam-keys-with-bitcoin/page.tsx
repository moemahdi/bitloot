import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';
const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const revalidate = 3600; // Re-fetch every hour

export const metadata: Metadata = {
  title: 'Buy Steam Games with Bitcoin & Crypto — Accounts & Keys | BitLoot',
  description:
    'Buy Steam game accounts and keys with Bitcoin, Ethereum, USDT and 100+ cryptocurrencies. Instant digital delivery. Thousands of Steam games available now.',
  keywords: [
    'buy steam keys with bitcoin',
    'buy steam account with bitcoin',
    'buy steam keys crypto',
    'buy steam account crypto',
    'steam account bitcoin',
    'steam keys bitcoin',
    'cheap steam keys crypto',
    'buy steam games with crypto',
    'steam key bitcoin instant delivery',
    'buy pc games with bitcoin',
    'steam wallet crypto',
    'bitcoin gaming',
    'crypto steam games',
  ],
  alternates: {
    canonical: `${siteUrl}/buy-steam-keys-with-bitcoin`,
  },
  openGraph: {
    title: 'Buy Steam Games with Bitcoin — Accounts & Keys | BitLoot',
    description:
      'Pay with Bitcoin or any crypto. Get Steam game accounts and keys instantly. No KYC, no account needed.',
    url: `${siteUrl}/buy-steam-keys-with-bitcoin`,
    siteName: 'BitLoot',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'Buy Steam Keys with Bitcoin on BitLoot' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Steam Games with Bitcoin | BitLoot',
    description: 'Steam accounts & keys. Pay crypto. Instant delivery.',
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
  platform?: string;
}

async function getSteamProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${apiUrl}/catalog/products?platform=Steam&limit=12&page=1&sort=popular`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Product[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

const FAQ_ITEMS = [
  {
    question: 'Can I buy Steam games and accounts with Bitcoin?',
    answer:
      'Yes! BitLoot sells Steam game accounts and CD keys purchasable with Bitcoin (BTC) and 100+ other cryptocurrencies including Ethereum, USDT, Litecoin, and Monero. Select your game, choose your crypto, and access your purchase instantly.',
  },
  {
    question: 'What is a Steam Account vs a Steam CD Key?',
    answer:
      'A Steam Account is a pre-loaded game account you receive login credentials for. A Steam CD Key is a code you redeem on your own existing Steam account. Both types are available on BitLoot — check each product listing for details.',
  },
  {
    question: 'How fast is Steam game delivery after crypto payment?',
    answer:
      'After your crypto payment is confirmed (typically 1-3 network confirmations), your Steam account credentials or CD key are delivered instantly to your order page. No waiting, no email delays.',
  },
  {
    question: 'Do I need a BitLoot account to buy Steam games with crypto?',
    answer:
      'No account is required. You can checkout as a guest using just your email address. Your key or account is available via a secure link immediately after payment.',
  },
  {
    question: 'Are Steam games from BitLoot legitimate?',
    answer:
      'All Steam accounts and keys are sourced from authorized distributors and the Kinguin marketplace. Every product is genuine. Replacements are provided for any invalid key or access issue.',
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
    { '@type': 'ListItem', position: 2, name: 'Buy Steam Games with Bitcoin', item: `${siteUrl}/buy-steam-keys-with-bitcoin` },
  ],
};

function formatPrice(raw: string | undefined | null): string | null {
  if (raw == null || raw === '') return null;
  const parsed = parseFloat(raw);
  if (isNaN(parsed) || parsed <= 0) return null;
  return `€${parsed.toFixed(2)}`;
}

export default async function BuySteamKeysWithBitcoinPage() {
  const products = await getSteamProducts();

  const productListSchema = products.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Buy Steam Keys with Bitcoin',
        description: 'Top Steam game keys available with cryptocurrency payment on BitLoot',
        url: `${siteUrl}/buy-steam-keys-with-bitcoin`,
        itemListElement: products.slice(0, 10).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.title,
            url: `${siteUrl}/product/${product.slug ?? product.id}`,
            image: product.coverUrl,
            offers: {
              '@type': 'Offer',
              price: product.retailPriceEur !== undefined && product.retailPriceEur !== '' ? parseFloat(product.retailPriceEur).toFixed(2) : undefined,
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              acceptedPaymentMethod: 'https://schema.org/CryptocurrencyPayment',
            },
          },
        })),
      }
    : null;

  return (
    <>
      <Script
        id="faq-schema-steam"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {productListSchema !== null && (
        <Script
          id="product-list-schema-steam"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
        />
      )}

      <Script
        id="breadcrumb-schema-steam"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-cyan-400/5 via-background to-background py-16 text-center">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-400">
              ⚡ Game Accounts & Keys · Instant Delivery · 100+ Coins
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Buy Steam Games with Bitcoin & Crypto
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              The easiest way to buy Steam game accounts and keys with Bitcoin, Ethereum, USDT, and
              100+ other cryptocurrencies. Pay anonymously, access your game instantly.
            </p>
            <Link
              href="/catalog?platform=Steam"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-8 py-3 text-base font-semibold text-black transition-opacity hover:opacity-90"
            >
              Browse Steam Games →
            </Link>
          </div>
        </section>

        {/* Trust signals */}
        <section className="border-b border-border bg-muted/20 py-4">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="text-yellow-400">★★★★★</span> 4.8/5 from 2,000+ orders</span>
            <span>⚡ Instant delivery</span>
            <span>🔒 Secure crypto processing</span>
            <span>🛡️ No KYC required</span>
            <span>✅ Verified products</span>
          </div>
        </section>

        {/* Why BitLoot for Steam */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Why Buy Steam Games with Crypto on BitLoot?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: '⚡', title: 'Instant Delivery', desc: 'Steam accounts and keys delivered the moment your crypto payment confirms. No manual review.' },
              { icon: '🔐', title: 'Anonymous Payments', desc: 'Pay with Bitcoin or Monero — no personal data required beyond an email for delivery.' },
              { icon: '💸', title: 'Accounts & Keys', desc: 'We sell pre-loaded Steam game accounts and CD keys — choose what works best for you. Often up to 80% below retail.' },
              { icon: '🌍', title: '100+ Cryptocurrencies', desc: 'Bitcoin, Ethereum, USDT, USDC, Litecoin, Solana, Monero — we support a wide range of crypto checkout options.' },
              { icon: '✅', title: 'Verified & Guaranteed', desc: 'All products sourced from authorized distributors. Replacements provided for any access issue.' },
              { icon: '🎮', title: 'Thousands of Titles', desc: 'AAA blockbusters, indie gems, RPGs, FPS, strategy — Steam accounts and keys across all genres.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 text-3xl">{item.icon}</div>
                <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Top Steam Products */}
        {products.length > 0 && (
          <section className="bg-muted/30 py-12">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="mb-2 text-2xl font-bold text-foreground">Popular Steam Games</h2>
              <p className="mb-8 text-muted-foreground">Top selling Steam accounts and game keys — all payable with Bitcoin and crypto.</p>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug ?? product.id}`}
                    className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-cyan-400/50 hover:shadow-lg"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      {(product.imageUrl ?? product.coverUrl) != null && (product.imageUrl ?? product.coverUrl) !== '' ? (
                        <Image
                          src={(product.imageUrl ?? product.coverUrl)!}
                          alt={product.title}
                          fill
                          className="object-contain transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <span className="text-2xl opacity-30">🎮</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="mb-1 line-clamp-2 text-sm font-medium text-foreground">{product.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Steam Game</span>
                        {(() => { const p = formatPrice(product.retailPriceEur ?? product.price); return p !== null ? <span className="text-sm font-bold text-cyan-400">{p}</span> : null; })()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/catalog?platform=Steam"
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-2.5 text-sm font-semibold text-cyan-400 transition-colors hover:bg-cyan-400/20"
                >
                  View All Steam Games →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* How to Buy */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            How to Buy Steam Games with Bitcoin on BitLoot
          </h2>
          <ol className="space-y-6">
            {[
              { step: '1', title: 'Find your game', desc: 'Browse thousands of Steam accounts and keys in our catalog. Filter by genre, price, or platform.' },
              { step: '2', title: 'Add to cart', desc: 'Add the Steam game key to your cart. No account required — enter your email at checkout.' },
              { step: '3', title: 'Choose your cryptocurrency', desc: 'Select from 100+ cryptocurrencies including Bitcoin, Ethereum, USDT, Monero, and more.' },
              { step: '4', title: 'Send payment', desc: 'Send the exact crypto amount to the payment address. The exchange rate is locked for 20 minutes.' },
              { step: '5', title: 'Access your Steam game instantly', desc: 'After confirmation, your Steam account credentials or CD key appear immediately on the order page. Activate or log in on Steam right away.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-400">
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

        {/* FAQ */}
        <section className="border-t border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
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

        {/* CTA */}
        <section className="py-16 text-center">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Start Buying Steam Games with Crypto</h2>
            <p className="mb-8 text-muted-foreground">
              Join thousands of gamers who pay with Bitcoin on BitLoot. Instant delivery of Steam accounts and keys — zero friction.
            </p>
            <Link
              href="/catalog?platform=Steam"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-8 py-3 text-base font-semibold text-black transition-opacity hover:opacity-90"
            >
              Browse Steam Games Now →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
