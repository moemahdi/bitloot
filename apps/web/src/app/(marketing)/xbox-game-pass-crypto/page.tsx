import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Buy Xbox Game Pass Ultimate with Crypto — Bitcoin, USDT & More | BitLoot',
  description:
    'Buy Xbox Game Pass Ultimate with Bitcoin, Ethereum, USDT and 100+ cryptocurrencies. 1, 3, 6, and 12-month plans. Access 400+ games on Xbox & PC. Instant delivery, no KYC.',
  keywords: [
    'xbox game pass crypto',
    'buy xbox game pass with bitcoin',
    'xbox game pass ultimate bitcoin',
    'microsoft xbox game pass crypto',
    'buy game pass usdt',
    'xbox game pass ethereum',
    'xbox game pass no kyc',
    'xbox game pass cheap crypto',
    'game pass ultimate bitcoin',
    'xbox subscription bitcoin',
    'buy game pass crypto',
    'xbox pc game pass bitcoin',
    'microsoft subscription crypto',
  ],
  alternates: {
    canonical: `${siteUrl}/xbox-game-pass-crypto`,
  },
  openGraph: {
    title: 'Buy Xbox Game Pass Ultimate with Crypto | BitLoot',
    description:
      'Xbox Game Pass Ultimate — 400+ games on Xbox & PC — pay with Bitcoin, Ethereum or any crypto. Instant delivery, no KYC.',
    url: `${siteUrl}/xbox-game-pass-crypto`,
    siteName: 'BitLoot',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'Buy Xbox Game Pass with Crypto on BitLoot' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Xbox Game Pass Ultimate with Crypto | BitLoot',
    description: 'Xbox Game Pass Ultimate — pay with Bitcoin. 400+ games, instant delivery.',
    images: [`${siteUrl}/og-image.png`],
  },
};

interface GamePassPlan {
  duration: string;
  price: string;
  slug: string;
  perMonth: string;
  savings: string;
}

const GAME_PASS_PLANS: GamePassPlan[] = [
  {
    duration: '1 Month',
    price: '€14.63',
    slug: 'xbox-game-pass-ultimate-1-month-account-645b37',
    perMonth: '€14.63/mo',
    savings: '',
  },
  {
    duration: '3 Months',
    price: '€20.65',
    slug: 'xbox-game-pass-ultimate-3-month-subscription-accou-6516bc',
    perMonth: '€6.88/mo',
    savings: 'Save 53%',
  },
  {
    duration: '6 Months',
    price: '€55.96',
    slug: 'xbox-game-pass-ultimate-6-month-subscription-accou-661bbd',
    perMonth: '€9.33/mo',
    savings: 'Save 36%',
  },
  {
    duration: '12 Months',
    price: '€69.98',
    slug: 'xbox-game-pass-ultimate-12-month-subscription-acco-64ccaf',
    perMonth: '€5.83/mo',
    savings: 'Save 60%',
  },
];

const GAME_PASS_FEATURES = [
  { icon: '🎮', title: '300+ Games on Xbox & PC', desc: 'Instant access to hundreds of Xbox and PC games including every Xbox first-party title on day one.' },
  { icon: '☁️', title: 'Cloud Gaming (xCloud)', desc: 'Stream Xbox games directly to your phone, tablet, or browser — no console required.' },
  { icon: '🖥️', title: 'Xbox & PC Included', desc: 'Game Pass Ultimate works on Xbox consoles AND Windows PC. One subscription, two platforms.' },
  { icon: '⚡', title: 'Day One Releases', desc: 'Every Microsoft first-party game (Halo, Forza, Starfield, etc.) launches directly on Game Pass.' },
  { icon: '🎯', title: 'EA Play Included', desc: 'EA Play membership bundled in — access to EA games library and 10-hour trials of new releases.' },
  { icon: '💾', title: 'Member Discounts', desc: 'Up to 20% off games and DLC in the Microsoft Store. Keep content forever even after subscription ends.' },
];

const FAQ_ITEMS = [
  {
    question: 'Can I buy Xbox Game Pass with Bitcoin?',
    answer:
      'Yes. BitLoot accepts Bitcoin (BTC), Ethereum (ETH), USDT, Solana, Litecoin, and 100+ other cryptocurrencies for Xbox Game Pass Ultimate in 1, 3, 6, and 12-month plans. No card or bank transfer required.',
  },
  {
    question: 'What is Xbox Game Pass Ultimate?',
    answer:
      'Xbox Game Pass Ultimate is Microsoft\'s all-in-one subscription that includes access to 400+ games on Xbox consoles and PC (via Xbox App), cloud gaming via xCloud on mobile/browser, an EA Play membership, and exclusive member discounts. Every Xbox first-party game launches day one on Game Pass.',
  },
  {
    question: 'How do I activate an Xbox Game Pass code?',
    answer:
      'Go to microsoft.com/redeem or open the Microsoft Store on your Xbox/PC, enter the code from BitLoot, and your subscription activates immediately. If your account already has Game Pass, the time simply stacks.',
  },
  {
    question: 'Does Xbox Game Pass Ultimate include PC Game Pass?',
    answer:
      'Yes. Ultimate is the top tier and includes both console Game Pass AND PC Game Pass (formerly Xbox Game Pass for PC), plus cloud gaming and EA Play — everything in one subscription.',
  },
  {
    question: 'Is buying Xbox Game Pass with crypto anonymous?',
    answer:
      'Yes. BitLoot uses secure crypto payment processing. No credit card data, no bank statements, no KYC required. You just pay with crypto and receive your code.',
  },
  {
    question: 'Can I stack multiple Game Pass codes?',
    answer:
      'Yes. Microsoft allows stacking up to 36 months of Game Pass. If you already have an active subscription, the new code simply adds to the time remaining on your account.',
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
    { '@type': 'ListItem', position: 2, name: 'Xbox', item: `${siteUrl}/buy-xbox-keys-crypto` },
    { '@type': 'ListItem', position: 3, name: 'Xbox Game Pass with Crypto', item: `${siteUrl}/xbox-game-pass-crypto` },
  ],
};

export default function XboxGamePassCryptoPage() {
  return (
    <>
      <Script
        id="faq-schema-gamepass"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Script
        id="breadcrumb-schema-gamepass"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-[#107C10]/10 via-background to-background py-16 text-center">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#107C10]/30 bg-[#107C10]/10 px-4 py-1.5 text-sm text-green-400">
              🎮 Xbox Game Pass Ultimate · Xbox & PC · 100+ Coins Accepted
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Buy Xbox Game Pass with Crypto
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
              Get Xbox Game Pass Ultimate — 300+ games on Xbox & PC, cloud gaming, EA Play included — 
              paid with Bitcoin, Ethereum, USDT, or any of 100+ cryptocurrencies.
            </p>
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-3 py-1">✅ 1 Month — €14.63</span>
              <span className="rounded-full border border-border bg-card px-3 py-1">✅ 3 Months — €20.65</span>
              <span className="rounded-full border border-border bg-card px-3 py-1">✅ 12 Months — €69.98</span>
            </div>
            <Link
              href="/catalog?platform=Xbox&category=subscriptions"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse Xbox Game Pass Plans →
            </Link>
          </div>
        </section>

        {/* Trust signals */}
        <section className="border-b border-border bg-muted/20 py-4">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="text-yellow-400">★★★★★</span> 4.8/5 from 2,000+ orders</span>
            <span>⚡ Instant code delivery</span>
            <span>🔒 Secure crypto processing</span>
            <span>🛡️ No KYC required</span>
            <span>✅ Codes verified & stackable</span>
          </div>
        </section>

        {/* Plan cards */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
            Xbox Game Pass Ultimate Plans
          </h2>
          <p className="mb-8 text-center text-muted-foreground">
            All plans paid with Bitcoin or any cryptocurrency. Codes stack — buy more, save more.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GAME_PASS_PLANS.map((plan) => (
              <Link
                key={plan.slug}
                href={`/product/${plan.slug}`}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-900/10"
              >
                {plan.savings !== '' && (
                  <span className="absolute right-3 top-3 rounded-full bg-green-600/20 px-2 py-0.5 text-xs font-semibold text-green-400">
                    {plan.savings}
                  </span>
                )}
                <div className="mb-4 text-3xl">🎮</div>
                <h3 className="mb-1 font-bold text-foreground">Game Pass Ultimate</h3>
                <p className="mb-4 text-sm text-muted-foreground">{plan.duration}</p>
                <div className="mt-auto">
                  <div className="text-2xl font-bold text-green-400">{plan.price}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{plan.perMonth}</div>
                  <div className="mt-3 text-xs font-medium text-green-400 group-hover:underline">
                    Buy with Crypto →
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Codes stack up to 36 months. Already have Game Pass? Your time simply extends.
          </p>
        </section>

        {/* Features */}
        <section className="bg-muted/30 py-12">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
              What&apos;s Included in Xbox Game Pass Ultimate?
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {GAME_PASS_FEATURES.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-3 text-3xl">{item.icon}</div>
                  <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why crypto */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Why Buy Xbox Game Pass with Cryptocurrency?
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { q: 'No credit card needed', a: 'Pay directly from your crypto wallet — no card, no bank, no billing address. Perfect if you don\'t have a card linked to your Microsoft account.' },
              { q: 'Available in any region', a: 'BitLoot accepts any currency. Whether you\'re paying with BTC from Russia, ETH from Turkey, or USDT from anywhere — it works.' },
              { q: 'Instant delivery worldwide', a: 'No regional restrictions on payment. Pay with crypto and receive your code in seconds, regardless of your country.' },
              { q: 'Stack codes for maximum savings', a: 'Buy a 3-month code now and a 12-month code later — they stack. Pay less per month when you buy longer durations.' },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-2 font-semibold text-foreground">✅ {item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to Buy */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            How to Buy Xbox Game Pass with Bitcoin on BitLoot
          </h2>
          <ol className="space-y-6">
            {[
              { step: '1', title: 'Choose your duration', desc: 'Pick 1, 3, 6, or 12 months. Longer plans cost less per month — the 12-month saves 60% vs 1-month.' },
              { step: '2', title: 'Add to cart', desc: 'Click your chosen Game Pass plan. No BitLoot account needed — just an email for order delivery.' },
              { step: '3', title: 'Select your cryptocurrency', desc: 'Choose from 100+ coins: Bitcoin, Ethereum, USDT, Solana, and more. Rate locked for 20 minutes.' },
              { step: '4', title: 'Send payment', desc: 'Transfer the exact crypto amount to the on-screen payment address. Confirms in 1–3 blocks.' },
              { step: '5', title: 'Activate at microsoft.com/redeem', desc: 'Your Game Pass code appears instantly on the order page. Go to microsoft.com/redeem, enter the code, and start playing.' },
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
              Xbox Game Pass FAQ
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

        {/* Cross-link: PS Plus */}
        <section className="mx-auto max-w-5xl px-4 pb-8">
          <div className="rounded-xl border border-blue-500/20 bg-blue-600/5 p-6 text-center">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Also on BitLoot — PlayStation</p>
            <h3 className="mb-4 text-lg font-bold text-foreground">Buy PlayStation Plus with Crypto</h3>
            <p className="mb-4 text-sm text-muted-foreground">PS Plus Essential, Extra & Premium — monthly free games, 400+ title catalog — pay with Bitcoin or any crypto.</p>
            <Link
              href="/playstation-plus-games"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600/10 px-6 py-2.5 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-600/20"
            >
              PlayStation Plus with Crypto →
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Get Xbox Game Pass Ultimate with Crypto Now
            </h2>
            <p className="mb-8 text-muted-foreground">
              300+ games on Xbox & PC, cloud gaming, EA Play — all for one price. Pay with Bitcoin, Ethereum, or any of 100+ cryptocurrencies. Instant code delivery, no KYC.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/catalog?platform=Xbox&category=subscriptions"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Browse Game Pass Plans →
              </Link>
              <Link
                href="/catalog?platform=Xbox"
                className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-600/10 px-8 py-3 text-base font-semibold text-green-400 transition-colors hover:bg-green-600/20"
              >
                Xbox Games & Accounts →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
