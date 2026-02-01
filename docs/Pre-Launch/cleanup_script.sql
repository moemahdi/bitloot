-- ============================================
-- BitLoot Production Database Cleanup Script
-- ============================================
-- 
-- PURPOSE: Clear all sandbox/test data before production launch
-- 
-- USAGE:
--   docker exec -i bitloot-db psql -U bitloot bitloot < docs/cleanup_script.sql
--
-- WARNING: This will DELETE all test data. Backup first if needed!
--
-- ============================================

-- Start transaction (rollback on any error)
BEGIN;

-- Log start
DO $$ BEGIN RAISE NOTICE '🧹 Starting BitLoot database cleanup...'; END $$;

-- ============================================
-- STEP 1: Disable foreign key checks temporarily
-- ============================================
SET session_replication_role = replica;

DO $$ BEGIN RAISE NOTICE '  ✓ Foreign key checks disabled'; END $$;

-- ============================================
-- STEP 2: Clear all order-related data
-- ============================================
TRUNCATE TABLE keys CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE payments CASCADE;

DO $$ BEGIN RAISE NOTICE '  ✓ Orders, payments, keys cleared'; END $$;

-- ============================================
-- STEP 3: Clear webhook and audit logs
-- ============================================
TRUNCATE TABLE webhook_logs CASCADE;
TRUNCATE TABLE audit_logs CASCADE;

DO $$ BEGIN RAISE NOTICE '  ✓ Webhook and audit logs cleared'; END $$;

-- ============================================
-- STEP 4: Clear marketing data
-- ============================================
TRUNCATE TABLE flash_deal_products CASCADE;
TRUNCATE TABLE flash_deals CASCADE;
TRUNCATE TABLE bundle_products CASCADE;
TRUNCATE TABLE bundle_deals CASCADE;
TRUNCATE TABLE section_analytics CASCADE;

DO $$ BEGIN RAISE NOTICE '  ✓ Marketing data cleared'; END $$;

-- ============================================
-- STEP 5: Clear user activity data
-- ============================================
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE watchlist_items CASCADE;
TRUNCATE TABLE promoredemptions CASCADE;
TRUNCATE TABLE user_sessions CASCADE;

DO $$ BEGIN RAISE NOTICE '  ✓ User activity data cleared'; END $$;

-- ============================================
-- STEP 6: Clear test products
-- (Starting fresh with real products)
-- ============================================
TRUNCATE TABLE product_groups CASCADE;
TRUNCATE TABLE product_offers CASCADE;
TRUNCATE TABLE dynamic_pricing_rules CASCADE;
TRUNCATE TABLE products CASCADE;

DO $$ BEGIN RAISE NOTICE '  ✓ Products and pricing rules cleared'; END $$;

-- ============================================
-- STEP 7: Clear promo codes (optional - uncomment if needed)
-- ============================================
-- TRUNCATE TABLE promocodes CASCADE;
-- DO $$ BEGIN RAISE NOTICE '  ✓ Promo codes cleared'; END $$;

-- ============================================
-- STEP 8: Keep admin user, remove test users
-- ============================================
DELETE FROM users 
WHERE role != 'admin' 
  AND email NOT LIKE '%@bitloot.io'
  AND email NOT LIKE '%@yourdomain.com';

DO $$ BEGIN RAISE NOTICE '  ✓ Test users removed (admin kept)'; END $$;

-- ============================================
-- STEP 9: Re-enable foreign key checks
-- ============================================
SET session_replication_role = DEFAULT;

DO $$ BEGIN RAISE NOTICE '  ✓ Foreign key checks re-enabled'; END $$;

-- ============================================
-- STEP 10: Commit transaction
-- ============================================
COMMIT;

DO $$ BEGIN RAISE NOTICE '🎉 Database cleanup complete!'; END $$;

-- ============================================
-- VERIFICATION: Show table counts
-- ============================================
DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '📊 Verification (all should be 0 or minimal):'; END $$;

SELECT 'orders' as table_name, COUNT(*)::text as count FROM orders
UNION ALL SELECT 'payments', COUNT(*)::text FROM payments
UNION ALL SELECT 'products', COUNT(*)::text FROM products
UNION ALL SELECT 'keys', COUNT(*)::text FROM keys
UNION ALL SELECT 'users', COUNT(*)::text FROM users
UNION ALL SELECT 'webhook_logs', COUNT(*)::text FROM webhook_logs
UNION ALL SELECT 'audit_logs', COUNT(*)::text FROM audit_logs
UNION ALL SELECT 'reviews', COUNT(*)::text FROM reviews
UNION ALL SELECT 'flash_deals', COUNT(*)::text FROM flash_deals
ORDER BY table_name;

-- ============================================
-- NEXT STEPS
-- ============================================
-- 1. Switch to production API credentials in .env
-- 2. Restart the API server
-- 3. Add real products via admin panel
-- 4. Run pre-launch tests
-- ============================================
