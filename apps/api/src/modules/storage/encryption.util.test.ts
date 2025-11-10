import { describe, it, expect, beforeEach } from 'vitest';
import type { EncryptionResult } from './encryption.util';
import {
  generateEncryptionKey,
  encryptKey,
  decryptKey,
  isValidEncryptionResult,
} from './encryption.util';

describe('EncryptionUtil', () => {
  let key: Buffer;

  beforeEach(() => {
    // Generate a fresh key for each test
    key = generateEncryptionKey();
  });

  // ============================================================================
  // generateEncryptionKey() Tests
  // ============================================================================

  describe('generateEncryptionKey', () => {
    it('should generate a 32-byte buffer', () => {
      const generatedKey = generateEncryptionKey();
      expect(Buffer.isBuffer(generatedKey)).toBe(true);
      expect(generatedKey.length).toBe(32);
    });

    it('should generate different keys on each call', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toEqual(key2);
    });

    it('should be suitable for AES-256 encryption', () => {
      const generatedKey = generateEncryptionKey();
      // Should not throw when used with encryptKey
      const testSecret = 'test-key';
      expect(() => encryptKey(testSecret, generatedKey)).not.toThrow();
    });

    it('should generate keys with sufficient entropy', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      const key3 = generateEncryptionKey();

      // All should be different (extremely unlikely to collide)
      expect(key1.toString('hex')).not.toBe(key2.toString('hex'));
      expect(key2.toString('hex')).not.toBe(key3.toString('hex'));
      expect(key1.toString('hex')).not.toBe(key3.toString('hex'));
    });
  });

  // ============================================================================
  // encryptKey() Tests
  // ============================================================================

  describe('encryptKey', () => {
    it('should encrypt plaintext and return EncryptionResult', () => {
      const plaintext = 'my-secret-key-12345';
      const result = encryptKey(plaintext, key);

      expect(typeof result.encryptedKey).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(typeof result.authTag).toBe('string');
      expect(result.algorithm).toBe('aes-256-gcm');
    });

    it('should return base64-encoded values', () => {
      const plaintext = 'test-key';
      const result = encryptKey(plaintext, key);

      // Base64 regex: alphanumeric + / + = for padding
      const base64Regex = /^[A-Za-z0-9+/=]*$/;
      expect(base64Regex.test(result.encryptedKey)).toBe(true);
      expect(base64Regex.test(result.iv)).toBe(true);
      expect(base64Regex.test(result.authTag)).toBe(true);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'same-secret';
      const result1 = encryptKey(plaintext, key);
      const result2 = encryptKey(plaintext, key);

      // Different IVs should produce different ciphertexts
      expect(result1.encryptedKey).not.toBe(result2.encryptedKey);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should handle short keys', () => {
      const plaintext = 'a';
      const result = encryptKey(plaintext, key);
      expect(isValidEncryptionResult(result)).toBe(true);
    });

    it('should handle long keys', () => {
      const plaintext = 'a'.repeat(10000);
      const result = encryptKey(plaintext, key);
      expect(isValidEncryptionResult(result)).toBe(true);
    });

    it('should handle keys with special characters', () => {
      const plaintext = 'key-with-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = encryptKey(plaintext, key);
      expect(isValidEncryptionResult(result)).toBe(true);
    });

    it('should handle keys with unicode characters', () => {
      const plaintext = 'emoji-key-🔑-中文-العربية';
      const result = encryptKey(plaintext, key);
      expect(isValidEncryptionResult(result)).toBe(true);
    });

    it('should throw error for empty plaintext', () => {
      expect(() => encryptKey('', key)).toThrow('Plaintext must be a non-empty string');
    });

    it('should throw error for null plaintext', () => {
      expect(() => encryptKey(null as unknown as string, key)).toThrow(
        'Plaintext must be a non-empty string',
      );
    });

    it('should throw error for undefined plaintext', () => {
      expect(() => encryptKey(undefined as unknown as string, key)).toThrow(
        'Plaintext must be a non-empty string',
      );
    });

    it('should throw error for non-string plaintext', () => {
      expect(() => encryptKey(12345 as unknown as string, key)).toThrow(
        'Plaintext must be a non-empty string',
      );
    });

    it('should throw error for non-Buffer key', () => {
      expect(() => encryptKey('plaintext', 'not-a-buffer' as unknown as Buffer)).toThrow(
        'Key must be a Buffer',
      );
    });

    it('should throw error for wrong-sized key (too small)', () => {
      const wrongKey = Buffer.alloc(16);
      expect(() => encryptKey('plaintext', wrongKey)).toThrow('Key must be 32 bytes, got 16');
    });

    it('should throw error for wrong-sized key (too large)', () => {
      const wrongKey = Buffer.alloc(64);
      expect(() => encryptKey('plaintext', wrongKey)).toThrow('Key must be 32 bytes, got 64');
    });

    it('should throw error for null key', () => {
      expect(() => encryptKey('plaintext', null as unknown as Buffer)).toThrow(
        'Key must be a Buffer',
      );
    });

    it('should produce IV with length 12 bytes (base64 ~16 chars)', () => {
      const result = encryptKey('test', key);
      const decodedIv = Buffer.from(result.iv, 'base64');
      expect(decodedIv.length).toBe(12);
    });

    it('should produce authTag with length 16 bytes (base64 ~24 chars)', () => {
      const result = encryptKey('test', key);
      const decodedTag = Buffer.from(result.authTag, 'base64');
      expect(decodedTag.length).toBe(16);
    });
  });

  // ============================================================================
  // decryptKey() Tests
  // ============================================================================

  describe('decryptKey', () => {
    it('should decrypt to original plaintext', () => {
      const plaintext = 'my-secret-steam-key';
      const encrypted = encryptKey(plaintext, key);
      const decrypted = decryptKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt long keys', () => {
      const plaintext = 'x'.repeat(5000);
      const encrypted = encryptKey(plaintext, key);
      const decrypted = decryptKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt keys with special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptKey(plaintext, key);
      const decrypted = decryptKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt keys with unicode characters', () => {
      const plaintext = 'unicode-🔑-中文-العربية-Ελληνικά';
      const encrypted = encryptKey(plaintext, key);
      const decrypted = decryptKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error when decrypting with wrong key', () => {
      const plaintext = 'secret-key';
      const encrypted = encryptKey(plaintext, key);

      const wrongKey = generateEncryptionKey();
      expect(() =>
        decryptKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag, wrongKey),
      ).toThrow();
    });

    it('should throw error when auth tag is tampered with', () => {
      const plaintext = 'secret-key';
      const encrypted = encryptKey(plaintext, key);

      // Flip a bit in the auth tag (simulate tampering)
      const tamperedTag = Buffer.from(encrypted.authTag, 'base64');
      if (tamperedTag[0] !== undefined) {
        tamperedTag[0] ^= 0xff; // Flip all bits in first byte
      }
      const tamperedTagB64 = tamperedTag.toString('base64');

      expect(() => decryptKey(encrypted.encryptedKey, encrypted.iv, tamperedTagB64, key)).toThrow();
    });

    it('should throw error when ciphertext is tampered with', () => {
      const plaintext = 'secret-key';
      const encrypted = encryptKey(plaintext, key);

      // Flip a bit in the ciphertext (simulate tampering)
      const tamperedCiphertext = Buffer.from(encrypted.encryptedKey, 'base64');
      if (tamperedCiphertext[0] !== undefined) {
        tamperedCiphertext[0] ^= 0xff; // Flip all bits in first byte
      }
      const tamperedCiphertextB64 = tamperedCiphertext.toString('base64');

      expect(() =>
        decryptKey(tamperedCiphertextB64, encrypted.iv, encrypted.authTag, key),
      ).toThrow();
    });

    it('should throw error when IV is tampered with', () => {
      const plaintext = 'secret-key';
      const encrypted = encryptKey(plaintext, key);

      // Flip a bit in the IV (simulate tampering)
      const tamperedIv = Buffer.from(encrypted.iv, 'base64');
      if (tamperedIv[0] !== undefined) {
        tamperedIv[0] ^= 0xff; // Flip all bits in first byte
      }
      const tamperedIvB64 = tamperedIv.toString('base64');

      expect(() =>
        decryptKey(encrypted.encryptedKey, tamperedIvB64, encrypted.authTag, key),
      ).toThrow();
    });

    it('should throw error for empty encryptedKey', () => {
      expect(() => decryptKey('', 'aaa', 'aaa', key)).toThrow(
        'Encrypted key must be a non-empty base64 string',
      );
    });

    it('should throw error for empty IV', () => {
      expect(() => decryptKey('aaa', '', 'aaa', key)).toThrow(
        'IV must be a non-empty base64 string',
      );
    });

    it('should throw error for empty authTag', () => {
      expect(() => decryptKey('aaa', 'aaa', '', key)).toThrow(
        'Auth tag must be a non-empty base64 string',
      );
    });

    it('should throw error for null encryptedKey', () => {
      expect(() => decryptKey(null as unknown as string, 'aaa', 'aaa', key)).toThrow(
        'Encrypted key must be a non-empty base64 string',
      );
    });

    it('should throw error for non-Buffer key', () => {
      const encrypted = encryptKey('test', key);
      expect(() =>
        decryptKey(
          encrypted.encryptedKey,
          encrypted.iv,
          encrypted.authTag,
          'not-buffer' as unknown as Buffer,
        ),
      ).toThrow('Key must be a Buffer');
    });

    it('should throw error for wrong-sized key', () => {
      const encrypted = encryptKey('test', key);
      const wrongKey = Buffer.alloc(16);
      expect(() =>
        decryptKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag, wrongKey),
      ).toThrow('Key must be 32 bytes, got 16');
    });

    it('should throw error for invalid IV length', () => {
      const encrypted = encryptKey('test', key);
      // Create invalid IV (wrong size)
      const invalidIv = Buffer.alloc(8).toString('base64'); // Should be 12 bytes
      expect(() => decryptKey(encrypted.encryptedKey, invalidIv, encrypted.authTag, key)).toThrow(
        'Invalid IV length',
      );
    });

    it('should throw error for invalid auth tag length', () => {
      const encrypted = encryptKey('test', key);
      // Create invalid auth tag (wrong size)
      const invalidTag = Buffer.alloc(8).toString('base64'); // Should be 16 bytes
      expect(() => decryptKey(encrypted.encryptedKey, encrypted.iv, invalidTag, key)).toThrow(
        'Invalid auth tag length',
      );
    });

    it('should throw error for invalid base64 encryptedKey', () => {
      expect(() =>
        decryptKey(
          '!!!invalid-base64!!!',
          Buffer.alloc(12).toString('base64'),
          Buffer.alloc(16).toString('base64'),
          key,
        ),
      ).toThrow();
    });
  });

  // ============================================================================
  // Round-trip Tests
  // ============================================================================

  describe('Round-trip encryption/decryption', () => {
    it('should maintain plaintext integrity through encrypt-decrypt cycle', () => {
      const testKeys = [
        'simple-key',
        'key-with-special-!@#$%^&*()',
        'unicode-🔑',
        'a'.repeat(100),
        'line1\nline2\nline3',
        'tab\tseparated\tvalues',
      ];

      testKeys.forEach((plaintext) => {
        const encrypted = encryptKey(plaintext, key);
        const decrypted = decryptKey(encrypted.encryptedKey, encrypted.iv, encrypted.authTag, key);
        expect(decrypted).toBe(plaintext);
      });
    });

    it('should support multiple independent encryption operations', () => {
      const keys = [generateEncryptionKey(), generateEncryptionKey(), generateEncryptionKey()];
      const plaintexts = ['key1', 'key2', 'key3'];

      const encrypted = plaintexts.map((pt, i) => {
        const k = keys[i];
        if (k === null || k === undefined) throw new Error('Key is undefined');
        return encryptKey(pt, k);
      });

      const decrypted = encrypted.map((enc, i) => {
        const k = keys[i];
        if (k === null || k === undefined) throw new Error('Key is undefined');
        return decryptKey(enc.encryptedKey, enc.iv, enc.authTag, k);
      });

      decrypted.forEach((dec, i) => {
        expect(dec).toBe(plaintexts[i]);
      });
    });
  });

  // ============================================================================
  // EncryptionResult Validation Tests
  // ============================================================================

  describe('isValidEncryptionResult', () => {
    it('should return true for valid EncryptionResult', () => {
      const encrypted = encryptKey('test', key);
      expect(isValidEncryptionResult(encrypted)).toBe(true);
    });

    it('should return false for missing encryptedKey', () => {
      const invalid = {
        iv: 'test',
        authTag: 'test',
        algorithm: 'aes-256-gcm',
      };
      expect(isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should return false for missing iv', () => {
      const invalid = {
        encryptedKey: 'test',
        authTag: 'test',
        algorithm: 'aes-256-gcm',
      };
      expect(isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should return false for missing authTag', () => {
      const invalid = {
        encryptedKey: 'test',
        iv: 'test',
        algorithm: 'aes-256-gcm',
      };
      expect(isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should return false for wrong algorithm', () => {
      const invalid = {
        encryptedKey: 'test',
        iv: 'test',
        authTag: 'test',
        algorithm: 'aes-128-cbc',
      };
      expect(isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidEncryptionResult(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidEncryptionResult(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isValidEncryptionResult('string')).toBe(false);
      expect(isValidEncryptionResult(123)).toBe(false);
      expect(isValidEncryptionResult([])).toBe(false);
    });

    it('should return false for wrong field types', () => {
      const invalid = {
        encryptedKey: 123, // Should be string
        iv: 'test',
        authTag: 'test',
        algorithm: 'aes-256-gcm',
      };
      expect(isValidEncryptionResult(invalid)).toBe(false);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration scenarios', () => {
    it('should support real-world usage pattern: generate key, encrypt multiple secrets', () => {
      const secrets = ['steam-key-abc123', 'origin-key-def456', 'gog-key-ghi789'];
      const encryptionKey = generateEncryptionKey();

      const encrypted = secrets.map((secret) => encryptKey(secret, encryptionKey));

      encrypted.forEach((enc, i) => {
        const decrypted = decryptKey(enc.encryptedKey, enc.iv, enc.authTag, encryptionKey);
        expect(decrypted).toBe(secrets[i]);
      });
    });

    it('should maintain separate state between different keys', () => {
      const secret = 'same-secret';
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      const enc1 = encryptKey(secret, key1);
      const enc2 = encryptKey(secret, key2);

      // Can decrypt with matching key
      expect(decryptKey(enc1.encryptedKey, enc1.iv, enc1.authTag, key1)).toBe(secret);
      expect(decryptKey(enc2.encryptedKey, enc2.iv, enc2.authTag, key2)).toBe(secret);

      // Cannot decrypt with mismatched key
      expect(() => decryptKey(enc1.encryptedKey, enc1.iv, enc1.authTag, key2)).toThrow();
      expect(() => decryptKey(enc2.encryptedKey, enc2.iv, enc2.authTag, key1)).toThrow();
    });

    it('should produce properly formatted output for storage', () => {
      const encrypted = encryptKey('store-this-key', key);

      // All components should be base64 strings (storable in database)
      const isBase64 = (str: string) => /^[A-Za-z0-9+/]*={0,2}$/.test(str);

      expect(isBase64(encrypted.encryptedKey)).toBe(true);
      expect(isBase64(encrypted.iv)).toBe(true);
      expect(isBase64(encrypted.authTag)).toBe(true);

      // Should be able to store and retrieve
      const stored = JSON.stringify(encrypted);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const retrieved: EncryptionResult = JSON.parse(stored);

      const decrypted = decryptKey(retrieved.encryptedKey, retrieved.iv, retrieved.authTag, key);
      expect(decrypted).toBe('store-this-key');
    });
  });
});
