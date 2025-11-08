'use client';

import { useState } from 'react';
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

export default function CheckoutForm(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const productId = String(params.id ?? 'demo-product');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

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
        createPaymentDto: { orderId },
      });
      return payment;
    },
  });

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

      // Step 3: Navigate to payment page
      router.push(payment.paymentUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      console.error('Checkout failed:', errorMessage);
    }
  };

  const isLoading = createOrderMutation.isPending || createPaymentMutation.isPending;

  return (
    <form
      onSubmit={handleSubmitForm}
      className="space-y-4 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-800"
    >
      <h2 className="text-xl font-bold">Quick Checkout</h2>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          placeholder="your@email.com"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          disabled={isLoading}
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
        disabled={isLoading}
        className="w-full rounded bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        {isLoading ? 'Processing...' : 'Proceed to Payment'}
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
