'use client';

import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingCart, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import {
  Configuration,
  WatchlistApi,
  type WatchlistItemResponseDto,
} from '@bitloot/sdk';

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts[1];
    if (cookieValue !== undefined) {
      return cookieValue.split(';')[0] ?? null;
    }
  }
  return null;
}

// Helper to check if user is authenticated
function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = getCookie('accessToken');
  return token !== null && token !== '';
}

// Create API client with auth token
function createWatchlistApi(): WatchlistApi {
  const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: (): string => {
      if (typeof window !== 'undefined') {
        return getCookie('accessToken') ?? '';
      }
      return '';
    },
  });
  return new WatchlistApi(config);
}

export function WatchlistPreview() {
  const { addItem } = useCart();
  
  // Fetch real watchlist data
  const { data: watchlistData, isLoading } = useQuery({
    queryKey: ['watchlist-preview'],
    queryFn: async () => {
      const api = createWatchlistApi();
      return api.watchlistControllerGetWatchlist({ page: 1, limit: 3 });
    },
    staleTime: 30_000,
    enabled: isAuthenticated(),
  });

  const watchlistItems = watchlistData?.data ?? [];
  const totalItems = watchlistData?.total ?? 0;

  const handleAddToCart = (item: WatchlistItemResponseDto) => {
    addItem({
      productId: item.product.id,
      title: item.product.title,
      price: item.product.price,
      quantity: 1,
      image: item.product.coverImageUrl ?? undefined,
    });
    toast.success(`${item.product.title} added to cart`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary/20">
            <div className="w-12 h-12 bg-bg-tertiary/50 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-bg-tertiary/50 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-bg-tertiary/50 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (watchlistItems.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="mb-3 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-neon/5 border border-purple-neon/20">
            <Heart className="h-6 w-6 text-purple-neon/50" />
          </div>
        </div>
        <p className="text-sm font-medium text-text-secondary mb-1">Your watchlist is empty</p>
        <p className="text-xs text-text-muted mb-4">
          Save games you&apos;re interested in to track prices
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          asChild 
          className="border-purple-neon/30 text-purple-neon hover:bg-purple-neon/10"
        >
          <Link href="/">
            <Plus className="h-3.5 w-3.5 mr-2" />
            Browse Games
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {watchlistItems.map((item) => (
        <div
          key={item.id}
          className="group flex items-center gap-3 p-2 rounded-lg border border-border/30 bg-bg-tertiary/10 hover:bg-bg-tertiary/30 hover:border-purple-neon/30 transition-all"
        >
          {/* Product Image */}
          <Link 
            href={`/product/${item.product.slug}`}
            className="relative w-12 h-12 rounded-md overflow-hidden bg-bg-tertiary/50 flex-shrink-0"
          >
            {item.product.coverImageUrl !== undefined && item.product.coverImageUrl !== null && item.product.coverImageUrl !== '' ? (
              <Image
                src={item.product.coverImageUrl}
                alt={item.product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-text-muted" />
              </div>
            )}
          </Link>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <Link 
              href={`/product/${item.product.slug}`}
              className="block text-sm font-medium text-text-primary truncate group-hover:text-purple-neon transition-colors"
            >
              {item.product.title}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-cyan-glow">
                €{item.product.price.toFixed(2)}
              </span>
              {item.product.platform !== undefined && item.product.platform !== null && item.product.platform !== '' && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/50 text-text-muted">
                  {item.product.platform}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Add to Cart Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-cyan-glow hover:bg-cyan-glow/10 hover:text-cyan-glow flex-shrink-0"
            onClick={() => handleAddToCart(item)}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      {totalItems > 3 && (
        <Link
          href="/profile?tab=watchlist"
          className="flex items-center justify-center gap-1.5 text-xs text-purple-neon hover:text-purple-neon/80 py-2 transition-colors"
        >
          View all {totalItems} items
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
