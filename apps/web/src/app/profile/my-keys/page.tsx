'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Configuration, UsersApi } from '@bitloot/sdk';
import type { OrderResponseDto } from '@bitloot/sdk';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Input } from '@/design-system/primitives/input';
import { Key, Search, Download, Copy, Check, Loader2, Package } from 'lucide-react';
import Link from 'next/link';

// Initialize SDK configuration
const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') || '';
        }
        return '';
    },
});

const usersClient = new UsersApi(apiConfig);

export default function DigitalKeysPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

    // Extract keys from completed orders
    const allKeys = orders
        .filter((order) => order.status === 'fulfilled')
        .flatMap((order) =>
            order.items.map((item) => ({
                ...item,
                orderId: order.id,
                purchaseDate: order.createdAt,
                // Mock key value for now
                keyValue: 'XXXX-XXXX-XXXX-XXXX',
            }))
        );

    const filteredKeys = allKeys.filter((key) =>
        (key.productId || '').toLowerCase().includes(search.toLowerCase())
    );

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (!user) {
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
                    <h1 className="text-3xl font-bold">My Digital Keys</h1>
                    <p className="text-muted-foreground">Access and manage your purchased game keys and software licenses.</p>
                </div>
                <div className="relative w-full md:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search keys..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredKeys.length === 0 ? (
                <div className="flex h-60 flex-col items-center justify-center text-muted-foreground rounded-lg border border-dashed">
                    <Key className="mb-4 h-12 w-12 opacity-20" />
                    <p className="text-lg font-medium">No digital keys found</p>
                    <p className="text-sm mb-4">You haven't purchased any digital products yet.</p>
                    <Link href="/catalog">
                        <Button>Browse Store</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredKeys.map((key, index) => (
                        <Card key={`${key.orderId}-${index}`} className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
                            <CardContent className="p-0">
                                <div className="bg-linear-to-br from-blue-500/10 to-purple-500/10 p-6 flex flex-col items-center justify-center text-center h-40 relative">
                                    <div className="rounded-full bg-background p-3 shadow-sm mb-3">
                                        <Key className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="font-bold line-clamp-2">{key.productId || 'Product Key'}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(key.purchaseDate).toLocaleDateString()}
                                    </p>

                                    <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                                        Active
                                    </Badge>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="rounded-md bg-muted p-2 text-center font-mono text-sm tracking-widest">
                                        {key.keyValue}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => copyToClipboard(key.keyValue)}
                                        >
                                            {copiedKey === key.keyValue ? (
                                                <>
                                                    <Check className="mr-2 h-3 w-3" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="mr-2 h-3 w-3" />
                                                    Copy
                                                </>
                                            )}
                                        </Button>
                                        <Button variant="secondary" size="sm" className="w-full">
                                            <Download className="mr-2 h-3 w-3" />
                                            Save
                                        </Button>
                                    </div>

                                    <Link href={`/orders/${key.orderId}`} className="block">
                                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-6">
                                            View Order Details
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
