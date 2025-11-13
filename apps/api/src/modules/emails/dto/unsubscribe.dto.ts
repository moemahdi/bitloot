import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

/**
 * DTO for email unsubscribe requests (Level 4)
 * Supports idempotent unsubscribe via email + token validation
 */
export class UnsubscribeEmailDto {
  @ApiProperty({
    description: 'Email address to unsubscribe',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Unsubscribe token (prevents unauthorized unsubscribes)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  token!: string;
}

/**
 * Response DTO for unsubscribe operations
 */
export class UnsubscribeResponseDto {
  @ApiProperty({
    description: 'Unsubscribe status',
    example: 'success',
  })
  status!: 'success' | 'already_unsubscribed' | 'invalid_token';

  @ApiProperty({
    description: 'Human-readable message',
    example: 'You have been successfully unsubscribed from BitLoot emails',
  })
  message!: string;

  @ApiProperty({
    description: 'Email that was unsubscribed',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'When the unsubscribe took effect (ISO 8601)',
    example: '2025-11-12T14:32:00.000Z',
  })
  unsubscribedAt!: Date;
}
