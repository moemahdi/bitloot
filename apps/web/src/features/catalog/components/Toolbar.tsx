/**
 * Toolbar Component
 * 
 * Results count, active filter chips, sort dropdown, view toggle, items per page,
 * and compact search bar when hero is not visible.
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Input } from '@/design-system/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { 
  X, 
  LayoutGrid, 
  List, 
  Grid3X3, 
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Search,
} from 'lucide-react';
import type { ActiveFilter, SortOption, ViewMode } from '../types';
import { SORT_OPTIONS, ITEMS_PER_PAGE_OPTIONS } from '../types';

interface ToolbarProps {
  totalCount: number;
  activeFilters: ActiveFilter[];
  sortBy: SortOption;
  viewMode: ViewMode;
  itemsPerPage: 24 | 48 | 96;
  isLoading?: boolean;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onItemsPerPageChange: (count: 24 | 48 | 96) => void;
  onClearAllFilters: () => void;
  onRefresh?: () => void;
  /** Show compact search bar (when hero is not visible) */
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

// Format number with commas
function formatCount(n: number): string {
  return n.toLocaleString();
}

export function Toolbar({
  totalCount,
  activeFilters,
  sortBy,
  viewMode,
  itemsPerPage,
  isLoading = false,
  onSortChange,
  onViewModeChange,
  onItemsPerPageChange,
  onClearAllFilters,
  onRefresh,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  className,
}: ToolbarProps): React.ReactElement {
  const hasActiveFilters = activeFilters.length > 0;
  
  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(searchValue);
  
  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);
  
  // Debounced search update
  useEffect(() => {
    if (localSearch === searchValue) return;
    const timer = setTimeout(() => {
      onSearchChange?.(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchValue, onSearchChange]);
  
  const handleSearchClear = useCallback(() => {
    setLocalSearch('');
    onSearchChange?.('');
  }, [onSearchChange]);
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Compact search bar - visible when hero is not shown */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search products..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-9 h-10 bg-bg-secondary border-border-subtle focus:border-cyan-glow"
            aria-label="Search products"
          />
          {localSearch !== '' && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Main toolbar row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Results count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-cyan-glow" aria-hidden="true" />
            ) : null}
            <span className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary tabular-nums">
                {formatCount(totalCount)}
              </span>
              {' '}products found
            </span>
          </div>
          
          {/* Refresh button */}
          {onRefresh !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-text-muted hover:text-cyan-glow"
              aria-label="Refresh results"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          )}
        </div>
        
        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-secondary p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'h-7 w-7 p-0',
                viewMode === 'grid' 
                  ? 'bg-bg-tertiary text-cyan-glow' 
                  : 'text-text-muted hover:text-text-primary'
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('compact')}
              className={cn(
                'h-7 w-7 p-0',
                viewMode === 'compact' 
                  ? 'bg-bg-tertiary text-cyan-glow' 
                  : 'text-text-muted hover:text-text-primary'
              )}
              aria-label="Compact view"
              aria-pressed={viewMode === 'compact'}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={cn(
                'h-7 w-7 p-0',
                viewMode === 'list' 
                  ? 'bg-bg-tertiary text-cyan-glow' 
                  : 'text-text-muted hover:text-text-primary'
              )}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Items per page */}
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => onItemsPerPageChange(Number(value) as 24 | 48 | 96)}
          >
            <SelectTrigger 
              className="w-[85px] h-9 bg-bg-secondary border-border-subtle text-sm"
              aria-label="Items per page"
            >
              <SelectValue placeholder={`${itemsPerPage}`} />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Sort dropdown */}
          <Select
            value={sortBy}
            onValueChange={(value) => onSortChange(value as SortOption)}
          >
            <SelectTrigger 
              className="w-[160px] h-9 bg-bg-secondary border-border-subtle text-sm"
              aria-label="Sort products"
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-text-muted" aria-hidden="true" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted mr-1">Active filters:</span>
          
          {activeFilters.map((filter, index) => (
            <Badge
              key={`${filter.type}-${filter.value}-${index}`}
              variant="secondary"
              className="group cursor-pointer bg-bg-tertiary border-border-subtle hover:border-cyan-glow/40 hover:bg-bg-tertiary pr-1"
              onClick={filter.removeAction}
            >
              <span className="text-xs">
                <span className="text-text-muted">{filter.label}:</span>{' '}
                <span className="text-text-primary">{filter.value}</span>
              </span>
              <button
                className="ml-1.5 p-0.5 rounded hover:bg-destructive/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  filter.removeAction();
                }}
                aria-label={`Remove ${filter.label}: ${filter.value} filter`}
              >
                <X className="h-3 w-3 text-text-muted group-hover:text-destructive" />
              </button>
            </Badge>
          ))}
          
          {activeFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
              className="h-6 px-2 text-xs text-text-muted hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
