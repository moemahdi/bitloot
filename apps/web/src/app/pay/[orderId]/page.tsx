'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Configuration } from '@bitloot/sdk';

// Initialize SDK configuration for consistent API calls
const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

export default function PayPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const ext = search.get('ext') ?? '';
  const orderId = String(params.orderId);

  const [isProcessing, setIsProcessing] = useState(false);

  // Call IPN endpoint directly (webhook endpoint not in SDK yet)
  const confirmPayment = useMutation({
    mutationFn: async (): Promise<{ ok: boolean; processed: boolean }> => {
      const payload = {
        payment_id: ext,
        invoice_id: orderId,
        order_id: orderId,
        payment_status: 'finished',
        price_amount: 1,
        price_currency: 'usd',
        pay_amount: 0.00021,
        pay_currency: 'btc',
        received_amount: 0.00021,
        received_currency: 'btc',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(`${apiConfig.basePath}/webhooks/nowpayments/ipn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`IPN call failed with ${response.status}`);
      }

      return response.json() as Promise<{ ok: boolean; processed: boolean }>;
    },
    onSuccess: () => {
      // Redirect to success page
      router.push(`/orders/${orderId}/success`);
    },
    onError: (error): void => {
      console.error('Payment confirmation failed:', error);
      setIsProcessing(false);
    },
  });

  const handleCompletePayment = async (): Promise<void> => {
    setIsProcessing(true);
    await confirmPayment.mutateAsync();
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-md">
        <div className="space-y-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-800">
          <h1 className="text-2xl font-bold">Fake Checkout</h1>

          <div className="space-y-3 rounded bg-blue-50 p-4 dark:bg-blue-900">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Order ID:</strong> {orderId.substring(0, 8)}...
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              For Level 1 testing, this is a <strong>fake checkout page</strong>. In production, you
              would be redirected to NOWPayments here.
            </p>
          </div>

          <div className="space-y-2 rounded bg-yellow-50 p-4 dark:bg-yellow-900">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Pretend you just paid in crypto...
            </p>
          </div>

          <button
            onClick={handleCompletePayment}
            disabled={isProcessing || confirmPayment.isPending}
            className="w-full rounded bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {isProcessing || confirmPayment.isPending ? 'Processing...' : 'Complete Payment'}
          </button>

          {confirmPayment.isError && (
            <p className="text-sm text-red-500">Payment confirmation failed. Please try again.</p>
          )}
        </div>
      </div>
    </main>
  );
}
