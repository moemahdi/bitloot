'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Search, Zap, Shield, Lock, Coins, Loader2 } from 'lucide-react';
import type { Product } from '@/features/catalog/components/ProductCard';

const ProductGrid = dynamic(
  () => import('@/features/catalog/components/ProductGrid').then((mod) => mod.ProductGrid),
  {
    loading: () => (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[300px] rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    ),
  }
);

export default function HomePage(): React.ReactElement {
  // Initialize SDK client config (for future use with real API)
  // const apiConfig = new Configuration({
  //   basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  // });

  // Fetch featured products - using placeholder data for now
  // In production, replace with API call once catalog list endpoint is available
  const { isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      // Placeholder: Return mock featured products
      // TODO: Replace with real API call: const result = await catalogClient.catalogControllerList(...)
      return Promise.resolve([]);
    },
    enabled: false, // Disabled for now - using mock data
  });

  // Map ProductResponseDto to Product interface expected by ProductCard
  // Using mock data until API endpoint is available
  const featuredProducts: Product[] = [
    {
      id: '1',
      name: 'Featured Game 1',
      description: 'Popular game with instant delivery',
      price: '19.99',
      image: '/placeholder-product.jpg',
      platform: 'Steam',
      currency: 'USD',
      discount: 0,
    },
    {
      id: '2',
      name: 'Featured Game 2',
      description: 'Bestselling digital product',
      price: '29.99',
      image: '/placeholder-product.jpg',
      platform: 'Epic',
      currency: 'USD',
      discount: 0,
    },
    {
      id: '3',
      name: 'Featured Game 3',
      description: 'Top rated software',
      price: '39.99',
      image: '/placeholder-product.jpg',
      platform: 'Origin',
      currency: 'USD',
      discount: 0,
    },
    {
      id: '4',
      name: 'Featured Game 4',
      description: 'Limited time offer',
      price: '49.99',
      image: '/placeholder-product.jpg',
      platform: 'Uplay',
      currency: 'USD',
      discount: 15,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-primary/10 to-background py-20 md:py-32 w-full">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl">
              Buy Digital Keys with <span className="text-primary">Cryptocurrency</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Instant delivery. Secure. Anonymous. Access thousands of games and software licenses using Bitcoin, Ethereum, and more.
            </p>

            <div className="w-full max-w-md space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  className="pl-10 h-12 text-lg bg-background/80 backdrop-blur-sm border-primary/20 focus-visible:ring-primary"
                  placeholder="Search games, software..."
                />
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/catalog">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Browse Catalog
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    How it Works
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24 bg-muted/30 w-full">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
            <Link href="/catalog">
              <Button variant="ghost" className="gap-2">
                View All <span aria-hidden="true">&rarr;</span>
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <ProductGrid products={featuredProducts} />
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 w-full">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card border shadow-sm transition-all hover:shadow-md">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Instant Delivery</h3>
              <p className="text-muted-foreground">
                Get your digital keys seconds after your payment is confirmed on the blockchain.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card border shadow-sm transition-all hover:shadow-md">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Secure & Safe</h3>
              <p className="text-muted-foreground">
                We use enterprise-grade encryption and never store your keys in plaintext.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card border shadow-sm transition-all hover:shadow-md">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Coins className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Low Prices</h3>
              <p className="text-muted-foreground">
                Save money by paying with crypto. No chargebacks means lower fees for everyone.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card border shadow-sm transition-all hover:shadow-md">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Lock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Anonymous</h3>
              <p className="text-muted-foreground">
                No account required for guest checkout. We respect your privacy and data.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
