import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create Product Inventory System
 *
 * This migration adds support for custom products with local inventory management.
 *
 * Creates:
 * 1. product_inventory table - Stores encrypted digital items
 * 2. New fields on products table - Delivery type, stock tracking, settings
 *
 * Part of the Custom Products Feature (Phase 1)
 */
export class CreateProductInventory1780300000000 implements MigrationInterface {
  name = 'CreateProductInventory1780300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. ADD NEW COLUMNS TO PRODUCTS TABLE
    // ============================================
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "deliveryType" VARCHAR(20) NOT NULL DEFAULT 'key';
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "customFieldDefinitions" JSONB;
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "deliveryInstructions" TEXT;
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "stockAvailable" INT NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "stockReserved" INT NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "stockSold" INT NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "lowStockThreshold" INT;
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "autoUnpublishWhenOutOfStock" BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // ============================================
    // 2. CREATE PRODUCT_INVENTORY TABLE
    // ============================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_inventory" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "productId" UUID NOT NULL,
        "deliveryType" VARCHAR(20) NOT NULL DEFAULT 'key',
        
        -- Encrypted item data (AES-256-GCM)
        "itemDataEncrypted" TEXT NOT NULL,
        "encryptionIv" VARCHAR(32) NOT NULL,
        "authTag" VARCHAR(32) NOT NULL,
        
        -- Status tracking
        "status" VARCHAR(20) NOT NULL DEFAULT 'available',
        "reservedForOrderId" UUID,
        "reservedAt" TIMESTAMPTZ,
        "soldToOrderId" UUID,
        "soldAt" TIMESTAMPTZ,
        "expiresAt" TIMESTAMPTZ,
        
        -- Audit fields
        "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "uploadedById" UUID,
        "supplier" VARCHAR(255),
        "cost" DECIMAL(10, 2),
        "soldPrice" DECIMAL(10, 2),
        "notes" TEXT,
        
        -- Integrity
        "itemHash" VARCHAR(64),
        "maskedPreview" VARCHAR(255),
        
        -- Quality tracking
        "wasReported" BOOLEAN NOT NULL DEFAULT FALSE,
        "invalidReason" TEXT,
        "invalidatedById" UUID,
        "invalidatedAt" TIMESTAMPTZ,
        
        CONSTRAINT "fk_product_inventory_product"
          FOREIGN KEY ("productId")
          REFERENCES "products"("id")
          ON DELETE CASCADE
      );
    `);

    // ============================================
    // 3. CREATE INDEXES
    // ============================================
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_inventory_product_id"
        ON "product_inventory" ("productId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_inventory_product_status"
        ON "product_inventory" ("productId", "status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_inventory_status"
        ON "product_inventory" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_inventory_item_hash"
        ON "product_inventory" ("itemHash");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_inventory_expires_at"
        ON "product_inventory" ("expiresAt")
        WHERE "expiresAt" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_inventory_reserved_at"
        ON "product_inventory" ("reservedAt")
        WHERE "reservedAt" IS NOT NULL;
    `);

    // Composite index for finding available items (FIFO order)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_inventory_available_fifo"
        ON "product_inventory" ("productId", "uploadedAt")
        WHERE "status" = 'available';
    `);

    // Index on products for delivery type
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_delivery_type"
        ON "products" ("deliveryType");
    `);

    // Index on products for stock tracking
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_stock_available"
        ON "products" ("stockAvailable")
        WHERE "sourceType" = 'custom';
    `);

    // ============================================
    // 4. ADD inventoryItemId TO order_items
    // ============================================
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD COLUMN IF NOT EXISTS "inventoryItemId" uuid;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_order_items_inventory_item_id"
        ON "order_items" ("inventoryItemId")
        WHERE "inventoryItemId" IS NOT NULL;
    `);

    // ============================================
    // 5. ADD COMMENTS FOR DOCUMENTATION
    // ============================================
    await queryRunner.query(`
      COMMENT ON TABLE "product_inventory" IS 
        'Stores encrypted digital items (keys, accounts, codes) for custom products';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "product_inventory"."itemDataEncrypted" IS 
        'AES-256-GCM encrypted JSON containing item data (key, credentials, etc.)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "product_inventory"."status" IS 
        'Item status: available, reserved, sold, expired, invalid';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "product_inventory"."itemHash" IS 
        'SHA-256 hash for duplicate detection';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "products"."deliveryType" IS 
        'Type of digital item: key, account, code, license, bundle, custom';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "products"."stockAvailable" IS 
        'Count of available items in product_inventory table';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "order_items"."inventoryItemId" IS 
        'Reference to product_inventory.id when fulfilled from inventory system';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_order_items_inventory_item_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_stock_available";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_delivery_type";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_inventory_available_fifo";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_inventory_reserved_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_inventory_expires_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_inventory_item_hash";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_inventory_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_inventory_product_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_inventory_product_id";`);

    // Remove inventoryItemId from order_items
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "inventoryItemId";`);

    // Drop product_inventory table
    await queryRunner.query(`DROP TABLE IF EXISTS "product_inventory";`);

    // Remove columns from products table
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "autoUnpublishWhenOutOfStock";`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "lowStockThreshold";`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "stockSold";`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "stockReserved";`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "stockAvailable";`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "deliveryInstructions";`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "customFieldDefinitions";`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "deliveryType";`);
  }
}
