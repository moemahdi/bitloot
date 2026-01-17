import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromoFieldsToOrders1769100000000 implements MigrationInterface {
    name = 'AddPromoFieldsToOrders1769100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add promo-related columns to orders table
        await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "promoCodeId" uuid,
      ADD COLUMN "discountAmount" decimal(20,8),
      ADD COLUMN "originalTotal" decimal(20,8)
    `);

        // Add foreign key constraint
        await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_promocode" 
      FOREIGN KEY ("promoCodeId") 
      REFERENCES "promocodes"("id") 
      ON DELETE SET NULL
    `);

        // Create index for promo code lookups
        await queryRunner.query(`
      CREATE INDEX "IDX_orders_promocode" ON "orders" ("promoCodeId")
    `);

        // Set originalTotal = totalCrypto for existing orders (backfill)
        await queryRunner.query(`
      UPDATE "orders" SET "originalTotal" = "totalCrypto" WHERE "originalTotal" IS NULL
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_promocode"`);

        // Drop foreign key
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_promocode"`);

        // Drop columns
        await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "promoCodeId",
      DROP COLUMN IF EXISTS "discountAmount",
      DROP COLUMN IF EXISTS "originalTotal"
    `);
    }
}
