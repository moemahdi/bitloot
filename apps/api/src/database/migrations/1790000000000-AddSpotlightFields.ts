import type { MigrationInterface, QueryRunner } from 'typeorm';
import { TableColumn, TableIndex } from 'typeorm';

/**
 * Migration: Add Spotlight Fields to Product Groups
 *
 * Extends the product_groups table to support game spotlight pages.
 * Each group can become a dedicated marketing page with hero images,
 * trailers, accent colors, and rich metadata.
 *
 * New columns:
 * - isSpotlight: boolean - Controls visibility on spotlight pages
 * - heroImageUrl: string - Full-width banner/poster image
 * - heroVideoUrl: string - YouTube/Vimeo embed URL
 * - releaseDate: timestamp - For "COMING SOON" countdown
 * - longDescription: text - Rich marketing copy
 * - accentColor: string - Per-game theming (e.g., "#FF6B00")
 * - badgeText: string - "NEW RELEASE" | "COMING SOON" | "PRE-ORDER"
 * - metacriticScore: integer - 0-100 score
 * - developerName: string - Game developer
 * - publisherName: string - Game publisher
 * - genres: jsonb - Array of genre strings ['Action', 'Open World']
 * - features: jsonb - Array of feature highlights
 * - faqItems: jsonb - Array of FAQ items for the spotlight page
 * - spotlightOrder: integer - Order in spotlight carousel
 */
export class AddSpotlightFields1790000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add spotlight columns to product_groups table
    await queryRunner.addColumns('product_groups', [
      new TableColumn({
        name: 'isSpotlight',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'heroImageUrl',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'heroVideoUrl',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
      new TableColumn({
        name: 'releaseDate',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'longDescription',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'accentColor',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
      new TableColumn({
        name: 'badgeText',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'metacriticScore',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'developerName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'publisherName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'genres',
        type: 'jsonb',
        isNullable: true,
        default: "'[]'",
      }),
      new TableColumn({
        name: 'features',
        type: 'jsonb',
        isNullable: true,
        default: "'[]'",
      }),
      new TableColumn({
        name: 'faqItems',
        type: 'jsonb',
        isNullable: true,
        default: "'[]'",
      }),
      new TableColumn({
        name: 'spotlightOrder',
        type: 'integer',
        default: 0,
      }),
    ]);

    // Create index for spotlight queries
    await queryRunner.createIndex(
      'product_groups',
      new TableIndex({
        name: 'idx_product_groups_spotlight',
        columnNames: ['isSpotlight', 'isActive', 'spotlightOrder'],
      }),
    );

    // Create index for release date queries (upcoming games)
    await queryRunner.createIndex(
      'product_groups',
      new TableIndex({
        name: 'idx_product_groups_release_date',
        columnNames: ['releaseDate'],
        where: '"releaseDate" IS NOT NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('product_groups', 'idx_product_groups_spotlight');
    await queryRunner.dropIndex('product_groups', 'idx_product_groups_release_date');

    // Drop columns
    await queryRunner.dropColumns('product_groups', [
      'isSpotlight',
      'heroImageUrl',
      'heroVideoUrl',
      'releaseDate',
      'longDescription',
      'accentColor',
      'badgeText',
      'metacriticScore',
      'developerName',
      'publisherName',
      'genres',
      'features',
      'faqItems',
      'spotlightOrder',
    ]);
  }
}
