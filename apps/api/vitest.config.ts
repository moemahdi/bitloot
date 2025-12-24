import 'reflect-metadata';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        // Ensure reflect-metadata is loaded before tests by using execArgv
        execArgv: [
          '--require',
          path.resolve(__dirname, './src/reflect-metadata.ts'),
        ],
      },
    },
    globalSetup: [path.resolve(__dirname, './src/vitest-global-setup.ts')],
    setupFiles: [path.resolve(__dirname, './src/test-setup.ts')],
    deps: {
      // Ensure reflect-metadata is loaded before any decorators
      interopDefault: true,
    },
  },
});
