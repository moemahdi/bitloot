import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add completionEmailSent flag to orders
 * 
 * Purpose: Prevent duplicate completion emails when fulfillment runs multiple times
 * (e.g., from both Kinguin webhook and manual trigger)
 * 
 * The flag is set to TRUE after the first completion email is sent,
 * and subsequent fulfillment runs will check this flag before sending.
 */
export class AddCompletionEmailSent1767200000000 implements MigrationInterface {
  name = 'AddCompletionEmailSent1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add completionEmailSent column to orders table
    // Default to FALSE for new orders, set to TRUE when email is sent
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "completionEmailSent" BOOLEAN NOT NULL DEFAULT FALSE
    `);

    // For existing fulfilled orders, set the flag to TRUE
    // (we assume they already received their email)
    await queryRunner.query(`
      UPDATE "orders"
      SET "completionEmailSent" = TRUE
      WHERE "status" = 'fulfilled'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN "completionEmailSent"
    `);
  }
}
