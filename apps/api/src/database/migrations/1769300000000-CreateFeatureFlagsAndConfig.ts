import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Create feature_flags and system_configs tables
 *
 * Feature Flags: Runtime toggles for system features (replaces in-memory Map)
 * System Configs: API credentials and settings with encryption support
 *
 * Part of Feature Flags & Configuration Management feature
 */
export class CreateFeatureFlagsAndConfig1769300000000 implements MigrationInterface {
  name = 'CreateFeatureFlagsAndConfig1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============ FEATURE FLAGS TABLE ============
    await queryRunner.createTable(
      new Table({
        name: 'feature_flags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            default: "'System'",
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updatedById',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Feature flags indexes
    await queryRunner.createIndex(
      'feature_flags',
      new TableIndex({
        name: 'IDX_feature_flags_name',
        columnNames: ['name'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'feature_flags',
      new TableIndex({
        name: 'IDX_feature_flags_category_enabled',
        columnNames: ['category', 'enabled'],
      }),
    );

    // Feature flags foreign key
    await queryRunner.createForeignKey(
      'feature_flags',
      new TableForeignKey({
        name: 'FK_feature_flags_updatedBy',
        columnNames: ['updatedById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // ============ SYSTEM CONFIGS TABLE ============
    await queryRunner.createTable(
      new Table({
        name: 'system_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'isSecret',
            type: 'boolean',
            default: false,
          },
          {
            name: 'environment',
            type: 'enum',
            enum: ['sandbox', 'production'],
            default: "'sandbox'",
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'validationPattern',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'displayOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updatedById',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // System configs indexes
    await queryRunner.createIndex(
      'system_configs',
      new TableIndex({
        name: 'IDX_system_configs_provider_key_env',
        columnNames: ['provider', 'key', 'environment'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'system_configs',
      new TableIndex({
        name: 'IDX_system_configs_provider_env',
        columnNames: ['provider', 'environment'],
      }),
    );

    await queryRunner.createIndex(
      'system_configs',
      new TableIndex({
        name: 'IDX_system_configs_isActive',
        columnNames: ['isActive'],
      }),
    );

    // System configs foreign key
    await queryRunner.createForeignKey(
      'system_configs',
      new TableForeignKey({
        name: 'FK_system_configs_updatedBy',
        columnNames: ['updatedById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // ============ SEED DEFAULT FEATURE FLAGS ============
    await queryRunner.query(`
      INSERT INTO feature_flags (name, enabled, description, category) VALUES
      ('payment_processing_enabled', true, 'Enable NOWPayments payment processing. Disabling prevents new orders from being created.', 'Payments'),
      ('fulfillment_enabled', true, 'Enable Kinguin fulfillment orders. Disabling pauses all fulfillment jobs.', 'Fulfillment'),
      ('auto_fulfill_enabled', true, 'Automatically fulfill orders when payment is confirmed. Disable for manual fulfillment.', 'Fulfillment'),
      ('email_notifications_enabled', true, 'Send email notifications (order confirmations, key delivery emails).', 'Notifications'),
      ('captcha_enabled', true, 'Require CAPTCHA verification on checkout to prevent bot abuse.', 'Security'),
      ('maintenance_mode', false, 'Put store in maintenance mode. Disables checkout for customers.', 'System'),
      ('kinguin_enabled', true, 'Enable Kinguin marketplace integration. Allows creating products sourced from Kinguin API.', 'Products'),
      ('custom_products_enabled', true, 'Enable custom product creation. Allows admins to create BitLoot-only products with manual key inventory.', 'Products')
    `);

    // ============ SEED DEFAULT SYSTEM CONFIGS ============
    // NOWPayments sandbox config
    await queryRunner.query(`
      INSERT INTO system_configs (provider, key, value, "isSecret", environment, description, "displayOrder") VALUES
      ('nowpayments', 'api_key', '', true, 'sandbox', 'NOWPayments API Key (from Dashboard → API Settings)', 1),
      ('nowpayments', 'ipn_secret', '', true, 'sandbox', 'NOWPayments IPN Secret (from Dashboard → IPN Settings)', 2),
      ('nowpayments', 'base_url', 'https://api-sandbox.nowpayments.io', false, 'sandbox', 'NOWPayments API Base URL', 3),
      ('nowpayments', 'callback_url', '', false, 'sandbox', 'IPN Callback URL (your server endpoint)', 4),
      
      ('nowpayments', 'api_key', '', true, 'production', 'NOWPayments API Key (from Dashboard → API Settings)', 1),
      ('nowpayments', 'ipn_secret', '', true, 'production', 'NOWPayments IPN Secret (from Dashboard → IPN Settings)', 2),
      ('nowpayments', 'base_url', 'https://api.nowpayments.io', false, 'production', 'NOWPayments API Base URL', 3),
      ('nowpayments', 'callback_url', '', false, 'production', 'IPN Callback URL (your server endpoint)', 4)
    `);

    // Kinguin config
    await queryRunner.query(`
      INSERT INTO system_configs (provider, key, value, "isSecret", environment, description, "displayOrder") VALUES
      ('kinguin', 'api_key', '', true, 'sandbox', 'Kinguin API Key (32-character from Integration Dashboard)', 1),
      ('kinguin', 'base_url', 'https://gateway.kinguin.net/esa/api', false, 'sandbox', 'Kinguin API Base URL', 2),
      ('kinguin', 'webhook_secret', '', true, 'sandbox', 'Kinguin Webhook Secret for signature verification', 3),
      
      ('kinguin', 'api_key', '', true, 'production', 'Kinguin API Key (32-character from Integration Dashboard)', 1),
      ('kinguin', 'base_url', 'https://gateway.kinguin.net/esa/api', false, 'production', 'Kinguin API Base URL', 2),
      ('kinguin', 'webhook_secret', '', true, 'production', 'Kinguin Webhook Secret for signature verification', 3)
    `);

    // Resend config
    await queryRunner.query(`
      INSERT INTO system_configs (provider, key, value, "isSecret", environment, description, "displayOrder") VALUES
      ('resend', 'api_key', '', true, 'sandbox', 'Resend API Key (from Resend Dashboard)', 1),
      ('resend', 'from_email', 'no-reply@bitloot.io', false, 'sandbox', 'Default sender email address', 2),
      
      ('resend', 'api_key', '', true, 'production', 'Resend API Key (from Resend Dashboard)', 1),
      ('resend', 'from_email', 'no-reply@bitloot.io', false, 'production', 'Default sender email address', 2)
    `);

    // Cloudflare R2 config
    await queryRunner.query(`
      INSERT INTO system_configs (provider, key, value, "isSecret", environment, description, "displayOrder") VALUES
      ('r2', 'account_id', '', false, 'sandbox', 'Cloudflare Account ID', 1),
      ('r2', 'access_key_id', '', true, 'sandbox', 'R2 Access Key ID', 2),
      ('r2', 'secret_access_key', '', true, 'sandbox', 'R2 Secret Access Key', 3),
      ('r2', 'bucket', 'bitloot-keys-dev', false, 'sandbox', 'R2 Bucket Name', 4),
      ('r2', 'endpoint', '', false, 'sandbox', 'R2 Custom Endpoint URL', 5),
      
      ('r2', 'account_id', '', false, 'production', 'Cloudflare Account ID', 1),
      ('r2', 'access_key_id', '', true, 'production', 'R2 Access Key ID', 2),
      ('r2', 'secret_access_key', '', true, 'production', 'R2 Secret Access Key', 3),
      ('r2', 'bucket', 'bitloot-keys', false, 'production', 'R2 Bucket Name', 4),
      ('r2', 'endpoint', '', false, 'production', 'R2 Custom Endpoint URL', 5)
    `);

    // Cloudflare Turnstile config
    await queryRunner.query(`
      INSERT INTO system_configs (provider, key, value, "isSecret", environment, description, "displayOrder") VALUES
      ('turnstile', 'site_key', '', false, 'sandbox', 'Turnstile Site Key (public, safe for frontend)', 1),
      ('turnstile', 'secret_key', '', true, 'sandbox', 'Turnstile Secret Key (server-side only)', 2),
      ('turnstile', 'enabled', 'true', false, 'sandbox', 'Enable Turnstile CAPTCHA on checkout', 3),
      
      ('turnstile', 'site_key', '', false, 'production', 'Turnstile Site Key (public, safe for frontend)', 1),
      ('turnstile', 'secret_key', '', true, 'production', 'Turnstile Secret Key (server-side only)', 2),
      ('turnstile', 'enabled', 'true', false, 'production', 'Enable Turnstile CAPTCHA on checkout', 3)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('system_configs', 'FK_system_configs_updatedBy');
    await queryRunner.dropForeignKey('feature_flags', 'FK_feature_flags_updatedBy');

    // Drop tables
    await queryRunner.dropTable('system_configs');
    await queryRunner.dropTable('feature_flags');
  }
}
