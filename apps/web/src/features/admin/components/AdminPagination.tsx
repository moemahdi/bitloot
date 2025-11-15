'use client';

import { useState } from 'react';
import type { JSX } from 'react';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface AdminPaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Advanced pagination component for admin tables
 * Features: Previous/Next buttons, current page display, jump-to-page input
 */
export function AdminPagination({
  page,
  limit,
  total,
  onPageChange,
}: AdminPaginationProps): JSX.Element {
  const totalPages = Math.ceil(total / limit);
  const [jumpPage, setJumpPage] = useState<string>('');

  const handleJump = (): void => {
    const num = parseInt(jumpPage, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= totalPages) {
      onPageChange(num);
      setJumpPage('');
    }
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-6 mt-6">
      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} items
      </div>

      {/* Pagination controls */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoPrev}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {/* Page info */}
        <div className="flex items-center gap-2 px-3 py-1 text-sm font-medium">
          <span>Page</span>
          <span className="font-bold">{page}</span>
          <span>of</span>
          <span className="font-bold">{totalPages}</span>
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoNext}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        {/* Jump to page */}
        {totalPages > 5 && (
          <div className="flex gap-1">
            <Input
              type="number"
              min="1"
              max={totalPages}
              placeholder="Go to"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJump();
              }}
              className="w-16 h-9"
            />
            <Button variant="outline" size="sm" onClick={handleJump}>
              Go
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
