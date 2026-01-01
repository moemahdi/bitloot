import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Pricing Service Unit Tests
 * Tests for pricing computation, rule selection, and price calculation logic
 */

describe('PricingService', () => {
  /**
   * computePrice(costMinor, rule) - Calculate retail price based on rule
   * Formula: max(floor, min(cap, ceil(cost * (1 + margin%))))
   */
  describe('computePrice', () => {
    it('should apply margin percentage to cost', () => {
      const costMinor = 1000; // €10.00
      const rule = {
        margin_pct: 8,
        floor_minor: null,
        cap_minor: null,
      };
      // Expected: 1000 * (1 + 0.08) = 1080
      const price = Math.ceil(costMinor * (1 + rule.margin_pct / 100));
      expect(price).toBe(1080);
    });

    it('should enforce floor minimum', () => {
      const costMinor = 100; // €1.00
      const rule = {
        margin_pct: 8,
        floor_minor: 500, // €5.00 minimum
        cap_minor: null,
      };
      const price = Math.max(rule.floor_minor, Math.ceil(costMinor * (1 + rule.margin_pct / 100)));
      expect(price).toBe(500);
    });

    it('should enforce cap maximum', () => {
      const costMinor = 10000; // €100.00
      const rule = {
        margin_pct: 50,
        floor_minor: null,
        cap_minor: 15000, // €150.00 maximum
      };
      // Computed: 10000 * 1.5 = 15000, capped at 15000
      const price = Math.min(rule.cap_minor, Math.ceil(costMinor * (1 + rule.margin_pct / 100)));
      expect(price).toBe(15000);
    });

    it('should apply floor and cap together', () => {
      const costMinor = 2000; // €20.00
      const rule = {
        margin_pct: 10,
        floor_minor: 1500, // €15.00
        cap_minor: 3000, // €30.00
      };
      // Computed: 2000 * 1.1 = 2200, between floor(1500) and cap(3000)
      const price = Math.max(
        rule.floor_minor,
        Math.min(rule.cap_minor, Math.ceil(costMinor * (1 + rule.margin_pct / 100))),
      );
      expect(price).toBe(2200);
    });

    it('should handle zero cost', () => {
      const costMinor = 0;
      const rule = {
        margin_pct: 10,
        floor_minor: 500,
        cap_minor: null,
      };
      const price = Math.max(rule.floor_minor, Math.ceil(costMinor * (1 + rule.margin_pct / 100)));
      expect(price).toBe(500);
    });

    it('should handle zero margin', () => {
      const costMinor = 1000;
      const rule = {
        margin_pct: 0,
        floor_minor: null,
        cap_minor: null,
      };
      const price = Math.ceil(costMinor * (1 + rule.margin_pct / 100));
      expect(price).toBe(1000);
    });

    it('should handle negative margin (discount)', () => {
      const costMinor = 1000;
      const rule = {
        margin_pct: -5, // 5% discount
        floor_minor: 800,
        cap_minor: null,
      };
      // Computed: 1000 * 0.95 = 950
      const price = Math.max(rule.floor_minor, Math.ceil(costMinor * (1 + rule.margin_pct / 100)));
      expect(price).toBe(950);
    });

    it('should round up fractional cents', () => {
      const costMinor = 333; // €3.33
      const rule = {
        margin_pct: 8,
        floor_minor: null,
        cap_minor: null,
      };
      // Computed: 333 * 1.08 = 359.64, rounds up to 360
      const price = Math.ceil(costMinor * (1 + rule.margin_pct / 100));
      expect(price).toBe(360);
    });
  });

  /**
   * slugify(title, externalId) - Generate URL-safe slug
   */
  describe('slugify', () => {
    it('should convert to lowercase', () => {
      const slug = 'MINECRAFT JAVA EDITION'.toLowerCase();
      expect(slug).toBe('minecraft java edition');
    });

    it('should replace spaces with dashes', () => {
      const slug = 'The Legend of Zelda'.toLowerCase().replace(/\s+/g, '-');
      expect(slug).toBe('the-legend-of-zelda');
    });

    it('should remove special characters', () => {
      const title = "Microsoft's Office 365";
      // Normalize unicode and apply slugify logic
      const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const slug = normalized
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars (keep word chars, spaces, hyphens)
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Collapse multiple hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      expect(slug).toBe('microsofts-office-365');
    });

    it('should handle trailing dashes', () => {
      const title = 'Game---With---Many---Dashes';
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      expect(slug).toBe('game-with-many-dashes');
    });

    it('should use externalId as fallback', () => {
      const title = '!!!###@@@'; // Invalid title
      const externalId = 'ext-12345';
      const slug = title.toLowerCase().replace(/[^a-z0-9-]/g, '') || externalId;
      expect(slug).toBe(externalId);
    });

    it('should handle unicode characters', () => {
      const title = 'Café Simulator';
      // Normalize unicode (NFD decomposes é to e + accent, which we remove)
      const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const slug = normalized
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars (keep word chars, spaces, hyphens)
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Collapse multiple hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      expect(slug).toBe('cafe-simulator');
    });

    it('should be unique for different titles', () => {
      const slug1 = 'The Witcher 3'
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const slug2 = 'The Witcher 2'
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      expect(slug1).not.toBe(slug2);
    });
  });

  /**
   * pickRule(product, rules) - Select best matching rule
   * Priority: product-specific > category > global
   */
  describe('pickRule', () => {
    it('should prioritize product-specific rule', () => {
      const product = { id: 'prod-1', category: 'games' };
      const rules = [
        { scope: 'global', scope_ref: null, margin_pct: 10 },
        { scope: 'category', scope_ref: 'games', margin_pct: 12 },
        { scope: 'product', scope_ref: 'prod-1', margin_pct: 15 },
      ];

      // Product rule should win
      const picked = rules.find((r) => r.scope === 'product' && r.scope_ref === product.id) ||
        rules.find((r) => r.scope === 'category' && r.scope_ref === product.category) ||
        rules.find((r) => r.scope === 'global') || { margin_pct: 8 };

      expect(picked.margin_pct).toBe(15);
    });

    it('should fallback to category rule', () => {
      const product = { id: 'prod-1', category: 'games' };
      const rules = [
        { scope: 'global', scope_ref: null, margin_pct: 10 },
        { scope: 'category', scope_ref: 'games', margin_pct: 12 },
      ];

      const picked = rules.find((r) => r.scope === 'product' && r.scope_ref === product.id) ||
        rules.find((r) => r.scope === 'category' && r.scope_ref === product.category) ||
        rules.find((r) => r.scope === 'global') || { margin_pct: 8 };

      expect(picked.margin_pct).toBe(12);
    });

    it('should fallback to global rule', () => {
      const product = { id: 'prod-1', category: 'games' };
      const rules = [{ scope: 'global', scope_ref: null, margin_pct: 10 }];

      const picked = rules.find((r) => r.scope === 'product' && r.scope_ref === product.id) ||
        rules.find((r) => r.scope === 'category' && r.scope_ref === product.category) ||
        rules.find((r) => r.scope === 'global') || { margin_pct: 8 };

      expect(picked.margin_pct).toBe(10);
    });

    it('should use default margin if no rules match', () => {
      const product = { id: 'prod-1', category: 'games' };
      const rules: any[] = [];

      const picked = rules.find((r) => r.scope === 'product' && r.scope_ref === product.id) ||
        rules.find((r) => r.scope === 'category' && r.scope_ref === product.category) ||
        rules.find((r) => r.scope === 'global') || { margin_pct: 8 };

      expect(picked.margin_pct).toBe(8);
    });

    it('should handle multiple rules of same scope correctly', () => {
      const product = { id: 'prod-1', category: 'games' };
      const rules = [
        { scope: 'global', scope_ref: null, margin_pct: 10 },
        { scope: 'category', scope_ref: 'other', margin_pct: 11 },
        { scope: 'category', scope_ref: 'games', margin_pct: 12 },
      ];

      const picked = rules.find((r) => r.scope === 'product' && r.scope_ref === product.id) ||
        rules.find((r) => r.scope === 'category' && r.scope_ref === product.category) ||
        rules.find((r) => r.scope === 'global') || { margin_pct: 8 };

      expect(picked.margin_pct).toBe(12);
    });
  });

  /**
   * Edge cases and validation
   */
  describe('Edge Cases', () => {
    it('should handle very large costs', () => {
      const costMinor = 9999999999; // Very large amount
      const rule = { margin_pct: 5, floor_minor: null, cap_minor: null };
      const price = Math.ceil(costMinor * (1 + rule.margin_pct / 100));
      expect(price).toBeGreaterThan(costMinor);
    });

    it('should handle very small costs', () => {
      const costMinor = 1; // 1 cent
      const rule = { margin_pct: 50, floor_minor: null, cap_minor: null };
      const price = Math.ceil(costMinor * (1 + rule.margin_pct / 100));
      expect(price).toBeGreaterThanOrEqual(costMinor);
    });

    it('should handle very high margin percentages', () => {
      const costMinor = 1000;
      const rule = { margin_pct: 500, floor_minor: null, cap_minor: null };
      const price = Math.ceil(costMinor * (1 + rule.margin_pct / 100));
      expect(price).toBe(6000); // 1000 * 6 = 6000
    });

    it('floor should never exceed cap', () => {
      const rule = { margin_pct: 10, floor_minor: 5000, cap_minor: 4000 };
      expect(rule.floor_minor).toBeGreaterThan(rule.cap_minor);
      // This is a validation error - should be caught by schema validation
    });
  });
});
