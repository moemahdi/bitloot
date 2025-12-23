'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Configuration, UsersApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import { Button } from '@/design-system/primitives/button';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/design-system/primitives/select';
import { Package, Search, Loader2, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { OrderHistoryCard } from '@/components/dashboard/OrderHistoryCard';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedGridPattern } from '@/components/animations/FloatingParticles';

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
    const itemsPerPage = 9; // Adjusted for grid layout (3x3)

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
                <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-bg-primary">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <AnimatedGridPattern />
                <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-purple-glow/10 blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-glow/10 blur-[100px]" />
            </div>

            <div className="container relative z-10 mx-auto py-12 space-y-8 px-4">
                {/* Header */}
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <h1 className="font-display text-4xl font-bold tracking-tight text-text-primary drop-shadow-[0_0_15px_rgba(0,217,255,0.3)]">
                            My Orders
                        </h1>
                        <p className="text-text-secondary text-lg">
                            Track your digital loot and purchase history
                        </p>
                    </div>
                    <Link href="/catalog">
                        <GlowButton variant="primary" size="lg" glowColor="purple">
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            Browse Store
                        </GlowButton>
                    </Link>
                </div>

                {/* Filters & Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="rounded-xl border border-cyan-glow/20 bg-bg-secondary/50 p-4 backdrop-blur-md shadow-[0_0_20px_rgba(0,217,255,0.05)]"
                >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 text-cyan-glow font-medium">
                            <Package className="h-5 w-5" />
                            <span>{filteredOrders.length} Orders Found</span>
                        </div>

                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-glow/50" />
                                <Input
                                    placeholder="Search by Order ID..."
                                    className="pl-10 w-full md:w-[300px] border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px] border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20">
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent className="border-cyan-glow/20 bg-bg-secondary/95 backdrop-blur-xl">
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </motion.div>

                {/* Content Grid */}
                <div className="min-h-[400px]">
                    {isLoading ? (
                        <div className="flex h-60 items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-cyan-glow drop-shadow-[0_0_10px_rgba(0,217,255,0.5)]" />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex h-80 flex-col items-center justify-center text-center rounded-2xl border border-dashed border-cyan-glow/20 bg-bg-secondary/30"
                        >
                            <div className="rounded-full bg-bg-tertiary p-6 mb-4 shadow-[0_0_20px_rgba(0,217,255,0.1)]">
                                <Package className="h-12 w-12 text-text-muted opacity-50" />
                            </div>
                            <p className="text-xl font-bold text-text-primary mb-2">No orders found</p>
                            <p className="text-text-secondary max-w-md">
                                We couldn't find any orders matching your criteria. Try adjusting your filters or browse our catalog to make your first purchase!
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <AnimatePresence mode="popLayout">
                                    {paginatedOrders.map((order, index) => (
                                        <OrderHistoryCard
                                            key={order.id}
                                            order={order}
                                            index={index}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center justify-center space-x-4 py-8"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="border-cyan-glow/20 hover:bg-cyan-glow/10 hover:text-cyan-glow disabled:opacity-30"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <div className="text-sm font-medium text-text-secondary">
                                        Page <span className="text-cyan-glow font-bold">{page}</span> of {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="border-cyan-glow/20 hover:bg-cyan-glow/10 hover:text-cyan-glow disabled:opacity-30"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
