import type { Metadata, ResolvingMetadata } from 'next';

/**
 * Category Layout — Dynamic SEO Metadata
 *
 * Generates keyword-optimized metadata per category slug.
 * Absolute canonicals prevent duplicate content penalties.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitloot.io';

interface Props {
  children: React.ReactNode;
  params: Promise<{ category: string }>;
}

interface CategoryMeta {
  title: string;
  description: string;
  keywords: string[];
}

const categoryDescriptions: Record<string, CategoryMeta> = {
  'games': {
    title: 'Video Game Keys',
    description: 'Buy PC, PlayStation, Xbox and Nintendo game keys with crypto. Thousands of titles at the best prices. Pay with Bitcoin, Ethereum, USDT and instant delivery.',
    keywords: ['buy game keys crypto', 'pc game keys bitcoin', 'video game keys crypto', 'steam keys bitcoin', 'cheap video games crypto'],
  },
  'steam': {
    title: 'Steam Game Keys',
    description: 'Buy cheap Steam game keys with Bitcoin, Ethereum and USDT. Instant delivery to your Steam library. Best prices on 1,000+ Steam titles.',
    keywords: ['buy steam keys bitcoin', 'cheap steam keys', 'steam keys with crypto', 'buy steam games bitcoin', 'steam key ethereum'],
  },
  'playstation': {
    title: 'PlayStation Keys & PSN Codes',
    description: 'Buy PlayStation 5 and PS4 game keys with crypto. PSN codes, PS Plus, and game keys delivered instantly. Pay with Bitcoin or Ethereum.',
    keywords: ['buy psn codes crypto', 'playstation keys bitcoin', 'ps5 game keys crypto', 'ps plus bitcoin', 'psn code ethereum'],
  },
  'xbox': {
    title: 'Xbox Game Keys',
    description: 'Buy Xbox Series X/S and Xbox One game keys with crypto. Xbox Game Pass, digital games, and codes. Pay with Bitcoin, Ethereum, USDT.',
    keywords: ['buy xbox keys crypto', 'xbox game pass bitcoin', 'xbox series x keys crypto', 'xbox game keys ethereum'],
  },
  'nintendo': {
    title: 'Nintendo Switch Game Keys',
    description: 'Buy Nintendo Switch game keys and eShop codes with crypto. Instant delivery. Pay with Bitcoin, Ethereum and 100+ cryptocurrencies.',
    keywords: ['buy nintendo switch keys crypto', 'nintendo eshop codes bitcoin', 'switch game keys ethereum'],
  },
  'software': {
    title: 'Software & App Licenses',
    description: 'Buy software licenses, productivity tools, security suites and creative apps with crypto. Instant digital delivery. Pay with Bitcoin or Ethereum.',
    keywords: ['buy software crypto', 'software license bitcoin', 'antivirus keys crypto', 'windows keys bitcoin', 'office keys crypto'],
  },
  'dlc': {
    title: 'DLC & Game Expansions',
    description: 'Buy game DLC, season passes and expansions with crypto. Enhance your gaming experience. Pay with Bitcoin, Ethereum, USDT.',
    keywords: ['buy dlc crypto', 'game expansion bitcoin', 'season pass crypto', 'dlc keys ethereum'],
  },
  'subscriptions': {
    title: 'Gaming Subscriptions',
    description: 'Buy Game Pass Ultimate, PlayStation Plus, EA Play and more subscriptions with crypto. Instant activation, no recurring billing.',
    keywords: ['game pass bitcoin', 'ps plus crypto', 'gaming subscription bitcoin', 'ea play crypto', 'gaming sub ethereum'],
  },
  'gift-cards': {
    title: 'Gaming Gift Cards',
    description: 'Buy Steam, PlayStation, Xbox and Nintendo gift cards with crypto. Instant delivery. Perfect gift for any gamer. Pay with Bitcoin.',
    keywords: ['steam gift card bitcoin', 'gaming gift cards crypto', 'playstation gift card bitcoin', 'xbox gift card crypto'],
  },
  'pre-orders': {
    title: 'Pre-Order Game Keys',
    description: 'Pre-order upcoming game releases and get your key on launch day. Reserve with Bitcoin, Ethereum or USDT. Best crypto gaming pre-orders.',
    keywords: ['pre-order game keys crypto', 'upcoming games bitcoin', 'pre-order bitcoin', 'new game keys crypto'],
  },
};

function formatCategoryName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = categoryDescriptions[category];
  const displayName = categoryInfo?.title ?? formatCategoryName(category);
  const description = categoryInfo?.description ??
    `Browse ${displayName} on BitLoot. Pay with Bitcoin, Ethereum, and 100+ cryptocurrencies. Instant delivery guaranteed.`;
  const keywords = categoryInfo?.keywords ?? [
    `${displayName.toLowerCase()} crypto`,
    `${displayName.toLowerCase()} bitcoin`,
    `buy ${displayName.toLowerCase()} with crypto`,
    'crypto gaming',
    'instant delivery',
  ];

  return {
    title: `${displayName} — Buy with Crypto | Instant Delivery`,
    description,
    keywords,
    alternates: {
      canonical: `${siteUrl}/catalog/${category}`,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `${siteUrl}/catalog/${category}`,
      siteName: 'BitLoot',
      title: `${displayName} | BitLoot — Buy with Crypto`,
      description,
      images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: `BitLoot ${displayName}`, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@bitloot',
      title: `${displayName} | BitLoot`,
      description: `Buy ${displayName.toLowerCase()} with Bitcoin, Ethereum, USDT. Instant delivery.`,
    },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
