## Day-to-Day Development Workflow

### 🔄 Typical Development Cycle

```
Local Dev → Test → Commit → Push to GitHub → Railway Auto-Deploys → Live
```

---

### 📅 Daily Workflow

#### 1. Start Your Day

```bash
# Pull latest changes (if working with others)
git pull origin main

# Start local development environment
docker compose up -d          # Start Postgres + Redis
npm run dev:all               # Start API + Web locally
```

**Local URLs:**
- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/api/docs`

---

#### 2. Make Changes

```bash
# Work on your code (frontend, backend, SDK)
# Example: Add a new feature to the catalog

# If you change the API, regenerate SDK
npm run sdk:dev
```

---

#### 3. Test Before Committing

```bash
# Run quality checks (must pass before push)
npm run quality:full

# This runs:
# - TypeScript type-check
# - ESLint
# - Prettier formatting
# - All tests
# - Build verification
```

---

#### 4. Commit & Push

```bash
git add .
git commit -m "feat: add wishlist notifications"
git push origin main
```

---

#### 5. Railway Auto-Deploys

Once you push to `main`:
1. Railway detects the push (webhook from GitHub)
2. Builds API service (~2-3 min)
3. Builds Web service (~2-3 min)
4. Deploys both automatically
5. Zero downtime (rolling deployment)

**No manual deploy needed!**

---

### 🌿 Branch Strategy (Recommended)

```
main (production) ← feature branches
```

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production code | Railway (auto) |
| `feature/xyz` | New features | Nothing (local only) |
| `fix/xyz` | Bug fixes | Nothing (local only) |

**Workflow:**
```bash
# Create feature branch
git checkout -b feature/add-reviews

# Work on it locally...
# When ready:
git push origin feature/add-reviews

# Create Pull Request on GitHub
# Review code
# Merge to main → Auto-deploys to production
```

---

### 🛠️ Common Tasks

#### Add a New Product (Admin)
1. Go to `https://bitloot.io/admin/catalog/products`
2. Click "Import from Kinguin" or "Add Product"
3. Set price and publish

#### Fix a Bug
```bash
# 1. Create fix branch
git checkout -b fix/checkout-error

# 2. Fix the code
# 3. Test locally
npm run dev:all
npm run quality:full

# 4. Push and merge
git push origin fix/checkout-error
# Create PR → Merge → Auto-deploys
```

#### Update Pricing Rules
1. Go to `https://bitloot.io/admin/catalog/rules`
2. Edit rules in UI
3. No code deploy needed (database-driven)

#### Run Database Migration
```bash
# If you add a new migration:
npm run sdk:dev  # Regenerate if API changed

# Push to main, then run migration:
railway run npm --workspace apps/api run migration:run
```

---

### 📊 Monitoring Production

#### Daily Checks (~5 min)
- [ ] Check Railway dashboard for errors
- [ ] Review `/admin` dashboard for orders
- [ ] Check Kinguin balance
- [ ] Scan webhook logs for failures

#### Quick Commands
```bash
# View Railway logs
railway logs

# Check production health
curl https://api.bitloot.io/health

# Connect to production DB (careful!)
railway connect postgres
```

---

### 🚨 Hotfix Workflow (Emergency)

```bash
# 1. Fix directly on main (for critical issues)
git checkout main
git pull origin main

# 2. Make minimal fix
# 3. Test quickly
npm run quality:full

# 4. Push immediately
git commit -m "hotfix: fix payment webhook crash"
git push origin main

# 5. Railway auto-deploys in ~3 min
# 6. Verify fix on production
```

---

### 📁 What Lives Where

| Change Type | Where to Edit | Deploy Method |
|-------------|---------------|---------------|
| Frontend UI | web | Push to main |
| API endpoints | api | Push to main |
| Database schema | Migration file | Push + run migration |
| Products/Pricing | Admin panel | No deploy (DB) |
| Feature flags | Admin panel | No deploy (DB) |
| Promo codes | Admin panel | No deploy (DB) |
| Environment vars | Railway dashboard | Redeploy service |

---

### ⏰ Time Estimates

| Task | Time |
|------|------|
| Small bug fix | 15-30 min |
| New feature | 2-8 hours |
| Deploy to production | 3-5 min (auto) |
| Run migrations | 1-2 min |
| Add 10 products | 30-60 min |

---

### 💡 Pro Tips

1. **Always run `npm run quality:full` before pushing** — catches errors before production

2. **Use feature branches** — never break `main`

3. **Small, frequent commits** — easier to debug if something breaks

4. **Check Railway logs after deploy** — catch issues early

5. **Database changes need migrations** — never edit production DB directly

---

Want me to add this workflow to the Launch Guide?