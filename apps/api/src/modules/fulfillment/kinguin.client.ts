import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Kinguin Order Status (from API documentation)
 * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#order-statuses
 */
export type KinguinOrderStatus = 'processing' | 'completed' | 'canceled' | 'refunded';

/**
 * Kinguin Key Status (from API documentation)
 * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#key-statuses
 */
export type KinguinKeyStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'DELIVERED'
  | 'RETURNED'
  | 'REFUNDED'
  | 'CANCELED';

/**
 * Kinguin Key Object (from API documentation - v2 endpoint)
 * @see https://www.kinguin.net/integration/docs/api/order/v2/README.md#key-object
 */
export interface KinguinKeyObject {
  id: string;
  serial: string;
  type: 'text/plain' | 'image/jpeg' | 'image/png' | 'image/gif';
  name: string;
  kinguinId: number;
  offerId: string;
  productId: string;
}

/**
 * Kinguin Order Product (from API documentation)
 * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#order-object
 */
export interface KinguinOrderProduct {
  kinguinId: number;
  offerId: string;
  productId: string;
  qty: number;
  name: string;
  price: number;
  totalPrice: number;
  requestPrice: number;
  isPreorder: boolean;
  releaseDate?: string;
  keyType?: string;
  keys?: {
    id: string;
    status: KinguinKeyStatus;
  }[];
}

/**
 * Kinguin Order Object (from API documentation)
 * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#order-object
 */
export interface KinguinOrderObject {
  orderId: string;
  orderExternalId?: string;
  kinguinOrderId?: number;
  totalPrice: number;
  requestTotalPrice: number;
  paymentPrice: number;
  status: KinguinOrderStatus;
  userEmail: string;
  storeId: number;
  createdAt: string;
  totalQty: number;
  isPreorder: boolean;
  preorderReleaseDate?: string;
  products: KinguinOrderProduct[];
}

/**
 * Kinguin API Request - Place Order v1
 * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#place-an-order
 */
export interface PlaceOrderProductV1 {
  kinguinId: number;
  qty: number;
  price: number;
  keyType?: 'text'; // Only 'text' supported for specific key type
  offerId?: string; // Required only for wholesale purchases
}

/**
 * Kinguin API Request - Place Order v2
 * @see https://www.kinguin.net/integration/docs/api/order/v2/README.md#place-an-order
 */
export interface PlaceOrderProductV2 {
  productId: string;
  qty: number;
  price: number;
  keyType?: 'text';
  offerId?: string;
}

/**
 * Kinguin API Request - Search Orders
 * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#search-orders
 */
export interface SearchOrdersParams {
  page?: number;
  limit?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
  kinguinId?: number;
  productId?: string;
  orderId?: string;
  orderExternalId?: string;
  status?: KinguinOrderStatus;
  isPreorder?: 'yes' | 'no';
}

/**
 * Kinguin API Response - Search Orders
 * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#search-orders
 */
export interface SearchOrdersResponse {
  results: KinguinOrderObject[];
  item_count: number;
}

export interface PlaceOrderRequestV1 {
  products: PlaceOrderProductV1[];
  orderExternalId?: string;
}

export interface PlaceOrderRequestV2 {
  products: PlaceOrderProductV2[];
  orderExternalId?: string;
}

/**
 * Kinguin Error Response (from API documentation)
 * @see https://www.kinguin.net/integration/docs/api/ErrorsCodes.md
 */
export interface KinguinErrorResponse {
  kind:
    | 'ConstraintViolation'
    | 'Error'
    | 'HttpClient'
    | 'Http'
    | 'Authorization'
    | 'InsufficientBalance'
    | 'OrderFailed'
    | 'Preorder'
    | 'ProductUnavailable'
    | 'OrderNotFound'
    | 'ResourceLock'
    | 'OrderNotSupported'
    | 'NoKeysToReturn';
  status: number;
  title: string;
  detail: string;
  path: string;
  method: string;
  trace: string;
  timestamp: string;
  propertyPath?: string;
  invalidValue?: unknown;
}

/**
 * Legacy interfaces for backward compatibility
 * @deprecated Use new typed interfaces above
 */
export interface CreateOrderRequest {
  offerId: string;
  quantity: number;
}

export interface CreateOrderResponse {
  id: string;
  status: KinguinOrderStatus | 'waiting' | 'ready' | 'failed' | 'cancelled';
  externalId?: string;
}

export interface OrderStatusResponse {
  id: string;
  status: KinguinOrderStatus | 'waiting' | 'ready' | 'failed' | 'cancelled';
  key?: string;
  /** Content type of the key (text/plain, image/jpeg, image/png, image/gif) */
  keyType?: 'text/plain' | 'image/jpeg' | 'image/png' | 'image/gif';
  error?: string;
}

/**
 * Type-safe Kinguin API client
 * Handles all communication with Kinguin eCommerce API (v1 and v2)
 *
 * @see https://www.kinguin.net/integration/docs/api/README.md
 *
 * @example
 * const client = new KinguinClient(apiKey, 'https://gateway.kinguin.net/esa/api');
 * const order = await client.placeOrderV1({
 *   products: [{ kinguinId: 12345, qty: 1, price: 9.99 }]
 * });
 * const status = await client.getOrder(order.orderId);
 * const keys = await client.getKeysV2(order.orderId);
 */
@Injectable()
export class KinguinClient {
  private readonly logger = new Logger(KinguinClient.name);
  private readonly httpClient: AxiosInstance;

  /**
   * Initialize Kinguin API client
   *
   * @param apiKey Kinguin API key for X-Api-Key header authentication
   * @param baseUrl Kinguin API base URL
   *   - Production: https://gateway.kinguin.net/esa/api
   *   - Sandbox: https://gateway.sandbox.kinguin.net/esa/api
   *
   * @see https://www.kinguin.net/integration/docs/api/README.md#environments
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
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Place an order using Kinguin API v1 (uses kinguinId)
   *
   * @param request Order creation request with products array
   * @returns Order response with orderId and status
   * @throws Error if API call fails or validation fails
   *
   * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#place-an-order
   *
   * @example
   * const order = await client.placeOrderV1({
   *   products: [{ kinguinId: 12345, qty: 1, price: 9.99 }],
   *   orderExternalId: 'my-order-123'
   * });
   * // Returns: { orderId: '...', status: 'processing', ... }
   */
  async placeOrderV1(request: PlaceOrderRequestV1): Promise<KinguinOrderObject> {
    try {
      const { products, orderExternalId } = request ?? {};

      // Validation
      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('Invalid products: must be a non-empty array');
      }
      if (products.length > 10) {
        throw new Error('Invalid products: maximum 10 items per order (1000 for wholesale)');
      }

      for (const product of products) {
        if (typeof product.kinguinId !== 'number' || product.kinguinId <= 0) {
          throw new Error('Invalid kinguinId: must be a positive number');
        }
        if (typeof product.qty !== 'number' || product.qty < 1 || product.qty > 9) {
          throw new Error('Invalid qty: must be between 1 and 9 per offer (100 for wholesale)');
        }
        if (typeof product.price !== 'number' || product.price <= 0) {
          throw new Error('Invalid price: must be a positive number');
        }
      }

      this.logger.debug(
        `Creating Kinguin order v1 for ${products.length} product(s), external: ${orderExternalId ?? 'none'}`,
      );

      const payload: PlaceOrderRequestV1 = { products };
      if (orderExternalId !== undefined && orderExternalId !== null && orderExternalId !== '') {
        payload.orderExternalId = orderExternalId;
      }

      const response = await this.httpClient.post<KinguinOrderObject>('/v1/order', payload);

      if (response.data === null || response.data === undefined) {
        throw new Error('Invalid response from Kinguin API');
      }

      this.logger.log(
        `✅ Kinguin order created v1: ${response.data.orderId} (status: ${response.data.status})`,
      );

      return response.data;
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      this.logger.error(
        `❌ Failed to create Kinguin order v1: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw new Error(`Kinguin order creation failed: ${message}`);
    }
  }

  /**
   * Place an order using Kinguin API v2 (uses productId)
   *
   * @param request Order creation request with products array
   * @returns Order response with orderId and status
   * @throws Error if API call fails or validation fails
   *
   * @see https://www.kinguin.net/integration/docs/api/order/v2/README.md#place-an-order
   *
   * @example
   * const order = await client.placeOrderV2({
   *   products: [{ productId: '5c9b5f6b...', qty: 1, price: 9.99 }],
   *   orderExternalId: 'my-order-123'
   * });
   */
  async placeOrderV2(request: PlaceOrderRequestV2): Promise<KinguinOrderObject> {
    try {
      const { products, orderExternalId } = request ?? {};

      // Validation
      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('Invalid products: must be a non-empty array');
      }
      if (products.length > 10) {
        throw new Error('Invalid products: maximum 10 items per order (1000 for wholesale)');
      }

      for (const product of products) {
        if (typeof product.productId !== 'string' || product.productId === '') {
          throw new Error('Invalid productId: must be a non-empty string');
        }
        if (typeof product.qty !== 'number' || product.qty < 1 || product.qty > 9) {
          throw new Error('Invalid qty: must be between 1 and 9 per offer (100 for wholesale)');
        }
        if (typeof product.price !== 'number' || product.price <= 0) {
          throw new Error('Invalid price: must be a positive number');
        }
      }

      const payload: PlaceOrderRequestV2 = { products };
      if (orderExternalId !== undefined && orderExternalId !== null && orderExternalId !== '') {
        payload.orderExternalId = orderExternalId;
      }

      this.logger.debug(
        `Creating Kinguin order v2 for ${products.length} product(s), external: ${orderExternalId ?? 'none'}`,
      );
      this.logger.debug(`[Kinguin V2] Request payload: ${JSON.stringify(payload, null, 2)}`);

      const response = await this.httpClient.post<KinguinOrderObject>('/v2/order', payload);

      if (response.data === null || response.data === undefined) {
        throw new Error('Invalid response from Kinguin API');
      }

      this.logger.log(
        `✅ Kinguin order created v2: ${response.data.orderId} (status: ${response.data.status})`,
      );

      return response.data;
    } catch (error: unknown) {
      // Enhanced error logging for debugging
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.logger.error(
          `[Kinguin V2] API Error - Status: ${axiosError.response?.status}, Body: ${JSON.stringify(axiosError.response?.data ?? 'no body')}`,
        );
      }

      const message = this.extractErrorMessage(error);
      this.logger.error(
        `❌ Failed to create Kinguin order v2: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw new Error(`Kinguin order creation failed: ${message}`);
    }
  }

  /**
   * Get order details by orderId (v1 endpoint)
   *
   * @param orderId Kinguin order ID returned from placeOrderV1/V2
   * @returns Full order object with products and status
   * @throws Error if API call fails or order not found
   *
   * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#get-an-order
   */
  async getOrder(orderId: string): Promise<KinguinOrderObject> {
    try {
      if (orderId === '' || orderId === null || orderId === undefined) {
        throw new Error('Invalid orderId: must be a non-empty string');
      }

      this.logger.debug(`Fetching Kinguin order: ${orderId}`);

      const response = await this.httpClient.get<KinguinOrderObject>(`/v1/order/${orderId}`);

      if (response.data === null || response.data === undefined) {
        throw new Error('Invalid response from Kinguin API');
      }

      this.logger.debug(`Order ${orderId} status: ${response.data.status}`);

      return response.data;
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      this.logger.error(
        `❌ Failed to fetch Kinguin order: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw new Error(`Kinguin order fetch failed: ${message}`);
    }
  }

  /**
   * Search orders with optional filters (v1 endpoint)
   *
   * @param params Search parameters (page, limit, filters)
   * @returns Paginated list of orders matching criteria
   * @throws Error if API call fails
   *
   * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#search-orders
   *
   * @example
   * const orders = await client.searchOrders({
   *   status: 'completed',
   *   page: 1,
   *   limit: 25
   * });
   */
  async searchOrders(params?: SearchOrdersParams): Promise<SearchOrdersResponse> {
    try {
      this.logger.debug(`Searching Kinguin orders with params: ${JSON.stringify(params ?? {})}`);

      const response = await this.httpClient.get<SearchOrdersResponse>('/v1/order', {
        params: params ?? {},
      });

      if (response.data === null || response.data === undefined) {
        throw new Error('Invalid response from Kinguin API');
      }

      this.logger.log(
        `✅ Found ${response.data.item_count} order(s) (returned ${response.data.results.length})`,
      );

      return response.data;
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      this.logger.error(
        `❌ Failed to search Kinguin orders: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw new Error(`Kinguin orders search failed: ${message}`);
    }
  }

  /**
   * Get keys for an order (v2 endpoint)
   * Keys are available when order status is 'completed' and key status is 'DELIVERED'
   *
   * @param orderId Kinguin order ID
   * @returns Array of key objects with serial (the actual key value)
   * @throws Error if API call fails or keys not available
   *
   * @see https://www.kinguin.net/integration/docs/api/order/v2/README.md#get-keys
   */
  async getKeysV2(orderId: string): Promise<KinguinKeyObject[]> {
    try {
      if (orderId === '' || orderId === null || orderId === undefined) {
        throw new Error('Invalid orderId: must be a non-empty string');
      }

      this.logger.debug(`Fetching Kinguin keys for order: ${orderId}`);

      const response = await this.httpClient.get<KinguinKeyObject[]>(`/v2/order/${orderId}/keys`);

      if (response.data === null || response.data === undefined) {
        throw new Error('Invalid response from Kinguin API');
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected array of keys');
      }

      this.logger.log(`✅ Retrieved ${response.data.length} key(s) for order: ${orderId}`);

      return response.data;
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      this.logger.error(
        `❌ Failed to fetch keys from Kinguin order: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw new Error(`Kinguin keys retrieval failed: ${message}`);
    }
  }

  /**
   * Get account balance
   *
   * @returns Current account balance
   * @see https://www.kinguin.net/integration/docs/api/balance/v1/README.md
   */
  async getBalance(): Promise<number> {
    try {
      this.logger.debug('Fetching Kinguin account balance...');

      const response = await this.httpClient.get<{ balance: number }>('/v1/balance');

      if (response.data === null || response.data === undefined) {
        throw new Error('Invalid response from Kinguin API');
      }

      this.logger.log(`✅ Kinguin balance: ${response.data.balance}`);

      return response.data.balance;
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to fetch Kinguin balance: ${message}`);
      throw new Error(`Kinguin balance fetch failed: ${message}`);
    }
  }

  /**
   * Return keys for an order (V2 API)
   *
   * Returns keys that have not been claimed by the customer.
   *
   * **Limitations:**
   * - Keys cannot be returned if already claimed
   * - Not allowed for wholesale orders
   * - Must be done within 24 hours of key delivery
   * - Pre-orders not eligible
   * - Only ONE return request per order allowed
   *
   * @param orderId - Kinguin order ID
   * @returns Array of key return results with id and updated status
   * @see https://www.kinguin.net/integration/docs/api/order/v2/ReturnKeys.md
   */
  async returnKeys(
    orderId: string,
  ): Promise<Array<{ id: string; status: KinguinKeyStatus }>> {
    try {
      this.logger.debug(`Returning keys for order ${orderId}...`);

      const response = await this.httpClient.post<
        Array<{ id: string; status: KinguinKeyStatus }>
      >(`/v2/order/${orderId}/keys/return`);

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response from Kinguin API: expected array');
      }

      this.logger.log(
        `✅ Returned ${response.data.length} keys for order ${orderId}`,
      );

      return response.data;
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);

      // Check for specific NoKeysToReturn error
      if (message.includes('NoKeysToReturn')) {
        this.logger.warn(
          `⚠️ No keys available to return for order ${orderId}: ${message}`,
        );
        throw new Error(`No keys to return: ${message}`);
      }

      this.logger.error(
        `❌ Failed to return keys for order ${orderId}: ${message}`,
      );
      throw new Error(`Kinguin key return failed: ${message}`);
    }
  }

  // =====================================================================
  // LEGACY METHODS (deprecated, kept for backward compatibility)
  // =====================================================================

  /**
   * @deprecated Use placeOrderV1() or placeOrderV2() instead
   * Legacy method for backward compatibility
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    this.logger.warn(
      '⚠️ createOrder() is deprecated. Use placeOrderV1() or placeOrderV2() instead.',
    );

    try {
      const { offerId, quantity } = request ?? {};

      // Validation
      if (offerId === '' || offerId === null || offerId === undefined) {
        throw new Error('Invalid offerId: must be a non-empty string');
      }
      if (typeof quantity !== 'number' || quantity < 1 || quantity > 100) {
        throw new Error('Invalid quantity: must be between 1 and 100');
      }

      // Extract kinguinId from offerId if possible, otherwise use as productId
      const kinguinId = parseInt(offerId, 10);
      const isNumeric = !isNaN(kinguinId) && kinguinId > 0;

      if (isNumeric) {
        // Use v1 API with kinguinId
        const order = await this.placeOrderV1({
          products: [{ kinguinId, qty: quantity, price: 0.01 }], // Price will be validated by API
        });

        return {
          id: order.orderId,
          status: order.status,
          externalId: order.orderExternalId,
        };
      } else {
        // Use v2 API with productId
        const order = await this.placeOrderV2({
          products: [{ productId: offerId, qty: quantity, price: 0.01 }],
        });

        return {
          id: order.orderId,
          status: order.status,
          externalId: order.orderExternalId,
        };
      }
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      throw new Error(`Kinguin order creation failed: ${message}`);
    }
  }

  /**
   * @deprecated Use getOrder() instead
   * Legacy method for backward compatibility
   */
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    this.logger.warn('⚠️ getOrderStatus() is deprecated. Use getOrder() instead.');

    try {
      const order = await this.getOrder(orderId);

      // Find first delivered key if any
      let key: string | undefined;
      let keyType: OrderStatusResponse['keyType'];
      for (const product of order.products ?? []) {
        for (const keyInfo of product.keys ?? []) {
          if (keyInfo.status === 'DELIVERED') {
            // Need to fetch actual key value from v2 endpoint
            try {
              const keys = await this.getKeysV2(orderId);
              const matchingKey = keys.find((k) => k.id === keyInfo.id);
              if (matchingKey !== undefined) {
                key = matchingKey.serial;
                keyType = matchingKey.type;
              }
            } catch {
              // Keys not yet available
            }
            break;
          }
        }
        if (key !== undefined) break;
      }

      // Map new statuses to legacy statuses for compatibility
      let legacyStatus: OrderStatusResponse['status'] = order.status;
      if (order.status === 'processing') {
        legacyStatus = 'waiting';
      } else if (order.status === 'completed') {
        legacyStatus = 'ready';
      } else if (order.status === 'refunded') {
        legacyStatus = 'cancelled';
      } else if (order.status === 'canceled') {
        legacyStatus = 'cancelled';
      }

      return {
        id: order.orderId,
        status: legacyStatus,
        key,
        keyType,
      };
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      throw new Error(`Kinguin order status fetch failed: ${message}`);
    }
  }

  /**
   * @deprecated Use getKeysV2() instead
   * Legacy method for backward compatibility
   */
  async getKey(orderId: string): Promise<string> {
    this.logger.warn('⚠️ getKey() is deprecated. Use getKeysV2() instead.');

    const keys = await this.getKeysV2(orderId);

    if (keys.length === 0) {
      throw new Error('No keys available for this order');
    }

    const firstKey = keys[0];
    if (firstKey === undefined) {
      throw new Error('Key data is undefined');
    }

    return firstKey.serial;
  }

  /**
   * Health check for Kinguin API connectivity
   * Uses balance endpoint as a health check
   *
   * @returns true if API is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.logger.debug('Performing Kinguin API health check...');

      await this.getBalance();

      this.logger.log('✅ Kinguin API health check passed');
      return true;
    } catch (error: unknown) {
      this.logger.warn(`⚠️ Kinguin API health check failed: ${this.extractErrorMessage(error)}`);
      return false;
    }
  }

  /**
   * Extract error message from various error types
   * Handles Kinguin API errors, axios errors, and generic errors
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

      // Try to extract Kinguin API error format
      if (
        axiosError.response?.data !== null &&
        axiosError.response?.data !== undefined &&
        typeof axiosError.response.data === 'object'
      ) {
        const data = axiosError.response.data as Partial<KinguinErrorResponse>;

        // Kinguin error format: { kind, title, detail, ... }
        if (data.detail !== undefined && data.detail !== '') {
          return `${data.kind ?? 'Error'}: ${data.detail}`;
        }
        if (data.title !== undefined && data.title !== '') {
          return `${data.kind ?? 'Error'}: ${data.title}`;
        }

        // Legacy format
        const legacyData = data as Record<string, unknown>;
        const message = legacyData.message;
        if (
          message !== null &&
          message !== undefined &&
          typeof message === 'string' &&
          message !== ''
        ) {
          return message;
        }
        const dataError = legacyData.error;
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
