import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex, TableForeignKey, TableColumn } from 'typeorm';

export class AddKeysReservation1720000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add kinguinReservationId column to orders table
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'kinguinReservationId',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Kinguin reservation ID for tracking fulfillment status',
      }),
    );

    // Step 2: Create keys table
    await queryRunner.createTable(
      new Table({
        name: 'keys',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
            comment: 'Unique identifier for key record',
          },
          {
            name: 'orderItemId',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key to order_items',
          },
          {
            name: 'storageRef',
            type: 'text',
            isNullable: true,
            comment: 'R2 object key where encrypted key is stored',
          },
          {
            name: 'viewedAt',
            type: 'timestamp',
            isNullable: true,
            comment: 'When customer viewed/revealed the key',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
            comment: 'When key record was created',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
            comment: 'When key record was last updated',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['orderItemId'],
            referencedTableName: 'order_items',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            name: 'FK_keys_orderItemId',
          }),
        ],
      }),
    );

    // Step 3: Add indexes for query performance
    await queryRunner.createIndex(
      'keys',
      new TableIndex({
        name: 'IDX_keys_orderItemId',
        columnNames: ['orderItemId'],
      }),
    );

    await queryRunner.createIndex(
      'keys',
      new TableIndex({
        name: 'IDX_keys_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Step 4: Add index to orders table for kinguinReservationId
    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_kinguinReservationId',
        columnNames: ['kinguinReservationId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop keys table (cascading deletes)
    await queryRunner.dropTable('keys', true);

    // Step 2: Drop kinguinReservationId column from orders
    await queryRunner.dropColumn('orders', 'kinguinReservationId');
  }
}
