import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'Admin user ID' })
  @IsUUID()
  adminUserId!: string;

  @ApiProperty({ description: 'Action performed' })
  @IsString()
  action!: string;

  @ApiProperty({ description: 'Target resource' })
  @IsString()
  target!: string;

  @ApiProperty({ description: 'Action payload', required: false })
  @IsOptional()
  payload?: Record<string, unknown>;

  @ApiProperty({ description: 'Action details', required: false })
  @IsOptional()
  @IsString()
  details?: string;
}

export class AuditLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  adminUserId!: string;

  @ApiProperty({ required: false })
  admin?: {
    id: string;
    email: string;
  };

  @ApiProperty()
  action!: string;

  @ApiProperty()
  target!: string;

  @ApiProperty({ required: false })
  payload?: Record<string, unknown>;

  @ApiProperty({ required: false })
  details?: string;

  @ApiProperty()
  createdAt!: Date;
}

export class AuditLogQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  adminUserId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ required: false, default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false, default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class PaginatedAuditLogsDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  data!: AuditLogResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;

  @ApiProperty()
  pages!: number;
}
