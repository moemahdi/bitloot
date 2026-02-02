/**
 * MobileFilterSheet Component
 * 
 * Full-screen bottom sheet for mobile filter UI.
 * Slides up from bottom with gesture support and sticky header/footer.
 */
'use client';

import { useCallback, useMemo } from 'react';
import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/design-system/primitives/sheet';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import type {
  FilterState,
  FilterPreset,
  PlatformOption,
  RegionOption,
  GenreOption,
} from '../types';
import { PLATFORMS, REGIONS, GENRES } from '../types';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  onApply: () => void;
  platforms?: PlatformOption[];
  regions?: RegionOption[];
  genres?: GenreOption[];
  savedPresets: FilterPreset[];
  onSavePreset: (name: string) => void;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (presetId: string) => void;
  recentSearches?: string[];
  onSearchSubmit?: (query: string) => void;
  /** Show search input (when hero is not visible) */
  showSearch?: boolean;
  totalResults?: number;
  className?: string;
}

export function MobileFilterSheet({
  isOpen,
  onOpenChange,
  filters,
  onFilterChange,
  onReset,
  onApply,
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
  totalResults = 0,
  className: _className,
}: MobileFilterSheetProps): React.ReactElement {
  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return [
      filters.search,
      filters.businessCategory,
      filters.platform.length > 0,
      filters.genre !== '',
      filters.region,
      filters.minPrice > 0 || filters.maxPrice < 500,
    ].filter(Boolean).length;
  }, [filters]);
  
  const hasActiveFilters = activeFilterCount > 0;
  
  // Handle apply and close
  const handleApply = useCallback(() => {
    onApply();
    onOpenChange(false);
  }, [onApply, onOpenChange]);
  
  // Handle reset
  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          'h-[85vh] rounded-t-2xl border-t border-border-subtle bg-bg-primary',
          'flex flex-col p-0'
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-2 shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-border-subtle" />
        </div>
        
        {/* Header */}
        <SheetHeader className="px-6 pb-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-white">
              Filters
            </SheetTitle>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-sm text-cyan-glow hover:text-cyan-glow/80 flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>
          <SheetDescription className="text-text-secondary text-sm">
            {hasActiveFilters
              ? `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} applied`
              : 'Refine your search with filters'
            }
          </SheetDescription>
        </SheetHeader>
        
        {/* Scrollable filter content */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            <FilterPanel
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={handleReset}
              platforms={platforms}
              regions={regions}
              genres={genres}
              savedPresets={savedPresets}
              onSavePreset={onSavePreset}
              onApplyPreset={onApplyPreset}
              onDeletePreset={onDeletePreset}
              recentSearches={recentSearches}
              onSearchSubmit={onSearchSubmit}
              showSearch={showSearch}
            />
          </div>
        </ScrollArea>
        
        {/* Footer with Apply button */}
        <SheetFooter className="px-6 py-4 border-t border-border-subtle shrink-0 bg-bg-secondary/50">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className="flex-1 border-border-subtle"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90"
            >
              <Check className="h-4 w-4 mr-2" />
              Show {totalResults > 0 ? `${totalResults.toLocaleString()} ` : ''}Results
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Trigger button component for use outside the sheet
interface MobileFilterTriggerProps {
  activeFilterCount: number;
  onClick: () => void;
  className?: string;
}

export function MobileFilterTrigger({
  activeFilterCount,
  onClick,
  className,
}: MobileFilterTriggerProps): React.ReactElement {
  const hasActiveFilters = activeFilterCount > 0;
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        'relative lg:hidden border-border-subtle',
        hasActiveFilters && 'border-cyan-glow/30 text-cyan-glow',
        className
      )}
    >
      <SlidersHorizontal className="h-4 w-4 mr-2" />
      Filters
      {hasActiveFilters && (
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-cyan-glow text-bg-primary flex items-center justify-center"
        >
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );
}
