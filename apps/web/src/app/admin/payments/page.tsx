'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/design-system/primitives/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import { Checkbox } from '@/design-system/primitives/checkbox';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Input } from '@/design-system/primitives/input';
import { Separator } from '@/design-system/primitives/separator';
import { 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Copy,
  ExternalLink,
  Eye,
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Bitcoin,
  Filter,
  Hash,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/utils/format-date';
import { toast } from 'sonner';
import { useAdminTableState } from '@/features/admin/hooks/useAdminTableState';
import { useAdminPayments, type Payment } from '@/features/admin/hooks/useAdminPayments';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { PaymentDetailModal, type PaymentDetail } from '@/features/admin/components/PaymentDetailModal';

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
      return 'bg-orange-warning/20 text-orange-warning border border-orange-warning/30 animate-pulse';
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
 * Status icon component
 */
function StatusIcon({ status }: { status: string }): React.ReactElement {
  const className = "h-3 w-3";
  switch (status.toLowerCase()) {
    case 'finished':
    case 'confirmed':
      return <CheckCircle2 className={className} />;
    case 'waiting':
    case 'sending':
      return <Clock className={className} />;
    case 'confirming':
      return <Loader2 className={`${className} animate-spin`} />;
    case 'failed':
    case 'expired':
      return <XCircle className={className} />;
    case 'refunded':
      return <DollarSign className={className} />;
    case 'partially_paid':
      return <AlertTriangle className={className} />;
    default:
      return <Zap className={className} />;
  }
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
  return explorers[lowerCurrency] ?? `https://blockchair.com/search?q=${txHash}`;
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

export default function AdminPaymentsPage(): React.ReactElement {
  const { isLoading: isGuardLoading, isAdmin } = useAdminGuard();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  
  const state = useAdminTableState({
    initialFilters: {
      status: 'all',
      provider: 'all',
      search: '',
    },
  });

  const {
    payments,
    total,
    isLoading,
    refetch,
    error,
    stats,
  } = useAdminPayments({
    ...state,
    filters: {
      ...state.filters,
      search: searchQuery,
    },
  });

  // Handle search input with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    state.handleFilterChange('search', value);
  }, [state]);

  // Select/deselect all payments
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedPayments(new Set(payments.map(p => p.id)));
    } else {
      setSelectedPayments(new Set());
    }
  }, [payments]);

  // Select/deselect single payment
  const handleSelectPayment = useCallback((paymentId: string, checked: boolean) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(paymentId);
      } else {
        newSet.delete(paymentId);
      }
      return newSet;
    });
  }, []);

  // Open payment detail modal
  const handleViewDetails = useCallback((payment: Payment) => {
    setSelectedPayment(payment as PaymentDetail);
    setIsDetailModalOpen(true);
  }, []);

  // Enhanced CSV export with all fields
  const handleExportCSV = useCallback((exportAll = false) => {
    const paymentsToExport = exportAll 
      ? payments 
      : payments.filter(p => selectedPayments.has(p.id));
    
    if (paymentsToExport.length === 0) {
      toast.error('No payments selected for export');
      return;
    }

    const headers = [
      'ID', 
      'External ID',
      'Order ID', 
      'Customer Email',
      'Price Amount', 
      'Price Currency', 
      'Crypto Amount',
      'Crypto Currency',
      'Actually Paid',
      'Status', 
      'Provider',
      'TX Hash',
      'Pay Address',
      'Confirmations',
      'Created At',
      'Updated At',
    ];
    
    const rows: string[][] = paymentsToExport.map((payment): string[] => [
      payment.id,
      payment.externalId,
      payment.orderId,
      payment.customerEmail ?? '',
      payment.priceAmount,
      payment.priceCurrency,
      payment.payAmount,
      payment.payCurrency,
      payment.actuallyPaid ?? '',
      payment.status,
      payment.provider,
      payment.txHash ?? '',
      payment.payAddress ?? '',
      String(payment.networkConfirmations ?? ''),
      payment.createdAt,
      payment.updatedAt ?? '',
    ]);

    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','), 
        ...rows.map(r => r.map(escapeCSV).join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_export_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${paymentsToExport.length} payments`);
    setIsExportDialogOpen(false);
  }, [payments, selectedPayments]);

  // Calculate stats with safe defaults - avoid useMemo type issues
  const totalPayments = stats?.totalPayments ?? 0;
  const successfulPayments = stats?.successfulPayments ?? 0;
  const pendingPayments = stats?.pendingPayments ?? 0;
  const totalRevenue = stats?.totalRevenue ?? '0.00';
  const successRate = stats?.successRate ?? 0;

  if (isGuardLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-glow" />
          <p className="text-text-secondary">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-glow/10 border border-cyan-glow/20">
              <CreditCard className="h-8 w-8 text-cyan-glow" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                Payments
              </h1>
              <p className="text-text-secondary">
                Monitor and manage cryptocurrency payments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => void refetch()} 
              disabled={isLoading}
              className="border-border-subtle hover:border-cyan-glow/50 hover:text-cyan-glow transition-colors"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={(payments?.length ?? 0) === 0}
                  className="border-border-subtle hover:border-green-success/50 hover:text-green-success transition-colors"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-bg-secondary border-border-subtle">
                <DialogHeader>
                  <DialogTitle className="text-text-primary flex items-center gap-2">
                    <Download className="h-5 w-5 text-cyan-glow" />
                    Export Payments
                  </DialogTitle>
                  <DialogDescription className="text-text-secondary">
                    Export payment data to CSV file
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* Date range filter (optional) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary mb-1 block">From Date</label>
                      <Input
                        type="date"
                        value={exportDateFrom}
                        onChange={(e) => setExportDateFrom(e.target.value)}
                        className="input-glow bg-bg-tertiary border-border-subtle"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-1 block">To Date</label>
                      <Input
                        type="date"
                        value={exportDateTo}
                        onChange={(e) => setExportDateTo(e.target.value)}
                        className="input-glow bg-bg-tertiary border-border-subtle"
                      />
                    </div>
                  </div>
                  
                  <Separator className="bg-border-subtle" />
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => handleExportCSV(true)}
                      className="w-full bg-cyan-glow hover:bg-cyan-glow/80 text-bg-primary"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export All ({payments.length} payments)
                    </Button>
                    {selectedPayments.size > 0 && (
                      <Button 
                        variant="outline"
                        onClick={() => handleExportCSV(false)}
                        className="w-full border-cyan-glow/50 text-cyan-glow hover:bg-cyan-glow/10"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Selected ({selectedPayments.size} payments)
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Payments */}
          <Card className="bg-bg-secondary border-border-subtle hover:border-cyan-glow/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Total Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-cyan-glow group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {totalPayments.toLocaleString()}
              </div>
              <p className="text-xs text-text-muted mt-1">
                All time payment transactions
              </p>
            </CardContent>
          </Card>

          {/* Successful Payments */}
          <Card className="bg-bg-secondary border-border-subtle hover:border-green-success/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Successful
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-success group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-success">
                {successfulPayments.toLocaleString()}
              </div>
              <p className="text-xs text-text-muted mt-1">
                {successRate.toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="bg-bg-secondary border-border-subtle hover:border-orange-warning/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-warning group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-warning">
                {pendingPayments.toLocaleString()}
              </div>
              <p className="text-xs text-text-muted mt-1">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="bg-bg-secondary border-border-subtle hover:border-purple-neon/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-neon group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-neon">
                {formatFiatAmount(totalRevenue)}
              </div>
              <p className="text-xs text-text-muted mt-1">
                Total confirmed revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="bg-bg-secondary border-border-subtle">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-text-primary flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-cyan-glow" />
                  Payment History
                </CardTitle>
                <CardDescription className="text-text-secondary">
                  View and manage all payment transactions
                </CardDescription>
              </div>
              {selectedPayments.size > 0 && (
                <Badge className="bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30">
                  {selectedPayments.size} selected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Filters Row */}
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    placeholder="Search by ID, email, txHash, address..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 input-glow bg-bg-tertiary border-border-subtle focus:border-cyan-glow/50"
                  />
                </div>

                {/* Status Filter */}
                <div className="w-[180px]">
                  <Select
                    value={state.filters.status as string}
                    onValueChange={(value) => state.handleFilterChange('status', value)}
                  >
                    <SelectTrigger className="bg-bg-tertiary border-border-subtle focus:border-cyan-glow/50">
                      <Filter className="h-4 w-4 mr-2 text-text-muted" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-secondary border-border-subtle">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="finished">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-success" />
                          Finished
                        </span>
                      </SelectItem>
                      <SelectItem value="confirming">
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 text-orange-warning" />
                          Confirming
                        </span>
                      </SelectItem>
                      <SelectItem value="waiting">
                        <span className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-cyan-glow" />
                          Waiting
                        </span>
                      </SelectItem>
                      <SelectItem value="failed">
                        <span className="flex items-center gap-2">
                          <XCircle className="h-3 w-3 text-destructive" />
                          Failed
                        </span>
                      </SelectItem>
                      <SelectItem value="expired">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          Expired
                        </span>
                      </SelectItem>
                      <SelectItem value="refunded">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-purple-neon" />
                          Refunded
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Provider Filter */}
                <div className="w-[180px]">
                  <Select
                    value={state.filters.provider as string}
                    onValueChange={(value) => state.handleFilterChange('provider', value)}
                  >
                    <SelectTrigger className="bg-bg-tertiary border-border-subtle focus:border-cyan-glow/50">
                      <Zap className="h-4 w-4 mr-2 text-text-muted" />
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-secondary border-border-subtle">
                      <SelectItem value="all">All Providers</SelectItem>
                      <SelectItem value="nowpayments">NOWPayments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border-subtle overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-tertiary border-border-subtle hover:bg-bg-tertiary">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedPayments.size === payments.length && payments.length > 0}
                          onCheckedChange={handleSelectAll}
                          className="border-border-subtle data-[state=checked]:bg-cyan-glow data-[state=checked]:border-cyan-glow"
                        />
                      </TableHead>
                      <TableHead className="text-text-secondary">Order ID</TableHead>
                      <TableHead className="text-text-secondary">Customer</TableHead>
                      <TableHead className="text-text-secondary">Amount</TableHead>
                      <TableHead className="text-text-secondary">Crypto</TableHead>
                      <TableHead className="text-text-secondary">Status</TableHead>
                      <TableHead className="text-text-secondary">Age</TableHead>
                      <TableHead className="text-text-secondary text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
                            <span className="text-text-muted">Loading payments...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error !== null ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-destructive">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="h-8 w-8" />
                            <span>Failed to load payments</span>
                            <span className="text-sm text-text-muted">
                              {error instanceof Error ? error.message : 'Unknown error'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-text-muted">
                            <CreditCard className="h-8 w-8" />
                            <span>No payments found</span>
                            <span className="text-sm">Try adjusting your filters</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment: Payment) => (
                        <TableRow 
                          key={payment.id}
                          className="border-border-subtle hover:bg-bg-tertiary/50 transition-colors"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedPayments.has(payment.id)}
                              onCheckedChange={(checked) => handleSelectPayment(payment.id, checked as boolean)}
                              className="border-border-subtle data-[state=checked]:bg-cyan-glow data-[state=checked]:border-cyan-glow"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-xs text-text-primary bg-bg-tertiary px-2 py-1 rounded">
                                {payment.orderId.slice(0, 8)}...
                              </code>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-cyan-glow/20 hover:text-cyan-glow"
                                    onClick={() => void copyToClipboard(payment.orderId, 'Order ID')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy order ID</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.customerEmail !== undefined ? (
                              <span className="text-text-primary text-sm">
                                {payment.customerEmail}
                              </span>
                            ) : (
                              <span className="text-text-muted text-sm italic">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-text-primary">
                              {formatFiatAmount(payment.priceAmount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Bitcoin className="h-3 w-3 text-orange-warning" />
                              <span className="font-mono text-sm text-cyan-glow">
                                {formatCryptoAmount(payment.payAmount)}
                              </span>
                              <span className="text-text-muted text-xs">
                                {payment.payCurrency.toUpperCase()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getPaymentStatusBadgeClass(payment.status)} gap-1`}>
                              <StatusIcon status={payment.status} />
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-text-secondary text-sm">
                                  {formatRelativeTime(payment.createdAt)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {formatDate(payment.createdAt, 'datetime-long')}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-cyan-glow/20 hover:text-cyan-glow"
                                    onClick={() => handleViewDetails(payment)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View details</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-purple-neon/20 hover:text-purple-neon"
                                    onClick={() => void copyToClipboard(payment.orderId, 'Order ID')}
                                  >
                                    <Hash className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy order ID</TooltipContent>
                              </Tooltip>

                              {payment.txHash !== undefined && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={getExplorerUrl(payment.payCurrency, payment.txHash)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-green-success/20 hover:text-green-success"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>View on explorer</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-text-muted">
                  Showing <span className="font-medium text-text-secondary">{payments.length}</span> of{' '}
                  <span className="font-medium text-text-secondary">{total}</span> payments
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Rows per page</span>
                    <Select
                      value={state.limit.toString()}
                      onValueChange={(value) => state.setLimit(Number(value))}
                    >
                      <SelectTrigger className="w-[70px] bg-bg-tertiary border-border-subtle">
                        <SelectValue placeholder="20" />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-secondary border-border-subtle">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => state.setPage(Math.max(1, state.page - 1))}
                      disabled={state.page <= 1 || isLoading}
                      className="border-border-subtle hover:border-cyan-glow/50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-bg-tertiary rounded-md border border-border-subtle">
                      <span className="text-sm text-text-secondary">Page</span>
                      <span className="text-sm font-medium text-cyan-glow">{state.page}</span>
                      <span className="text-sm text-text-secondary">of</span>
                      <span className="text-sm font-medium text-text-primary">
                        {Math.max(1, Math.ceil(total / state.limit))}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => state.setPage(Math.min(Math.ceil(total / state.limit), state.page + 1))}
                      disabled={state.page >= Math.ceil(total / state.limit) || isLoading}
                      className="border-border-subtle hover:border-cyan-glow/50 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Detail Modal */}
        <PaymentDetailModal
          payment={selectedPayment}
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          onRefresh={async () => {
            await refetch();
          }}
        />
      </div>
    </TooltipProvider>
  );
}
