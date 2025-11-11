import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import { KinguinClient, CreateOrderRequest, CreateOrderResponse, OrderStatusResponse } from '../fulfillment/kinguin.client';

/**
 * Kinguin Service
 *
 * Orchestrates Kinguin Sales Manager API operations:
 * - reserve(offerId, quantity): Create order reservation
 * - give(orderId): Retrieve key from completed order
 * - getDelivered(reservationId): Check delivery status
 * - validateWebhook(payload, signature): Verify webhook authenticity
 *
 * @example
 * const reserved = await this.kinguin.reserve('product-123', 1);
 * const delivered = await this.kinguin.give(reserved.id);
 * const status = await this.kinguin.getDelivered(reserved.id);
 *
 * @see KinguinClient for HTTP communication layer
 * @see KinguinController for webhook handling
 */
@Injectable()
export class KinguinService {
  private readonly logger = new Logger(KinguinService.name);

  constructor(private readonly kinguinClient: KinguinClient) {}

  /**
   * Reserve a product from Kinguin (create order)
   *
   * Calls Kinguin API to place order and receive reservation ID
   * Used when order transitions to "paid" status
   *
   * @param offerId Kinguin product/offer ID
   * @param quantity Number of copies to reserve
   * @returns Reservation with ID and initial status
   * @throws BadRequestException if offerId/quantity invalid
   * @throws InternalServerErrorException if Kinguin API fails
   *
   * @example
   * const result = await this.kinguin.reserve('kinguin-offer-123', 1);
   * // Returns: { id: 'res-123', status: 'waiting', externalId: 'ext-456' }
   */
  async reserve(offerId: string, quantity: number): Promise<CreateOrderResponse> {
    // Input validation
    if (offerId === undefined || offerId === '' || offerId.length === 0) {
      throw new BadRequestException('offerId is required and must be non-empty');
    }

    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      throw new BadRequestException('quantity must be a positive integer');
    }

    try {
      this.logger.debug(`[KINGUIN] Reserving product: offerId=${offerId}, quantity=${quantity}`);

      // Call Kinguin API to create order
      const request: CreateOrderRequest = {
        offerId,
        quantity,
      };

      const response = await this.kinguinClient.createOrder(request);

      // Validate response structure
      if (response === undefined || response === null) {
        throw new Error('Kinguin API returned null/undefined response');
      }

      if (response.id === undefined || response.id === '' || response.id.length === 0) {
        throw new Error('Kinguin API response missing order ID');
      }

      if (response.status === undefined) {
        throw new Error('Kinguin API response missing status');
      }

      this.logger.log(
        `[KINGUIN] ✅ Order reserved successfully: id=${response.id}, status=${response.status}`,
      );

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[KINGUIN] ❌ Reservation failed: ${errorMsg}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(`Failed to reserve product from Kinguin: ${errorMsg}`);
    }
  }

  /**
   * Deliver key from reserved order
   *
   * Retrieves the key/license from a completed Kinguin order.
   * Called when order is ready to be delivered to customer.
   *
   * @param reservationId Kinguin reservation/order ID
   * @returns Key/license code for customer
   * @throws NotFoundException if reservation not found or not ready
   * @throws InternalServerErrorException if key retrieval fails
   *
   * @example
   * const key = await this.kinguin.give('res-123');
   * // Returns: "XXXXX-XXXXX-XXXXX-XXXXX"
   */
  async give(reservationId: string): Promise<string> {
    // Input validation
    if (reservationId === undefined || reservationId === '' || reservationId.length === 0) {
      throw new BadRequestException('reservationId is required and must be non-empty');
    }

    try {
      this.logger.debug(`[KINGUIN] Retrieving key for reservation: ${reservationId}`);

      // Get order status first to verify it's ready
      const status = await this.getDelivered(reservationId);

      if (status.status !== 'ready') {
        throw new BadRequestException(
          `Order not ready for delivery. Current status: ${status.status}`,
        );
      }

      if (status.key === undefined || status.key === '' || status.key.length === 0) {
        throw new Error('Order is ready but key is empty');
      }

      this.logger.log(`[KINGUIN] ✅ Key delivered successfully from reservation: ${reservationId}`);

      return status.key;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[KINGUIN] ❌ Key delivery failed: ${errorMsg}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to deliver key from Kinguin reservation: ${errorMsg}`,
      );
    }
  }

  /**
   * Get delivery status of reserved order
   *
   * Polls Kinguin to check current status of order
   * Status progression: waiting → processing → ready (success)
   *                                           → failed/cancelled (terminal)
   *
   * @param reservationId Kinguin reservation/order ID
   * @returns Current order status with key (if ready)
   * @throws NotFoundException if reservation not found
   * @throws InternalServerErrorException if status check fails
   *
   * @example
   * const status = await this.kinguin.getDelivered('res-123');
   * // Returns: { id: 'res-123', status: 'ready', key: 'XXXXX-...' }
   */
  async getDelivered(reservationId: string): Promise<OrderStatusResponse> {
    // Input validation
    if (reservationId === undefined || reservationId === '' || reservationId.length === 0) {
      throw new BadRequestException('reservationId is required and must be non-empty');
    }

    try {
      this.logger.debug(`[KINGUIN] Checking delivery status for reservation: ${reservationId}`);

      // Call Kinguin API to get order status
      const response = await this.kinguinClient.getOrderStatus(reservationId);

      // Validate response structure
      if (response === undefined || response === null) {
        throw new NotFoundException('Kinguin reservation not found');
      }

      if (response.status === undefined) {
        throw new Error('Kinguin API response missing status field');
      }

      this.logger.debug(
        `[KINGUIN] Order status check: id=${reservationId}, status=${response.status}`,
      );

      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[KINGUIN] ❌ Status check failed: ${errorMsg}`);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to check Kinguin order status: ${errorMsg}`,
      );
    }
  }

  /**
   * Validate Kinguin webhook authenticity
   *
   * Verifies webhook signature using HMAC to ensure it came from Kinguin
   * Uses HMAC-SHA512 with shared secret in env KINGUIN_WEBHOOK_SECRET
   *
   * @param _payload Raw webhook payload
   * @param _signature HMAC signature from X-KINGUIN-SIGNATURE header
   * @returns true if signature is valid, false otherwise
   *
   * @example
   * const isValid = this.kinguin.validateWebhook(payload, signature);
   * if (!isValid) throw new UnauthorizedException('Invalid webhook signature');
   *
   * @see KinguinController.handleWebhook for usage
   */
  validateWebhook(_payload: string, _signature: string): boolean {
    try {
      const secret = process.env.KINGUIN_WEBHOOK_SECRET ?? '';
      if (secret.length === 0) {
        this.logger.error('[KINGUIN] ❌ KINGUIN_WEBHOOK_SECRET not configured');
        return false;
      }

      if (typeof _signature !== 'string' || _signature.length === 0) {
        this.logger.warn('[KINGUIN] ❌ Missing or invalid webhook signature');
        return false;
      }

      const computed = crypto.createHmac('sha512', secret).update(_payload).digest('hex');

      this.logger.debug(`[KINGUIN] Signature verification:
        Secret: ${secret.substring(0, 20)}...
        Payload: ${_payload.substring(0, 50)}...
        Computed: ${computed.substring(0, 32)}...
        Provided: ${_signature.substring(0, 32)}...`);

      // timingSafeEqual throws if buffer lengths differ; guard lengths first
      if (computed.length !== _signature.length) {
        this.logger.warn('[KINGUIN] ❌ Signature length mismatch');
        return false;
      }

      const valid = crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(_signature));
      if (!valid) {
        this.logger.warn('[KINGUIN] ❌ Webhook signature verification failed');
      }
      return valid;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[KINGUIN] ❌ Webhook validation failed: ${errorMsg}`);
      return false;
    }
  }
}
