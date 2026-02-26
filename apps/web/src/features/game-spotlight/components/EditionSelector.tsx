'use client';

/**
 * EditionSelector Component
 *
 * Grid of product cards for selecting a specific edition/variant.
 * Uses CatalogProductCard for consistent styling across the site.
 */

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CatalogProductCard } from '@/features/catalog/components/CatalogProductCard';
import type { CatalogProduct } from '@/features/catalog/types';
import type { SpotlightProduct } from '../types';

interface EditionSelectorProps {
  products: SpotlightProduct[];
  selectedPlatform?: string;
  accentColor?: string;
  onAddToCart?: (product: SpotlightProduct) => void;
}

/**
 * Maps a SpotlightProduct to CatalogProduct for CatalogProductCard
 */
function mapToCatalogProduct(product: SpotlightProduct): CatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.title,
    description: product.subtitle ?? '',
    price: product.price,
    currency: product.currency ?? 'EUR',
    image: product.coverImageUrl,
    platform: product.platform,
    region: product.region,
    rating: product.rating,
    isAvailable: product.isPublished !== false,
  };
}

export function EditionSelector({
  products,
  selectedPlatform,
  accentColor: _accentColor = '#00D9FF',
  onAddToCart,
}: EditionSelectorProps): React.JSX.Element {
  const router = useRouter();

  // Filter products by platform
  const filteredProducts = useMemo(() => {
    if (selectedPlatform === undefined || selectedPlatform === '') {
      return products;
    }
    return products.filter((p) => p.platform === selectedPlatform);
  }, [products, selectedPlatform]);

  // Create a lookup for original products to pass to onAddToCart
  const productLookup = useMemo(() => {
    const map = new Map<string, SpotlightProduct>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Handle add to cart - looks up the original product and calls parent handler
  const handleAddToCart = useCallback(
    (productId: string) => {
      const product = productLookup.get(productId);
      if (product !== undefined && onAddToCart !== undefined) {
        onAddToCart(product);
      }
    },
    [productLookup, onAddToCart],
  );

  const handleViewProduct = useCallback(
    (productId: string) => {
      const product = productLookup.get(productId);
      if (product !== undefined) {
        router.push(`/product/${product.slug}`);
      }
    },
    [productLookup, router],
  );

  if (filteredProducts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-muted">No products available for this platform.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {filteredProducts.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <CatalogProductCard
            product={mapToCatalogProduct(product)}
            variant="default"
            viewMode="grid"
            onAddToCart={handleAddToCart}
            onViewProduct={handleViewProduct}
            showQuickActions={true}
            isPriority={index < 5}
          />
        </motion.div>
      ))}
    </div>
  );
}