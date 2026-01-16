import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBundleProductDiscountPercent1737052800000 implements MigrationInterface {
  name = 'AddBundleProductDiscountPercent1737052800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add discount_percent column to bundle_products table
    await queryRunner.query(`
      ALTER TABLE "bundle_products" 
      ADD COLUMN IF NOT EXISTS "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bundle_products" DROP COLUMN IF EXISTS "discount_percent"
    `);
  }
}
