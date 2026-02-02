/**
 * FilterPanel Component
 * 
 * Desktop sidebar with search, categories, platforms, regions, price range,
 * and saved filter presets.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/design-system/utils/utils';
import { Input } from '@/design-system/primitives/input';
import { Button } from '@/design-system/primitives/button';
import { Slider } from '@/design-system/primitives/slider';
import { Checkbox } from '@/design-system/primitives/checkbox';
import { Label } from '@/design-system/primitives/label';
import { Badge } from '@/design-system/primitives/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/design-system/primitives/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/design-system/primitives/dialog';
import {
  Search,
  Tag,
  Monitor,
  Globe,
  Euro,
  Bookmark,
  RotateCcw,
  Plus,
  Trash2,
  Gamepad2,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { 
  FilterState, 
  FilterPreset, 
  BusinessCategory,
  PlatformOption,
  RegionOption,
  GenreOption,
} from '../types';
import { 
  BUSINESS_CATEGORIES, 
  PLATFORMS, 
  REGIONS,
  GENRES,
  PRICE_PRESETS,
} from '../types';

// Category icon mapping
const CATEGORY_ICONS: Record<BusinessCategory, LucideIcon> = {
  'games': Gamepad2,
  'software': Monitor,
  'subscriptions': Clock,
};

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  platforms?: PlatformOption[];
  regions?: RegionOption[];
  genres?: GenreOption[];
  savedPresets: FilterPreset[];
  onSavePreset: (name: string) => void;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (presetId: string) => void;
  recentSearches?: string[];
  onSearchSubmit?: (query: string) => void;
  /** Hide the search input (when hero search is visible) */
  showSearch?: boolean;
  className?: string;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  platforms = PLATFORMS,
  regions = REGIONS,
  genres = GENRES,
  savedPresets,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  recentSearches = [],
  onSearchSubmit,
  showSearch = true,
  className,
}: FilterPanelProps): React.ReactElement {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [priceRange, setPriceRange] = useState([filters.minPrice, filters.maxPrice]);
  const [savePresetName, setSavePresetName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  // Sync search value with filters
  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);
  
  // Sync price range with filters
  useEffect(() => {
    setPriceRange([filters.minPrice, filters.maxPrice]);
  }, [filters.minPrice, filters.maxPrice]);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange({ search: searchValue });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, filters.search, onFilterChange]);
  
  // Handle search submit
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchValue });
    onSearchSubmit?.(searchValue);
  }, [searchValue, onFilterChange, onSearchSubmit]);
  
  // Handle category selection
  const handleCategoryClick = useCallback((categoryId: BusinessCategory) => {
    const newCategory = filters.businessCategory === categoryId ? null : categoryId;
    onFilterChange({ businessCategory: newCategory });
  }, [filters.businessCategory, onFilterChange]);
  
  // Handle platform toggle
  const handlePlatformToggle = useCallback((platformId: string) => {
    const newPlatforms = filters.platform.includes(platformId)
      ? filters.platform.filter((p) => p !== platformId)
      : [...filters.platform, platformId];
    onFilterChange({ platform: newPlatforms });
  }, [filters.platform, onFilterChange]);
  
  // Handle genre toggle
  const handleGenreToggle = useCallback((genreId: string) => {
    const currentGenres = filters.genre.split(',').filter(g => g !== '');
    const newGenres = currentGenres.includes(genreId)
      ? currentGenres.filter((g) => g !== genreId)
      : [...currentGenres, genreId];
    onFilterChange({ genre: newGenres.join(',') });
  }, [filters.genre, onFilterChange]);
  
  // Handle region change
  const handleRegionChange = useCallback((regionId: string) => {
    const newRegion = filters.region === regionId ? '' : regionId;
    onFilterChange({ region: newRegion });
  }, [filters.region, onFilterChange]);
  
  // Handle price range change
  const handlePriceRangeChange = useCallback((values: number[]) => {
    setPriceRange(values);
  }, []);
  
  // Commit price range on release
  const handlePriceRangeCommit = useCallback((values: number[]) => {
    onFilterChange({ minPrice: values[0], maxPrice: values[1] });
  }, [onFilterChange]);
  
  // Handle save preset
  const handleSavePreset = useCallback(() => {
    if (savePresetName.trim() !== '') {
      onSavePreset(savePresetName.trim());
      setSavePresetName('');
      setIsSaveDialogOpen(false);
    }
  }, [savePresetName, onSavePreset]);
  
  // Calculate active filter count
  const activeFilterCount = [
    filters.search !== '',
    filters.businessCategory !== null,
    filters.platform.length > 0,
    filters.genre !== '',
    filters.region !== '',
    filters.minPrice > 0 || filters.maxPrice < 500,
  ].filter(Boolean).length;
  
  const hasActiveFilters = activeFilterCount > 0;
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between rounded-lg border border-cyan-glow/20 bg-cyan-glow/5 px-3 py-2">
          <span className="text-sm text-cyan-glow">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </span>
          <button
            onClick={onReset}
            className="text-xs text-text-muted transition-colors hover:text-white"
          >
            Clear all
          </button>
        </div>
      )}
      
      {/* Search - only show when showSearch is true */}
      {showSearch && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <Search className="h-4 w-4 text-cyan-glow" aria-hidden="true" />
            Search
          </Label>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input
              type="search"
              placeholder="Search products..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="bg-bg-secondary border-border-subtle focus:border-cyan-glow pr-8"
            />
            {searchValue !== '' && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue('');
                  onFilterChange({ search: '' });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
          
          {/* Recent searches */}
          {recentSearches.length > 0 && searchValue === '' && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recentSearches.slice(0, 3).map((query) => (
                <button
                  key={query}
                  onClick={() => {
                    setSearchValue(query);
                    onFilterChange({ search: query });
                  }}
                  className="text-xs text-text-muted hover:text-cyan-glow bg-bg-tertiary px-2 py-1 rounded transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <Accordion 
        type="multiple" 
        defaultValue={[]} 
        className="w-full"
      >
        {/* Categories */}
        <AccordionItem value="category" className="border-border-subtle">
          <AccordionTrigger className="text-white hover:text-cyan-glow hover:no-underline">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-cyan-glow" aria-hidden="true" />
              <span>Categories</span>
              {filters.businessCategory !== null && (
                <Badge variant="secondary" className="ml-2 bg-cyan-glow/20 text-cyan-glow text-xs">
                  1
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-2 pt-2">
              {BUSINESS_CATEGORIES.map((category) => {
                const isSelected = filters.businessCategory === category.id;
                const IconComponent = CATEGORY_ICONS[category.id as BusinessCategory];
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id as BusinessCategory)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all',
                      isSelected
                        ? 'border-cyan-glow/30 bg-cyan-glow/10 shadow-glow-cyan-sm'
                        : 'border-border-subtle text-text-muted hover:border-cyan-glow/20 hover:text-white'
                    )}
                  >
                    <IconComponent 
                      className={cn(
                        'h-5 w-5', 
                        isSelected ? 'text-cyan-glow' : category.color
                      )} 
                      aria-hidden="true" 
                    />
                    <div className="flex flex-col">
                      <span className={cn(
                        'text-sm font-medium', 
                        isSelected ? 'text-cyan-glow' : 'text-white'
                      )}>
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
              <Monitor className="h-4 w-4 text-cyan-glow" aria-hidden="true" />
              <span>Platforms</span>
              {filters.platform.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-cyan-glow/20 text-cyan-glow text-xs">
                  {filters.platform.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className="flex cursor-pointer items-center space-x-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-tertiary"
                  onClick={() => handlePlatformToggle(platform.id)}
                >
                  <Checkbox
                    id={`platform-${platform.id}`}
                    checked={filters.platform.includes(platform.id)}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                    className="border-border-subtle data-[state=checked]:border-cyan-glow data-[state=checked]:bg-cyan-glow"
                  />
                  <Label
                    htmlFor={`platform-${platform.id}`}
                    className={cn('cursor-pointer text-sm', platform.color ?? 'text-text-primary')}
                  >
                    {platform.label}
                    {platform.count !== undefined && (
                      <span className="ml-2 text-text-muted">({platform.count})</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Genres */}
        <AccordionItem value="genre" className="border-border-subtle">
          <AccordionTrigger className="text-white hover:text-cyan-glow hover:no-underline">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-glow" aria-hidden="true" />
              <span>Genres</span>
              {filters.genre !== '' && (
                <Badge variant="secondary" className="ml-2 bg-cyan-glow/20 text-cyan-glow text-xs">
                  {filters.genre.split(',').filter(g => g !== '').length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="max-h-64 space-y-2 overflow-y-auto pt-2">
              {genres.map((genre) => {
                const selectedGenres = filters.genre.split(',').filter(g => g !== '');
                return (
                  <div
                    key={genre.id}
                    className="flex cursor-pointer items-center space-x-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-tertiary"
                    onClick={() => handleGenreToggle(genre.id)}
                  >
                    <Checkbox
                      id={`genre-${genre.id}`}
                      checked={selectedGenres.includes(genre.id)}
                      onCheckedChange={() => handleGenreToggle(genre.id)}
                      className="border-border-subtle data-[state=checked]:border-cyan-glow data-[state=checked]:bg-cyan-glow"
                    />
                    <Label
                      htmlFor={`genre-${genre.id}`}
                      className={cn('cursor-pointer text-sm', genre.color ?? 'text-text-primary')}
                    >
                      {genre.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Regions */}
        <AccordionItem value="region" className="border-border-subtle">
          <AccordionTrigger className="text-white hover:text-cyan-glow hover:no-underline">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-glow" aria-hidden="true" />
              <span>Region</span>
              {filters.region !== '' && (
                <Badge variant="secondary" className="ml-2 bg-cyan-glow/20 text-cyan-glow text-xs">
                  1
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pt-2">
              {regions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => handleRegionChange(region.id)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-all',
                    filters.region === region.id
                      ? 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow'
                      : 'border-border-subtle text-text-muted hover:border-cyan-glow/20 hover:text-white'
                  )}
                >
                  {region.label}
                  {region.count !== undefined && (
                    <span className="ml-1 text-xs opacity-70">({region.count})</span>
                  )}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Price Range */}
        <AccordionItem value="price" className="border-border-subtle">
          <AccordionTrigger className="text-white hover:text-cyan-glow hover:no-underline">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-cyan-glow" aria-hidden="true" />
              <span>Price Range</span>
              {(filters.minPrice > 0 || filters.maxPrice < 500) && (
                <Badge variant="secondary" className="ml-2 bg-cyan-glow/20 text-cyan-glow text-xs">
                  Set
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {/* Price display */}
              <div className="flex items-center justify-between">
                <div className="rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-1.5">
                  <span className="text-sm text-text-muted">€</span>
                  <span className="ml-1 text-sm font-medium text-white tabular-nums">
                    {priceRange[0]}
                  </span>
                </div>
                <div className="h-px flex-1 bg-border-subtle mx-3" />
                <div className="rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-1.5">
                  <span className="text-sm text-text-muted">€</span>
                  <span className="ml-1 text-sm font-medium text-white tabular-nums">
                    {priceRange[1]}
                  </span>
                </div>
              </div>
              
              {/* Slider */}
              <Slider
                min={0}
                max={500}
                step={5}
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                onValueCommit={handlePriceRangeCommit}
              />
              
              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setPriceRange([preset.min, preset.max]);
                      onFilterChange({ minPrice: preset.min, maxPrice: preset.max });
                    }}
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
        
        {/* Saved Presets */}
        <AccordionItem value="presets" className="border-border-subtle">
          <AccordionTrigger className="text-white hover:text-cyan-glow hover:no-underline">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-cyan-glow" aria-hidden="true" />
              <span>Saved Filters</span>
              {savedPresets.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-cyan-glow/20 text-cyan-glow text-xs">
                  {savedPresets.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {savedPresets.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No saved filters. Save your current filters to quickly apply them later.
                </p>
              ) : (
                <div className="space-y-2">
                  {savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 hover:border-cyan-glow/20"
                    >
                      <button
                        onClick={() => onApplyPreset(preset)}
                        className="text-sm text-text-primary hover:text-cyan-glow text-left flex-1"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => onDeletePreset(preset.id)}
                        className="p-1 text-text-muted hover:text-destructive"
                        aria-label={`Delete ${preset.name} preset`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Save current filters */}
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-dashed border-border-subtle text-text-muted hover:text-cyan-glow hover:border-cyan-glow/30"
                    disabled={!hasActiveFilters}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Save Current Filters
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Filter Preset</DialogTitle>
                    <DialogDescription>
                      Give your filter preset a name to easily apply it later.
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    placeholder="e.g., PC Games Under €30"
                    value={savePresetName}
                    onChange={(e) => setSavePresetName(e.target.value)}
                    className="mt-4"
                    maxLength={30}
                  />
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSavePreset} disabled={savePresetName.trim() === ''}>
                      Save Preset
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Reset button */}
      <Button
        variant="outline"
        onClick={onReset}
        disabled={!hasActiveFilters}
        className="w-full border-border-subtle text-text-muted hover:text-white hover:border-border-accent"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset All Filters
      </Button>
    </div>
  );
}
