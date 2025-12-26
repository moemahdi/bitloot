'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, Download, Copy, XCircle } from 'lucide-react';
import { OrdersApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/design-system/primitives/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { apiConfig } from '@/lib/api-config';

// Initialize SDK client
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
          <Card>
            <CardHeader>
              <CardTitle>Loading Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
        <div className="mx-auto max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Order</AlertTitle>
            <AlertDescription>Failed to load order details. Please refresh the page.</AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  const orderData = data;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Success Header Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">🎉 Payment Successful!</CardTitle>
            <CardDescription>Thank you for your purchase. Your download link is ready.</CardDescription>
          </CardHeader>
        </Card>

        {/* Underpayment Alert */}
        {orderData.status === 'underpaid' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Payment Underpaid (Non-Refundable)</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                The amount you sent was less than required. Cryptocurrency payments are irreversible
                and cannot be refunded.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/support">Contact Support</a>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Order Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Order ID</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-semibold">{orderId.substring(0, 12)}...</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(orderId)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm">{orderData.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-sm font-semibold">{orderData.status.toUpperCase()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Download Section */}
        {signedUrl !== null ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download Your Key</CardTitle>
              <CardDescription>⏱️ Link expires in 15 minutes. Use immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!revealed ? (
                <Button onClick={() => setRevealed(true)} size="lg" className="w-full">
                  Reveal Download Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    asChild
                    size="lg"
                    className="w-full"
                    variant="default"
                  >
                    <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download Your Key
                    </a>
                  </Button>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Keep this link private</AlertTitle>
                    <AlertDescription>Opens in a new tab. Don&apos;t share with others.</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Next Steps Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">Download your key immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">Link expires in 15 minutes for security</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">Check your email for a confirmation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">You can re-download from your account later</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
