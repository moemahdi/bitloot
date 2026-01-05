import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Link existing orders to users by email
 *
 * This migration links all existing orders (including guest orders) to user accounts
 * by matching the order email to user email. This ensures that:
 * 1. Guest orders appear in the user's dashboard after they create an account
 * 2. Orders created before userId was captured are properly linked
 *
 * This is a one-time data migration, but the same logic is also applied in the
 * auth flow when users log in, to catch any new guest orders.
 */
export class LinkOrdersToUsersByEmail1767100000000 implements MigrationInterface {
  name = 'LinkOrdersToUsersByEmail1767100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Link all orders to their corresponding users by email
    // Only updates orders where userId is NULL and a matching user exists
    await queryRunner.query(`
      UPDATE orders
      SET "userId" = users.id
      FROM users
      WHERE orders.email = users.email
        AND orders."userId" IS NULL
    `);

    // Log how many orders were linked
    const result = await queryRunner.query(`
      SELECT COUNT(*) as linked_count
      FROM orders
      WHERE "userId" IS NOT NULL
    `);
    console.log(`✅ Linked orders to users by email. Total orders with userId: ${result[0]?.linked_count ?? 0}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration cannot be easily reverted as we don't track which orders
    // were linked by this migration vs. which already had userId set.
    // A revert would need to know the original state.
    console.log('⚠️ This migration cannot be cleanly reverted - orders would need manual review');
  }
}
