import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add sourceType column to products and orders tables
 *
 * Purpose: Enable hybrid fulfillment model (custom + Kinguin products)
 *
 * Changes:
 * - products.sourceType: ENUM('custom', 'kinguin') DEFAULT 'custom'
 * - products.kinguinOfferId: VARCHAR(255) nullable (required when sourceType='kinguin')
 * - orders.sourceType: ENUM('custom', 'kinguin') DEFAULT 'custom'
 * - order_items.productSourceType: ENUM('custom', 'kinguin') DEFAULT 'custom'
 *
 * Backward Compatibility:
 * - All existing products default to 'custom' (no breaking change)
 * - All existing orders default to 'custom' (no breaking change)
 * - isCustom field kept for backward compatibility (deprecated)
 */
export class AddSourceType1764000000000 implements MigrationInterface {
  name = 'AddSourceType1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for source
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "product_source_type_enum" AS ENUM ('custom', 'kinguin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add sourceType column to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "sourceType" "product_source_type_enum" NOT NULL DEFAULT 'custom'
    `);

    // Add kinguinOfferId column to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "kinguinOfferId" VARCHAR(255) NULL
    `);

    // Add sourceType column to orders table
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "sourceType" "product_source_type_enum" NOT NULL DEFAULT 'custom'
    `);

    // Add productSourceType column to order_items table
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD COLUMN IF NOT EXISTS "productSourceType" "product_source_type_enum" NOT NULL DEFAULT 'custom'
    `);

    // Create index on products.sourceType for filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_sourceType" ON "products" ("sourceType")
    `);

    // Create index on orders.sourceType for filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_sourceType" ON "orders" ("sourceType")
    `);

    // Create index on products.kinguinOfferId for lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_kinguinOfferId" ON "products" ("kinguinOfferId") WHERE "kinguinOfferId" IS NOT NULL
    `);

    // Migrate existing products: if isCustom=true, set sourceType='custom'
    await queryRunner.query(`
      UPDATE "products" SET "sourceType" = 'custom' WHERE "isCustom" = true
    `);

    console.info('✅ Migration complete: sourceType columns added to products, orders, order_items');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_kinguinOfferId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_sourceType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_sourceType"`);

    // Remove columns
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "productSourceType"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "sourceType"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "kinguinOfferId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "sourceType"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "product_source_type_enum"`);

    console.info('✅ Migration reverted: sourceType columns removed');
  }
}
