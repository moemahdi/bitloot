import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to expand product column lengths to accommodate Kinguin data
 * - drm: varchar(50) → text (Kinguin stores instructions, not just DRM type)
 * - region: varchar(50) → varchar(100) (some regions have longer names)
 * - ageRating: varchar(10) → varchar(20) (e.g., "PEGI 18" fits but add room)
 */
export class ExpandProductColumnLengths1764200000000
  implements MigrationInterface
{
  name = 'ExpandProductColumnLengths1764200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change drm from varchar(50) to text
    await queryRunner.query(`
      ALTER TABLE "products" 
      ALTER COLUMN "drm" TYPE text
    `);

    // Change region from varchar(50) to varchar(100)
    await queryRunner.query(`
      ALTER TABLE "products" 
      ALTER COLUMN "region" TYPE character varying(100)
    `);

    // Change ageRating from varchar(10) to varchar(20)
    await queryRunner.query(`
      ALTER TABLE "products" 
      ALTER COLUMN "ageRating" TYPE character varying(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert ageRating to varchar(10)
    await queryRunner.query(`
      ALTER TABLE "products" 
      ALTER COLUMN "ageRating" TYPE character varying(10)
    `);

    // Revert region to varchar(50)
    await queryRunner.query(`
      ALTER TABLE "products" 
      ALTER COLUMN "region" TYPE character varying(50)
    `);

    // Revert drm to varchar(50)
    await queryRunner.query(`
      ALTER TABLE "products" 
      ALTER COLUMN "drm" TYPE character varying(50)
    `);
  }
}
