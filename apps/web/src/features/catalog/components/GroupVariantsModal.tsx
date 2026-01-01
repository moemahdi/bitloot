'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Filter, ArrowRight } from 'lucide-react';
import type {
  ProductGroupResponseDto,
  GroupProductVariantDto,
} from '@bitloot/sdk';
import { CatalogGroupsApi, Configuration } from '@bitloot/sdk';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/design-system/primitives/sheet';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import { Separator } from '@/design-system/primitives/separator';
import { Skeleton } from '@/design-system/primitives/skeleton';

const catalogGroupsApi = new CatalogGroupsApi(
  new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  })
);

interface GroupVariantsModalProps {
  group: ProductGroupResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupVariantsModal({
  group,
  open,
  onOpenChange,
}: GroupVariantsModalProps): React.ReactElement {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [subtitleFilter, setSubtitleFilter] = useState<string>('all');

  // Fetch group details with products when modal opens
  const { data: groupDetails, isLoading } = useQuery({
    queryKey: ['group', group?.slug],
    queryFn: () =>
      catalogGroupsApi.groupsControllerGetGroup({ slugOrId: group!.slug }),
    enabled:
      group?.slug !== null && group?.slug !== undefined && group?.slug !== '' && open,
    staleTime: 30_000, // 30 seconds
  });

  // Extract unique filter options from products
  const filterOptions = useMemo(() => {
    if (
      groupDetails?.products === null ||
      groupDetails?.products === undefined
    ) {
      return { platforms: [], regions: [], subtitles: [] };
    }

    const platforms = [
      ...new Set(groupDetails.products.map((p) => p.platform).filter(Boolean)),
    ];
    const regions = [
      ...new Set(groupDetails.products.map((p) => p.region).filter(Boolean)),
    ];
    const subtitles = [
      ...new Set(groupDetails.products.map((p) => p.subtitle).filter(Boolean)),
    ];

    return { platforms, regions, subtitles };
  }, [groupDetails?.products]);

  // Filter products based on selected filters
  const filteredProducts = useMemo(() => {
    if (
      groupDetails?.products === null ||
      groupDetails?.products === undefined
    )
      return [];

    return groupDetails.products.filter((product) => {
      if (platformFilter !== 'all' && product.platform !== platformFilter)
        return false;
      if (regionFilter !== 'all' && product.region !== regionFilter)
        return false;
      if (subtitleFilter !== 'all' && product.subtitle !== subtitleFilter)
        return false;
      return true;
    });
  }, [groupDetails?.products, platformFilter, regionFilter, subtitleFilter]);

  // Reset filters when modal closes
  const handleOpenChange = (newOpen: boolean): void => {
    if (!newOpen) {
      setPlatformFilter('all');
      setRegionFilter('all');
      setSubtitleFilter('all');
    }
    onOpenChange(newOpen);
  };

  // Format price for display
  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return num.toFixed(2);
  };

  // Check if any filters are active
  const hasActiveFilters =
    platformFilter !== 'all' ||
    regionFilter !== 'all' ||
    subtitleFilter !== 'all';

  const clearFilters = (): void => {
    setPlatformFilter('all');
    setRegionFilter('all');
    setSubtitleFilter('all');
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-4 space-y-2">
          <SheetTitle className="text-2xl">{group?.title}</SheetTitle>
          {group?.tagline !== null && group?.tagline !== undefined && group?.tagline !== '' && (
            <SheetDescription>{group.tagline}</SheetDescription>
          )}
        </SheetHeader>

        <Separator />

        {/* Filters */}
        <div className="p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Filter Options
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Platform Filter */}
            {filterOptions.platforms.length > 0 && (
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {filterOptions.platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Region Filter */}
            {filterOptions.regions.length > 0 && (
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {filterOptions.regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Edition/Subtitle Filter */}
            {filterOptions.subtitles.length > 0 && (
              <Select value={subtitleFilter} onValueChange={setSubtitleFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Edition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Editions</SelectItem>
                  {filterOptions.subtitles.map((subtitle) => (
                    <SelectItem key={subtitle} value={subtitle}>
                      {subtitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <Separator />

        {/* Products List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <Skeleton className="h-16 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            ) : filteredProducts.length === 0 ? (
              // No results
              <div className="text-center py-8 text-muted-foreground">
                <p>No products match your filters.</p>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              // Product variants
              filteredProducts.map((product: GroupProductVariantDto) => (
                <ProductVariantItem
                  key={product.id}
                  product={product}
                  formatPrice={formatPrice}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredProducts.length} of {groupDetails?.products?.length ?? 0}{' '}
              variants shown
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Individual product variant item
function ProductVariantItem({
  product,
  formatPrice,
}: {
  product: GroupProductVariantDto;
  formatPrice: (price: string) => string;
}): React.ReactElement {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-12 rounded overflow-hidden flex-shrink-0">
        <Image
          src={product.coverImageUrl !== '' && product.coverImageUrl !== null ? product.coverImageUrl : '/placeholder-game.jpg'}
          alt={product.title}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {product.platform !== null && product.platform !== undefined && product.platform !== '' && (
            <Badge variant="secondary" className="text-xs">
              {product.platform}
            </Badge>
          )}
          {product.region !== null && product.region !== undefined && product.region !== '' && (
            <Badge variant="outline" className="text-xs">
              {product.region}
            </Badge>
          )}
        </div>
        <h4 className="font-medium text-sm line-clamp-1">{product.title}</h4>
        {product.subtitle !== null && product.subtitle !== undefined && product.subtitle !== '' && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {product.subtitle}
          </p>
        )}
      </div>

      {/* Price and Action */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-bold text-primary">
          ${formatPrice(product.price)}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}
