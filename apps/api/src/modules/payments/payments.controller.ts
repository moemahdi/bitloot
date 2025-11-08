import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  IpnRequestDto,
  IpnResponseDto,
} from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { StorageService } from '../storage/storage.service';
import { EmailsService } from '../emails/emails.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService,
    private readonly storage: StorageService,
    private readonly emails: EmailsService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a fake payment' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  create(@Body() dto: CreatePaymentDto): PaymentResponseDto {
    return this.payments.createFakePayment(dto.orderId);
  }

  @Post('ipn')
  @ApiOperation({ summary: 'Fake IPN webhook to trigger fulfillment' })
  @ApiResponse({ status: 200, type: IpnResponseDto })
  async ipn(@Body() body: IpnRequestDto): Promise<IpnResponseDto> {
    try {
      // 1) Mark order as paid
      const order = await this.orders.markPaid(body.orderId);

      // 2) Generate signed URL for demo file
      const signedUrl = await this.storage.ensureDemoFileAndGetSignedUrl(order.id);

      // 3) Mark order as fulfilled
      await this.orders.fulfill(order.id, signedUrl);

      // 4) Send order completed email
      await this.emails.sendOrderCompleted(order.email, signedUrl);

      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`IPN processing failed: ${errorMessage}`);
      throw error;
    }
  }
}
