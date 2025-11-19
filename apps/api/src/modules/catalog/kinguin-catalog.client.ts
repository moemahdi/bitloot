import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface KinguinOfferRaw {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  platform: string;
  region: string;
  drm?: string;
  category: string;
  price: number;
  price_minor: number;
  currency: string;
  age_rating?: number;
  rating?: number;
  review_count?: number;
}

export interface KinguinPaginatedResponse {
  offers: KinguinOfferRaw[];
  page: number;
  size: number;
  total: number;
  pages: number;
}

/**
 * Kinguin Sales Manager API Client
 * Handles pagination, rate limiting, and error handling
 */
@Injectable()
export class KinguinCatalogClient {
  private readonly logger = new Logger(KinguinCatalogClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly requestDelayMs = 100; // Respect rate limits

  constructor() {
    this.baseUrl = process.env.KINGUIN_BASE_URL ?? 'https://api.kinguin.net';
    this.apiKey = process.env.KINGUIN_API_KEY!;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Fetch a single page of offers from Kinguin
   * @param page Page number (1-indexed)
   * @param pageSize Items per page (default 100)
   * @returns Paginated offers
   */
  async fetchPage(page: number = 1, pageSize: number = 100): Promise<KinguinPaginatedResponse> {
    try {
      this.logger.debug(`Fetching Kinguin offers page ${page} (size: ${pageSize})`);

      const response = await this.client.get<KinguinPaginatedResponse>('/v2/offers', {
        params: {
          page,
          size: Math.min(pageSize, 100), // Enforce max 100 per page
        },
      });

      this.logger.debug(
        `Fetched page ${page}: ${response.data.offers.length} offers, total: ${response.data.total}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch Kinguin offers page ${page}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Fetch ALL offers from Kinguin with automatic pagination
   * @param maxPages Limit pages to process (useful for testing)
   * @yields Each offer as it's fetched
   */
  async *fetchAllOffers(maxPages?: number): AsyncGenerator<KinguinOfferRaw> {
    let page = 1;
    let hasMore = true;

    while (hasMore && (maxPages === undefined || page <= maxPages)) {
      try {
        const response = await this.fetchPage(page, 100);

        for (const offer of response.offers) {
          yield offer;
        }

        // Check if there are more pages
        hasMore = page < response.pages;
        page++;

        // Respect rate limits with delay between requests
        if (hasMore) {
          await this.delay(this.requestDelayMs);
        }
      } catch (error) {
        this.logger.error(`Error fetching page ${page}, stopping iteration`);
        hasMore = false;
        throw error;
      }
    }

    this.logger.log(`Completed fetching all offers (${page - 1} pages total)`);
  }

  /**
   * Get a single offer by ID
   * @param offerId Kinguin offer ID
   * @returns Single offer or null if not found
   */
  async getOffer(offerId: string): Promise<KinguinOfferRaw | null> {
    try {
      this.logger.debug(`Fetching Kinguin offer ${offerId}`);

      const response = await this.client.get<KinguinOfferRaw>(`/v2/offers/${offerId}`);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.debug(`Offer ${offerId} not found`);
        return null;
      }
      this.logger.error(
        `Failed to fetch offer ${offerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Check API health/connectivity
   * @returns true if API is reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      this.logger.debug('Checking Kinguin API health');
      await this.client.get('/v2/health');
      this.logger.log('Kinguin API health check passed');
      return true;
    } catch (error) {
      this.logger.error(
        `Kinguin API health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Delay execution (for rate limiting)
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
