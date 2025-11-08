/**
 * BitLoot SDK
 *
 * Typed client library for the BitLoot API.
 * Generated from OpenAPI specification.
 *
 * SDK-first principle: Frontend calls only through this SDK.
 * All 3rd-party API details (payments, fulfillment, etc.) are server-side only.
 */

// Export all generated clients and models
export * from './generated';

export const VERSION = '0.0.1';
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
