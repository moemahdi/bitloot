'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { OrdersApi, Configuration } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';

// Initialize SDK client
const apiConfig = new Configuration({
  basePath: 'http://localhost:4000',
});

const ordersClient = new OrdersApi(apiConfig);

export default function OrderSuccessPage(): React.ReactElement {
  const params = useParams();
  const orderId = String(params.id);
  const [revealed, setRevealed] = useState(false);

  const { data, isError, isPending } = useQuery<OrderResponseDto>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const order = await ordersClient.ordersControllerGet({ id: orderId });
      return order;
    },
  });

  let signedUrl: string | null = null;
  if (data !== undefined) {
    const items = (data as unknown as Record<string, unknown>)['items'] as unknown[] | undefined;
    if (Array.isArray(items) && items.length > 0) {
      const itemData = items[0] as Record<string, unknown> | undefined;
      const url = itemData?.['signedUrl'];
      if (typeof url === 'string') {
        signedUrl = url;
      }
    }
  }

  if (isPending) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
        <div className="mx-auto max-w-md">
          <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
        <div className="mx-auto max-w-md">
          <div className="rounded bg-red-50 p-4 dark:bg-red-900">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load order. Please refresh the page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const orderData = data;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-md">
        <div className="space-y-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-800">
          <div>
            <h1 className="text-3xl font-bold">Payment Successful! 🎉</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Thank you for your purchase. Your download link is ready.
            </p>
          </div>

          <div className="space-y-3 rounded bg-green-50 p-4 dark:bg-green-900">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Order ID:</strong> {orderId.substring(0, 8)}...
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Email:</strong> {orderData.email}
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Status:</strong> {orderData.status.toUpperCase()}
            </p>
          </div>

          {signedUrl !== null ? (
            <div className="space-y-4">
              <div className="rounded bg-blue-50 p-4 dark:bg-blue-900">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ✓ Your link will expire in 15 minutes. Use it immediately.
                </p>
              </div>
              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full rounded bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  Reveal Download Link
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Download Link:
                  </p>
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded bg-green-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-green-700"
                  >
                    Download Your Key
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Opens in a new tab. Keep this link private!
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="space-y-2 rounded bg-gray-100 p-4 dark:bg-gray-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              What happens next?
            </p>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li>• Download your key immediately</li>
              <li>• Link expires in 15 minutes for security</li>
              <li>• Check your email for a confirmation</li>
              <li>• You can re-download from your account later</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
