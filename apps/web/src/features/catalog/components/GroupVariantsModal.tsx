'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Filter, ArrowRight, X, Package, Loader2, Gamepad2, Globe, Layers } from 'lucide-react';
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
  const { data: groupDetails, isLoading, isError, refetch } = useQuery({
    queryKey: ['group', group?.slug],
    queryFn: () =>
      catalogGroupsApi.groupsControllerGetGroup({ slugOrId: group!.slug }),
    enabled:
      group?.slug !== null && group?.slug !== undefined && group?.slug !== '' && open,
    staleTime: 30_000,
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
    ] as string[];
    const regions = [
      ...new Set(groupDetails.products.map((p) => p.region).filter(Boolean)),
    ] as string[];
    const subtitles = [
      ...new Set(groupDetails.products.map((p) => p.subtitle).filter(Boolean)),
    ] as string[];

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
  const handleOpenChange = useCallback((newOpen: boolean): void => {
    if (!newOpen) {
      setPlatformFilter('all');
      setRegionFilter('all');
      setSubtitleFilter('all');
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Format price for display
  const formatPrice = useCallback((price: string | undefined | null): string => {
    if (price === undefined || price === null || price === '') return '0.00';
    const num = parseFloat(price);
    return Number.isNaN(num) ? '0.00' : num.toFixed(2);
  }, []);

  // Check if any filters are active
  const hasActiveFilters =
    platformFilter !== 'all' ||
    regionFilter !== 'all' ||
    subtitleFilter !== 'all';

  const clearFilters = useCallback((): void => {
    setPlatformFilter('all');
    setRegionFilter('all');
    setSubtitleFilter('all');
  }, []);

  const hasFilters = filterOptions.platforms.length > 0 || filterOptions.regions.length > 0 || filterOptions.subtitles.length > 0;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col bg-bg-secondary border-l border-border-subtle"
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1">
              <SheetTitle className="text-2xl font-bold text-text-primary tracking-tight">
                {group?.title}
              </SheetTitle>
              {group?.tagline !== null && group?.tagline !== undefined && group?.tagline !== '' && (
                <SheetDescription className="text-text-secondary">
                  {group.tagline}
                </SheetDescription>
              )}
            </div>
            {group?.productCount !== undefined && (
              <Badge 
                variant="secondary" 
                className="bg-purple-neon/20 text-purple-neon border-purple-neon/30 flex items-center gap-1.5"
              >
                <Layers className="h-3 w-3" aria-hidden="true" />
                {group.productCount} variants
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Separator className="bg-border-subtle" />

        {/* Filters */}
        {hasFilters && (
          <>
            <div className="p-4 space-y-3 bg-bg-tertiary/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Filter className="h-4 w-4 text-cyan-glow" aria-hidden="true" />
                  Filter Options
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs text-text-secondary hover:text-cyan-glow hover:bg-cyan-glow/10 transition-colors"
                  >
                    <X className="h-3 w-3 mr-1" aria-hidden="true" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Platform Filter */}
                {filterOptions.platforms.length > 0 && (
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="h-9 bg-bg-secondary border-border-subtle hover:border-border-accent focus:border-cyan-glow focus:ring-1 focus:ring-cyan-glow/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                        <SelectValue placeholder="Platform" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-bg-secondary border-border-subtle">
                      <SelectItem value="all" className="hover:bg-bg-tertiary focus:bg-bg-tertiary">
                        All Platforms
                      </SelectItem>
                      {filterOptions.platforms.map((platform) => (
                        <SelectItem 
                          key={platform} 
                          value={platform}
                          className="hover:bg-bg-tertiary focus:bg-bg-tertiary"
                        >
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Region Filter */}
                {filterOptions.regions.length > 0 && (
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="h-9 bg-bg-secondary border-border-subtle hover:border-border-accent focus:border-cyan-glow focus:ring-1 focus:ring-cyan-glow/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                        <SelectValue placeholder="Region" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-bg-secondary border-border-subtle">
                      <SelectItem value="all" className="hover:bg-bg-tertiary focus:bg-bg-tertiary">
                        All Regions
                      </SelectItem>
                      {filterOptions.regions.map((region) => (
                        <SelectItem 
                          key={region} 
                          value={region}
                          className="hover:bg-bg-tertiary focus:bg-bg-tertiary"
                        >
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Edition/Subtitle Filter */}
                {filterOptions.subtitles.length > 0 && (
                  <Select value={subtitleFilter} onValueChange={setSubtitleFilter}>
                    <SelectTrigger className="h-9 bg-bg-secondary border-border-subtle hover:border-border-accent focus:border-cyan-glow focus:ring-1 focus:ring-cyan-glow/30 transition-colors">
                      <SelectValue placeholder="Edition" />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-secondary border-border-subtle">
                      <SelectItem value="all" className="hover:bg-bg-tertiary focus:bg-bg-tertiary">
                        All Editions
                      </SelectItem>
                      {filterOptions.subtitles.map((subtitle) => (
                        <SelectItem 
                          key={subtitle} 
                          value={subtitle}
                          className="hover:bg-bg-tertiary focus:bg-bg-tertiary"
                        >
                          {subtitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <Separator className="bg-border-subtle" />
          </>
        )}

        {/* Products List */}
        <ScrollArea className="flex-1 scrollbar-thin">
          <div className="p-4 space-y-3">
            {isLoading ? (
              // Loading skeletons with shimmer effect
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border-subtle bg-bg-secondary"
                >
                  <div className="h-16 w-12 rounded bg-bg-tertiary skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-bg-tertiary skeleton" />
                    <div className="h-3 w-1/2 rounded bg-bg-tertiary skeleton" />
                  </div>
                  <div className="h-8 w-20 rounded bg-bg-tertiary skeleton" />
                </div>
              ))
            ) : isError ? (
              // Error state
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-warning/10 flex items-center justify-center">
                  <Package className="h-8 w-8 text-orange-warning" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Failed to load variants</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Something went wrong while loading product variants.
                </p>
                <Button
                  onClick={() => refetch()}
                  className="bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90 hover:shadow-glow-cyan transition-all"
                >
                  <Loader2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Try Again
                </Button>
              </div>
            ) : filteredProducts.length === 0 ? (
              // Empty state
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-neon/10 flex items-center justify-center">
                  <Package className="h-8 w-8 text-purple-neon" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">No products match your filters</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Try adjusting your filter options to see more results.
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="border-border-accent hover:border-cyan-glow hover:text-cyan-glow hover:shadow-glow-cyan-sm transition-all"
                  >
                    <X className="h-4 w-4 mr-2" aria-hidden="true" />
                    Clear Filters
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
        <div className="p-4 border-t border-border-subtle bg-bg-tertiary/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              <span className="text-cyan-glow font-medium crypto-amount">{filteredProducts.length}</span>
              {' '}of{' '}
              <span className="text-text-primary font-medium crypto-amount">{groupDetails?.products?.length ?? 0}</span>
              {' '}variants shown
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
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
  formatPrice: (price: string | undefined | null) => string;
}): React.ReactElement {
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = product.coverImageUrl !== '' && product.coverImageUrl !== null && product.coverImageUrl !== undefined
    ? product.coverImageUrl
    : '/placeholder-game.jpg';

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex items-center gap-4 p-3 rounded-lg border border-border-subtle bg-bg-secondary hover:border-cyan-glow/50 hover:bg-bg-tertiary/50 hover:shadow-glow-cyan-sm transition-all duration-200"
      aria-label={`View ${product.title} - €${formatPrice(product.price)}`}
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-12 rounded overflow-hidden shrink-0 bg-bg-tertiary">
        <Image
          src={imageError ? '/placeholder-game.jpg' : imageUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="48px"
          onError={() => setImageError(true)}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {product.platform !== null && product.platform !== undefined && product.platform !== '' && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-purple-neon/20 text-purple-neon border-purple-neon/30 px-2 py-0.5"
            >
              {product.platform}
            </Badge>
          )}
          {product.region !== null && product.region !== undefined && product.region !== '' && (
            <Badge 
              variant="outline" 
              className="text-xs border-border-accent text-text-secondary px-2 py-0.5"
            >
              {product.region}
            </Badge>
          )}
        </div>
        <h4 className="font-medium text-sm text-text-primary line-clamp-1 group-hover:text-cyan-glow transition-colors">
          {product.title}
        </h4>
        {product.subtitle !== null && product.subtitle !== undefined && product.subtitle !== '' && (
          <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
            {product.subtitle}
          </p>
        )}
      </div>

      {/* Price and Action */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-bold text-cyan-glow crypto-amount text-glow-cyan">
          €{formatPrice(product.price)}
        </span>
        <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center group-hover:bg-cyan-glow/20 group-hover:shadow-glow-cyan-sm transition-all">
          <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-cyan-glow transition-colors" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
