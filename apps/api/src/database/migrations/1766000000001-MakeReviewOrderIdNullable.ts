import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: MakeReviewOrderIdNullable
 * 
 * Makes the orderId column nullable in the reviews table.
 * This allows admin-created reviews that aren't tied to a customer order.
 */
export class MakeReviewOrderIdNullable1766000000001 implements MigrationInterface {
  name = 'MakeReviewOrderIdNullable1766000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint first
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP CONSTRAINT IF EXISTS "FK_reviews_orderId"
    `);

    // Make orderId nullable
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ALTER COLUMN "orderId" DROP NOT NULL
    `);

    // Re-add the foreign key constraint with ON DELETE SET NULL
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD CONSTRAINT "FK_reviews_orderId" 
      FOREIGN KEY ("orderId") REFERENCES "orders"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP CONSTRAINT IF EXISTS "FK_reviews_orderId"
    `);

    // Delete any reviews with null orderId (can't restore NOT NULL with nulls present)
    await queryRunner.query(`
      DELETE FROM "reviews" WHERE "orderId" IS NULL
    `);

    // Make orderId NOT NULL again
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ALTER COLUMN "orderId" SET NOT NULL
    `);

    // Re-add the foreign key constraint with ON DELETE CASCADE
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD CONSTRAINT "FK_reviews_orderId" 
      FOREIGN KEY ("orderId") REFERENCES "orders"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }
}
