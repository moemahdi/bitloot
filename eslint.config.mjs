// @ts-nocheck
// eslint.config.mjs
// Root ESLint Configuration for BitLoot Monorepo
// Coordinates workspace-specific configs for API and Web

import apiConfig from './apps/api/eslint.config.mjs';
import webConfig from './apps/web/eslint.config.mjs';

export default [
  // Global ignores - ignore at root level
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
    ],
  },

  // API workspace configs (spread the array)
  ...apiConfig,

  // Web workspace configs (spread the array)
  ...webConfig,
];
