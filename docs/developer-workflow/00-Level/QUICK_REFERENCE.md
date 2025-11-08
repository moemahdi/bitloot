# ⚡ Level 0 Quick Reference Card

## 🎯 What Was Built

✅ **Monorepo** with 3 workspaces (API, Web, SDK)  
✅ **Docker Compose** (Postgres + Redis)  
✅ **NestJS API** with Swagger documentation  
✅ **Next.js 16 PWA** web frontend  
✅ **SDK Generator** (OpenAPI to TypeScript)  
✅ **GitHub Actions CI/CD**  
✅ **Strict TypeScript + ESLint** (runtime-safe)

---

## 📦 Installation & Setup

```bash
# 1. Install all dependencies
npm install

# 2. Start infrastructure
docker compose up -d

# 3. Start dev servers
npm run dev:all

# Expected: Both running at localhost:3000 and localhost:4000
```

---

## 🔍 Verify Everything Works

```bash
# 1. Health check
curl http://localhost:4000/api/healthz
# → {"ok":true,"timestamp":"..."}

# 2. Open in browser
# - Web: http://localhost:3000
# - Docs: http://localhost:4000/api/docs

# 3. Run quality checks
npm run type-check && npm run lint && npm run test
```

---

## 📋 File Structure

```
bitloot/
├─ apps/
│  ├─ api/                      ← NestJS (port 4000)
│  │  └─ src/
│  │     ├─ modules/            ← 11 feature modules
│  │     ├─ common/             ← Shared code (guards, interceptors, etc.)
│  │     ├─ database/           ← Entities, migrations, ORM config
│  │     ├─ jobs/               ← BullMQ processors
│  │     ├─ config/             ← Env schemas & factories
│  │     └─ health/             ← Health check endpoint
│  └─ web/                      ← Next.js (port 3000)
│     ├─ app/                   ← Thin routes (App Router)
│     └─ src/
│        ├─ features/           ← Feature modules (catalog, checkout, auth, etc.)
│        └─ lib/                ← Utilities & SDK setup
├─ packages/sdk/                ← TypeScript SDK (generated)
├─ docker-compose.yml           ← Postgres + Redis
├─ package.json                 ← Workspaces + scripts
├─ tsconfig.base.json           ← Strict TS config
├─ .eslintrc.cjs                ← Runtime-safe rules
└─ .env                         ← Local dev config
```

---

## 🛠️ Essential Commands

| Command                | Purpose                |
| ---------------------- | ---------------------- |
| `npm run dev:all`      | Start API + Web        |
| `npm run dev:api`      | Start API only         |
| `npm run dev:web`      | Start Web only         |
| `npm run type-check`   | Check types (strict)   |
| `npm run lint`         | Check code quality     |
| `npm run lint:fix`     | Auto-fix lint issues   |
| `npm run format`       | Check formatting       |
| `npm run format:fix`   | Auto-format code       |
| `npm run test`         | Run tests              |
| `npm run build`        | Build all workspaces   |
| `npm run sdk:gen`      | Generate SDK from API  |
| `npm run quality:full` | Run all quality checks |
| `docker compose up -d` | Start Postgres + Redis |
| `docker compose down`  | Stop services          |

---

## 🎯 Golden Rules

1. ✅ **SDK-First** — Frontend calls only via BitLoot SDK
2. ✅ **Type Safe** — No `any`, strict mode enabled
3. ✅ **Secure** — Ownership checks, HMAC verify, guards
4. ✅ **Idempotent** — Webhooks/IPN handlers deduplicated
5. ✅ **Quality Gates** — All checks pass before merge

---

## 🔗 Important URLs

| Service  | URL                               |
| -------- | --------------------------------- |
| Web App  | http://localhost:3000             |
| API Base | http://localhost:4000/api         |
| Health   | http://localhost:4000/api/healthz |
| Docs     | http://localhost:4000/api/docs    |

---

## 📚 Next Steps

1. **Run verification** → See `LEVEL_0_VERIFICATION.md`
2. **Install deps** → `npm install`
3. **Start servers** → `npm run dev:all`
4. **Next Level** → See `docs/developer-roadmap/01-Level.md` (Auth)

---

## ✨ Key Files to Know

- **README.md** — Project overview & architecture
- **LEVEL_0_VERIFICATION.md** — Setup checklist
- **LEVEL_0_COMPLETE.md** — Full execution summary
- **docs/PRD.md** — Product requirements
- **.github/copilot-instructions.md** — Coding standards

---

## 🔧 Java 21 Configuration (for SDK Generation)

**Status:** ✅ Installed and configured in system PATH

- **Location:** `C:\Program Files\Java\jdk-21`
- **Verify:** `java -version` (should show Java 21.0.9 LTS)
- **Usage:** `npm run sdk:gen` works directly (no PATH override needed)

---

**Level 0 Complete! 🚀 Ready for Level 1 (Auth)**
