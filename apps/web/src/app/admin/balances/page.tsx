'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { AlertCircle, RefreshCw, Loader, DollarSign } from 'lucide-react';
import { AdminOperationsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminOpsApi = new AdminOperationsApi(apiConfig);

interface BalanceInfo {
  totalBalance: number;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  lastUpdated: string;
}

interface BalanceByAsset {
  asset: string;
  balance: number;
  inOrders: number;
  available: number;
  percentOfTotal: number;
}

/**
 * AdminBalancesPage - Balance Monitoring
 * Phase 3: Ops Panels & Monitoring
 * 
 * Monitor crypto balances and funds:
 * - Total balance across all supported cryptocurrencies
 * - Available balance vs. pending (in-order)
 * - Breakdown by asset (BTC, ETH, USDT, etc.)
 */
export default function AdminBalancesPage(): React.ReactElement {
  // Fetch main balance
  const { data: balance, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = useQuery<BalanceInfo>({
    queryKey: ['admin', 'balance'],
    queryFn: async (): Promise<BalanceInfo> => {
      try {
        const response = await adminOpsApi.adminOpsControllerGetBalance();
        return response as BalanceInfo;
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        throw err;
      }
    },
    staleTime: 30_000, // 30 seconds
  });

  // Fetch balance by asset
  const { data: balances = [], isLoading: balancesLoading, error: balancesError, refetch: refetchBalances } = useQuery<BalanceByAsset[]>({
    queryKey: ['admin', 'balance', 'details'],
    queryFn: async (): Promise<BalanceByAsset[]> => {
      try {
        const response = await adminOpsApi.adminOpsControllerGetBalanceDetails();
        // Handle both array and wrapped responses
        if (Array.isArray(response)) {
          return response as BalanceByAsset[];
        }
        // If response is an object with data property, extract it
        if ('data' in (response as Record<string, unknown>)) {
          return ((response as Record<string, unknown>).data as BalanceByAsset[]) ?? [];
        }
        return [];
      } catch (err) {
        console.error('Failed to fetch balance details:', err);
        throw err;
      }
    },
    staleTime: 30_000, // 30 seconds
  });

  // Memoized refresh handler
  const _handleRefresh = useCallback(() => {
    void refetchBalance();
    void refetchBalances();
  }, [refetchBalance, refetchBalances]);

  const isLoading = (balanceLoading ?? false) || (balancesLoading ?? false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((balanceError ?? null) !== null || (balancesError ?? null) !== null) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load balance information. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Balance & Funds</h1>
          <p className="text-muted-foreground mt-1">
            Monitor cryptocurrency balance and available funds
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={_handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Balance Cards */}
      {(balance ?? null) !== null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Balance */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-sm">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-4xl font-bold">
                    {formatCurrency((balance as BalanceInfo).totalBalance)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {(balance as BalanceInfo).currency} Equivalent
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-primary opacity-10" />
              </div>
            </CardContent>
          </Card>

          {/* Available Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency((balance as BalanceInfo).availableBalance)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Ready to withdraw or use
                </p>
                <Badge variant="outline" className="mt-4">
                  Available
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pending Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <div className="text-3xl font-bold text-yellow-600">
                  {formatCurrency((balance as BalanceInfo).pendingBalance)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Funds in processing orders
                </p>
                <Badge variant="outline" className="mt-4">
                  In Orders
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Balance by Asset */}
      <Card>
        <CardHeader>
          <CardTitle>Balance by Cryptocurrency</CardTitle>
          <CardDescription>Breakdown of balance across supported assets</CardDescription>
        </CardHeader>
        <CardContent>
          {(balances ?? []).length > 0 ? (
            <div className="space-y-4">
              {balances.map((item: BalanceByAsset) => (
                <div key={item.asset} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{item.asset.toUpperCase()}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.percentOfTotal.toFixed(1)}% of total balance
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{formatCurrency(item.balance)}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(Math.max(item.percentOfTotal, 0), 100)}%` }}
                    />
                  </div>

                  {/* Details Row */}
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="font-semibold text-green-600">{formatCurrency(item.available)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">In Orders</p>
                      <p className="font-semibold text-yellow-600">{formatCurrency(item.inOrders)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No balance data available</p>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      {(balance ?? null) !== null && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Last updated:{' '}
              <span className="font-mono">
                {balance !== null && balance !== undefined
                  ? new Date(balance.lastUpdated).toLocaleString()
                  : 'N/A'}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">💡 About Balances</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Total Balance:</strong> Combined balance across all supported cryptocurrencies
            (BTC, ETH, USDT, etc.)
          </p>
          <p>
            <strong>Available Balance:</strong> Funds that can be withdrawn or used immediately
          </p>
          <p>
            <strong>Pending Balance:</strong> Funds temporarily held for in-progress orders
          </p>
          <p>
            <strong>Last Updated:</strong> Timestamp of last balance refresh (updates every 30 seconds)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
