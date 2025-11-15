'use client';

import type { JSX } from 'react';
import { Input } from '@/design-system/primitives/input';
import { Button } from '@/design-system/primitives/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Download, RefreshCw, X } from 'lucide-react';

export interface OrderFiltersProps {
  email?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  onEmailChange: (email: string) => void;
  onStatusChange: (status: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onClear: () => void;
  isExporting?: boolean;
}

const ORDER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'created', label: 'Created' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'confirming', label: 'Confirming' },
  { value: 'paid', label: 'Paid' },
  { value: 'underpaid', label: 'Underpaid' },
  { value: 'failed', label: 'Failed' },
  { value: 'fulfilled', label: 'Fulfilled' },
];

/**
 * Order filtering controls
 * Supports email search, status filter, and date range filtering
 */
export function OrderFilters({
  email = '',
  status = '',
  dateFrom = '',
  dateTo = '',
  onEmailChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onRefresh,
  onExport,
  onClear,
  isExporting = false,
}: OrderFiltersProps): JSX.Element {
  const hasFilters = email !== '' || status !== '' || dateFrom !== '' || dateTo !== '';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filters & Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter inputs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Email search */}
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <Input
              placeholder="Search email..."
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Status filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date from */}
          <div>
            <label className="text-sm font-medium mb-1 block">From Date</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="text-sm font-medium mb-1 block">To Date</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap pt-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
