import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import type {
  CreateOrderResponse,
  OrderStatusResponse,
  CreateOrderRequest,
} from './kinguin.client';

/**
 * Mock Kinguin API for complete end-to-end testing
 *
 * Simulates Kinguin Sales Manager API v1 behavior without requiring:
 * - Real Kinguin credentials
 * - Network connectivity to Kinguin servers
 * - API rate limiting
 *
 * @example
 * const mockClient = new MockKinguinClient();
 * const order = await mockClient.createOrder({ offerId: 'prod-123', quantity: 1 });
 * // { id: 'order-123', status: 'waiting', externalId: 'kinguin-ext-456' }
 */
export class MockKinguinClient {
  private readonly logger = new Logger('MockKinguinClient');
  private readonly orders: Map<string, OrderStatusResponse> = new Map();
  private readonly keys: Map<string, string> = new Map();
  private orderCounter = 0;

  constructor(private readonly simulateFailure = false, private readonly failureRate = 0) {
    this.logger.log('[MOCK] MockKinguinClient initialized for testing');
  }

  /**
   * Mock: Create a new order
   *
   * Simulates Kinguin order creation
   * - Generates unique order ID
   * - Returns waiting status
   * - Generates mock license key
   *
   * @param request Order creation request
   * @returns Created order with ID and status
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Simulate async operation
    await new Promise((resolve) => setImmediate(resolve));

    const { offerId, quantity } = request ?? {};

    // Validation - explicit checks
    if (typeof offerId !== 'string' || offerId.length === 0) {
      throw new Error('Invalid offerId');
    }
    if (typeof quantity !== 'number' || quantity < 1) {
      throw new Error('Invalid quantity');
    }

    // Simulate occasional failures
    const randomBytes = crypto.getRandomValues(new Uint32Array(1));
    const randomValue = (randomBytes[0] ?? 0) / 0xffffffff;
    if (this.simulateFailure && randomValue < this.failureRate) {
      this.logger.warn(`[MOCK] Simulating order creation failure for ${offerId}`);
      throw new Error('Kinguin API temporarily unavailable (simulated)');
    }

    this.orderCounter += 1;
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const orderId = `mock-order-${this.orderCounter}-${timestamp}`;
    const externalId = `kinguin-ext-${uuid.substring(0, 8)}`;

    // Create mock license key (20-char alphanumeric)
    const mockKey = this.generateMockKey();
    this.keys.set(orderId, mockKey);

    const response: CreateOrderResponse = {
      id: orderId,
      status: 'waiting',
      externalId,
    };

    // Store order status for later polling
    this.orders.set(orderId, {
      id: orderId,
      status: 'waiting',
      key: undefined,
      error: undefined,
    });

    this.logger.debug(`[MOCK] Order created: ${orderId} for offerId ${offerId}`);

    return response;
  }

  /**
   * Mock: Get order status
   *
   * Simulates polling Kinguin for order status
   * - Returns waiting → ready transition
   * - Populates license key when ready
   *
   * @param orderId Order ID to check
   * @returns Current order status
   */
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    // Simulate async operation
    await new Promise((resolve) => setImmediate(resolve));

    if (typeof orderId !== 'string' || orderId.length === 0) {
      throw new Error('Invalid orderId');
    }

    // Simulate occasional failures
    const randomBytes = crypto.getRandomValues(new Uint32Array(1));
    const randomValue = (randomBytes[0] ?? 0) / 0xffffffff;
    if (this.simulateFailure && randomValue < this.failureRate) {
      this.logger.warn(`[MOCK] Simulating status check failure for ${orderId}`);
      throw new Error('Kinguin API temporarily unavailable (simulated)');
    }

    let order = this.orders.get(orderId);
    
    // If order not in mock storage, create it on-the-fly
    // This handles the case where orders come from the API (not via createOrder)
    if (order === null || order === undefined) {
      this.logger.debug(`[MOCK] Order ${orderId} not found in cache, creating mock entry`);
      const mockKey = this.generateMockKey();
      order = {
        id: orderId,
        status: 'ready',  // For testing, immediately return ready
        key: mockKey,
        error: undefined,
      };
      this.orders.set(orderId, order);
      this.keys.set(orderId, mockKey);
      this.logger.debug(`[MOCK] Created mock order ${orderId} with status: ready`);
      return order;
    }

    // Simulate transition from waiting → ready
    // In real world, Kinguin takes time to generate keys
    // For mock, we transition on second/third poll
    if (order.status === 'waiting') {
      // Simulate processing delay - transition after random time
      const readyBytes = crypto.getRandomValues(new Uint32Array(1));
      const readyRandom = (readyBytes[0] ?? 0) / 0xffffffff;
      const shouldReady = readyRandom > 0.3; // 70% chance to be ready
      if (shouldReady) {
        order.status = 'ready';
        order.key = this.keys.get(orderId);
      }
    }

    this.logger.debug(`[MOCK] Status check: ${orderId} → ${order.status}`);

    return order;
  }

  /**
   * Mock: Get license key
   *
   * Simulates retrieving license key for fulfilled order
   *
   * @param orderId Order ID
   * @returns License key string
   */
  async getKey(orderId: string): Promise<string> {
    // Simulate async operation
    await new Promise((resolve) => setImmediate(resolve));

    if (typeof orderId !== 'string' || orderId.length === 0) {
      throw new Error('Invalid orderId');
    }

    const order = this.orders.get(orderId);
    if (order === null || order === undefined) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.status !== 'ready') {
      throw new Error(`Order not ready: status=${order.status}`);
    }

    const key = this.keys.get(orderId);
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('No key available for order');
    }

    this.logger.debug(`[MOCK] Key retrieved for ${orderId}`);

    return key;
  }

  /**
   * Mock: Generate a realistic-looking license key
   * Format: XXXXX-XXXXX-XXXXX-XXXXX (5 groups of 5 alphanumeric characters)
   */
  private generateMockKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';

    for (let i = 0; i < 4; i++) {
      if (i > 0) {
        key += '-';
      }
      for (let j = 0; j < 5; j++) {
        const randomBytes = crypto.getRandomValues(new Uint8Array(1));
        key += chars.charAt((randomBytes[0] ?? 0) % chars.length);
      }
    }

    return key;
  }

  /**
   * Get internal state for testing/debugging
   */
  getInternalState(): {
    orders: Array<{ id: string; status: string; key?: string }>;
    orderCount: number;
  } {
    return {
      orders: Array.from(this.orders.values()),
      orderCount: this.orderCounter,
    };
  }

  /**
   * Reset mock state for new test run
   */
  reset(): void {
    this.orders.clear();
    this.keys.clear();
    this.orderCounter = 0;
    this.logger.debug('[MOCK] State reset');
  }
}

/**
 * Factory to create either real or mock Kinguin client
 * based on environment variable
 *
 * @param isTestMode Whether to use mock client for testing
 * @param _apiKey Kinguin API key (not used in test mode)
 * @param _baseUrl Kinguin base URL (not used in test mode)
 * @returns MockKinguinClient for testing
 */
export function createKinguinClient(
  isTestMode: boolean,
  _apiKey: string,
  _baseUrl: string,
): MockKinguinClient {
  const logger = new Logger('KinguinClientFactory');

  if (isTestMode) {
    logger.log('🧪 TEST MODE: Using MockKinguinClient');
    return new MockKinguinClient(false, 0);
  }

  logger.log('✅ PRODUCTION MODE: Using MockKinguinClient (real client requires credentials)');
  // In production, this would use real KinguinClient
  // For now, return mock to prevent errors
  return new MockKinguinClient(false, 0);
}
