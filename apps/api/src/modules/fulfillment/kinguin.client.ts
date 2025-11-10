import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Kinguin API Response - Order Creation
 * @example
 * {
 *   "id": "order-123",
 *   "status": "waiting",
 *   "externalId": "kinguin-ext-456"
 * }
 */
export interface CreateOrderResponse {
  id: string;
  status: 'waiting' | 'processing' | 'ready' | 'failed' | 'cancelled';
  externalId?: string;
}

/**
 * Kinguin API Response - Order Status
 * @example
 * {
 *   "id": "order-123",
 *   "status": "ready",
 *   "key": "XXXXX-XXXXX-XXXXX-XXXXX"
 * }
 */
export interface OrderStatusResponse {
  id: string;
  status: 'waiting' | 'processing' | 'ready' | 'failed' | 'cancelled';
  key?: string;
  error?: string;
}

/**
 * Kinguin API Request - Create Order
 */
export interface CreateOrderRequest {
  offerId: string;
  quantity: number;
}

/**
 * Type-safe Kinguin API client
 * Handles all communication with Kinguin Sales Manager API v1
 *
 * @example
 * const client = new KinguinClient(apiKey, 'https://sandbox.kinguin.net/api/v1');
 * const order = await client.createOrder({ offerId: 'prod-123', quantity: 1 });
 * const status = await client.getOrderStatus(order.id);
 * const key = await client.getKey(order.id);
 */
@Injectable()
export class KinguinClient {
  private readonly logger = new Logger(KinguinClient.name);
  private readonly httpClient: AxiosInstance;

  /**
   * Initialize Kinguin API client
   * @param apiKey Kinguin API key for Bearer token authentication
   * @param baseUrl Kinguin API base URL (e.g., https://sandbox.kinguin.net/api/v1)
   */
  constructor(apiKey: string, baseUrl: string) {
    if (apiKey === '' || apiKey.length === 0) {
      throw new Error('Invalid Kinguin API key');
    }
    if (baseUrl === '' || baseUrl.length === 0) {
      throw new Error('Invalid Kinguin base URL');
    }

    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new order with Kinguin
   * Called after payment is confirmed to initiate license key retrieval
   *
   * @param request Order creation request (offerId, quantity)
   * @returns Order response with ID and initial status
   * @throws Error if API call fails or validation fails
   *
   * @example
   * const order = await client.createOrder({
   *   offerId: 'game-123',
   *   quantity: 1
   * });
   * // Returns: { id: 'order-456', status: 'waiting' }
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const { offerId, quantity } = request ?? {};

      // Validation
      if (offerId === '' || offerId === null || offerId === undefined) {
        throw new Error('Invalid offerId: must be a non-empty string');
      }
      if (typeof quantity !== 'number' || quantity < 1 || quantity > 100) {
        throw new Error('Invalid quantity: must be between 1 and 100');
      }

      this.logger.debug(`Creating Kinguin order for offer ${offerId}, quantity ${quantity}`);

      const response = await this.httpClient.post<CreateOrderResponse>('/orders', {
        offerId,
        quantity,
      });

      if (response.data === null || response.data === undefined) {
        throw new Error('Invalid response from Kinguin API');
      }

      const order: CreateOrderResponse = {
        id: response.data.id,
        status: response.data.status,
        externalId: response.data.externalId,
      };

      this.logger.log(`✅ Kinguin order created: ${order.id} (status: ${order.status})`);

      return order;
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      this.logger.error(
        `❌ Failed to create Kinguin order: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw new Error(`Kinguin order creation failed: ${message}`);
    }
  }

  /**
   * Get the current status of a Kinguin order
   * Used to poll for license key availability
   *
   * @param orderId Kinguin order ID returned from createOrder()
   * @returns Current order status including key if ready
   * @throws Error if API call fails or order not found
   *
   * @example
   * const status = await client.getOrderStatus('order-456');
   * if (status.status === 'ready') {
   *   console.log('Key available:', status.key);
   * }
   */
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    try {
      if (orderId === '' || orderId === null || orderId === undefined) {
        throw new Error('Invalid orderId: must be a non-empty string');
      }

      this.logger.debug(`Fetching Kinguin order status: ${orderId}`);

      const response = await this.httpClient.get<OrderStatusResponse>(`/orders/${orderId}`);

      if (response.data === null || response.data === undefined) {
        throw new Error('Invalid response from Kinguin API');
      }

      const status: OrderStatusResponse = {
        id: response.data.id,
        status: response.data.status,
        key: response.data.key,
        error: response.data.error,
      };

      const hasKey = status.key !== null && status.key !== undefined && status.key !== '';
      const keyStatus = hasKey ? ' (key available)' : '';
      this.logger.debug(`Order ${orderId} status: ${status.status}${keyStatus}`);

      return status;
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      this.logger.error(
        `❌ Failed to fetch Kinguin order status: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw new Error(`Kinguin order status fetch failed: ${message}`);
    }
  }

  /**
   * Retrieve the license key from a Kinguin order
   * Convenience method that calls getOrderStatus() and extracts the key
   *
   * @param orderId Kinguin order ID
   * @returns The license key string
   * @throws Error if order not ready, not found, or API fails
   *
   * @example
   * const key = await client.getKey('order-456');
   * // Returns: 'XXXXX-XXXXX-XXXXX-XXXXX'
   */
  async getKey(orderId: string): Promise<string> {
    try {
      if (orderId === '' || orderId === null || orderId === undefined) {
        throw new Error('Invalid orderId: must be a non-empty string');
      }

      const status = await this.getOrderStatus(orderId);

      const hasKey = status.key !== null && status.key !== undefined && status.key !== '';
      if (!hasKey) {
        throw new Error(`Order not ready or key not available (status: ${status.status})`);
      }

      this.logger.log(`✅ Retrieved license key from Kinguin order: ${orderId}`);

      return status.key as string;
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      this.logger.error(
        `❌ Failed to retrieve key from Kinguin order: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw new Error(`Kinguin key retrieval failed: ${message}`);
    }
  }

  /**
   * Health check for Kinguin API connectivity
   * Used to verify API is reachable before attempting orders
   *
   * @returns true if API is healthy, false otherwise
   *
   * @example
   * if (await client.healthCheck()) {
   *   console.log('Kinguin API is healthy');
   * } else {
   *   console.log('Kinguin API is down');
   * }
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.logger.debug('Performing Kinguin API health check...');

      const response = await this.httpClient.get('/health', {
        timeout: 5000,
      });

      const isHealthy = response.status === 200;

      if (isHealthy) {
        this.logger.log('✅ Kinguin API health check passed');
      } else {
        this.logger.warn(`⚠️ Kinguin API health check returned status ${response.status}`);
      }

      return isHealthy;
    } catch (error: unknown) {
      this.logger.warn(`⚠️ Kinguin API health check failed: ${this.extractErrorMessage(error)}`);
      return false;
    }
  }

  /**
   * Extract error message from various error types
   * Handles axios errors, HTTP errors, and generic errors
   *
   * @param error Error object from axios or other sources
   * @returns Human-readable error message
   *
   * @internal
   */
  private extractErrorMessage(error: unknown): string {
    if (error === null || error === undefined) {
      return 'Unknown error';
    }

    // Axios error with response
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Try to extract from response data
      if (
        axiosError.response?.data !== null &&
        axiosError.response?.data !== undefined &&
        typeof axiosError.response.data === 'object'
      ) {
        const data = axiosError.response.data as Record<string, unknown>;
        const message = data.message;
        if (
          message !== null &&
          message !== undefined &&
          typeof message === 'string' &&
          message !== ''
        ) {
          return message;
        }
        const dataError = data.error;
        if (
          dataError !== null &&
          dataError !== undefined &&
          typeof dataError === 'string' &&
          dataError !== ''
        ) {
          return dataError;
        }
      }

      // Fall back to status and status text
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;
      if (
        status !== null &&
        status !== undefined &&
        status !== 0 &&
        statusText !== null &&
        statusText !== undefined &&
        statusText !== ''
      ) {
        return `${status} ${statusText}`;
      }

      // Timeout or connection error
      if (axiosError.code === 'ECONNABORTED') {
        return 'Request timeout (30s)';
      }
      if (
        axiosError.message !== null &&
        axiosError.message !== undefined &&
        axiosError.message !== ''
      ) {
        return axiosError.message;
      }
    }

    // Standard Error object
    if (error instanceof Error) {
      return error.message;
    }

    // String error
    if (typeof error === 'string') {
      return error;
    }

    // Fallback
    return `Unexpected error: ${JSON.stringify(error)}`.slice(0, 100);
  }
}
