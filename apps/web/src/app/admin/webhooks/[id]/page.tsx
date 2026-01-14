'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminControllerGetWebhookLog200Response } from '@bitloot/sdk';
import { AdminApi } from '@bitloot/sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Loader2, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { toast } from 'sonner';

import { apiConfig } from '@/lib/api-config';

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
                <Loader2 className="h-8 w-8 animate-spin-glow" />
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
                    <h1 className="text-2xl font-bold text-text-primary">Webhook Log not found</h1>
                    <Link href="/admin/webhooks">
                        <Button variant="outline" className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200">
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
                    <Button variant="ghost" size="icon" className="hover:text-cyan-glow hover:bg-bg-tertiary transition-all duration-200">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Webhook Details</h1>
                    <p className="text-text-muted font-mono text-sm">ID: {webhook.id}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => replayMutation.mutate()}
                        disabled={replayMutation.isPending}
                        className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200 disabled:opacity-50"
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
                <Card className="bg-bg-secondary border-border-subtle">
                    <CardHeader>
                        <CardTitle className="text-text-primary">General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Type</span>
                            <Badge className="bg-purple-neon/10 border-purple-neon/30 text-purple-neon">{webhook.webhookType}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">External ID</span>
                            <span className="font-mono text-sm text-text-primary">{webhook.externalId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Payment Status</span>
                            <Badge className="bg-cyan-glow/10 border-cyan-glow/30 text-cyan-glow">{webhook.paymentStatus}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Created At</span>
                            <span className="text-text-primary">{webhook.createdAt !== undefined && webhook.createdAt !== null ? new Date(webhook.createdAt).toLocaleString() : '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Info */}
                {webhook.error !== null && webhook.error !== undefined && (
                    <Card className="border-orange-warning/30 bg-orange-warning/10 shadow-glow-error">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-warning" />
                                <CardTitle className="text-orange-warning">Processing Error</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md bg-bg-tertiary border border-orange-warning/20 p-4">
                                <pre className="whitespace-pre-wrap text-sm text-text-primary font-mono">
                                    {webhook?.error}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Payload */}
            <Card className="bg-bg-secondary border-border-subtle">
                <CardHeader>
                    <CardTitle className="text-text-primary">Payload</CardTitle>
                    <CardDescription className="text-text-secondary">Raw JSON payload received from the provider.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md bg-bg-tertiary border border-border-subtle p-4 overflow-x-auto scrollbar-thin">
                        <pre className="text-sm text-text-primary font-mono">
                            {JSON.stringify(webhook.payload, null, 2)}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
