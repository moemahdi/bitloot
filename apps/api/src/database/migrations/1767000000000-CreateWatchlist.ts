import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWatchlist1767000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create watchlist_items table
    await queryRunner.query(`
      CREATE TABLE "watchlist_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_watchlist_items" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_watchlist_user_product" UNIQUE ("userId", "productId"),
        CONSTRAINT "FK_watchlist_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_watchlist_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_watchlist_user" ON "watchlist_items" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_watchlist_product" ON "watchlist_items" ("productId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_watchlist_created" ON "watchlist_items" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_watchlist_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_watchlist_product"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_watchlist_user"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "watchlist_items"`);
  }
}
