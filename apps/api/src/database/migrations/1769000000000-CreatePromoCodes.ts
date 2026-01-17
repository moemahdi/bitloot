import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePromoCodes1769000000000 implements MigrationInterface {
    name = 'CreatePromoCodes1769000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create promocodes table
        await queryRunner.query(`
      CREATE TYPE "promocodes_discounttype_enum" AS ENUM ('percent', 'fixed')
    `);

        await queryRunner.query(`
      CREATE TYPE "promocodes_scopetype_enum" AS ENUM ('global', 'category', 'product')
    `);

        await queryRunner.query(`
      CREATE TABLE "promocodes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(50) NOT NULL,
        "description" varchar(255),
        "discountType" "promocodes_discounttype_enum" NOT NULL DEFAULT 'percent',
        "discountValue" decimal(20,8) NOT NULL,
        "minOrderValue" decimal(20,8),
        "maxUsesTotal" integer,
        "maxUsesPerUser" integer,
        "usageCount" integer NOT NULL DEFAULT 0,
        "scopeType" "promocodes_scopetype_enum" NOT NULL DEFAULT 'global',
        "scopeValue" varchar(500),
        "startsAt" TIMESTAMP WITH TIME ZONE,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "stackable" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_promocodes" PRIMARY KEY ("id")
      )
    `);

        // Create unique index on code
        await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_promocodes_code" ON "promocodes" ("code")
    `);

        // Create index for active/date filtering
        await queryRunner.query(`
      CREATE INDEX "IDX_promocodes_active_dates" ON "promocodes" ("isActive", "startsAt", "expiresAt")
    `);

        // Create index for scope filtering
        await queryRunner.query(`
      CREATE INDEX "IDX_promocodes_scope" ON "promocodes" ("scopeType", "scopeValue")
    `);

        // Create promoredemptions table
        await queryRunner.query(`
      CREATE TABLE "promoredemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "promoCodeId" uuid NOT NULL,
        "orderId" uuid NOT NULL,
        "userId" uuid,
        "email" varchar(320) NOT NULL,
        "discountApplied" decimal(20,8) NOT NULL,
        "originalTotal" decimal(20,8) NOT NULL,
        "finalTotal" decimal(20,8) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_promoredemptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_promoredemptions_promocode" FOREIGN KEY ("promoCodeId") REFERENCES "promocodes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_promoredemptions_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_promoredemptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

        // Create unique constraint for idempotency (one redemption per code+order)
        await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_promoredemptions_code_order" ON "promoredemptions" ("promoCodeId", "orderId")
    `);

        // Create index for promo code redemption lookup
        await queryRunner.query(`
      CREATE INDEX "IDX_promoredemptions_promocode_date" ON "promoredemptions" ("promoCodeId", "createdAt")
    `);

        // Create index for order lookup
        await queryRunner.query(`
      CREATE INDEX "IDX_promoredemptions_order" ON "promoredemptions" ("orderId")
    `);

        // Create index for user redemption lookup
        await queryRunner.query(`
      CREATE INDEX "IDX_promoredemptions_user_promocode" ON "promoredemptions" ("userId", "promoCodeId")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promoredemptions_user_promocode"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promoredemptions_order"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promoredemptions_promocode_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promoredemptions_code_order"`);

        // Drop promoredemptions table
        await queryRunner.query(`DROP TABLE IF EXISTS "promoredemptions"`);

        // Drop promocodes indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promocodes_scope"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promocodes_active_dates"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promocodes_code"`);

        // Drop promocodes table
        await queryRunner.query(`DROP TABLE IF EXISTS "promocodes"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE IF EXISTS "promocodes_scopetype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "promocodes_discounttype_enum"`);
    }
}
