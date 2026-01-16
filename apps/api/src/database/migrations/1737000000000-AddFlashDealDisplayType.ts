import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlashDealDisplayType1737000000000 implements MigrationInterface {
  name = 'AddFlashDealDisplayType1737000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add display_type column to flash_deals table
    await queryRunner.query(`
      ALTER TABLE "flash_deals" 
      ADD COLUMN IF NOT EXISTS "display_type" varchar(20) NOT NULL DEFAULT 'inline'
    `);

    // Add comment for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "flash_deals"."display_type" IS 'Display type: inline (default position in page) or sticky (above header as a banner)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "flash_deals" DROP COLUMN IF EXISTS "display_type"
    `);
  }
}
