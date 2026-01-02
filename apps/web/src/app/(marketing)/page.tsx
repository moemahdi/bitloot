'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { catalogClient, type FeaturedCategoryDto, type CategoryDto } from '@bitloot/sdk';
import { useCatalogCategories } from '@/hooks/useCatalog';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
import { Skeleton } from '@/design-system/primitives/skeleton';
import {
  Search,
  Zap,
  Clock,
  Star,
  TrendingUp,
  Gamepad2,
  Shield,
  Bitcoin,
  CheckCircle2,
  Flame,
  Sparkles,
  MonitorPlay,
  Gift,
  UserCircle,
  Award,
  Crown,
  Music,
  Film,
  BookOpen,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { FloatingParticles, AnimatedGridPattern } from '@/components/animations/FloatingParticles';
import { StatCard } from '@/components/StatCard';
import { LivePurchaseFeed, TrustSection } from '@/components/SocialProof';
import { PageLoadingSkeleton } from '@/components/skeletons/LoadingSkeletons';
import { cn } from '@/design-system/utils/utils';
import { HomepageReviews } from '@/features/reviews';

// Icon mapping for dynamic categories (from genre/category names)
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Featured/virtual categories
  trending: TrendingUp,
  'best-sellers': Award,
  new: Sparkles,
  premium: Crown,
  // Platforms
  steam: Gamepad2,
  epic: Gamepad2,
  uplay: Gamepad2,
  origin: Gamepad2,
  playstation: Gamepad2,
  xbox: Gamepad2,
  nintendo: Gamepad2,
  // Categories/Genres
  games: Gamepad2,
  software: MonitorPlay,
  'gift-cards': Gift,
  'social-media': UserCircle,
  action: Flame,
  adventure: Star,
  rpg: Shield,
  sports: TrendingUp,
  racing: Zap,
  simulation: MonitorPlay,
  strategy: CheckCircle2,
  music: Music,
  movies: Film,
  education: BookOpen,
  // Fallback
  default: Package,
};

// Helper to get icon for a category
function getCategoryIcon(slug: string): LucideIcon {
  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-');
  return CATEGORY_ICONS[normalizedSlug] ?? Package;
}

const ProductGrid = dynamic(
  () => import('@/features/catalog/components/ProductGrid').then((mod) => mod.ProductGrid),
  {
    loading: () => <PageLoadingSkeleton rows={1} columns={4} />,
  }
);

// Tab item interface for both featured and category tabs
interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category?: string;
  platform?: string;
  sort?: string;
  count?: number;
}

export default function HomePage(): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<string>('trending');

  // Fetch dynamic categories from API
  const { data: categoriesData, isLoading: isCategoriesLoading } = useCatalogCategories();

  // Build tabs from dynamic categories + featured collections
  const categoryTabs = useMemo<TabItem[]>(() => {
    if (categoriesData === null || categoriesData === undefined) {
      // Return minimal fallback tabs while loading
      return [
        { id: 'trending', label: 'Trending', icon: TrendingUp, sort: 'trending' },
        { id: 'new', label: 'New', icon: Sparkles, sort: 'newest' },
      ];
    }

    const tabs: TabItem[] = [];

    // First add featured/virtual categories from API
    categoriesData.featured.forEach((featured: FeaturedCategoryDto) => {
      tabs.push({
        id: featured.id,
        label: featured.label,
        icon: getCategoryIcon(featured.id),
        sort: featured.sort ?? undefined,
      });
    });

    // Then add top real categories (limit to 6 to not overflow)
    const topCategories = categoriesData.categories.slice(0, 6);
    topCategories.forEach((cat: CategoryDto) => {
      // Use platform filter for platform-type categories, category filter for genres
      // Use cat.label for the filter value (matches actual product data), cat.id for tab identification
      const isPlatform = cat.type === 'platform';
      tabs.push({
        id: cat.id,
        label: cat.label,
        icon: getCategoryIcon(cat.id),
        ...(isPlatform ? { platform: cat.label } : { category: cat.label }),
        count: cat.count,
      });
    });

    return tabs;
  }, [categoriesData]);

  // Get selected tab info
  const selectedTab = categoryTabs.find((tab) => tab.id === activeCategory) ?? categoryTabs[0];
  
  // Map sort values from CATEGORY_TABS to SDK enum
  const getSdkSort = (sort?: string): 'newest' | 'price_asc' | 'price_desc' | 'rating' | undefined => {
    switch (sort) {
      case 'trending':
        return 'newest';
      case 'sales':
        return 'price_desc';
      case 'newest':
        return 'newest';
      default:
        return undefined;
    }
  };

  const { data: products = [], isLoading } = useQuery({
    // Include both category and platform in queryKey for proper cache invalidation
    queryKey: ['featured-products', activeCategory, selectedTab?.category, selectedTab?.platform, selectedTab?.sort],
    queryFn: async () => {
      try {
        const response = await catalogClient.findAll({
          category: selectedTab?.category,
          platform: selectedTab?.platform,
          limit: 12,
          sort: getSdkSort(selectedTab?.sort),
        });
        // Transform SDK response to Product interface
        return (response.data ?? []).map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.title, // SDK uses 'title', interface uses 'name'
          description: product.description ?? '',
          price: product.price,
          currency: 'USDT', // Default currency
          image: product.imageUrl,
          platform: product.platform,
          discount: 0,
          stock: 1,
          isAvailable: true,
        }));
      } catch (err) {
        console.error('Failed to fetch products:', err);
        return [];
      }
    },
    enabled: selectedTab !== null && selectedTab !== undefined, // Only run when we have a selected tab
  });

  // Use real product data from SDK query
  const currentProducts = products;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Skip Link for Accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      {/* Hero Section */}
      <section
        id="main-content"
        className="relative min-h-[85vh] overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Animated Background with Radial Glow Accents */}
        <div className="absolute inset-0 bg-gradient-dark">
          {/* Radial gradient spotlights for depth */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-radial-cyan opacity-40 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-radial-purple opacity-30 blur-3xl pointer-events-none" />
          <AnimatedGridPattern />
          <FloatingParticles count={40} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 md:py-28">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1
              id="hero-heading"
              className="text-5xl md:text-7xl font-display font-bold mb-6"
            >
              <span className="text-white drop-shadow-lg">Gaming Keys.</span>
              <br />
              <span className="text-gradient-primary animate-glow-pulse text-glow-cyan">
                Crypto Powered.
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-4"
            >
              <span className="inline-flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-success" aria-hidden="true" />
                Instant delivery
              </span>
              <span className="mx-3 text-border-accent">•</span>
              <span className="inline-flex items-center gap-2">
                <Bitcoin className="w-5 h-5 text-orange-warning" aria-hidden="true" />
                300+ Crypto
              </span>
              <span className="mx-3 text-border-accent">•</span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent-success" aria-hidden="true" />
                Verified Keys
              </span>
            </motion.p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12"
          >
            <StatCard icon={Zap} value="50,000+" label="Keys Delivered" />
            <StatCard icon={Clock} value="<30s" label="Avg Delivery" />
            <StatCard icon={Star} value="4.8/5" label="Rating" />
          </motion.div>

          {/* Search Bar with Glass Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <form
              role="search"
              aria-label="Search products"
              className="relative group"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="absolute inset-0 bg-radial-cyan opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-300 pointer-events-none rounded-xl" />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-cyan-glow transition-colors"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search for games, software, or gift cards..."
                aria-label="Search for games, software, or gift cards"
                className="glass pl-12 pr-4 py-6 text-base border-border-accent hover:border-cyan-glow/50 focus:border-cyan-glow focus:shadow-glow-cyan transition-all duration-300 text-white placeholder:text-text-muted w-full rounded-xl"
              />
            </form>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <GlowButton size="xl" asChild>
              <Link href="/catalog">
                <Gamepad2 className="mr-2 h-5 w-5" />
                Browse Catalog
              </Link>
            </GlowButton>
            <GlowButton size="xl" variant="outline" asChild>
              <Link href="/how-it-works">
                <Shield className="mr-2 h-5 w-5" />
                How It Works
              </Link>
            </GlowButton>
          </motion.div>
        </div>
      </section>

      {/* Products Section with Category Tabs */}
      <section
        className="py-16 bg-bg-secondary relative overflow-hidden"
        aria-labelledby="products-heading"
      >
        {/* Subtle ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-radial-purple opacity-20 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-glow/10 glow-cyan">
                <Flame className="w-7 h-7 text-cyan-glow" aria-hidden="true" />
              </div>
              <h2
                id="products-heading"
                className="text-3xl md:text-4xl font-display font-bold text-white"
              >
                Featured Products
              </h2>
            </div>
            <GlowButton variant="ghost" asChild>
              <Link href="/catalog" className="group">
                View All
                <span
                  className="ml-2 inline-block group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </GlowButton>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <nav
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent"
              role="tablist"
              aria-label="Product categories"
            >
              {isCategoriesLoading ? (
                // Loading skeleton for tabs
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-10 w-28 rounded-xl shrink-0" />
                  ))}
                </>
              ) : (
                categoryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeCategory === tab.id;

                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`tabpanel-${tab.id}`}
                      onClick={() => setActiveCategory(tab.id)}
                      className={cn(
                        'flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary',
                        isActive
                          ? 'bg-cyan-glow/15 text-cyan-glow border border-cyan-glow/30 shadow-[0_0_20px_rgba(0,217,255,0.2)]'
                          : 'glass text-text-muted border border-border-subtle hover:border-cyan-glow/30 hover:text-text-primary hover:bg-bg-tertiary/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="whitespace-nowrap">{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full',
                          isActive ? 'bg-cyan-glow/20 text-cyan-glow' : 'bg-border-subtle text-text-muted'
                        )}>
                          {tab.count > 999 ? '999+' : tab.count}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </nav>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            role="tabpanel"
            id={`tabpanel-${activeCategory}`}
            aria-labelledby={activeCategory}
          >
            {isLoading ? (
              <PageLoadingSkeleton rows={1} columns={4} />
            ) : (
              <ProductGrid products={currentProducts} />
            )}
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section
        className="py-16 bg-bg-primary relative"
        aria-labelledby="social-proof-heading"
      >
        {/* Decorative gradient orb */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-radial-cyan opacity-10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.h2
            id="social-proof-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-12"
          >
            Join{' '}
            <span className="text-gradient-primary">Thousands</span> of Satisfied
            Gamers
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <LivePurchaseFeed />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <TrustSection />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section
        className="py-16 bg-bg-primary relative overflow-hidden"
        aria-labelledby="reviews-heading"
      >
        {/* Decorative gradient orb */}
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-radial-purple opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-radial-cyan opacity-10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <HomepageReviews
              limit={6}
              title="What Our Customers Say"
              description="Join thousands of satisfied gamers who trust BitLoot for their gaming needs"
            />
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        className="py-16 bg-bg-secondary border-t border-border-subtle relative overflow-hidden"
        aria-labelledby="benefits-heading"
      >
        {/* Ambient glow effects */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-radial-cyan opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[250px] bg-radial-purple opacity-10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <h2 id="benefits-heading" className="sr-only">
            Why Choose BitLoot
          </h2>
          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                title: 'Instant Delivery',
                description: 'Get your keys in seconds, not hours',
                iconBg: 'bg-cyan-glow/10',
                iconColor: 'text-cyan-glow',
                glowClass: 'group-hover:glow-cyan',
              },
              {
                icon: Shield,
                title: 'Secure Payments',
                description: '256-bit encryption & blockchain security',
                iconBg: 'bg-accent-success/10',
                iconColor: 'text-accent-success',
                glowClass: 'group-hover:glow-success',
              },
              {
                icon: Star,
                title: 'Verified Keys',
                description: '100% authentic from trusted sources',
                iconBg: 'bg-orange-warning/10',
                iconColor: 'text-orange-warning',
                glowClass: 'group-hover:glow-purple',
              },
              {
                icon: Clock,
                title: '24/7 Support',
                description: 'Always here to help you',
                iconBg: 'bg-purple-neon/10',
                iconColor: 'text-purple-neon',
                glowClass: 'group-hover:glow-purple',
              },
            ].map((benefit, index) => (
              <motion.article
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass text-center p-6 rounded-xl border border-border-subtle card-hover-glow group focus-within:ring-2 focus-within:ring-cyan-glow/50"
              >
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-xl ${benefit.iconBg} flex items-center justify-center group-hover:scale-110 ${benefit.glowClass} transition-all duration-300`}
                  aria-hidden="true"
                >
                  <benefit.icon className={`w-8 h-8 ${benefit.iconColor}`} />
                </div>
                <h3 className="text-xl font-display font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
