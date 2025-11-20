'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalogClient } from '@bitloot/sdk';
import type { ProductListResponseDto } from '@bitloot/sdk';
import { CatalogFilters } from '@/features/catalog/components/CatalogFilters';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { Button } from '@/design-system/primitives/button';
import { Sheet, SheetContent, SheetTrigger } from '@/design-system/primitives/sheet';
import { Filter, Loader2 } from 'lucide-react';
import type { Product } from '@/features/catalog/components/ProductCard';

function CatalogContent(): React.ReactElement {
    const searchParams = useSearchParams();

    // Extract query params
    const pageParam = searchParams.get('page');
    const page = (pageParam !== null && pageParam !== undefined) ? Number(pageParam) : 1;
    const category = searchParams.get('category') ?? undefined;
    const platform = searchParams.get('platform') ?? undefined;
    const minPriceParam = searchParams.get('minPrice');
    const minPrice = (minPriceParam !== null && minPriceParam !== undefined) ? Number(minPriceParam) : undefined;
    const maxPriceParam = searchParams.get('maxPrice');
    const maxPrice = (maxPriceParam !== null && maxPriceParam !== undefined) ? Number(maxPriceParam) : undefined;
    const search = searchParams.get('search') ?? undefined;

    const { data, isLoading, isError } = useQuery<ProductListResponseDto>({
        queryKey: ['products', { page, category, platform, minPrice, maxPrice, search }],
        queryFn: async () => {
            try {
                const result = await catalogClient.findAll({
                    page,
                    limit: 12,
                    category,
                    platform,
                    minPrice,
                    maxPrice,
                    search,
                });
                return result;
            } catch (error) {
                console.error('Failed to fetch products:', error);
                throw error;
            }
        },
    });

    // Map ProductResponseDto to Product interface expected by ProductCard
    const products: Product[] = (data?.data ?? []).map((dto) => ({
        id: dto.id,
        name: dto.title, // Map title to name
        description: dto.description ?? '',
        price: dto.priceMinor / 100, // Convert cents to dollars
        image: dto.imageUrl,
        platform: dto.platform,
        discount: 0, // Discount not in public DTO currently
    }));
    const total = data?.total ?? 0;

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-bold">Catalog</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {isLoading ? 'Loading...' : `Showing ${products.length} of ${total} products`}
                    </span>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="lg:hidden">
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <CatalogFilters />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                <aside className="hidden lg:block">
                    <CatalogFilters />
                </aside>
                <div className="lg:col-span-3">
                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <div className="flex h-64 items-center justify-center text-red-500">
                            Failed to load products. Please try again.
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                            No products found matching your criteria.
                        </div>
                    ) : (
                        <ProductGrid products={products} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CatalogPage(): React.ReactElement {
    return (
        <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <CatalogContent />
        </Suspense>
    );
}
