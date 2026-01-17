'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/design-system/primitives/table';
import { apiConfig } from '@/lib/api-config';
import { AdminPromosApi } from '@bitloot/sdk';
import type { PaginatedRedemptionsDto } from '@bitloot/sdk';

const adminPromosClient = new AdminPromosApi(apiConfig);

interface PromoRedemptionsViewProps {
    promoId: string;
    promoCode: string;
    onBack: () => void;
}

async function fetchRedemptions(promoId: string, page: number): Promise<PaginatedRedemptionsDto> {
    return adminPromosClient.adminPromosControllerGetRedemptions({
        id: promoId,
        page,
        limit: 20,
    });
}

export function PromoRedemptionsView({ promoId, promoCode, onBack }: PromoRedemptionsViewProps): React.ReactElement {
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-promo-redemptions', promoId, page],
        queryFn: () => fetchRedemptions(promoId, page),
    });

    const handleExportCSV = (): void => {
        if (data === undefined || data.data.length === 0) return;

        const headers = ['Date', 'Order ID', 'Email', 'Original Total', 'Discount', 'Final Total'];
        const rows = data.data.map((r) => [
            format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm'),
            r.orderId,
            r.email,
            `€${parseFloat(r.originalTotal).toFixed(2)}`,
            `€${parseFloat(r.discountApplied).toFixed(2)}`,
            `€${parseFloat(r.finalTotal).toFixed(2)}`,
        ]);

        const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promo-${promoCode}-redemptions.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Calculate totals
    const totalDiscountGiven = data?.data.reduce(
        (sum, r) => sum + parseFloat(r.discountApplied),
        0
    ) ?? 0;

    if (error !== null && error !== undefined) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Promo Codes
                </Button>
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    Failed to load redemptions: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h2 className="text-xl font-semibold">Redemptions for {promoCode}</h2>
                        <p className="text-sm text-muted-foreground">
                            {data?.total ?? 0} total redemptions • €{totalDiscountGiven.toFixed(2)} total discounts given
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleExportCSV} disabled={data?.data.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Original</TableHead>
                            <TableHead className="text-right">Discount</TableHead>
                            <TableHead className="text-right">Final</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : data?.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No redemptions yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data.map((redemption) => (
                                <TableRow key={redemption.id}>
                                    <TableCell>
                                        {format(new Date(redemption.createdAt), 'MMM d, yyyy HH:mm')}
                                    </TableCell>
                                    <TableCell>
                                        <a
                                            href={`/admin/orders/${redemption.orderId}`}
                                            className="font-mono text-sm text-primary hover:underline"
                                        >
                                            {redemption.orderId.slice(0, 8)}...
                                        </a>
                                    </TableCell>
                                    <TableCell>{redemption.email}</TableCell>
                                    <TableCell className="text-right">
                                        €{parseFloat(redemption.originalTotal).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                                        -€{parseFloat(redemption.discountApplied).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        €{parseFloat(redemption.finalTotal).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data !== undefined && data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {data.data.length} of {data.total} redemptions
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-3 text-sm">
                            Page {page} of {data.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                            disabled={page === data.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
