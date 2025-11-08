# 🎮 BitLoot — Crypto E-Commerce Platform

**Instant delivery of digital goods (game keys, subscriptions) via cryptocurrency**

- 🚀 **Frontend**: Next.js 16 (App Router) + React 19 PWA
- 🏗️ **Backend**: NestJS + PostgreSQL + Redis + BullMQ
- 💳 **Payments**: NOWPayments (300+ crypto assets)
- 📦 **Fulfillment**: Kinguin Sales Manager API (v1)
- 🔐 **Security**: JWT auth, OTP (6-digit), HMAC verification, R2 signed URLs
- 📚 **SDK-First**: Generated TypeScript SDK from OpenAPI (all network calls via SDK)

---

## 📋 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or pnpm

### Setup

```bash
# 1. Clone and install
git clone <repo>
cd bitloot
npm install

# 2. Copy environment
cp .env.example .env
# Edit .env with your local dev values

# 3. Start infrastructure
docker compose up -d

# 4. Start dev servers
npm run dev:all
```

**API:** http://localhost:4000/api  
**Web:** http://localhost:3000  
**Swagger:** http://localhost:4000/api/docs  
**Health:** http://localhost:4000/api/healthz

---

## 🏗️ Project Structure

```
bitloot/
├─ apps/
│  ├─ api/                    # NestJS backend
│  │  ├─ src/
│  │  │  ├─ modules/          # Feature modules (auth, orders, payments, etc.)
│  │  │  ├─ common/           # Shared (guards, filters, interceptors)
│  │  │  ├─ database/         # Entities, migrations, ORM config
│  │  │  ├─ jobs/             # BullMQ processors
│  │  │  └─ main.ts
│  │  └─ package.json
│  │
│  └─ web/                    # Next.js 16 PWA frontend
│     ├─ app/                 # Routes (thin layer only)
│     ├─ features/            # Feature components & hooks
│     ├─ public/              # Static assets & manifest
│     └─ package.json
│
├─ packages/
│  └─ sdk/                    # Generated TypeScript SDK (from OpenAPI)
│     ├─ src/
│     │  ├─ index.ts
│     │  └─ generated/        # ⚠️ Auto-generated, do not edit
│     └─ package.json
│
├─ docs/                      # Documentation
│  ├─ PRD.md                  # Product requirements
│  ├─ project-description.md  # Architecture overview
│  ├─ sdk.md                  # SDK design & generation
│  ├─ nowpayments-API-documentation.md
│  ├─ kinguin-API-documentation.md
│  ├─ kinguin-technical-documentation.md
│  ├─ resend-API-documentation.md
│  ├─ tawk-integration.md
│  └─ developer-roadmap/      # Staged development plan (00-Level → 08-Level)
│
├─ docker-compose.yml         # Local Postgres + Redis
├─ package.json               # Workspaces + root scripts
├─ tsconfig.base.json         # Shared TypeScript config (strict mode)
├─ .eslintrc.cjs              # Strict ESLint rules (no `any`, runtime safety)
├─ .prettierrc                # Code formatting
├─ .editorconfig              # Editor consistency
├─ .env.example               # Environment template
├─ BOOTSTRAP_COMPLETE.md      # Level 0 bootstrap summary
├─ LEVEL_0_COMPLETE.md        # Level 0 detailed completion report
├─ LEVEL_0_VERIFICATION.md    # Level 0 setup validation checklist
├─ QUICK_REFERENCE.md         # Quick command reference
└─ README.md                  # This file
```

---

## 📚 Documentation

### Getting Started — Level 0 (Developer Workflow)

- **[BOOTSTRAP_COMPLETE.md](./docs/developer-workflow/00-Level/BOOTSTRAP_COMPLETE.md)** — Level 0 bootstrap execution summary
- **[LEVEL_0_COMPLETE.md](./docs/developer-workflow/00-Level/LEVEL_0_COMPLETE.md)** — Detailed completion report with all deliverables
- **[LEVEL_0_VERIFICATION.md](./docs/developer-workflow/00-Level/LEVEL_0_VERIFICATION.md)** — Setup validation & smoke tests checklist
- **[QUICK_REFERENCE.md](./docs/developer-workflow/00-Level/QUICK_REFERENCE.md)** — Quick command reference card

### Architecture & Design

- **[docs/project-description.md](./docs/project-description.md)** — High-level overview
- **[docs/PRD.md](./docs/PRD.md)** — Product requirements & user flows
- **[docs/sdk.md](./docs/sdk.md)** — SDK design, generation, & client structure

### API Integration Docs

- **[docs/nowpayments-API-documentation.md](./docs/nowpayments-API-documentation.md)** — Payment IPN & API
- **[docs/kinguin-API-documentation.md](./docs/kinguin-API-documentation.md)** — Catalog sync & fulfillment
- **[docs/kinguin-technical-documentation.md](./docs/kinguin-technical-documentation.md)** — Webhook handling
- **[docs/resend-API-documentation.md](./docs/resend-API-documentation.md)** — Email templates & IPN

### Development Roadmap

- **[docs/developer-roadmap/Overview.md](./docs/developer-roadmap/Overview.md)** — Sequencing & phases
- **[docs/developer-roadmap/00-Level.md](./docs/developer-roadmap/00-Level.md)** — Project bootstrap (completed ✅)
- **[docs/developer-roadmap/01-Level.md](./docs/developer-roadmap/01-Level.md)** — Auth (OTP, JWT, password)
- **[docs/developer-roadmap/02-Level.md](./docs/developer-roadmap/02-Level.md)** — Products & catalog
- **[docs/developer-roadmap/03-Level.md](./docs/developer-roadmap/03-Level.md)** — Orders & checkout
- **[docs/developer-roadmap/04-Level.md](./docs/developer-roadmap/04-Level.md)** — Payments (NOWPayments IPN)
- **[docs/developer-roadmap/05-Level.md](./docs/developer-roadmap/05-Level.md)** — Fulfillment (Kinguin delivery)
- **[docs/developer-roadmap/06-Level.md](./docs/developer-roadmap/06-Level.md)** — Admin dashboard
- **[docs/developer-roadmap/07-Level.md](./docs/developer-roadmap/07-Level.md)** — Advanced (reviews, wishlists)
- **[docs/developer-roadmap/08-Level.md](./docs/developer-roadmap/08-Level.md)** — Optimization & scaling

### AI Agent Guidelines

- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** — Coding standards, patterns, security rules

---

## 🛠️ Available Scripts

### Development

```bash
# Start all services (API + Web)
npm run dev:all

# Start API only
npm run dev:api

# Start Web only
npm run dev:web
```

### Quality & Build

```bash
# Unified quality check (all checks with beautiful output)
npm run quality

# Run ALL checks and continue on failure
npm run quality all --continue

# Individual quality checks
npm run quality:type-check     # Type checking only
npm run quality:lint           # Linting only
npm run quality:format         # Format verification only
npm run quality:test           # Testing only
npm run quality:build          # Build only

# Full quality check (all tasks, stops on first failure)
npm run quality:full

# Traditional individual commands
npm run type-check             # Type check (strict mode, no `any`)
npm run lint                   # Lint (runtime safety, async, imports, etc.)
npm run lint:fix               # Auto-fix lint issues
npm run format                 # Format check
npm run format:fix             # Auto-format all files
npm run test                   # Run tests
npm run build                  # Build all workspaces
npm run clean                  # Clean build artifacts
```

### SDK Generation

```bash
# Generate SDK from OpenAPI (requires API running)
npm run sdk:gen
```

### Docker

```bash
# Start Postgres + Redis
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f db redis
```

---

## 🥇 Golden Rules (Must Know)

### 1. **SDK-First**

✅ Frontend ONLY calls BitLoot SDK (generated TypeScript client)  
❌ Never call NOWPayments, Kinguin, Resend, or other APIs directly from browser

### 2. **Security by Design**

- JWT + refresh tokens
- Role-based guards
- **Ownership checks** in services (all user data scoped to userId)
- **HMAC verification** for IPN/webhooks (prevent tampering)
- **Idempotent** handlers (prevent duplicate side effects)

### 3. **No Plaintext Secrets**

- Keys stored only in R2 (private bucket)
- Delivery via **short-lived signed URLs** (15 min expiry)
- Never in emails, logs, or frontend

### 4. **Type Safety**

- Strict TypeScript (`strict: true`)
- **No `any`** — errors if detected
- **No `@ts-ignore`** — errors if detected

### 5. **Idempotency & Queues**

- All webhook/IPN/email/fulfillment side effects go through **BullMQ**
- Handlers check for duplicates (dedupe by external ID)
- Automatic retries + dead-letter queues

### 6. **Pagination**

- All list endpoints paginate
- `limit ≤ 100`

---

## 📋 Code Quality Gates

Every PR must pass all quality checks:

```bash
# Run unified quality check (recommended)
npm run quality

# Or run individual checks
npm run type-check        # Zero TS errors
npm run lint --max-warnings 0  # Zero lint errors
npm run format            # Code formatted
npm run test              # Tests pass
npm run build             # Build succeeds
```

**No merges without passing CI.**

---

## 🔗 Important Links

| Purpose      | URL                               |
| ------------ | --------------------------------- |
| Web App      | http://localhost:3000             |
| API Health   | http://localhost:4000/api/healthz |
| Swagger Docs | http://localhost:4000/api/docs    |
| Postgres     | localhost:5432                    |
| Redis        | localhost:6379                    |

---

## 🚀 Next Steps

After Level 0 is verified:

1. **Level 1 (Auth)** → Implement OTP (6-digit), JWT, password reset
2. **Level 2 (Products)** → Kinguin catalog sync, search, filters
3. **Level 3 (Orders)** → Cart, checkout flow
4. **Level 4 (Payments)** → NOWPayments integration, IPN webhook
5. **Level 5 (Fulfillment)** → Kinguin order placement, key delivery via R2 signed URLs
6. **Level 6 (Admin)** → Dashboard, reporting
7. **Level 7 (Advanced)** → Reviews, wishlists, analytics

See [docs/developer-roadmap/Overview.md](./docs/developer-roadmap/Overview.md) for details.

---

## 🤝 Contributing

- Follow patterns in `.github/copilot-instructions.md`
- Run quality checks before committing
- Keep secrets in `.env` (never in code)
- Add tests for new features
- Regenerate SDK after API changes: `npm run sdk:gen`

---

## 📝 License

Copyright © 2025 BitLoot. All rights reserved.

---

**Questions?** Check docs/ or `.github/copilot-instructions.md` for guidance.
