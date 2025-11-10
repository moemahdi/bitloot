import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex, TableUnique } from 'typeorm';

export class CreateWebhookLogs1730000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create webhook_logs table with all entity columns
    await queryRunner.createTable(
      new Table({
        name: 'webhook_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'externalId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'webhookType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'signature',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'signatureValid',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'processed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'paymentId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'paymentStatus',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sourceIp',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'attemptCount',
            type: 'int',
            default: 1,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_webhook_idempotency',
            columnNames: ['externalId', 'webhookType', 'processed'],
          }),
        ],
      }),
      true,
    );

    // Create indexes for query performance

    // Index on externalId for quick lookup
    await queryRunner.createIndex(
      'webhook_logs',
      new TableIndex({
        name: 'IDX_webhook_logs_externalId',
        columnNames: ['externalId'],
      }),
    );

    // Composite index on externalId, webhookType, createdAt
    await queryRunner.createIndex(
      'webhook_logs',
      new TableIndex({
        name: 'IDX_webhook_logs_externalId_webhookType_createdAt',
        columnNames: ['externalId', 'webhookType', 'createdAt'],
      }),
    );

    // Index on orderId for audit trail queries
    await queryRunner.createIndex(
      'webhook_logs',
      new TableIndex({
        name: 'IDX_webhook_logs_orderId_createdAt',
        columnNames: ['orderId', 'createdAt'],
      }),
    );

    // Composite index on webhookType, processed, createdAt
    await queryRunner.createIndex(
      'webhook_logs',
      new TableIndex({
        name: 'IDX_webhook_logs_webhookType_processed_createdAt',
        columnNames: ['webhookType', 'processed', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes
    await queryRunner.dropIndex('webhook_logs', 'IDX_webhook_logs_webhookType_processed_createdAt');
    await queryRunner.dropIndex('webhook_logs', 'IDX_webhook_logs_orderId_createdAt');
    await queryRunner.dropIndex(
      'webhook_logs',
      'IDX_webhook_logs_externalId_webhookType_createdAt',
    );
    await queryRunner.dropIndex('webhook_logs', 'IDX_webhook_logs_externalId');

    // Drop table
    await queryRunner.dropTable('webhook_logs', true);
  }
}
