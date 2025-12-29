import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePricingRuleProductIdNullable1764400000000
  implements MigrationInterface
{
  name = 'MakePricingRuleProductIdNullable1764400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make productId column nullable to support global pricing rules
    await queryRunner.query(`
      ALTER TABLE "dynamic_pricing_rules" 
      ALTER COLUMN "productId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: make productId required again
    // Note: This will fail if there are rows with NULL productId
    await queryRunner.query(`
      ALTER TABLE "dynamic_pricing_rules" 
      ALTER COLUMN "productId" SET NOT NULL
    `);
  }
}
