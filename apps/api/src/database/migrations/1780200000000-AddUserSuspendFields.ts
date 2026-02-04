import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add suspend fields to users table
 * 
 * Adds columns for user account suspension/lock functionality:
 * - isSuspended: boolean flag for account lock status
 * - suspendedAt: timestamp when suspended
 * - suspendedReason: admin-provided reason for suspension
 * - lastLoginAt: track last login timestamp
 */
export class AddUserSuspendFields1780200000000 implements MigrationInterface {
  name = 'AddUserSuspendFields1780200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isSuspended column with default false
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false
    `);

    // Add suspendedAt timestamp
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMPTZ NULL
    `);

    // Add suspendedReason text column
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "suspendedReason" VARCHAR(500) NULL
    `);

    // Add lastLoginAt timestamp for tracking last login
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ NULL
    `);

    // Create index for filtering suspended users
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_isSuspended" ON "users" ("isSuspended")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_isSuspended"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastLoginAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "suspendedReason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "suspendedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "isSuspended"`);
  }
}
