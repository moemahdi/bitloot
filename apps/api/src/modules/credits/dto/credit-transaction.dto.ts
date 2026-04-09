import { ApiProperty } from '@nestjs/swagger';
import type { CreditTransactionType, CreditType, CreditReferenceType } from '../entities/credit-transaction.entity';

export class CreditTransactionDto {
  @ApiProperty({ description: 'Transaction ID' })
  id!: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: ['topup', 'spend', 'reward', 'affiliate_conversion', 'referral', 'cashback', 'refund', 'adjustment', 'expiry', 'admin_grant', 'underpayment_recovery'],
  })
  type!: CreditTransactionType;

  @ApiProperty({ description: 'Credit type', enum: ['cash', 'promo'] })
  creditType!: CreditType;

  @ApiProperty({ description: 'Amount (positive = credit, negative = debit)', example: '5.00000000' })
  amount!: string;

  @ApiProperty({ description: 'Balance after this transaction', example: '15.50000000' })
  balanceAfter!: string;

  @ApiProperty({ description: 'Source entity type', required: false })
  referenceType?: CreditReferenceType | null;

  @ApiProperty({ description: 'Source entity ID', required: false })
  referenceId?: string | null;

  @ApiProperty({ description: 'Human-readable description', required: false })
  description?: string | null;

  @ApiProperty({ description: 'Expiry date for promo credits', required: false })
  expiresAt?: Date | null;

  @ApiProperty({ description: 'Transaction timestamp' })
  createdAt!: Date;
}

export class CreditTransactionListDto {
  @ApiProperty({ type: [CreditTransactionDto] })
  items!: CreditTransactionDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;
}
