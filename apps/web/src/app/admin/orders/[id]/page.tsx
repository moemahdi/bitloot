'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { OrderResponseDto, AdminControllerGetKeyAuditTrail200ResponseInner, UpdateOrderStatusDtoStatusEnum } from '@bitloot/sdk';
import { OrdersApi, AdminApi, UpdateOrderStatusDtoStatusEnum as StatusEnum } from '@bitloot/sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Loader2, ArrowLeft, Clock, Package, CreditCard, Eye, EyeOff, History, AlertTriangle, Mail, Zap, CheckCircle2, XCircle, Copy, Wallet, Hash, ExternalLink, Download, Globe, Monitor, Key } from 'lucide-react';
import { toast } from 'sonner';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/design-system/primitives/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/design-system/primitives/select';
import { Textarea } from '@/design-system/primitives/textarea';
import { Label } from '@/design-system/primitives/label';

import { apiConfig } from '@/lib/api-config';

const ordersApi = new OrdersApi(apiConfig);
const adminApi = new AdminApi(apiConfig);

/**
 * Get badge styling for order status with neon cyberpunk aesthetic
 */
function getOrderStatusBadge(status: string): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; icon: React.ReactNode } {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'fulfilled') {
        return {
            variant: 'default',
            className: 'badge-success animate-glow-pulse',
            icon: <CheckCircle2 className="h-3 w-3 mr-1" />
        };
    }
    
    if (statusLower === 'paid') {
        return {
            variant: 'default',
            className: 'badge-info',
            icon: <Zap className="h-3 w-3 mr-1" />
        };
    }
    
    if (statusLower === 'confirming' || statusLower === 'pending') {
        return {
            variant: 'secondary',
            className: 'badge-warning',
            icon: <Clock className="h-3 w-3 mr-1 animate-spin" />
        };
    }
    
    if (statusLower === 'failed' || statusLower === 'underpaid' || statusLower === 'refunded' || statusLower === 'expired') {
        return {
            variant: 'destructive',
            className: 'badge-error',
            icon: <XCircle className="h-3 w-3 mr-1" />
        };
    }
    
    return {
        variant: 'outline',
        className: 'border-border-accent',
        icon: null
    };
}

/**
 * Format date with time - handles both Date objects and string dates
 */
function formatDateTime(dateInput: string | Date | undefined): string {
    if (!dateInput) return '-';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Copy text to clipboard with toast notification
 */
function copyToClipboard(text: string, label: string = 'Value'): void {
    void navigator.clipboard.writeText(text).then(() => {
        toast.success(`${label} copied to clipboard`);
    }).catch(() => {
        toast.error('Failed to copy to clipboard');
    });
}

/**
 * Copyable ID component with full ID display
 */
function CopyableId({ id, label, className = '', truncate = false }: { id: string; label: string; className?: string; truncate?: boolean }): React.ReactElement {
    const displayId = truncate && id.length > 8 ? id.slice(0, 8) : id;
    return (
        <button
            onClick={() => copyToClipboard(id, label)}
            className={`group inline-flex items-center gap-1.5 font-mono text-xs bg-bg-tertiary px-2 py-1 rounded hover:bg-bg-secondary transition-colors cursor-pointer ${className}`}
            title={truncate ? `${id} - Click to copy` : `Click to copy ${label}`}
        >
            <span className="break-all">{displayId}</span>
            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-glow flex-shrink-0" />
        </button>
    );
}

export default function AdminOrderDetailPage(): React.ReactElement | null {
    const params = useParams();
    const id = params.id as string;
    const queryClient = useQueryClient();
    const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<UpdateOrderStatusDtoStatusEnum | ''>('');
    const [statusReason, setStatusReason] = useState('');

    const { data: order, isLoading: isOrderLoading, refetch } = useQuery<OrderResponseDto>({
        queryKey: ['admin-order', id],
        queryFn: async () => {
            return await ordersApi.ordersControllerGet({ id });
        },
        enabled: isAdmin && Boolean(id),
    });

    const { data: auditTrail, isLoading: isAuditLoading } = useQuery<AdminControllerGetKeyAuditTrail200ResponseInner[]>({
        queryKey: ['admin-order-audit', id],
        queryFn: async () => {
            return await adminApi.adminControllerGetKeyAuditTrail({ orderId: id });
        },
        enabled: isAdmin && (id !== null && id !== undefined && id.length > 0),
    });

    // Update order status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ status, reason }: { status: UpdateOrderStatusDtoStatusEnum; reason?: string }) => {
            return await adminApi.adminControllerUpdateOrderStatus({
                id,
                updateOrderStatusDto: { status, reason },
            });
        },
        onSuccess: (data) => {
            toast.success(`Order status updated to ${data.newStatus ?? 'new status'}`);
            setStatusDialogOpen(false);
            setNewStatus('');
            setStatusReason('');
            void refetch();
            void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
        onError: (error: Error) => {
            toast.error(`Failed to update status: ${error.message}`);
        },
    });

    // Resend keys email mutation
    const resendKeysMutation = useMutation({
        mutationFn: async () => {
            return await adminApi.adminControllerResendKeys({ id });
        },
        onSuccess: (data) => {
            toast.success(`Keys email sent to ${data.email}`);
        },
        onError: (error: Error) => {
            toast.error(`Failed to resend keys: ${error.message}`);
        },
    });

    const handleStatusUpdate = () => {
        if (!newStatus) return;
        updateStatusMutation.mutate({ status: newStatus, reason: statusReason || undefined });
    };

    const handleResendKeys = () => {
        resendKeysMutation.mutate();
    };

    if (isGuardLoading || isOrderLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-bg-primary">
                <Loader2 className="h-12 w-12 animate-spin-glow text-cyan-glow" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    if (order === null || order === undefined) {
        return (
            <div className="container max-w-4xl mx-auto py-16 px-4">
                <div className="empty-state">
                    <Package className="empty-state-icon text-text-muted" />
                    <h1 className="empty-state-title">Order Not Found</h1>
                    <p className="empty-state-description">
                        The requested order could not be found. It may have been deleted or the ID is incorrect.
                    </p>
                    <Link href="/admin/orders">
                        <Button className="btn-primary mt-6">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const statusBadge = getOrderStatusBadge(order.status);

    return (
        <main className="container max-w-7xl mx-auto py-6 px-4 space-y-6 animate-fade-in">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-border-subtle">
                <Link href="/admin/orders" className="inline-flex">
                    <Button variant="ghost" size="icon" className="hover:text-cyan-glow hover:shadow-glow-cyan-sm transition-all duration-300">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gradient-primary">
                        Order Details
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-text-muted text-xs">ID:</span>
                        <CopyableId id={order.id} label="Order ID" className="text-cyan-glow" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadge.variant} className={`${statusBadge.className} text-sm px-3 py-1.5 font-medium`}>
                        {statusBadge.icon}
                        {order.status.toUpperCase()}
                    </Badge>

                    <Link href={`/orders/${order.id}`} target="_blank">
                        <Button className="btn-outline">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Order
                        </Button>
                    </Link>

                    <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-outline">
                                <History className="mr-2 h-4 w-4" />
                                Update Status
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-strong border-border-accent">
                            <DialogHeader>
                                <DialogTitle className="text-xl text-gradient-primary">Update Order Status</DialogTitle>
                                <DialogDescription className="text-text-secondary">
                                    Change the order status for administrative logging. This action is for record-keeping only.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-text-primary">New Status</Label>
                                    <Select value={newStatus} onValueChange={(val) => setNewStatus(val as UpdateOrderStatusDtoStatusEnum)}>
                                        <SelectTrigger className="input-glow">
                                            <SelectValue placeholder="Select new status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={StatusEnum.Fulfilled}>✓ Fulfilled</SelectItem>
                                            <SelectItem value={StatusEnum.Paid}>⚡ Paid</SelectItem>
                                            <SelectItem value={StatusEnum.Failed}>✕ Failed</SelectItem>
                                            <SelectItem value={StatusEnum.Expired}>⏱ Expired</SelectItem>
                                            <SelectItem value={StatusEnum.Underpaid}>⚠ Underpaid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason" className="text-text-primary">Reason / Notes</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Enter reason for status change..."
                                        value={statusReason}
                                        onChange={(e) => setStatusReason(e.target.value)}
                                        className="input-glow min-h-[100px]"
                                    />
                                </div>
                                {newStatus === StatusEnum.Failed && (
                                    <div className="flex items-start gap-3 p-4 bg-bg-tertiary border border-orange-warning/30 rounded-lg shadow-glow-error">
                                        <AlertTriangle className="h-5 w-5 text-orange-warning mt-0.5 animate-pulse" />
                                        <p className="text-sm text-orange-warning leading-relaxed">
                                            Marking as failed is for logging purposes. If a manual refund was processed, include details in the reason field.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="gap-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setStatusDialogOpen(false)} 
                                    disabled={updateStatusMutation.isPending}
                                    className="hover:border-border-accent transition-colors"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleStatusUpdate} 
                                    disabled={!newStatus || updateStatusMutation.isPending}
                                    className="btn-primary"
                                >
                                    {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Status
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {order.status === 'fulfilled' && (
                        <Button
                            onClick={handleResendKeys}
                            disabled={resendKeysMutation.isPending}
                            className="bg-green-success/10 text-green-success border border-green-success/30 hover:bg-green-success/20 hover:shadow-glow-success transition-all duration-300"
                        >
                            {resendKeysMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="mr-2 h-4 w-4" />
                            )}
                            Resend Keys
                        </Button>
                    )}
                </div>
            </div>

            {/* Order & Payment Info Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Order Info */}
                <Card className="card-interactive-glow border-border-subtle hover:border-border-accent transition-all duration-300">
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Package className="h-5 w-5 text-cyan-glow" />
                            <span className="text-gradient-primary">General Information</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle/50">
                            <span className="text-text-secondary text-sm">Customer Email</span>
                            <span className="font-medium text-text-primary font-mono text-sm">{order.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle/50">
                            <span className="text-text-secondary text-sm">Status</span>
                            <Badge variant={statusBadge.variant} className={statusBadge.className}>
                                {statusBadge.icon}
                                {order.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle/50">
                            <span className="text-text-secondary text-sm">Source Type</span>
                            <Badge
                                className={
                                    order.sourceType === 'custom'
                                        ? 'bg-purple-neon/10 text-purple-neon border-purple-neon/30 shadow-glow-purple-sm'
                                        : 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 shadow-glow-cyan-sm'
                                }
                            >
                                {order.sourceType === 'custom' ? '⚡ Custom' : '🎮 Kinguin'}
                            </Badge>
                        </div>
                        {order.kinguinReservationId && (
                            <div className="flex justify-between items-center py-2 border-b border-border-subtle/50">
                                <span className="text-text-secondary text-sm">Kinguin Reservation</span>
                                <CopyableId id={order.kinguinReservationId} label="Kinguin Reservation ID" className="text-cyan-glow" />
                            </div>
                        )}
                        <div className="flex justify-between items-center py-3 mt-2 bg-bg-tertiary/50 rounded-lg px-3">
                            <span className="text-text-secondary font-medium">Total Amount</span>
                            <span className="crypto-amount text-2xl font-bold text-gradient-primary">
                                €{parseFloat(order.total).toFixed(2)}
                            </span>
                        </div>
                        <div className="border-t border-border-subtle pt-4 space-y-3 mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted flex items-center gap-2 text-xs">
                                    <Clock className="h-3 w-3" /> Created
                                </span>
                                <span className="text-text-secondary text-xs font-mono">{formatDateTime(order.createdAt)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted flex items-center gap-2 text-xs">
                                    <Clock className="h-3 w-3" /> Updated
                                </span>
                                <span className="text-text-secondary text-xs font-mono">{formatDateTime(order.updatedAt)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Info */}
                <Card className="card-interactive-glow border-border-subtle hover:border-border-accent transition-all duration-300">
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CreditCard className="h-5 w-5 text-purple-neon" />
                            <span className="text-gradient-featured">Payment Details</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {/* Order Total - Highlighted */}
                        <div className="flex justify-between items-center py-3 bg-bg-tertiary/50 rounded-lg px-3">
                            <span className="text-text-secondary font-medium flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-purple-neon" />
                                Order Total
                            </span>
                            <span className="crypto-amount text-2xl font-bold text-gradient-featured">
                                €{parseFloat(order.total).toFixed(2)}
                            </span>
                        </div>

                        {/* Payment Method */}
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle/50">
                            <span className="text-text-secondary text-sm">Payment Method</span>
                            <Badge className="bg-purple-neon/10 text-purple-neon border-purple-neon/30">
                                <Zap className="h-3 w-3 mr-1" />
                                Cryptocurrency
                            </Badge>
                        </div>

                        {/* Payment Currency */}
                        {order.payCurrency && (
                            <div className="flex justify-between items-center py-2 border-b border-border-subtle/50">
                                <span className="text-text-secondary text-sm">Payment Currency</span>
                                <Badge className="uppercase font-mono bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 shadow-glow-cyan-sm">
                                    <Hash className="h-3 w-3 mr-1" />
                                    {order.payCurrency}
                                </Badge>
                            </div>
                        )}

                        {/* Payment Status */}
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle/50">
                            <span className="text-text-secondary text-sm">Payment Status</span>
                            <Badge variant={statusBadge.variant} className={statusBadge.className}>
                                {statusBadge.icon}
                                {order.status}
                            </Badge>
                        </div>

                        {/* Payment Provider */}
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle/50">
                            <span className="text-text-secondary text-sm">Payment Provider</span>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-text-primary text-sm">NOWPayments</span>
                                <a 
                                    href="https://nowpayments.io" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-cyan-glow hover:text-cyan-glow/80 transition-colors"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>

                        {/* User ID */}
                        {order.userId && (
                            <div className="flex justify-between items-center py-2 border-b border-border-subtle/50">
                                <span className="text-text-secondary text-sm">User ID</span>
                                <CopyableId id={order.userId} label="User ID" className="text-purple-neon" />
                            </div>
                        )}

                        {/* Transaction Details Note */}
                        <div className="mt-4 p-4 bg-bg-tertiary/30 border border-border-subtle rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-cyan-glow/10 rounded-lg">
                                    <Hash className="h-4 w-4 text-cyan-glow" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-text-primary mb-1">
                                        Transaction Details
                                    </h4>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        Detailed payment information including transaction hash, pay amount, 
                                        and wallet address can be viewed in the{' '}
                                        <Link href="/admin/payments" className="text-cyan-glow hover:underline">
                                            Payments Dashboard
                                        </Link>
                                        {' '}or{' '}
                                        <Link href="/admin/webhooks" className="text-cyan-glow hover:underline">
                                            Webhook Logs
                                        </Link>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Order Items Table */}
            <Card className="card-interactive border-border-subtle" data-section="order-items">
                <CardHeader className="border-b border-border-subtle pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl text-gradient-primary">Order Items</CardTitle>
                            <CardDescription className="text-text-muted mt-1">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''} in this order
                            </CardDescription>
                        </div>
                        <Badge className="badge-info">
                            {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                    <div className="overflow-x-auto scrollbar-thin px-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border-subtle">
                                    <TableHead className="text-text-secondary">Product</TableHead>
                                    <TableHead className="text-center text-text-secondary">Qty</TableHead>
                                    <TableHead className="text-right text-text-secondary">Unit Price</TableHead>
                                    <TableHead className="text-text-secondary">Source</TableHead>
                                    <TableHead className="text-text-secondary">Key Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item, index) => (
                                    <TableRow 
                                        key={item.id} 
                                        className="border-border-subtle hover:bg-bg-tertiary/30 transition-colors duration-200"
                                    >
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-medium text-text-primary">{item.productTitle}</span>
                                                <CopyableId id={item.productId} label="Product ID" className="text-text-muted" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="font-mono border-border-accent">
                                                {item.quantity}×
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="crypto-amount text-text-primary font-semibold">
                                                €{parseFloat(item.unitPrice).toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    item.sourceType === 'custom'
                                                        ? 'bg-purple-neon/10 text-purple-neon border-purple-neon/30 shadow-glow-purple-sm'
                                                        : 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 shadow-glow-cyan-sm'
                                                }
                                            >
                                                {item.sourceType === 'custom' ? '⚡ Custom' : '🎮 Kinguin'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.signedUrl !== null && item.signedUrl !== undefined ? (
                                                <Badge className="badge-success">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Delivered
                                                </Badge>
                                            ) : (
                                                <Badge className="badge-warning">
                                                    <Clock className="mr-1 h-3 w-3" /> Pending
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="h-4" /> {/* Bottom padding for consistency */}
                </CardContent>
            </Card>

            {/* Key Audit Trail */}
            <Card className="card-interactive border-border-subtle">
                <CardHeader className="border-b border-border-subtle pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <History className="h-5 w-5 text-cyan-glow" />
                                <span className="text-gradient-primary">Key Access Audit Trail</span>
                            </CardTitle>
                            <CardDescription className="text-text-muted mt-1">
                                Secure log of all key reveal events, downloads, and access details
                            </CardDescription>
                        </div>
                        {auditTrail && auditTrail.length > 0 && (
                            <Badge className="badge-info">
                                {auditTrail.length} Key{auditTrail.length !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                    {isAuditLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin-glow text-cyan-glow" />
                            <p className="text-text-muted text-sm">Loading audit trail...</p>
                        </div>
                    ) : !auditTrail || auditTrail.length === 0 ? (
                        <div className="empty-state py-8 px-4">
                            <EyeOff className="empty-state-icon text-text-muted" />
                            <h3 className="empty-state-title">No Keys Found</h3>
                            <p className="empty-state-description">
                                Keys will appear here once the order is fulfilled
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto scrollbar-thin px-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border-subtle">
                                        <TableHead className="text-text-secondary">Key ID</TableHead>
                                        <TableHead className="text-text-secondary">Status</TableHead>
                                        <TableHead className="text-text-secondary">Downloads</TableHead>
                                        <TableHead className="text-text-secondary">Last Access</TableHead>
                                        <TableHead className="text-text-secondary">Revealed At</TableHead>
                                        <TableHead className="text-text-secondary">Created At</TableHead>
                                        <TableHead className="text-text-secondary text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {auditTrail.map((entry, index) => {
                                        const extendedEntry = entry as typeof entry & {
                                            orderItemId?: string;
                                            downloadCount?: number;
                                            lastAccessIp?: string;
                                            lastAccessUserAgent?: string;
                                        };
                                        return (
                                            <TableRow 
                                                key={entry.id ?? `audit-${index}`}
                                                className="border-border-subtle hover:bg-bg-tertiary/30 transition-colors duration-200"
                                            >
                                                <TableCell>
                                                    {entry.id ? (
                                                        <CopyableId id={entry.id} label="Key ID" className="text-cyan-glow" truncate />
                                                    ) : (
                                                        <span className="text-text-muted">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {entry.viewed ? (
                                                        <Badge className="badge-success">
                                                            <Eye className="mr-1 h-3 w-3" /> Revealed
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="badge-warning">
                                                            <EyeOff className="mr-1 h-3 w-3" /> Not Viewed
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <Download className="h-3.5 w-3.5 text-text-muted" />
                                                        <span className={`font-mono text-sm ${(extendedEntry.downloadCount ?? 0) > 3 ? 'text-yellow-warning font-semibold' : 'text-text-primary'}`}>
                                                            {extendedEntry.downloadCount ?? 0}
                                                        </span>
                                                        {(extendedEntry.downloadCount ?? 0) > 3 && (
                                                            <span title="Multiple downloads detected">
                                                                <AlertTriangle className="h-3.5 w-3.5 text-yellow-warning" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {extendedEntry.lastAccessIp ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1 text-xs text-text-primary">
                                                                <Globe className="h-3 w-3 text-text-muted" />
                                                                <span className="font-mono">{extendedEntry.lastAccessIp}</span>
                                                            </div>
                                                            {extendedEntry.lastAccessUserAgent && (
                                                                <div className="flex items-center gap-1 text-xs text-text-muted" title={extendedEntry.lastAccessUserAgent}>
                                                                    <Monitor className="h-3 w-3" />
                                                                    <span className="truncate max-w-[120px]">
                                                                        {extendedEntry.lastAccessUserAgent.includes('Chrome') ? 'Chrome' :
                                                                         extendedEntry.lastAccessUserAgent.includes('Firefox') ? 'Firefox' :
                                                                         extendedEntry.lastAccessUserAgent.includes('Safari') ? 'Safari' :
                                                                         extendedEntry.lastAccessUserAgent.includes('Edge') ? 'Edge' :
                                                                         'Unknown Browser'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-text-muted text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {entry.viewedAt ? (
                                                        <span className="font-mono text-xs text-green-success">
                                                            {formatDateTime(entry.viewedAt)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-text-muted text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-text-secondary">
                                                    {formatDateTime(entry.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/50"
                                                        onClick={async () => {
                                                            try {
                                                                // Get token from cookies (same as other admin calls)
                                                                const cookieValue = `; ${document.cookie}`;
                                                                const parts = cookieValue.split('; accessToken=');
                                                                const token = parts.length === 2 ? parts[1]?.split(';')[0] : null;
                                                                
                                                                if (!token) {
                                                                    toast.error('Not authenticated. Please log in again.');
                                                                    return;
                                                                }
                                                                
                                                                const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
                                                                const response = await fetch(`${baseUrl}/admin/keys/${entry.id}/reveal`, {
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                if (!response.ok) {
                                                                    const errData = await response.json().catch(() => ({})) as { message?: string };
                                                                    throw new Error(errData.message ?? 'Failed to reveal key');
                                                                }
                                                                const data = await response.json() as { plainKey?: string; contentType?: string };
                                                                const keyContent = data.plainKey ?? 'Unable to retrieve';
                                                                toast.info(
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="font-semibold">Key Content:</p>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    void navigator.clipboard.writeText(keyContent);
                                                                                    toast.success('Key copied to clipboard!', { duration: 2000 });
                                                                                }}
                                                                                className="px-2 py-1 text-xs bg-accent-primary hover:bg-accent-primary/80 text-black rounded transition-colors"
                                                                            >
                                                                                Copy
                                                                            </button>
                                                                        </div>
                                                                        <code 
                                                                            className="block bg-bg-tertiary p-2 rounded text-xs break-all cursor-pointer select-all hover:bg-bg-tertiary/80 transition-colors"
                                                                            onClick={() => {
                                                                                void navigator.clipboard.writeText(keyContent);
                                                                                toast.success('Key copied to clipboard!', { duration: 2000 });
                                                                            }}
                                                                            title="Click to copy"
                                                                        >
                                                                            {keyContent}
                                                                        </code>
                                                                        <p className="text-xs text-text-muted">
                                                                            Type: {data.contentType ?? 'unknown'} • Click key or button to copy
                                                                        </p>
                                                                    </div>,
                                                                    { duration: 15000 }
                                                                );
                                                            } catch (error) {
                                                                const message = error instanceof Error ? error.message : 'Failed to reveal key';
                                                                toast.error(message);
                                                            }
                                                        }}
                                                    >
                                                        <Key className="h-3 w-3 mr-1" />
                                                        View Key
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <div className="h-4" /> {/* Bottom padding */}
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
