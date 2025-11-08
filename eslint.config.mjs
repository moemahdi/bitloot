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
      '**/*.config.mjs', // Don't lint eslint/next config files themselves
      'scripts/**', // Don't lint utility scripts
    ],
  },

  // API workspace configs (spread the array)
  ...apiConfig,

  // Web workspace configs (spread the array)
  ...webConfig,
];
