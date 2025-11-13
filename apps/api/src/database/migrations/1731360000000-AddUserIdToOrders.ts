import type { MigrationInterface, QueryRunner } from 'typeorm';
import { TableIndex, TableColumn } from 'typeorm';

export class AddUserIdToOrders1731360000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add userId column (nullable for guest checkouts)
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
        comment: 'Foreign key to users table (nullable for guest checkouts)',
      }),
    );

    // Add indexes for user order lookups
    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        columnNames: ['userId', 'createdAt'],
        isUnique: false,
        name: 'idx_orders_userId_createdAt',
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        columnNames: ['status', 'createdAt'],
        isUnique: false,
        name: 'idx_orders_status_createdAt',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes by name
    await queryRunner.dropIndex('orders', 'idx_orders_userId_createdAt');
    await queryRunner.dropIndex('orders', 'idx_orders_status_createdAt');

    // Drop column
    await queryRunner.dropColumn('orders', 'userId');
  }
}
