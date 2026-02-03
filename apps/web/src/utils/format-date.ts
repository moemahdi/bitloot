/**
 * BitLoot Date Formatting Utilities
 * 
 * Centralized date/time formatting with proper timezone handling.
 * All dates from the API are in UTC and should be displayed in the user's local timezone.
 * 
 * Key Principles:
 * 1. Always parse dates as UTC (API returns ISO 8601 strings)
 * 2. Display in user's local timezone using Intl.DateTimeFormat
 * 3. Provide consistent formatting across the app
 * 4. Handle SSR by detecting server vs client environment
 */

/**
 * Check if code is running in the browser (client-side)
 */
function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get the user's timezone from the browser
 * Returns 'UTC' on server-side to prevent hydration mismatches
 * (Client will re-render with correct timezone)
 */
export function getUserTimezone(): string {
  // On server, we can't know the user's timezone, so use UTC
  // The client will re-render with the correct timezone
  if (!isClient()) {
    return 'UTC';
  }
  
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Safely parse a date string or Date object to a Date
 * Handles ISO strings, timestamps, and Date objects
 */
export function parseDate(dateInput: string | Date | number | null | undefined): Date | null {
  if (dateInput === null || dateInput === undefined) {
    return null;
  }

  try {
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    if (typeof dateInput === 'number') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }

    if (typeof dateInput === 'string') {
      // If the string doesn't have timezone info, assume UTC
      let dateString = dateInput.trim();
      
      // Handle ISO strings without timezone - append Z for UTC
      if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/) !== null) {
        dateString = dateString + 'Z';
      }
      
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Format options for different display contexts
 */
export type DateFormatStyle = 
  | 'full'           // Jan 15, 2025 at 3:45 PM
  | 'date-only'      // Jan 15, 2025
  | 'date'           // Jan 15, 2025 (alias for date-only)
  | 'time-only'      // 3:45 PM
  | 'time'           // 3:45 PM (alias for time-only)
  | 'short'          // 1/15/25, 3:45 PM
  | 'datetime'       // Jan 15, 2025 3:45 PM
  | 'datetime-long'  // January 15, 2025 at 3:45:30 PM
  | 'iso'            // 2025-01-15T15:45:30
  | 'relative';      // 5 minutes ago

/**
 * Format a date for display in the user's local timezone
 * 
 * @param dateInput - Date string, Date object, or timestamp
 * @param style - Format style to use
 * @param locale - Locale for formatting (defaults to en-US)
 * @returns Formatted date string or fallback
 */
export function formatDate(
  dateInput: string | Date | number | null | undefined,
  style: DateFormatStyle = 'datetime',
  locale: string = 'en-US'
): string {
  const date = parseDate(dateInput);
  
  if (date === null) {
    return '-';
  }

  try {
    const timezone = getUserTimezone();

    switch (style) {
      case 'full':
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone,
        }).format(date);

      case 'date-only':
      case 'date':
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: timezone,
        }).format(date);

      case 'time-only':
      case 'time':
        return new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone,
        }).format(date);

      case 'short':
        return new Intl.DateTimeFormat(locale, {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: timezone,
        }).format(date);

      case 'datetime':
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone,
        }).format(date);

      case 'datetime-long':
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: timezone,
        }).format(date);

      case 'iso':
        // Return ISO string in user's local timezone
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: timezone,
        }).format(date).replace(/(\d+)\/(\d+)\/(\d+),?\s*/, '$3-$1-$2T');

      case 'relative':
        return formatRelativeTime(date);

      default:
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone,
        }).format(date);
    }
  } catch {
    // Fallback to basic formatting
    return date.toLocaleString(locale);
  }
}

/**
 * Format date as relative time (e.g., "5 minutes ago", "2 hours ago")
 */
export function formatRelativeTime(dateInput: string | Date | number | null | undefined): string {
  const date = parseDate(dateInput);
  
  if (date === null) {
    return '-';
  }

  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    // Handle future dates
    if (diffMs < 0) {
      const futureDiffMs = Math.abs(diffMs);
      const futureMinutes = Math.floor(futureDiffMs / 60000);
      const futureHours = Math.floor(futureMinutes / 60);
      const futureDays = Math.floor(futureHours / 24);

      if (futureMinutes < 1) return 'in a moment';
      if (futureMinutes < 60) return `in ${futureMinutes}m`;
      if (futureHours < 24) return `in ${futureHours}h`;
      if (futureDays < 7) return `in ${futureDays}d`;
      return formatDate(date, 'date-only');
    }

    // Past dates
    if (diffSeconds < 30) return 'Just now';
    if (diffMinutes < 1) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;

    // For older dates, show the full date
    return formatDate(date, 'date-only');
  } catch {
    return '-';
  }
}

/**
 * Format date with both relative and absolute time
 * e.g., "5 minutes ago (Jan 15, 2025 3:45 PM)"
 */
export function formatDateWithRelative(
  dateInput: string | Date | number | null | undefined
): { relative: string; absolute: string; combined: string } {
  const date = parseDate(dateInput);
  
  if (date === null) {
    return { relative: '-', absolute: '-', combined: '-' };
  }

  const relative = formatRelativeTime(date);
  const absolute = formatDate(date, 'datetime');
  const combined = `${relative} (${absolute})`;

  return { relative, absolute, combined };
}

/**
 * Format a date for CSV export (ISO format in user's timezone)
 */
export function formatDateForExport(
  dateInput: string | Date | number | null | undefined
): string {
  const date = parseDate(dateInput);
  
  if (date === null) {
    return '';
  }

  try {
    const timezone = getUserTimezone();
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(date).replace(', ', ' ');
  } catch {
    return date.toISOString();
  }
}

/**
 * Format date for form inputs (datetime-local format)
 * Returns format: "2025-01-15T15:45"
 */
export function formatDateForInput(
  dateInput: string | Date | number | null | undefined
): string {
  const date = parseDate(dateInput);
  
  if (date === null) {
    return '';
  }

  try {
    const timezone = getUserTimezone();
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).formatToParts(date);

    const getValue = (type: string): string => 
      parts.find(p => p.type === type)?.value ?? '';

    return `${getValue('year')}-${getValue('month')}-${getValue('day')}T${getValue('hour')}:${getValue('minute')}`;
  } catch {
    return '';
  }
}

/**
 * Check if a date is within a specific time range
 */
export function isWithinRange(
  dateInput: string | Date | number | null | undefined,
  range: 'today' | 'week' | 'month' | 'year' | { start: Date; end: Date }
): boolean {
  const date = parseDate(dateInput);
  
  if (date === null) {
    return false;
  }

  const now = new Date();

  if (typeof range === 'object') {
    return date >= range.start && date <= range.end;
  }

  switch (range) {
    case 'today': {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      return date >= startOfDay && date <= endOfDay;
    }
    case 'week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }
    case 'month': {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= monthAgo;
    }
    case 'year': {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return date >= yearAgo;
    }
    default:
      return false;
  }
}

/**
 * Get the start and end of a period for filtering
 */
export function getDateRange(
  period: '24h' | '7d' | '30d' | '90d' | '1y' | 'all'
): { start: Date | null; end: Date } {
  const now = new Date();

  switch (period) {
    case '24h':
      return { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
    case '7d':
      return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
    case '30d':
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
    case '90d':
      return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now };
    case '1y':
      return { start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), end: now };
    case 'all':
      return { start: null, end: now };
    default:
      return { start: null, end: now };
  }
}

/**
 * Format duration between two dates
 */
export function formatDuration(
  startInput: string | Date | number | null | undefined,
  endInput?: string | Date | number | null
): string {
  const start = parseDate(startInput);
  const end = endInput !== undefined ? parseDate(endInput) : new Date();
  
  if (start === null || end === null) {
    return '-';
  }

  const diffMs = Math.abs(end.getTime() - start.getTime());
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}s`;
  if (diffMinutes < 60) return `${diffMinutes}m ${diffSeconds % 60}s`;
  if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m`;
  return `${diffDays}d ${diffHours % 24}h`;
}

/**
 * Force client-side rendering by returning a consistent placeholder during SSR
 * This prevents hydration mismatches when dates are formatted with user's timezone
 * 
 * Usage in components:
 * const { formatDate: formatClientDate, isClient } = useClientDate();
 * 
 * Then use formatClientDate() instead of formatDate() for proper timezone handling
 */
export function formatDateClientSafe(
  dateInput: string | Date | number | null | undefined,
  style: DateFormatStyle = 'datetime',
  locale: string = 'en-US'
): string {
  // During SSR, return empty placeholder to prevent hydration mismatch
  // The actual component should handle showing a loading state or re-rendering
  if (!isClient()) {
    return '...'; // Placeholder for SSR
  }
  
  return formatDate(dateInput, style, locale);
}
