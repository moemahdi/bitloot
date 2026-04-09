import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add npPaymentId column to credit_topups table
 * This stores the NOWPayments external payment ID (numeric string)
 * Separate from paymentId which references the internal Payment entity
 */
export class AddCreditTopupNpPaymentId1801000000001 implements MigrationInterface {
  name = 'AddCreditTopupNpPaymentId1801000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "credit_topups"
      ADD COLUMN IF NOT EXISTS "npPaymentId" varchar(64)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_credit_topups_npPaymentId"
      ON "credit_topups" ("npPaymentId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_credit_topups_npPaymentId"
    `);

    await queryRunner.query(`
      ALTER TABLE "credit_topups"
      DROP COLUMN IF EXISTS "npPaymentId"
    `);
  }
}
