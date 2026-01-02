import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Updates the webhook_logs idempotency unique constraint
 * 
 * BEFORE: UNIQUE(externalId, webhookType, processed)
 * AFTER:  UNIQUE(externalId, webhookType, paymentStatus)
 * 
 * WHY: The old constraint caused issues with Kinguin webhooks where
 * the same order sends multiple status updates (processing → completed).
 * Both had processed=false, causing duplicate key violations.
 * 
 * The new constraint allows different status values for the same
 * externalId + webhookType, which is correct behavior for status transitions.
 */
export class UpdateWebhookIdempotencyConstraint1735827000000 implements MigrationInterface {
  name = 'UpdateWebhookIdempotencyConstraint1735827000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old constraint
    await queryRunner.query(`
      ALTER TABLE "webhook_logs" 
      DROP CONSTRAINT IF EXISTS "UQ_webhook_idempotency"
    `);

    // Remove duplicate rows before creating the new unique constraint
    // Keep only the row with the maximum ID (most recent) for each unique combination
    await queryRunner.query(`
      DELETE FROM "webhook_logs" wl1
      USING "webhook_logs" wl2
      WHERE wl1."externalId" = wl2."externalId"
        AND wl1."webhookType" = wl2."webhookType"
        AND wl1."paymentStatus" = wl2."paymentStatus"
        AND wl1."id" < wl2."id"
    `);

    // Create the new constraint with paymentStatus instead of processed
    await queryRunner.query(`
      ALTER TABLE "webhook_logs" 
      ADD CONSTRAINT "UQ_webhook_idempotency" 
      UNIQUE ("externalId", "webhookType", "paymentStatus")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to the old constraint
    await queryRunner.query(`
      ALTER TABLE "webhook_logs" 
      DROP CONSTRAINT IF EXISTS "UQ_webhook_idempotency"
    `);

    await queryRunner.query(`
      ALTER TABLE "webhook_logs" 
      ADD CONSTRAINT "UQ_webhook_idempotency" 
      UNIQUE ("externalId", "webhookType", "processed")
    `);
  }
}
