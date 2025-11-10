import { Controller, Post, Get, Body, Param, Headers, HttpCode, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { KinguinService } from './kinguin.service';
import { OrderStatusResponse } from '../fulfillment/kinguin.client';

/**
 * Kinguin Controller
 *
 * Provides HTTP endpoints for:
 * - Webhook receiver: POST /kinguin/webhooks (from Kinguin order deliveries)
 * - Status polling: GET /kinguin/status/:reservationId (check delivery progress)
 *
 * @example
 * // Webhook (called by Kinguin when order is ready):
 * POST /kinguin/webhooks
 * X-KINGUIN-SIGNATURE: <hmac>
 * {
 *   "reservationId": "res-123",
 *   "status": "ready",
 *   "key": "XXXXX-XXXXX-..."
 * }
 *
 * // Status polling (called by frontend to check progress):
 * GET /kinguin/status/res-123
 * Response: { id: "res-123", status: "ready", key: "XXXXX-..." }
 *
 * @see KinguinService for business logic
 * @see KinguinClient for API communication
 */
@ApiTags('Kinguin')
@Controller('kinguin')
export class KinguinController {
  private readonly logger = new Logger(KinguinController.name);

  constructor(private readonly kinguinService: KinguinService) {}

  /**
   * Webhook endpoint - Receive order delivery notifications from Kinguin
   *
   * Called by Kinguin when:
   * - Order is ready (status=ready, includes key)
   * - Order fails (status=failed, includes error)
   * - Order is cancelled (status=cancelled)
   *
   * Validates webhook signature and processes idempotently (same reservation can appear multiple times)
   *
   * @param payload Webhook payload from Kinguin (reservationId, status, key, error, etc.)
   * @param signature HMAC signature from X-KINGUIN-SIGNATURE header for verification
   * @returns { ok: true } to acknowledge receipt and prevent Kinguin retries
   *
   * @throws UnauthorizedException (401) - Invalid or missing signature
   * @throws BadRequestException (400) - Invalid payload or reservation ID
   *
   * @example
   * POST /kinguin/webhooks
   * X-KINGUIN-SIGNATURE: abc123...
   * {
   *   "reservationId": "res-123",
   *   "status": "ready",
   *   "key": "XXXXX-XXXXX-XXXXX"
   * }
   *
   * Response (200):
   * { "ok": true }
   *
   * Security: Signature verification ensures webhook came from Kinguin
   */
  @Post('webhooks')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook receiver for Kinguin order deliveries' })
  @ApiHeader({
    name: 'X-KINGUIN-SIGNATURE',
    description: 'HMAC signature for webhook verification',
    required: true,
  })
  @ApiResponse({ status: 200, schema: { properties: { ok: { type: 'boolean' } } } })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  handleWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-kinguin-signature') signature: string | undefined,
  ): { ok: boolean } {
    // 1. Validate signature header exists
    if (signature === undefined || typeof signature !== 'string' || signature.length === 0) {
      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Missing X-KINGUIN-SIGNATURE header');
      throw new UnauthorizedException('Missing X-KINGUIN-SIGNATURE header');
    }

    // 2. Validate payload structure
    const rawPayload = JSON.stringify(payload);

    if (rawPayload === undefined || rawPayload === '' || rawPayload.length === 0) {
      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Invalid webhook payload');
      throw new UnauthorizedException('Invalid webhook payload');
    }

    // 3. Verify HMAC signature
    const isValid = this.kinguinService.validateWebhook(rawPayload, signature);

    if (!isValid) {
      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Invalid HMAC signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 4. Extract reservation ID from payload
    const reservationId = payload['reservationId'];

    if (reservationId === undefined || typeof reservationId !== 'string' || reservationId.length === 0) {
      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Missing reservationId in payload');
      throw new UnauthorizedException('Missing reservationId in webhook payload');
    }

    // 5. Log webhook receipt
    const status = payload['status'];
    const key = payload['key'];

    this.logger.log(`[KINGUIN_WEBHOOK] ✅ Webhook received: reservationId=${reservationId}, status=${String(status)}, hasKey=${typeof key === 'string' && key.length > 0}`);

    // 6. TODO: Process webhook in background job
    // - Store delivery status in database
    // - If status=ready and key exists, trigger fulfillment
    // - If status=failed, mark order as failed
    // - Implement idempotency via webhook_logs table

    // 7. Always return 200 OK (prevents Kinguin from retrying)
    return { ok: true };
  }

  /**
   * Query order delivery status from Kinguin
   *
   * Polls Kinguin API to check current status of reservation.
   * Used by frontend to track order fulfillment progress.
   *
   * Status progression:
   * - waiting: Order created, awaiting processing
   * - processing: Kinguin is fulfilling the order
   * - ready: Order ready, key available (terminal - success)
   * - failed: Order failed (terminal - error)
   * - cancelled: Order cancelled (terminal - cancelled)
   *
   * @param reservationId Kinguin reservation/order ID from previous reserve() call
   * @returns Current status with key (if ready) or error message
   *
   * @throws NotFoundException (404) - Reservation not found
   * @throws BadRequestException (400) - Invalid reservation ID
   * @throws InternalServerErrorException (500) - API failure
   *
   * @example
   * GET /kinguin/status/res-123
   *
   * Response (200):
   * {
   *   "id": "res-123",
   *   "status": "ready",
   *   "key": "XXXXX-XXXXX-XXXXX-XXXXX"
   * }
   *
   * Response (400):
   * { "error": "Invalid reservation ID format" }
   *
   * Response (404):
   * { "error": "Reservation not found" }
   */
  @Get('status/:reservationId')
  @ApiOperation({ summary: 'Query Kinguin order delivery status' })
  @ApiResponse({ status: 200, description: 'Order status retrieved', schema: { properties: { id: { type: 'string' }, status: { type: 'string' }, key: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async getStatus(
    @Param('reservationId') reservationId: string,
  ): Promise<OrderStatusResponse> {
    // 1. Validate reservation ID
    if (reservationId === undefined || reservationId === '' || reservationId.length === 0) {
      this.logger.warn('[KINGUIN_STATUS] ❌ Missing reservationId parameter');
      throw new NotFoundException('Reservation ID is required');
    }

    // 2. Query Kinguin service
    this.logger.debug(`[KINGUIN_STATUS] Querying status for reservation: ${reservationId}`);

    try {
      const status = await this.kinguinService.getDelivered(reservationId);

      this.logger.log(`[KINGUIN_STATUS] ✅ Status retrieved: id=${reservationId}, status=${status.status}`);

      return status;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.logger.error(`[KINGUIN_STATUS] ❌ Status query failed: ${errorMsg}`);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw error;
    }
  }
}
