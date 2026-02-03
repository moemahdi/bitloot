import type { Metadata, ResolvingMetadata } from 'next';

/**
 * Category Layout with Dynamic Metadata
 * 
 * Generates SEO metadata based on the category slug.
 */

interface Props {
  children: React.ReactNode;
  params: Promise<{ category: string }>;
}

const categoryDescriptions: Record<string, { title: string; description: string }> = {
  'games': {
    title: 'Video Games',
    description: 'Browse PC, PlayStation, Xbox, and Nintendo game keys. Pay with crypto and get instant delivery.',
  },
  'software': {
    title: 'Software & Apps',
    description: 'Software licenses and applications including productivity, security, and creative tools. Buy with Bitcoin or Ethereum.',
  },
  'dlc': {
    title: 'DLC & Expansions',
    description: 'Game DLC, season passes, and expansions. Enhance your gaming experience with crypto-powered purchases.',
  },
  'subscriptions': {
    title: 'Subscriptions',
    description: 'Gaming subscriptions including Game Pass, PlayStation Plus, and more. Pay with cryptocurrency.',
  },
  'gift-cards': {
    title: 'Gift Cards',
    description: 'Digital gift cards for gaming platforms and stores. Buy with crypto, send instantly.',
  },
  'pre-orders': {
    title: 'Pre-Orders',
    description: 'Pre-order upcoming game releases and get keys on launch day. Reserve with cryptocurrency.',
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
    `Browse ${displayName} on BitLoot. Pay with Bitcoin, Ethereum, and 300+ cryptocurrencies. Instant delivery.`;

  return {
    title: displayName,
    description,
    openGraph: {
      title: `${displayName} | BitLoot`,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `/catalog/${category}`,
    },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
