// @ts-nocheck
// eslint.config.mjs
// @ts-check
// ESLint Configuration for NestJS API with Runtime Safety Contract
// Combines NestJS best practices with strict type and async safety

import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // ===== GLOBAL IGNORES =====
  {
    ignores: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      '.turbo',
      '.eslintcache',
      '**/*.min.js',
      'migrations/**', // TypeORM migrations often have non-standard patterns
      '**/__tests__/**', // Exclude test files from linting
      '**/*.spec.ts', // Exclude spec files from linting
      '**/*.test.ts', // Exclude test files from linting
      'test/**', // Exclude test directory from linting
      '**/vitest-global-setup.ts', // Exclude vitest setup from linting
      '**/test-setup.ts', // Exclude test setup from linting
      '**/vitest.config.ts', // Exclude vitest config from linting
      'check-migrations.ts', // Standalone script not in tsconfig
      '*.config.mjs', // ESLint config files
      'eslint.config.mjs', // ESLint config file
      'src/database/migrations/**', // TypeORM migrations use console.log
    ],
  },

  // ===== BASE CONFIGURATIONS =====
  {
    ...eslint.configs.recommended,
  },
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier, // Must be last to disable conflicting rules

  // ===== GLOBAL LANGUAGE OPTIONS =====
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        allowDefaultProject: ['eslint.config.mjs', 'nest-cli.json'],
      },
      globals: {
        ...globals.es2020,
        ...globals.node,
      },
    },
  },

  // ===== TYPESCRIPT FILES (src, test, scripts) =====
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // ============================================
      // 🛡️ RUNTIME SAFETY CONTRACT (NON-NEGOTIABLE)
      // ============================================

      // 1️⃣ ASYNC SAFETY - Prevent unhandled-async errors
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true, ignoreIIFE: false }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: { attributes: false }, // Decorators use void callbacks
          checksConditionals: true,
          checksSpreads: true,
        },
      ],
      '@typescript-eslint/await-thenable': 'error',

      // 2️⃣ TYPE SAFETY - Prevent unsafe-access/unsafe-call errors
      '@typescript-eslint/no-explicit-any': 'error', // ⭐ CRITICAL
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // 3️⃣ NULL SAFETY - Prevent unsafe-access errors
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],

      // 4️⃣ IMPORT SAFETY - Prevent circular dependencies and improper imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],

      // ============================================
      // 🔒 NestJS-SPECIFIC BEST PRACTICES
      // ============================================

      'no-restricted-syntax': [
        'error',

        // ⚠️ Dangerous ID generation
        {
          selector: 'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
          message:
            '❌ Math.random() is not cryptographically safe. Use crypto.randomUUID() for IDs',
        },

        // ⚠️ Unsafe string parsing
        {
          selector: 'CallExpression[callee.name="parseInt"]:not([arguments.1])',
          message:
            '❌ Missing radix parameter in parseInt(). Use parseInt(str, 10) to prevent octal parsing',
        },
      ],

      // ============================================
      // 💾 DATABASE & TYPEORM PATTERNS
      // ============================================

      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],

      // ============================================
      // 🧹 CODE QUALITY
      // ============================================

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'off', // Too many false positives with DTOs
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'warn',

      // ============================================
      // 🎨 NestJS DECORATOR PATTERNS
      // ============================================

      // DTOs often don't need constructors or class methods
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-inferrable-types': 'off', // Explicit types in DTOs are good

      // ============================================
      // 🚫 PREVENT COMMON MISTAKES
      // ============================================

      'no-implicit-coercion': 'error',
      'no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],

      'no-restricted-globals': [
        'error',
        {
          name: 'fdescribe',
          message: '❌ fdescribe locks tests. Use describe() instead.',
        },
        {
          name: 'fit',
          message: '❌ fit locks tests. Use it() instead.',
        },
      ],

      // ============================================
      // 📝 CODE STYLE
      // ============================================

      'no-console': ['warn', { allow: ['warn', 'error'] }], // Allow warn/error
      'no-debugger': 'error',
      'no-alert': 'error',
    },
  },

  // ===== TEST FILES (Vitest) =====
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**', 'test/**'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      // Tests can be more lenient with floating promises
      '@typescript-eslint/no-floating-promises': 'off',

      // Allow 'any' in mocks
      '@typescript-eslint/no-explicit-any': 'warn',

      // Tests don't need full documentation
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // ===== MIGRATION FILES (Special handling) =====
  {
    files: ['src/database/migrations/**/*.ts'],
    rules: {
      // Migrations are often procedural and may not fit strict patterns
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // ===== CONFIG FILES =====
  {
    files: ['*.config.ts', 'nest-cli.json'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // ===== COMMONJS FILES =====
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
);
