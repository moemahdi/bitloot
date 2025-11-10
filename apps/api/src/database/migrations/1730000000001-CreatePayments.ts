import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePayments1730000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payments table
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'externalId',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'provider',
            type: 'varchar',
            default: "'nowpayments'",
            length: '50',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['created', 'waiting', 'confirmed', 'finished', 'underpaid', 'failed'],
            default: "'created'",
          },
          {
            name: 'rawPayload',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'priceAmount',
            type: 'numeric',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'priceCurrency',
            type: 'varchar',
            isNullable: true,
            length: '10',
          },
          {
            name: 'payAmount',
            type: 'numeric',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'payCurrency',
            type: 'varchar',
            isNullable: true,
            length: '10',
          },
          {
            name: 'confirmations',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create foreign key to orders table (cascade delete)
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Create indexes for query performance
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_externalId',
        columnNames: ['externalId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_orderId',
        columnNames: ['orderId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Composite index for common queries
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_orderId_status',
        columnNames: ['orderId', 'status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes
    await queryRunner.dropIndex('payments', 'IDX_payments_orderId_status');
    await queryRunner.dropIndex('payments', 'IDX_payments_createdAt');
    await queryRunner.dropIndex('payments', 'IDX_payments_status');
    await queryRunner.dropIndex('payments', 'IDX_payments_orderId');
    await queryRunner.dropIndex('payments', 'IDX_payments_externalId');

    // Drop foreign key
    const table = await queryRunner.getTable('payments');
    if (table !== undefined) {
      const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.includes('orderId'));
      if (foreignKey !== undefined) {
        await queryRunner.dropForeignKey('payments', foreignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('payments', true);
  }
}
