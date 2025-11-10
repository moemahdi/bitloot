'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { OrdersApi, PaymentsApi, Configuration } from '@bitloot/sdk';
import type { OrderResponseDto, PaymentResponseDto } from '@bitloot/sdk';

// Initialize SDK clients with base URL
const apiConfig = new Configuration({
  basePath: 'http://localhost:4000',
});

const ordersClient = new OrdersApi(apiConfig);
const paymentsClient = new PaymentsApi(apiConfig);

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress?: number;
  error?: string;
}

export default function CheckoutForm(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const productId = String(params.id ?? 'demo-product');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Job polling state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>('pending');
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobError, setJobError] = useState<string | null>(null);

  // Create order mutation using SDK
  const createOrderMutation = useMutation({
    mutationFn: async (emailAddr: string): Promise<OrderResponseDto> => {
      const order = await ordersClient.ordersControllerCreate({
        createOrderDto: { email: emailAddr, productId },
      });
      return order;
    },
  });

  // Create payment mutation using SDK
  const createPaymentMutation = useMutation({
    mutationFn: async (orderId: string): Promise<PaymentResponseDto> => {
      const payment = await paymentsClient.paymentsControllerCreate({
        createPaymentDto: {
          orderId,
          email: email.length > 0 ? email : 'guest@bitloot.com',
          priceAmount: '1.00',
          priceCurrency: 'usd',
        },
      });
      return payment;
    },
  });

  // Job status polling effect
  useEffect(() => {
    // Explicit null/empty check
    if (jobId === null || jobId.length === 0) return;
    if (jobStatus === 'completed' || jobStatus === 'failed') return;

    // Setup polling interval
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const pollInterval = setInterval(async (): Promise<void> => {
      try {
        const response = await fetch(`http://localhost:4000/payments/jobs/${jobId}/status`);
        if (!response.ok) {
          console.error(`Failed to fetch job status: ${response.status}`);
          return;
        }

        const statusData = (await response.json()) as JobStatusResponse;
        setJobStatus(statusData.status);

        if (statusData.progress !== undefined && typeof statusData.progress === 'number') {
          setJobProgress(statusData.progress);
        }

        // Type-safe error handling
        if (typeof statusData.error === 'string' && statusData.error.length > 0) {
          setJobError(statusData.error);
        }

        // Stop polling on completion or failure
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          clearInterval(pollInterval);

          // Navigate to success page after brief delay to show UI update
          if (statusData.status === 'completed') {
            setTimeout((): void => {
              if (jobId.length > 0) {
                const orderId = jobId.replace('fulfill-', '');
                router.push(`/orders/${orderId}/success`);
              }
            }, 1500);
          }
        }
      } catch (error) {
        console.error('Job status polling error:', error);
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [jobId, jobStatus, router]);

  const validateEmail = (value: string): boolean => {
    if (value.length === 0) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Invalid email address');
      return false;
    }
    return true;
  };

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!validateEmail(email)) return;

    try {
      // Step 1: Create order
      const order = await createOrderMutation.mutateAsync(email);

      // Step 2: Create payment
      const payment = await createPaymentMutation.mutateAsync(order.id);

      // Step 3: Start job polling (fulfillment job queued after payment confirmed)
      // For now, create a jobId based on order ID
      // In production, this would come from the payment response
      const generatedJobId = `fulfill-${order.id}`;
      setJobId(generatedJobId);
      setJobStatus('pending');
      setJobProgress(0);
      setJobError(null);

      // Step 4: Navigate to payment page to let user complete payment
      if (payment.invoiceUrl.length > 0) {
        router.push(payment.invoiceUrl);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      console.error('Checkout failed:', errorMessage);
    }
  };

  const isLoading = createOrderMutation.isPending || createPaymentMutation.isPending;
  const isPolling = jobId !== null && jobId.length > 0;

  return (
    <form
      onSubmit={handleSubmitForm}
      className="space-y-4 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-800"
    >
      <h2 className="text-xl font-bold">Quick Checkout</h2>

      {/* Job Status Polling Display */}
      {isPolling && (
        <div className="rounded bg-blue-50 p-4 dark:bg-blue-900">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium text-blue-800 dark:text-blue-100">
              Processing payment... {jobStatus === 'processing' && `(${jobProgress}%)`}
            </p>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Status: <span className="font-semibold">{jobStatus}</span>
          </p>
          {jobProgress > 0 && jobStatus === 'processing' && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${jobProgress}%` }}
              />
            </div>
          )}
          {jobError !== null && jobError.length > 0 && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{jobError}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          placeholder="your@email.com"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          disabled={isLoading || isPolling}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError.length > 0) setEmailError('');
          }}
        />
        {emailError.length > 0 && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading || isPolling}
        className="w-full rounded bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        {isLoading ? 'Processing...' : isPolling ? 'Redirecting...' : 'Proceed to Payment'}
      </button>

      {createOrderMutation.isError && (
        <p className="text-sm text-red-500">Failed to create order. Please try again.</p>
      )}
      {createPaymentMutation.isError && (
        <p className="text-sm text-red-500">Failed to create payment. Please try again.</p>
      )}
    </form>
  );
}
