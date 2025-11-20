import { Controller, Get, Post, Param, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FulfillmentService } from './fulfillment.service';
import { DeliveryService } from './delivery.service';
import { OrdersService } from '../orders/orders.service';
import { FulfillmentStatusDto } from './dto/fulfillment-status.dto';
import { DeliveryLinkDto, RevealedKeyDto, HealthCheckResultDto } from './dto/key-response.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

interface JwtPayload {
  sub: string;
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
      if (order.userId !== user.sub && user.role !== 'admin') {
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
      if (order.userId !== user.sub && user.role !== 'admin') {
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
   * Reveal key for authenticated user (owner)
   */
  @Post(':id/reveal/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reveal encrypted key (requires ownership)' })
  @ApiResponse({ status: 200, type: RevealedKeyDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order or item not found' })
  async revealMyKey(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<RevealedKeyDto> {
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
      if (order.userId !== user.sub && user.role !== 'admin') {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      const ipAddress = (req.ip ?? '0.0.0.0').toString();
      const userAgent = req.get('user-agent') ?? 'unknown';

      const revealed = await this.deliveryService.revealKey(id, itemId, { ipAddress, userAgent });

      return {
        orderId: revealed.orderId,
        itemId: revealed.itemId,
        plainKey: revealed.plainKey,
        revealedAt: revealed.revealedAt,
        expiresAt: revealed.expiresAt,
        downloadCount: revealed.downloadCount,
        accessInfo: revealed.accessInfo,
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
        revealedAt: revealed.revealedAt,
        expiresAt: revealed.expiresAt,
        downloadCount: revealed.downloadCount,
        accessInfo: revealed.accessInfo,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reveal key';
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
}
