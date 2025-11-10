#!/usr/bin/env node
/**
 * Post-SDK generation fix script
 *
 * Fixes TypeScript error TS4115 in generated runtime.ts:
 * "This parameter property must have an 'override' modifier because it overrides a member in base class 'Error'."
 *
 * Issue: OpenAPI Generator creates FetchError with public cause parameter
 * that doesn't have override modifier when strict noImplicitOverride is enabled.
 *
 * Solution: Add override modifier to cause parameter constructor property.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runtimePath = path.join(__dirname, 'src', 'generated', 'runtime.ts');

console.log('🔧 [SDK Fix] Patching runtime.ts for FetchError override modifier...');

try {
  // Read the generated runtime.ts file
  let content = fs.readFileSync(runtimePath, 'utf8');

  // Find and fix the FetchError class
  // Old: constructor(public cause: Error, msg?: string)
  // New: constructor(public override cause: Error, msg?: string)
  const oldPattern =
    /export class FetchError extends Error \{\s*override name: "FetchError" = "FetchError";\s*constructor\(public cause: Error, msg\?:\s*string\)/;
  const newReplacement = `export class FetchError extends Error {
    override name: "FetchError" = "FetchError";
    constructor(public override cause: Error, msg?: string)`;

  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newReplacement);
    fs.writeFileSync(runtimePath, content, 'utf8');
    console.log('✅ [SDK Fix] Successfully patched FetchError.cause with override modifier');
  } else {
    // Check if already fixed
    if (content.includes('constructor(public override cause: Error, msg?: string)')) {
      console.log('✅ [SDK Fix] FetchError already has override modifier (no change needed)');
    } else {
      console.warn(
        '⚠️  [SDK Fix] Could not find expected FetchError pattern (manual verification recommended)',
      );
    }
  }
} catch (error) {
  console.error('❌ [SDK Fix] Error while patching runtime.ts:', error.message);
  process.exit(1);
}

console.log('🎉 [SDK Fix] Done!');
