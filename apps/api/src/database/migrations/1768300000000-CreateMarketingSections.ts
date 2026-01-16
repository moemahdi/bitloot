import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Marketing Page Sections & Customization System
 * 
 * Tables:
 * - page_sections: Configurable sections (flash-deals, trending, featured, categories, bundles, gift-cards)
 * - flash_deals: Flash sale campaigns with countdown timers
 * - flash_deal_products: Products included in flash deals
 * - bundle_deals: Bundle packages with discounted pricing
 * - bundle_products: Products included in bundles
 */
export class CreateMarketingSections1768300000000 implements MigrationInterface {
  name = 'CreateMarketingSections1768300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Page Sections Table
    await queryRunner.query(`
      CREATE TABLE page_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_key VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        config JSONB NOT NULL DEFAULT '{}',
        schedule_start TIMESTAMP WITH TIME ZONE,
        schedule_end TIMESTAMP WITH TIME ZONE,
        target_audience JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_page_sections_enabled ON page_sections(is_enabled, display_order)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_page_sections_schedule ON page_sections(schedule_start, schedule_end)
    `);

    // 2. Flash Deals Table
    await queryRunner.query(`
      CREATE TABLE flash_deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        headline VARCHAR(300),
        sub_headline VARCHAR(300),
        description TEXT,
        is_active BOOLEAN DEFAULT false,
        starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
        background_type VARCHAR(20) DEFAULT 'gradient',
        background_value VARCHAR(500),
        accent_color VARCHAR(20) DEFAULT '#00D9FF',
        text_color VARCHAR(20) DEFAULT '#FFFFFF',
        badge_text VARCHAR(50),
        badge_color VARCHAR(20),
        cta_text VARCHAR(50) DEFAULT 'Shop Now',
        cta_link VARCHAR(500),
        show_countdown BOOLEAN DEFAULT true,
        show_products BOOLEAN DEFAULT true,
        products_count INTEGER DEFAULT 8,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_flash_deals_active ON flash_deals(is_active, starts_at, ends_at)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_flash_deals_slug ON flash_deals(slug)
    `);

    // 3. Flash Deal Products Table
    await queryRunner.query(`
      CREATE TABLE flash_deal_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flash_deal_id UUID NOT NULL REFERENCES flash_deals(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        discount_percent DECIMAL(5, 2),
        discount_price DECIMAL(20, 8),
        original_price DECIMAL(20, 8),
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        stock_limit INTEGER,
        sold_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(flash_deal_id, product_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_flash_deal_products_deal ON flash_deal_products(flash_deal_id, display_order)
    `);

    // 4. Bundle Deals Table
    await queryRunner.query(`
      CREATE TABLE bundle_deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        short_description VARCHAR(300),
        bundle_price DECIMAL(20, 8) NOT NULL,
        original_price DECIMAL(20, 8),
        savings_amount DECIMAL(20, 8),
        savings_percent DECIMAL(5, 2),
        currency VARCHAR(10) DEFAULT 'USD',
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        starts_at TIMESTAMP WITH TIME ZONE,
        ends_at TIMESTAMP WITH TIME ZONE,
        cover_image VARCHAR(500),
        badge_text VARCHAR(50),
        badge_color VARCHAR(20),
        background_gradient VARCHAR(200),
        display_order INTEGER DEFAULT 0,
        stock_limit INTEGER,
        sold_count INTEGER DEFAULT 0,
        product_types JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_bundle_deals_active ON bundle_deals(is_active, is_featured, display_order)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_bundle_deals_slug ON bundle_deals(slug)
    `);

    // 5. Bundle Products Table
    await queryRunner.query(`
      CREATE TABLE bundle_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bundle_id UUID NOT NULL REFERENCES bundle_deals(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        is_bonus BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(bundle_id, product_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_bundle_products_bundle ON bundle_products(bundle_id, display_order)
    `);

    // 6. Section Analytics Table
    await queryRunner.query(`
      CREATE TABLE section_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_key VARCHAR(50) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        flash_deal_id UUID REFERENCES flash_deals(id) ON DELETE SET NULL,
        bundle_id UUID REFERENCES bundle_deals(id) ON DELETE SET NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(100),
        device_type VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_section_analytics_section ON section_analytics(section_key, event_type, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_section_analytics_product ON section_analytics(product_id, created_at)
    `);

    // 7. Seed default sections
    await queryRunner.query(`
      INSERT INTO page_sections (section_key, display_name, description, category, is_enabled, display_order, config)
      VALUES
        ('flash-deals', 'Flash Deals', 'Time-limited promotional deals with countdown timer', 'promotional', true, 1, 
         '{"showCountdown": true, "productsCount": 8, "autoScroll": true, "scrollInterval": 4000}'::jsonb),
        ('trending', 'Trending Products', 'Top selling products across all categories', 'products', true, 2,
         '{"selectionMode": "auto", "count": 8, "sortBy": "sales", "productTypes": ["game", "software", "giftcard", "subscription"]}'::jsonb),
        ('featured', 'Featured Products', 'Curated products organized by product type tabs', 'products', true, 3,
         '{"showTabs": true, "tabs": [{"id": "games", "label": "Games", "productType": "game"}, {"id": "software", "label": "Software", "productType": "software"}, {"id": "giftcards", "label": "Gift Cards", "productType": "giftcard"}, {"id": "subscriptions", "label": "Subscriptions", "productType": "subscription"}], "productsPerTab": 8}'::jsonb),
        ('categories', 'Categories', 'Browse by category grid with images', 'navigation', true, 4,
         '{"layout": "grid", "columns": 6, "showImages": true, "showBadges": true, "categoriesCount": 24}'::jsonb),
        ('bundles', 'Bundle Deals', 'Product bundles with savings', 'promotional', true, 5,
         '{"showSavings": true, "maxBundles": 6, "showProductCount": true}'::jsonb),
        ('gift-cards', 'Gift Cards', 'Quick-add gift card selection', 'products', true, 6,
         '{"platforms": ["steam", "playstation", "xbox", "nintendo", "spotify"], "denominations": [10, 25, 50, 100], "quickAdd": true}'::jsonb)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS section_analytics`);
    await queryRunner.query(`DROP TABLE IF EXISTS bundle_products`);
    await queryRunner.query(`DROP TABLE IF EXISTS bundle_deals`);
    await queryRunner.query(`DROP TABLE IF EXISTS flash_deal_products`);
    await queryRunner.query(`DROP TABLE IF EXISTS flash_deals`);
    await queryRunner.query(`DROP TABLE IF EXISTS page_sections`);
  }
}
