import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrdersStatusEnum1730000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if orders_status_enum type exists
    const typeResult = (await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'orders_status_enum' 
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ) AS exists;
    `)) as Array<{ exists: boolean }>;

    const typeExists = typeResult.length > 0 && typeResult[0]?.exists === true;

    if (!typeExists) {
      // Create ENUM type with all values if it doesn't exist
      await queryRunner.query(`
        CREATE TYPE "public"."orders_status_enum" AS ENUM (
          'created', 'waiting', 'confirming', 'paid', 'underpaid', 'failed', 'fulfilled'
        );
      `);

      // Drop the current default, convert column, then set the default back
      await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;`);

      // Convert orders.status column from varchar to enum
      await queryRunner.query(`
        ALTER TABLE "orders" 
        ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING "status"::"public"."orders_status_enum";
      `);

      // Re-add the default
      await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'created';`);

      console.warn(
        '✅ Created orders_status_enum and updated orders table to support all payment-related statuses',
      );
    } else {
      // If ENUM exists, just add missing values
      const addValues = ['waiting', 'confirming', 'underpaid', 'failed', 'fulfilled'];
      for (const value of addValues) {
        try {
          await queryRunner.query(`
            ALTER TYPE "public"."orders_status_enum" 
            ADD VALUE IF NOT EXISTS '${value}'
          `);
        } catch (_err) {
          // Ignore if value already exists
        }
      }
      console.warn('✅ Updated orders_status_enum with new payment-related statuses');
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't allow removing ENUM values safely
    // This is a one-way migration
    console.warn('⚠️  Cannot downgrade - PostgreSQL does not support removing ENUM values');
    return Promise.resolve();
  }
}
