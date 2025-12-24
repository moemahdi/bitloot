import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentProcessorService } from './payment-processor.service';
import type { NowPaymentsClient } from '../modules/payments/nowpayments.client';
import type { Repository } from 'typeorm';
import type { Payment } from '../modules/payments/payment.entity';
import type { Order } from '../modules/orders/order.entity';

describe('PaymentProcessorService', () => {
  let service: PaymentProcessorService;
  let npClientMock: Partial<NowPaymentsClient>;
  let paymentsRepoMock: Partial<Repository<Payment>>;
  let ordersRepoMock: Partial<Repository<Order>>;

  beforeEach(() => {
    npClientMock = {
      createInvoice: vi.fn(),
    };

    paymentsRepoMock = {
      findOne: vi.fn(),
      save: vi.fn(),
    };

    ordersRepoMock = {
      findOne: vi.fn(),
    };

    service = new PaymentProcessorService(
      npClientMock as NowPaymentsClient,
      paymentsRepoMock as Repository<Payment>,
      ordersRepoMock as Repository<Order>,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
