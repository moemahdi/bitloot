/**
 * Global setup file for vitest
 * Runs BEFORE any test files are loaded
 */
import 'reflect-metadata';

export default async function setup() {
  // Verify reflect-metadata is loaded
  if (typeof (global as any).Reflect === 'undefined' || typeof (global as any).Reflect.getMetadata === 'undefined') {
    console.error('reflect-metadata not properly loaded!');
    throw new Error('reflect-metadata polyfill failed to load');
  }
  console.log('✓ reflect-metadata polyfill loaded successfully');
}
