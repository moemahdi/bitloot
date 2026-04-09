import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreditsService } from './credits.service';
import { CreditsTopupService } from './credits-topup.service';
import { CreditBalanceDto } from './dto/credit-balance.dto';
import { CreditTransactionListDto } from './dto/credit-transaction.dto';
import { CreditTransactionsQueryDto } from './dto/credit-transactions-query.dto';
import { CreateTopupDto, TopupResponseDto, CreateTopupPaymentDto, TopupStatusResponseDto, ConfirmTopupResponseDto } from './dto/create-topup.dto';
import { ExpiringCreditsDto } from './dto/admin-credits.dto';
import { EmbeddedPaymentResponseDto } from '../payments/dto/create-payment.dto';

// Use inline guard reference to match existing pattern
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: { id: string; sub?: string; email: string; role: string };
}

@ApiTags('Credits')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(
    private readonly creditsService: CreditsService,
    private readonly topupService: CreditsTopupService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current credit balance' })
  @ApiResponse({ status: 200, type: CreditBalanceDto })
  async getBalance(@Request() req: AuthenticatedRequest): Promise<CreditBalanceDto> {
    const userId = req.user.id ?? req.user.sub!;
    const balance = await this.creditsService.getBalance(userId);
    const expiring = await this.creditsService.getExpiringCredits(userId, 30);

    return {
      cash: balance.cash.toFixed(8),
      promo: balance.promo.toFixed(8),
      total: balance.total.toFixed(8),
      expiringWithin30Days: expiring.amount.toFixed(8),
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history (paginated)' })
  @ApiResponse({ status: 200, type: CreditTransactionListDto })
  async getTransactions(
    @Request() req: AuthenticatedRequest,
    @Query() query: CreditTransactionsQueryDto,
  ): Promise<CreditTransactionListDto> {
    const userId = req.user.id ?? req.user.sub!;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.creditsService.getTransactionHistory(userId, page, limit, query.creditType);

    return {
      items: result.items.map((tx) => ({
        id: tx.id,
        type: tx.type,
        creditType: tx.creditType,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        referenceType: tx.referenceType,
        referenceId: tx.referenceId,
        description: tx.description,
        expiresAt: tx.expiresAt,
        createdAt: tx.createdAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get promo credits expiring within 30 days' })
  @ApiResponse({ status: 200, type: ExpiringCreditsDto })
  async getExpiring(@Request() req: AuthenticatedRequest): Promise<ExpiringCreditsDto> {
    const userId = req.user.id ?? req.user.sub!;
    const result = await this.creditsService.getExpiringCredits(userId, 30);
    return {
      amount: result.amount.toFixed(8),
      earliest: result.earliest?.toISOString() ?? null,
    };
  }

  @Post('topup')
  @Throttle({ default: { ttl: 3600000, limit: 50 } })
  @ApiOperation({ summary: 'Create a credit top-up record (step 1)' })
  @ApiResponse({ status: 201, type: TopupResponseDto })
  async createTopup(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateTopupDto,
  ): Promise<TopupResponseDto> {
    const userId = req.user.id ?? req.user.sub!;
    const result = await this.topupService.createTopup(userId, dto.amount);

    return {
      topupId: result.topupId,
      amountEur: result.amountEur,
    };
  }

  @Post('topup/:id/pay')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Create embedded payment for a top-up (step 2)' })
  @ApiParam({ name: 'id', description: 'Top-up ID' })
  @ApiResponse({ status: 201, type: EmbeddedPaymentResponseDto })
  async createTopupPayment(
    @Request() req: AuthenticatedRequest,
    @Param('id') topupId: string,
    @Body() dto: CreateTopupPaymentDto,
  ): Promise<EmbeddedPaymentResponseDto> {
    const userId = req.user.id ?? req.user.sub!;
    return this.topupService.createTopupPayment(topupId, userId, dto.payCurrency);
  }

  @Get('topup/:id')
  @ApiOperation({ summary: 'Get top-up details' })
  @ApiParam({ name: 'id', description: 'Top-up ID' })
  @ApiResponse({ status: 200, type: TopupResponseDto })
  async getTopup(
    @Request() req: AuthenticatedRequest,
    @Param('id') topupId: string,
  ): Promise<TopupResponseDto> {
    const userId = req.user.id ?? req.user.sub!;
    return this.topupService.getTopup(topupId, userId);
  }

  @Get('topup/:id/status')
  @ApiOperation({ summary: 'Get top-up status with payment info (for polling)' })
  @ApiParam({ name: 'id', description: 'Top-up ID' })
  @ApiResponse({ status: 200, type: TopupStatusResponseDto })
  async getTopupStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id') topupId: string,
  ): Promise<TopupStatusResponseDto> {
    const userId = req.user.id ?? req.user.sub!;
    return this.topupService.getTopupStatus(topupId, userId);
  }

  @Post('topup/:id/confirm')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({
    summary: 'Manual confirm top-up (fallback when IPN not received)',
    description: 'Verifies payment status with NOWPayments and grants credits if payment is finished',
  })
  @ApiParam({ name: 'id', description: 'Top-up ID' })
  @ApiResponse({ status: 200, type: ConfirmTopupResponseDto })
  async confirmTopup(
    @Request() req: AuthenticatedRequest,
    @Param('id') topupId: string,
  ): Promise<ConfirmTopupResponseDto> {
    const userId = req.user.id ?? req.user.sub!;
    return this.topupService.manualConfirmTopup(topupId, userId);
  }
}
