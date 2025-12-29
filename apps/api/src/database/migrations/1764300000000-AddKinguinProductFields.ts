import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add all Kinguin extended product fields
 * These fields store comprehensive product data from Kinguin API
 */
export class AddKinguinProductFields1764300000000
  implements MigrationInterface
{
  name = 'AddKinguinProductFields1764300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Kinguin ID fields
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "kinguinId" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "kinguinProductId" character varying(100)
    `);

    // Add originalName
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "originalName" text
    `);

    // Add developer/publisher/genre arrays
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "developers" text
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "publishers" text
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "genres" text
    `);

    // Add release date
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "releaseDate" character varying(20)
    `);

    // Add quantity fields
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "qty" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "textQty" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "offersCount" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "totalQty" integer
    `);

    // Add pre-order flag
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "isPreorder" boolean DEFAULT false
    `);

    // Add metacritic score
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "metacriticScore" integer
    `);

    // Add region/country limitations
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "regionalLimitations" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "countryLimitation" text
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "regionId" integer
    `);

    // Add activation details
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "activationDetails" text
    `);

    // Add JSONB fields (videos, screenshots, systemRequirements)
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "videos" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "screenshots" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "systemRequirements" jsonb
    `);

    // Add array fields
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "languages" text
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "tags" text
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "merchantName" text
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "cheapestOfferId" text
    `);

    // Add Steam app ID
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "steam" character varying(50)
    `);

    // Add cover thumbnail URL
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "coverThumbnailUrl" text
    `);

    // Create indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_kinguinId" ON "products" ("kinguinId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_kinguinProductId" ON "products" ("kinguinProductId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_isPreorder" ON "products" ("isPreorder")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_metacriticScore" ON "products" ("metacriticScore")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_metacriticScore"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_isPreorder"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_kinguinProductId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_kinguinId"`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "coverThumbnailUrl"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "steam"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "cheapestOfferId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "merchantName"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "tags"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "languages"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "systemRequirements"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "screenshots"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "videos"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "activationDetails"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "regionId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "countryLimitation"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "regionalLimitations"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "metacriticScore"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "isPreorder"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "totalQty"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "offersCount"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "textQty"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "qty"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "releaseDate"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "genres"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "publishers"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "developers"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "originalName"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "kinguinProductId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "kinguinId"`);
  }
}
