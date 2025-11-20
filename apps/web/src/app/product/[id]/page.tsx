'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi, Configuration } from '@bitloot/sdk';
import type { ProductResponseDto } from '@bitloot/sdk';
import Image from 'next/image';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Bitcoin, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AddToCartButton } from '@/features/product/components/AddToCartButton';

export default function ProductPage(): React.ReactElement {
  const params = useParams();
  const id = params.id as string;

  // Initialize SDK client
  const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  });
  const catalogClient = new CatalogApi(apiConfig);

  const { data: product, isLoading, isError } = useQuery<ProductResponseDto>({
    queryKey: ['product', id],
    queryFn: () => catalogClient.catalogControllerGetProduct({ slug: id }),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="container flex h-[60vh] items-center justify-center py-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || product === undefined) {
    return (
      <div className="container flex h-[60vh] items-center justify-center py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Product Not Found</h1>
          <p className="mt-2 text-muted-foreground">The product you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  // Calculate price in dollars (priceMinor is in cents)
  const priceInDollars = (product?.priceMinor ?? 0) / 100;

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Section */}
        <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg bg-muted lg:aspect-square">
          <Image
            src={product.imageUrl ?? '/placeholder-product.jpg'}
            alt={product.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Details Section */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline">{product.platform ?? 'Platform'}</Badge>
              <Badge variant="outline">{product.region ?? 'Global'}</Badge>
              <Badge variant="outline">{product.category ?? 'Category'}</Badge>
            </div>
            <h1 className="text-4xl font-bold">{product?.title}</h1>
            {product?.subtitle !== null && product?.subtitle !== undefined ? (
              <p className="mt-2 text-xl text-muted-foreground">{product.subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-primary">${priceInDollars.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">{product?.currency ?? 'USD'}</span>
          </div>

          <div className="flex flex-col gap-3">
                        <Link href={`/checkout/${product.id}`} className="w-full">
              <Button size="lg" className="w-full gap-2 text-lg">
                <Bitcoin className="h-5 w-5" />
                Buy Now with Crypto
              </Button>
            </Link>
            <AddToCartButton
              id={product?.id ?? ''}
              title={product?.title ?? 'Product'}
              price={priceInDollars}
              image={product?.imageUrl}
            />
          </div>

          <Card>
            <CardContent className="grid gap-4 p-6">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Instant Delivery</p>
                  <p className="text-sm text-muted-foreground">Key delivered immediately after payment</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Secure & Safe</p>
                  <p className="text-sm text-muted-foreground">Encrypted delivery via signed URL</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <h3 className="text-xl font-semibold">Description</h3>
            <p className="whitespace-pre-line text-muted-foreground">
              {product?.description ?? 'No description available.'}
            </p>
          </div>

          {product?.drm !== null && product?.drm !== undefined ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">DRM:</span> {product.drm}
              </p>
            </div>
          ) : null}

          {product?.ageRating !== null && product?.ageRating !== undefined ? (
            <div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Age Rating:</span> {product.ageRating}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
