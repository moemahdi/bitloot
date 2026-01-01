import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Create Product Groups
 * 
 * Creates the product_groups table for grouping related products together
 * (e.g., same game with different platforms/editions/regions).
 * 
 * Also adds groupId foreign key to the products table.
 */
export class CreateProductGroups1765000000000 implements MigrationInterface {
  name = 'CreateProductGroups1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create product_groups table
    await queryRunner.createTable(
      new Table({
        name: 'product_groups',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'coverImageUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tagline',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'displayOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'minPrice',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: "'0.00000000'",
          },
          {
            name: 'maxPrice',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: "'0.00000000'",
          },
          {
            name: 'productCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 2. Create indexes on product_groups
    await queryRunner.createIndex(
      'product_groups',
      new TableIndex({
        name: 'idx_product_groups_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'product_groups',
      new TableIndex({
        name: 'idx_product_groups_active_order',
        columnNames: ['isActive', 'displayOrder'],
      }),
    );

    await queryRunner.createIndex(
      'product_groups',
      new TableIndex({
        name: 'idx_product_groups_active_created',
        columnNames: ['isActive', 'createdAt'],
      }),
    );

    // 3. Add groupId column to products table
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "groupId" uuid NULL
    `);

    // 4. Create index on products.groupId
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'idx_products_group_id',
        columnNames: ['groupId'],
      }),
    );

    // 5. Add foreign key constraint
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        name: 'fk_products_group',
        columnNames: ['groupId'],
        referencedTableName: 'product_groups',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    console.log('✅ Created product_groups table and added groupId to products');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remove foreign key
    await queryRunner.dropForeignKey('products', 'fk_products_group');

    // 2. Remove index from products
    await queryRunner.dropIndex('products', 'idx_products_group_id');

    // 3. Remove groupId column from products
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "groupId"
    `);

    // 4. Drop product_groups table (this also drops its indexes)
    await queryRunner.dropTable('product_groups');

    console.log('✅ Dropped product_groups table and removed groupId from products');
  }
}
