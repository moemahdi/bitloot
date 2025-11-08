# BitLoot Level 0 Setup - Verification Checklist

## ✅ Pre-Setup Verification

Run this checklist after Level 0 bootstrap to confirm everything is ready.

### 1. Project Structure

Verify all directories and key files exist:

```bash
# Root config files
ls -la | grep -E "(package.json|tsconfig|eslint|prettier|docker-compose|.env)"

# API structure
ls -la apps/api/src/
# Expected: main.ts, app.module.ts, modules/, common/, database/, jobs/, config/, health/

# Web structure
ls -la apps/web/
# Expected: app/, src/, public/, next.config.mjs, tsconfig.json, package.json

# SDK structure
ls -la packages/sdk/src/
# Expected: index.ts
```

### 2. Install Dependencies

```bash
npm ci
# or
npm install
```

### 3. Start Infrastructure

In one terminal:

```bash
docker compose up -d
```

Verify services are running:

```bash
docker compose ps
# All services should show "healthy" or "running"

# Test Postgres connection
docker compose exec db psql -U bitloot -d bitloot -c "SELECT NOW();"

# Test Redis connection
docker compose exec redis redis-cli ping
# Should respond: PONG
```

### 4. Start API Development Server

In one terminal:

```bash
npm run dev:api
```

**Expected output:**

```
[Nest] 12345  - 01/01/2025, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized +50ms
✅ API running on http://localhost:4000
📚 Swagger docs at http://localhost:4000/api/docs
```

### 5. Start Web Development Server

In another terminal:

```bash
npm run dev:web
```

**Expected output:**

```
  ▲ Next.js 14.2.6
  - Local:        http://localhost:3000
  ✓ Ready in 1.5s
```

### 6. Test API Health Check

```bash
curl http://localhost:4000/api/healthz
# Should return: {"ok":true,"timestamp":"2025-01-01T10:00:00.000Z"}
```

Or open in browser: http://localhost:4000/api/healthz

### 7. Test Swagger Documentation

Open in browser: http://localhost:4000/api/docs

Should display Swagger UI with the API documented.

### 8. Test Web Homepage

Open in browser: http://localhost:3000

Should display:

- 🎮 BitLoot heading
- "Crypto-only e-commerce for instant delivery of digital goods" description
- Links to API health check and Swagger docs

### 9. Run Quality Checks

In the root directory:

```bash
# Type check
npm run type-check
# Should pass with no errors

# Lint
npm run lint
# Should pass with no errors (or only warnings if specified)

# Format check
npm run format
# Should pass (all files properly formatted)

# Run tests
npm run test
# Should pass (health controller tests pass)

# Build
npm run build
# Should complete successfully
```

### 10. SDK Generation (Optional at this stage)

Once API is running:

```bash
npm run sdk:gen
# Should fetch OpenAPI spec and generate clients in packages/sdk/src/generated/
```

## 🎯 Summary

**Green Indicators:**

- ✅ All dependencies installed (`node_modules` exists)
- ✅ Docker Postgres and Redis running and healthy
- ✅ API server starts without errors
- ✅ Web server starts without errors
- ✅ `/api/healthz` returns `{"ok": true}`
- ✅ Swagger docs accessible at `/api/docs`
- ✅ Web homepage loads with content
- ✅ `npm run type-check` passes
- ✅ `npm run lint` passes
- ✅ `npm run format` passes
- ✅ `npm run test` passes
- ✅ `npm run build` completes

## 🚀 Running Both Servers Together

For convenience, use:

```bash
npm run dev:all
```

This runs both API and Web servers concurrently.

## 🧹 Cleanup

To stop services:

```bash
# Stop Docker containers
docker compose down

# Remove volumes (data loss!)
docker compose down -v
```

## 🔗 Important URLs

- 🏠 Web App: http://localhost:3000
- 🏥 API Health: http://localhost:4000/api/healthz
- 📚 Swagger Docs: http://localhost:4000/api/docs
- 🗄️ Postgres: localhost:5432
- 🔴 Redis: localhost:6379

## 📝 Next Steps

After Level 0 verification:

1. **Level 1 (Auth)**: Implement OTP, JWT tokens, password setup
2. **Level 2 (Products)**: Product catalog, search, filters
3. **Level 3 (Orders)**: Cart, checkout flow
4. **And onwards...** through Level 7 per developer-roadmap

---

**Questions?** Check `.github/copilot-instructions.md` or `docs/` for more details.
