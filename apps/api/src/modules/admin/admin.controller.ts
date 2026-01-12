import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminService } from './admin.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { BulkUpdateStatusDto, BulkUpdateStatusResponseDto, OrderAnalyticsDto } from './dto/bulk-operations.dto';

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
  constructor(private readonly admin: AdminService) { }

  /**
   * Get dashboard statistics
   * Returns aggregated revenue, orders, users, and sales history
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Returns aggregated revenue, orders, users, and sales history',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    type: DashboardStatsDto,
  })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.admin.getDashboardStats();
  }

  /**
   * Get paginated list of orders
   * Filters by email, status, date range, and source type
   */
  @Get('orders')
  @ApiOperation({
    summary: 'Get paginated list of orders',
    description: 'Returns all orders with payment and fulfillment status',
  })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 50 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiQuery({ name: 'email', type: String, required: false, example: 'user@example.com' })
  @ApiQuery({ name: 'search', type: String, required: false, example: 'user@example.com', description: 'Search by email or order ID' })
  @ApiQuery({ name: 'status', type: String, required: false, example: 'fulfilled' })
  @ApiQuery({ name: 'startDate', type: String, required: false, example: '2025-01-01', description: 'Filter orders created on or after this date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', type: String, required: false, example: '2025-01-31', description: 'Filter orders created on or before this date (ISO 8601)' })
  @ApiQuery({ name: 'sourceType', type: String, required: false, enum: ['custom', 'kinguin'], description: 'Filter by fulfillment source type' })
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
              sourceType: { type: 'string', enum: ['custom', 'kinguin'] },
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
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sourceType') sourceType?: 'custom' | 'kinguin',
  ): Promise<{ data: Array<{ id: string; email: string; status: string; total: string; sourceType: string; createdAt: Date; payment?: { id: string; provider: string; status: string } }>; total: number; limit: number; offset: number }> {
    return this.admin.getOrders({
      limit: parseInt(limit ?? '50', 10),
      offset: parseInt(offset ?? '0', 10),
      email,
      search,
      status,
      startDate: startDate !== undefined ? new Date(startDate) : undefined,
      endDate: endDate !== undefined ? new Date(endDate) : undefined,
      sourceType,
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
    description: 'Returns when keys were revealed to the customer with product info',
  })
  @ApiResponse({
    status: 200,
    description: 'Key access audit trail',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Key ID' },
          orderItemId: { type: 'string', description: 'Order item ID' },
          viewed: { type: 'boolean', description: 'Whether key was revealed' },
          viewedAt: { type: 'string', format: 'date-time', nullable: true, description: 'When key was revealed' },
          downloadCount: { type: 'number', description: 'Number of times key was downloaded' },
          lastAccessIp: { type: 'string', nullable: true, description: 'IP address of last access' },
          lastAccessUserAgent: { type: 'string', nullable: true, description: 'User agent of last access' },
          createdAt: { type: 'string', format: 'date-time', description: 'When key was created' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found or has no keys' })
  async getKeyAuditTrail(@Param('orderId') orderId: string): Promise<unknown> {
    return this.admin.getKeyAuditTrail(orderId);
  }

  /**
   * Admin reveal key - View key content for support purposes
   * ⚠️ Security: This action is logged for audit purposes
   */
  @Get('keys/:keyId/reveal')
  @ApiOperation({
    summary: 'Admin reveal key (for support)',
    description: 'Reveals key content for admin support purposes. This action is logged for audit.',
  })
  @ApiResponse({
    status: 200,
    description: 'Key content revealed',
    schema: {
      type: 'object',
      properties: {
        keyId: { type: 'string' },
        orderItemId: { type: 'string' },
        orderId: { type: 'string' },
        plainKey: { type: 'string', description: 'The actual key content' },
        contentType: { type: 'string' },
        isBase64: { type: 'boolean' },
        viewedAt: { type: 'string', format: 'date-time', nullable: true },
        downloadCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Key not found' })
  async adminRevealKey(
    @Param('keyId') keyId: string,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.admin.adminRevealKey(keyId, {
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip ?? 'unknown',
      userAgent: (req.headers['user-agent'] as string) ?? 'unknown',
    });
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

  /**
   * Update order status (admin override)
   * Used for manual refunds, status corrections, etc.
   */
  @Patch('orders/:id/status')
  @ApiOperation({
    summary: 'Update order status',
    description: 'Admin override to update order status. Used for manual refunds or corrections. All changes are logged.',
  })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        orderId: { type: 'string' },
        previousStatus: { type: 'string' },
        newStatus: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ): Promise<{ ok: boolean; orderId: string; previousStatus: string; newStatus: string }> {
    return this.admin.updateOrderStatus(id, body.status, body.reason);
  }

  /**
   * Resend key delivery email to customer
   * Regenerates signed URLs and sends new email
   */
  @Post('orders/:id/resend-keys')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend key delivery email',
    description: 'Regenerates signed URLs for keys and resends delivery email to customer. Only works for fulfilled orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Keys email resent successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        orderId: { type: 'string' },
        email: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Order not fulfilled - cannot resend keys' })
  async resendKeys(@Param('id') id: string): Promise<{ ok: boolean; orderId: string; email: string }> {
    return this.admin.resendKeysEmail(id);
  }

  /**
   * Bulk update order status
   * Updates multiple orders at once with the same status
   */
  @Patch('orders/bulk-status')
  @ApiOperation({
    summary: 'Bulk update order status',
    description: 'Update status for multiple orders at once. Maximum 100 orders per request. All changes are logged.',
  })
  @ApiBody({ type: BulkUpdateStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk update completed',
    type: BulkUpdateStatusResponseDto,
  })
  async bulkUpdateStatus(
    @Body() body: BulkUpdateStatusDto,
  ): Promise<BulkUpdateStatusResponseDto> {
    return this.admin.bulkUpdateStatus(body.orderIds, body.status, body.reason);
  }

  /**
   * Export orders with date range
   * Returns orders as JSON for client-side CSV generation
   */
  @Get('orders/export')
  @ApiOperation({
    summary: 'Export orders with date range',
    description: 'Returns all orders matching filters for export. Client handles CSV generation.',
  })
  @ApiQuery({ name: 'startDate', type: String, required: true, example: '2025-01-01', description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', type: String, required: true, example: '2025-01-31', description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'status', type: String, required: false, example: 'fulfilled' })
  @ApiQuery({ name: 'sourceType', type: String, required: false, enum: ['custom', 'kinguin'] })
  @ApiResponse({
    status: 200,
    description: 'Orders for export',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          status: { type: 'string' },
          sourceType: { type: 'string' },
          total: { type: 'string' },
          createdAt: { type: 'string' },
          paymentProvider: { type: 'string' },
          paymentStatus: { type: 'string' },
          paymentId: { type: 'string' },
        },
      },
    },
  })
  async exportOrders(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: string,
    @Query('sourceType') sourceType?: 'custom' | 'kinguin',
  ): Promise<Array<{
    id: string;
    email: string;
    status: string;
    sourceType: string;
    total: string;
    createdAt: string;
    paymentProvider?: string;
    paymentStatus?: string;
    paymentId?: string;
  }>> {
    return this.admin.exportOrders({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      sourceType,
    });
  }

  /**
   * Get order analytics
   * Returns aggregated statistics for dashboard widgets
   */
  @Get('orders/analytics')
  @ApiOperation({
    summary: 'Get order analytics',
    description: 'Returns aggregated order statistics: by status, by source type, daily volume, and rates',
  })
  @ApiQuery({ name: 'days', type: Number, required: false, example: 30, description: 'Number of days to analyze (default 30)' })
  @ApiResponse({
    status: 200,
    description: 'Order analytics',
    type: OrderAnalyticsDto,
  })
  async getOrderAnalytics(
    @Query('days') days?: string,
  ): Promise<OrderAnalyticsDto> {
    return this.admin.getOrderAnalytics(days !== undefined ? parseInt(days, 10) : 30);
  }
}
