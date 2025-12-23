'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { RadioGroup, RadioGroupItem } from '@/design-system/primitives/radio-group';
import { Separator } from '@/design-system/primitives/separator';
import { Badge } from '@/design-system/primitives/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { OrdersApi, Configuration } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import { PaymentStatusTracker, type PaymentStatus } from '@/components/checkout/PaymentStatusTracker';
import { Confetti } from '@/components/animations/Confetti';

// Validation schema for email step
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
  confirmEmail: z.string().email('Invalid email address'),
}).refine((data) => data.email === data.confirmEmail, {
  message: 'Emails do not match',
  path: ['confirmEmail'],
});

type EmailFormData = z.infer<typeof emailSchema>;

type CheckoutStep = 'review' | 'email' | 'payment' | 'confirmation';

// Initialize SDK client
const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});
const ordersClient = new OrdersApi(apiConfig);

export default function CheckoutPage(): React.ReactElement | void {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [showConfetti, setShowConfetti] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Helper function to safely create order via SDK
  const performOrderCreation = async (): Promise<OrderResponseDto> => {
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Use the first item (single product per order in this phase)
    const firstItem = items[0];
    if (firstItem === undefined) {
      throw new Error('No product in cart');
    }

    try {
      const response = await ordersClient.ordersControllerCreate({
        createOrderDto: {
          email,
          productId: firstItem.productId,
          captchaToken: '', // TODO: Integrate Turnstile CAPTCHA token
          note: `Quantity: ${firstItem.quantity}`,
        },
      });

      if (response?.id === undefined || response.id === '') {
        throw new Error('Invalid response from order creation: missing order ID');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      throw new Error(errorMessage);
    }
  };

  // Mutation for creating order with payment
  const createOrderMutation = useMutation({
    mutationFn: performOrderCreation,
    onSuccess: (data: OrderResponseDto): void => {
      setOrderId(data.id);
      clearCart();
      setPaymentStatus('confirmed');
      setShowConfetti(true);
      toast.success('Order created successfully!');

      // Delay transition to confirmation page to let user see "Confirmed" status
      setTimeout(() => {
        setCurrentStep('confirmation');
      }, 2000);
    },
    onError: (error: Error): void => {
      console.error('Order creation error:', error);
      setPaymentStatus('failed');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create order: ${errorMsg}`);
    },
  });

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Cart is Empty</h2>
            <p className="text-muted-foreground mb-6">
              Your cart is empty. Please add items before checking out.
            </p>
            <Button onClick={() => router.push('/catalog')}>
              Return to Catalog
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = total;
  const tax = subtotal * 0.08;
  const estimatedTotal = subtotal + tax;

  const handleEmailSubmit = (data: EmailFormData): void => {
    setEmail(data.email);
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (): Promise<void> => {
    setIsProcessing(true);
    setPaymentStatus('waiting');

    // Simulate network delay/processing for visual feedback
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPaymentStatus('confirming');

    try {
      // Create order via SDK (handles NOWPayments payment creation internally)
      await createOrderMutation.mutateAsync();
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      toast.error(`${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackStep = (): void => {
    if (currentStep === 'email') setCurrentStep('review');
    if (currentStep === 'payment') setCurrentStep('email');
  };

  const handleNewOrder = (): void => {
    router.push('/catalog');
  };

  // ============ STEP 1: ORDER REVIEW ============
  if (currentStep === 'review') {
    return (
      <div className="container mx-auto px-4 py-8">
        <CheckoutProgress currentStep="review" />
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-glow to-purple-neon">
          Checkout - Step 1: Review Order
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center pb-4 border-b last:border-b-0">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${estimatedTotal.toFixed(2)}</span>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 p-3 rounded-md text-xs">
                  <p>Instant delivery after payment</p>
                </div>

                <Separator />

                <GlowButton
                  onClick={() => setCurrentStep('email')}
                  className="w-full"
                  size="lg"
                >
                  Continue to Email
                </GlowButton>
                <Button
                  variant="outline"
                  onClick={() => router.push('/cart')}
                  className="w-full"
                >
                  Back to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 2: EMAIL CONFIRMATION ============
  if (currentStep === 'email') {
    return (
      <div className="container mx-auto px-4 py-8">
        <CheckoutProgress currentStep="email" />

        <button
          onClick={handleBackStep}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Review
        </button>

        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-glow to-purple-neon">
          Checkout - Step 2: Email Confirmation
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Your Email</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleEmailSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...register('email')}
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email !== undefined && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirm Email Address</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder="your@email.com"
                      {...register('confirmEmail')}
                      aria-invalid={Boolean(errors.confirmEmail)}
                    />
                    {errors.confirmEmail !== undefined && (
                      <p className="text-sm text-destructive">{errors.confirmEmail.message}</p>
                    )}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 p-4 rounded-md text-sm">
                    <p className="font-semibold mb-1">Important</p>
                    <p>We&apos;ll send your purchased keys and order confirmation to this email address. Make sure it&apos;s correct!</p>
                  </div>

                  <GlowButton type="submit" className="w-full" size="lg">
                    Continue to Payment
                  </GlowButton>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Items</p>
                  <p className="text-lg font-semibold">{items.length}</p>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-semibold">${estimatedTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 3: PAYMENT METHOD SELECTION ============
  if (currentStep === 'payment') {
    return (
      <div className="container mx-auto px-4 py-8">
        <CheckoutProgress currentStep="payment" />

        <button
          onClick={handleBackStep}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          disabled={isProcessing || paymentStatus !== 'idle'}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Email
        </button>

        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-glow to-purple-neon">
          Checkout - Step 3: Payment Method
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentStatus !== 'idle' ? (
                  <div className="py-8">
                    <PaymentStatusTracker status={paymentStatus} />
                  </div>
                ) : (
                  <>
                    <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as 'BTC' | 'ETH' | 'USDT')}>
                      <div className="space-y-4">
                        {/* Bitcoin */}
                        <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${paymentMethod === 'BTC' ? 'border-cyan-glow bg-cyan-glow/5' : 'hover:bg-accent'}`}>
                          <RadioGroupItem value="BTC" id="btc" />
                          <Label htmlFor="btc" className="flex-1 cursor-pointer">
                            <div className="font-semibold">Bitcoin (BTC)</div>
                            <div className="text-sm text-muted-foreground">Most secure & widely used</div>
                          </Label>
                          <Badge variant="outline" className="border-cyan-glow text-cyan-glow">Recommended</Badge>
                        </div>

                        {/* Ethereum */}
                        <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${paymentMethod === 'ETH' ? 'border-purple-neon bg-purple-neon/5' : 'hover:bg-accent'}`}>
                          <RadioGroupItem value="ETH" id="eth" />
                          <Label htmlFor="eth" className="flex-1 cursor-pointer">
                            <div className="font-semibold">Ethereum (ETH)</div>
                            <div className="text-sm text-muted-foreground">Smart contract enabled</div>
                          </Label>
                        </div>

                        {/* USDT */}
                        <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${paymentMethod === 'USDT' ? 'border-green-success bg-green-success/5' : 'hover:bg-accent'}`}>
                          <RadioGroupItem value="USDT" id="usdt" />
                          <Label htmlFor="usdt" className="flex-1 cursor-pointer">
                            <div className="font-semibold">Tether (USDT)</div>
                            <div className="text-sm text-muted-foreground">Stablecoin, lowest volatility</div>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    <Separator className="my-6" />

                    <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 p-4 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                      <p className="font-semibold mb-2">How it works</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Select your preferred cryptocurrency</li>
                        <li>We&apos;ll generate a payment address</li>
                        <li>Send the exact amount to receive your keys</li>
                        <li>Instant delivery after confirmation</li>
                      </ol>
                    </div>

                    <GlowButton
                      onClick={() => handlePaymentSubmit()}
                      className="w-full mt-6"
                      size="lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : `Pay ${estimatedTotal.toFixed(2)} USD with ${paymentMethod}`}
                    </GlowButton>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${estimatedTotal.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Email: {email}</p>
                  <p>Payment: {paymentMethod}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 4: PAYMENT CONFIRMATION ============
  if (currentStep === 'confirmation') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Confetti active={showConfetti} />
        <CheckoutProgress currentStep="confirmation" />

        <div className="max-w-2xl mx-auto">
          <Card className="text-center border-green-success/30 bg-green-success/5">
            <CardContent className="py-12">
              <div className="mb-6 relative inline-block">
                <div className="absolute inset-0 bg-green-success/20 blur-xl rounded-full animate-pulse" />
                <CheckCircle2 className="h-16 w-16 text-green-success relative z-10" />
              </div>

              <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-success to-cyan-glow">
                Order Confirmed!
              </h1>

              <p className="text-xl text-muted-foreground mb-8">
                Your payment has been received and processed.
              </p>

              {/* Order Details */}
              <Card className="mb-8 bg-muted/50">
                <CardContent className="py-6">
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-mono font-semibold">{orderId}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{email}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="text-lg font-semibold">${estimatedTotal.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span>{paymentMethod}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Delivery Info */}
              <div className="bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 p-4 rounded-md text-sm mb-8">
                <p className="font-semibold mb-2">✓ Keys will be delivered to your email</p>
                <p className="text-xs">Check your inbox and spam folder for your digital keys. Delivery is usually instant!</p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <GlowButton
                  onClick={handleNewOrder}
                  className="w-full"
                  size="lg"
                >
                  Continue Shopping
                </GlowButton>
                <Button
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <a href={`mailto:${email}?subject=Your Order ${orderId}`}>
                    Open Email Client
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}
