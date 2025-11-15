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
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { AlertCircle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import { AdminOperationsApi, Configuration } from '@bitloot/sdk';

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});
const adminOpsApi = new AdminOperationsApi(apiConfig);

interface FeatureFlag {
  name?: string;
  enabled?: boolean;
  description?: string;
}

/**
 * AdminFlagsPage - Feature flags management
 * Phase 3: Ops Panels & Monitoring
 * 
 * Allows admins to toggle feature flags at runtime:
 * - payment_processing_enabled
 * - fulfillment_enabled
 * - email_notifications_enabled
 * - auto_fulfill_enabled
 * - captcha_enabled
 * - maintenance_mode
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
      setSuccessMessage(`✓ Flag "${flag.name}" toggled successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
    },
    onError: (err) => {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update flag';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

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

      {/* Flags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flags.map((flag: FeatureFlag) => (
          <Card key={flag.name}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{formatFlagName(flag.name ?? '')}</CardTitle>
                  <CardDescription className="mt-2">{flag.description}</CardDescription>
                </div>
                <Badge variant={(flag.enabled ?? false) ? 'default' : 'secondary'}>
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
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">💡 About Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>payment_processing_enabled:</strong> Controls whether payments are processed
          </p>
          <p>
            <strong>fulfillment_enabled:</strong> Controls whether orders are fulfilled
          </p>
          <p>
            <strong>email_notifications_enabled:</strong> Controls email notifications
          </p>
          <p>
            <strong>auto_fulfill_enabled:</strong> Automatically fulfill orders when payment confirms
          </p>
          <p>
            <strong>captcha_enabled:</strong> Require CAPTCHA on checkout
          </p>
          <p>
            <strong>maintenance_mode:</strong> Disable checkout (put store in maintenance)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function formatFlagName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
