'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
import { Search, Zap, Clock, Star, TrendingUp, Gamepad2, Shield } from 'lucide-react';
import type { Product } from '@/features/catalog/components/ProductCard';
import { FloatingParticles, AnimatedGridPattern } from '@/components/animations/FloatingParticles';
import { StatCard } from '@/components/StatCard';
import { LivePurchaseFeed, TrustSection } from '@/components/SocialProof';
import { PageLoadingSkeleton } from '@/components/skeletons/LoadingSkeletons';

const ProductGrid = dynamic(
  () => import('@/features/catalog/components/ProductGrid').then((mod) => mod.ProductGrid),
  {
    loading: () => <PageLoadingSkeleton rows={1} columns={4} />,
  }
);

export default function HomePage(): React.ReactElement {
  // Fetch featured products - using placeholder data for now
  const { isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      // Placeholder: Return mock featured products
      // TODO: Replace with real API call
      return Promise.resolve([]);
    },
    enabled: false,
  });

  // Mock featured products
  const featuredProducts: Product[] = [
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
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary">
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
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
              <span className="text-white">Gaming Keys.</span>
              <br />
              <span className="text-cyan-glow animate-glow-pulse">Crypto Powered.</span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-4"
            >
              Instant delivery • 300+ Crypto Accepted • Verified Keys
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

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                type="text"
                placeholder="Search for games, software, or gift cards..."
                className="pl-12 pr-4 py-6 text-base bg-bg-secondary border-border-accent hover:border-cyan-glow/50 focus:border-cyan-glow transition-colors text-white placeholder:text-text-muted"
              />
            </div>
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

      {/* Trending Products Section */}
      <section className="py-16 bg-bg-secondary">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-pink-featured" />
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Trending Now
              </h2>
            </div>
            <GlowButton variant="ghost" asChild>
              <Link href="/catalog">
                View All <span className="ml-2">→</span>
              </Link>
            </GlowButton>
          </motion.div>

          {isLoading ? (
            <PageLoadingSkeleton rows={1} columns={4} />
          ) : (
            <ProductGrid products={featuredProducts} />
          )}
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-bg-primary">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-12"
          >
            Join Thousands of Satisfied Gamers
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
      <section className="py-16 bg-bg-secondary border-t border-border-subtle">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                title: 'Instant Delivery',
                description: 'Get your keys in seconds, not hours',
              },
              {
                icon: Shield,
                title: 'Secure Payments',
                description: '256-bit encryption & blockchain security',
              },
              {
                icon: Star,
                title: 'Verified Keys',
                description: '100% authentic from trusted sources',
              },
              {
                icon: Clock,
                title: '24/7 Support',
                description: 'Always here to help you',
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-lg bg-bg-tertiary border border-border-subtle hover:border-cyan-glow/50 transition-all group"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-glow/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-8 h-8 text-cyan-glow" />
                </div>
                <h3 className="text-xl font-display font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-text-secondary text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
