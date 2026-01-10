import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderItemPriceQuantity1736450000000 implements MigrationInterface {
  name = 'AddOrderItemPriceQuantity1736450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add quantity column with default value
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ADD COLUMN IF NOT EXISTS "quantity" integer NOT NULL DEFAULT 1
    `);

    // Add unitPrice column with default value
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ADD COLUMN IF NOT EXISTS "unitPrice" decimal(10,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "unitPrice"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "quantity"`);
  }
}
