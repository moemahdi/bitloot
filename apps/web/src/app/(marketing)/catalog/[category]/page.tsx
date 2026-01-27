'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Valid business categories for BitLoot
const VALID_CATEGORIES = ['games', 'software', 'gift-cards', 'subscriptions'] as const;
type ValidCategory = (typeof VALID_CATEGORIES)[number];

// Category metadata for SEO and UI
const CATEGORY_META: Record<ValidCategory, { title: string; description: string }> = {
  games: {
    title: 'Game Keys & Accounts',
    description: 'Browse our collection of PC and console game keys from Steam, Epic, GOG, and more.',
  },
  software: {
    title: 'Software Licenses',
    description: 'Get Windows, Office, antivirus, and other software licenses at great prices.',
  },
  'gift-cards': {
    title: 'Gift Cards',
    description: 'Purchase Steam Wallet, PlayStation, Xbox, and other digital gift cards.',
  },
  subscriptions: {
    title: 'Gaming Subscriptions',
    description: 'Subscribe to Game Pass, PS Plus, EA Play, and other gaming services.',
  },
};

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

/**
 * Category Landing Page
 * 
 * Routes like /catalog/games, /catalog/software, /catalog/gift-cards, /catalog/subscriptions
 * redirect to the main catalog page with the category filter pre-applied.
 * 
 * This provides clean URLs for marketing and SEO while reusing the main catalog component.
 */
export default function CategoryPage({ params }: CategoryPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initRedirect = async () => {
      const { category } = await params;
      const normalizedCategory = category.toLowerCase();

      // Validate category
      if (!VALID_CATEGORIES.includes(normalizedCategory as ValidCategory)) {
        // Invalid category - redirect to main catalog
        router.replace('/catalog');
        return;
      }

      // Build the redirect URL with existing search params preserved
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('category', normalizedCategory);

      // Redirect to main catalog with category filter
      router.replace(`/catalog?${newParams.toString()}`);
    };

    void initRedirect();
  }, [params, router, searchParams]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
        <span className="text-text-secondary">Loading catalog...</span>
      </div>
    </div>
  );
}

// Export category metadata for use in layout/head
export { CATEGORY_META, VALID_CATEGORIES };

