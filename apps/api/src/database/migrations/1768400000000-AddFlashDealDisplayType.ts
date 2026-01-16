import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds display_type column to flash_deals table
 * Allows flash deals to be displayed as 'inline' (default) or 'sticky' (above header)
 */
export class AddFlashDealDisplayType1768400000000 implements MigrationInterface {
  name = 'AddFlashDealDisplayType1768400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add display_type column with default 'inline'
    await queryRunner.query(`
      ALTER TABLE "flash_deals" 
      ADD COLUMN IF NOT EXISTS "display_type" VARCHAR(20) NOT NULL DEFAULT 'inline'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "flash_deals" 
      DROP COLUMN IF EXISTS "display_type"
    `);
  }
}
