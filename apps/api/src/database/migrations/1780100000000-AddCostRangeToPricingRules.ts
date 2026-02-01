import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add minCostMinor and maxCostMinor columns to dynamic_pricing_rules
 * This enables tiered pricing based on product cost ranges
 * 
 * Example: 
 * - Rule with minCostMinor=0, maxCostMinor=800 (€0-€8) → 35% margin
 * - Rule with minCostMinor=800, maxCostMinor=2500 (€8-€25) → 25% margin
 */
export class AddCostRangeToPricingRules1780100000000 implements MigrationInterface {
  name = 'AddCostRangeToPricingRules1780100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add minCostMinor column (minimum cost in cents for rule to apply)
    await queryRunner.query(`
      ALTER TABLE "dynamic_pricing_rules" 
      ADD COLUMN IF NOT EXISTS "minCostMinor" bigint DEFAULT NULL
    `);

    // Add maxCostMinor column (maximum cost in cents for rule to apply)
    await queryRunner.query(`
      ALTER TABLE "dynamic_pricing_rules" 
      ADD COLUMN IF NOT EXISTS "maxCostMinor" bigint DEFAULT NULL
    `);

    // Create index for cost-based rule lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pricing_rules_cost_range" 
      ON "dynamic_pricing_rules" ("minCostMinor", "maxCostMinor", "isActive")
      WHERE "productId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pricing_rules_cost_range"`);
    await queryRunner.query(`ALTER TABLE "dynamic_pricing_rules" DROP COLUMN IF EXISTS "maxCostMinor"`);
    await queryRunner.query(`ALTER TABLE "dynamic_pricing_rules" DROP COLUMN IF EXISTS "minCostMinor"`);
  }
}
