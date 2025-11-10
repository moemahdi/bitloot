import CheckoutForm from '@/features/checkout/CheckoutForm';

export default function ProductPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="space-y-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-800">
          <div>
            <h1 className="text-3xl font-bold">Demo Product</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This is a demo digital product for Level 1 testing.
            </p>
          </div>

          <div className="space-y-2 border-t border-gray-300 pt-4 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Price:</strong> $1.00 USD
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Platform:</strong> Universal
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Region:</strong> Global
            </p>
          </div>

          <div className="space-y-2 rounded bg-yellow-50 p-4 dark:bg-yellow-900">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              ⚠️ Important: Underpayments are non-refundable
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Please ensure you send the exact amount or more. Any shortfall will be kept as a fee.
            </p>
          </div>

          <div>
            <CheckoutForm />
          </div>
        </div>
      </div>
    </main>
  );
}
