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
    
    if (tableExists) {
      // Drop foreign key first
      await queryRunner.query(`
        ALTER TABLE system_configs 
        DROP CONSTRAINT IF EXISTS "FK_system_configs_updatedBy"
      `);

      // Drop indexes
      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_system_configs_provider_key_env"
      `);
      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_system_configs_provider_env"
      `);
      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_system_configs_isActive"
      `);

      // Drop the table
      await queryRunner.dropTable('system_configs');
    }
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
