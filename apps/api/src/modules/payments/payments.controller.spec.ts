import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import * as crypto from 'crypto';

describe('PaymentsController - IPN Integration', () => {
  let controller: PaymentsController;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paymentsServiceMock: any;
  const ipnSecret = 'test-secret-key';

  beforeEach(() => {
    // Set IPN secret for testing
    process.env.NOWPAYMENTS_IPN_SECRET = ipnSecret;

    paymentsServiceMock = {
      create: vi.fn(),
      handleIpn: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    controller = new PaymentsController(paymentsServiceMock);
  });

  describe('create() - Create Payment Invoice', () => {
    it('should call PaymentsService.create()', async () => {
      const createPaymentDto = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'customer@example.com',
        priceAmount: '49.99',
        priceCurrency: 'usd',
      };

      const expectedResponse = {
        invoiceId: 123456,
        invoiceUrl: 'https://nowpayments.io/invoice/123456',
        statusUrl: 'https://nowpayments.io/status/123456',
        payAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        priceAmount: 49.99,
        payAmount: 0.001234,
        payCurrency: 'btc',
        status: 'waiting',
        expirationDate: '2025-11-09T10:00:00Z',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      paymentsServiceMock.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createPaymentDto);

      expect(result).toEqual(expectedResponse);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(paymentsServiceMock.create).toHaveBeenCalledWith(createPaymentDto);
    });
  });

  describe('ipn() - IPN Webhook', () => {
    /**
     * Helper to create valid IPN request with proper HMAC signature
     */
    function createValidIpnRequest(
      orderId: string = '550e8400-e29b-41d4-a716-446655440000',
      externalId: string = '123456',
      status: string = 'finished',
    ) {
      const body = { orderId, externalId, status };
      const rawBody = JSON.stringify(body);
      const signature = crypto.createHmac('sha512', ipnSecret).update(rawBody).digest('hex');

      return { body, rawBody, signature };
    }

    it('should process valid IPN with correct HMAC', async () => {
      const { body, rawBody, signature } = createValidIpnRequest();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
      const mockRequest = { rawBody } as unknown as Record<string, unknown> as any;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      paymentsServiceMock.handleIpn.mockResolvedValue({ ok: true });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.ipn(body, signature, mockRequest);

      expect(result).toEqual({ ok: true });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(paymentsServiceMock.handleIpn).toHaveBeenCalledWith(body);
    });

    it('should reject IPN with invalid HMAC', async () => {
      const { body, rawBody } = createValidIpnRequest();
      const invalidSignature = 'invalid_signature_' + '0'.repeat(120);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
      const mockRequest = { rawBody } as unknown as Record<string, unknown> as any;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(controller.ipn(body, invalidSignature, mockRequest)).rejects.toThrow(
        new HttpException('Invalid HMAC signature', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should reject IPN with missing signature', async () => {
      const { body, rawBody } = createValidIpnRequest();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
      const mockRequest = { rawBody } as unknown as Record<string, unknown> as any;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(controller.ipn(body, undefined, mockRequest)).rejects.toThrow(
        new HttpException('Missing x-nowpayments-signature header', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should reject IPN with empty signature', async () => {
      const { body, rawBody } = createValidIpnRequest();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
      const mockRequest = { rawBody } as unknown as Record<string, unknown> as any;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(controller.ipn(body, '', mockRequest)).rejects.toThrow(
        new HttpException('Missing x-nowpayments-signature header', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should reject IPN with missing raw body', async () => {
      const { body, signature } = createValidIpnRequest();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
      const mockRequest = {} as unknown as any;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(controller.ipn(body, signature, mockRequest)).rejects.toThrow(
        new HttpException('Invalid request body', HttpStatus.BAD_REQUEST),
      );
    });

    it('should be idempotent: duplicate IPN returns same result', async () => {
      const { body, rawBody, signature } = createValidIpnRequest(
        '550e8400-...',
        '123456',
        'finished',
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
      const mockRequest = { rawBody } as unknown as Record<string, unknown> as any;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      paymentsServiceMock.handleIpn.mockResolvedValue({ ok: true });

      // First IPN
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result1 = await controller.ipn(body, signature, mockRequest);
      expect(result1).toEqual({ ok: true });

      // Second IPN (duplicate)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result2 = await controller.ipn(body, signature, mockRequest);
      expect(result2).toEqual({ ok: true });

      // handleIpn called twice (idempotency logic is in PaymentsService)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(paymentsServiceMock.handleIpn).toHaveBeenCalledTimes(2);
    });

    it('should handle different payment statuses', async () => {
      const statuses = ['waiting', 'confirming', 'finished', 'underpaid', 'failed'];

      for (const paymentStatus of statuses) {
        const { body, rawBody, signature } = createValidIpnRequest(
          '550e8400-e29b-41d4-a716-446655440000',
          `ext-${paymentStatus}`,
          paymentStatus,
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
        const mockRequest = { rawBody } as unknown as Record<string, unknown> as any;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        paymentsServiceMock.handleIpn.mockResolvedValue({ ok: true });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const result = await controller.ipn(body, signature, mockRequest);

        expect(result).toEqual({ ok: true });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(paymentsServiceMock.handleIpn).toHaveBeenLastCalledWith(
          expect.objectContaining({ status: paymentStatus }),
        );
      }
    });

    it('should propagate PaymentsService errors', async () => {
      const { body, rawBody, signature } = createValidIpnRequest();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
      const mockRequest = { rawBody } as unknown as Record<string, unknown> as any;

      const serviceError = new Error('Order not found');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      paymentsServiceMock.handleIpn.mockRejectedValue(serviceError);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(controller.ipn(body, signature, mockRequest)).rejects.toThrow(
        new HttpException('IPN processing failed: Order not found', HttpStatus.BAD_REQUEST),
      );
    });
  });
});
