'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { OrderResponseDto, AdminControllerGetKeyAuditTrail200ResponseInner } from '@bitloot/sdk';
import { Configuration, OrdersApi, AdminApi } from '@bitloot/sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/design-system/primitives/table';

const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: (): string => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') ?? '';
        }
        return '';
    },
});

const ordersApi = new OrdersApi(apiConfig);
const adminApi = new AdminApi(apiConfig);

export default function AdminOrderDetailPage(): React.ReactElement | null {
    const params = useParams();
    const id = params.id as string;
    const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();

    const { data: order, isLoading: isOrderLoading } = useQuery<OrderResponseDto>({
        queryKey: ['admin-order', id],
        queryFn: async () => {
            return await ordersApi.ordersControllerGet({ id });
        },
        enabled: isAdmin && Boolean(id),
    });

    const { isLoading: _isAuditLoading } = useQuery<AdminControllerGetKeyAuditTrail200ResponseInner[]>({
        queryKey: ['admin-order-audit', id],
        queryFn: async () => {
            return await adminApi.adminControllerGetKeyAuditTrail({ orderId: id });
        },
        enabled: isAdmin && (id !== null && id !== undefined && id.length > 0),
    });

    if (isGuardLoading || isOrderLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    if (order === null || order === undefined) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <h1 className="text-2xl font-bold">Order not found</h1>
                    <Link href="/admin/orders">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/orders">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Order Details</h1>
                    <p className="text-muted-foreground">ID: {order.id}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    {/* Placeholder for admin actions */}
                    <Button variant="destructive" disabled>Refund Order</Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Order Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                {order.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-medium">${parseFloat(order.total).toFixed(2)}</span>
                        </div>
                        {/* Assuming user email is available in order object or fetched separately if needed. 
                 The OrderResponseDto might not have user email directly if it's strict DTO.
                 Let's check OrderResponseDto definition if possible, but for now we display what we have.
             */}
                    </CardContent>
                </Card>

                {/* Payment Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Order Total</span>
                            <span className="font-mono">${order.total}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Order Status</span>
                            <Badge variant="outline">{order.status}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Items - Note: OrderItemResponseDto doesn't contain product details like name, quantity, or price */}
            <Card>
                <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                    <CardDescription>{order.items.length} item(s) in this order</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item ID</TableHead>
                                <TableHead>Product ID</TableHead>
                                <TableHead>Key Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                    <TableCell className="font-mono text-xs">{item.productId}</TableCell>
                                    <TableCell>
                                        {item.signedUrl !== null && item.signedUrl !== undefined ? (
                                            <Badge variant="default">Delivered</Badge>
                                        ) : (
                                            <Badge variant="secondary">Pending</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Key Audit Trail */}
            <Card>
                <CardHeader>
                    <CardTitle>Key Access Audit Trail</CardTitle>
                    <CardDescription>Log of when keys were revealed or accessed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4 text-muted-foreground">
                        Audit trail will be displayed here
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
