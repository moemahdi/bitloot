import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';
const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Buy PlayStation Games with Crypto — PS5 & PS4 Accounts | BitLoot',
  description:
    'Buy PS5 and PS4 game accounts, keys, PSN cards, and PlayStation Plus with Bitcoin, Ethereum, USDT and 100+ cryptocurrencies. Instant digital delivery guaranteed.',
  keywords: [
    'buy playstation games crypto',
    'buy ps5 account with bitcoin',
    'buy ps4 account crypto',
    'buy playstation keys crypto',
    'buy ps4 keys with bitcoin',
    'buy ps5 keys crypto',
    'playstation bitcoin',
    'psn card bitcoin',
    'cheap ps4 accounts crypto',
    'ps plus bitcoin',
    'playstation store crypto',
    'ps5 account bitcoin',
    'PSN crypto payment',
  ],
  alternates: {
    canonical: `${siteUrl}/buy-playstation-keys-crypto`,
  },
  openGraph: {
    title: 'Buy PlayStation Games with Crypto | BitLoot',
    description:
      'PS5 & PS4 game accounts, keys, PSN cards, PS Plus — all payable with Bitcoin and crypto. Instant delivery.',
    url: `${siteUrl}/buy-playstation-keys-crypto`,
    siteName: 'BitLoot',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'Buy PlayStation Keys with Crypto on BitLoot' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy PlayStation Games with Crypto | BitLoot',
    description: 'PS5 & PS4 accounts and keys with Bitcoin. Instant delivery.',
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

async function getPlayStationProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${apiUrl}/catalog/products?platform=PlayStation&limit=12&page=1&sort=popular`,
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
    question: 'Can I buy PlayStation keys with Bitcoin?',
    answer:
      'Yes. BitLoot accepts Bitcoin, Ethereum, USDT, and 100+ other coins for PS4 and PS5 game keys, PSN wallet codes, and PlayStation Plus subscriptions.',
  },
  {
    question: 'Do PlayStation keys from BitLoot work globally?',
    answer:
      'Most keys are marked with their region. Filter by your region in the catalog or check each product page. We offer EU, US, and global variants for most titles.',
  },
  {
    question: 'How do I redeem a PlayStation key?',
    answer:
      'Go to PlayStation Store on your PS4/PS5 or browser, select "Redeem Codes" under your account menu, and enter the 12-digit code. The game or credit is added instantly.',
  },
  {
    question: 'Is it safe to buy PlayStation keys with crypto?',
    answer:
      'Yes. BitLoot uses secure crypto payment processing — no card data, no bank records. All PSN keys are sourced from authorized distributors.',
  },
  {
    question: 'Can I buy PS Plus with cryptocurrency?',
    answer:
      'Yes! BitLoot offers PS Plus Essential, Extra, and Premium subscription codes that you can purchase with Bitcoin, Ethereum, or any supported cryptocurrency.',
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
    { '@type': 'ListItem', position: 2, name: 'Buy PlayStation Games with Crypto', item: `${siteUrl}/buy-playstation-keys-crypto` },
  ],
};

function formatPrice(raw: string | undefined | null): string | null {
  if (raw == null || raw === '') return null;
  const parsed = parseFloat(raw);
  if (isNaN(parsed) || parsed <= 0) return null;
  return `€${parsed.toFixed(2)}`;
}

export default async function BuyPlayStationKeysCryptoPage() {
  const products = await getPlayStationProducts();

  const productListSchema = products.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Buy PlayStation Keys with Crypto',
        description: 'Top PlayStation game keys available with cryptocurrency payment on BitLoot',
        url: `${siteUrl}/buy-playstation-keys-crypto`,
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
        id="faq-schema-ps"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {productListSchema !== null && (
        <Script
          id="product-list-schema-ps"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
        />
      )}

      <Script
        id="breadcrumb-schema-ps"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-[#003087]/10 via-background to-background py-16 text-center">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#003087]/30 bg-[#003087]/10 px-4 py-1.5 text-sm text-blue-400">
              ⚡ PS5 & PS4 Game Accounts · Instant Delivery · 100+ Coins
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Buy PlayStation Games with Crypto
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Purchase PS5 &amp; PS4 game accounts, keys, PSN wallet codes, and PlayStation Plus
              memberships with Bitcoin, Ethereum, USDT, and 100+ other cryptocurrencies.
            </p>
            <Link
              href="/catalog?platform=PlayStation"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse PlayStation Games →
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
            Why Buy PlayStation Games with Crypto?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: '🎮', title: 'PS5 & PS4 Game Accounts', desc: 'Pre-loaded PlayStation game accounts — log in and play immediately. Plus CD keys for your own account.' },
              { icon: '🔐', title: 'Private Payments', desc: 'No credit card, no bank statements. Pay with Bitcoin or Monero anonymously.' },
              { icon: '⚡', title: 'Instant Delivery', desc: 'Account credentials or keys delivered the second your crypto transaction confirms.' },
              { icon: '🌍', title: '100+ Cryptocurrencies', desc: 'BTC, ETH, USDT, LTC, SOL, XMR and hundreds more — pick whatever coin you hold.' },
              { icon: '✅', title: 'Verified Products', desc: 'All PlayStation accounts and keys verified legitimate. Issue with access? We replace it.' },
              { icon: '💳', title: 'PS Plus with Crypto', desc: 'Buy PS Plus Essential, Extra, or Premium subscriptions anonymously with any crypto.' },
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
              <h2 className="mb-2 text-2xl font-bold text-foreground">Popular PlayStation Games</h2>
              <p className="mb-8 text-muted-foreground">Top selling PS5 &amp; PS4 accounts and game keys — pay with any cryptocurrency.</p>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug ?? product.id}`}
                    className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-lg"
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
                        <span className="text-xs text-muted-foreground">PlayStation Game</span>
                        {(() => { const p = formatPrice(product.retailPriceEur ?? product.price); return p !== null ? <span className="text-sm font-bold text-blue-400">{p}</span> : null; })()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/catalog?platform=PlayStation"
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600/10 px-6 py-2.5 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-600/20"
                >
                  View All PlayStation Games →
                </Link>
                <Link
                  href="/playstation-plus-games"
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600/10 px-6 py-2.5 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-600/20"
                >
                  🎮 Buy PS Plus with Crypto →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* How to Buy */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            How to Buy PlayStation Games with Crypto on BitLoot
          </h2>
          <ol className="space-y-6">
            {[
              { step: '1', title: 'Find your game or subscription', desc: 'Browse PS5 & PS4 game accounts, keys, and PS Plus subscriptions in our PlayStation catalog.' },
              { step: '2', title: 'Add to cart', desc: 'Select your product and proceed. No account required — just provide your email at checkout for delivery.' },
              { step: '3', title: 'Choose your cryptocurrency', desc: 'Select from 100+ coins including Bitcoin, Ethereum, USDT, Solana, and Monero.' },
              { step: '4', title: 'Send payment', desc: 'Send the exact crypto amount to the payment address. Rate is locked for 20 minutes after selection.' },
              { step: '5', title: 'Access your game instantly', desc: 'Account credentials or key delivered immediately on the order page after payment confirms. Activate via PlayStation Store.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-sm font-bold text-blue-400">
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
              PlayStation Crypto FAQ
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
            <h2 className="mb-4 text-3xl font-bold text-foreground">Get PlayStation Games with Crypto Now</h2>
            <p className="mb-8 text-muted-foreground">
              Instant delivery. Verified PS5 &amp; PS4 game accounts and keys. 100+ cryptocurrencies accepted. No KYC.
            </p>
            <Link
              href="/catalog?platform=PlayStation"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse PlayStation Games →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
