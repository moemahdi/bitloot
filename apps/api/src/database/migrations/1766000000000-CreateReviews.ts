import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: CreateReviews
 * 
 * Creates the reviews table for customer product reviews with admin moderation.
 * 
 * Features:
 * - Customer reviews with ratings (1-5 stars)
 * - Admin moderation workflow (pending → approved/rejected)
 * - Homepage display flag
 * - Links to orders, users, and optionally products
 * - Soft delete support
 */
export class CreateReviews1766000000000 implements MigrationInterface {
  name = 'CreateReviews1766000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create review_status enum
    await queryRunner.query(`
      CREATE TYPE "review_status_enum" AS ENUM ('pending', 'approved', 'rejected')
    `);

    // Create reviews table
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: false,
            comment: 'The order this review is associated with',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
            comment: 'User who wrote the review (null for guest orders)',
          },
          {
            name: 'productId',
            type: 'uuid',
            isNullable: true,
            comment: 'Optional: specific product being reviewed',
          },
          {
            name: 'rating',
            type: 'integer',
            isNullable: false,
            comment: 'Star rating 1-5',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Review title/headline',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
            comment: 'Review body text',
          },
          {
            name: 'authorName',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Display name for the reviewer (can be overridden by admin)',
          },
          {
            name: 'status',
            type: 'review_status_enum',
            default: "'pending'",
            comment: 'Moderation status: pending, approved, rejected',
          },
          {
            name: 'displayOnHomepage',
            type: 'boolean',
            default: false,
            comment: 'Whether to show this review on the homepage',
          },
          {
            name: 'isVerifiedPurchase',
            type: 'boolean',
            default: true,
            comment: 'Whether this is from a verified purchase (false for admin-created reviews)',
          },
          {
            name: 'adminNotes',
            type: 'text',
            isNullable: true,
            comment: 'Internal admin notes (not shown to customers)',
          },
          {
            name: 'approvedById',
            type: 'uuid',
            isNullable: true,
            comment: 'Admin user who approved/rejected the review',
          },
          {
            name: 'approvedAt',
            type: 'timestamptz',
            isNullable: true,
            comment: 'When the review was approved/rejected',
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
            isNullable: true,
            comment: 'Soft delete timestamp',
          },
        ],
      }),
      true,
    );

    // Add check constraint for rating
    await queryRunner.query(`
      ALTER TABLE "reviews" ADD CONSTRAINT "CHK_reviews_rating" CHECK ("rating" >= 1 AND "rating" <= 5)
    `);

    // Create indexes
    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'IDX_reviews_order',
        columnNames: ['orderId'],
      }),
    );

    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'IDX_reviews_user',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'IDX_reviews_product',
        columnNames: ['productId'],
      }),
    );

    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'IDX_reviews_status_created',
        columnNames: ['status', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'IDX_reviews_homepage',
        columnNames: ['displayOnHomepage', 'status', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'IDX_reviews_rating',
        columnNames: ['rating', 'status'],
      }),
    );

    // Foreign key to orders
    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'FK_reviews_order',
        columnNames: ['orderId'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key to users (nullable)
    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'FK_reviews_user',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Foreign key to products (nullable)
    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'FK_reviews_product',
        columnNames: ['productId'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Foreign key to approving admin user (nullable)
    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'FK_reviews_approved_by',
        columnNames: ['approvedById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Unique constraint: one review per order per product (or overall if no product specified)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_reviews_order_product" ON "reviews" ("orderId", COALESCE("productId", '00000000-0000-0000-0000-000000000000'))
      WHERE "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique index
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_reviews_order_product"`);

    // Drop foreign keys
    await queryRunner.dropForeignKey('reviews', 'FK_reviews_approved_by');
    await queryRunner.dropForeignKey('reviews', 'FK_reviews_product');
    await queryRunner.dropForeignKey('reviews', 'FK_reviews_user');
    await queryRunner.dropForeignKey('reviews', 'FK_reviews_order');

    // Drop indexes
    await queryRunner.dropIndex('reviews', 'IDX_reviews_rating');
    await queryRunner.dropIndex('reviews', 'IDX_reviews_homepage');
    await queryRunner.dropIndex('reviews', 'IDX_reviews_status_created');
    await queryRunner.dropIndex('reviews', 'IDX_reviews_product');
    await queryRunner.dropIndex('reviews', 'IDX_reviews_user');
    await queryRunner.dropIndex('reviews', 'IDX_reviews_order');

    // Drop check constraint
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "CHK_reviews_rating"`);

    // Drop table
    await queryRunner.dropTable('reviews');

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "review_status_enum"`);
  }
}
