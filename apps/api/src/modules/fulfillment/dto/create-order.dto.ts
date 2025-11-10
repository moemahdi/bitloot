import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a Kinguin order
 *
 * Represents the request payload for ordering a product from Kinguin.
 * Validates offerId and quantity before sending to Kinguin API.
 */
export class CreateOrderDto {
  /**
   * Kinguin product identifier (SKU or product ID)
   *
   * @example "game-789-sku"
   */
  @ApiProperty({
    description: 'Kinguin product identifier (SKU)',
    example: 'game-789-sku',
    minLength: 1,
  })
  @IsNotEmpty({ message: 'offerId is required' })
  offerId!: string;

  /**
   * Quantity of product to order
   *
   * Must be between 1 and 100 units
   * @example 1
   */
  @ApiProperty({
    description: 'Quantity to order (1-100)',
    example: 1,
    minimum: 1,
    maximum: 100,
  })
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  @Max(100, { message: 'quantity cannot exceed 100' })
  quantity!: number;
}
