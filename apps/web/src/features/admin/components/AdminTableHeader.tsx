'use client';

import type { ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { TableHead } from '@/design-system/primitives/table';

export interface SortableHeaderProps {
  label: string;
  sortable?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  columnKey: string;
}

/**
 * Sortable table header component
 * Shows sort indicator and handles click for sorting
 */
export function SortableTableHead({
  label,
  sortable = false,
  sortBy,
  sortDirection,
  onSort,
  columnKey,
}: SortableHeaderProps): ReactNode {
  if (!sortable) {
    return <TableHead>{label}</TableHead>;
  }

  const isActive = sortBy === columnKey;
  const isSortAsc = sortDirection === 'asc';

  const renderArrow = (): ReactNode => {
    if (isActive) {
      return isSortAsc ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
  };

  return (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onSort?.(columnKey);
        }}
        className={`-ml-3 h-8 data-[state=open]:bg-accent ${isActive ? 'font-bold' : ''}`}
      >
        {label}
        {renderArrow()}
      </Button>
    </TableHead>
  );
}
