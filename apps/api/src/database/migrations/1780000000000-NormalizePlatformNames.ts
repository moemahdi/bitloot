import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Normalize existing platform names to standard format
 * This is a data cleanup migration that standardizes platform names
 * from various Kinguin formats to consistent display names.
 */
export class NormalizePlatformNames1780000000000 implements MigrationInterface {
  name = 'NormalizePlatformNames1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Steam variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'Steam'
      WHERE LOWER("platform") IN ('steam', 'steam cd key', 'steam key', 'steam gift')
    `);

    // Epic Games variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'Epic Games'
      WHERE LOWER("platform") IN ('epic', 'epic games', 'epic games store', 'egs')
    `);

    // GOG variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'GOG'
      WHERE LOWER("platform") IN ('gog', 'gog.com', 'gog key')
    `);

    // Ubisoft Connect variations (formerly Uplay)
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'Ubisoft Connect'
      WHERE LOWER("platform") IN ('uplay', 'ubisoft', 'ubisoft connect')
    `);

    // EA App variations (formerly Origin)
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'EA App'
      WHERE LOWER("platform") IN ('origin', 'ea', 'ea app', 'ea play')
    `);

    // Battle.net variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'Battle.net'
      WHERE LOWER("platform") IN ('battle.net', 'battlenet', 'blizzard')
    `);

    // Microsoft Store variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'Microsoft Store'
      WHERE LOWER("platform") IN ('microsoft', 'microsoft store')
    `);

    // Xbox variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'Xbox'
      WHERE LOWER("platform") IN ('xbox', 'xbox live', 'xbox one', 'xbox series')
    `);

    // PlayStation variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'PlayStation'
      WHERE LOWER("platform") IN ('playstation', 'ps', 'psn', 'ps4', 'ps5', 'playstation network')
    `);

    // Nintendo Switch variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'Nintendo Switch'
      WHERE LOWER("platform") IN ('switch', 'nintendo switch')
    `);

    // Rockstar Games variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'Rockstar Games'
      WHERE LOWER("platform") IN ('rockstar', 'rockstar games', 'rockstar games launcher')
    `);

    // Bethesda variations
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'Bethesda'
      WHERE LOWER("platform") IN ('bethesda', 'bethesda.net')
    `);

    // Windows/PC normalization
    await queryRunner.query(`
      UPDATE "products" 
      SET "platform" = 'PC'
      WHERE LOWER("platform") = 'windows'
    `);

    console.log('✅ Platform names normalized successfully');
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // This migration doesn't need to be reverted as it's a data normalization
    // The original platform names are not preserved
    console.log('⚠️ Platform normalization cannot be reverted - original values not preserved');
  }
}
