import { Controller, Get, Post, Param, UseGuards, Request, HttpException, HttpStatus, Logger, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { FulfillmentService } from './fulfillment.service';
import { DeliveryService } from './delivery.service';
import { OrdersService } from '../orders/orders.service';
import { FulfillmentStatusDto } from './dto/fulfillment-status.dto';
import { DeliveryLinkDto, RevealedKeyDto, HealthCheckResultDto } from './dto/key-response.dto';
import { RecoveryResponseDto } from './dto/recovery-response.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

interface JwtPayload {
  id?: string;
  sub?: string;
  email?: string;
  role?: string;
}

interface AuthenticatedRequest extends ExpressRequest {
  user?: JwtPayload;
}

/**
 * Fulfillment Controller
 *
 * REST API endpoints for order fulfillment and key delivery
 *
 * Endpoints:
 * - GET /fulfillment/:id/status - Get fulfillment progress
 * - GET /fulfillment/:id/download-link - Generate delivery link
 * - POST /fulfillment/:id/reveal-key/:itemId - Reveal key (admin only)
 */
@ApiTags('Fulfillment')
@Controller('fulfillment')
export class FulfillmentController {
  private readonly logger = new Logger(FulfillmentController.name);

  constructor(
    private readonly fulfillmentService: FulfillmentService,
    private readonly deliveryService: DeliveryService,
    private readonly ordersService: OrdersService,
  ) { }

  /**
   * Get fulfillment status for an order
   * Requires JWT authentication and ownership of the order
   *
   * @param id Order ID
   * @param req Authenticated request
   * @returns FulfillmentStatusDto with current status and progress
   */
  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order fulfillment status (requires ownership)' })
  @ApiResponse({ status: 200, type: FulfillmentStatusDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden - order does not belong to user' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getStatus(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<FulfillmentStatusDto> {
    try {
      const user = req.user ?? null;
      if (user === null) {
        throw new Error('User not found in request');
      }

      // Verify ownership
      const order = await this.ordersService.get(id);
      if (order === null || order === undefined) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }
      if (order.userId !== user.id && user.role !== 'admin') {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      const status = await this.fulfillmentService.checkStatus(id);

      // Map service response to DTO (direct mapping)
      return {
        orderId: status.orderId,
        status: status.status,
        itemsFulfilled: status.itemsFulfilled,
        itemsTotal: status.itemsTotal,
        allFulfilled: status.allFulfilled,
        updatedAt: status.updatedAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get status';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Generate a download link for fulfilled order
   * Requires JWT authentication and ownership of the order
   *
   * @param id Order ID
   * @param req Authenticated request
   * @returns DeliveryLinkDto with signed URL for key download
   */
  @Get(':id/download-link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate delivery link for fulfilled order (requires ownership)' })
  @ApiResponse({ status: 200, type: DeliveryLinkDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden - order does not belong to user' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Order not fulfilled' })
  async getDownloadLink(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DeliveryLinkDto> {
    try {
      const user = req.user ?? null;
      if (user === null) {
        throw new Error('User not found in request');
      }

      // Verify ownership
      const order = await this.ordersService.get(id);
      if (order === null || order === undefined) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }
      if (order.userId !== user.id && user.role !== 'admin') {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      const link = await this.deliveryService.generateDeliveryLink(id);

      if (link === null || typeof link !== 'object') {
        throw new Error('Invalid delivery link response');
      }

      // Map delivery link to response DTO
      return {
        orderId: link.orderId,
        signedUrl: link.signedUrl,
        expiresAt: link.expiresAt,
        itemCount: link.itemCount,
        message: link.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate link';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Reveal key for authenticated user (owner) or guest with session token
   * Ownership is verified by:
   * 1. Session token (immediate guest access after order creation)
   * 2. userId match (logged-in user who placed the order)
   * 3. email match (guest checkout user who later created account with same email)
   * 4. admin role (admins can reveal any key)
   */
  @Post(':id/reveal/:itemId')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-order-session-token',
    description: 'Order session token for immediate guest access (received on order creation)',
    required: false,
  })
  @ApiOperation({ summary: 'Reveal encrypted key (requires ownership or session token)' })
  @ApiResponse({ status: 200, type: RevealedKeyDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order or item not found' })
  async revealMyKey(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Headers('x-order-session-token') sessionToken: string | undefined,
    @Request() req: AuthenticatedRequest,
  ): Promise<RevealedKeyDto> {
    try {
      const user = req.user ?? null;
      
      // Verify ownership (session token, userId match, email match, or admin)
      const order = await this.ordersService.get(id);
      if (order === null || order === undefined) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      // Check access methods in order of priority
      let hasAccess = false;
      let accessMethod = 'none';

      // 1. Check session token (for immediate guest access)
      // Must verify BOTH orderId AND email match to prevent token abuse
      if (!hasAccess && sessionToken !== undefined && sessionToken.length > 0) {
        const tokenData = this.ordersService.verifyOrderSessionToken(sessionToken);
        if (tokenData !== null && 
            tokenData.orderId === id && 
            tokenData.email.toLowerCase() === order.email.toLowerCase()) {
          hasAccess = true;
          accessMethod = 'session_token';
          this.logger.log(`✅ Session token access granted for order ${id}`);
        }
      }

      // 2. Check authenticated user access
      if (!hasAccess && user !== null) {
        const isAdmin = user.role === 'admin';
        const isOwnerByUserId = order.userId !== undefined && order.userId !== null && order.userId === user.id;
        const userEmail = user.email ?? null;
        const isOwnerByEmail = userEmail !== null && order.email.toLowerCase() === userEmail.toLowerCase();

        if (isAdmin) {
          hasAccess = true;
          accessMethod = 'admin';
        } else if (isOwnerByUserId) {
          hasAccess = true;
          accessMethod = 'user_id';
        } else if (isOwnerByEmail) {
          hasAccess = true;
          accessMethod = 'email_match';
        }
      }

      // If no access granted, deny
      if (!hasAccess) {
        const userId = user?.id ?? 'guest';
        this.logger.warn(`🚫 Access denied for ${userId} to order ${id} (userId: ${order.userId ?? 'guest'}, email: ${order.email})`);
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      this.logger.log(`🔑 Revealing key for order ${id}, item ${itemId} (access: ${accessMethod})`);

      const ipAddress = (req.ip ?? '0.0.0.0').toString();
      const userAgent = req.get('user-agent') ?? 'unknown';

      const revealed = await this.deliveryService.revealKey(id, itemId, { ipAddress, userAgent });

      return {
        orderId: revealed.orderId,
        itemId: revealed.itemId,
        plainKey: revealed.plainKey,
        contentType: revealed.contentType,
        revealedAt: revealed.revealedAt,
        expiresAt: revealed.expiresAt,
        downloadCount: revealed.downloadCount,
        accessInfo: revealed.accessInfo,
        deliveryContent: revealed.deliveryContent,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reveal key';
      const status = message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(message, status);
    }
  }

  /**
   * Admin endpoint: Reveal a key for an order item
   *
   * Used for manual key delivery or admin operations.
   * Requires admin authorization.
   *
   * @param id Order ID
   * @param itemId Item ID within the order
   * @param req Express request (for IP and User-Agent logging)
   * @returns RevealedKeyDto with decrypted key and audit metadata
   */
  @Post(':id/reveal-key/:itemId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Reveal encrypted key (requires admin role)' })
  @ApiResponse({ status: 200, type: RevealedKeyDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - not admin' })
  @ApiResponse({ status: 404, description: 'Order or item not found' })
  @ApiResponse({ status: 400, description: 'Order not fulfilled or key unavailable' })
  async revealKey(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Request() req: ExpressRequest,
  ): Promise<RevealedKeyDto> {
    try {
      // Extract access info for audit trail
      const ipAddress = (req.ip ?? '0.0.0.0').toString();
      const userAgent = req.get('user-agent') ?? 'unknown';

      // Reveal key (decrypt and log)
      const revealed = await this.deliveryService.revealKey(id, itemId, { ipAddress, userAgent });

      if (revealed === null || typeof revealed !== 'object') {
        throw new Error('Invalid reveal response');
      }

      // Map service result to DTO
      return {
        orderId: revealed.orderId,
        itemId: revealed.itemId,
        plainKey: revealed.plainKey,
        contentType: revealed.contentType,
        revealedAt: revealed.revealedAt,
        expiresAt: revealed.expiresAt,
        downloadCount: revealed.downloadCount,
        accessInfo: revealed.accessInfo,
        deliveryContent: revealed.deliveryContent,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reveal key';
      const status = message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(message, status);
    }
  }

  /**
   * Recovery endpoint: Recover signed URLs for orders with keys in R2
   *
   * This endpoint is for orders that have:
   * - Status 'paid' (payment confirmed)
   * - Keys uploaded to R2 (Kinguin delivered or custom uploaded)
   * - But signedUrl is null (webhook/job failed)
   *
   * It checks R2, regenerates signed URLs, and marks order as fulfilled.
   * Requires authentication and ownership of the order.
   *
   * @param id Order ID to recover
   * @param req Authenticated request
   * @returns Recovery result with updated items
   */
  @Post(':id/recover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Recover signed URLs for orders with keys in R2 (requires ownership)' })
  @ApiResponse({ status: 200, description: 'Recovery result with updated items', type: RecoveryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden - order does not belong to user' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async recoverOrder(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<RecoveryResponseDto> {
    try {
      const user = req.user ?? null;
      if (user === null) {
        throw new Error('User not found in request');
      }

      // Verify ownership
      const order = await this.ordersService.get(id);
      if (order === null || order === undefined) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }
      if (order.userId !== user.id && user.role !== 'admin') {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      // Attempt recovery
      const result = await this.fulfillmentService.recoverOrderKeys(id);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to recover order';
      const status = message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(message, status);
    }
  }

  /**
   * Health check for fulfillment service
   *
   * @returns HealthCheckResult with service status
   */
  @Get('health/check')
  @ApiOperation({ summary: 'Health check for fulfillment service' })
  @ApiResponse({ status: 200, type: HealthCheckResultDto })
  async healthCheck(): Promise<HealthCheckResultDto> {
    const result = await this.fulfillmentService.healthCheck();
    // Map service response to DTO
    return {
      service: result.service,
      status: result.status,
      dependencies: result.dependencies,
      timestamp: result.timestamp,
      error: result.error,
    };
  }

  /**
   * SANDBOX ONLY: Manually trigger fulfillment for testing
   * 
   * In sandbox mode, NOWPayments doesn't send real IPN webhooks,
   * so we need a way to manually trigger fulfillment after payment.
   * 
   * This endpoint:
   * 1. Checks if the order exists and is in 'paid' or 'confirming' status
   * 2. Updates order status to 'paid' if needed
   * 3. Triggers the fulfillment process
   * 
   * SECURITY: Only works when NODE_ENV is 'development' or SANDBOX_MODE is enabled
   * 
   * @param id Order ID to fulfill
   * @returns Fulfillment result with signed URLs
   */
  @Post(':id/trigger-fulfillment')
  @ApiOperation({ summary: 'SANDBOX: Manually trigger fulfillment for testing' })
  @ApiResponse({ status: 200, description: 'Fulfillment triggered successfully' })
  @ApiResponse({ status: 400, description: 'Order not in correct state or sandbox mode disabled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async triggerFulfillment(
    @Param('id') id: string,
  ): Promise<{ success: boolean; orderId: string; status: string; message: string }> {
    // SECURITY: Only allow in development/sandbox mode
    const isDev = process.env.NODE_ENV === 'development';
    const isSandbox = process.env.NOWPAYMENTS_API_URL?.includes('sandbox') ?? false;
    
    if (!isDev && !isSandbox) {
      throw new HttpException(
        'Sandbox fulfillment trigger is only available in development mode',
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      // Get order
      const order = await this.ordersService.get(id);
      if (order === null || order === undefined) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      // Check if already fulfilled
      if (order.status === 'fulfilled') {
        return {
          success: true,
          orderId: id,
          status: 'fulfilled',
          message: 'Order already fulfilled',
        };
      }

      // Allow trigger if order is in any payment-related state
      const validStates = ['waiting', 'confirming', 'confirmed', 'sending', 'paid', 'partially_paid', 'finished'];
      if (!validStates.includes(order.status)) {
        throw new HttpException(
          `Order status '${order.status}' is not valid for fulfillment trigger. Expected: ${validStates.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Update order status to 'paid' if not already
      if (order.status !== 'paid' && order.status !== 'fulfilled') {
        await this.ordersService.markPaid(id);
        this.logger.log(`[SANDBOX] Updated order ${id} status to 'paid'`);
      }

      // Trigger fulfillment
      this.logger.log(`[SANDBOX] Triggering fulfillment for order: ${id}`);
      const result = await this.fulfillmentService.fulfillOrder(id);

      return {
        success: true,
        orderId: id,
        status: result.status,
        message: 'Fulfillment triggered successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to trigger fulfillment';
      this.logger.error(`[SANDBOX] Fulfillment trigger failed: ${message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}
