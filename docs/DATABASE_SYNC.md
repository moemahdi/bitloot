# Database Sync Guide

## Overview

BitLoot uses separate databases for local development (Docker PostgreSQL) and production (Railway PostgreSQL). This guide covers when and how to sync data.

---

## When to Sync

| Scenario | Action |
|----------|--------|
| Initial production setup | One-time full export/import ✅ |
| Schema changes (new tables/columns) | Use migrations (auto-deployed) |
| Add products | Use Admin UI or Kinguin sync in production |
| Bulk import test data to production | Manual sync (rare) |
| Orders/Payments/Users | **Never sync** - production-only data |

---

## Database Credentials

### Local (Docker)
```
Host: localhost:5432
User: bitloot
Password: bitloot
Database: bitloot
Container: bitloot-db
```

### Production (Railway)
```
Host: turntable.proxy.rlwy.net:26512
User: postgres
Password: [from Railway dashboard]
Database: railway
```

---

## Quick Commands

### Export from Local
```bash
# Full database (all tables)
docker exec bitloot-db pg_dump -U bitloot -d bitloot --data-only --column-inserts --no-owner --no-acl > data-export.sql

# Products only
docker exec bitloot-db pg_dump -U bitloot -d bitloot --data-only --column-inserts -t products > products-export.sql

# Specific tables
docker exec bitloot-db pg_dump -U bitloot -d bitloot --data-only --column-inserts -t products -t bundle_deals > catalog-export.sql
```

### Import to Railway
```bash
# Using Docker psql client
docker exec -i bitloot-db psql "postgresql://postgres:PASSWORD@turntable.proxy.rlwy.net:26512/railway" < data-export.sql

# Clear table before import (if needed)
docker exec -i bitloot-db psql "postgresql://postgres:PASSWORD@turntable.proxy.rlwy.net:26512/railway" -c "TRUNCATE products CASCADE;"
```

### Verify Import
```bash
docker exec -i bitloot-db psql "postgresql://postgres:PASSWORD@turntable.proxy.rlwy.net:26512/railway" -c "SELECT COUNT(*) FROM products;"
```

---

## Production Data Management

### Recommended Workflow

1. **Products**: Use Admin Dashboard (`/admin/catalog`) or Kinguin sync
2. **Bundles**: Create via Admin Dashboard (`/admin/bundles`)
3. **Users**: Self-registration only
4. **Schema**: Migrations auto-run on deploy

### Kinguin Sync (Production)
```bash
# Set production API URL
NEXT_PUBLIC_API_URL=https://your-api.railway.app node scripts/bulk-import-kinguin.js
```

---

## Troubleshooting

### Column mismatch errors
Use `--column-inserts` flag to include column names in INSERT statements.

### Foreign key violations
Import tables in dependency order: `users` → `products` → `bundle_deals` → `bundle_products`

### Truncate with dependencies
```sql
TRUNCATE products CASCADE;  -- Removes dependent records too
```

---

## Important Notes

- ⚠️ **Never sync production → local** for user/order data (contains real customer info)
- ⚠️ **Get Railway password** from Railway Dashboard → PostgreSQL → Variables
- ✅ Export files are in `.gitignore` - don't commit database dumps
