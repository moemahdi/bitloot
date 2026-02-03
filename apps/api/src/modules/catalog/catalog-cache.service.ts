import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Cache keys for catalog data
 * Format: catalog:{type}:{params}
 */
export const CACHE_KEYS = {
  FEATURED_PRODUCTS: (limit: number) => `catalog:featured:${limit}`,
  SECTION_PRODUCTS: (sectionKey: string, limit: number) => `catalog:section:${sectionKey}:${limit}`,
  CATEGORIES: 'catalog:categories',
  FILTERS: 'catalog:filters',
  PRODUCT_BY_SLUG: (slug: string) => `catalog:product:${slug}`,
} as const;

/**
 * Cache TTL values in seconds
 * Longer TTL for less frequently changing data
 */
export const CACHE_TTL = {
  FEATURED_PRODUCTS: 300, // 5 minutes - changes when admin updates featured
  SECTION_PRODUCTS: 300,  // 5 minutes - homepage sections
  CATEGORIES: 600,        // 10 minutes - rarely changes
  FILTERS: 600,           // 10 minutes - rarely changes
  PRODUCT_BY_SLUG: 180,   // 3 minutes - product details (more dynamic)
} as const;

/**
 * CatalogCacheService - Redis-backed caching for catalog queries
 * 
 * Provides caching for high-traffic, read-heavy catalog endpoints:
 * - Featured products (homepage)
 * - Section products (trending, featured_games, etc.)
 * - Categories and filters (rarely change)
 * - Individual product lookups
 * 
 * Cache invalidation strategies:
 * 1. TTL-based expiration (automatic)
 * 2. Manual invalidation on product updates
 * 3. Pattern-based invalidation for bulk operations
 */
@Injectable()
export class CatalogCacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(CatalogCacheService.name);
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    // Allow disabling cache via env var for testing
    this.enabled = this.configService.get<string>('CATALOG_CACHE_ENABLED') !== 'false';

    // Connect and log status
    this.redis.connect().then(() => {
      this.logger.log(`Redis cache connected (enabled: ${this.enabled})`);
    }).catch((err: Error) => {
      this.logger.warn(`Redis cache connection failed, running without cache: ${err.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  /**
   * Get cached value by key
   * Returns null if not found or cache disabled
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const cached = await this.redis.get(key);
      if (cached !== null) {
        this.logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(cached) as T;
      }
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.warn(`Cache GET error for ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   * Silently fails if cache is disabled or Redis error
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      this.logger.warn(`Cache SET error for ${key}: ${(error as Error).message}`);
    }
  }

  /**
   * Delete cached value by exact key
   */
  async delete(key: string): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.redis.del(key);
      this.logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache DELETE error for ${key}: ${(error as Error).message}`);
    }
  }

  /**
   * Delete all cached values matching a pattern
   * Use for bulk invalidation (e.g., after sync)
   * @param pattern Redis glob pattern (e.g., "catalog:*")
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.enabled) return 0;

    try {
      // Use SCAN for production-safe pattern deletion
      let cursor = '0';
      let deletedCount = 0;
      
      do {
        const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = newCursor;
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      this.logger.log(`Cache INVALIDATE pattern "${pattern}": ${deletedCount} keys deleted`);
      return deletedCount;
    } catch (error) {
      this.logger.warn(`Cache INVALIDATE error for pattern ${pattern}: ${(error as Error).message}`);
      return 0;
    }
  }

  // ============ HIGH-LEVEL CACHE METHODS ============

  /**
   * Get or set featured products cache
   */
  async getFeaturedProducts<T>(limit: number, fetcher: () => Promise<T>): Promise<T> {
    const key = CACHE_KEYS.FEATURED_PRODUCTS(limit);
    
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    await this.set(key, data, CACHE_TTL.FEATURED_PRODUCTS);
    return data;
  }

  /**
   * Get or set section products cache
   */
  async getSectionProducts<T>(sectionKey: string, limit: number, fetcher: () => Promise<T>): Promise<T> {
    const key = CACHE_KEYS.SECTION_PRODUCTS(sectionKey, limit);
    
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    await this.set(key, data, CACHE_TTL.SECTION_PRODUCTS);
    return data;
  }

  /**
   * Get or set categories cache
   */
  async getCategories<T>(fetcher: () => Promise<T>): Promise<T> {
    const key = CACHE_KEYS.CATEGORIES;
    
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    await this.set(key, data, CACHE_TTL.CATEGORIES);
    return data;
  }

  /**
   * Get or set filters cache
   */
  async getFilters<T>(fetcher: () => Promise<T>): Promise<T> {
    const key = CACHE_KEYS.FILTERS;
    
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    await this.set(key, data, CACHE_TTL.FILTERS);
    return data;
  }

  /**
   * Get or set product by slug cache
   */
  async getProductBySlug<T>(slug: string, fetcher: () => Promise<T>): Promise<T> {
    const key = CACHE_KEYS.PRODUCT_BY_SLUG(slug);
    
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    // Only cache if product exists (not null)
    if (data !== null) {
      await this.set(key, data, CACHE_TTL.PRODUCT_BY_SLUG);
    }
    return data;
  }

  // ============ INVALIDATION METHODS ============

  /**
   * Invalidate featured products cache
   * Call when: admin changes featured status, featured order, or publishes/unpublishes
   */
  async invalidateFeaturedProducts(): Promise<void> {
    await this.deletePattern('catalog:featured:*');
  }

  /**
   * Invalidate section products cache
   * Call when: admin changes product section assignment
   */
  async invalidateSectionProducts(sectionKey?: string): Promise<void> {
    if (sectionKey !== undefined) {
      await this.deletePattern(`catalog:section:${sectionKey}:*`);
    } else {
      await this.deletePattern('catalog:section:*');
    }
  }

  /**
   * Invalidate single product cache
   * Call when: product is updated
   */
  async invalidateProduct(slug: string): Promise<void> {
    await this.delete(CACHE_KEYS.PRODUCT_BY_SLUG(slug));
  }

  /**
   * Invalidate categories and filters cache
   * Call when: products are added/removed, categories change
   */
  async invalidateCategoriesAndFilters(): Promise<void> {
    await this.delete(CACHE_KEYS.CATEGORIES);
    await this.delete(CACHE_KEYS.FILTERS);
  }

  /**
   * Invalidate all catalog caches
   * Call when: bulk sync, major catalog changes
   */
  async invalidateAll(): Promise<number> {
    return this.deletePattern('catalog:*');
  }

  /**
   * Get cache statistics (for admin monitoring)
   */
  async getStats(): Promise<{
    enabled: boolean;
    connected: boolean;
    keyCount: number;
  }> {
    try {
      // Ping to check connection
      await this.redis.ping();
      
      // Count catalog keys
      let keyCount = 0;
      let cursor = '0';
      do {
        const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', 'catalog:*', 'COUNT', 1000);
        cursor = newCursor;
        keyCount += keys.length;
      } while (cursor !== '0');

      return {
        enabled: this.enabled,
        connected: true,
        keyCount,
      };
    } catch {
      return {
        enabled: this.enabled,
        connected: false,
        keyCount: 0,
      };
    }
  }
}
