// @ts-nocheck
// eslint.config.mjs
// Root ESLint Configuration for BitLoot Monorepo
// Uses workspace-specific linting via package.json scripts instead of merging configs

import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores - applied to all files
  {
    ignores: [
      '**/node_modules',
      '**/.turbo',
      '**/.next',
      '**/dist',
      '**/coverage',
      '**/.env',
      '**/.env.*',
      '**/*.log',
      '**/pnpm-lock.yaml',
      '**/yarn.lock',
      '**/package-lock.json',
      '.git',
      '.vscode',
      '.idea',
      'packages/sdk/src/generated/**', // SDK is generated, don't lint
      'packages/sdk/fix-sdk-runtime.js', // Post-generation fix script
      '**/*.config.mjs', // Don't lint eslint/next config files themselves
      'scripts/**', // Don't lint utility scripts
      'apps/web/src/design-system/primitives/**', // shadcn/ui components are from external library
      'apps/web/src/design-system/styles/**', // Generated theme styles
      '**/__tests__/**', // Exclude test files from linting
      '**/*.spec.ts', // Exclude spec files from linting
      '**/*.test.ts', // Exclude test files from linting
      'test/**', // Exclude test directory from linting
      '**/vitest-global-setup.ts', // Exclude vitest setup from linting
      '**/test-setup.ts', // Exclude test setup from linting
      '**/vitest.config.ts', // Exclude vitest config from linting
      'apps/api/check-migrations.ts', // Standalone script not in tsconfig
      // Build outputs
      'build/**',
      '*.min.js',
      // Next.js
      'out/**',
      // Storybook
      '.storybook/**',
      'storybook-static/**',
      // Cypress
      'cypress/**',
      'cypress.config.ts',
    ],
  },
);
