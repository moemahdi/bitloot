import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Remove system_configs table
 *
 * The system configuration feature has been removed in favor of
 * using environment variables (.env file) exclusively for API credentials.
 *
 * Rationale:
 * - Environment variables are simpler and more secure
 * - No need for database encryption of secrets
 * - Reduces attack surface (no SQL injection risk for credentials)
 * - No code complexity for credential management
 */
export class RemoveSystemConfigs1769400000000 implements MigrationInterface {
  name = 'RemoveSystemConfigs1769400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists before dropping
    const tableExists = await queryRunner.hasTable('system_configs');
    
    if (!tableExists) {
      // Table was never created - nothing to do
      console.log('system_configs table does not exist, skipping removal');
      return;
    }

    // Drop foreign key first (ignore errors if it doesn't exist)
    try {
      await queryRunner.query(`
        ALTER TABLE system_configs 
        DROP CONSTRAINT IF EXISTS "FK_system_configs_updatedBy"
      `);
    } catch { /* ignore */ }

    // Drop indexes (ignore errors if they don't exist)
    try {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_configs_provider_key_env"`);
    } catch { /* ignore */ }
    try {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_configs_provider_env"`);
    } catch { /* ignore */ }
    try {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_configs_isActive"`);
    } catch { /* ignore */ }

    // Drop the table
    try {
      await queryRunner.dropTable('system_configs');
    } catch { /* ignore */ }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is intentionally one-way.
    // The system_configs feature has been removed from the codebase.
    // If you need to restore it, revert to a previous git commit.
    console.warn(
      'RemoveSystemConfigs migration cannot be reverted. ' +
      'The system_configs feature has been removed from the codebase.'
    );
  }
}
