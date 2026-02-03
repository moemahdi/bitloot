'use client';

import { useState, useEffect } from 'react';
import { formatDate, type DateFormatStyle } from '@/utils/format-date';

/**
 * Hook for client-side only date formatting with proper timezone handling.
 * 
 * This hook ensures that:
 * 1. During SSR, a loading placeholder is shown
 * 2. After hydration, the date is formatted in the user's local timezone
 * 3. No hydration mismatch occurs between server and client
 * 
 * @param dateInput - Date string, Date object, or timestamp
 * @param style - Format style (default: 'datetime')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Object with formatted date and loading state
 * 
 * @example
 * const { formatted, isLoading } = useFormattedDate(order.createdAt, 'datetime');
 * return isLoading ? <Skeleton /> : <span>{formatted}</span>;
 */
export function useFormattedDate(
  dateInput: string | Date | number | null | undefined,
  style: DateFormatStyle = 'datetime',
  locale: string = 'en-US'
): { formatted: string; isLoading: boolean } {
  const [formatted, setFormatted] = useState<string>('...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This only runs on the client after hydration
    const result = formatDate(dateInput, style, locale);
    setFormatted(result);
    setIsLoading(false);
  }, [dateInput, style, locale]);

  return { formatted, isLoading };
}

/**
 * Hook to check if the component has mounted on the client.
 * Useful for conditionally rendering date-sensitive components.
 * 
 * @returns true if mounted on client, false during SSR
 * 
 * @example
 * const isClient = useIsClient();
 * return isClient ? formatDate(date) : '...';
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook that provides a date formatter function that only works on the client.
 * Returns '...' during SSR to prevent hydration mismatches.
 * 
 * @returns Object with formatDate function and isClient state
 * 
 * @example
 * const { formatDate: clientFormatDate, isClient } = useClientDateFormat();
 * return <span>{clientFormatDate(order.createdAt, 'datetime')}</span>;
 */
export function useClientDateFormat() {
  const isClient = useIsClient();

  const formatDateClient = (
    dateInput: string | Date | number | null | undefined,
    style: DateFormatStyle = 'datetime',
    locale: string = 'en-US'
  ): string => {
    if (!isClient) {
      return '...';
    }
    return formatDate(dateInput, style, locale);
  };

  return { formatDate: formatDateClient, isClient };
}
