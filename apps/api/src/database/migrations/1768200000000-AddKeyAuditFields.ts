import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add audit fields to keys table for tracking downloads and access
 *
 * New fields:
 * - downloadCount: Track number of times key was revealed (abuse detection)
 * - lastAccessIp: IP address of last reveal (security audit)
 * - lastAccessUserAgent: Browser/device of last reveal (security audit)
 */
export class AddKeyAuditFields1768200000000 implements MigrationInterface {
  name = 'AddKeyAuditFields1768200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add downloadCount column with default 0
    await queryRunner.query(`
      ALTER TABLE "keys" 
      ADD COLUMN IF NOT EXISTS "downloadCount" integer NOT NULL DEFAULT 0
    `);

    // Add lastAccessIp column
    await queryRunner.query(`
      ALTER TABLE "keys" 
      ADD COLUMN IF NOT EXISTS "lastAccessIp" text
    `);

    // Add lastAccessUserAgent column
    await queryRunner.query(`
      ALTER TABLE "keys" 
      ADD COLUMN IF NOT EXISTS "lastAccessUserAgent" text
    `);

    // Set downloadCount = 1 for keys that have already been viewed
    await queryRunner.query(`
      UPDATE "keys" 
      SET "downloadCount" = 1 
      WHERE "viewedAt" IS NOT NULL AND "downloadCount" = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "keys" DROP COLUMN IF EXISTS "lastAccessUserAgent"`);
    await queryRunner.query(`ALTER TABLE "keys" DROP COLUMN IF EXISTS "lastAccessIp"`);
    await queryRunner.query(`ALTER TABLE "keys" DROP COLUMN IF EXISTS "downloadCount"`);
  }
}
