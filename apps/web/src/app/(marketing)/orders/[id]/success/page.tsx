'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Copy,
  XCircle,
  Eye,
  Loader2,
  Check,
  Image as ImageIcon,
  Key,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Calendar,
  Package,
  Download,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
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
import { Badge } from '@/design-system/primitives/badge';
import { Separator } from '@/design-system/primitives/separator';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { toast } from 'sonner';
import { apiConfig } from '@/lib/api-config';
import { Confetti } from '@/components/animations/Confetti';
import { cn } from '@/design-system/utils/utils';

// Initialize SDK clients
const ordersClient = new OrdersApi(apiConfig);
const fulfillmentClient = new FulfillmentApi(apiConfig);

export default function OrderSuccessPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const orderId = String(params.id);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, RevealedKeyDto>>({});
  const [revealingItemId, setRevealingItemId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);

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
      toast.success('Key revealed successfully!');
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
      <div className="container mx-auto py-12 px-4">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-40 rounded-xl md:col-span-2" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="mx-auto max-w-lg">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Error Loading Order</CardTitle>
              <CardDescription>
                We couldn&apos;t find this order. Please check the URL or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/support">Get Help</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const orderData = data;

  return (
    <>
      <Confetti active={showConfetti} />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto max-w-3xl space-y-8">
          
          {/* Success Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="relative overflow-hidden border-[hsl(var(--green-success))]/30 bg-gradient-to-br from-[hsl(var(--green-success))]/5 via-[hsl(var(--cyan-glow))]/5 to-transparent">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[hsl(var(--green-success))]/10 via-transparent to-transparent" />
              <CardHeader className="relative text-center pb-4">
                <motion.div 
                  className="mx-auto mb-4 h-20 w-20 rounded-full bg-[hsl(var(--green-success))]/10 border border-[hsl(var(--green-success))]/30 flex items-center justify-center shadow-lg shadow-[hsl(var(--green-success))]/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <CheckCircle2 className="h-10 w-10 text-[hsl(var(--green-success))]" />
                </motion.div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--green-success))] to-[hsl(var(--cyan-glow))] bg-clip-text text-transparent">
                  Payment Successful!
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Thank you for your purchase. Your order has been confirmed.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pb-6">
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Order #{orderId.slice(0, 8)}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(orderData.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-xs font-medium border",
                      isOrderFulfilled 
                        ? "bg-[hsl(var(--green-success))]/10 text-[hsl(var(--green-success))] border-[hsl(var(--green-success))]/30"
                        : "bg-[hsl(var(--orange-warning))]/10 text-[hsl(var(--orange-warning))] border-[hsl(var(--orange-warning))]/30"
                    )}
                  >
                    {orderData.status.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Underpayment Alert */}
          {orderData.status === 'underpaid' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Alert variant="destructive" className="border-2">
                <XCircle className="h-5 w-5" />
                <AlertTitle className="text-lg">Payment Underpaid</AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                  <p>
                    The amount received was less than required. Cryptocurrency payments are
                    irreversible and cannot be refunded automatically.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="bg-background">
                      <Link href="/support">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Contact Support
                      </Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <div className="grid gap-8 md:grid-cols-3">
            {/* Main Content - Keys Section */}
            <motion.div 
              className="space-y-6 md:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Digital Keys Card */}
              {isOrderFulfilled && orderItems.length > 0 ? (
                <Card className="border-[hsl(var(--green-success))]/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[hsl(var(--green-success))]/10 border border-[hsl(var(--green-success))]/20 flex items-center justify-center">
                        <Key className="h-5 w-5 text-[hsl(var(--green-success))]" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Your Digital Keys</CardTitle>
                        <CardDescription>Click to reveal and copy your product keys</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {orderItems.map((item, index) => {
                      const itemId = item.id;
                      const revealedKey = revealedKeys[itemId];
                      const isRevealing = revealingItemId === itemId;
                      const isImage = revealedKey?.contentType?.startsWith('image/');
                      
                      return (
                        <div 
                          key={itemId} 
                          className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">Product Key</p>
                                <p className="text-xs text-muted-foreground">Item {index + 1} of {orderItems.length}</p>
                              </div>
                            </div>
                            {revealedKey && (
                              <Badge variant="outline" className="text-[hsl(var(--green-success))] border-[hsl(var(--green-success))]/30 bg-[hsl(var(--green-success))]/10">
                                <Check className="mr-1 h-3 w-3" />
                                Revealed
                              </Badge>
                            )}
                          </div>
                          
                          {!revealedKey ? (
                            <Button 
                              onClick={() => handleRevealKey(itemId)} 
                              disabled={isRevealing}
                              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                              size="lg"
                            >
                              {isRevealing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Revealing Key...
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
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ImageIcon className="h-4 w-4" />
                                    <span>Image Key ({revealedKey.contentType})</span>
                                  </div>
                                  <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                                    <img 
                                      src={`data:${revealedKey.contentType};base64,${revealedKey.plainKey}`}
                                      alt="Product Key"
                                      className="max-w-full"
                                    />
                                  </div>
                                  <Button variant="outline" size="sm" className="w-full">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Image
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-1">
                                    <code className="flex-1 px-3 py-2 font-mono text-sm break-all select-all">
                                      {revealedKey.plainKey}
                                    </code>
                                    <Button
                                      variant={copiedKey === revealedKey.plainKey ? "default" : "ghost"}
                                      size="icon"
                                      onClick={() => copyToClipboard(revealedKey.plainKey)}
                                      className={cn(
                                        "shrink-0 transition-all",
                                        copiedKey === revealedKey.plainKey && "bg-[hsl(var(--green-success))] hover:bg-[hsl(var(--green-success))]/80"
                                      )}
                                    >
                                      {copiedKey === revealedKey.plainKey ? (
                                        <Check className="h-4 w-4 text-white" />
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
                  </CardContent>
                </Card>
              ) : orderItems.length > 0 ? (
                <Card className="border-[hsl(var(--orange-warning))]/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[hsl(var(--orange-warning))]/10 border border-[hsl(var(--orange-warning))]/20 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-[hsl(var(--orange-warning))] animate-spin" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Preparing Your Keys</CardTitle>
                        <CardDescription>This usually takes just a few moments</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-[hsl(var(--orange-warning))] animate-pulse" />
                        <span className="text-sm text-muted-foreground">
                          Fetching your product keys from the supplier...
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Security Notice */}
              <Alert className="border-[hsl(var(--cyan-glow))]/20 bg-[hsl(var(--cyan-glow))]/5">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--cyan-glow))]" />
                <AlertTitle className="text-[hsl(var(--cyan-glow))]">Keep Your Keys Secure</AlertTitle>
                <AlertDescription className="text-[hsl(var(--cyan-glow))]/70">
                  Save your keys in a secure location. Don&apos;t share them with anyone. 
                  You can always access them from your order history.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Sidebar */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Order Summary Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Order ID</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs font-mono">{orderId.slice(0, 8)}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(orderId)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium truncate max-w-[140px]">{orderData.email}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span className="font-medium">{orderItems.length}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-lg font-bold">€{parseFloat(orderData.total).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What's Next Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">What&apos;s Next?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">1</span>
                      </div>
                      <span className="text-muted-foreground">Reveal your product keys above</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">2</span>
                      </div>
                      <span className="text-muted-foreground">Copy and redeem on the platform</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">3</span>
                      </div>
                      <span className="text-muted-foreground">Check email for confirmation</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/orders/${orderId}`}>
                    <Package className="mr-2 h-4 w-4" />
                    View Order Details
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/catalog">
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </>
  );
}
