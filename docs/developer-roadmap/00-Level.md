# Task: Level 0 — Workshop (project bootstrap, from empty repo → dev servers running clean)

## Analysis

Level 0 is where you set up the **monorepo, environments, quality gates, and local infrastructure** (Postgres + Redis). When you’re done, you can run **API + Web** together, auto-generate the **SDK** from Swagger, and ship PRs with green CI. Nothing fancy—just rock-solid foundations so Levels 1–7 are painless.

## Plan

1. Create monorepo layout (web, api, sdk).
2. Add strict TypeScript, ESLint/Prettier, testing.
3. Wire Docker Compose: Postgres, Redis.
4. Bootstrap NestJS (API) with Swagger + config.
5. Bootstrap Next.js 16 (Web) as PWA.
6. Configure OpenAPI → SDK generator (packages/sdk).
7. Add scripts, Git hooks, and GitHub Actions CI.
8. Smoke test: `npm run dev:all` shows both apps healthy.

## Technical Approach

- **Monorepo**: npm workspaces or pnpm (either is fine).
- **Quality-first**: no `any`, no `@ts-ignore`, strict mode.
- **12-Factor envs**: `.env`, no secrets checked in.
- **Local infra**: Dockerized Postgres/Redis for parity.
- **API**: NestJS + Swagger for SDK generation.
- **SDK**: generated TypeScript clients (domain-scoped).
- **Web**: Next.js 16 + React 19 PWA; all network calls go through SDK.
- **Queues**: BullMQ (wired later, but Redis must be ready now).
- **CI**: lint, type-check, test, build on every PR.

## Implementation (files + snippets)

### 0. Repo + Workspaces

```
bitloot/
  apps/
    api/
    web/
  packages/
    sdk/
  .github/workflows/ci.yml
  docker-compose.yml
  package.json
  tsconfig.base.json
  .eslintrc.cjs
  .prettierrc
  .nvmrc (optional)
  .editorconfig
  .env.example
```

**`package.json` (workspaces + scripts)**

```json
{
  "name": "bitloot",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:all": "concurrently -k \"npm:dev:api\" \"npm:dev:web\"",
    "dev:api": "npm --workspace apps/api run start:dev",
    "dev:web": "npm --workspace apps/web run dev",
    "build": "npm -w apps/api run build && npm -w apps/web run build",
    "type-check": "tsc -b",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --check .",
    "test": "npm -w apps/api t && npm -w apps/web t",
    "sdk:gen": "npm -w packages/sdk run generate"
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.6.0"
  }
}
```

**`tsconfig.base.json` (strict, composite for project refs)**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@bitloot/sdk/*": ["packages/sdk/src/*"]
    }
  }
}
```

**`.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'unused-imports', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  parserOptions: { project: true, tsconfigRootDir: __dirname },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'never' }],
    'unused-imports/no-unused-imports': 'error',
    'import/order': ['error', { 'newlines-between': 'always' }],
  },
  ignorePatterns: ['dist', 'node_modules'],
};
```

**`.prettierrc`**

```json
{ "printWidth": 100, "singleQuote": true, "trailingComma": "all" }
```

### 1. Local Infrastructure (Docker)

**`docker-compose.yml`**

```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: bitloot
      POSTGRES_PASSWORD: bitloot
      POSTGRES_DB: bitloot
    ports: ['5432:5432']
    volumes: [db_data:/var/lib/postgresql/data]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U bitloot']
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    command: ['redis-server', '--appendonly', 'yes']
    volumes: [redis_data:/data]

volumes:
  db_data:
  redis_data:
```

Run:

```bash
docker compose up -d
```

### 2. Environment Files

**`.env.example`**

```
# API
API_PORT=4000
DATABASE_URL=postgres://bitloot:bitloot@localhost:5432/bitloot
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=change-me
CORS_ORIGIN=http://localhost:3000

# Storage (R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=

# Emails (Resend)
RESEND_API_KEY=
EMAIL_FROM=no-reply@yourdomain.com

# Payments (NOWPayments)
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
NOWPAYMENTS_BASE_URL=https://api-sandbox.nowpayments.io

# Kinguin
KINGUIN_API_KEY=
KINGUIN_BASE_URL=https://api-sandbox.kinguin.net
KINGUIN_WEBHOOK_SECRET=
```

Copy it to `.env` and fill local values.

### 3. API App (NestJS)

```
apps/api/
  src/
    main.ts
    app.module.ts
    common/config/config.module.ts
    common/config/config.service.ts
    common/filters/http-exception.filter.ts
    common/interceptors/transform.interceptor.ts
    health/health.controller.ts
```

**`apps/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "module": "commonjs", "target": "ES2022" },
  "include": ["src"]
}
```

**`apps/api/src/main.ts`**

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true }); // raw body for HMAC later
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true });
  app.use(urlencoded({ extended: true }));
  app.use(json({ limit: '1mb' }));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('BitLoot API')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  await app.listen(process.env.API_PORT || 4000);
}
bootstrap();
```

**`apps/api/src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';
import { BullModule } from '@nestjs/bullmq';
import { DataSourceOptions } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (): DataSourceOptions => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        autoLoadEntities: true,
        synchronize: false, // migrations only
      }),
    }),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL },
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

**`apps/api/src/health/health.controller.ts`**

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('healthz')
export class HealthController {
  @Get()
  ok() {
    return { ok: true };
  }
}
```

**`apps/api/package.json` (partial)**

```json
{
  "name": "@bitloot/api",
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "t": "vitest run"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/swagger": "^7.3.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "typeorm": "^0.3.20",
    "pg": "^8.12.0",
    "@nestjs/bullmq": "^10.0.0",
    "ioredis": "^5.4.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "vitest": "^2.0.0",
    "ts-node": "^10.9.2"
  }
}
```

> Note: Keep `synchronize: false` and use migrations from Level 1 onward.

### 4. Web App (Next.js 16 PWA)

```
apps/web/
  app/
    layout.tsx
    page.tsx
  next.config.mjs
  public/manifest.json
  package.json
  tsconfig.json
```

**`apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "jsx": "react-jsx", "module": "ESNext", "moduleResolution": "bundler" },
  "include": ["app", "features", "components", "lib"]
}
```

**`apps/web/app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">BitLoot</h1>
      <p>It works 🎉</p>
    </main>
  );
}
```

**`apps/web/next.config.mjs`**

```js
const nextConfig = {
  experimental: { reactCompiler: true },
  images: { remotePatterns: [] },
};
export default nextConfig;
```

**`apps/web/public/manifest.json`**

```json
{
  "name": "BitLoot",
  "short_name": "BitLoot",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b0b0b",
  "theme_color": "#000000",
  "icons": []
}
```

**`apps/web/package.json` (partial)**

```json
{
  "name": "@bitloot/web",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "t": "vitest run"
  },
  "dependencies": {
    "next": "14.2.6",
    "react": "19.0.0-rc-...",
    "react-dom": "19.0.0-rc-...",
    "@tanstack/react-query": "^5.51.0",
    "zod": "^3.23.8"
  },
  "devDependencies": { "vitest": "^2.0.0" }
}
```

### 5. SDK Package (OpenAPI → TypeScript)

```
packages/sdk/
  src/
    index.ts
  package.json
  tsconfig.json
  openapi-generator-config.json
```

**`packages/sdk/openapi-generator-config.json`**

```json
{
  "generatorName": "typescript-fetch",
  "inputSpec": "http://localhost:4000/api-json",
  "output": "packages/sdk/src/generated",
  "additionalProperties": {
    "supportsES6": true,
    "withInterfaces": true,
    "typescriptThreePlus": true
  }
}
```

**`packages/sdk/package.json`**

```json
{
  "name": "@bitloot/sdk",
  "type": "module",
  "scripts": {
    "generate": "openapi-generator-cli generate -g typescript-fetch -i http://localhost:4000/api-json -o src/generated"
  },
  "devDependencies": {
    "@openapitools/openapi-generator-cli": "^2.13.4",
    "typescript": "^5.6.0"
  }
}
```

**`packages/sdk/src/index.ts`**

```ts
export * from './generated';
```

> Later levels: add domain wrappers, auth token injection, error normalization.

### 6. Husky Hooks (optional but nice)

```bash
npx husky init
echo "npm run format && npm run lint --max-warnings 0 && npm run type-check && npm run test" > .husky/pre-commit
chmod +x .husky/pre-commit
```

### 7. CI (GitHub Actions)

**`.github/workflows/ci.yml`**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: bitloot
          POSTGRES_PASSWORD: bitloot
          POSTGRES_DB: bitloot_test
        ports: ['5433:5432']
        options: >-
          --health-cmd "pg_isready -U bitloot" --health-interval 5s --health-timeout 5s --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6380:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint --max-warnings 0
      - run: npm run test
      - run: npm run build
```

### 8. Verify the Skeleton

- **Start infra**: `docker compose up -d`
- **Run API**: `npm run dev:api` → open `http://localhost:4000/api/docs` and `http://localhost:4000/api/healthz`
- **Run Web**: `npm run dev:web` → open `http://localhost:3000`
- **Generate SDK** (once API is up): `npm run sdk:gen`

## Verification

- ✅ `docker compose ps` shows Postgres + Redis healthy.
- ✅ `GET /api/healthz` returns `{ ok: true }`.
- ✅ Next.js homepage renders.
- ✅ `npm run sdk:gen` produces `packages/sdk/src/generated` without errors.
- ✅ `npm run lint`, `npm run type-check`, `npm run test`, `npm run build` all pass locally and in CI.

## Commands (copy/paste)

```bash
# 1) Infra
docker compose up -d

# 2) Dev servers
npm run dev:api
npm run dev:web
npm run dev:all  # both

# 3) Quality loop
npm run format && npm run lint --max-warnings 0 && npm run type-check && npm run test && npm run build

# 4) SDK (after API is running)
npm run sdk:gen
```

---
