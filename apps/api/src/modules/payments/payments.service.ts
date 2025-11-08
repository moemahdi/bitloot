import { Injectable } from '@nestjs/common';

export interface FakePaymentResponse {
  externalId: string;
  paymentUrl: string;
}

@Injectable()
export class PaymentsService {
  createFakePayment(orderId: string): FakePaymentResponse {
    const externalId = `fake_${orderId}`;
    // A pretend checkout page the web app can navigate to (front-end route)
    const paymentUrl = `/pay/${orderId}?ext=${externalId}`;
    return { externalId, paymentUrl };
  }
}
