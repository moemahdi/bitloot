import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitOrders1710000000000 implements MigrationInterface {
  name = 'InitOrders1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(320) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'created',
        "total" numeric(20,8) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid REFERENCES "orders"("id") ON DELETE CASCADE,
        "productId" varchar(100) NOT NULL,
        "signedUrl" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX "IDX_orders_createdAt" ON "orders" ("createdAt");`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_items";`);
    await queryRunner.query(`DROP TABLE "orders";`);
  }
}
