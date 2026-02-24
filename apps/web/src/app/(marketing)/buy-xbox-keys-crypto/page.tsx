import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';
const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Buy Xbox Games with Crypto — Xbox One & Series X Accounts | BitLoot',
  description:
    'Buy Xbox One, Series X/S game accounts, keys, Xbox Game Pass, and Microsoft Store codes with Bitcoin, Ethereum, USDT and 100+ cryptocurrencies. Instant delivery.',
  keywords: [
    'buy xbox games crypto',
    'buy xbox account with bitcoin',
    'buy xbox account crypto',
    'buy xbox keys crypto',
    'buy xbox games with bitcoin',
    'xbox game pass bitcoin',
    'cheap xbox accounts crypto',
    'microsoft store crypto',
    'xbox series x account bitcoin',
    'xbox one account crypto',
    'game pass ultimate bitcoin',
    'buy xbox gift card crypto',
    'xbox cryptocurrency',
  ],
  alternates: {
    canonical: `${siteUrl}/buy-xbox-keys-crypto`,
  },
  openGraph: {
    title: 'Buy Xbox Games with Crypto | BitLoot',
    description:
      'Xbox One & Series X game accounts and keys, Game Pass, Microsoft codes — pay with Bitcoin and 100+ cryptos. Instant delivery.',
    url: `${siteUrl}/buy-xbox-keys-crypto`,
    siteName: 'BitLoot',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'Buy Xbox Keys with Crypto on BitLoot' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Xbox Games with Crypto | BitLoot',
    description: 'Xbox accounts & Game Pass with Bitcoin. Instant delivery.',
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

async function getXboxProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${apiUrl}/catalog/products?platform=Xbox&limit=12&page=1&sort=popular`,
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
    question: 'Can I buy Xbox Game Pass with Bitcoin?',
    answer:
      'Yes! BitLoot sells Xbox Game Pass Ultimate codes that you can purchase with Bitcoin, Ethereum, USDT, and 100+ other cryptocurrencies. Pay anonymously — no Microsoft account required at checkout.',
  },
  {
    question: 'Do Xbox keys from BitLoot work on Xbox Series X/S?',
    answer:
      'Yes. All Xbox keys are digital codes that work on Xbox One, Xbox Series X, and Xbox Series S. They also work via the Xbox app on Windows PC for cross-play titles.',
  },
  {
    question: 'How quickly do I receive my Xbox key after paying with crypto?',
    answer:
      'Instantly after your payment is confirmed (usually 1-3 network blocks). Your code appears on the secure order page — no waiting, no email delay.',
  },
  {
    question: 'Are BitLoot Xbox keys region-locked?',
    answer:
      'Check the product page for region details. We carry Global, EU, US, and UK keys. Most titles clearly state their region. When in doubt, filter by "Global" in the catalog.',
  },
  {
    question: 'What cryptocurrencies are accepted for Xbox games?',
    answer:
      'We accept 100+ coins through secure crypto payment processing: Bitcoin (BTC), Ethereum (ETH), Tether (USDT), USD Coin (USDC), Litecoin (LTC), Solana (SOL), Monero (XMR), and many more.',
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
    { '@type': 'ListItem', position: 2, name: 'Buy Xbox Games with Crypto', item: `${siteUrl}/buy-xbox-keys-crypto` },
  ],
};

function formatPrice(raw: string | undefined | null): string | null {
  if (raw == null || raw === '') return null;
  const parsed = parseFloat(raw);
  if (isNaN(parsed) || parsed <= 0) return null;
  return `€${parsed.toFixed(2)}`;
}

export default async function BuyXboxKeysCryptoPage() {
  const products = await getXboxProducts();

  const productListSchema = products.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Buy Xbox Keys with Crypto',
        url: `${siteUrl}/buy-xbox-keys-crypto`,
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
            },
          },
        })),
      }
    : null;

  return (
    <>
      <Script
        id="faq-schema-xbox"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {productListSchema !== null && (
        <Script
          id="product-list-schema-xbox"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
        />
      )}

      <Script
        id="breadcrumb-schema-xbox"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-green-600/10 via-background to-background py-16 text-center">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-600/30 bg-green-600/10 px-4 py-1.5 text-sm text-green-400">
              ⚡ Xbox One &amp; Series X · Game Accounts · 100+ Coins
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Buy Xbox Games with Crypto
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Purchase Xbox One, Series X/S game accounts and keys, Xbox Game Pass Ultimate, and
              Microsoft Store codes with Bitcoin, Ethereum, USDT, and 100+ cryptocurrencies.
            </p>
            <Link
              href="/catalog?platform=Xbox"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse Xbox Games →
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

        {/* Benefits */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Why Choose BitLoot for Xbox Games?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: '🎮', title: 'Xbox One & Series X/S', desc: 'Pre-loaded Xbox game accounts AND CD keys — full lineup of Xbox exclusives, cross-gen titles, and Game Pass codes.' },
              { icon: '🔐', title: 'No Bank, No Card', desc: 'Pay with Bitcoin or Monero. No credit card, no bank statements, no KYC process.' },
              { icon: '⚡', title: 'Instant Delivery', desc: 'Account credentials or code appear on your order page the moment crypto payment confirms.' },
              { icon: '🌍', title: '100+ Coins Accepted', desc: 'BTC, ETH, USDT, USDC, LTC, SOL, XMR — broad cryptocurrency support for checkout.' },
              { icon: '✅', title: 'Guaranteed & Verified', desc: 'All Xbox accounts and keys sourced from verified distributors. Replacements issued for any access issue.' },
              { icon: '🎁', title: 'Game Pass Ultimate', desc: 'Buy 1-month, 3-month, or 12-month Game Pass Ultimate codes with any cryptocurrency.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 text-3xl">{item.icon}</div>
                <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Top Products */}
        {products.length > 0 && (
          <section className="bg-muted/30 py-12">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="mb-2 text-2xl font-bold text-foreground">Popular Xbox Games</h2>
              <p className="mb-8 text-muted-foreground">Top selling Xbox game accounts and keys — pay with any cryptocurrency.</p>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug ?? product.id}`}
                    className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-green-500/50 hover:shadow-lg"
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
                        <span className="text-xs text-muted-foreground">Xbox Game</span>
                        {(() => { const p = formatPrice(product.retailPriceEur ?? product.price); return p !== null ? <span className="text-sm font-bold text-green-400">{p}</span> : null; })()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/catalog?platform=Xbox"
                  className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-600/10 px-6 py-2.5 text-sm font-semibold text-green-400 transition-colors hover:bg-green-600/20"
                >
                  View All Xbox Games →
                </Link>
                <Link
                  href="/xbox-game-pass-crypto"
                  className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-600/10 px-6 py-2.5 text-sm font-semibold text-green-400 transition-colors hover:bg-green-600/20"
                >
                  🎮 Buy Game Pass with Crypto →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* How to Buy */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            How to Buy Xbox Games with Crypto on BitLoot
          </h2>
          <ol className="space-y-6">
            {[
              { step: '1', title: 'Browse Xbox games or Game Pass', desc: 'Find Xbox One, Series X/S game accounts, keys, or Game Pass Ultimate in our Xbox catalog.' },
              { step: '2', title: 'Add to cart', desc: 'Select your product. No BitLoot account needed — just an email at checkout for order delivery.' },
              { step: '3', title: 'Choose your cryptocurrency', desc: 'Pick from 100+ coins: Bitcoin, Ethereum, USDT, Monero, Solana, and many more.' },
              { step: '4', title: 'Send payment', desc: 'Transfer the exact crypto amount shown. The exchange rate is locked for 20 minutes.' },
              { step: '5', title: 'Activate at microsoft.com/redeem', desc: 'Your Xbox code or account details appear instantly after payment confirms. Activate at microsoft.com/redeem or log in directly.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600/10 text-sm font-bold text-green-400">
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
              Xbox Crypto FAQ
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
            <h2 className="mb-4 text-3xl font-bold text-foreground">Get Xbox Games with Crypto Now</h2>
            <p className="mb-8 text-muted-foreground">
              Instant delivery, guaranteed game accounts and keys, 100+ cryptocurrencies. No KYC.
            </p>
            <Link
              href="/catalog?platform=Xbox"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse Xbox Games →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
