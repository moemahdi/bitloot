import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add businessCategory column to products table
 * 
 * This migration introduces a new field that represents BitLoot's 4 product categories:
 * - games: Game keys and accounts
 * - software: Windows, Office, antivirus, etc.
 * - gift-cards: Steam Wallet, PlayStation, Xbox, etc.
 * - subscriptions: Game Pass, PS Plus, EA Play, etc.
 * 
 * The existing 'category' field (from Kinguin genres) is retained for SEO and detailed filtering.
 */
export class AddBusinessCategory1770000000000 implements MigrationInterface {
  name = 'AddBusinessCategory1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add the businessCategory column with default 'games'
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "businessCategory" varchar(50) NOT NULL DEFAULT 'games'
    `);

    // Step 2: Create index for businessCategory filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_businessCategory_isPublished" 
      ON "products" ("businessCategory", "isPublished")
    `);

    // Step 3: Update existing products based on name/category detection
    // Gift Cards detection
    await queryRunner.query(`
      UPDATE "products"
      SET "businessCategory" = 'gift-cards'
      WHERE "businessCategory" = 'games'
        AND (
          LOWER("title") LIKE '%gift card%'
          OR LOWER("title") LIKE '%wallet code%'
          OR LOWER("title") LIKE '%wallet card%'
          OR LOWER("title") LIKE '%psn card%'
          OR LOWER("title") LIKE '%xbox live gold%'
          OR LOWER("title") LIKE '%nintendo eshop%'
          OR LOWER("title") LIKE '%steam wallet%'
          OR LOWER("title") LIKE '%google play%'
          OR LOWER("title") LIKE '%itunes%'
          OR LOWER("title") LIKE '%spotify%'
          OR LOWER("title") LIKE '%netflix%'
        )
    `);

    // Subscriptions detection
    await queryRunner.query(`
      UPDATE "products"
      SET "businessCategory" = 'subscriptions'
      WHERE "businessCategory" = 'games'
        AND (
          LOWER("title") LIKE '%game pass%'
          OR LOWER("title") LIKE '%gamepass%'
          OR LOWER("title") LIKE '%ps plus%'
          OR LOWER("title") LIKE '%playstation plus%'
          OR LOWER("title") LIKE '%ea play%'
          OR LOWER("title") LIKE '%ubisoft+%'
          OR LOWER("title") LIKE '%ubisoft plus%'
          OR LOWER("title") LIKE '%subscription%'
          OR LOWER("title") LIKE '%membership%'
          OR LOWER("title") LIKE '% month%'
          OR LOWER("title") LIKE '% year%'
          OR LOWER("title") LIKE '%12 months%'
          OR LOWER("title") LIKE '%365 days%'
        )
    `);

    // Software detection
    await queryRunner.query(`
      UPDATE "products"
      SET "businessCategory" = 'software'
      WHERE "businessCategory" = 'games'
        AND (
          LOWER("title") LIKE '%windows%'
          OR LOWER("title") LIKE '%office%'
          OR LOWER("title") LIKE '%microsoft 365%'
          OR LOWER("title") LIKE '%antivirus%'
          OR LOWER("title") LIKE '%vpn%'
          OR LOWER("title") LIKE '%adobe%'
          OR LOWER("title") LIKE '%photoshop%'
          OR LOWER("title") LIKE '%visual studio%'
          OR LOWER("title") LIKE '%autocad%'
          OR LOWER("title") LIKE '%avg%'
          OR LOWER("title") LIKE '%norton%'
          OR LOWER("title") LIKE '%kaspersky%'
          OR LOWER("title") LIKE '%mcafee%'
          OR LOWER("category") = 'software'
          OR LOWER("category") = 'application'
          OR LOWER("category") = 'applications'
        )
    `);

    // Step 4: Add isFeatured column for featured products section
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false
    `);

    // Step 5: Create index for featured products
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_isFeatured_isPublished" 
      ON "products" ("isFeatured", "isPublished") 
      WHERE "isFeatured" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_isFeatured_isPublished"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "isFeatured"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_businessCategory_isPublished"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "businessCategory"`);
  }
}
