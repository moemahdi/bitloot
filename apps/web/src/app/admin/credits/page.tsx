'use client';

import { useState, useCallback } from 'react';
import {
  useAdminCreditsStats,
  useAdminUserBalances,
  useAdminUserCredits,
  useAdminGrantCredits,
  useAdminAdjustCredits,
  useAdminPendingTopups,
  useAdminConfirmTopup,
} from '@/features/admin/hooks/useAdminCredits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { Badge } from '@/design-system/primitives/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import {
  Loader2,
  Wallet,
  Users,
  TrendingUp,
  TrendingDown,
  Gift,
  Search,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

function formatEur(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n) || n === 0) return '€0.00';
  return `€${n.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminCreditsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);

  // Grant form
  const [grantUserId, setGrantUserId] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [grantExpiry, setGrantExpiry] = useState('90');

  // Adjust form
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'promo' | 'cash'>('promo');
  const [adjustReason, setAdjustReason] = useState('');

  const { data: stats, isLoading: loadingStats } = useAdminCreditsStats();
  const { data: users, isLoading: loadingUsers } = useAdminUserBalances(page, 20, debouncedSearch || undefined);
  const { data: userDetail } = useAdminUserCredits(selectedUserId);
  const { data: pendingTopups, isLoading: loadingTopups } = useAdminPendingTopups();
  const grantMutation = useAdminGrantCredits();
  const adjustMutation = useAdminAdjustCredits();
  const confirmTopupMutation = useAdminConfirmTopup();

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleGrant = async () => {
    if (!grantUserId || !grantAmount || !grantReason) {
      toast.error('All fields are required');
      return;
    }
    try {
      await grantMutation.mutateAsync({
        userId: grantUserId,
        amount: parseFloat(grantAmount),
        reason: grantReason,
        expiresInDays: parseInt(grantExpiry),
      });
      toast.success('Credits granted successfully');
      setShowGrantDialog(false);
      setGrantUserId('');
      setGrantAmount('');
      setGrantReason('');
    } catch {
      toast.error('Failed to grant credits');
    }
  };

  const handleAdjust = async () => {
    if (!adjustUserId || !adjustAmount || !adjustReason) {
      toast.error('All fields are required');
      return;
    }
    try {
      await adjustMutation.mutateAsync({
        userId: adjustUserId,
        amount: parseFloat(adjustAmount),
        creditType: adjustType,
        reason: adjustReason,
      });
      toast.success('Credits adjusted successfully');
      setShowAdjustDialog(false);
      setAdjustUserId('');
      setAdjustAmount('');
      setAdjustReason('');
    } catch {
      toast.error('Failed to adjust credits');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credits Management</h1>
          <p className="text-sm text-text-muted">
            Manage user credit balances, grants, and adjustments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdjustDialog(true)}
            className="gap-2"
          >
            <Minus className="h-4 w-4" />
            Adjust
          </Button>
          <Button
            onClick={() => setShowGrantDialog(true)}
            className="gap-2 bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 hover:bg-cyan-glow/20"
          >
            <Plus className="h-4 w-4" />
            Grant Credits
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-cyan-glow/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-text-muted">
              <CircleDollarSign className="h-4 w-4" />
              Cash in System
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                {formatEur(stats?.totalCashOutstanding ?? '0')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-purple-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-text-muted">
              <Gift className="h-4 w-4" />
              Promo in System
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <p className="text-2xl font-bold text-purple-400 tabular-nums">
                {formatEur(stats?.totalPromoOutstanding ?? '0')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border-subtle">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-text-muted">
              <Users className="h-4 w-4" />
              Users with Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">
                {stats?.totalUsers ?? 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border-subtle">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-text-muted">
              <TrendingUp className="h-4 w-4" />
              Spent This Month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <p className="text-2xl font-bold text-cyan-glow tabular-nums">
                {formatEur(stats?.spentThisMonth ?? '0')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Topups Section */}
      {(pendingTopups?.items?.length ?? 0) > 0 && (
        <Card className="glass border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-lg text-amber-400">Pending Topups ({pendingTopups?.items.length})</CardTitle>
            </div>
            <CardDescription>Credit top-ups awaiting confirmation. Use manual confirm if IPN webhook failed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-text-muted">
                    <th className="py-2 px-3 text-left font-medium">ID</th>
                    <th className="py-2 px-3 text-left font-medium">User ID</th>
                    <th className="py-2 px-3 text-right font-medium">Amount</th>
                    <th className="py-2 px-3 text-left font-medium">NP Payment ID</th>
                    <th className="py-2 px-3 text-left font-medium">Created</th>
                    <th className="py-2 px-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTopups?.items.map((topup) => (
                    <tr key={topup.id} className="border-b border-border-subtle/50 hover:bg-bg-secondary/30">
                      <td className="py-2 px-3 font-mono text-xs">{topup.id.slice(0, 8)}...</td>
                      <td className="py-2 px-3 font-mono text-xs">{topup.userId.slice(0, 8)}...</td>
                      <td className="py-2 px-3 text-right font-semibold text-cyan-glow tabular-nums">
                        {formatEur(topup.amountEur)}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">{String(topup.npPaymentId ?? '') || '—'}</td>
                      <td className="py-2 px-3 text-xs text-text-muted">{formatDate(topup.createdAt)}</td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={async () => {
                            try {
                              await confirmTopupMutation.mutateAsync(topup.id);
                              toast.success(`Top-up ${formatEur(topup.amountEur)} confirmed!`);
                            } catch {
                              toast.error('Failed to confirm top-up');
                            }
                          }}
                          disabled={confirmTopupMutation.isPending}
                        >
                          {confirmTopupMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          Confirm
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="glass border-border-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">User Balances</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-glow" />
            </div>
          ) : !users?.items.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Wallet className="h-10 w-10 mb-3 text-text-muted/50" />
              <p className="text-sm">No users with credit balances</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-muted">
                      <th className="py-3 px-4 text-left font-medium">User</th>
                      <th className="py-3 px-4 text-right font-medium">Cash</th>
                      <th className="py-3 px-4 text-right font-medium">Promo</th>
                      <th className="py-3 px-4 text-right font-medium">Total Spent</th>
                      <th className="py-3 px-4 text-right font-medium">Since</th>
                      <th className="py-3 px-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.items.map((user) => (
                      <tr
                        key={user.userId}
                        className="border-b border-border-subtle/50 hover:bg-bg-secondary/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium truncate max-w-48">{user.email ?? user.userId.slice(0, 8)}</p>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-emerald-400">
                          {formatEur(user.cashBalance)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-purple-400">
                          {formatEur(user.promoBalance)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          {formatEur(user.totalSpent)}
                        </td>
                        <td className="py-3 px-4 text-right text-text-muted text-xs">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserId(user.userId)}
                            className="text-xs"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {users.total > 20 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
                  <p className="text-xs text-text-muted">
                    Page {users.page} of {Math.ceil(users.total / 20)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil(users.total / 20)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={selectedUserId !== null} onOpenChange={() => setSelectedUserId(null)}>
        <DialogContent className="glass max-w-lg">
          <DialogHeader>
            <DialogTitle>User Credits Detail</DialogTitle>
            <DialogDescription>View balance and recent transactions</DialogDescription>
          </DialogHeader>
          {userDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                  <p className="text-xs text-text-muted">Cash</p>
                  <p className="text-lg font-bold text-emerald-400 tabular-nums">
                    {formatEur(userDetail.balance.cash)}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-500/10 p-3 text-center">
                  <p className="text-xs text-text-muted">Promo</p>
                  <p className="text-lg font-bold text-purple-400 tabular-nums">
                    {formatEur(userDetail.balance.promo)}
                  </p>
                </div>
                <div className="rounded-lg bg-cyan-glow/10 p-3 text-center">
                  <p className="text-xs text-text-muted">Total</p>
                  <p className="text-lg font-bold text-cyan-glow tabular-nums">
                    {formatEur(userDetail.balance.total)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userDetail.recentTransactions.map((tx) => {
                    const amt = parseFloat(tx.amount);
                    const isCredit = amt > 0;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-lg border border-border-subtle/50 bg-bg-secondary/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          {isCredit ? (
                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
                          )}
                          <div>
                            <p className="text-xs font-medium">{tx.type.replace(/_/g, ' ')}</p>
                            {tx.description && <p className="text-[10px] text-text-muted">{tx.description}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold tabular-nums ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : ''}{formatEur(amt)}
                          </p>
                          <Badge variant="outline" className="text-[9px] px-1">
                            {tx.creditType}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setAdjustUserId(selectedUserId!);
                    setSelectedUserId(null);
                    setShowAdjustDialog(true);
                  }}
                >
                  <Minus className="h-3.5 w-3.5 mr-1" />
                  Adjust
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => {
                    setGrantUserId(selectedUserId!);
                    setSelectedUserId(null);
                    setShowGrantDialog(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Grant
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grant Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Promo Credits</DialogTitle>
            <DialogDescription>Award promo credits to a user with an expiry period</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
                placeholder="User UUID"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (EUR)</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="10.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Expires in (days)</Label>
              <Select value={grantExpiry} onValueChange={setGrantExpiry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="e.g., Welcome bonus, compensation..."
              />
            </div>
            <Button
              onClick={handleGrant}
              disabled={grantMutation.isPending}
              className="w-full gap-2"
            >
              {grantMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gift className="h-4 w-4" />
              )}
              Grant Credits
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              Add or deduct credits. Use negative amounts to deduct.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                value={adjustUserId}
                onChange={(e) => setAdjustUserId(e.target.value)}
                placeholder="User UUID"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (EUR, negative to deduct)</Label>
              <Input
                type="number"
                step={0.01}
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="-5.00 or 10.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Credit Type</Label>
              <Select value={adjustType} onValueChange={(v) => setAdjustType(v as 'promo' | 'cash')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promo">Promo</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g., Manual correction, refund..."
              />
            </div>
            <Button
              onClick={handleAdjust}
              disabled={adjustMutation.isPending}
              className="w-full gap-2"
            >
              {adjustMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              Apply Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
