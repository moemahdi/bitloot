import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly from = process.env.EMAIL_FROM ?? 'orders@bitloot.io';

  constructor() {
    this.logger.log('EmailsService initialized (Level 1: mock mode)');
  }

  sendOrderCompleted(to: string, signedUrl: string): Promise<void> {
    const html = `
      <p>Thanks for your purchase!</p>
      <p>Your download link (expires in 15 minutes):</p>
      <p><a href="${signedUrl}">Reveal your key</a></p>
      <p>Keep this link private. We never email plaintext keys.</p>
    `;

    this.logger.log(`[MOCK EMAIL] Sending order completed email to ${to}`);
    this.logger.log(`[MOCK EMAIL] Signed URL: ${signedUrl}`);
    this.logger.log(`[MOCK EMAIL] HTML: ${html}`);

    // For Level 1, we simulate sending the email
    // In production, this will call the real Resend API
    // TODO: Integrate with Resend API in Level 2
    return Promise.resolve();
  }
}
