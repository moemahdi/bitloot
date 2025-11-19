import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Level6Catalog1740000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Products table (main catalog)
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "external_id" varchar(100),
        "slug" text UNIQUE NOT NULL,
        "title" text NOT NULL,
        "subtitle" text,
        "description" text,
        "platform" varchar(50),
        "region" varchar(50),
        "drm" varchar(50),
        "age_rating" varchar(10),
        "category" varchar(50),
        "is_custom" boolean NOT NULL DEFAULT false,
        "is_published" boolean NOT NULL DEFAULT false,
        "cost_minor" bigint NOT NULL DEFAULT 0,
        "currency" char(3) NOT NULL DEFAULT 'USD',
        "price_minor" bigint NOT NULL DEFAULT 0,
        "price_version" int NOT NULL DEFAULT 0,
        "rating" numeric(3,2),
        "review_count" int NOT NULL DEFAULT 0,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now(),
        "search_tsv" tsvector
      );
    `);

    // Product offers table (source prices from Kinguin)
    await queryRunner.query(`
      CREATE TABLE "product_offers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
        "provider" varchar(30) NOT NULL,
        "provider_sku" varchar(100) NOT NULL,
        "stock" int,
        "cost_minor" bigint NOT NULL,
        "currency" char(3) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_seen_at" timestamptz DEFAULT now(),
        UNIQUE("provider", "provider_sku")
      );
    `);

    // Product media table (images)
    await queryRunner.query(`
      CREATE TABLE "product_media" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
        "kind" varchar(20) NOT NULL,
        "src" text NOT NULL,
        "sort" int NOT NULL DEFAULT 0
      );
    `);

    // Pricing rules table (admin-controlled)
    await queryRunner.query(`
      CREATE TABLE "pricing_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "scope" varchar(20) NOT NULL,
        "scope_ref" text,
        "margin_pct" numeric(5,2) NOT NULL DEFAULT 8.00,
        "floor_minor" bigint,
        "cap_minor" bigint,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "starts_at" timestamptz,
        "ends_at" timestamptz,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      );
    `);

    // Indexes for performance
    await queryRunner.query(`
      CREATE INDEX "idx_products_pub_price_created" 
      ON "products"("is_published", "price_minor", "created_at" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_products_platform_region" 
      ON "products"("platform", "region", "is_published");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_offers_product_active_cost" 
      ON "product_offers"("product_id", "is_active", "cost_minor");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_products_slug" 
      ON "products"("slug");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_products_category" 
      ON "products"("category", "is_published");
    `);

    // GIN index for full-text search
    await queryRunner.query(`
      CREATE INDEX "idx_products_search_tsv" 
      ON "products" USING GIN("search_tsv");
    `);

    // Function for tsvector trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION products_tsv_trigger() 
      RETURNS trigger AS $$
      BEGIN
        NEW.search_tsv := to_tsvector('simple',
          COALESCE(NEW.title, '') || ' ' ||
          COALESCE(NEW.subtitle, '') || ' ' ||
          COALESCE(NEW.platform, '') || ' ' ||
          COALESCE(NEW.region, '') || ' ' ||
          COALESCE(NEW.category, ''));
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);

    // Trigger for automatic tsvector update
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_products_tsv ON "products";
      CREATE TRIGGER trg_products_tsv
      BEFORE INSERT OR UPDATE ON "products"
      FOR EACH ROW EXECUTE FUNCTION products_tsv_trigger();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger and function
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_products_tsv ON "products";`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS products_tsv_trigger();`);

    // Drop tables (cascade handles relationships)
    await queryRunner.query(`DROP TABLE IF EXISTS "pricing_rules";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_media";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_offers";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products";`);
  }
}
