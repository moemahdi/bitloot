'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
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
} from 'lucide-react';
import type { Product } from '@/features/catalog/components/ProductCard';
import { FloatingParticles, AnimatedGridPattern } from '@/components/animations/FloatingParticles';
import { StatCard } from '@/components/StatCard';
import { LivePurchaseFeed, TrustSection } from '@/components/SocialProof';
import { PageLoadingSkeleton } from '@/components/skeletons/LoadingSkeletons';
import { cn } from '@/design-system/utils/utils';

const ProductGrid = dynamic(
  () => import('@/features/catalog/components/ProductGrid').then((mod) => mod.ProductGrid),
  {
    loading: () => <PageLoadingSkeleton rows={1} columns={4} />,
  }
);

// Category tabs configuration
const CATEGORY_TABS = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'best-sellers', label: 'Best Sellers', icon: Award },
  { id: 'new', label: 'New', icon: Sparkles },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'software', label: 'Software', icon: MonitorPlay },
  { id: 'gift-cards', label: 'Gift Cards', icon: Gift },
  { id: 'social', label: 'Social Media', icon: UserCircle },
  { id: 'premium', label: 'Premium', icon: Crown }  
] as const;

type CategoryId = (typeof CATEGORY_TABS)[number]['id'];

export default function HomePage(): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('trending');

  // Fetch featured products - using placeholder data for now
  const { isLoading } = useQuery({
    queryKey: ['featured-products', activeCategory],
    queryFn: async () => {
      // Placeholder: Return mock featured products
      // TODO: Replace with real API call based on activeCategory
      return Promise.resolve([]);
    },
    enabled: false,
  });

  // Mock products data by category
  const productsByCategory: Record<CategoryId, Product[]> = {
    trending: [
      {
        id: '1',
        name: 'Cyberpunk 2077',
        description: 'Open-world action-adventure set in Night City',
        price: '29.99',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 15,
      },
      {
        id: '2',
        name: 'Elden Ring',
        description: 'Action RPG in vast fantastical world',
        price: '49.99',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 0,
      },
      {
        id: '3',
        name: 'Red Dead Redemption 2',
        description: 'Epic tale of life in America at the dawn of the modern age',
        price: '39.99',
        image: '/placeholder-product.jpg',
        platform: 'Epic Games',
        currency: 'USD',
        discount: 25,
      },
      {
        id: '4',
        name: 'Hogwarts Legacy',
        description: 'Immersive open-world action RPG set in wizarding world',
        price: '59.99',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 0,
      },
    ],
    'best-sellers': [
      {
        id: '5',
        name: 'GTA V Premium Edition',
        description: 'Experience the blockbuster Grand Theft Auto V',
        price: '19.99',
        image: '/placeholder-product.jpg',
        platform: 'Rockstar',
        currency: 'USD',
        discount: 40,
      },
      {
        id: '6',
        name: 'Minecraft Java Edition',
        description: 'Build, explore, and survive in infinite worlds',
        price: '26.95',
        image: '/placeholder-product.jpg',
        platform: 'Mojang',
        currency: 'USD',
        discount: 0,
      },
      {
        id: '7',
        name: 'FIFA 24',
        description: 'The world game with HyperMotion technology',
        price: '69.99',
        image: '/placeholder-product.jpg',
        platform: 'EA',
        currency: 'USD',
        discount: 10,
      },
      {
        id: '8',
        name: 'Call of Duty: MW3',
        description: 'The ultimate warfare experience',
        price: '69.99',
        image: '/placeholder-product.jpg',
        platform: 'Battle.net',
        currency: 'USD',
        discount: 0,
      },
    ],
    new: [
      {
        id: '9',
        name: 'Black Myth: Wukong',
        description: 'Action RPG rooted in Chinese mythology',
        price: '59.99',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 0,
      },
      {
        id: '10',
        name: 'S.T.A.L.K.E.R. 2',
        description: 'Survive the Exclusion Zone',
        price: '59.99',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 0,
      },
      {
        id: '11',
        name: 'Dragon Age: The Veilguard',
        description: 'Epic dark fantasy RPG',
        price: '69.99',
        image: '/placeholder-product.jpg',
        platform: 'EA',
        currency: 'USD',
        discount: 5,
      },
      {
        id: '12',
        name: 'Indiana Jones',
        description: 'The Great Circle adventure awaits',
        price: '69.99',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 0,
      },
    ],
    games: [
      {
        id: '13',
        name: 'Baldurs Gate 3',
        description: 'Legendary RPG set in the Forgotten Realms',
        price: '59.99',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 0,
      },
      {
        id: '14',
        name: 'Starfield',
        description: 'Explore the cosmos in Bethesdas epic',
        price: '69.99',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 30,
      },
      {
        id: '15',
        name: 'The Witcher 3: Wild Hunt',
        description: 'Award-winning open world adventure',
        price: '29.99',
        image: '/placeholder-product.jpg',
        platform: 'GOG',
        currency: 'USD',
        discount: 50,
      },
      {
        id: '16',
        name: 'Diablo IV',
        description: 'Endless demon slaying action',
        price: '69.99',
        image: '/placeholder-product.jpg',
        platform: 'Battle.net',
        currency: 'USD',
        discount: 20,
      },
    ],
    software: [
      {
        id: '17',
        name: 'Windows 11 Pro',
        description: 'Latest Windows operating system',
        price: '199.99',
        image: '/placeholder-product.jpg',
        platform: 'Microsoft',
        currency: 'USD',
        discount: 60,
      },
      {
        id: '18',
        name: 'Microsoft Office 365',
        description: 'Complete productivity suite',
        price: '99.99',
        image: '/placeholder-product.jpg',
        platform: 'Microsoft',
        currency: 'USD',
        discount: 25,
      },
      {
        id: '19',
        name: 'Adobe Creative Cloud',
        description: 'All Adobe apps in one subscription',
        price: '54.99',
        image: '/placeholder-product.jpg',
        platform: 'Adobe',
        currency: 'USD',
        discount: 0,
      },
      {
        id: '20',
        name: 'Norton 360 Deluxe',
        description: 'Complete device security',
        price: '49.99',
        image: '/placeholder-product.jpg',
        platform: 'Norton',
        currency: 'USD',
        discount: 40,
      },
    ],
    'gift-cards': [
      {
        id: '21',
        name: 'Steam Wallet $50',
        description: 'Add funds to your Steam account',
        price: '50.00',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 0,
      },
      {
        id: '22',
        name: 'PlayStation Store $100',
        description: 'PSN credit for games and more',
        price: '100.00',
        image: '/placeholder-product.jpg',
        platform: 'PlayStation',
        currency: 'USD',
        discount: 0,
      },
      {
        id: '23',
        name: 'Xbox Game Pass Ultimate',
        description: '3 months of unlimited gaming',
        price: '44.99',
        image: '/placeholder-product.jpg',
        platform: 'Xbox',
        currency: 'USD',
        discount: 10,
      },
      {
        id: '24',
        name: 'Nintendo eShop $50',
        description: 'Credit for Nintendo Switch games',
        price: '50.00',
        image: '/placeholder-product.jpg',
        platform: 'Nintendo',
        currency: 'USD',
        discount: 0,
      },
    ],
    premium: [
      {
        id: '29',
        name: 'Collectors Edition Bundle',
        description: 'Exclusive AAA game + DLC + Season Pass',
        price: '149.99',
        image: '/placeholder-product.jpg',
        platform: 'Steam',
        currency: 'USD',
        discount: 0,
      },
      {
        id: '30',
        name: 'Ultimate Gaming Package',
        description: 'Top 5 games of 2024 mega bundle',
        price: '299.99',
        image: '/placeholder-product.jpg',
        platform: 'Multi-Platform',
        currency: 'USD',
        discount: 35,
      },
      {
        id: '31',
        name: 'Lifetime VPN Premium',
        description: 'Unlimited secure browsing forever',
        price: '199.99',
        image: '/placeholder-product.jpg',
        platform: 'NordVPN',
        currency: 'USD',
        discount: 50,
      },
      {
        id: '32',
        name: 'Creative Suite Lifetime',
        description: 'Professional design tools bundle',
        price: '499.99',
        image: '/placeholder-product.jpg',
        platform: 'Adobe',
        currency: 'USD',
        discount: 40,
      },
    ],
    social: [
      {
        id: '25',
        name: 'Netflix Premium 1 Year',
        description: '4K streaming subscription',
        price: '199.99',
        image: '/placeholder-product.jpg',
        platform: 'Netflix',
        currency: 'USD',
        discount: 15,
      },
      {
        id: '26',
        name: 'Spotify Premium 1 Year',
        description: 'Ad-free music streaming',
        price: '99.99',
        image: '/placeholder-product.jpg',
        platform: 'Spotify',
        currency: 'USD',
        discount: 20,
      },
      {
        id: '27',
        name: 'Disney+ Bundle 1 Year',
        description: 'Disney+, Hulu, and ESPN+',
        price: '139.99',
        image: '/placeholder-product.jpg',
        platform: 'Disney',
        currency: 'USD',
        discount: 10,
      },
      {
        id: '28',
        name: 'YouTube Premium 1 Year',
        description: 'Ad-free videos and music',
        price: '119.99',
        image: '/placeholder-product.jpg',
        platform: 'Google',
        currency: 'USD',
        discount: 0,
      },
    ],
  };

  const currentProducts = productsByCategory[activeCategory];

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
              {CATEGORY_TABS.map((tab) => {
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
                  </button>
                );
              })}
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
