import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlashDealDisplayType1768500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add display_type column to flash_deals table
    await queryRunner.query(`
      ALTER TABLE flash_deals
      ADD COLUMN IF NOT EXISTS display_type VARCHAR(20) DEFAULT 'inline' NOT NULL
    `);

    // Add index on display_type for filtering active deals by type
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_flash_deals_display_type 
      ON flash_deals (display_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_flash_deals_display_type
    `);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE flash_deals
      DROP COLUMN IF EXISTS display_type
    `);
  }
}
