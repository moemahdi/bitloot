import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { CreditsTopupService } from './credits-topup.service';
import {
  AdminGrantCreditsDto,
  AdminAdjustCreditsDto,
  AdminCreditsStatsDto,
  AdminUserCreditsQueryDto,
  AdminUserBalancesResultDto,
  AdminUserCreditsDetailDto,
  SuccessResponseDto,
  AdminPendingTopupsResultDto,
} from './dto/admin-credits.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('Admin Credits')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/credits')
export class AdminCreditsController {
  constructor(
    private readonly creditsService: CreditsService,
    private readonly topupService: CreditsTopupService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system-wide credits statistics' })
  @ApiResponse({ status: 200, type: AdminCreditsStatsDto })
  async getStats(): Promise<AdminCreditsStatsDto> {
    return this.creditsService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated user credit balances' })
  @ApiResponse({ status: 200, type: AdminUserBalancesResultDto })
  async getUserBalances(@Query() query: AdminUserCreditsQueryDto): Promise<AdminUserBalancesResultDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.creditsService.getAdminUserBalances(page, limit, query.email);
    return {
      items: result.items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      total: result.total,
      page,
      limit,
    };
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get single user credit details' })
  @ApiResponse({ status: 200, type: AdminUserCreditsDetailDto })
  async getUserCredits(@Param('userId') userId: string): Promise<AdminUserCreditsDetailDto> {
    const balance = await this.creditsService.getBalance(userId);
    const recent = await this.creditsService.getTransactionHistory(userId, 1, 10);

    return {
      userId,
      balance: {
        cash: balance.cash.toFixed(8),
        promo: balance.promo.toFixed(8),
        total: balance.total.toFixed(8),
      },
      recentTransactions: recent.items.map((tx) => ({
        id: tx.id,
        type: tx.type,
        creditType: tx.creditType,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        description: tx.description ?? undefined,
        createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
      })),
    };
  }

  @Post('grant')
  @ApiOperation({ summary: 'Grant promo credits to a user' })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @AuditLog({ action: 'credits.grant', target: 'body.userId', includeBodyFields: ['userId', 'amount', 'reason', 'expiresInDays'] })
  async grantCredits(
    @Body() dto: AdminGrantCreditsDto,
    @Request() req: { user: { id: string; sub?: string } },
  ) {
    const adminId = req.user.id ?? req.user.sub!;
    await this.creditsService.adminGrant(
      dto.userId,
      dto.amount,
      dto.expiresInDays ?? 90,
      dto.reason,
      adminId,
    );
    return { success: true };
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Admin adjust (add/deduct) credits for a user' })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @AuditLog({ action: 'credits.adjust', target: 'body.userId', includeBodyFields: ['userId', 'amount', 'creditType', 'reason'] })
  async adjustCredits(
    @Body() dto: AdminAdjustCreditsDto,
    @Request() req: { user: { id: string; sub?: string } },
  ) {
    const adminId = req.user.id ?? req.user.sub!;
    await this.creditsService.adminAdjust(
      dto.userId,
      dto.amount,
      dto.creditType,
      dto.reason,
      adminId,
    );
    return { success: true };
  }

  @Get('topups/pending')
  @ApiOperation({ summary: 'Get all pending credit topups' })
  @ApiResponse({ status: 200, type: AdminPendingTopupsResultDto })
  async getPendingTopups(): Promise<AdminPendingTopupsResultDto> {
    const topups = await this.topupService.getPendingTopups();
    return {
      items: topups.map((t) => ({
        id: t.id,
        userId: t.userId,
        amountEur: t.amountEur,
        npPaymentId: t.npPaymentId ?? null,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  @Post('topups/:id/confirm')
  @ApiOperation({ summary: 'Manually confirm a pending topup (for IPN recovery)' })
  @ApiParam({ name: 'id', description: 'Topup ID' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @AuditLog({ action: 'credits.topup.confirm', target: 'params.id' })
  async confirmTopup(@Param('id') id: string) {
    const topup = await this.topupService.getTopupById(id);
    if (!topup) {
      throw new NotFoundException(`Topup ${id} not found`);
    }
    if (topup.status !== 'pending') {
      return { success: false, message: `Topup is already ${topup.status}` };
    }
    await this.topupService.confirmTopup(id, topup.npPaymentId ?? 'manual');
    return { success: true, message: 'Topup confirmed and credits granted' };
  }
}
