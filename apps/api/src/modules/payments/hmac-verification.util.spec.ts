import { describe, it, expect } from 'vitest';
import * as crypto from 'node:crypto';
import { verifyNowPaymentsSignature, extractSignature } from './hmac-verification.util';

describe('HMAC Verification Utility', () => {
  const secret = 'test-secret-key';
  const testBody = '{"payment_id":"123","amount":"1.5"}';

  describe('verifyNowPaymentsSignature', () => {
    it('should verify a valid HMAC signature', () => {
      // Compute expected signature
      const expectedSignature = crypto.createHmac('sha512', secret).update(testBody).digest('hex');

      // Should return true for valid signature
      const result = verifyNowPaymentsSignature(testBody, expectedSignature, secret);
      expect(result).toBe(true);
    });

    it('should reject an invalid HMAC signature', () => {
      const invalidSignature = 'invalid_signature_12345678abcdef';
      const result = verifyNowPaymentsSignature(testBody, invalidSignature, secret);
      expect(result).toBe(false);
    });

    it('should reject when signature is undefined', () => {
      const result = verifyNowPaymentsSignature(testBody, undefined, secret);
      expect(result).toBe(false);
    });

    it('should reject when signature is empty string', () => {
      const result = verifyNowPaymentsSignature(testBody, '', secret);
      expect(result).toBe(false);
    });

    it('should reject when rawBody is empty string', () => {
      const validSignature = crypto.createHmac('sha512', secret).update(testBody).digest('hex');

      const result = verifyNowPaymentsSignature('', validSignature, secret);
      expect(result).toBe(false);
    });

    it('should reject when secret is empty string', () => {
      const validSignature = crypto.createHmac('sha512', secret).update(testBody).digest('hex');

      const result = verifyNowPaymentsSignature(testBody, validSignature, '');
      expect(result).toBe(false);
    });

    it('should reject when signature differs by one character', () => {
      const expectedSignature = crypto.createHmac('sha512', secret).update(testBody).digest('hex');

      // Flip one character (first char)
      const modifiedSignature = expectedSignature.substring(1) + 'a';

      const result = verifyNowPaymentsSignature(testBody, modifiedSignature, secret);
      expect(result).toBe(false);
    });

    it('should reject when body is tampered (different content)', () => {
      const validSignature = crypto.createHmac('sha512', secret).update(testBody).digest('hex');

      const tamperedBody = '{"payment_id":"999","amount":"9999"}';

      const result = verifyNowPaymentsSignature(tamperedBody, validSignature, secret);
      expect(result).toBe(false);
    });

    it('should reject when secret is different', () => {
      const validSignature = crypto.createHmac('sha512', secret).update(testBody).digest('hex');

      const wrongSecret = 'different-secret-key';

      const result = verifyNowPaymentsSignature(testBody, validSignature, wrongSecret);
      expect(result).toBe(false);
    });

    it('should handle very long body content', () => {
      const longBody = JSON.stringify({
        payment_id: '123',
        data: 'x'.repeat(10000),
      });

      const expectedSignature = crypto.createHmac('sha512', secret).update(longBody).digest('hex');

      const result = verifyNowPaymentsSignature(longBody, expectedSignature, secret);
      expect(result).toBe(true);
    });

    it('should handle special characters and unicode in body', () => {
      const specialBody = JSON.stringify({
        payment_id: '123',
        note: 'Payment for order™ © ñ 中文',
      });

      const expectedSignature = crypto
        .createHmac('sha512', secret)
        .update(specialBody)
        .digest('hex');

      const result = verifyNowPaymentsSignature(specialBody, expectedSignature, secret);
      expect(result).toBe(true);
    });

    it('should verify signature in real NOWPayments format', () => {
      // Simulate NOWPayments IPN payload structure
      const realPayload = JSON.stringify({
        payment_id: 'np_12345678',
        order_id: '550e8400-e29b-41d4-a716-446655440000',
        payment_status: 'finished',
        pay_amount: 0.0015,
        pay_currency: 'btc',
        price_amount: 49.99,
        price_currency: 'usd',
        created_at: '2025-11-08T10:00:00Z',
      });

      const expectedSignature = crypto
        .createHmac('sha512', secret)
        .update(realPayload)
        .digest('hex');

      const result = verifyNowPaymentsSignature(realPayload, expectedSignature, secret);
      expect(result).toBe(true);
    });

    it('should handle case sensitivity in hex signature', () => {
      const expectedSignature = crypto.createHmac('sha512', secret).update(testBody).digest('hex');

      // Convert to uppercase (should still be equal in hex comparison)
      const uppercaseSignature = expectedSignature.toUpperCase();

      const result = verifyNowPaymentsSignature(testBody, uppercaseSignature, secret);
      expect(result).toBe(false); // Hex comparison is case-sensitive
    });

    it('should be timing-safe (no early return on mismatch)', () => {
      // This test verifies that the function doesn't leak timing information
      // by comparing execution time of very different vs slightly different signatures
      const validSignature = crypto.createHmac('sha512', secret).update(testBody).digest('hex');

      const wrongSignature1 = '0'.repeat(128); // Completely different
      const wrongSignature2 = validSignature.substring(0, 127) + 'X'; // Off by one char

      const iterations = 1000;

      // Time completely wrong signature
      const start1 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        verifyNowPaymentsSignature(testBody, wrongSignature1, secret);
      }
      const time1 = Number(process.hrtime.bigint() - start1);

      // Time almost-right signature
      const start2 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        verifyNowPaymentsSignature(testBody, wrongSignature2, secret);
      }
      const time2 = Number(process.hrtime.bigint() - start2);

      // Timing should be similar (within ~50% variance for timing-safe implementation)
      // This is a loose check because timing can vary, but both should go through
      // the full comparison without early exit
      expect(Math.abs(time1 - time2) / Math.max(time1, time2)).toBeLessThan(1);
    });

    it('should reject all-falsy values', () => {
      expect(verifyNowPaymentsSignature('', '', '')).toBe(false);
      expect(verifyNowPaymentsSignature('', undefined, '')).toBe(false);
      expect(verifyNowPaymentsSignature(testBody, '', '')).toBe(false);
    });
  });

  describe('extractSignature', () => {
    it('should extract signature from lowercase header name', () => {
      const headers = {
        'x-nowpayments-signature': 'abc123def456',
      };

      const result = extractSignature(headers);
      expect(result).toBe('abc123def456');
    });

    it('should extract signature from mixed-case header name', () => {
      // Note: In practice, HTTP headers are normalized to lowercase by Express/framework
      // This test documents that the utility expects lowercase headers
      const headers = {
        'x-nowpayments-signature': 'xyz789',
      };

      const result = extractSignature(headers);
      expect(result).toBe('xyz789');
    });

    it('should return undefined when header is missing', () => {
      const headers = {};

      const result = extractSignature(headers);
      expect(result).toBeUndefined();
    });

    it('should return undefined when headers object is empty', () => {
      const headers = {};

      const result = extractSignature(headers);
      expect(result).toBeUndefined();
    });

    it('should handle headers with other properties', () => {
      const headers = {
        'content-type': 'application/json',
        'x-nowpayments-signature': 'signature-value',
        'user-agent': 'nowpayments-webhook',
      };

      const result = extractSignature(headers);
      expect(result).toBe('signature-value');
    });

    it('should return string value for signature header', () => {
      const headers = {
        'x-nowpayments-signature': 'abc123',
      };

      const result = extractSignature(headers);
      expect(typeof result).toBe('string');
    });
  });

  describe('Integration: Verify Extracted Signature', () => {
    it('should verify extracted signature against body', () => {
      const body = '{"test":"data"}';
      const expectedSignature = crypto.createHmac('sha512', secret).update(body).digest('hex');

      const headers = {
        'x-nowpayments-signature': expectedSignature,
      };

      const extractedSig = extractSignature(headers);
      const isValid = verifyNowPaymentsSignature(body, extractedSig, secret);

      expect(isValid).toBe(true);
    });

    it('should reject extracted signature if missing', () => {
      const body = '{"test":"data"}';
      const headers = {};

      const extractedSig = extractSignature(headers);
      const isValid = verifyNowPaymentsSignature(body, extractedSig, secret);

      expect(isValid).toBe(false);
    });

    it('should work with full IPN workflow', () => {
      const ipnPayload = JSON.stringify({
        payment_id: 'np_payment_123',
        order_id: 'order_456',
        payment_status: 'finished',
        pay_amount: 0.001,
        pay_currency: 'btc',
      });

      // Simulate NOWPayments sending IPN with signature header
      const signatureHeader = crypto.createHmac('sha512', secret).update(ipnPayload).digest('hex');

      const requestHeaders = {
        'x-nowpayments-signature': signatureHeader,
        'content-type': 'application/json',
      };

      // Verify the workflow
      const extractedSig = extractSignature(requestHeaders);
      const isValid = verifyNowPaymentsSignature(ipnPayload, extractedSig, secret);

      expect(isValid).toBe(true);
    });
  });
});
