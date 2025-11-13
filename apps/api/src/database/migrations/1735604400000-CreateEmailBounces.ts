import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex } from 'typeorm';

export class CreateEmailBounces1735604400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create email_bounces table
    await queryRunner.createTable(
      new Table({
        name: 'email_bounces',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['hard', 'soft', 'complaint'],
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'externalBounceId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'bouncedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add indexes for performance
    await queryRunner.createIndex(
      'email_bounces',
      new TableIndex({
        name: 'IDX_email_bounces_email_type',
        columnNames: ['email', 'type'],
      }),
    );

    await queryRunner.createIndex(
      'email_bounces',
      new TableIndex({
        name: 'IDX_email_bounces_type_createdAt',
        columnNames: ['type', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'email_bounces',
      new TableIndex({
        name: 'IDX_email_bounces_bouncedAt',
        columnNames: ['bouncedAt'],
      }),
    );

    await queryRunner.createIndex(
      'email_bounces',
      new TableIndex({
        name: 'IDX_email_bounces_email',
        columnNames: ['email'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table and indexes
    await queryRunner.dropTable('email_bounces', true);
  }
}
