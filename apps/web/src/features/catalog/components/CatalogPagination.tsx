/**
 * CatalogPagination Component
 * 
 * Pagination with Previous/Next buttons and page numbers.
 * Includes items per page selector and page info.
 */
'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@/design-system/utils/utils';
import { Button } from '@/design-system/primitives/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (count: 24 | 48 | 96) => void;
  showItemsPerPage?: boolean;
  className?: string;
}

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

export function CatalogPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  className,
}: CatalogPaginationProps): React.ReactElement | null {
  // Calculate visible page numbers (hooks must be called unconditionally)
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5; // Max visible page numbers
    
    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          if (i < totalPages) pages.push(i);
        }
        pages.push('ellipsis');
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('ellipsis');
        for (let i = totalPages - 3; i < totalPages; i++) {
          if (i > 1) pages.push(i);
        }
      } else {
        // In the middle
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  }, [currentPage, totalPages]);
  
  // Calculate item range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  // Handlers
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }, [currentPage, totalPages, onPageChange]);
  
  const handleItemsPerPageChange = useCallback((value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && onItemsPerPageChange !== undefined && (count === 24 || count === 48 || count === 96)) {
      onItemsPerPageChange(count);
    }
  }, [onItemsPerPageChange]);

  // Don't render if only one page and no items per page selector needed
  if (totalPages <= 1 && showItemsPerPage === false) {
    return null;
  }
  
  return (
    <nav
      className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Items info and per-page selector */}
      <div className="flex items-center gap-4 text-sm text-text-muted">
        <span>
          Showing <span className="text-white font-medium">{startItem}</span>
          {' - '}
          <span className="text-white font-medium">{endItem}</span>
          {' of '}
          <span className="text-white font-medium">{totalItems.toLocaleString()}</span>
          {' products'}
        </span>
        
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Show:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-20 h-8 text-sm border-border-subtle bg-bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Page controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 hidden sm:flex"
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          {/* Previous page */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-text-muted"
                  aria-hidden="true"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => goToPage(page)}
                  className={cn(
                    'h-8 w-8 text-sm',
                    currentPage === page
                      ? 'bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90'
                      : 'text-text-secondary hover:text-white'
                  )}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </Button>
              )
            )}
          </div>
          
          {/* Next page */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {/* Last page */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 hidden sm:flex"
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </nav>
  );
}
