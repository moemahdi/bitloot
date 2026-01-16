'use client';

import { useState, useCallback } from 'react';
import { Search, X, Filter, Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/design-system/primitives/popover';
import { Calendar as CalendarComponent } from '@/design-system/primitives/calendar';
import { Badge } from '@/design-system/primitives/badge';
import { cn } from '@/design-system/utils/utils';

export interface WebhookFiltersState {
  search: string;
  webhookType: string;
  processed: string; // 'all' | 'true' | 'false'
  signatureValid: string; // 'all' | 'true' | 'false'
  paymentStatus: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface WebhookFiltersProps {
  filters: WebhookFiltersState;
  onFiltersChange: (filters: WebhookFiltersState) => void;
  className?: string;
  compact?: boolean;
}

const WEBHOOK_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'nowpayments_ipn', label: 'NOWPayments IPN' },
  { value: 'payment', label: 'Payment' },
  { value: 'kinguin', label: 'Kinguin' },
  { value: 'fulfillment', label: 'Fulfillment' },
  { value: 'resend', label: 'Resend/Email' },
  { value: 'admin_status_override', label: 'Admin Override' },
];

const PAYMENT_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'confirming', label: 'Confirming' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'sending', label: 'Sending' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'finished', label: 'Finished' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'expired', label: 'Expired' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'webhookType', label: 'Type' },
  { value: 'paymentStatus', label: 'Payment Status' },
];

export const DEFAULT_FILTERS: WebhookFiltersState = {
  search: '',
  webhookType: 'all',
  processed: 'all',
  signatureValid: 'all',
  paymentStatus: 'all',
  startDate: undefined,
  endDate: undefined,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Advanced Webhook Filters - BitLoot neon cyberpunk style
 * Terminal-style filter controls with neon accent glows
 * Features: Search with clear, type/status filters, advanced panel, active tags
 * 
 * @example
 * <WebhookFilters filters={filters} onFiltersChange={setFilters} />
 * <WebhookFilters filters={filters} onFiltersChange={setFilters} compact />
 */
export function WebhookFilters({
  filters,
  onFiltersChange,
  className,
  compact = false,
}: WebhookFiltersProps): React.ReactElement {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = useCallback(
    <K extends keyof WebhookFiltersState>(key: K, value: WebhookFiltersState[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const resetFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  const activeFilterCount = getActiveFilterCount(filters);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary transition-colors duration-200" />
          <Input
            placeholder="Search by ID, external ID, order ID..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9 pr-9"
          />
          {filters.search !== '' && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-destructive hover:shadow-glow-error transition-all duration-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <Select value={filters.webhookType} onValueChange={(v) => updateFilter('webhookType', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Webhook Type" />
          </SelectTrigger>
          <SelectContent>
            {WEBHOOK_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Processed Filter */}
        <Select value={filters.processed} onValueChange={(v) => updateFilter('processed', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Processed</SelectItem>
            <SelectItem value="false">Pending</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'inline-flex items-center gap-2 transition-all duration-200',
            showAdvanced && 'border-cyan-glow/50 shadow-glow-cyan-sm bg-cyan-glow/5',
          )}
          aria-expanded={showAdvanced}
          aria-label="Toggle advanced filters"
        >
          <Filter className={cn('h-4 w-4 transition-colors duration-200', showAdvanced ? 'text-cyan-glow' : 'text-text-secondary')} />
          <span className={cn('transition-colors duration-200', showAdvanced && 'text-cyan-glow')}>Advanced</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-purple-neon/20 text-purple-neon border-purple-neon/30">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className={cn('h-4 w-4 transition-all duration-200', showAdvanced ? 'rotate-180 text-cyan-glow' : 'text-text-secondary')} />
        </Button>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-cyan-glow hover:shadow-glow-cyan-sm transition-all duration-200"
            aria-label="Reset all filters"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-bg-tertiary rounded-lg border border-border-accent animate-collapsible-down">
          {/* Signature Valid */}
          <Select value={filters.signatureValid} onValueChange={(v) => updateFilter('signatureValid', v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Signature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Signatures</SelectItem>
              <SelectItem value="true">Valid Only</SelectItem>
              <SelectItem value="false">Invalid Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status */}
          <Select value={filters.paymentStatus} onValueChange={(v) => updateFilter('paymentStatus', v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(date) => updateFilter('startDate', date)}
            onEndDateChange={(date) => updateFilter('endDate', date)}
          />

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Select value={filters.sortBy} onValueChange={(v) => updateFilter('sortBy', v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-9 w-9 text-purple-neon hover:shadow-glow-purple-sm transition-all duration-200"
              aria-label={`Sort order: ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && !compact && (
        <ActiveFilterTags filters={filters} onFiltersChange={onFiltersChange} />
      )}
    </div>
  );
}

function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 transition-colors duration-200"
            aria-label="Select start date"
          >
            <Calendar className="h-4 w-4 text-cyan-glow" />
            <span className={startDate !== undefined ? 'text-text-primary' : 'text-text-muted'}>
              {startDate !== undefined ? startDate.toLocaleDateString() : 'Start Date'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={startDate}
            onSelect={onStartDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <span className="text-text-muted text-sm">to</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 transition-colors duration-200"
            aria-label="Select end date"
          >
            <Calendar className="h-4 w-4 text-cyan-glow" />
            <span className={endDate !== undefined ? 'text-text-primary' : 'text-text-muted'}>
              {endDate !== undefined ? endDate.toLocaleDateString() : 'End Date'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={endDate}
            onSelect={onEndDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {(startDate !== undefined || endDate !== undefined) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onStartDateChange(undefined);
            onEndDateChange(undefined);
          }}
          className="h-8 w-8 text-text-secondary hover:text-destructive hover:shadow-glow-error transition-all duration-200"
          aria-label="Clear date range"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function ActiveFilterTags({
  filters,
  onFiltersChange,
}: {
  filters: WebhookFiltersState;
  onFiltersChange: (filters: WebhookFiltersState) => void;
}): React.ReactElement {
  const tags: { key: keyof WebhookFiltersState; label: string; value: string }[] = [];

  if (filters.webhookType !== null && filters.webhookType !== undefined && filters.webhookType !== '' && filters.webhookType !== 'all') {
    const type = WEBHOOK_TYPES.find((t) => t.value === filters.webhookType);
    tags.push({ key: 'webhookType', label: 'Type', value: type?.label ?? filters.webhookType });
  }
  if (filters.processed !== 'all') {
    tags.push({ key: 'processed', label: 'Status', value: filters.processed === 'true' ? 'Processed' : 'Pending' });
  }
  if (filters.signatureValid !== 'all') {
    tags.push({ key: 'signatureValid', label: 'Signature', value: filters.signatureValid === 'true' ? 'Valid' : 'Invalid' });
  }
  if (filters.paymentStatus !== null && filters.paymentStatus !== undefined && filters.paymentStatus !== '' && filters.paymentStatus !== 'all') {
    const status = PAYMENT_STATUSES.find((s) => s.value === filters.paymentStatus);
    tags.push({ key: 'paymentStatus', label: 'Payment', value: status?.label ?? filters.paymentStatus });
  }
  if (filters.startDate !== undefined) {
    tags.push({ key: 'startDate', label: 'From', value: filters.startDate.toLocaleDateString() });
  }
  if (filters.endDate !== undefined) {
    tags.push({ key: 'endDate', label: 'To', value: filters.endDate.toLocaleDateString() });
  }

  if (tags.length === 0) return <></>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-text-muted">Active filters:</span>
      {tags.map((tag) => (
        <Badge
          key={tag.key}
          variant="secondary"
          className="inline-flex items-center gap-1.5 pr-1 bg-purple-neon/10 text-text-primary border-purple-neon/30 transition-all duration-200 hover:border-purple-neon/50"
        >
          <span className="text-text-secondary text-xs">{tag.label}:</span>
          <span className="text-cyan-glow text-xs font-medium">{tag.value}</span>
          <button
            onClick={() => {
              const resetValue = tag.key === 'processed' || tag.key === 'signatureValid' ? 'all' : 
                                 tag.key === 'startDate' || tag.key === 'endDate' ? undefined : '';
              onFiltersChange({ ...filters, [tag.key]: resetValue });
            }}
            className="ml-0.5 text-text-secondary hover:text-destructive hover:shadow-glow-error transition-all duration-200"
            aria-label={`Remove ${tag.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

function getActiveFilterCount(filters: WebhookFiltersState): number {
  let count = 0;
  if (filters.search !== '') count++;
  if (filters.webhookType !== null && filters.webhookType !== undefined && filters.webhookType !== '' && filters.webhookType !== 'all') count++;
  if (filters.processed !== 'all') count++;
  if (filters.signatureValid !== 'all') count++;
  if (filters.paymentStatus !== null && filters.paymentStatus !== undefined && filters.paymentStatus !== '' && filters.paymentStatus !== 'all') count++;
  if (filters.startDate !== null && filters.startDate !== undefined) count++;
  if (filters.endDate !== null && filters.endDate !== undefined) count++;
  return count;
}
