import { ApiProperty } from '@nestjs/swagger';

/**
 * Order access status DTO
 * Used to determine if the current user can access/reveal keys for an order
 */
export class OrderAccessStatusDto {
  @ApiProperty({ description: 'Whether the user can access keys for this order' })
  canAccess!: boolean;

  @ApiProperty({ 
    description: 'Reason for access status',
    enum: ['owner', 'admin', 'email_match', 'session_token', 'guest_order', 'not_authenticated', 'not_owner'],
    example: 'owner'
  })
  reason!: 'owner' | 'admin' | 'email_match' | 'session_token' | 'guest_order' | 'not_authenticated' | 'not_owner';

  @ApiProperty({ description: 'Whether the user is authenticated' })
  isAuthenticated!: boolean;

  @ApiProperty({ description: 'Whether the order is fulfilled (keys available)' })
  isFulfilled!: boolean;

  @ApiProperty({ 
    description: 'Message to display to the user',
    example: 'You own this order'
  })
  message!: string;
}
