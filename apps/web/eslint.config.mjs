// eslint.config.mjs
// ESLint Configuration for Next.js 16+ App Router with Runtime Safety Rules
// 🎯 CRITICAL: Properly configured for React 19 + TypeScript with JSX support

import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const isProduction = process.env.NODE_ENV === 'production';

export default tseslint.config(
  // ============================================================================
  // IGNORES - Skip these files/folders from linting
  // ============================================================================
  {
    ignores: [
      'node_modules',
      '.next',
      '.turbo',
      '.eslintcache',
      'dist',
      'coverage',
      'cypress',
      'cypress.config.ts',
      'out',
      'build',
      '.storybook',
      'storybook-static',
    ],
  },

  // ============================================================================
  // BASE CONFIGURATIONS - JavaScript + TypeScript recommended rules
  // ============================================================================
  {
    ...eslint.configs.recommended,
  },
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier, // Disable Prettier conflicts

  // ============================================================================
  // LANGUAGE OPTIONS & GLOBALS
  // ============================================================================
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // ✅ CRITICAL FIX: Enable JSX support
        },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        // ✅ CRITICAL FIX: Allow default project for Next.js config files
        allowDefaultProject: [
          'tailwind.config.js',
          'tailwind.config.ts',
          'postcss.config.js',
          'postcss.config.mjs',
          'next.config.js',
          'next.config.mjs',
          'eslint.config.mjs',
        ],
      },
      globals: {
        ...globals.es2023,
        ...globals.browser,
        ...globals.node,
        React: 'readonly', // ✅ CRITICAL FIX: Make React available globally for JSX
        JSX: 'readonly',
      },
    },

    // ============================================================================
    // PLUGINS
    // ============================================================================
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },

    // ============================================================================
    // SETTINGS - Plugin-specific configuration
    // ============================================================================
    settings: {
      react: {
        version: '19.2.0', // ✅ FIX: Specify React version to eliminate warning
      },
    },

    // ============================================================================
    // RULES - The actual lint rules
    // ============================================================================
    rules: {
      // ========================================================================
      // 🛡️ REACT & JSX SAFETY (prevents premature-state & unsafe-access)
      // ========================================================================

      // ✅ Recommended React rules from plugin
      ...reactPlugin.configs.recommended.rules,

      // ✅ CRITICAL: React Hooks rules
      'react-hooks/rules-of-hooks': 'error', // Hooks must be called at top level
      'react-hooks/exhaustive-deps': 'warn', // Warn on missing dependencies

      // ✅ JSX Handling
      'react/jsx-uses-react': 'off', // Not needed in React 19+ with new JSX transform
      'react/react-in-jsx-scope': 'off', // Not needed in React 19+ with new JSX transform
      'react/no-unescaped-entities': 'warn', // Warn on unescaped entities
      'react/display-name': 'warn', // Warn when display name is missing
      'react/no-invalid-html-attribute': 'error',

      // ========================================================================
      // 🛡️ NEXT.JS SPECIFIC RULES
      // ========================================================================

      '@next/next/no-img-element': 'error', // Use Image component instead of img
      '@next/next/no-html-link-for-pages': 'error', // Use Link component
      '@next/next/no-sync-scripts': 'error', // Prevent sync scripts
      '@next/next/google-font-display': 'warn',
      '@next/next/no-before-interactive-script-outside-document': 'error',

      // ========================================================================
      // 🛡️ TYPESCRIPT TYPE SAFETY (prevents unsafe-access & unsafe-call)
      // ========================================================================

      // ✅ CRITICAL: No 'any' types
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // ✅ Consistent type imports
      '@typescript-eslint/consistent-type-imports': 'error',

      // ✅ Strict boolean expressions
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
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

      // ✅ Prefer nullish coalescing and optional chaining
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // ✅ Unused variables
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // ✅ No unnecessary conditions
      '@typescript-eslint/no-unnecessary-condition': 'warn',

      // ✅ Type safety relaxations for development
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',

      // ========================================================================
      // 🛡️ ASYNC SAFETY (prevents unhandled-async issues - CRITICAL)
      // ========================================================================

      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/await-thenable': 'error',

      // ========================================================================
      // 🛡️ RUNTIME SAFETY (prevents dangerous patterns)
      // ========================================================================

      'no-implicit-coercion': 'error',
      'no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],

      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
          message: 'Use crypto.randomUUID() or generateId() instead of Math.random() for IDs',
        },
        {
          selector: 'CallExpression[callee.name="parseInt"]:not([arguments.1])',
          message: 'Always specify radix parameter in parseInt() - e.g. parseInt(str, 10)',
        },
      ],

      'no-restricted-globals': [
        'error',
        {
          name: 'event',
          message: 'Use parameter event instead of global event',
        },
        {
          name: 'fdescribe',
          message: 'Do not commit fdescribe. Use describe instead.',
        },
        {
          name: 'fit',
          message: 'Do not commit fit. Use it instead.',
        },
      ],

      // ========================================================================
      // 🛡️ PRODUCTION SAFETY
      // ========================================================================

      'no-console': [isProduction ? 'error' : 'warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': isProduction ? 'error' : 'warn',
      'no-alert': isProduction ? 'error' : 'warn',

      // ========================================================================
      // IMPORT/EXPORT SAFETY
      // ========================================================================

      '@next/next/no-duplicate-head': 'error',

      // ========================================================================
      // DEVELOPMENT RELAXATIONS
      // ========================================================================

      'react/jsx-key': 'warn',
      'react/prop-types': 'off',
    },
  },

  // ============================================================================
  // TEST FILES - Relaxed rules for tests
  // ============================================================================
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/__tests__/**'],
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
        jest: 'readonly',
        xtest: 'readonly',
        xit: 'readonly',
        xdescribe: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      'no-console': 'off',
    },
  },

  // ============================================================================
  // CONFIG FILES - Relaxed rules for Next.js config
  // ============================================================================
  {
    files: [
      'tailwind.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
      'next.config.js',
      'next.config.mjs',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // ============================================================================
  // JAVASCRIPT FILES - Allow CommonJS in scripts
  // ============================================================================
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
