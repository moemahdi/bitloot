import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SuppressionListService } from '../emails/suppression-list.service';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Resend Bounce Webhook Event DTO
 * Webhook payload from Resend API when email bounces
 */
export class ResendBounceEventDto {
  created_at?: string;
  data?: {
    created_at?: string;
    email?: string;
    from_email?: string;
    reason?: string;
    bounced_at?: string;
    id?: string;
  };
  type?: string; // 'email.bounced' or 'email.complained'
}

/**
 * Resend Bounce Webhook Controller
 * Receives bounce and complaint events from Resend API
 * Updates suppression list based on bounce type
 */
@ApiTags('Webhooks')
@Controller('webhooks/resend')
export class ResendBounceController {
  private readonly logger = new Logger(ResendBounceController.name);

  constructor(
    private readonly suppressionList: SuppressionListService,
    private readonly metrics: MetricsService,
  ) {}

  /**
   * Handle email bounce webhook from Resend
   *
   * Event types:
   * - 'email.bounced' → Hard or soft bounce
   * - 'email.complained' → User complaint/spam report
   *
   * @param event Resend webhook event payload
   */
  @Post('bounce')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive email bounce events from Resend',
    description:
      'Webhook endpoint for Resend bounce/complaint events. Updates suppression list.',
  })
  @ApiBody({
    type: ResendBounceEventDto,
    description: 'Resend webhook event payload',
  })
  @ApiResponse({
    status: 200,
    description: 'Bounce event processed',
  })
  async handleBounce(@Body() event: ResendBounceEventDto): Promise<{ status: string }> {
    try {
      if (event.data?.email === null || event.data?.email === undefined || event.data.email === '') {
        this.logger.warn('⚠️  Resend bounce webhook: Missing email address');
        return { status: 'ok' };
      }

      const email = event.data.email;
      const reason = event.data.reason ?? event.type ?? 'Unknown';
      const bounceId = event.data.id;

      // Classify bounce type
      // Hard bounces: Invalid email, user unknown, mailbox unavailable, policy violation
      // Soft bounces: Mailbox full, server down, try again later
      // Complaints: Spam complaint from user
      const hardBounceReasons = [
        'invalid',
        'user unknown',
        'mailbox unavailable',
        'policy violation',
        'invalid mailbox',
        'bad destination mailbox address',
        'does not accept mail',
      ];

      let bounceType: 'hard' | 'soft' | 'complaint' = 'soft';

      if (event.type === 'email.complained') {
        bounceType = 'complaint';
      } else if (
        hardBounceReasons.some((br) => reason.toLowerCase().includes(br.toLowerCase()))
      ) {
        bounceType = 'hard';
      }

      // Add to suppression list
      await this.suppressionList.addBounce(
        email,
        bounceType,
        reason,
        bounceId,
      );

      // Emit metrics
      if (bounceType === 'hard') {
        this.logger.log(`❌ Hard bounce recorded: ${email} (${reason})`);
      } else if (bounceType === 'complaint') {
        this.logger.warn(`⚠️  Complaint recorded: ${email}`);
      } else {
        this.logger.log(`📬 Soft bounce recorded: ${email}`);
      }

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Error processing bounce webhook: ${error instanceof Error ? error.message : String(error)}`);
      // Always return 200 to prevent Resend retries
      return { status: 'ok' };
    }
  }
}
