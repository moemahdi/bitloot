import { Body, Controller, Get, Param, Post, Patch, UseGuards, Request, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CreateOrderDto, OrderResponseDto } from './dto/create-order.dto';
import { OrderAccessStatusDto } from './dto/order-access.dto';
import { OrdersService } from './orders.service';
import { EmailsService } from '../emails/emails.service';
import { FeatureFlagsService } from '../admin/feature-flags.service';
import { verifyCaptchaToken } from '../../utils/captcha.util';

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

interface AuthenticatedRequest extends ExpressRequest {
  user?: JwtPayload;
}

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly emailsService: EmailsService,
    private readonly featureFlagsService: FeatureFlagsService,
  ) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(@Body() dto: CreateOrderDto, @Request() req: AuthenticatedRequest): Promise<OrderResponseDto> {
    // Extract userId from JWT if user is authenticated
    const userId = req.user?.sub ?? undefined;
    const isAuthenticated = userId !== undefined && userId !== null && userId !== '';

    // Verify CAPTCHA token if feature flag is enabled AND not in development mode AND user is not authenticated
    // Authenticated users are already verified via JWT, so CAPTCHA is redundant for them
    const captchaEnabled = this.featureFlagsService.isEnabled('captcha_enabled');
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (captchaEnabled && !isDevelopment && !isAuthenticated) {
      const captchaToken = dto.captchaToken ?? '';
      if (captchaToken.length === 0) {
        throw new Error('CAPTCHA token is required');
      }
      await verifyCaptchaToken(captchaToken);
    }

    const order = await this.orders.create(dto, userId);

    // Send order confirmation email
    try {
      const email = typeof dto.email === 'string' && dto.email.length > 0 ? dto.email : null;
      if (email !== null) {
        await this.emailsService.sendOrderConfirmation(email, {
          orderId: order.id,
          total: order.total,
          currency: 'EUR',
          items: order.items?.map((item) => ({ 
            name: item.productTitle ?? 'Digital Product',
            price: item.unitPrice,
            quantity: item.quantity ?? 1,
          })) ?? [],
          paymentLink: `${process.env.FRONTEND_URL ?? 'https://bitloot.io'}/orders/${order.id}`,
          createdAt: order.createdAt,
        });
      }
    } catch (emailError) {
      const msg = emailError instanceof Error ? emailError.message : 'Unknown error';
      console.warn(`⚠️  Failed to send order confirmation email: ${msg}`);
    }

    return order;
  }

  @Get(':id/checkout')
  @ApiOperation({ summary: 'Get order for checkout (public - UUID is auth)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getForCheckout(@Param('id') id: string): Promise<OrderResponseDto> {
    // Public endpoint for checkout flow - UUID serves as auth token
    // Only returns order info needed for payment, no sensitive data
    return this.orders.get(id);
  }

  /**
   * Check if the current user can access keys for this order
   * Returns access status based on:
   * - Valid order session token (for immediate guest access after checkout)
   * - userId match (for logged-in users who placed the order)
   * - email match (for guest checkout users who later created an account)
   * - admin role (admins can access all orders)
   */
  @Get(':id/access-status')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-order-session-token',
    description: 'Order session token for immediate guest access (received on order creation)',
    required: false,
  })
  @ApiOperation({ summary: 'Check if current user can access keys for this order' })
  @ApiResponse({ status: 200, type: OrderAccessStatusDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getAccessStatus(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Headers('x-order-session-token') sessionToken?: string,
  ): Promise<OrderAccessStatusDto> {
    const order = await this.orders.get(id);
    const user = req.user ?? null;
    const isFulfilled = order.status === 'fulfilled';

    // ========== CHECK SESSION TOKEN FIRST ==========
    // This allows immediate access for guests who just completed checkout
    if (sessionToken !== undefined && sessionToken.length > 0) {
      const tokenData = this.orders.verifyOrderSessionToken(sessionToken);
      if (tokenData !== null && 
          tokenData.orderId === id && 
          tokenData.email.toLowerCase() === order.email.toLowerCase()) {
        return {
          canAccess: true,
          reason: 'session_token',
          isAuthenticated: user !== null,
          isFulfilled,
          message: 'Access granted via session token',
        };
      }
    }

    // Not authenticated
    if (user === null) {
      return {
        canAccess: false,
        reason: 'not_authenticated',
        isAuthenticated: false,
        isFulfilled,
        message: 'Login to access your keys',
      };
    }

    // Admin can access any order
    if (user.role === 'admin') {
      return {
        canAccess: true,
        reason: 'admin',
        isAuthenticated: true,
        isFulfilled,
        message: 'Admin access',
      };
    }

    // Check userId match (logged-in user who placed the order)
    if (order.userId !== undefined && order.userId !== null && order.userId === user.sub) {
      return {
        canAccess: true,
        reason: 'owner',
        isAuthenticated: true,
        isFulfilled,
        message: 'You own this order',
      };
    }

    // Check email match (guest checkout user who later created account with same email)
    const userEmail = user.email ?? null;
    if (userEmail !== null && order.email.toLowerCase() === userEmail.toLowerCase()) {
      return {
        canAccess: true,
        reason: 'email_match',
        isAuthenticated: true,
        isFulfilled,
        message: 'Order matched by email',
      };
    }

    // Guest order (no userId) - only owner email can access
    if (order.userId === undefined || order.userId === null || order.userId.length === 0) {
      return {
        canAccess: false,
        reason: 'guest_order',
        isAuthenticated: true,
        isFulfilled,
        message: 'This is a guest order. Login with the email used for this order.',
      };
    }

    // Authenticated but not the owner
    return {
      canAccess: false,
      reason: 'not_owner',
      isAuthenticated: true,
      isFulfilled,
      message: 'This order belongs to another account',
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID (requires ownership)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden - order does not belong to user' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async get(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<OrderResponseDto> {
    const user = req.user ?? null;
    if (user === null) {
      throw new Error('User not found in request');
    }
    // Verify ownership before returning
    await this.orders.findUserOrderOrThrow(id, user.sub);
    // Return the order
    return this.orders.get(id);
  }

  @Patch(':id/reservation')
  @ApiOperation({ summary: 'Set Kinguin reservation ID (test/internal use)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async setReservation(
    @Param('id') id: string,
    @Body() body: { reservationId: string },
  ): Promise<OrderResponseDto> {
    await this.orders.setReservationId(id, body.reservationId);
    return this.orders.get(id);
  }
}
