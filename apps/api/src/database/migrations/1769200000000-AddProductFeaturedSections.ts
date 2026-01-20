import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add featured sections fields to products
 * 
 * Adds columns to track which homepage sections a product appears in:
 * - featuredSections: array of section keys (e.g., ['trending', 'featured_games'])
 * - featuredOrder: display order within sections
 */
export class AddProductFeaturedSections1769200000000 implements MigrationInterface {
  name = 'AddProductFeaturedSections1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add featuredSections column (text for simple-array storage)
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "featuredSections" text
    `);

    // Add featuredOrder column
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "featuredOrder" integer NOT NULL DEFAULT 0
    `);

    // Add index for efficient section queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_featuredSections" 
      ON "products" ("featuredSections")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_featuredSections"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "featuredOrder"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "featuredSections"`);
  }
}
