import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NewsletterService } from '../services/newsletter.service';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Newsletter Subscription DTO
 */
export class NewsletterSubscribeDto {
  @ApiProperty({
    description: 'Email address to subscribe',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

/**
 * Newsletter Response DTO
 */
export class NewsletterResponseDto {
  @ApiProperty({ description: 'Success status' })
  success!: boolean;

  @ApiProperty({ description: 'Response message' })
  message!: string;
}

/**
 * Newsletter Controller
 * 
 * Public endpoints for newsletter subscription management.
 * Uses Resend Audiences for storing subscribers.
 */
@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /**
   * Subscribe to newsletter
   * 
   * Public endpoint - no authentication required.
   * Adds email to Resend Audience for marketing emails.
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiBody({ type: NewsletterSubscribeDto })
  @ApiResponse({
    status: 200,
    description: 'Subscription successful',
    type: NewsletterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email or subscription failed',
  })
  async subscribe(@Body() dto: NewsletterSubscribeDto): Promise<NewsletterResponseDto> {
    return this.newsletterService.subscribe(dto.email.toLowerCase().trim());
  }

  /**
   * Unsubscribe from newsletter
   * 
   * Public endpoint - no authentication required.
   * Marks contact as unsubscribed in Resend Audience.
   */
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  @ApiBody({ type: NewsletterSubscribeDto })
  @ApiResponse({
    status: 200,
    description: 'Unsubscription successful',
    type: NewsletterResponseDto,
  })
  async unsubscribe(@Body() dto: NewsletterSubscribeDto): Promise<NewsletterResponseDto> {
    return this.newsletterService.unsubscribe(dto.email.toLowerCase().trim());
  }
}
