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
    this.apiKey = process.env.KINGUIN_API_KEY ?? '';

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
   * Check if Kinguin integration is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '' && this.apiKey !== 'your-kinguin-api-key';
  }

  /**
   * Get configuration status message
   */
  getConfigurationStatus(): string {
    if (!this.apiKey || this.apiKey === '') {
      return 'Kinguin API key is not configured. Please set KINGUIN_API_KEY environment variable.';
    }
    if (this.apiKey === 'your-kinguin-api-key') {
      return 'Kinguin API key is still set to placeholder value. Please set a valid KINGUIN_API_KEY.';
    }
    return 'Kinguin integration is configured.';
  }

  /**
   * Fetch a single page of offers from Kinguin
   * @param page Page number (1-indexed)
   * @param pageSize Items per page (default 100)
   * @returns Paginated offers
   */
  async fetchPage(page: number = 1, pageSize: number = 100): Promise<KinguinPaginatedResponse> {
    // Check configuration before making API calls
    if (!this.isConfigured()) {
      throw new Error(`Kinguin integration not configured: ${this.getConfigurationStatus()}`);
    }

    try {
      this.logger.debug(`Fetching Kinguin offers page ${page} (size: ${pageSize})`);
      this.logger.debug(`API URL: ${this.baseUrl}/v1/offers`);
      this.logger.debug(`API Key configured: ${!!this.apiKey} (length: ${this.apiKey?.length || 0})`);

      const response = await this.client.get<KinguinPaginatedResponse>('/v1/offers', {
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
      // Enhanced error logging
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        this.logger.error(
          `Kinguin API request failed:`,
          {
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            data: axiosError.response?.data,
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            headers: {
              authorization: axiosError.config?.headers?.authorization ? '[HIDDEN]' : 'missing',
            }
          }
        );
        
        if (axiosError.response?.status === 404) {
          throw new Error(
            `Kinguin API endpoint not found (404). Please verify:\n` +
            `- API Key is valid and approved by Kinguin\n` +
            `- Base URL is correct: ${this.baseUrl}\n` +
            `- You have access to the offers endpoint\n` +
            `Contact api@kinguin.io if you need API access`
          );
        }
        
        if (axiosError.response?.status === 401) {
          throw new Error(
            `Kinguin API authentication failed (401). Please verify:\n` +
            `- API Key is correct: ${this.apiKey.substring(0, 8)}...\n` +
            `- Token has not expired\n` +
            `- Account has proper permissions`
          );
        }
      }
      
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
