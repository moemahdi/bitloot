'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { AlertCircle, Loader2 } from 'lucide-react';
import { OrdersApi, PaymentsApi, Configuration } from '@bitloot/sdk';
import type { OrderResponseDto, PaymentResponseDto } from '@bitloot/sdk';
import { Alert, AlertTitle, AlertDescription } from '@/design-system/primitives/alert';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { extractCheckoutError } from '@/utils/checkout-error-handler';

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
  const [_captchaToken, _setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  // Job polling state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>('pending');
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobError, setJobError] = useState<string | null>(null);

  // Create order mutation using SDK
  const createOrderMutation = useMutation({
    mutationFn: async (emailAddr: string): Promise<OrderResponseDto> => {
      const order = await ordersClient.ordersControllerCreate({
        createOrderDto: { email: emailAddr, productId, captchaToken: _captchaToken ?? undefined },
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
        // Use SDK configuration for consistent API calls
        const response = await fetch(`${apiConfig.basePath}/payments/jobs/${jobId}/status`);
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
      const checkoutError = extractCheckoutError(error);
      console.error('Checkout failed:', checkoutError.message);
      setJobError(checkoutError.message);
    }
  };

  const isLoading = createOrderMutation.isPending || createPaymentMutation.isPending;
  const isPolling = jobId !== null && jobId.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quick Checkout</CardTitle>
        <CardDescription>Enter your email and proceed to payment</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitForm} className="space-y-6">
          {/* Job Status Polling Display */}
          {isPolling && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Processing Payment</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">
                    Status: <span className="font-semibold">{jobStatus}</span>
                    {jobStatus === 'processing' && ` (${jobProgress}%)`}
                  </p>
                  {jobProgress > 0 && jobStatus === 'processing' && (
                    <div className="h-1 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${jobProgress}%` }}
                      />
                    </div>
                  )}
                  {jobError !== null && jobError.length > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400">{jobError}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              placeholder="your@email.com"
              disabled={isLoading || isPolling}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError.length > 0) setEmailError('');
              }}
            />
            {emailError.length > 0 && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>

          {/* CAPTCHA Widget */}
          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== undefined &&
            process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY.length > 0 && (
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => {
                    _setCaptchaToken(token);
                  }}
                  onError={() => {
                    _setCaptchaToken(null);
                    setJobError('CAPTCHA verification failed. Please try again.');
                  }}
                  onExpire={() => {
                    _setCaptchaToken(null);
                  }}
                />
              </div>
            )}

          {/* Underpayment Warning Alert */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>⚠️ Important: Underpayments are Non-Refundable</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                Cryptocurrency payments are irreversible. If you send less than the exact amount required,
                your payment will be marked as failed and the crypto cannot be refunded.
              </p>
              <p className="font-semibold">
                Amount Required: <span className="font-mono">1.00 USD (or equivalent BTC)</span>
              </p>
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || isPolling}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Processing...' : isPolling ? 'Redirecting...' : 'Proceed to Payment'}
          </Button>

          {/* Error Messages */}
          {createOrderMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to create order. Please try again.</AlertDescription>
            </Alert>
          )}
          {createPaymentMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to create payment. Please try again.</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
