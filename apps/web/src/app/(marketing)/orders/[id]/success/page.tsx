'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, Copy, XCircle, Eye, Loader2, Check, Image as ImageIcon, Key } from 'lucide-react';
import { OrdersApi, FulfillmentApi } from '@bitloot/sdk';
import type { OrderResponseDto, RevealedKeyDto } from '@bitloot/sdk';
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
import { toast } from 'sonner';
import { apiConfig } from '@/lib/api-config';

// Initialize SDK clients
const ordersClient = new OrdersApi(apiConfig);
const fulfillmentClient = new FulfillmentApi(apiConfig);

export default function OrderSuccessPage(): React.ReactElement {
  const params = useParams();
  const orderId = String(params.id);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, RevealedKeyDto>>({});
  const [revealingItemId, setRevealingItemId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data, isError, isPending } = useQuery<OrderResponseDto>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const order = await ordersClient.ordersControllerGet({ id: orderId });
      return order;
    },
  });

  const revealKeyMutation = useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      setRevealingItemId(itemId);
      return await fulfillmentClient.fulfillmentControllerRevealMyKey({
        id: orderId,
        itemId,
      });
    },
    onSuccess: (keyData, variables) => {
      setRevealedKeys(prev => ({ ...prev, [variables.itemId]: keyData }));
      setRevealingItemId(null);
    },
    onError: (err) => {
      console.error('Failed to reveal key:', err);
      setRevealingItemId(null);
      toast.error('Failed to reveal key. Please try again.');
    },
  });

  const handleRevealKey = (itemId: string): void => {
    revealKeyMutation.mutate({ itemId });
  };

  const copyToClipboard = (text: string): void => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(text);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Check if order is fulfilled and has keys ready
  const isOrderFulfilled = data?.status === 'fulfilled';
  const orderItems = data?.items ?? [];

  if (isPending) {
    return (
      <main className="min-h-screen bg-gray-900 px-4 py-8 dark:bg-gray-900">
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

        {/* Keys Section */}
        {isOrderFulfilled && orderItems.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Product Keys</CardTitle>
              <CardDescription>Click reveal to view each key. You can copy or view image keys.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderItems.map((item) => {
                const itemId = item.id;
                const revealedKey = revealedKeys[itemId];
                const isRevealing = revealingItemId === itemId;
                const isImage = revealedKey?.contentType?.startsWith('image/');
                
                return (
                  <div key={itemId} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Product Key</span>
                      <span className="text-xs text-muted-foreground">Item #{itemId.slice(-6)}</span>
                    </div>
                    
                    {!revealedKey ? (
                      <Button 
                        onClick={() => handleRevealKey(itemId)} 
                        disabled={isRevealing}
                        className="w-full"
                      >
                        {isRevealing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Revealing...
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Reveal Key
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        {isImage ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                              <span>Image Key ({revealedKey.contentType})</span>
                            </div>
                            <img 
                              src={`data:${revealedKey.contentType};base64,${revealedKey.plainKey}`}
                              alt="Product Key"
                              className="max-w-full rounded-lg border"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Key className="h-4 w-4" />
                              <span>Text Key</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 rounded bg-muted p-3 font-mono text-sm break-all">
                                {revealedKey.plainKey}
                              </code>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(revealedKey.plainKey)}
                              >
                                {copiedKey === revealedKey.plainKey ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Keep your keys private</AlertTitle>
                <AlertDescription>Don&apos;t share your keys with others. Save them securely.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : orderItems.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Processing Your Order</CardTitle>
              <CardDescription>Your keys are being prepared. This usually takes a few moments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Preparing your keys...</span>
              </div>
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
                <span className="text-sm">Click &quot;Reveal Key&quot; to view your product keys</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">Copy text keys or save image keys securely</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">Check your email for a confirmation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">You can reveal your keys again from your order history</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
