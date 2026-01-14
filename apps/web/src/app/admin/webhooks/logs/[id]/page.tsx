'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/design-system/primitives/tabs';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Separator } from '@/design-system/primitives/separator';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  Loader2,
  Clock,
  Hash,
  Server,
  Package,
  CreditCard,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { useWebhookDetail } from '@/features/admin/hooks/useWebhookDetail';
import { useWebhookReplay } from '@/features/admin/hooks/useWebhookBulkReplay';
import {
  WebhookStatusBadge,
  WebhookTypeBadge,
  SignatureIndicator,
  WebhookPayloadViewer,
  PaymentStatusBadge,
  DuplicateBadge,
} from '@/features/admin/components/webhooks';

export default function AdminWebhookDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const webhookId = params.id as string;

  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
  const { webhook, adjacent, isLoading, error, refetch } = useWebhookDetail({
    id: webhookId,
    refetchInterval: 15000, // Auto-refresh every 15 seconds (detail page)
  });
  const { replay, isReplaying } = useWebhookReplay();

  const handleReplay = async () => {
    try {
      await replay(webhookId);
      toast.success('Webhook replayed successfully');
      refetch();
    } catch (err) {
      toast.error('Failed to replay webhook');
    }
  };

  const navigateToPrevious = () => {
    if (adjacent?.previousId) {
      router.push(`/admin/webhooks/logs/${adjacent.previousId}`);
    }
  };

  const navigateToNext = () => {
    if (adjacent?.nextId) {
      router.push(`/admin/webhooks/logs/${adjacent.nextId}`);
    }
  };

  if (isGuardLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin-glow" />
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-12 w-12 text-orange-warning" />
        <h2 className="text-xl font-semibold text-text-primary">Failed to load webhook</h2>
        <p className="text-text-secondary">{error.message}</p>
        <Button variant="outline" onClick={() => router.push('/admin/webhooks/logs')} className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Logs
        </Button>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-12 w-12 text-text-muted" />
        <h2 className="text-xl font-semibold text-text-primary">Webhook not found</h2>
        <Button variant="outline" onClick={() => router.push('/admin/webhooks/logs')} className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Logs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="hover:text-cyan-glow hover:bg-bg-tertiary transition-all duration-200">
            <Link href="/admin/webhooks/logs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Logs
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToPrevious}
            disabled={!adjacent?.previousId}
            className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm disabled:opacity-50 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToNext}
            disabled={!adjacent?.nextId}
            className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm disabled:opacity-50 transition-all duration-200"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <Card className="bg-bg-secondary border-border-subtle shadow-card-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <WebhookTypeBadge type={webhook.webhookType} size="lg" />
              <div>
                <CardTitle className="flex items-center gap-3 text-text-primary">
                  <span className="font-mono text-lg">{webhook.id.slice(0, 8)}...</span>
                  <WebhookStatusBadge
                    processed={webhook.processed}
                    signatureValid={webhook.signatureValid ?? false}
                    error={webhook.error ?? undefined}
                  />
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2 text-text-secondary">
                  <Clock className="h-4 w-4" />
                  {format(new Date(webhook.createdAt), 'PPpp')}
                  <span className="text-text-muted">·</span>
                  {formatDistanceToNow(new Date(webhook.createdAt), { addSuffix: true })}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetch()} className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleReplay} disabled={isReplaying} className="btn-primary disabled:opacity-50">
                <RotateCcw className={`h-4 w-4 mr-2 ${isReplaying ? 'animate-spin-glow' : ''}`} />
                Replay Webhook
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* External ID */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Hash className="h-4 w-4" />
                External ID
              </div>
              <p className="font-mono text-sm text-text-primary">
                {webhook.externalId ?? <span className="text-text-muted">—</span>}
              </p>
            </div>

            {/* Signature */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Server className="h-4 w-4" />
                HMAC Signature
              </div>
              <SignatureIndicator valid={webhook.signatureValid} showLabel />
            </div>

            {/* Payment Status */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <CreditCard className="h-4 w-4" />
                Payment Status
              </div>
              {webhook.paymentStatus ? (
                <PaymentStatusBadge status={webhook.paymentStatus} />
              ) : (
                <span className="text-text-muted text-sm">—</span>
              )}
            </div>

            {/* Attempt Count */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <RefreshCw className="h-4 w-4" />
                Attempt Count
              </div>
              <Badge variant={webhook.attemptCount > 1 ? 'secondary' : 'outline'} className="bg-purple-neon/10 border-purple-neon/30 text-purple-neon">
                {webhook.attemptCount} attempt{webhook.attemptCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Order Link */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Package className="h-4 w-4" />
                Order
              </div>
              {webhook.orderId ? (
                <Link
                  href={`/admin/orders/${webhook.orderId}`}
                  className="flex items-center gap-1 font-mono text-sm text-cyan-glow hover:text-pink-featured hover:underline transition-colors duration-200"
                >
                  {webhook.orderId.slice(0, 8)}...
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <span className="text-text-muted text-sm">—</span>
              )}
            </div>

            {/* Payment ID */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <CreditCard className="h-4 w-4" />
                Payment ID
              </div>
              {webhook.paymentId ? (
                <Link
                  href={`/admin/payments/${webhook.paymentId}`}
                  className="flex items-center gap-1 font-mono text-sm text-cyan-glow hover:text-pink-featured hover:underline transition-colors duration-200"
                >
                  {webhook.paymentId.slice(0, 8)}...
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <span className="text-text-muted text-sm">—</span>
              )}
            </div>

            {/* Source IP */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Globe className="h-4 w-4" />
                Source IP
              </div>
              <p className="font-mono text-sm text-text-primary">
                {webhook.sourceIp ?? <span className="text-text-muted">—</span>}
              </p>
            </div>

            {/* Duplicate Indicator */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Hash className="h-4 w-4" />
                Duplicate
              </div>
              <DuplicateBadge isDuplicate={webhook.attemptCount > 1} />
            </div>
          </div>

          {/* Error Message */}
          {webhook.error && (
            <>
              <Separator className="my-6" />
              <div className="p-4 border border-orange-warning/30 bg-orange-warning/10 rounded-lg shadow-glow-error">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-warning mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-warning">Error</h4>
                    <p className="text-sm text-text-primary mt-1 font-mono bg-bg-tertiary px-2 py-1 rounded border border-orange-warning/20">{webhook.error}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payload and Result Tabs */}
      <Card className="bg-bg-secondary border-border-subtle shadow-card-md">
        <CardHeader>
          <CardTitle className="text-text-primary">Webhook Data</CardTitle>
          <CardDescription className="text-text-secondary">View the raw payload and processing result</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="payload" className="w-full">
            <TabsList>
              <TabsTrigger value="payload">Request Payload</TabsTrigger>
              <TabsTrigger value="result">Processing Result</TabsTrigger>
            </TabsList>

            <TabsContent value="payload" className="mt-4">
              <WebhookPayloadViewer
                payload={webhook.payload}
                title="Request Payload"
              />
            </TabsContent>

            <TabsContent value="result" className="mt-4">
              {webhook.result ? (
                <WebhookPayloadViewer
                  payload={webhook.result}
                  title="Processing Result"
                />
              ) : (
                <div className="p-8 text-center text-text-muted border border-border-subtle rounded-lg bg-bg-tertiary/30">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-text-primary">No processing result available</p>
                  <p className="text-sm mt-1">
                    This webhook may not have been processed yet
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Timeline / Related Webhooks */}
      {webhook.orderId && (
        <Card className="bg-bg-secondary border-border-subtle shadow-card-md">
          <CardHeader>
            <CardTitle className="text-text-primary">Related Webhooks</CardTitle>
            <CardDescription className="text-text-secondary">
              Other webhooks related to order {webhook.orderId.slice(0, 8)}...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200">
                <Link href={`/admin/webhooks/logs?orderId=${webhook.orderId}`}>
                  <Package className="h-4 w-4 mr-2" />
                  View All Webhooks for This Order
                </Link>
              </Button>
              <Button variant="outline" asChild className="hover:text-cyan-glow hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-200">
                <Link href={`/admin/orders/${webhook.orderId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Order Details
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
