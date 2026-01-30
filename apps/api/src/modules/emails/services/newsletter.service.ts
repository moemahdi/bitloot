import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Newsletter Service
 * 
 * Simple integration with Resend Audiences for newsletter subscriptions.
 * Handles adding contacts to an audience for marketing emails.
 */
@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly resendApiKey: string;
  private readonly audienceId: string;
  private readonly resendBaseUrl = 'https://api.resend.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY') ?? '';
    this.audienceId = this.configService.get<string>('RESEND_AUDIENCE_ID') ?? '';

    if (this.resendApiKey && this.audienceId) {
      this.logger.log('✅ NewsletterService initialized with Resend Audiences');
    } else {
      this.logger.warn('⚠️  NewsletterService: Missing RESEND_API_KEY or RESEND_AUDIENCE_ID');
    }
  }

  /**
   * Subscribe an email to the newsletter audience
   * 
   * @param email - Email address to subscribe
   * @returns Success status and message
   */
  async subscribe(email: string): Promise<{ success: boolean; message: string }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Mock mode if not configured
    if (!this.resendApiKey || !this.audienceId) {
      this.logger.log(`📧 [MOCK] Newsletter subscription: ${email}`);
      return {
        success: true,
        message: 'Subscription successful (mock mode)',
      };
    }

    try {
      // Add contact to Resend Audience
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.resendBaseUrl}/audiences/${this.audienceId}/contacts`,
          {
            email,
            unsubscribed: false,
          },
          {
            headers: {
              Authorization: `Bearer ${this.resendApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`✅ Newsletter subscription successful: ${email}, contact ID: ${response.data?.id}`);

      return {
        success: true,
        message: 'Successfully subscribed to newsletter',
      };
    } catch (error: unknown) {
      // Handle duplicate email (already subscribed)
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 409) {
        this.logger.log(`ℹ️  Email already subscribed: ${email}`);
        return {
          success: true,
          message: 'You\'re already subscribed!',
        };
      }

      // Handle other errors
      this.logger.error(`❌ Newsletter subscription failed for ${email}:`, axiosError.response?.data ?? error);
      throw new BadRequestException('Failed to subscribe. Please try again.');
    }
  }

  /**
   * Unsubscribe an email from the newsletter
   * 
   * @param email - Email address to unsubscribe
   */
  async unsubscribe(email: string): Promise<{ success: boolean; message: string }> {
    if (!this.resendApiKey || !this.audienceId) {
      this.logger.log(`📧 [MOCK] Newsletter unsubscribe: ${email}`);
      return { success: true, message: 'Unsubscribed (mock mode)' };
    }

    try {
      // First, find the contact by email
      const listResponse = await firstValueFrom(
        this.httpService.get(
          `${this.resendBaseUrl}/audiences/${this.audienceId}/contacts`,
          {
            headers: {
              Authorization: `Bearer ${this.resendApiKey}`,
            },
          },
        ),
      );

      const contacts = listResponse.data?.data ?? [];
      const contact = contacts.find((c: { email: string }) => c.email === email);

      if (!contact) {
        return { success: true, message: 'Email not found in newsletter' };
      }

      // Update contact to unsubscribed
      await firstValueFrom(
        this.httpService.patch(
          `${this.resendBaseUrl}/audiences/${this.audienceId}/contacts/${contact.id}`,
          { unsubscribed: true },
          {
            headers: {
              Authorization: `Bearer ${this.resendApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`✅ Newsletter unsubscribe successful: ${email}`);
      return { success: true, message: 'Successfully unsubscribed' };
    } catch (error) {
      this.logger.error(`❌ Newsletter unsubscribe failed for ${email}:`, error);
      throw new BadRequestException('Failed to unsubscribe. Please try again.');
    }
  }
}
