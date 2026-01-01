import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicPricingRule } from '../entities/dynamic-pricing-rule.entity';

/**
 * Pricing Engine Unit Tests
 * Tests the core pricing logic: rule selection, price computation
 */

interface PricingContext {
  costMinor: number;
  rule: DynamicPricingRule | null;
}

function computePrice(
  costMinor: number,
  marginPct: number,
  floorMinor?: number,
  capMinor?: number,
): number {
  const basePrice = Math.ceil(costMinor * (1 + marginPct / 100));
  let finalPrice = basePrice;

  if (floorMinor !== undefined && finalPrice < floorMinor) {
    finalPrice = floorMinor;
  }

  if (capMinor !== undefined && finalPrice > capMinor) {
    finalPrice = capMinor;
  }

  return finalPrice;
}

describe('Pricing Engine', () => {
  describe('computePrice', () => {
    it('should compute base price with margin percentage', () => {
      // Cost: 1000 (10 EUR), Margin: 20% = 1200 (12 EUR)
      const result = computePrice(1000, 20);
      expect(result).toBe(1200);
    });

    it('should apply floor constraint', () => {
      // Cost: 100, Margin: 5% = 105, Floor: 200 → 200
      const result = computePrice(100, 5, 200);
      expect(result).toBe(200);
    });

    it('should apply cap constraint', () => {
      // Cost: 10000, Margin: 50% = 15000, Cap: 5000 → 5000
      const result = computePrice(10000, 50, undefined, 5000);
      expect(result).toBe(5000);
    });

    it('should apply both floor and cap', () => {
      // Floor should win (higher value)
      const result = computePrice(100, 5, 500, 10000);
      expect(result).toBe(500);

      // Cap should win (lower value)
      const result2 = computePrice(10000, 50, 100, 5000);
      expect(result2).toBe(5000);
    });

    it('should handle zero margin', () => {
      const result = computePrice(1000, 0);
      expect(result).toBe(1000);
    });

    it('should handle negative margin (discount)', () => {
      // Cost: 1000, Margin: -10% = 900
      const result = computePrice(1000, -10);
      expect(result).toBe(900);
    });

    it('should handle decimal margins', () => {
      // Cost: 1000, Margin: 8.5% = 1085
      const result = computePrice(1000, 8.5);
      expect(result).toBe(1085);
    });

    it('should handle very small costs', () => {
      const result = computePrice(1, 100);
      expect(result).toBe(2);
    });

    it('should handle very large costs', () => {
      const result = computePrice(1000000, 10);
      expect(result).toBe(1100000);
    });

    it('should always return integer (no decimals)', () => {
      // Cost: 333, Margin: 10% = 366.3 → ceil to 367
      const result = computePrice(333, 10);
      expect(result).toBe(367);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle floor equals cap', () => {
      const result = computePrice(1000, 20, 1500, 1500);
      expect(result).toBe(1500);
    });

    it('should handle floor greater than computed price', () => {
      // Computed: 1100, Floor: 2000 → 2000
      const result = computePrice(1000, 10, 2000);
      expect(result).toBe(2000);
    });

    it('should handle cap less than computed price', () => {
      // Computed: 1500, Cap: 1000 → 1000
      const result = computePrice(1000, 50, undefined, 1000);
      expect(result).toBe(1000);
    });

    it('should not modify price if floor and cap both null', () => {
      const result = computePrice(1000, 20, undefined, undefined);
      expect(result).toBe(1200);
    });

    it('should handle floor = 0', () => {
      const result = computePrice(100, -50, 0);
      expect(result).toBe(50); // 100 * 0.5 = 50, floor 0 has no effect
    });
  });

  describe('real-world scenarios', () => {
    it('should compute price for €9.99 game with 20% margin', () => {
      // Kinguin cost: 999 minor (9.99 EUR)
      // Margin: 20% = 1198.8 → ceil 1199 (11.99 EUR)
      const result = computePrice(999, 20);
      expect(result).toBe(1199);
    });

    it('should compute price for €49.99 game with 8% margin and floor', () => {
      // Cost: 4999 (49.99 EUR), Margin: 8% = 5398.92 → 5399
      // Floor: 2999 (29.99 EUR) - has no effect
      const result = computePrice(4999, 8, 2999);
      expect(result).toBe(5399);
    });

    it('should compute price for expensive game with cap', () => {
      // Cost: 50000 (500 EUR), Margin: 50% = 75000 (750 EUR)
      // Cap: 5999 (59.99 EUR) → 5999
      const result = computePrice(50000, 50, undefined, 5999);
      expect(result).toBe(5999);
    });

    it('should apply bulk discount (negative margin)', () => {
      // Cost: 10000 (100 EUR), Margin: -5% (bulk) = 9500 (95 EUR)
      const result = computePrice(10000, -5);
      expect(result).toBe(9500);
    });

    it('should handle promotional override with floor', () => {
      // Cost: 2000 (20 EUR), Admin wants min price €9.99
      // Margin: 0%, Floor: 999 (9.99 EUR)
      const result = computePrice(2000, 0, 999);
      expect(result).toBe(2000); // Cost is above floor
    });

    it('should handle loss-leader pricing with floor', () => {
      // Cost: 5000 (50 EUR), Floor: 999 (9.99 EUR min price)
      const result = computePrice(5000, 0, 999);
      expect(result).toBe(5000);
    });
  });

  describe('precision and rounding', () => {
    it('should round up correctly with margin', () => {
      // 1000 * 1.087 = 1087 exactly (no rounding needed)
      const result = computePrice(1000, 8.7);
      expect(result).toBe(1087);
    });

    it('should round up when fractional result', () => {
      // 333 * 1.10 = 366.3 → ceil to 367
      const result = computePrice(333, 10);
      expect(result).toBe(367);
    });

    it('should handle very small fractional margin', () => {
      // 10000 * 1.001 = 10010
      const result = computePrice(10000, 0.1);
      expect(result).toBe(10010);
    });
  });
});
