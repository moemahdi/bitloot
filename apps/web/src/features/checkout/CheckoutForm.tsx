'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { AlertCircle, Loader2 } from 'lucide-react';
import { OrdersApi, PaymentsApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import { Alert, AlertTitle, AlertDescription } from '@/design-system/primitives/alert';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { extractCheckoutError } from '@/utils/checkout-error-handler';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PaymentMethodForm, type PaymentMethodFormData } from './PaymentMethodForm';

// Define Zod schema for validation
const checkoutSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  payCurrency: z.enum(['btc', 'eth', 'usdttrc20', 'ltc'], {
    required_error: 'Please select a cryptocurrency',
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

import { apiConfig } from '@/lib/api-config';

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

  // State for wizard steps
  const [step, setStep] = useState<'email' | 'payment'>('email');
  const [order, setOrder] = useState<OrderResponseDto | null>(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: '',
      payCurrency: 'usdttrc20',
    },
  });

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

  // Mutation to create payment
  const createPaymentMutation = useMutation({
    mutationFn: async ({ order, data }: { order: OrderResponseDto; data: PaymentMethodFormData }) => {
      return paymentsClient.paymentsControllerCreate({
        createPaymentDto: {
          orderId: order.id,
          priceAmount: order.total, // Use dynamic price from order
          priceCurrency: 'eur',
          payCurrency: data.payCurrency,
          email: order.email, // Use email from order
        },
      });
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

  const onEmailSubmit = async (data: CheckoutFormData): Promise<void> => {
    try {
      // Step 1: Create order
      const createdOrder = await createOrderMutation.mutateAsync(data.email);
      setOrder(createdOrder);
      setStep('payment');
    } catch (error) {
      const checkoutError = extractCheckoutError(error);
      console.error('Order creation failed:', checkoutError.message);
      setJobError(checkoutError.message);
    }
  };

  const onPaymentSubmit = async (data: PaymentMethodFormData): Promise<void> => {
    if (order === null) return;

    try {
      // Step 2: Create payment
      const payment = await createPaymentMutation.mutateAsync({ order, data });

      // Step 3: Start job polling (fulfillment job queued after payment confirmed)
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
      console.error('Payment creation failed:', checkoutError.message);
      setJobError(checkoutError.message);
    }
  };

  const isLoading = createOrderMutation.isPending || createPaymentMutation.isPending || isSubmitting;
  const isPolling = jobId !== null && jobId.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quick Checkout</CardTitle>
        <CardDescription>
          {step === 'email' ? 'Enter your email to start' : 'Select payment method'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Job Status Polling Display */}
        {isPolling && (
          <Alert className="mb-6">
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

        {step === 'email' ? (
          <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                type="email"
                id="email"
                placeholder="your@email.com"
                disabled={isLoading || isPolling}
                {...register('email')}
              />
              {errors.email !== undefined && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isPolling}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Processing...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-medium">Order for: {order?.email}</p>
              <p className="text-xs text-muted-foreground">Order ID: {order?.id}</p>
            </div>

            <PaymentMethodForm
              onSubmit={onPaymentSubmit}
              isLoading={isLoading || isPolling}
            />

            <Button
              variant="ghost"
              onClick={() => setStep('email')}
              disabled={isLoading || isPolling}
              className="w-full"
            >
              Back to Email
            </Button>
          </div>
        )}

        {/* Error Messages */}
        {createOrderMutation.isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to create order. Please try again.</AlertDescription>
          </Alert>
        )}
        {createPaymentMutation.isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to create payment. Please try again.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
