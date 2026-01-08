import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';

/**
 * NOWPayments Invoice Response
 *
 * Returned when creating a payment/invoice with NOWPayments API
 */
export interface InvoiceResponse {
  id: number;
  invoice_url: string;
  status_url: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  order_id: string;
  order_description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * NOWPayments Payment Status Response
 *
 * Returned when retrieving payment status or via IPN webhook
 */
export interface PaymentStatusResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description?: string;
  created_at: string;
  updated_at: string;
  expiration_date: string;
  is_fixed_rate: boolean;
  is_fee_paid_by_user: boolean;
  confirmations: number;
  amountUSD: number;
  actuallyPaid?: number;
}

/**
 * NOWPayments API Client
 *
 * Wrapper around NOWPayments REST API for creating payments and invoices.
 * Handles authentication, error handling, and response mapping.
 *
 * API Documentation: https://documenter.getpostman.com/view/7907941/S1a32RSP
 * Sandbox: https://api-sandbox.nowpayments.io/v1
 * Production: https://api.nowpayments.io/v1
 */
@Injectable()
export class NowPaymentsClient {
  private readonly logger = new Logger(NowPaymentsClient.name);
  private readonly axios: AxiosInstance;

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string, // https://api-sandbox.nowpayments.io or https://api.nowpayments.io
  ) {
    this.axios = axios.create({
      baseURL: baseUrl,
      timeout: 10000, // 10 second timeout
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Add response logging
    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `NOWPayments API (${response.status}): ${response.config.method?.toUpperCase()} ${response.config.url}`,
        );
        return response;
      },
      (error: AxiosError) => {
        const status = error.response?.status;
        const statusCode = status !== undefined ? String(status) : 'UNKNOWN';
        const message = error.response?.statusText ?? error.message;
        this.logger.error(
          `NOWPayments API Error (${statusCode}): ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${message}`,
        );
        return Promise.reject(error);
      },
    );
  }

  /**
   * Extract error message from NOWPayments error response
   */
  private extractErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
      if (error instanceof Error) {
        return error.message;
      }
      return 'Unknown error';
    }

    const responseData = error.response?.data as Record<string, unknown> | undefined;
    if (responseData !== undefined && typeof responseData === 'object') {
      const msg = responseData['error_message'] ?? responseData['message'] ?? responseData['error'];
      if (typeof msg === 'string' && msg.length > 0) {
        return msg;
      }
    }

    const errorMessage = error.message;
    if (typeof errorMessage === 'string' && errorMessage.length > 0) {
      return errorMessage;
    }
    return 'Unknown NOWPayments error';
  }

  /**
   * Create a payment invoice with NOWPayments
   *
   * Creates a hosted invoice URL where customers can select crypto and make payment.
   * After payment, NOWPayments will POST to ipn_callback_url with status updates.
   *
   * @param params - Invoice creation parameters
   * @returns Invoice response with payment URL and details
   * @throws Error if API call fails
   *
   * @example
   * ```typescript
   * const invoice = await client.createInvoice({
   *   price_amount: 49.99,
   *   price_currency: 'eur',
   *   order_id: 'order-123',
   *   ipn_callback_url: 'https://example.com/api/payments/ipn',
   * });
   * // Returns: { id, invoice_url, pay_address, ... }
   * ```
   */
  async createInvoice(params: {
    price_amount: number;
    price_currency: string;
    pay_currency?: string | null;
    order_id: string;
    order_description?: string;
    ipn_callback_url: string;
    success_url?: string;
    cancel_url?: string;
  }): Promise<InvoiceResponse> {
    try {
      this.logger.log(
        `Creating NOWPayments invoice: orderId=${params.order_id}, amount=${params.price_amount} ${params.price_currency}`,
      );

      const response = await this.axios.post<InvoiceResponse>('/invoice', {
        price_amount: params.price_amount,
        price_currency: params.price_currency.toLowerCase(),
        pay_currency: params.pay_currency?.toLowerCase() ?? undefined,
        order_id: params.order_id,
        order_description: params.order_description,
        ipn_callback_url: params.ipn_callback_url,
        success_url: params.success_url,
        cancel_url: params.cancel_url,
      });

      this.logger.log(
        `✅ Invoice created: invoiceId=${response.data.id}, paymentId=${response.data.id}, payAddress=${response.data.pay_address}`,
      );

      return response.data;
    } catch (error) {
      const errorMsg = this.extractErrorMessage(error);
      const statusCode = axios.isAxiosError(error) ? error.response?.status : 'UNKNOWN';
      this.logger.error(
        `Failed to create NOWPayments invoice: ${statusCode} - ${errorMsg}`,
        axios.isAxiosError(error) ? error.stack : undefined,
      );

      // Re-throw with context
      throw new Error(`NOWPayments API Error: ${errorMsg} (${statusCode})`);
    }
  }

  /**
   * Retrieve payment status by payment ID
   *
   * Polls the current status of a payment. Can be called to check progress
   * while waiting for webhook confirmations.
   *
   * @param paymentId - NOWPayments payment_id
   * @returns Payment status response
   * @throws Error if API call fails
   */
  async getPaymentStatus(paymentId: number | string): Promise<PaymentStatusResponse> {
    try {
      this.logger.debug(`Fetching payment status: paymentId=${paymentId}`);

      const response = await this.axios.get<PaymentStatusResponse>(`/payment/${paymentId}`);

      return response.data;
    } catch (error) {
      const errorMsg = this.extractErrorMessage(error);
      this.logger.error(
        `Failed to get payment status: ${errorMsg}`,
        axios.isAxiosError(error) ? error.stack : undefined,
      );

      throw new Error(`NOWPayments API Error: ${errorMsg}`);
    }
  }

  /**
   * List all payments (paginated)
   *
   * Retrieves a paginated list of payments created through this API key.
   * Useful for reconciliation and reporting.
   *
   * @param limit - Number of results (default 10, max 100)
   * @param offset - Pagination offset (default 0)
   * @returns Paginated list of payments
   * @throws Error if API call fails
   */
  async listPayments(
    limit = 10,
    offset = 0,
  ): Promise<{ data: PaymentStatusResponse[]; offset: number; limit: number }> {
    try {
      this.logger.debug(`Listing payments: limit=${limit}, offset=${offset}`);

      const response = await this.axios.get<{
        data: PaymentStatusResponse[];
        offset: number;
        limit: number;
      }>('/payment', {
        params: { limit, offset },
      });

      return response.data;
    } catch (error) {
      const errorMsg = this.extractErrorMessage(error);
      this.logger.error(
        `Failed to list payments: ${errorMsg}`,
        axios.isAxiosError(error) ? error.stack : undefined,
      );

      throw new Error(`NOWPayments API Error: ${errorMsg}`);
    }
  }

  /**
   * Get supported currencies
   *
   * Retrieves list of all supported cryptocurrencies and their info.
   * Useful for validating pay_currency on frontend before payment creation.
   *
   * @returns List of supported currencies
   * @throws Error if API call fails
   */
  async getCurrencies(): Promise<Array<{ currency: string; name: string; type: string }>> {
    try {
      this.logger.debug('Fetching supported currencies from NOWPayments');

      const response =
        await this.axios.get<Array<{ currency: string; name: string; type: string }>>(
          '/currencies',
        );

      return response.data;
    } catch (error) {
      const errorMsg = this.extractErrorMessage(error);
      this.logger.error(
        `Failed to get currencies: ${errorMsg}`,
        axios.isAxiosError(error) ? error.stack : undefined,
      );

      throw new Error(`NOWPayments API Error: ${errorMsg}`);
    }
  }

  /**
   * Get estimated exchange rate
   *
   * Gets the estimated rate to convert between two currencies.
   * Useful for showing real-time pricing to customers.
   *
   * @param fromCurrency - Source currency code (e.g., 'eur')
   * @param toCurrency - Target currency code (e.g., 'btc')
   * @param amount - Amount in source currency
   * @returns Estimated rate and converted amount
   * @throws Error if API call fails
   */
  async getEstimatedRate(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
  ): Promise<{ rate: number; amount: number; fromCurrency: string; toCurrency: string }> {
    try {
      this.logger.debug(`Getting exchange rate: ${fromCurrency} → ${toCurrency} (${amount})`);

      const response = await this.axios.get<{ rate: number; amount: number }>('/estimate', {
        params: {
          amount,
          currency_from: fromCurrency.toLowerCase(),
          currency_to: toCurrency.toLowerCase(),
        },
      });

      return {
        rate: response.data.rate,
        amount: response.data.amount,
        fromCurrency,
        toCurrency,
      };
    } catch (error) {
      const errorMsg = this.extractErrorMessage(error);
      this.logger.error(
        `Failed to get exchange rate: ${errorMsg}`,
        axios.isAxiosError(error) ? error.stack : undefined,
      );

      throw new Error(`NOWPayments API Error: ${errorMsg}`);
    }
  }

  /**
   * Health check - verify API connectivity and key validity
   *
   * Makes a simple API call to verify the client is properly configured
   * and the API key is valid.
   *
   * @returns true if API is reachable and key is valid
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.logger.debug('Running NOWPayments API health check');
      await this.getCurrencies(); // Simple call to verify connectivity
      this.logger.log('✅ NOWPayments API health check passed');
      return true;
    } catch (error) {
      this.logger.error('❌ NOWPayments API health check failed', error);
      return false;
    }
  }

  /**
   * Create a direct payment (for embedded payment flow)
   *
   * Unlike createInvoice which redirects to NOWPayments hosted page,
   * this returns a wallet address and amount that can be displayed
   * directly in your own UI (QR code, copy address, etc.)
   *
   * @param params - Payment creation parameters
   * @returns Payment response with pay_address and pay_amount
   * @throws Error if API call fails
   *
   * @example
   * ```typescript
   * const payment = await client.createPayment({
   *   price_amount: 49.99,
   *   price_currency: 'eur',
   *   pay_currency: 'btc',
   *   order_id: 'order-123',
   *   ipn_callback_url: 'https://example.com/api/payments/ipn',
   * });
   * // Returns: { payment_id, pay_address, pay_amount, ... }
   * // Display pay_address as QR code, show pay_amount to user
   * ```
   */
  async createPayment(params: {
    price_amount: number;
    price_currency: string;
    pay_currency: string;
    order_id: string;
    order_description?: string;
    ipn_callback_url: string;
  }): Promise<PaymentStatusResponse> {
    try {
      this.logger.log(
        `Creating NOWPayments direct payment: orderId=${params.order_id}, amount=${params.price_amount} ${params.price_currency} → ${params.pay_currency}`,
      );

      const response = await this.axios.post<PaymentStatusResponse>('/payment', {
        price_amount: params.price_amount,
        price_currency: params.price_currency.toLowerCase(),
        pay_currency: params.pay_currency.toLowerCase(),
        order_id: params.order_id,
        order_description: params.order_description,
        ipn_callback_url: params.ipn_callback_url,
        // Note: NO success_url/cancel_url = embedded flow (no redirect)
      });

      this.logger.log(
        `✅ Direct payment created: paymentId=${response.data.payment_id}, payAddress=${response.data.pay_address}, payAmount=${response.data.pay_amount} ${response.data.pay_currency}`,
      );

      return response.data;
    } catch (error) {
      const errorMsg = this.extractErrorMessage(error);
      const statusCode = axios.isAxiosError(error) ? error.response?.status : 'UNKNOWN';
      this.logger.error(
        `Failed to create NOWPayments payment: ${statusCode} - ${errorMsg}`,
        axios.isAxiosError(error) ? error.stack : undefined,
      );

      throw new Error(`NOWPayments API Error: ${errorMsg} (${statusCode})`);
    }
  }
}
