import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { Logger } from '@nestjs/common';

/**
 * Encryption utility for secure key storage
 *
 * Uses AES-256-GCM (Galois/Counter Mode) for authenticated encryption.
 * - AES-256: 32-byte (256-bit) keys
 * - GCM: Provides both confidentiality and authenticity verification
 * - IV: 12-byte (96-bit) random nonce per encryption
 * - Auth Tag: 16-byte (128-bit) authentication tag
 *
 * @example
 * const key = generateEncryptionKey(); // 32-byte Buffer
 * const result = encryptKey('my-secret-key', key);
 * // { encryptedKey: 'base64...', iv: 'base64...', authTag: 'base64...' }
 *
 * const plaintext = decryptKey(result.encryptedKey, result.iv, result.authTag, key);
 * // 'my-secret-key'
 */

const logger = new Logger('EncryptionUtil');

/**
 * AES-256-GCM cipher algorithm
 */
const CIPHER_ALGORITHM = 'aes-256-gcm';

/**
 * IV (Initialization Vector) length in bytes for GCM mode
 * 12 bytes (96 bits) is the recommended size for GCM
 */
const IV_LENGTH = 12;

/**
 * Auth tag length in bytes
 * 16 bytes (128 bits) provides strong authentication
 */
const AUTH_TAG_LENGTH = 16;

/**
 * Key length in bytes for AES-256
 * 32 bytes = 256 bits
 */
const KEY_LENGTH_BYTES = 32;

/**
 * Encryption result containing all components needed for decryption
 */
export interface EncryptionResult {
  /** Encrypted data (base64 encoded) */
  encryptedKey: string;
  /** Initialization vector (base64 encoded) */
  iv: string;
  /** Authentication tag (base64 encoded) */
  authTag: string;
  /** Algorithm used for documentation */
  algorithm: 'aes-256-gcm';
}

/**
 * Generate a random 32-byte encryption key for AES-256
 *
 * @returns Random 32-byte Buffer suitable for AES-256 encryption
 * @throws Error if key generation fails (should never happen with Node.js crypto)
 *
 * @example
 * const key = generateEncryptionKey();
 * console.log(key.length); // 32
 * console.log(Buffer.isBuffer(key)); // true
 */
export function generateEncryptionKey(): Buffer {
  try {
    const key = randomBytes(KEY_LENGTH_BYTES);

    logger.debug(`[ENCRYPTION] Generated AES-256 key: ${key.length} bytes`);

    return key;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[ENCRYPTION] Failed to generate encryption key: ${message}`);
    throw new Error(`Failed to generate encryption key: ${message}`);
  }
}

/**
 * Encrypt a plaintext key using AES-256-GCM
 *
 * Generates a random IV, encrypts the plaintext with the provided key,
 * and returns all components needed for decryption in base64 format.
 *
 * @param plaintext The key/secret to encrypt
 * @param key 32-byte Buffer from generateEncryptionKey() or stored key
 * @returns EncryptionResult with all components for decryption
 * @throws Error if encryption fails or inputs are invalid
 *
 * @example
 * const key = generateEncryptionKey();
 * const result = encryptKey('steam-key-12345', key);
 * // {
 * //   encryptedKey: 'abc123==',
 * //   iv: 'def456==',
 * //   authTag: 'ghi789==',
 * //   algorithm: 'aes-256-gcm'
 * // }
 */
export function encryptKey(plaintext: string, key: Buffer): EncryptionResult {
  try {
    // Validate inputs
    if (plaintext === '' || typeof plaintext !== 'string') {
      throw new Error('Plaintext must be a non-empty string');
    }

    if (!Buffer.isBuffer(key)) {
      throw new Error('Key must be a Buffer');
    }

    if (key.length !== KEY_LENGTH_BYTES) {
      throw new Error(`Key must be ${KEY_LENGTH_BYTES} bytes, got ${key.length}`);
    }

    // Generate random IV (12 bytes for GCM)
    const iv = randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = createCipheriv(CIPHER_ALGORITHM, key, iv);

    // Encrypt plaintext - convert to binary, then to base64
    let encryptedKey: string = cipher.update(plaintext, 'utf8', 'binary');
    encryptedKey += cipher.final('binary');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    logger.debug(
      `[ENCRYPTION] Successfully encrypted key: ${plaintext.length} chars → ${encryptedKey.length} bytes encrypted`,
    );

    // Return all components as base64
    return {
      encryptedKey: Buffer.from(encryptedKey, 'binary').toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: 'aes-256-gcm',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[ENCRYPTION] Failed to encrypt key: ${message}`);
    throw new Error(`Failed to encrypt key: ${message}`);
  }
}

/**
 * Decrypt an encrypted key using AES-256-GCM
 *
 * Verifies the authentication tag to ensure the ciphertext hasn't been tampered with.
 * If the auth tag verification fails, throws an error.
 *
 * @param encryptedKey Base64-encoded encrypted data
 * @param iv Base64-encoded initialization vector
 * @param authTag Base64-encoded authentication tag
 * @param key 32-byte Buffer (same key used for encryption)
 * @returns Decrypted plaintext
 * @throws Error if decryption fails or auth tag verification fails (tampering detected)
 *
 * @example
 * const key = generateEncryptionKey();
 * const encrypted = encryptKey('steam-key-12345', key);
 * const plaintext = decryptKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag, key);
 * console.log(plaintext); // 'steam-key-12345'
 */
export function decryptKey(encryptedKey: string, iv: string, authTag: string, key: Buffer): string {
  try {
    // Validate inputs
    if (encryptedKey === '' || typeof encryptedKey !== 'string') {
      throw new Error('Encrypted key must be a non-empty base64 string');
    }

    if (iv === '' || typeof iv !== 'string') {
      throw new Error('IV must be a non-empty base64 string');
    }

    if (authTag === '' || typeof authTag !== 'string') {
      throw new Error('Auth tag must be a non-empty base64 string');
    }

    if (!Buffer.isBuffer(key)) {
      throw new Error('Key must be a Buffer');
    }

    if (key.length !== KEY_LENGTH_BYTES) {
      throw new Error(`Key must be ${KEY_LENGTH_BYTES} bytes, got ${key.length}`);
    }

    // Decode base64 inputs
    const decodedEncryptedKey = Buffer.from(encryptedKey, 'base64');
    const decodedIv = Buffer.from(iv, 'base64');
    const decodedAuthTag = Buffer.from(authTag, 'base64');

    // Validate IV length
    if (decodedIv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes, got ${decodedIv.length}`);
    }

    // Validate auth tag length
    if (decodedAuthTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(
        `Invalid auth tag length: expected ${AUTH_TAG_LENGTH} bytes, got ${decodedAuthTag.length}`,
      );
    }

    // Create decipher
    const decipher = createDecipheriv(CIPHER_ALGORITHM, key, decodedIv);

    // Set authentication tag (verifies integrity)
    decipher.setAuthTag(decodedAuthTag);

    // Decrypt
    let plaintext: string = decipher.update(decodedEncryptedKey, undefined, 'utf8');
    plaintext += decipher.final('utf8');

    logger.debug(
      `[ENCRYPTION] Successfully decrypted key: ${decodedEncryptedKey.length} bytes → ${plaintext.length} chars`,
    );

    return plaintext;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[ENCRYPTION] Failed to decrypt key: ${message}`);
    throw new Error(`Failed to decrypt key: ${message}`);
  }
}

/**
 * Validate an encryption result structure
 *
 * Checks that all required fields are present and valid.
 *
 * @param result Encryption result to validate
 * @returns true if valid, false otherwise
 */
export function isValidEncryptionResult(result: unknown): result is EncryptionResult {
  if (typeof result !== 'object' || result === null) {
    return false;
  }

  const obj = result as Record<string, unknown>;

  return (
    typeof obj.encryptedKey === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.authTag === 'string' &&
    obj.algorithm === 'aes-256-gcm'
  );
}
