'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { Separator } from '@/design-system/primitives/separator';
import {
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  CreditCard,
  Package,
  Mail,
  ShoppingCart,
  Shield,
  Wrench,
} from 'lucide-react';
import { AdminOperationsApi, Configuration } from '@bitloot/sdk';

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
const adminOpsApi = new AdminOperationsApi(apiConfig);

interface FeatureFlag {
  name?: string;
  enabled?: boolean;
  description?: string;
}

// Flag metadata for enhanced display
const FLAG_METADATA: Record<string, { category: string; description: string; icon: string }> = {
  payment_processing: {
    category: 'Payments',
    description: 'Controls whether new payments are processed. Disabling stops all new orders from being created.',
    icon: 'CreditCard',
  },
  fulfillment: {
    category: 'Fulfillment',
    description: 'Controls whether orders are fulfilled (key delivery). Disabling pauses all fulfillment jobs.',
    icon: 'Package',
  },
  email: {
    category: 'Notifications',
    description: 'Controls email notifications (order confirmations, key delivery emails).',
    icon: 'Mail',
  },
  auto_fulfill: {
    category: 'Fulfillment',
    description: 'Automatically fulfill orders when payment is confirmed. Disable for manual fulfillment.',
    icon: 'Package',
  },
  captcha: {
    category: 'Security',
    description: 'Require CAPTCHA verification on checkout to prevent bot abuse.',
    icon: 'Shield',
  },
  maintenance_mode: {
    category: 'System',
    description: 'Put store in maintenance mode. Disables checkout for customers.',
    icon: 'Wrench',
  },
  kinguin_enabled: {
    category: 'Products',
    description: 'Enable Kinguin marketplace integration. Allows creating products sourced from Kinguin API.',
    icon: 'ShoppingCart',
  },
  custom_products_enabled: {
    category: 'Products',
    description: 'Enable custom product creation. Allows admins to create BitLoot-only products with manual key inventory.',
    icon: 'ShoppingCart',
  },
};

const CATEGORY_ORDER = ['Payments', 'Fulfillment', 'Products', 'Notifications', 'Security', 'System'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Payments: <CreditCard className="h-5 w-5" />,
  Fulfillment: <Package className="h-5 w-5" />,
  Products: <ShoppingCart className="h-5 w-5" />,
  Notifications: <Mail className="h-5 w-5" />,
  Security: <Shield className="h-5 w-5" />,
  System: <Wrench className="h-5 w-5" />,
};

/**
 * AdminFlagsPage - Feature flags management
 * Phase 3: Ops Panels & Monitoring
 * 
 * Allows admins to toggle feature flags at runtime:
 * - Payments: payment_processing
 * - Fulfillment: fulfillment, auto_fulfill
 * - Products: kinguin_enabled, custom_products_enabled
 * - Notifications: email
 * - Security: captcha
 * - System: maintenance_mode
 */
export default function AdminFlagsPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all feature flags
  const { data: flags = [], isLoading, error, refetch } = useQuery<FeatureFlag[]>({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async (): Promise<FeatureFlag[]> => {
      try {
        const response = await adminOpsApi.adminOpsControllerGetFeatureFlags();
        return response ?? [];
      } catch (err) {
        console.error('Failed to fetch feature flags:', err);
        throw err;
      }
    },
    staleTime: 30_000, // 30 seconds
  });

  // Group flags by category
  const groupedFlags = useMemo(() => {
    const groups: Record<string, FeatureFlag[]> = {};
    
    for (const flag of flags) {
      const flagName = flag.name ?? '';
      const metadata = FLAG_METADATA[flagName];
      const category = metadata?.category ?? 'Other';
      
      groups[category] ??= [];
      groups[category].push(flag);
    }
    
    // Sort groups by defined order
    const sortedGroups: Record<string, FeatureFlag[]> = {};
    for (const cat of CATEGORY_ORDER) {
      const catFlags = groups[cat];
      if (catFlags !== undefined) {
        sortedGroups[cat] = catFlags;
      }
    }
    // Add any other categories at the end
    for (const cat of Object.keys(groups)) {
      if (sortedGroups[cat] === undefined) {
        const catFlags = groups[cat];
        if (catFlags !== undefined) {
          sortedGroups[cat] = catFlags;
        }
      }
    }
    
    return sortedGroups;
  }, [flags]);

  // Mutation for toggling a flag
  const toggleFlagMutation = useMutation<FeatureFlag, Error, FeatureFlag>({
    mutationFn: async (flag: FeatureFlag): Promise<FeatureFlag> => {
      try {
        // Toggle flag by name only
        const response = await adminOpsApi.adminOpsControllerUpdateFeatureFlag({
          name: flag.name ?? '',
        });
        return (response as FeatureFlag) ?? flag;
      } catch (err) {
        console.error('Failed to update flag:', err);
        throw err;
      }
    },
    onSuccess: (_, flag) => {
      setSuccessMessage(`✓ Flag "${formatFlagName(flag.name ?? '')}" toggled successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
    },
    onError: (err) => {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update flag';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Count enabled/disabled flags
  const enabledCount = flags.filter(f => f.enabled === true).length;
  const disabledCount = flags.length - enabledCount;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error !== null && error !== undefined) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load feature flags. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground mt-1">
            Toggle features on/off at runtime without redeploying
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="default" className="bg-green-600">{enabledCount} enabled</Badge>
            <Badge variant="secondary">{disabledCount} disabled</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage !== null && successMessage !== undefined ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">{successMessage}</AlertTitle>
        </Alert>
      ) : null}

      {/* Error Message */}
      {errorMessage !== null && errorMessage !== undefined ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {/* Flags by Category */}
      {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            {CATEGORY_ICONS[category]}
            <h2 className="text-xl font-semibold">{category}</h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryFlags.map((flag: FeatureFlag) => {
              const flagName = flag.name ?? '';
              const metadata = FLAG_METADATA[flagName];
              const description = metadata?.description ?? flag.description ?? 'No description available';
              
              return (
                <Card key={flag.name} className={flag.enabled === true ? 'border-green-200 bg-green-50/30' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{formatFlagName(flagName)}</CardTitle>
                        <CardDescription className="mt-2">{description}</CardDescription>
                      </div>
                      <Badge 
                        variant={(flag.enabled ?? false) ? 'default' : 'secondary'}
                        className={(flag.enabled ?? false) ? 'bg-green-600' : ''}
                      >
                        {(flag.enabled ?? false) ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <Switch
                        id={flag.name}
                        checked={flag.enabled}
                        onCheckedChange={() => toggleFlagMutation.mutate(flag)}
                        disabled={(toggleFlagMutation.isPending ?? false)}
                      />
                      <Label htmlFor={flag.name} className="cursor-pointer">
                        {(flag.enabled ?? false) ? 'Currently Enabled' : 'Currently Disabled'}
                      </Label>
                      {(toggleFlagMutation.isPending ?? false) && (
                        <Loader className="h-4 w-4 animate-spin ml-auto text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Warning for critical flags */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900">⚠️ Important</AlertTitle>
        <AlertDescription className="text-amber-800">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Maintenance Mode:</strong> Will block all customer checkouts when enabled</li>
            <li><strong>Payment Processing:</strong> Disabling will prevent new orders from being created</li>
            <li><strong>Kinguin / Custom Products:</strong> Disabling will prevent creation of products from those sources and block fulfillment</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function formatFlagName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
