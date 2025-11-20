'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminControllerGetWebhookLog200Response } from '@bitloot/sdk';
import { Configuration, AdminApi } from '@bitloot/sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Loader2, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { toast } from 'sonner';

const apiConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    accessToken: (): string => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') ?? '';
        }
        return '';
    },
});

const adminApi = new AdminApi(apiConfig);

export default function AdminWebhookDetailPage(): React.ReactElement | null {
    const params = useParams();
    const id = params.id as string;
    const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
    const queryClient = useQueryClient();

    const { data: webhook, isLoading: isWebhookLoading, refetch } = useQuery<AdminControllerGetWebhookLog200Response>({
        queryKey: ['admin-webhook', id],
        queryFn: async () => {
            return await adminApi.adminControllerGetWebhookLog({ id });
        },
        enabled: isAdmin && Boolean(id),
    });

    const replayMutation = useMutation({
        mutationFn: async () => {
            return await adminApi.adminControllerReplayWebhook({ id });
        },
        onSuccess: () => {
            toast.success('Webhook marked for replay');
            void queryClient.invalidateQueries({ queryKey: ['admin-webhook', id] });
            void refetch();
        },
        onError: (error: Error): void => {
            toast.error(`Failed to replay webhook: ${error.message}`);
        },
    });

    if (isGuardLoading || isWebhookLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return <div />;
    }

    if (webhook === null || webhook === undefined) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <h1 className="text-2xl font-bold">Webhook Log not found</h1>
                    <Link href="/admin/webhooks">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Webhooks
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const _getStatusBadge = (status?: string): React.ReactElement => {
        switch (status) {
            case 'processed':
            case 'completed':
                return <Badge className="bg-green-500">Processed</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>;
            default:
                return <Badge variant="outline">{status ?? 'Unknown'}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/webhooks">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Webhook Details</h1>
                    <p className="text-muted-foreground">ID: {webhook.id}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => replayMutation.mutate()}
                        disabled={replayMutation.isPending}
                    >
                        {replayMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Replay Webhook
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* General Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <Badge variant="outline">{webhook.webhookType}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">External ID</span>
                            <span className="font-mono text-sm">{webhook.externalId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Status</span>
                            <Badge variant="outline">{webhook.paymentStatus}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Created At</span>
                            <span>{webhook.createdAt ? new Date(webhook.createdAt).toLocaleString() : '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Info */}
                {webhook?.error != null && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <CardTitle className="text-red-700">Processing Error</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <pre className="whitespace-pre-wrap text-sm text-red-800 font-mono">
                                {webhook?.error}
                            </pre>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Payload */}
            <Card>
                <CardHeader>
                    <CardTitle>Payload</CardTitle>
                    <CardDescription>Raw JSON payload received from the provider.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md bg-slate-950 p-4 overflow-x-auto">
                        <pre className="text-sm text-slate-50 font-mono">
                            {JSON.stringify(webhook.payload, null, 2)}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
