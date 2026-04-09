import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCreditOnly1801000000000 implements MigrationInterface {
  name = 'AddProductCreditOnly1801000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add creditOnly column to products table
    // Products with creditOnly=true can ONLY be purchased with BitLoot Credits
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "creditOnly" boolean NOT NULL DEFAULT false
    `);

    // Index for filtering credit-only products
    await queryRunner.query(`
      CREATE INDEX "IDX_products_creditOnly" ON "products" ("creditOnly")
      WHERE "creditOnly" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_products_creditOnly"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "creditOnly"`);
  }
}
