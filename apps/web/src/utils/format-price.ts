/**
 * Central price formatting utility for BitLoot
 * All prices are in EUR (from Kinguin)
 */

/**
 * Format a price value as EUR currency
 * @param amount - Price amount (already in EUR, not cents)
 * @param options - Optional formatting options
 * @returns Formatted price string (e.g., "€14.88")
 */
export function formatPrice(
  amount: number | string | undefined | null,
  options?: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (amount === undefined || amount === null) {
    return 'N/A';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return 'N/A';
  }

  const { showSymbol = true, minimumFractionDigits = 2, maximumFractionDigits = 2 } = options ?? {};

  if (showSymbol) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numAmount);
  }

  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numAmount);
}

/**
 * Format a price for display with € symbol prefix
 * @param amount - Price amount in EUR
 * @returns Formatted string like "€14.88"
 */
export function formatEuroPrice(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) {
    return '€0.00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '€0.00';
  }

  return `€${numAmount.toFixed(2)}`;
}

/**
 * Currency symbol for EUR
 */
export const CURRENCY_SYMBOL = '€';

/**
 * Currency code
 */
export const CURRENCY_CODE = 'EUR';
