import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add missing columns to bundle_deals table:
 * - hero_image: Hero image URL for larger banners
 * - category: Bundle category (e.g., gaming, software, subscription)
 */
export class AddBundleDealColumns1768600000000 implements MigrationInterface {
  name = 'AddBundleDealColumns1768600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if hero_image column exists before adding
    const heroImageExists = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'bundle_deals' AND column_name = 'hero_image'
    `);
    
    if (heroImageExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE bundle_deals 
        ADD COLUMN hero_image VARCHAR(500)
      `);
    }

    // Check if category column exists before adding
    const categoryExists = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'bundle_deals' AND column_name = 'category'
    `);
    
    if (categoryExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE bundle_deals 
        ADD COLUMN category VARCHAR(100)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove category column if it exists
    const categoryExists = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'bundle_deals' AND column_name = 'category'
    `);
    
    if (categoryExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE bundle_deals 
        DROP COLUMN category
      `);
    }

    // Remove hero_image column if it exists
    const heroImageExists = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'bundle_deals' AND column_name = 'hero_image'
    `);
    
    if (heroImageExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE bundle_deals 
        DROP COLUMN hero_image
      `);
    }
  }
}
