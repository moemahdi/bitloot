'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Switch } from '@/design-system/primitives/switch';
import { Label } from '@/design-system/primitives/label';
import { Badge } from '@/design-system/primitives/badge';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  CreditCard,
  Package,
  Mail,
  ShoppingCart,
  Shield,
  Wrench,
  Settings,
  Zap,
  ToggleLeft,
} from 'lucide-react';
import { Configuration } from '@bitloot/sdk';
import { formatDate } from '@/utils/format-date';

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts[1];
    if (cookieValue !== undefined) {
      return cookieValue.split(';')[0] ?? null;
    }
  }
  return null;
}

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  accessToken: (): string => {
    if (typeof window !== 'undefined') {
      return getCookie('accessToken') ?? '';
    }
    return '';
  },
});

// Feature flag types matching backend DTOs
interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

interface GroupedFeatureFlags {
  [category: string]: FeatureFlag[];
}

const CATEGORY_ORDER = ['payments', 'fulfillment', 'products', 'notifications', 'security', 'system'];

const CATEGORY_CONFIG: Record<string, { 
  displayName: string; 
  icon: React.ReactNode; 
  description: string;
  accentColor: string;
}> = {
  payments: {
    displayName: 'Payments',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Control payment processing and crypto transactions',
    accentColor: 'text-cyan-glow',
  },
  fulfillment: {
    displayName: 'Fulfillment',
    icon: <Package className="h-5 w-5" />,
    description: 'Manage order fulfillment and key delivery',
    accentColor: 'text-purple-neon',
  },
  products: {
    displayName: 'Products',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'Configure product sources and catalog features',
    accentColor: 'text-pink-featured',
  },
  notifications: {
    displayName: 'Notifications',
    icon: <Mail className="h-5 w-5" />,
    description: 'Email and notification system controls',
    accentColor: 'text-green-success',
  },
  security: {
    displayName: 'Security',
    icon: <Shield className="h-5 w-5" />,
    description: 'Security measures and verification systems',
    accentColor: 'text-orange-warning',
  },
  system: {
    displayName: 'System',
    icon: <Wrench className="h-5 w-5" />,
    description: 'Core system operations and maintenance',
    accentColor: 'text-text-secondary',
  },
};

/**
 * AdminFlagsPage - Feature Flags Management
 * 
 * Database-persisted feature flags with runtime toggles.
 * Neon cyberpunk design with glow effects and gaming aesthetic.
 */
export default function AdminFlagsPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch all feature flags grouped by category
  const { data: groupedFlags, isLoading, error, refetch } = useQuery<GroupedFeatureFlags>({
    queryKey: ['admin', 'feature-flags', 'grouped'],
    queryFn: async (): Promise<GroupedFeatureFlags> => {
      const baseUrl = apiConfig.basePath ?? 'http://localhost:4000';
      const accessToken = apiConfig.accessToken;
      const token = typeof accessToken === 'function' ? accessToken() : (accessToken ?? '');
      const tokenStr = typeof token === 'string' ? token : '';
      
      const response = await fetch(`${baseUrl}/admin/feature-flags/grouped`, {
        headers: {
          'Authorization': `Bearer ${tokenStr}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feature flags: ${response.statusText}`);
      }
      
      const data = await response.json() as { groups: GroupedFeatureFlags };
      return data.groups ?? {};
    },
    staleTime: 30_000,
  });

  // Calculate stats
  const allFlags = Object.values(groupedFlags ?? {}).flat();
  const enabledCount = allFlags.filter(f => f.enabled).length;
  const totalCount = allFlags.length;

  // Mutation for toggling a flag
  const toggleFlagMutation = useMutation<FeatureFlag, Error, FeatureFlag>({
    mutationFn: async (flag: FeatureFlag): Promise<FeatureFlag> => {
      const baseUrl = apiConfig.basePath ?? 'http://localhost:4000';
      const accessToken = apiConfig.accessToken;
      const token = typeof accessToken === 'function' ? accessToken() : (accessToken ?? '');
      const tokenStr = typeof token === 'string' ? token : '';
      
      const response = await fetch(`${baseUrl}/admin/feature-flags/${flag.name}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokenStr}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to toggle flag: ${response.statusText}`);
      }
      
      const data = await response.json() as { flag: FeatureFlag };
      return data.flag;
    },
    onSuccess: (updatedFlag) => {
      setToast({
        type: 'success',
        message: `${formatFlagName(updatedFlag.name)} ${updatedFlag.enabled ? 'enabled' : 'disabled'}`,
      });
      setTimeout(() => setToast(null), 3000);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
    },
    onError: (err) => {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update flag',
      });
      setTimeout(() => setToast(null), 5000);
    },
  });

  // Sort categories by defined order
  const sortedCategories = CATEGORY_ORDER.filter(cat => groupedFlags?.[cat] !== undefined);
  Object.keys(groupedFlags ?? {}).forEach(cat => {
    if (!sortedCategories.includes(cat)) {
      sortedCategories.push(cat);
    }
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader enabledCount={0} totalCount={0} isLoading onRefresh={() => void refetch()} />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="skeleton h-8 w-48 rounded-md" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="skeleton h-36 rounded-lg" />
                <div className="skeleton h-36 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error !== null && error !== undefined) {
    return (
      <div className="space-y-6">
        <PageHeader enabledCount={0} totalCount={0} onRefresh={() => void refetch()} />
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-destructive/20 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Failed to Load Feature Flags</h3>
            <p className="text-text-secondary text-sm mb-6 text-center max-w-md">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={() => void refetch()} className="btn-primary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty State
  if (totalCount === 0) {
    return (
      <div className="space-y-6">
        <PageHeader enabledCount={0} totalCount={0} onRefresh={() => void refetch()} />
        <Card className="border-border-subtle bg-bg-secondary">
          <CardContent className="empty-state py-20">
            <div className="p-4 rounded-full bg-bg-tertiary mb-4">
              <ToggleLeft className="empty-state-icon" />
            </div>
            <h3 className="empty-state-title">No Feature Flags</h3>
            <p className="empty-state-description">
              Feature flags will appear here once configured in the database.
            </p>
            <Button onClick={() => void refetch()} variant="outline" className="mt-6">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader 
        enabledCount={enabledCount} 
        totalCount={totalCount} 
        onRefresh={() => void refetch()}
        isRefreshing={isLoading}
      />

      {/* Toast Notification */}
      {toast !== null && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border animate-slide-in-right ${
            toast.type === 'success' 
              ? 'bg-green-success/10 border-green-success/30 text-green-success shadow-glow-success' 
              : 'bg-destructive/10 border-destructive/30 text-destructive shadow-glow-error'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Categories */}
      {sortedCategories.map((category) => {
        const categoryFlags = groupedFlags?.[category] ?? [];
        const config = CATEGORY_CONFIG[category] ?? {
          displayName: category.charAt(0).toUpperCase() + category.slice(1),
          icon: <Settings className="h-5 w-5" />,
          description: 'Configure settings for this category',
          accentColor: 'text-text-secondary',
        };
        const categoryEnabledCount = categoryFlags.filter(f => f.enabled).length;
        
        return (
          <section key={category} className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-bg-tertiary ${config.accentColor}`}>
                  {config.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                    {config.displayName}
                    <Badge variant="outline" className="text-xs font-normal">
                      {categoryEnabledCount}/{categoryFlags.length}
                    </Badge>
                  </h2>
                  <p className="text-sm text-text-secondary">{config.description}</p>
                </div>
              </div>
            </div>
            
            {/* Flag Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {categoryFlags.map((flag: FeatureFlag) => (
                <FlagCard
                  key={flag.id}
                  flag={flag}
                  onToggle={() => toggleFlagMutation.mutate(flag)}
                  isToggling={toggleFlagMutation.isPending}
                  _accentColor={config.accentColor}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Critical Flags Warning */}
      <Card className="border-orange-warning/30 bg-orange-warning/5">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-warning shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-orange-warning">Critical Flag Warnings</p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-warning" />
                  <strong>Maintenance Mode</strong> blocks all customer checkouts
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-warning" />
                  <strong>Payment Processing</strong> prevents new orders when disabled
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-warning" />
                  <strong>Fulfillment</strong> pauses all key delivery when disabled
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Page Header Component
function PageHeader({ 
  enabledCount, 
  totalCount, 
  onRefresh, 
  isLoading = false,
  isRefreshing = false,
}: { 
  enabledCount: number; 
  totalCount: number; 
  onRefresh: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
}): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-primary shadow-glow-cyan-sm">
          <Zap className="h-6 w-6 text-bg-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Feature Flags</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Toggle features at runtime without redeploying
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!isLoading && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-subtle">
            <div className="flex items-center gap-1.5">
              <span className="status-dot status-dot-success" />
              <span className="text-sm font-medium text-text-primary">{enabledCount}</span>
            </div>
            <span className="text-text-muted">/</span>
            <span className="text-sm text-text-secondary">{totalCount} flags</span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}

// Flag Card Component
function FlagCard({ 
  flag, 
  onToggle, 
  isToggling,
  _accentColor,
}: { 
  flag: FeatureFlag; 
  onToggle: () => void; 
  isToggling: boolean;
  _accentColor: string;
}): React.ReactElement {
  return (
    <Card 
      className={`group transition-all duration-200 ${
        flag.enabled 
          ? 'border-green-success/30 bg-green-success/5 hover:border-green-success/50 hover:shadow-glow-success' 
          : 'border-border-subtle bg-bg-secondary hover:border-border-accent hover:shadow-card-md'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base font-semibold text-text-primary flex items-center gap-2">
              {formatFlagName(flag.name)}
              {flag.enabled && (
                <span className="status-dot status-dot-success" />
              )}
            </CardTitle>
            <CardDescription className="text-sm text-text-secondary line-clamp-2">
              {flag.description}
            </CardDescription>
          </div>
          <Badge 
            variant={flag.enabled ? 'default' : 'secondary'}
            className={flag.enabled 
              ? 'bg-green-success/20 text-green-success border-green-success/30 hover:bg-green-success/30' 
              : 'bg-bg-tertiary text-text-muted border-border-subtle'
            }
          >
            {flag.enabled ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              id={flag.name}
              checked={flag.enabled}
              onCheckedChange={onToggle}
              disabled={isToggling}
              className="data-[state=checked]:bg-green-success"
            />
            <Label 
              htmlFor={flag.name} 
              className="text-sm text-text-secondary cursor-pointer select-none"
            >
              {flag.enabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
          {isToggling && (
            <Loader2 className="h-4 w-4 animate-spin-glow text-cyan-glow" />
          )}
        </div>
        {flag.updatedBy !== undefined && flag.updatedBy !== '' && (
          <p className="text-xs text-text-muted mt-3 pt-3 border-t border-border-subtle">
            Updated {formatDate(flag.updatedAt, 'datetime')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatFlagName(name: string): string {
  return name
    .replace(/_enabled$/, '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
