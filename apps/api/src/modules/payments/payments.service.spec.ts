import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InternalServerErrorException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let npClientMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paymentsRepoMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let webhookLogsRepoMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ordersServiceMock: any;

  beforeEach(() => {
    npClientMock = {
      createInvoice: vi.fn(),
      getPaymentStatus: vi.fn(),
    };

    paymentsRepoMock = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
    };

    webhookLogsRepoMock = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
    };

    ordersServiceMock = {
      markWaiting: vi.fn(),
      markConfirming: vi.fn(),
      markPaid: vi.fn(),
      markUnderpaid: vi.fn(),
      markFailed: vi.fn(),
      markFulfilled: vi.fn(),
    };

    // Mock the fulfillment queue
    const fulfillmentQueueMock = {
      add: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    service = new (PaymentsService as any)(
      npClientMock,
      paymentsRepoMock,
      webhookLogsRepoMock,
      ordersServiceMock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fulfillmentQueueMock as any,
    );
  });

  describe('create() - Create Payment Invoice', () => {
    it('should create invoice with NOWPayments', async () => {
      const createPaymentDto = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'customer@example.com',
        priceAmount: '49.99',
        priceCurrency: 'usd',
        payCurrency: 'btc',
      };

      const npInvoice = {
        id: 123456,
        invoice_url: 'https://nowpayments.io/invoice/123456',
        status_url: 'https://nowpayments.io/status/123456',
        pay_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        price_amount: 49.99,
        price_currency: 'usd',
        pay_currency: 'btc',
        order_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'waiting',
        created_at: '2025-11-08T10:00:00Z',
        updated_at: '2025-11-08T10:00:00Z',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      npClientMock.createInvoice.mockResolvedValue(npInvoice);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      paymentsRepoMock.create.mockReturnValue({ id: 'uuid', externalId: '123456' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      paymentsRepoMock.save.mockResolvedValue({ id: 'uuid', externalId: '123456' });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const result = await service.create(createPaymentDto);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.invoiceId).toBe(123456);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.invoiceUrl).toBe('https://nowpayments.io/invoice/123456');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.priceAmount).toBe(49.99);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.payCurrency).toBe('btc');
    });

    it('should throw if NOWPayments API fails', async () => {
      const createPaymentDto = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'customer@example.com',
        priceAmount: '49.99',
        priceCurrency: 'usd',
      };

      const apiError = new Error('API error');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      npClientMock.createInvoice.mockRejectedValue(apiError);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await expect(service.create(createPaymentDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('handleIpn() - Process Webhooks', () => {
    it('should be idempotent: duplicate IPN returns success', async () => {
      const ipnDto = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        externalId: '123456',
        status: 'finished',
      };

      const existingLog = { id: 'webhook-uuid', externalId: '123456', status: 'processed' };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      webhookLogsRepoMock.findOne.mockResolvedValue(existingLog);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const result = await service.handleIpn(ipnDto);

      expect(result).toEqual({ ok: true });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(ordersServiceMock.markWaiting).not.toHaveBeenCalled();
    });

    it('should process status transitions', async () => {
      const ipnDto = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        externalId: '123456',
        status: 'finished',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      webhookLogsRepoMock.findOne.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      paymentsRepoMock.findOne.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      webhookLogsRepoMock.create.mockReturnValue({});
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      webhookLogsRepoMock.save.mockResolvedValue({});

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const result = await service.handleIpn(ipnDto);

      expect(result).toEqual({ ok: true });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(ordersServiceMock.markPaid).toHaveBeenCalledWith(ipnDto.orderId);
    });
  });
});
