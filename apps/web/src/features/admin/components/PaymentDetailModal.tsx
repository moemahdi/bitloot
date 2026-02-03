'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/design-system/primitives/tabs';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Separator } from '@/design-system/primitives/separator';
import { Progress } from '@/design-system/primitives/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  Copy,
  ExternalLink,
  RefreshCw,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Wallet,
  Hash,
  Mail,
  DollarSign,
  Bitcoin,
  ArrowRight,
  Loader2,
  History,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/utils/format-date';
import { toast } from 'sonner';
import { usePaymentWebhookLogs } from '@/features/admin/hooks/usePaymentWebhookLogs';
import {
  useUpdatePaymentStatus,
  OVERRIDE_STATUSES,
  STATUS_LABELS,
  STATUS_DESCRIPTIONS,
  type OverrideStatusType,
} from '@/features/admin/hooks/useUpdatePaymentStatus';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/design-system/primitives/alert-dialog';
import { Textarea } from '@/design-system/primitives/textarea';
import { Label } from '@/design-system/primitives/label';

// Extended Payment interface with full NOWPayments data
export interface PaymentDetail {
  // Core identifiers
  id: string;
  externalId: string;
  orderId: string;
  
  // Amounts
  priceAmount: string;
  priceCurrency: string;
  payAmount: string;
  payCurrency: string;
  actuallyPaid?: string;
  
  // Status
  status: string;
  provider: string;
  
  // Transaction details
  payAddress?: string;
  txHash?: string;
  networkConfirmations?: number;
  requiredConfirmations?: number;
  
  // Customer info
  customerEmail?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  
  // Additional fields
  isUnderpaid?: boolean;
  underpaidAmount?: string;
  isOverpaid?: boolean;
  overpaidAmount?: string;
  refundedAmount?: string;
  refundedAt?: string;
}

interface PaymentDetailModalProps {
  payment: PaymentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: (paymentId: string) => Promise<void>;
}

/**
 * Get neon badge class for payment status
 */
function getPaymentStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'finished':
    case 'confirmed':
      return 'bg-green-success/20 text-green-success border border-green-success/30';
    case 'waiting':
    case 'sending':
      return 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30';
    case 'confirming':
      return 'bg-orange-warning/20 text-orange-warning border border-orange-warning/30';
    case 'failed':
    case 'expired':
      return 'bg-destructive/20 text-destructive border border-destructive/30';
    case 'refunded':
      return 'bg-purple-neon/20 text-purple-neon border border-purple-neon/30';
    case 'partially_paid':
      return 'bg-orange-warning/20 text-orange-warning border border-orange-warning/30';
    default:
      return 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30';
  }
}

/**
 * Get status icon component
 */
function StatusIcon({ status }: { status: string }): React.ReactElement {
  switch (status.toLowerCase()) {
    case 'finished':
    case 'confirmed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'waiting':
    case 'sending':
      return <Clock className="h-4 w-4" />;
    case 'confirming':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'failed':
    case 'expired':
      return <XCircle className="h-4 w-4" />;
    case 'refunded':
      return <DollarSign className="h-4 w-4" />;
    case 'partially_paid':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Zap className="h-4 w-4" />;
  }
}

/**
 * Get blockchain explorer URL based on currency
 */
function getExplorerUrl(currency: string, txHash: string): string {
  const explorers: Record<string, string> = {
    btc: `https://blockstream.info/tx/${txHash}`,
    eth: `https://etherscan.io/tx/${txHash}`,
    ltc: `https://blockchair.com/litecoin/transaction/${txHash}`,
    usdt: `https://etherscan.io/tx/${txHash}`,
    trx: `https://tronscan.org/#/transaction/${txHash}`,
    xrp: `https://xrpscan.com/tx/${txHash}`,
    doge: `https://dogechain.info/tx/${txHash}`,
    bnb: `https://bscscan.com/tx/${txHash}`,
    sol: `https://solscan.io/tx/${txHash}`,
    matic: `https://polygonscan.com/tx/${txHash}`,
  };
  
  const lowerCurrency = currency.toLowerCase();
  if (explorers[lowerCurrency] !== undefined) {
    return explorers[lowerCurrency];
  }
  
  // Default to BTC explorer as fallback
  return `https://blockchair.com/search?q=${txHash}`;
}

/**
 * Copy text to clipboard with toast notification
 */
async function copyToClipboard(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch {
    toast.error('Failed to copy to clipboard');
  }
}

/**
 * Format fiat amount with 2 decimal places and EUR symbol
 */
function formatFiatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '€0.00';
  return `€${num.toFixed(2)}`;
}

/**
 * Format crypto amount with 8 decimal places
 */
function formatCryptoAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00000000';
  return num.toFixed(8);
}

/**
 * Payment detail modal component
 * Shows comprehensive payment information in tabbed layout
 */
export function PaymentDetailModal({
  payment,
  open,
  onOpenChange,
  onRefresh,
}: PaymentDetailModalProps): React.ReactElement {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOverrideStatus, setSelectedOverrideStatus] = useState<OverrideStatusType | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  // Hook to fetch IPN webhook logs for this payment
  const { logs: ipnLogs, isLoading: ipnLoading } = usePaymentWebhookLogs({
    paymentId: payment?.id ?? '',
    enabled: open && payment !== null,
  });

  // Hook for manual status override
  const updateStatusMutation = useUpdatePaymentStatus();

  if (payment === null) {
    return <Dialog open={false} />;
  }

  // Check if payment status can be overridden (not already finalized)
  const canOverrideStatus = !['finished', 'failed'].includes(payment.status);

  const handleStatusOverride = async (): Promise<void> => {
    if (selectedOverrideStatus === null || overrideReason.length < 10) {
      console.warn('[PaymentDetailModal] handleStatusOverride: validation failed', {
        selectedOverrideStatus,
        reasonLength: overrideReason.length,
      });
      return;
    }
    
    console.info('[PaymentDetailModal] handleStatusOverride: starting mutation', {
      paymentId: payment.id,
      status: selectedOverrideStatus,
      reason: overrideReason,
    });

    try {
      await updateStatusMutation.mutateAsync({
        paymentId: payment.id,
        status: selectedOverrideStatus,
        reason: overrideReason,
      });

      console.info('[PaymentDetailModal] handleStatusOverride: mutation succeeded');

      // Reset form and close dialog
      setSelectedOverrideStatus(null);
      setOverrideReason('');
      setOverrideDialogOpen(false); // Close the AlertDialog

      // Refresh payment data
      if (onRefresh !== undefined) {
        await onRefresh(payment.id);
      }
    } catch (error) {
      console.error('[PaymentDetailModal] handleStatusOverride: mutation failed', error);
      // Dialog stays open on error so user can retry
    }
  };

  const handleRefresh = async (): Promise<void> => {
    if (onRefresh === undefined) return;
    setIsRefreshing(true);
    try {
      await onRefresh(payment.id);
      toast.success('Payment status refreshed');
    } catch {
      toast.error('Failed to refresh payment status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const confirmationProgress = 
    payment.requiredConfirmations !== undefined && payment.requiredConfirmations > 0
      ? Math.min(((payment.networkConfirmations ?? 0) / payment.requiredConfirmations) * 100, 100)
      : 0;

  const isExpired = 
    payment.expiresAt !== undefined && 
    new Date(payment.expiresAt) < new Date() &&
    payment.status === 'waiting';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-bg-secondary border-border-subtle">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                <CreditCard className="h-5 w-5 text-cyan-glow" />
              </div>
              <div>
                <DialogTitle className="text-text-primary text-lg">
                  Payment Details
                </DialogTitle>
                <DialogDescription className="text-text-secondary flex items-center gap-2">
                  <span className="text-text-muted text-xs">Order:</span>
                  <code className="text-cyan-glow text-xs font-mono bg-cyan-glow/10 px-2 py-0.5 rounded">
                    {payment.orderId.slice(0, 16)}...
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-cyan-glow/20 hover:text-cyan-glow"
                    onClick={() => void copyToClipboard(payment.orderId, 'Order ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getPaymentStatusBadgeClass(payment.status)} gap-1`}>
                <StatusIcon status={payment.status} />
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4 bg-bg-tertiary">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              Overview
            </TabsTrigger>
            <TabsTrigger value="transaction" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              Transaction
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="ipn-history" className="data-[state=active]:bg-cyan-glow/20 data-[state=active]:text-cyan-glow">
              IPN History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Amount Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
                  <DollarSign className="h-4 w-4" />
                  Price Amount
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {formatFiatAmount(payment.priceAmount)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
                  <Bitcoin className="h-4 w-4" />
                  Crypto Amount
                </div>
                <div className="text-2xl font-bold text-cyan-glow">
                  {formatCryptoAmount(payment.payAmount)} <span className="text-sm text-text-secondary">{payment.payCurrency.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Actually Paid (if different) */}
            {payment.actuallyPaid !== undefined && payment.actuallyPaid !== payment.payAmount && (
              <div className="p-4 rounded-lg bg-orange-warning/10 border border-orange-warning/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Actually Paid</span>
                  </div>
                  <span className="text-xl font-bold text-orange-warning">
                    {formatCryptoAmount(payment.actuallyPaid)} {payment.payCurrency.toUpperCase()}
                  </span>
                </div>
                {payment.isUnderpaid === true && payment.underpaidAmount !== undefined && (
                  <p className="text-sm text-orange-warning/80 mt-2">
                    Underpaid by {formatCryptoAmount(payment.underpaidAmount)} {payment.payCurrency.toUpperCase()}
                  </p>
                )}
                {payment.isOverpaid === true && payment.overpaidAmount !== undefined && (
                  <p className="text-sm text-green-success mt-2">
                    Overpaid by {formatCryptoAmount(payment.overpaidAmount)} {payment.payCurrency.toUpperCase()}
                  </p>
                )}
              </div>
            )}

            {/* Payment & Order IDs */}
            <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Hash className="h-4 w-4" />
                  Payment ID (Internal)
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-text-primary font-mono text-sm">{payment.id}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-cyan-glow/20 hover:text-cyan-glow"
                    onClick={() => void copyToClipboard(payment.id, 'Payment ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <ExternalLink className="h-4 w-4" />
                  External ID (NOWPayments)
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-text-primary font-mono text-sm">{payment.externalId}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-cyan-glow/20 hover:text-cyan-glow"
                    onClick={() => void copyToClipboard(payment.externalId, 'External ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {payment.customerEmail !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail className="h-4 w-4" />
                    Customer Email
                  </div>
                  <span className="text-text-primary">{payment.customerEmail}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Zap className="h-4 w-4" />
                  Provider
                </div>
                <Badge variant="outline" className="border-cyan-glow/30 text-cyan-glow capitalize">
                  {payment.provider}
                </Badge>
              </div>
            </div>

            {/* Expiration Warning */}
            {isExpired && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Payment Expired</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  This payment window has expired. The customer needs to create a new payment.
                </p>
              </div>
            )}

            {/* Refund Info */}
            {payment.refundedAmount !== undefined && (
              <div className="p-4 rounded-lg bg-purple-neon/10 border border-purple-neon/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-neon">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">Refunded Amount</span>
                  </div>
                  <span className="text-xl font-bold text-purple-neon">
                    {formatCryptoAmount(payment.refundedAmount)} {payment.payCurrency.toUpperCase()}
                  </span>
                </div>
                {payment.refundedAt !== undefined && (
                  <p className="text-sm text-purple-neon/80 mt-1">
                    Refunded on {formatDate(payment.refundedAt, 'datetime')}
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Transaction Tab */}
          <TabsContent value="transaction" className="mt-4 space-y-4">
            {/* Payment Address */}
            {payment.payAddress !== undefined && (
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <Wallet className="h-4 w-4" />
                    Payment Address
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 hover:bg-cyan-glow/20 hover:text-cyan-glow"
                    onClick={() => void copyToClipboard(payment.payAddress ?? '', 'Payment address')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <code className="text-cyan-glow font-mono text-sm break-all">
                  {payment.payAddress}
                </code>
              </div>
            )}

            {/* Transaction Hash */}
            {payment.txHash !== undefined && (
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <Hash className="h-4 w-4" />
                    Transaction Hash
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 hover:bg-cyan-glow/20 hover:text-cyan-glow"
                      onClick={() => void copyToClipboard(payment.txHash ?? '', 'Transaction hash')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <a
                      href={getExplorerUrl(payment.payCurrency, payment.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-glow hover:text-cyan-glow/80 text-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on Explorer
                    </a>
                  </div>
                </div>
                <code className="text-green-success font-mono text-sm break-all">
                  {payment.txHash}
                </code>
              </div>
            )}

            {/* Network Confirmations */}
            {payment.requiredConfirmations !== undefined && payment.requiredConfirmations > 0 && (
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Network Confirmations
                  </div>
                  <span className="text-text-primary font-medium">
                    {payment.networkConfirmations ?? 0} / {payment.requiredConfirmations}
                  </span>
                </div>
                <Progress value={confirmationProgress} className="h-2" />
                {confirmationProgress >= 100 && (
                  <p className="text-sm text-green-success mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Transaction fully confirmed
                  </p>
                )}
              </div>
            )}

            {/* External ID */}
            <div className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <Zap className="h-4 w-4" />
                  External Payment ID (NOWPayments)
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-text-primary font-mono text-sm">{payment.externalId}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-cyan-glow/20 hover:text-cyan-glow"
                    onClick={() => void copyToClipboard(payment.externalId, 'External ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* No Transaction Yet */}
            {payment.txHash === undefined && payment.status === 'waiting' && (
              <div className="p-6 text-center rounded-lg bg-bg-tertiary border border-border-subtle">
                <Clock className="h-8 w-8 text-text-muted mx-auto mb-2" />
                <p className="text-text-secondary">Waiting for customer to send crypto</p>
                {payment.expiresAt !== undefined && (
                  <p className="text-sm text-text-muted mt-1">
                    Expires {formatRelativeTime(payment.expiresAt)}
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-4">
            <div className="space-y-4">
              {/* Created */}
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-glow/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-cyan-glow" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">Payment Created</span>
                    <span className="text-sm text-text-secondary">
                      {formatDate(payment.createdAt, 'datetime')}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    Payment request created for {formatFiatAmount(payment.priceAmount)}
                  </p>
                </div>
              </div>

              <Separator className="bg-border-subtle" />

              {/* Transaction Detected */}
              {payment.txHash !== undefined && (
                <>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-orange-warning/20 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-orange-warning" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text-primary">Transaction Detected</span>
                        <span className="text-sm text-text-secondary">
                          {payment.updatedAt !== undefined
                            ? formatDate(payment.updatedAt, 'datetime')
                            : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        Received {formatCryptoAmount(payment.actuallyPaid ?? payment.payAmount)} {payment.payCurrency.toUpperCase()} from customer
                      </p>
                    </div>
                  </div>
                  <Separator className="bg-border-subtle" />
                </>
              )}

              {/* Current Status */}
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  payment.status === 'finished' || payment.status === 'confirmed'
                    ? 'bg-green-success/20'
                    : payment.status === 'failed' || payment.status === 'expired'
                    ? 'bg-destructive/20'
                    : 'bg-orange-warning/20'
                }`}>
                  <StatusIcon status={payment.status} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary capitalize">
                      {payment.status === 'finished' ? 'Payment Completed' : payment.status}
                    </span>
                    <Badge className={getPaymentStatusBadgeClass(payment.status)}>
                      Current
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    {payment.status === 'finished' && 'Payment has been successfully completed and confirmed on the network.'}
                    {payment.status === 'confirming' && `Waiting for ${payment.requiredConfirmations ?? 2} network confirmations...`}
                    {payment.status === 'waiting' && 'Waiting for customer to send crypto to the payment address.'}
                    {payment.status === 'failed' && 'Payment failed or was cancelled.'}
                    {payment.status === 'expired' && 'Payment window expired before receiving funds.'}
                    {payment.status === 'refunded' && 'Payment has been refunded to the customer.'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* IPN History Tab */}
          <TabsContent value="ipn-history" className="mt-4">
            <div className="space-y-4">
              {ipnLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-glow" />
                  <span className="ml-2 text-text-secondary">Loading IPN history...</span>
                </div>
              ) : ipnLogs.length === 0 ? (
                <div className="p-6 text-center rounded-lg bg-bg-tertiary border border-border-subtle">
                  <History className="h-8 w-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text-secondary">No IPN webhooks received yet</p>
                  <p className="text-sm text-text-muted mt-1">
                    Webhooks will appear here as NOWPayments sends payment status updates
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ipnLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-lg bg-bg-tertiary border border-border-subtle"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getPaymentStatusBadgeClass(log.paymentStatus)}>
                            {log.paymentStatus}
                          </Badge>
                          {log.webhookType === 'admin_status_override' && (
                            <Badge className="bg-purple-neon/20 text-purple-neon border border-purple-neon/30">
                              Admin Override
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-text-secondary">
                          {formatDate(log.createdAt, 'datetime')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <span className="text-text-muted">Signature</span>
                          <div className="flex items-center gap-1 mt-1">
                            {log.signatureValid ? (
                              <>
                                <ShieldCheck className="h-4 w-4 text-green-success" />
                                <span className="text-green-success">Valid</span>
                              </>
                            ) : (
                              <>
                                <ShieldX className="h-4 w-4 text-destructive" />
                                <span className="text-destructive">Invalid</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-text-muted">Processed</span>
                          <div className="flex items-center gap-1 mt-1">
                            {log.processed ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-success" />
                                <span className="text-green-success">Yes</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-orange-warning" />
                                <span className="text-orange-warning">Pending</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-text-muted">External ID</span>
                          <div className="font-mono text-xs text-text-secondary mt-1 truncate">
                            {log.externalId.slice(0, 20)}...
                          </div>
                        </div>
                      </div>
                      
                      {log.error !== undefined && log.error.length > 0 && (
                        <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/30">
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <XCircle className="h-4 w-4" />
                            <span className="font-medium">Error:</span>
                            <span>{log.error}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions Footer */}
        <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow"
                    onClick={() => void copyToClipboard(payment.id, 'Payment ID')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy ID
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy payment ID to clipboard</TooltipContent>
              </Tooltip>
              
              {payment.payAddress !== undefined && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow"
                      onClick={() => void copyToClipboard(payment.payAddress ?? '', 'Address')}
                    >
                      <Wallet className="h-4 w-4 mr-1" />
                      Copy Address
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy payment address</TooltipContent>
                </Tooltip>
              )}
              
              {payment.txHash !== undefined && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={getExplorerUrl(payment.payCurrency, payment.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border-subtle hover:border-green-success/50 hover:text-green-success"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Explorer
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>View transaction on blockchain explorer</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>

          <div className="flex items-center gap-2">
            {/* Status Override Button - only show for non-finalized payments */}
            {canOverrideStatus && (
              <AlertDialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-warning/50 text-orange-warning hover:bg-orange-warning/10"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Override Status
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-bg-secondary border-border-subtle max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-text-primary flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-warning" />
                      Manual Status Override
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-text-secondary">
                      Use this to manually change the payment status when automatic detection fails.
                      This action is logged for audit purposes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-4 py-4">
                    {/* Current Status */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary">
                      <span className="text-sm text-text-secondary">Current Status:</span>
                      <Badge className={getPaymentStatusBadgeClass(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>

                    {/* Status Selection */}
                    <div className="space-y-2">
                      <Label className="text-text-primary">New Status</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {OVERRIDE_STATUSES.map((status) => (
                          <Button
                            key={status}
                            variant={selectedOverrideStatus === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedOverrideStatus(status)}
                            className={selectedOverrideStatus === status
                              ? getPaymentStatusBadgeClass(status)
                              : 'border-border-subtle'
                            }
                            disabled={status === payment.status}
                          >
                            {STATUS_LABELS[status]}
                          </Button>
                        ))}
                      </div>
                      {selectedOverrideStatus !== null && (
                        <p className="text-xs text-text-muted mt-1">
                          {STATUS_DESCRIPTIONS[selectedOverrideStatus]}
                        </p>
                      )}
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-2">
                      <Label className="text-text-primary">
                        Reason <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        placeholder="Enter reason for status change (min 10 characters)..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="min-h-[80px] bg-bg-tertiary border-border-subtle"
                      />
                      <p className="text-xs text-text-muted">
                        {overrideReason.length}/10 characters minimum
                      </p>
                    </div>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border-subtle">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault(); // Prevent AlertDialog from auto-closing
                        void handleStatusOverride();
                      }}
                      disabled={
                        selectedOverrideStatus === null ||
                        overrideReason.length < 10 ||
                        updateStatusMutation.isPending
                      }
                      className="bg-orange-warning text-white hover:bg-orange-warning/90"
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Confirm Override'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="hover:bg-bg-tertiary"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
