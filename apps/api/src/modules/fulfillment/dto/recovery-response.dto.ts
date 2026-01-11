import { ApiProperty } from '@nestjs/swagger';

export class RecoveryItemDto {
  @ApiProperty({ 
    description: 'Order item ID',
    example: 'uuid-string'
  })
  itemId!: string;

  @ApiProperty({ 
    description: 'Signed URL for key download (null if not available)',
    example: 'https://signed-url-to-key.com',
    nullable: true
  })
  signedUrl!: string | null;
}

export class RecoveryResponseDto {
  @ApiProperty({ 
    description: 'Whether the recovery operation was successful',
    example: true
  })
  recovered!: boolean;

  @ApiProperty({ 
    type: [RecoveryItemDto],
    description: 'List of items and their recovery status',
  })
  items!: RecoveryItemDto[];
}