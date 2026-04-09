import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsInt, Min, Max, MinLength, MaxLength, IsEnum } from 'class-validator';

export class AdminGrantCreditsDto {
  @ApiProperty({ description: 'User ID to grant credits to' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: 'Amount to grant in EUR', example: 10 })
  @IsNumber()
  @Min(0.01)
  @Max(10000)
  amount!: number;

  @ApiProperty({ description: 'Expiry in days (default 90)', required: false, default: 90 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;

  @ApiProperty({ description: 'Reason for grant (audit trail)', example: 'Customer goodwill - order issue' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class AdminAdjustCreditsDto {
  @ApiProperty({ description: 'User ID to adjust' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: 'Amount to adjust (positive = add, negative = subtract)', example: -5 })
  @IsNumber()
  @Min(-10000)
  @Max(10000)
  amount!: number;

  @ApiProperty({ description: 'Credit type to adjust', enum: ['cash', 'promo'] })
  @IsEnum(['cash', 'promo'])
  creditType!: 'cash' | 'promo';

  @ApiProperty({ description: 'Reason for adjustment (audit trail)', example: 'Correction for duplicate charge' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class AdminCreditsStatsDto {
  @ApiProperty({ description: 'Total outstanding cash credit liability' })
  totalCashOutstanding!: string;

  @ApiProperty({ description: 'Total outstanding promo credit liability' })
  totalPromoOutstanding!: string;

  @ApiProperty({ description: 'Total credits issued this month' })
  issuedThisMonth!: string;

  @ApiProperty({ description: 'Total credits spent this month' })
  spentThisMonth!: string;

  @ApiProperty({ description: 'Promo credit expiry rate percentage' })
  expiryRate!: string;

  @ApiProperty({ description: 'Total users with credits' })
  totalUsers!: number;
}

export class AdminUserCreditsQueryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @Min(1)
  @IsInt()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  @Min(1)
  @Max(50)
  @IsInt()
  limit?: number;

  @ApiProperty({ description: 'Search by email', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Sort by field', required: false, enum: ['balance', 'createdAt'] })
  @IsOptional()
  @IsEnum(['balance', 'createdAt'])
  sortBy?: 'balance' | 'createdAt';
}

// ── Response DTOs ──────────────────────────────────────────────────

export class ExpiringCreditsDto {
  @ApiProperty({ description: 'Total promo credits expiring within 30 days' })
  amount!: string;

  @ApiProperty({ description: 'Earliest expiry date', nullable: true, type: String })
  earliest!: string | null;
}

export class AdminUserBalanceDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'User email', required: false })
  email?: string;

  @ApiProperty({ description: 'Cash balance' })
  cashBalance!: string;

  @ApiProperty({ description: 'Promo balance' })
  promoBalance!: string;

  @ApiProperty({ description: 'Total spent all time' })
  totalSpent!: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt!: string;
}

export class AdminUserBalancesResultDto {
  @ApiProperty({ description: 'User balances', type: [AdminUserBalanceDto] })
  items!: AdminUserBalanceDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;
}

export class AdminUserCreditsBalanceDto {
  @ApiProperty({ description: 'Cash balance' })
  cash!: string;

  @ApiProperty({ description: 'Promo balance' })
  promo!: string;

  @ApiProperty({ description: 'Total balance' })
  total!: string;
}

export class AdminUserTransactionDto {
  @ApiProperty({ description: 'Transaction ID' })
  id!: string;

  @ApiProperty({ description: 'Transaction type' })
  type!: string;

  @ApiProperty({ description: 'Credit type' })
  creditType!: string;

  @ApiProperty({ description: 'Amount' })
  amount!: string;

  @ApiProperty({ description: 'Balance after transaction' })
  balanceAfter!: string;

  @ApiProperty({ description: 'Description', required: false })
  description?: string;

  @ApiProperty({ description: 'Transaction date' })
  createdAt!: string;
}

export class AdminUserCreditsDetailDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'User balance', type: AdminUserCreditsBalanceDto })
  balance!: AdminUserCreditsBalanceDto;

  @ApiProperty({ description: 'Recent transactions', type: [AdminUserTransactionDto] })
  recentTransactions!: AdminUserTransactionDto[];
}

export class SuccessResponseDto {
  @ApiProperty({ description: 'Success indicator' })
  success!: boolean;

  @ApiProperty({ description: 'Optional message', required: false })
  message?: string;
}

// ── Topup Admin DTOs ──────────────────────────────────────────────────

export class AdminPendingTopupDto {
  @ApiProperty({ description: 'Topup ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Amount in EUR' })
  amountEur!: string;

  @ApiProperty({ description: 'NOWPayments payment ID', required: false, nullable: true, type: String })
  npPaymentId?: string | null;

  @ApiProperty({ description: 'Status' })
  status!: string;

  @ApiProperty({ description: 'Created at' })
  createdAt!: string;
}

export class AdminPendingTopupsResultDto {
  @ApiProperty({ description: 'Pending topups', type: [AdminPendingTopupDto] })
  items!: AdminPendingTopupDto[];
}
