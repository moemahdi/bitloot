import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsString } from 'class-validator';

export class CreateTopupDto {
  @ApiProperty({ description: 'Top-up amount in EUR', example: 50, minimum: 5, maximum: 500 })
  @IsNumber()
  @Min(5)
  @Max(500)
  amount!: number;
}

export class TopupResponseDto {
  @ApiProperty({ description: 'Top-up record ID' })
  topupId!: string;

  @ApiProperty({ description: 'Top-up amount in EUR' })
  amountEur!: number;
}

export class TopupStatusResponseDto {
  @ApiProperty({ description: 'Top-up record ID' })
  topupId!: string;

  @ApiProperty({ description: 'Top-up amount in EUR' })
  amountEur!: number;

  @ApiProperty({ description: 'Top-up status', enum: ['pending', 'confirmed', 'failed', 'expired'] })
  status!: string;

  @ApiPropertyOptional({ description: 'NOWPayments payment status' })
  paymentStatus?: string;

  @ApiPropertyOptional({ description: 'NOWPayments payment ID' })
  npPaymentId?: string;

  @ApiPropertyOptional({ description: 'Cryptocurrency being paid' })
  payCurrency?: string;

  @ApiPropertyOptional({ description: 'Amount received in crypto' })
  actuallyPaid?: number;

  @ApiPropertyOptional({ description: 'Amount expected in crypto' })
  payAmount?: number;

  @ApiPropertyOptional({ description: 'Confirmation timestamp' })
  confirmedAt?: string;
}

export class CreateTopupPaymentDto {
  @ApiProperty({ description: 'Cryptocurrency to pay with', example: 'btc' })
  @IsString()
  payCurrency!: string;
}

export class ConfirmTopupResponseDto {
  @ApiProperty({ description: 'Whether the confirmation was successful' })
  success!: boolean;

  @ApiProperty({ description: 'Result message' })
  message!: string;
}
