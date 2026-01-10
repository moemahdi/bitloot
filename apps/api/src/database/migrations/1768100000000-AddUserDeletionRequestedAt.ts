import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Level 7 Migration: Add deletionRequestedAt to users table
 * Enables 30-day grace period for account deletion
 */
export class AddUserDeletionRequestedAt1768100000000 implements MigrationInterface {
  name = 'AddUserDeletionRequestedAt1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deletionRequestedAt column for soft delete grace period
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP WITH TIME ZONE
    `);

    // Add pendingEmail for email change verification
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "pendingEmail" varchar
    `);

    // Add index for finding accounts pending deletion
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_deletion_requested" 
      ON "users" ("deletionRequestedAt") 
      WHERE "deletionRequestedAt" IS NOT NULL
    `);

    console.log('✅ Added deletionRequestedAt and pendingEmail columns to users table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_deletion_requested"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "pendingEmail"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "deletionRequestedAt"`);
    console.log('✅ Removed deletionRequestedAt and pendingEmail columns from users table');
  }
}
