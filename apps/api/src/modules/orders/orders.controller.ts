import { Body, Controller, Get, Param, Post, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CreateOrderDto, OrderResponseDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { EmailsService } from '../emails/emails.service';
import { verifyCaptchaToken } from '../../utils/captcha.util';

interface JwtPayload {
  sub: string;
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
  ) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(@Body() dto: CreateOrderDto, @Request() req: AuthenticatedRequest): Promise<OrderResponseDto> {
    // Verify CAPTCHA token if enabled
    const turnstileEnabled = process.env.TURNSTILE_ENABLED === 'true';
    if (turnstileEnabled) {
      const captchaToken = dto.captchaToken ?? '';
      if (captchaToken.length === 0) {
        throw new Error('CAPTCHA token is required');
      }
      await verifyCaptchaToken(captchaToken);
    }

    // Extract userId from JWT if user is authenticated
    const userId = req.user?.sub ?? undefined;

    const order = await this.orders.create(dto, userId);

    // Send order confirmation email
    try {
      const email = typeof dto.email === 'string' && dto.email.length > 0 ? dto.email : null;
      if (email !== null) {
        await this.emailsService.sendOrderConfirmation(email, {
          orderId: order.id,
          total: order.total,
          currency: 'EUR', // Placeholder - will be set per order in Level 6
          items: order.items?.map((item) => ({ name: `Product ${item.productId}` })) ?? [],
          paymentLink: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/pay/${order.id}`,
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
