import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError, isAxiosError } from 'axios';

/**
 * Kinguin Product Object (from v1/products API)
 * Based on official Kinguin eCommerce API documentation
 */
export interface KinguinProductRaw {
  kinguinId: number;
  productId: string;
  name: string;
  originalName?: string;
  description?: string;
  developers?: string[];
  publishers?: string[];
  genres?: string[];
  platform: string;
  releaseDate?: string;
  qty: number;
  textQty: number;
  price: number;
  cheapestOfferId?: string[];
  isPreorder: boolean;
  metacriticScore?: number;
  regionalLimitations?: string;
  countryLimitation?: string[];
  regionId?: number;
  activationDetails?: string;
  videos?: { video_id: string }[];
  languages?: string[];
  systemRequirements?: {
    system: string;
    requirement: string[];
  }[];
  tags?: string[];
  offers?: KinguinOfferRaw[];
  offersCount?: number;
  totalQty?: number;
  merchantName?: string[];
  ageRating?: string;
  steam?: string;
  images?: {
    screenshots?: { url: string; thumbnail: string }[];
    cover?: { url: string; thumbnail: string };
  };
  updatedAt: string;
}

/**
 * Kinguin Offer Object (nested within product)
 */
export interface KinguinOfferRaw {
  name: string;
  offerId: string;
  price: number;
  qty: number;
  textQty: number;
  merchantName?: string;
  isPreorder: boolean;
  releaseDate?: string;
}

/**
 * Response format from Kinguin v1/products search API
 */
export interface KinguinPaginatedResponse {
  results: KinguinProductRaw[];
  item_count: number;
}

/**
 * Kinguin eCommerce API Client
 * Based on official Kinguin eCommerce API documentation
 * Uses X-Api-Key header authentication
 * Base URL: gateway.kinguin.net/esa/api
 */
@Injectable()
export class KinguinCatalogClient {
  private readonly logger = new Logger(KinguinCatalogClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly requestDelayMs = 100; // Respect rate limits

  constructor() {
    // Default to official Kinguin eCommerce API gateway
    this.baseUrl = process.env.KINGUIN_BASE_URL ?? 'https://gateway.kinguin.net/esa/api';
    this.apiKey = process.env.KINGUIN_API_KEY ?? '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        // Kinguin uses X-Api-Key header, NOT Bearer token!
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Check if Kinguin integration is properly configured
   */
  isConfigured(): boolean {
    return (
      this.apiKey !== undefined &&
      this.apiKey !== null &&
      this.apiKey !== '' &&
      this.apiKey !== 'your-kinguin-api-key'
    );
  }

  /**
   * Get configuration status message
   */
  getConfigurationStatus(): string {
    if (this.apiKey === undefined || this.apiKey === null || this.apiKey === '') {
      return 'Kinguin API key is not configured. Please set KINGUIN_API_KEY environment variable.';
    }
    if (this.apiKey === 'your-kinguin-api-key') {
      return 'Kinguin API key is still set to placeholder value. Please set a valid KINGUIN_API_KEY.';
    }
    return 'Kinguin integration is configured.';
  }

  /**
   * Fetch a page of products from Kinguin
   * Uses GET /v1/products with pagination
   * @param page Page number (1-indexed)
   * @param pageSize Items per page (default 100, max 100)
   * @returns Paginated products
   */
  async fetchPage(page: number = 1, pageSize: number = 100): Promise<KinguinPaginatedResponse> {
    // Check configuration before making API calls
    if (!this.isConfigured()) {
      throw new Error(`Kinguin integration not configured: ${this.getConfigurationStatus()}`);
    }

    try {
      this.logger.debug(`Fetching Kinguin products page ${page} (limit: ${pageSize})`);
      this.logger.debug(`API URL: ${this.baseUrl}/v1/products`);
      this.logger.debug(`API Key configured: ${this.apiKey !== '' && this.apiKey !== undefined && this.apiKey !== null} (length: ${this.apiKey?.length ?? 0})`);

      // Using Kinguin v1 products API - search endpoint with pagination
      const response = await this.client.get<KinguinPaginatedResponse>('/v1/products', {
        params: {
          page,
          limit: Math.min(pageSize, 100), // Kinguin uses 'limit', max 100
        },
      });

      this.logger.debug(
        `Fetched page ${page}: ${response.data.results?.length ?? 0} products, total: ${response.data.item_count}`,
      );

      return response.data;
    } catch (error: unknown) {
      // Enhanced error logging with proper typing
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        this.logger.error(
          `Kinguin API request failed:`,
          {
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            data: axiosError.response?.data,
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            headers: {
              'X-Api-Key': axiosError.config?.headers?.['X-Api-Key'] !== undefined ? '[CONFIGURED]' : 'missing',
            }
          }
        );
        
        if (axiosError.response?.status === 404) {
          throw new Error(
            `Kinguin API endpoint not found (404). Please verify:\n` +
            `- API Key is valid and approved by Kinguin\n` +
            `- Base URL is correct: ${this.baseUrl}\n` +
            `- You have access to the products endpoint\n` +
            `Apply for access at: https://www.kinguin.net/integration`
          );
        }
        
        if (axiosError.response?.status === 401) {
          throw new Error(
            `Kinguin API authentication failed (401). Please verify:\n` +
            `- API Key is correct: ${this.apiKey.substring(0, 8)}...\n` +
            `- Key is configured in Kinguin Dashboard\n` +
            `- Account has proper permissions\n` +
            `Configure at: https://www.kinguin.net/integration/dashboard/stores`
          );
        }
      }
      
      this.logger.error(
        `Failed to fetch Kinguin products page ${page}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Maximum number of products to sync from Kinguin
   * This is a hard limit to control initial sync size - increase when ready to scale
   * Set to 500 for initial development, increase to 10000+ for production
   */
  private static readonly MAX_PRODUCTS_LIMIT = 500;

  /**
   * Fetch ALL products from Kinguin with automatic pagination
   * @param maxPages Limit pages to process (useful for testing)
   * @param maxProducts Limit total products to fetch (defaults to MAX_PRODUCTS_LIMIT)
   * @yields Each product as it's fetched
   */
  async *fetchAllProducts(maxPages?: number, maxProducts?: number): AsyncGenerator<KinguinProductRaw> {
    const productLimit = maxProducts ?? KinguinCatalogClient.MAX_PRODUCTS_LIMIT;
    let page = 1;
    let hasMore = true;
    let totalFetched = 0;

    this.logger.log(`📦 Product sync limit: ${productLimit} products (adjust MAX_PRODUCTS_LIMIT to increase)`);

    while (hasMore && (maxPages === undefined || page <= maxPages)) {
      try {
        const response = await this.fetchPage(page, 100);
        const products = response.results ?? [];
        const totalProducts = response.item_count ?? 0;

        for (const product of products) {
          // Check if we've hit the product limit
          if (totalFetched >= productLimit) {
            this.logger.log(`🛑 Reached product limit of ${productLimit}. Stopping sync.`);
            hasMore = false;
            break;
          }

          yield product;
          totalFetched++;
        }

        // Check if we've hit the limit or if there are more pages
        if (totalFetched >= productLimit) {
          hasMore = false;
        } else {
          // Calculate based on total count and items fetched so far
          hasMore = products.length > 0 && totalFetched < totalProducts;
          page++;
        }

        // Respect rate limits with delay between requests
        if (hasMore) {
          await this.delay(this.requestDelayMs);
        }
      } catch (error: unknown) {
        this.logger.error(`Error fetching page ${page}, stopping iteration`);
        hasMore = false;
        throw error;
      }
    }

    this.logger.log(`✅ Completed fetching products (${page - 1} pages, ${totalFetched} products total, limit was ${productLimit})`);
  }

  /**
   * @deprecated Use fetchAllProducts instead - renamed to match API terminology
   */
  async *fetchAllOffers(maxPages?: number): AsyncGenerator<KinguinProductRaw> {
    yield* this.fetchAllProducts(maxPages);
  }

  /**
   * Search products by name
   * Uses GET /v1/products with name parameter
   * @param query Search query (minimum 3 characters)
   * @param options Optional filters (platform, genre, limit)
   * @returns Search results with products and total count
   */
  async searchProducts(
    query: string,
    options?: {
      platform?: string;
      genre?: string;
      limit?: number;
      page?: number;
    },
  ): Promise<KinguinPaginatedResponse> {
    if (!this.isConfigured()) {
      throw new Error(`Kinguin integration not configured: ${this.getConfigurationStatus()}`);
    }

    if (query.length < 3) {
      throw new Error('Search query must be at least 3 characters');
    }

    try {
      this.logger.debug(`Searching Kinguin products for: "${query}"`);

      const response = await this.client.get<KinguinPaginatedResponse>('/v1/products', {
        params: {
          name: query,
          page: options?.page ?? 1,
          limit: Math.min(options?.limit ?? 25, 100),
          ...(options?.platform !== undefined && options.platform !== '' ? { platform: options.platform } : {}),
          ...(options?.genre !== undefined && options.genre !== '' ? { genre: options.genre } : {}),
        },
      });

      this.logger.debug(
        `Search for "${query}" returned ${response.data.results?.length ?? 0} products (total: ${response.data.item_count})`,
      );

      return response.data;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to search Kinguin products for "${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get a single product by Kinguin ID
   * Uses GET /v1/products/{kinguinId}
   * @param kinguinId Kinguin product ID (numeric)
   * @returns Single product or null if not found
   */
  async getProduct(kinguinId: number | string): Promise<KinguinProductRaw | null> {
    try {
      this.logger.debug(`Fetching Kinguin product ${kinguinId}`);

      const response = await this.client.get<KinguinProductRaw>(`/v1/products/${kinguinId}`);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.debug(`Product ${kinguinId} not found or out of stock`);
        return null;
      }
      this.logger.error(
        `Failed to fetch product ${kinguinId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get a single product by Product ID (v2 endpoint)
   * Uses GET /v2/products/{productId}
   * @param productId Product ID (string format, e.g., "5c9b5f6b2539a4e8f172916a")
   * @returns Single product or null if not found
   * @see https://www.kinguin.net/integration/docs/api/products/v2/README.md#get-product
   */
  async getProductV2(productId: string): Promise<KinguinProductRaw | null> {
    try {
      this.logger.debug(`Fetching Kinguin product v2 ${productId}`);

      const response = await this.client.get<KinguinProductRaw>(`/v2/products/${productId}`);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.debug(`Product ${productId} not found or out of stock`);
        return null;
      }
      this.logger.error(
        `Failed to fetch product v2 ${productId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * @deprecated Use getProduct instead - renamed to match API terminology
   */
  async getOffer(offerId: string): Promise<KinguinProductRaw | null> {
    return this.getProduct(offerId);
  }

  /**
   * Check API health/connectivity by fetching first page of products
   * @returns true if API is reachable and returns valid data
   */
  async checkHealth(): Promise<boolean> {
    try {
      this.logger.debug('Checking Kinguin API health');
      
      // Test by fetching a small page of products
      const response = await this.client.get<KinguinPaginatedResponse>('/v1/products', {
        params: { page: 1, limit: 1 },
      });
      
      const isHealthy = response.status === 200 && response.data.item_count !== undefined;
      if (isHealthy) {
        this.logger.log(`Kinguin API health check passed (${response.data.item_count} products available)`);
      }
      return isHealthy;
    } catch (error) {
      this.logger.error(
        `Kinguin API health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Get list of available regions
   * GET /v1/regions
   * @see https://www.kinguin.net/integration/docs/api/products/v1/README.md#get-regions
   * @returns Array of regions with id and name
   */
  async getRegions(): Promise<{ id: number; name: string }[]> {
    const response = await this.client.get<{ id: number; name: string }[]>('/v1/regions');
    return response.data;
  }

  /**
   * Get list of available platforms
   * GET /v1/platforms
   * @see https://www.kinguin.net/integration/docs/api/products/v1/README.md#get-platforms
   * @returns Array of platform names
   */
  async getPlatforms(): Promise<string[]> {
    const response = await this.client.get<string[]>('/v1/platforms');
    return response.data;
  }

  /**
   * Get list of available genres
   * GET /v1/genres
   * @see https://www.kinguin.net/integration/docs/api/products/v1/README.md#get-genres
   * @returns Array of genre names
   */
  async getGenres(): Promise<string[]> {
    const response = await this.client.get<string[]>('/v1/genres');
    return response.data;
  }

  /**
   * Delay execution (for rate limiting)
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
