'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Configuration, UsersApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Input } from '@/design-system/primitives/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/design-system/primitives/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/design-system/primitives/select';
import { Package, ExternalLink, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Initialize SDK configuration
const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') ?? '';
        }
        return '';
    },
});

const usersClient = new UsersApi(apiConfig);

export default function OrdersPage(): React.ReactElement {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch user's orders
    const { data: orders = [], isLoading } = useQuery<OrderResponseDto[]>({
        queryKey: ['my-orders'],
        queryFn: async () => {
            const response = await usersClient.usersControllerGetOrdersRaw();
            if (response.raw.ok) {
                return (await response.raw.json()) as OrderResponseDto[];
            }
            return [];
        },
        enabled: Boolean(user),
    });

    // Client-side filtering and pagination
    const filteredOrders = orders.filter((order) => {
        const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    if (user === null) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Orders</h1>
                    <p className="text-muted-foreground">Manage and track your purchases</p>
                </div>
                <Link href="/catalog">
                    <Button>Browse Store</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Order History</CardTitle>
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Order ID..."
                                    className="pl-9 w-full md:w-[250px]"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex h-60 flex-col items-center justify-center text-muted-foreground">
                            <Package className="mb-4 h-12 w-12 opacity-20" />
                            <p className="text-lg font-medium">No orders found</p>
                            <p className="text-sm">Try adjusting your filters or browse the catalog.</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Total Crypto</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium font-mono text-xs">
                                                {order.id}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{order.total}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        order.status === 'fulfilled'
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
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/orders/${order.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        Details
                                                        <ExternalLink className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-end space-x-2 py-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="text-sm font-medium">
                                        Page {page} of {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
