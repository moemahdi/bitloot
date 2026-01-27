'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Slider } from '@/design-system/primitives/slider';
import { Checkbox } from '@/design-system/primitives/checkbox';
import { Label } from '@/design-system/primitives/label';
import { GlowButton } from '@/design-system/primitives/glow-button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/design-system/primitives/accordion';
import { Gamepad2, Monitor, Gift, Clock, DollarSign, Star, RotateCcw, Tag } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';

// BitLoot Business Categories - The 4 main store sections
const BITLOOT_CATEGORIES = [
  { 
    id: 'games', 
    label: 'Games', 
    icon: Gamepad2,
    description: 'PC & Console game keys',
    color: 'text-cyan-glow',
  },
  { 
    id: 'software', 
    label: 'Software', 
    icon: Monitor,
    description: 'Windows, Office & more',
    color: 'text-purple-neon',
  },
  { 
    id: 'gift-cards', 
    label: 'Gift Cards', 
    icon: Gift,
    description: 'Steam, PSN, Xbox & more',
    color: 'text-pink-featured',
  },
  { 
    id: 'subscriptions', 
    label: 'Subscriptions', 
    icon: Clock,
    description: 'Game Pass, PS Plus & more',
    color: 'text-green-success',
  },
];

// Platform options with colors
const PLATFORMS = [
  { id: 'Steam', label: 'Steam', color: 'text-blue-400' },
  { id: 'Origin', label: 'EA / Origin', color: 'text-orange-400' },
  { id: 'Uplay', label: 'Ubisoft', color: 'text-cyan-400' },
  { id: 'Xbox', label: 'Xbox', color: 'text-green-400' },
  { id: 'PlayStation', label: 'PlayStation', color: 'text-blue-500' },
  { id: 'Epic', label: 'Epic Games', color: 'text-slate-400' },
  { id: 'GOG', label: 'GOG', color: 'text-purple-400' },
  { id: 'Nintendo', label: 'Nintendo', color: 'text-red-400' },
];

export function CatalogFilters(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [priceRange, setPriceRange] = useState([0, 200]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Initialize from URL
  useEffect(() => {
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice != null && maxPrice != null) {
      setPriceRange([Number(minPrice), Number(maxPrice)]);
    }

    // Use businessCategory for the 4 main categories
    const category = searchParams.get('businessCategory');
    setSelectedCategory(category);

    const platforms = (searchParams.get('platform') ?? '').split(',').filter(Boolean);
    setSelectedPlatforms(platforms);
  }, [searchParams]);

  const updateFilters = (): void => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedCategory !== null && selectedCategory !== '') {
      params.set('businessCategory', selectedCategory);
    } else {
      params.delete('businessCategory');
    }

    if (selectedPlatforms.length > 0) {
      params.set('platform', selectedPlatforms.join(','));
    } else {
      params.delete('platform');
    }

    params.set('minPrice', (priceRange[0] ?? 0).toString());
    params.set('maxPrice', (priceRange[1] ?? 200).toString());
    params.set('page', '1');

    router.push(`/catalog?${params.toString()}`);
  };

  const resetFilters = (): void => {
    setPriceRange([0, 200]);
    setSelectedCategory(null);
    setSelectedPlatforms([]);
    router.push('/catalog');
  };

  const selectCategory = (categoryId: string): void => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const togglePlatform = (platform: string): void => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const hasActiveFilters =
    selectedCategory !== null ||
    selectedPlatforms.length > 0 ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 200;

  return (
    <div className="space-y-6">
      {/* Active Filters Count */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between rounded-lg border border-cyan-glow/20 bg-cyan-glow/5 px-3 py-2">
          <span className="text-sm text-cyan-glow">
            {(selectedCategory !== null ? 1 : 0) + selectedPlatforms.length + (priceRange[0] !== 0 || priceRange[1] !== 200 ? 1 : 0)}{' '}
            filters active
          </span>
          <button
            onClick={resetFilters}
            className="text-xs text-text-muted transition-colors hover:text-white"
          >
            Clear all
          </button>
        </div>
      )}

      <Accordion type="multiple" defaultValue={['category', 'platform', 'price']} className="w-full">
        {/* Categories - The 4 BitLoot Business Categories */}
        <AccordionItem value="category" className="border-border-subtle">
          <AccordionTrigger className="text-white hover:text-cyan-glow hover:no-underline">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-cyan-glow" />
              <span>Categories</span>
              {selectedCategory !== null && (
                <span className="ml-2 rounded-full bg-cyan-glow/20 px-2 py-0.5 text-xs text-cyan-glow">
                  1
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-2 pt-2">
              {BITLOOT_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => selectCategory(category.id)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all',
                      isSelected
                        ? 'border-cyan-glow/30 bg-cyan-glow/10 shadow-glow-cyan-sm'
                        : 'border-border-subtle text-text-muted hover:border-cyan-glow/20 hover:text-white'
                    )}
                  >
                    <IconComponent className={cn('h-5 w-5', isSelected ? 'text-cyan-glow' : category.color)} />
                    <div className="flex flex-col">
                      <span className={cn('text-sm font-medium', isSelected ? 'text-cyan-glow' : 'text-white')}>
                        {category.label}
                      </span>
                      <span className="text-xs text-text-muted">{category.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Platforms */}
        <AccordionItem value="platform" className="border-border-subtle">
          <AccordionTrigger className="text-white hover:text-cyan-glow hover:no-underline">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-cyan-glow" />
              <span>Platforms</span>
              {selectedPlatforms.length > 0 && (
                <span className="ml-2 rounded-full bg-cyan-glow/20 px-2 py-0.5 text-xs text-cyan-glow">
                  {selectedPlatforms.length}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {PLATFORMS.map((platform) => (
                <div
                  key={platform.id}
                  className="flex cursor-pointer items-center space-x-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-tertiary"
                  onClick={() => togglePlatform(platform.id)}
                >
                  <Checkbox
                    id={`platform-${platform.id}`}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                    className="border-border-subtle data-[state=checked]:border-cyan-glow data-[state=checked]:bg-cyan-glow"
                  />
                  <Label
                    htmlFor={`platform-${platform.id}`}
                    className={cn('cursor-pointer text-sm', platform.color)}
                  >
                    {platform.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price" className="border-border-subtle">
          <AccordionTrigger className="text-white hover:text-cyan-glow hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-cyan-glow" />
              <span>Price Range</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {/* Price Display */}
              <div className="flex items-center justify-between">
                <div className="rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-1.5">
                  <span className="text-sm text-text-muted">$</span>
                  <span className="ml-1 text-sm font-medium text-white">{priceRange[0] ?? 0}</span>
                </div>
                <div className="h-px flex-1 bg-border-subtle mx-3" />
                <div className="rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-1.5">
                  <span className="text-sm text-text-muted">$</span>
                  <span className="ml-1 text-sm font-medium text-white">{priceRange[1] ?? 200}</span>
                </div>
              </div>

              {/* Slider */}
              <Slider
                defaultValue={[0, 200]}
                max={200}
                step={5}
                value={priceRange}
                onValueChange={setPriceRange}
                className="[&_[role=slider]]:border-cyan-glow [&_[role=slider]]:bg-cyan-glow [&_.range]:bg-cyan-glow"
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Under €20', min: 0, max: 20 },
                  { label: '€20-€50', min: 20, max: 50 },
                  { label: '€50-€100', min: 50, max: 100 },
                  { label: '€100+', min: 100, max: 200 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setPriceRange([preset.min, preset.max])}
                    className={cn(
                      'rounded-md border px-2 py-1 text-xs transition-all',
                      priceRange[0] === preset.min && priceRange[1] === preset.max
                        ? 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow'
                        : 'border-border-subtle text-text-muted hover:border-cyan-glow/20 hover:text-white'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <GlowButton className="w-full" onClick={updateFilters}>
          <Star className="mr-2 h-4 w-4" />
          Apply Filters
        </GlowButton>
        <GlowButton className="w-full" variant="outline" onClick={resetFilters}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Filters
        </GlowButton>
      </div>
    </div>
  );
}
