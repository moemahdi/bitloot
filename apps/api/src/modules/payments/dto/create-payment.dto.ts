import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  orderId!: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  externalId!: string;

  @ApiProperty()
  paymentUrl!: string;
}

export class IpnRequestDto {
  @ApiProperty()
  @IsUUID()
  orderId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  externalId!: string;
}

export class IpnResponseDto {
  @ApiProperty()
  ok!: boolean;
}
