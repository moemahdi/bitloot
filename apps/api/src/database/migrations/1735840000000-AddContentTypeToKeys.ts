import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentTypeToKeys1735840000000 implements MigrationInterface {
  name = 'AddContentTypeToKeys1735840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add contentType column to keys table with default value 'text/plain'
    await queryRunner.query(`
      ALTER TABLE "keys" 
      ADD COLUMN "contentType" text DEFAULT 'text/plain'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove contentType column from keys table
    await queryRunner.query(`
      ALTER TABLE "keys" 
      DROP COLUMN "contentType"
    `);
  }
}
