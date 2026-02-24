import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Buy PlayStation Plus with Crypto — PS Plus Essential, Extra & Premium | BitLoot',
  description:
    'Buy PlayStation Plus Essential, Extra, and Premium subscriptions with Bitcoin, Ethereum, USDT and 100+ cryptocurrencies. Get PS Plus Monthly Games access instantly. No KYC.',
  keywords: [
    'playstation plus monthly games',
    'buy ps plus with bitcoin',
    'buy playstation plus crypto',
    'ps plus bitcoin',
    'ps plus ethereum',
    'playstation plus essential crypto',
    'playstation plus extra crypto',
    'playstation plus premium crypto',
    'ps plus subscription bitcoin',
    'buy ps plus cheap crypto',
    'playstation plus usdt',
    'ps plus no kyc',
    'playstation network crypto',
    'psn subscription bitcoin',
  ],
  alternates: {
    canonical: `${siteUrl}/playstation-plus-games`,
  },
  openGraph: {
    title: 'Buy PlayStation Plus with Crypto | BitLoot',
    description:
      'PS Plus Essential, Extra & Premium subscriptions — pay with Bitcoin, Ethereum or any crypto. Instant delivery, no KYC.',
    url: `${siteUrl}/playstation-plus-games`,
    siteName: 'BitLoot',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'Buy PlayStation Plus with Crypto on BitLoot' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy PlayStation Plus with Crypto | BitLoot',
    description: 'PS Plus Essential, Extra & Premium — pay with Bitcoin. Instant delivery.',
    images: [`${siteUrl}/og-image.png`],
  },
};

interface PsPlusTier {
  name: string;
  color: string;
  badge: string;
  features: string[];
  plans: { duration: string; price: string; slug: string; badge?: string }[];
}

const PS_PLUS_TIERS: PsPlusTier[] = [
  {
    name: 'Essential',
    color: 'blue',
    badge: 'Most Affordable',
    features: [
      'Monthly Games — 2–3 free games every month',
      'Online Multiplayer access',
      'Exclusive discounts in PS Store',
      'Cloud saves (100 GB)',
    ],
    plans: [
      { duration: '1 Month', price: '€10.31', slug: 'playstation-plus-essential-1-month-subscription-ac-64bd03' },
      { duration: '3 Months', price: '€27.49', slug: 'playstation-plus-essential-3-months-subscription-a-648195' },
      { duration: '6 Months', price: '€36.80', slug: 'playstation-plus-essential-6-months-subscription-a-66601f' },
      { duration: '12 Months', price: '€48.46', slug: 'playstation-plus-essential-12-months-subscription--64818e' },
    ],
  },
  {
    name: 'Extra',
    color: 'purple',
    badge: 'Most Popular',
    features: [
      'Everything in Essential',
      'Game Catalog — hundreds of PS4 & PS5 titles on demand',
      'New AAA titles added monthly',
      'Ubisoft catalog titles included',
    ],
    plans: [
      { duration: '1 Month', price: '€17.92', slug: 'playstation-plus-extra-1-month-subscription-accoun-64bd04' },
      { duration: '3 Months', price: '€31.95', slug: 'playstation-plus-extra-3-months-subscription-accou-648196' },
      { duration: '6 Months', price: '€46.29', slug: 'playstation-plus-extra-6-months-subscription-accou-6673f4' },
      { duration: '12 Months', price: '€66.79', slug: 'playstation-plus-extra-12-months-subscription-acco-648193' },
    ],
  },
  {
    name: 'Premium',
    color: 'yellow',
    badge: 'Best Value',
    features: [
      'Everything in Extra',
      'Classic Game Catalog — PS1, PS2, PSP & PS3 titles',
      'Game Trials — try full games before buying',
      'Cloud streaming on PS5, PS4, PC',
    ],
    plans: [
      { duration: '1 Month', price: '€20.16', slug: 'playstation-plus-premium-1-month-subscription-acco-64bd05' },
      { duration: '3 Months', price: '€45.07', slug: 'playstation-plus-premium-3-months-subscription-acc-648197' },
      { duration: '6 Months', price: '€46.06', slug: 'playstation-plus-premium-6-months-subscription-acc-66604c', badge: 'Best Deal' },
      { duration: '12 Months', price: '€82.75', slug: 'playstation-plus-premium-12-months-subscription-ac-648194' },
    ],
  },
];

const FAQ_ITEMS = [
  {
    question: 'What are PlayStation Plus Monthly Games?',
    answer:
      'Every month, Sony adds 2–3 free games for PS Plus Essential, Extra, and Premium members. These games are yours to play as long as your subscription is active. With Extra and Premium you also get access to a catalog of 400+ downloadable titles.',
  },
  {
    question: 'Can I buy PlayStation Plus with Bitcoin?',
    answer:
      'Yes. BitLoot accepts Bitcoin (BTC), Ethereum (ETH), USDT, Solana, and 100+ other cryptocurrencies for all PS Plus tiers — Essential, Extra, and Premium — in 1, 3, 6, or 12-month plans. No credit card required.',
  },
  {
    question: 'What is the difference between PS Plus Essential, Extra and Premium?',
    answer:
      'Essential gives you monthly free games and online multiplayer. Extra adds a catalog of 400+ downloadable PS4/PS5 games. Premium adds classic PS1/PS2/PSP/PS3 games, game trials, and cloud streaming. All tiers include online multiplayer and exclusive discounts.',
  },
  {
    question: 'How do I activate a PS Plus subscription code?',
    answer:
      'Go to PlayStation Store on your PS4/PS5 or browser, scroll to the bottom and select "Redeem Codes", enter the code from BitLoot, and your subscription activates immediately.',
  },
  {
    question: 'Is buying PS Plus with crypto anonymous?',
    answer:
      'Yes. BitLoot uses secure crypto payment processing. No card data, no bank records, no KYC required for standard purchases. Your privacy is fully protected.',
  },
  {
    question: 'Which PS Plus tier should I choose?',
    answer:
      'If you only need online multiplayer and monthly free games, Essential is the best value. If you want access to a library of 400+ games without buying each one, Extra is ideal. Premium is for players who also want classic and PS3 games plus the ability to try games before buying.',
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

const tierColorMap: Record<string, { border: string; bg: string; text: string; btn: string; badge: string }> = {
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-600/10',
    text: 'text-blue-400',
    btn: 'bg-blue-600 hover:opacity-90',
    badge: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  },
  purple: {
    border: 'border-purple-500/40',
    bg: 'bg-purple-600/10',
    text: 'text-purple-400',
    btn: 'bg-purple-600 hover:opacity-90',
    badge: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
  },
  yellow: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-600/10',
    text: 'text-yellow-400',
    btn: 'bg-yellow-600 hover:opacity-90',
    badge: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}` },
    { '@type': 'ListItem', position: 2, name: 'PlayStation', item: `${siteUrl}/buy-playstation-keys-crypto` },
    { '@type': 'ListItem', position: 3, name: 'PS Plus with Crypto', item: `${siteUrl}/playstation-plus-games` },
  ],
};

export default function PlayStationPlusGamesPage() {
  return (
    <>
      <Script
        id="faq-schema-psplus"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Script
        id="breadcrumb-schema-psplus"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-[#003087]/10 via-background to-background py-16 text-center">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#003087]/30 bg-[#003087]/10 px-4 py-1.5 text-sm text-blue-400">
              🎮 PS Plus Monthly Games · Essential, Extra & Premium · 100+ Coins
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Buy PlayStation Plus with Crypto
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
              Get access to PS Plus Monthly Games, the 400+ game catalog, and online multiplayer — 
              paid with Bitcoin, Ethereum, USDT, or any of 100+ cryptocurrencies. Instant delivery, no KYC.
            </p>
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-3 py-1">✅ Essential from €10.31/mo</span>
              <span className="rounded-full border border-border bg-card px-3 py-1">✅ Extra from €17.92/mo</span>
              <span className="rounded-full border border-border bg-card px-3 py-1">✅ Premium from €20.16/mo</span>
            </div>
            <Link
              href="/catalog?platform=PlayStation&category=subscriptions"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse All PS Plus Plans →
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
            <span>✅ All codes verified</span>
          </div>
        </section>

        {/* Why buy with crypto */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Why Buy PS Plus with Crypto?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: '🔐', title: 'No Card, No KYC', desc: 'Pay with Bitcoin or any crypto — no credit card, no bank transfer, no identity verification required.' },
              { icon: '⚡', title: 'Instant Activation', desc: 'Your PS Plus code is delivered the moment your crypto payment confirms. No waiting for approvals.' },
              { icon: '💰', title: 'Best Prices in EUR', desc: 'Competitive pricing across all tiers. Save up to 60% vs buying directly from PlayStation Store.' },
              { icon: '🌍', title: '100+ Cryptocurrencies', desc: 'BTC, ETH, USDT, LTC, SOL, XMR, BNB and hundreds more — pay with whatever you already hold.' },
              { icon: '🎮', title: 'All 3 Tiers Available', desc: 'Essential, Extra, and Premium — every tier available in 1, 3, 6, and 12-month durations.' },
              { icon: '🛡️', title: 'Verified Codes', desc: 'Every PS Plus code is sourced from authorized distributors. Works on any PS4 or PS5 worldwide.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 text-3xl">{item.icon}</div>
                <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tier cards */}
        <section className="bg-muted/30 py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
              Choose Your PS Plus Plan
            </h2>
            <p className="mb-8 text-center text-muted-foreground">
              All plans paid with Bitcoin or any cryptocurrency. Instant code delivery.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {PS_PLUS_TIERS.map((tier) => {
                const colors = tierColorMap[tier.color]!;
                return (
                  <div
                    key={tier.name}
                    className={`rounded-xl border ${colors.border} ${colors.bg} p-6 flex flex-col`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className={`text-xl font-bold ${colors.text}`}>
                        PS Plus {tier.name}
                      </h3>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                        {tier.badge}
                      </span>
                    </div>
                    <ul className="mb-6 space-y-2 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className={`mt-0.5 ${colors.text}`}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-2">
                      {tier.plans.map((plan) => (
                        <Link
                          key={plan.slug}
                          href={`/product/${plan.slug}`}
                          className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm transition-colors hover:border-border/80 hover:bg-muted/50"
                        >
                          <span className="font-medium text-foreground">{plan.duration}</span>
                          <div className="flex items-center gap-2">
                            {plan.badge !== undefined && (
                              <span className="rounded-full bg-green-600/20 px-1.5 py-0.5 text-xs font-semibold text-green-400">{plan.badge}</span>
                            )}
                            <span className={`font-bold ${colors.text}`}>{plan.price}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/catalog?category=subscriptions&platform=PlayStation"
                      className={`mt-4 block w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 ${colors.btn}`}
                    >
                      Get PS Plus {tier.name} →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            PS Plus Tier Comparison
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Feature</th>
                  <th className="px-4 py-3 text-center font-semibold text-blue-400">Essential</th>
                  <th className="px-4 py-3 text-center font-semibold text-purple-400">Extra</th>
                  <th className="px-4 py-3 text-center font-semibold text-yellow-400">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['Monthly Free Games (2–3/month)', '✅', '✅', '✅'],
                  ['Online Multiplayer', '✅', '✅', '✅'],
                  ['PS Store Discounts', '✅', '✅', '✅'],
                  ['Cloud Saves (100 GB)', '✅', '✅', '✅'],
                  ['Game Catalog (hundreds of PS4/PS5 titles)', '❌', '✅', '✅'],
                  ['Ubisoft catalog titles', '❌', '✅', '✅'],
                  ['Classic Games (PS1, PS2, PSP)', '❌', '❌', '✅'],
                  ['PS3 Games via Cloud Streaming', '❌', '❌', '✅'],
                  ['Game Trials (try before buying)', '❌', '❌', '✅'],
                  ['Starting price/month', '€10.31', '€17.92', '€20.16'],
                ].map(([feature, essential, extra, premium]) => (
                  <tr key={feature} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{feature}</td>
                    <td className="px-4 py-3 text-center text-blue-400">{essential}</td>
                    <td className="px-4 py-3 text-center text-purple-400">{extra}</td>
                    <td className="px-4 py-3 text-center text-yellow-400">{premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to Buy */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            How to Buy PS Plus with Bitcoin on BitLoot
          </h2>
          <ol className="space-y-6">
            {[
              { step: '1', title: 'Choose your tier & duration', desc: 'Pick Essential, Extra, or Premium and the duration that suits you — 1, 3, 6, or 12 months. Longer = cheaper per month.' },
              { step: '2', title: 'Add to cart', desc: 'Click your chosen PS Plus plan. No account required — enter your email at checkout to receive your receipt.' },
              { step: '3', title: 'Select your cryptocurrency', desc: 'Choose from 100+ coins: Bitcoin, Ethereum, USDT, Solana, Monero, and more. The rate is locked for 20 minutes.' },
              { step: '4', title: 'Send payment', desc: 'Transfer the exact crypto amount to the on-screen address. The payment is confirmed after 1–3 network blocks.' },
              { step: '5', title: 'Receive and activate your code', desc: 'Your PS Plus code appears instantly on the order page. Go to PlayStation Store → Redeem Codes and enter it. Your subscription starts immediately.' },
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
              PlayStation Plus FAQ
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

        {/* Cross-link: Game Pass */}
        <section className="mx-auto max-w-5xl px-4 pb-8">
          <div className="rounded-xl border border-green-500/20 bg-green-600/5 p-6 text-center">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Also on BitLoot — Xbox</p>
            <h3 className="mb-4 text-lg font-bold text-foreground">Buy Xbox Game Pass Ultimate with Crypto</h3>
            <p className="mb-4 text-sm text-muted-foreground">300+ games on Xbox & PC, cloud gaming, EA Play — pay with Bitcoin or any crypto.</p>
            <Link
              href="/xbox-game-pass-crypto"
              className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-600/10 px-6 py-2.5 text-sm font-semibold text-green-400 transition-colors hover:bg-green-600/20"
            >
              Xbox Game Pass with Crypto →
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Get PS Plus Monthly Games with Crypto Now
            </h2>
            <p className="mb-8 text-muted-foreground">
              Essential, Extra, or Premium — pick your plan and pay with Bitcoin, Ethereum, or any of 100+ cryptocurrencies. Instant delivery, no KYC.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/catalog?platform=PlayStation&category=subscriptions"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Browse All PS Plus Plans →
              </Link>
              <Link
                href="/catalog?platform=PlayStation"
                className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600/10 px-8 py-3 text-base font-semibold text-blue-400 transition-colors hover:bg-blue-600/20"
              >
                PlayStation Games & Accounts →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
