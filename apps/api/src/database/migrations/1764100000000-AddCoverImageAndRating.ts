import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add coverImageUrl and rating columns to products table
 *
 * Purpose: Store product cover images and ratings from Kinguin API
 *
 * Changes:
 * - products.coverImageUrl: TEXT nullable (URL to product cover image)
 * - products.rating: NUMERIC(3,2) nullable (product rating 0-5)
 */
export class AddCoverImageAndRating1764100000000 implements MigrationInterface {
  name = 'AddCoverImageAndRating1764100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add coverImageUrl column to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT NULL
    `);

    // Add rating column to products table (if not exists)
    // First check if it exists
    const ratingExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'rating'
    `)) as { column_name: string }[];

    if (ratingExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "products"
        ADD COLUMN "rating" NUMERIC(3, 2) NULL
      `);
    }

    console.info('✅ Migration complete: coverImageUrl and rating columns added to products');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "coverImageUrl"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "rating"`);

    console.info('✅ Migration reverted: coverImageUrl and rating columns removed');
  }
}
