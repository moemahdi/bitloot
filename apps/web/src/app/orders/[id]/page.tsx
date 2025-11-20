'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Configuration, OrdersApi, FulfillmentApi } from '@bitloot/sdk';
import type { OrderResponseDto, RevealedKeyDto } from '@bitloot/sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Separator } from '@/design-system/primitives/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/design-system/primitives/table';
import { Package, Calendar, CreditCard, ArrowLeft, Download, Key, Loader2, Copy, Check, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Initialize SDK configuration
const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: (): string => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') ?? '';
        }
        return '';
    },
});

const ordersClient = new OrdersApi(apiConfig);
const fulfillmentClient = new FulfillmentApi(apiConfig);

export default function OrderDetailPage(): React.ReactElement {
    const params = useParams();
    const orderId = params.id as string;
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [revealedKeys, setRevealedKeys] = useState<Record<string, RevealedKeyDto>>({});
    const [revealingItemId, setRevealingItemId] = useState<string | null>(null);

    const { data: order, isLoading, error } = useQuery<OrderResponseDto>({
        queryKey: ['order', orderId],
        queryFn: async () => {
            return await ordersClient.ordersControllerGet({ id: orderId });
        },
        enabled: Boolean(orderId),
    });

    const revealKeyMutation = useMutation({
        mutationFn: async ({ itemId }: { itemId: string }) => {
            setRevealingItemId(itemId);
            return await fulfillmentClient.fulfillmentControllerRevealMyKey({
                id: orderId,
                itemId,
            });
        },
        onSuccess: (data, variables) => {
            setRevealedKeys(prev => ({ ...prev, [variables.itemId]: data }));
            setRevealingItemId(null);
        },
        onError: (err) => {
            console.error('Failed to reveal key:', err);
            setRevealingItemId(null);
            alert('Failed to reveal key. Please try again.');
        },
    });

    const handleRevealKey = (itemId: string): void => {
        revealKeyMutation.mutate({ itemId });
    };

    const copyToClipboard = (text: string): void => {
        void navigator.clipboard.writeText(text);
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if ((error !== null && error !== undefined) || (order === null || order === undefined)) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold text-destructive">Error Loading Order</h2>
                <p className="text-muted-foreground">Could not find order details.</p>
                <Link href="/orders">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            Order #{order.id.slice(0, 8)}
                            <Badge
                                variant={
                                    order.status === 'completed'
                                        ? 'default'
                                        : order.status === 'pending'
                                            ? 'secondary'
                                            : 'destructive'
                                }
                                className={
                                    order.status === 'fulfilled'
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : order.status === 'pending'
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                            : ''
                                }
                            >
                                {order.status.toUpperCase()}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                            {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Invoice
                    </Button>
                    <Button variant="secondary">Support</Button>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Order Details Column */}
                <div className="space-y-8 md:col-span-2">
                    {/* Digital Keys Section (Only if fulfilled) */}
                    {order.status === 'fulfilled' && (
                        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <Key className="h-5 w-5" />
                                    Your Digital Keys
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.items.map((item, index) => {
                                    const itemId = typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string' ? item.id : `item-${index}`;
                                    const revealedKey = revealedKeys[itemId];
                                    const isRevealing = revealingItemId === itemId;

                                    return (
                                        <div
                                            key={index}
                                            className="flex flex-col gap-2 rounded-lg border bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                                        >
                                            <div>
                                                <p className="font-medium">{item.productId}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {revealedKey !== null && revealedKey !== undefined ? 'Revealed' : 'Ready to activate'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {revealedKey !== null && revealedKey !== undefined ? (
                                                    <>
                                                        <code className="rounded bg-muted px-3 py-1 font-mono text-sm">
                                                            {revealedKey.plainKey}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => copyToClipboard(revealedKey.plainKey)}
                                                        >
                                                            {copiedKey === revealedKey.plainKey ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleRevealKey(itemId)}
                                                        disabled={isRevealing}
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
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Product Key</p>
                                                        <p className="text-xs text-muted-foreground">Digital Item</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-xs text-muted-foreground">
                                                {item.productId}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell className="font-bold">Total</TableCell>
                                        <TableCell className="text-right font-bold text-lg">
                                            ${parseFloat(order.total).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Payment Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <Badge variant="outline">{order.status}</Badge>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Method</span>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="text-sm font-medium">Crypto</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total Paid</span>
                                <span className="font-bold">${parseFloat(order.total).toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {order.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Customer</p>
                                    <p className="text-xs text-muted-foreground">{order.email}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Ordered on {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
