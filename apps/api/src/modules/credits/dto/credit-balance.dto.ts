import { ApiProperty } from '@nestjs/swagger';

export class CreditBalanceDto {
  @ApiProperty({ description: 'Cash credit balance (from top-ups, never expires)', example: '30.00000000' })
  cash!: string;

  @ApiProperty({ description: 'Promo credit balance (from rewards, expires 90 days)', example: '15.50000000' })
  promo!: string;

  @ApiProperty({ description: 'Total credit balance (cash + promo)', example: '45.50000000' })
  total!: string;

  @ApiProperty({ description: 'Promo credits expiring within 30 days', example: '10.00000000' })
  expiringWithin30Days!: string;
}
