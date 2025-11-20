import { Controller, Get, Post, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminService } from './admin.service';

/**
 * Admin endpoints for monitoring payments, reservations, and webhooks.
 * All endpoints require JWT authentication and admin role.
 * Protected by @UseGuards(JwtAuthGuard, AdminGuard)
 */
@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /**
   * Get paginated list of orders
   * Filters by email and status
   */
  @Get('orders')
  @ApiOperation({
    summary: 'Get paginated list of orders',
    description: 'Returns all orders with payment and fulfillment status',
  })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 50 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiQuery({ name: 'email', type: String, required: false, example: 'user@example.com' })
  @ApiQuery({ name: 'status', type: String, required: false, example: 'fulfilled' })
  @ApiResponse({
    status: 200,
    description: 'Paginated orders list',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              status: { type: 'string' },
              total: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              payment: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  provider: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  async getOrders(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('email') email?: string,
    @Query('status') status?: string,
  ): Promise<{ data: Array<{ id: string; email: string; status: string; total: string; createdAt: Date; payment?: { id: string; provider: string; status: string } }>; total: number; limit: number; offset: number }> {
    return this.admin.getOrders({
      limit: parseInt(limit ?? '50', 10),
      offset: parseInt(offset ?? '0', 10),
      email,
      status,
    });
  }

  /**
   * Get paginated list of payments
   * Filters by provider (nowpayments, stripe, etc.) and status
   */
  @Get('payments')
  @ApiOperation({
    summary: 'Get paginated list of payments',
    description: 'Returns payments with order info, filtered by provider and status',
  })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 50 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiQuery({ name: 'provider', type: String, required: false, example: 'nowpayments' })
  @ApiQuery({ name: 'status', type: String, required: false, example: 'finished' })
  @ApiResponse({
    status: 200,
    description: 'Paginated payments list',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              orderId: { type: 'string' },
              externalId: { type: 'string' },
              status: { type: 'string' },
              provider: { type: 'string' },
              priceAmount: { type: 'string' },
              priceCurrency: { type: 'string' },
              payAmount: { type: 'string' },
              payCurrency: { type: 'string' },
              order: {
                type: 'object',
                properties: { email: { type: 'string' } },
              },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  async getPayments(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('provider') provider?: string,
    @Query('status') status?: string,
  ): Promise<unknown> {
    return this.admin.getPayments({
      limit: typeof limit === 'string' && limit.length > 0 ? parseInt(limit, 10) : undefined,
      offset: typeof offset === 'string' && offset.length > 0 ? parseInt(offset, 10) : undefined,
      provider,
      status,
    });
  }

  /**
   * Get paginated list of orders with Kinguin reservation info
   */
  @Get('reservations')
  @ApiOperation({
    summary: 'Get paginated list of Kinguin reservations',
    description: 'Returns orders with Kinguin reservation status and ID',
  })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 50 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiQuery({
    name: 'kinguinReservationId',
    type: String,
    required: false,
    example: 'res_123456',
  })
  @ApiQuery({
    name: 'status',
    type: String,
    required: false,
    example: 'fulfilled',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated reservations list',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              status: { type: 'string' },
              kinguinReservationId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  async getReservations(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('kinguinReservationId') kinguinReservationId?: string,
    @Query('status') status?: string,
  ): Promise<unknown> {
    return this.admin.getReservations({
      limit: typeof limit === 'string' && limit.length > 0 ? parseInt(limit, 10) : undefined,
      offset: typeof offset === 'string' && offset.length > 0 ? parseInt(offset, 10) : undefined,
      kinguinReservationId,
      status,
    });
  }

  /**
   * Get paginated list of webhook logs
   */
  @Get('webhook-logs')
  @ApiOperation({
    summary: 'Get paginated list of webhook logs',
    description: 'Returns webhook history with processing status',
  })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 50 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiQuery({
    name: 'webhookType',
    type: String,
    required: false,
    example: 'nowpayments_ipn',
  })
  @ApiQuery({
    name: 'paymentStatus',
    type: String,
    required: false,
    example: 'processed',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated webhook logs',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              externalId: { type: 'string' },
              webhookType: { type: 'string' },
              paymentStatus: { type: 'string' },
              payload: { type: 'object' },
              processed: { type: 'boolean' },
              signature: { type: 'string' },
              signatureValid: { type: 'boolean' },
              orderId: { type: 'string' },
              paymentId: { type: 'string' },
              result: { type: 'string' },
              sourceIp: { type: 'string' },
              attemptCount: { type: 'number' },
              error: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  async getWebhookLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('webhookType') webhookType?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ): Promise<unknown> {
    return this.admin.getWebhookLogs({
      limit: typeof limit === 'string' && limit.length > 0 ? parseInt(limit, 10) : undefined,
      offset: typeof offset === 'string' && offset.length > 0 ? parseInt(offset, 10) : undefined,
      webhookType,
      paymentStatus: paymentStatus as 'pending' | 'processed' | 'failed' | 'duplicate' | undefined,
    });
  }

  /**
   * Get webhook log details by ID with full payload
   */
  @Get('webhook-logs/:id')
  @ApiOperation({
    summary: 'Get webhook log details',
    description: 'Returns full webhook log with payload for inspection',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook log details with payload',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        webhookType: { type: 'string' },
        externalId: { type: 'string' },
        paymentStatus: { type: 'string' },
        payload: { type: 'object' },
        error: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Webhook log not found' })
  async getWebhookLog(@Param('id') id: string): Promise<unknown> {
    return this.admin.getWebhookLog(id);
  }

  /**
   * Get key access audit trail for an order
   */
  @Get('key-audit/:orderId')
  @ApiOperation({
    summary: 'Get key access audit trail',
    description: 'Returns when keys were revealed to the customer',
  })
  @ApiResponse({
    status: 200,
    description: 'Key access audit trail',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          viewed: { type: 'boolean' },
          viewedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found or has no keys' })
  async getKeyAuditTrail(@Param('orderId') orderId: string): Promise<unknown> {
    return this.admin.getKeyAuditTrail(orderId);
  }

  /**
   * Replay a failed webhook
   * Marks webhook for reprocessing by changing status back to pending
   */
  @Post('webhook-logs/:id/replay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Replay failed webhook',
    description: 'Marks webhook for reprocessing by resetting status to pending',
  })
  @ApiResponse({ status: 200, description: 'Webhook marked for replay' })
  @ApiResponse({ status: 404, description: 'Webhook log not found' })
  @ApiResponse({ status: 400, description: 'Cannot replay processed webhook' })
  async replayWebhook(@Param('id') id: string): Promise<{ ok: boolean }> {
    await this.admin.markWebhookForReplay(id);
    return { ok: true };
  }
}
