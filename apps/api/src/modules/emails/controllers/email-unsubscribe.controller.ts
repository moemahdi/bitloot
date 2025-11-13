import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailUnsubscribeService } from '../services/email-unsubscribe.service';
import { UnsubscribeEmailDto, UnsubscribeResponseDto } from '../dto/unsubscribe.dto';

/**
 * Email Unsubscribe Controller
 *
 * RFC 8058 One-Click Unsubscribe Compliance:
 * - POST /emails/unsubscribe endpoint (public, no auth required)
 * - Email + HMAC token verification
 * - Idempotent: same token always returns success
 * - Prevents enumeration attacks via timing-safe comparison
 *
 * Email clients (Gmail, Outlook, Apple Mail) support List-Unsubscribe: <mailto:...>
 * and List-Unsubscribe-Post: List-Unsubscribe=One-Click headers for one-click
 * unsubscribes
 */
@ApiTags('Emails')
@Controller('emails')
export class EmailUnsubscribeController {
  constructor(private readonly emailUnsubscribeService: EmailUnsubscribeService) {}

  /**
   * Unsubscribe from marketing emails (RFC 8058 One-Click)
   *
   * POST /emails/unsubscribe
   * {
   *   "email": "user@example.com",
   *   "token": "a1b2c3d4e5f6..." (HMAC-SHA256 hex string)
   * }
   *
   * Response (Always 200 OK for valid tokens):
   * {
   *   "status": "success" | "already_unsubscribed" | "invalid_token",
   *   "message": "You have been unsubscribed from marketing emails",
   *   "email": "user@example.com",
   *   "unsubscribedAt": "2025-11-11T10:30:00Z"
   * }
   *
   * Token Generation (backend):
   * token = HMAC-SHA256(email, JWT_SECRET).toString('hex')
   *
   * Email Link:
   * https://api.bitloot.io/emails/unsubscribe?email=X@Y.com&token=ABCDEF...
   * (Frontend redirects to POST via JavaScript or form submission)
   */
  @Post('unsubscribe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unsubscribe from marketing emails (RFC 8058)' })
  @ApiResponse({
    status: 200,
    type: UnsubscribeResponseDto,
    description: 'Email successfully unsubscribed (or was already unsubscribed)',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token or malformed request',
  })
  unsubscribe(@Body() dto: UnsubscribeEmailDto): UnsubscribeResponseDto {
    return this.emailUnsubscribeService.unsubscribe(dto);
  }
}
