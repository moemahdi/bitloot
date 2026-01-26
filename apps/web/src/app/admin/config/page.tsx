'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { Badge } from '@/design-system/primitives/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  CreditCard,
  Package,
  Mail,
  Cloud,
  Shield,
  Eye,
  EyeOff,
  Save,
  TestTube,
  Settings,
  Lock,
  X,
  Zap,
  Server,
  Activity,
} from 'lucide-react';
import { Configuration } from '@bitloot/sdk';

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

// Types matching backend DTOs
type Environment = 'sandbox' | 'production';

interface SystemConfig {
  id: string;
  provider: string;
  key: string;
  value: string;
  isSecret: boolean;
  environment: Environment;
  isActive: boolean;
  description: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ProviderConfig {
  provider: string;
  displayName: string;
  description: string;
  activeEnvironment: Environment;
  sandbox: SystemConfig[];
  production: SystemConfig[];
  isComplete: boolean;
  missingKeys: string[];
}

interface TestResult {
  provider: string;
  success: boolean;
  message: string;
  latencyMs?: number;
}

// Provider metadata with accent colors
interface ProviderMeta {
  displayName: string;
  description: string;
  icon: ReactNode;
  accentColor: string;
  bgGlow: string;
}

const PROVIDER_METADATA: Record<string, ProviderMeta> = {
  nowpayments: {
    displayName: 'NOWPayments',
    description: 'Cryptocurrency payment processing gateway',
    icon: <CreditCard className="h-5 w-5" />,
    accentColor: 'text-cyan-glow',
    bgGlow: 'shadow-glow-cyan-sm',
  },
  kinguin: {
    displayName: 'Kinguin',
    description: 'Game key marketplace and fulfillment provider',
    icon: <Package className="h-5 w-5" />,
    accentColor: 'text-purple-neon',
    bgGlow: 'shadow-glow-purple-sm',
  },
  resend: {
    displayName: 'Resend',
    description: 'Transactional email service provider',
    icon: <Mail className="h-5 w-5" />,
    accentColor: 'text-pink-featured',
    bgGlow: 'shadow-glow-pink',
  },
  r2: {
    displayName: 'Cloudflare R2',
    description: 'Object storage for encrypted key files',
    icon: <Cloud className="h-5 w-5" />,
    accentColor: 'text-orange-warning',
    bgGlow: 'shadow-glow-error',
  },
  turnstile: {
    displayName: 'Cloudflare Turnstile',
    description: 'CAPTCHA and bot protection',
    icon: <Shield className="h-5 w-5" />,
    accentColor: 'text-green-success',
    bgGlow: 'shadow-glow-success',
  },
};

/**
 * AdminConfigPage - API Configuration Management
 * 
 * Features:
 * - Manage API credentials for all integrations (NOWPayments, Kinguin, Resend, R2, Turnstile)
 * - Switch between sandbox and production environments per provider
 * - Encrypted storage for secrets (AES-256-GCM)
 * - Test connection for each provider
 * - No need to edit .env file - everything configurable via admin dashboard
 */
export default function AdminConfigPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  // Show toast notification
  const showToast = (type: 'success' | 'error', message: string): void => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all configurations
  const { data: configs, isLoading, error, refetch } = useQuery<ProviderConfig[]>({
    queryKey: ['admin', 'config'],
    queryFn: async (): Promise<ProviderConfig[]> => {
      const baseUrl = apiConfig.basePath ?? 'http://localhost:4000';
      const accessToken = apiConfig.accessToken;
      const token = typeof accessToken === 'function' ? accessToken() : (accessToken ?? '');
      const tokenStr = typeof token === 'string' ? token : '';
      
      const response = await fetch(`${baseUrl}/admin/config`, {
        headers: {
          'Authorization': `Bearer ${tokenStr}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch configurations: ${response.statusText}`);
      }
      
      const data = await response.json() as { providers: ProviderConfig[] };
      return data.providers ?? [];
    },
    staleTime: 60_000,
  });

  // Mutation for updating a config value
  const updateConfigMutation = useMutation<SystemConfig, Error, { id: string; value: string }>({
    mutationFn: async ({ id, value }): Promise<SystemConfig> => {
      const baseUrl = apiConfig.basePath ?? 'http://localhost:4000';
      const accessToken = apiConfig.accessToken;
      const token = typeof accessToken === 'function' ? accessToken() : (accessToken ?? '');
      const tokenStr = typeof token === 'string' ? token : '';
      
      const response = await fetch(`${baseUrl}/admin/config/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokenStr}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update config: ${response.statusText}`);
      }
      
      return response.json() as Promise<SystemConfig>;
    },
    onSuccess: (_, { id }) => {
      setEditedValues((prev) => {
        const newValues = { ...prev };
        delete newValues[id];
        return newValues;
      });
      showToast('success', 'Configuration saved successfully');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'config'] });
    },
    onError: (err) => {
      showToast('error', err instanceof Error ? err.message : 'Failed to update configuration');
    },
  });

  // Mutation for switching environment
  const switchEnvMutation = useMutation<void, Error, { provider: string; environment: Environment }>({
    mutationFn: async ({ provider, environment }): Promise<void> => {
      const baseUrl = apiConfig.basePath ?? 'http://localhost:4000';
      const accessToken = apiConfig.accessToken;
      const token = typeof accessToken === 'function' ? accessToken() : (accessToken ?? '');
      const tokenStr = typeof token === 'string' ? token : '';
      
      const response = await fetch(`${baseUrl}/admin/config/environment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStr}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, environment }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to switch environment: ${response.statusText}`);
      }
    },
    onSuccess: (_, { provider, environment }) => {
      const meta = PROVIDER_METADATA[provider];
      showToast('success', `${meta?.displayName ?? provider} switched to ${environment} mode`);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'config'] });
    },
    onError: (err) => {
      showToast('error', err instanceof Error ? err.message : 'Failed to switch environment');
    },
  });

  // Test provider connection
  const testProvider = async (provider: string): Promise<void> => {
    setTestingProvider(provider);
    try {
      const baseUrl = apiConfig.basePath ?? 'http://localhost:4000';
      const accessToken = apiConfig.accessToken;
      const token = typeof accessToken === 'function' ? accessToken() : (accessToken ?? '');
      const tokenStr = typeof token === 'string' ? token : '';
      
      const response = await fetch(`${baseUrl}/admin/config/test/${provider}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStr}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json() as TestResult;
      setTestResults((prev) => ({ ...prev, [provider]: result }));
      
      const meta = PROVIDER_METADATA[provider];
      if (result.success) {
        showToast('success', `${meta?.displayName ?? provider} connection test passed!`);
      } else {
        showToast('error', `${meta?.displayName ?? provider}: ${result.message}`);
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setTestingProvider(null);
    }
  };

  // Check if a config has unsaved changes
  const hasChanges = (configId: string): boolean => {
    return editedValues[configId] !== undefined;
  };

  // Calculate stats
  const totalProviders = configs?.length ?? 0;
  const productionProviders = configs?.filter((p) => p.activeEnvironment === 'production').length ?? 0;
  const completeProviders = configs?.filter((p) => p.isComplete).length ?? 0;

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="grid gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-border-subtle bg-bg-secondary">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="skeleton h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <div className="skeleton h-5 w-32" />
                      <div className="skeleton h-4 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-6 w-24 rounded-full" />
                    <div className="skeleton h-9 w-32 rounded-md" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-2">
                      <div className="skeleton h-4 w-24" />
                      <div className="skeleton h-10 w-full rounded-md" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error !== null && error !== undefined) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card className="border-orange-warning/30 bg-bg-secondary">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-orange-warning/10 mb-4">
                <AlertCircle className="h-8 w-8 text-orange-warning" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Failed to Load Configurations
              </h3>
              <p className="text-text-secondary max-w-md mb-6">
                {error instanceof Error ? error.message : 'An unexpected error occurred while loading API configurations.'}
              </p>
              <Button
                onClick={() => refetch()}
                className="btn-primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty State
  if ((configs ?? []).length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card className="border-border-subtle bg-bg-secondary">
          <CardContent className="py-16">
            <div className="empty-state">
              <Server className="empty-state-icon" />
              <h3 className="empty-state-title">No Providers Configured</h3>
              <p className="empty-state-description">
                API provider configurations will appear here once they are set up in the database.
              </p>
              <Button onClick={() => refetch()} className="btn-primary mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast !== null && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in-right ${
          toast.type === 'success' 
            ? 'bg-green-success/10 border border-green-success/30 shadow-glow-success' 
            : 'bg-orange-warning/10 border border-orange-warning/30 shadow-glow-error'
        } rounded-lg p-4 flex items-center gap-3 max-w-md`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-success shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-warning shrink-0" />
          )}
          <span className={toast.type === 'success' ? 'text-green-success' : 'text-orange-warning'}>
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader />
        <div className="flex items-center gap-3">
          {/* Stats Badges */}
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="outline" className="border-border-accent bg-bg-tertiary text-text-secondary">
              <Activity className="h-3 w-3 mr-1" />
              {completeProviders}/{totalProviders} Complete
            </Badge>
            {productionProviders > 0 && (
              <Badge className="badge-error">
                {productionProviders} in Production
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-border-accent hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Configuration Priority Info */}
      <Card className="border-cyan-glow/20 bg-cyan-glow/5">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Server className="h-5 w-5 text-cyan-glow shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-cyan-glow">Configuration Priority</p>
              <p className="text-sm text-text-secondary mt-1">
                Values configured here take precedence over <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-cyan-glow font-mono text-xs">.env</code> file. 
                If a value is empty, the system falls back to environment variables.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="space-y-6">
        {(configs ?? []).map((provider) => {
          const meta = PROVIDER_METADATA[provider.provider];
          const testResult = testResults[provider.provider];
          
          return (
            <ProviderCard
              key={provider.provider}
              provider={provider}
              meta={meta}
              testResult={testResult}
              testingProvider={testingProvider}
              onTest={() => testProvider(provider.provider)}
              onSwitchEnv={(env) => switchEnvMutation.mutate({ provider: provider.provider, environment: env })}
              isSwitching={switchEnvMutation.isPending}
              visibleSecrets={visibleSecrets}
              editedValues={editedValues}
              hasChanges={hasChanges}
              onToggleVisibility={(id) => {
                setVisibleSecrets((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(id)) {
                    newSet.delete(id);
                  } else {
                    newSet.add(id);
                  }
                  return newSet;
                });
              }}
              onValueChange={(id, value) => setEditedValues((prev) => ({ ...prev, [id]: value }))}
              onSave={(id, value) => updateConfigMutation.mutate({ id, value })}
              isSaving={updateConfigMutation.isPending}
            />
          );
        })}
      </div>

      {/* Security Notice */}
      <Card className="border-orange-warning/30 bg-orange-warning/5">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Lock className="h-5 w-5 text-orange-warning shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-orange-warning">Security Notice</p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-warning" />
                  All secrets are encrypted at rest using AES-256-GCM
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-warning" />
                  Production credentials should only be used in production environments
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-warning" />
                  Switching to production mode will use real payment processing
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-warning" />
                  Always test in sandbox mode first before going live
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
function PageHeader(): React.ReactElement {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-xl bg-gradient-primary shadow-glow-cyan-sm">
        <Settings className="h-6 w-6 text-bg-primary" />
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          API Configuration
        </h1>
        <p className="text-text-secondary mt-1">
          Manage credentials and switch between sandbox/production environments
        </p>
      </div>
    </div>
  );
}

// Provider Card Component
interface ProviderCardProps {
  provider: ProviderConfig;
  meta: ProviderMeta | undefined;
  testResult: TestResult | undefined;
  testingProvider: string | null;
  onTest: () => void;
  onSwitchEnv: (env: Environment) => void;
  isSwitching: boolean;
  visibleSecrets: Set<string>;
  editedValues: Record<string, string>;
  hasChanges: (id: string) => boolean;
  onToggleVisibility: (id: string) => void;
  onValueChange: (id: string, value: string) => void;
  onSave: (id: string, value: string) => void;
  isSaving: boolean;
}

function ProviderCard({
  provider,
  meta,
  testResult,
  testingProvider,
  onTest,
  onSwitchEnv,
  isSwitching,
  visibleSecrets,
  editedValues,
  hasChanges,
  onToggleVisibility,
  onValueChange,
  onSave,
  isSaving,
}: ProviderCardProps): React.ReactElement {
  const isProduction = provider.activeEnvironment === 'production';
  const isTesting = testingProvider === provider.provider;

  return (
    <Card className={`border-border-subtle bg-bg-secondary overflow-hidden transition-all hover:border-border-accent ${
      isProduction ? 'ring-1 ring-orange-warning/30' : ''
    }`}>
      {/* Provider Header */}
      <CardHeader className="pb-4 border-b border-border-subtle bg-bg-tertiary/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Provider Icon */}
            <div className={`p-3 rounded-lg bg-bg-secondary border border-border-subtle ${meta?.accentColor ?? 'text-text-secondary'}`}>
              {meta?.icon ?? <Zap className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text-primary">
                  {meta?.displayName ?? provider.provider}
                </h3>
                {/* Status Indicators */}
                {provider.isComplete ? (
                  <Badge className="badge-success text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge className="badge-warning text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Incomplete
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary mt-0.5">
                {meta?.description ?? 'API Integration'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Environment Badge */}
            <Badge className={isProduction ? 'badge-error' : 'badge-warning'}>
              <span className={`w-2 h-2 rounded-full mr-2 ${isProduction ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
              {isProduction ? 'Production' : 'Sandbox'}
            </Badge>
            
            {/* Test Connection Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={isTesting}
              className={`border-border-accent hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all ${
                testResult !== undefined
                  ? testResult.success
                    ? 'border-green-success/50'
                    : 'border-orange-warning/50'
                  : ''
              }`}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin-glow mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult !== undefined && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 ${
            testResult.success 
              ? 'bg-green-success/10 border border-green-success/30' 
              : 'bg-orange-warning/10 border border-orange-warning/30'
          }`}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-success shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-warning shrink-0" />
            )}
            <span className={`text-sm ${testResult.success ? 'text-green-success' : 'text-orange-warning'}`}>
              {testResult.message}
              {testResult.latencyMs !== undefined && testResult.latencyMs > 0 && (
                <span className="text-text-muted ml-2">({testResult.latencyMs}ms)</span>
              )}
            </span>
          </div>
        )}
      </CardHeader>

      {/* Configuration Content */}
      <CardContent className="pt-4">
        <Tabs defaultValue={provider.activeEnvironment} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <TabsList className="bg-bg-tertiary border border-border-subtle">
              <TabsTrigger 
                value="sandbox"
                onClick={() => {
                  if (provider.activeEnvironment !== 'sandbox') {
                    onSwitchEnv('sandbox');
                  }
                }}
                disabled={isSwitching}
                className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                Sandbox
              </TabsTrigger>
              <TabsTrigger 
                value="production"
                onClick={() => {
                  if (provider.activeEnvironment !== 'production') {
                    onSwitchEnv('production');
                  }
                }}
                disabled={isSwitching}
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                Production
              </TabsTrigger>
            </TabsList>
            <p className="text-xs text-text-muted">
              Click tab to switch active environment
            </p>
          </div>

          <TabsContent value="sandbox" className="mt-0">
            <ConfigFields
              configs={provider.sandbox}
              visibleSecrets={visibleSecrets}
              editedValues={editedValues}
              hasChanges={hasChanges}
              onToggleVisibility={onToggleVisibility}
              onValueChange={onValueChange}
              onSave={onSave}
              isSaving={isSaving}
            />
          </TabsContent>

          <TabsContent value="production" className="mt-0">
            <ConfigFields
              configs={provider.production}
              visibleSecrets={visibleSecrets}
              editedValues={editedValues}
              hasChanges={hasChanges}
              onToggleVisibility={onToggleVisibility}
              onValueChange={onValueChange}
              onSave={onSave}
              isSaving={isSaving}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Config Fields Component
interface ConfigFieldsProps {
  configs: SystemConfig[];
  visibleSecrets: Set<string>;
  editedValues: Record<string, string>;
  hasChanges: (configId: string) => boolean;
  onToggleVisibility: (configId: string) => void;
  onValueChange: (configId: string, value: string) => void;
  onSave: (id: string, value: string) => void;
  isSaving: boolean;
}

function ConfigFields({
  configs,
  visibleSecrets,
  editedValues,
  hasChanges,
  onToggleVisibility,
  onValueChange,
  onSave,
  isSaving,
}: ConfigFieldsProps): React.ReactElement {
  if (configs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">No configuration keys defined for this environment.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {configs.map((config) => {
        const isVisible = visibleSecrets.has(config.id);
        const editedValue = editedValues[config.id];
        const currentValue = editedValue ?? config.value;
        const isChanged = hasChanges(config.id);

        return (
          <div key={config.id} className="space-y-2">
            {/* Label Row */}
            <div className="flex items-center justify-between">
              <Label htmlFor={config.id} className="font-medium text-text-primary flex items-center gap-2">
                {formatKeyName(config.key)}
                {config.isSecret && (
                  <Badge variant="outline" className="text-xs border-purple-neon/50 text-purple-neon">
                    <Lock className="h-3 w-3 mr-1" />
                    Secret
                  </Badge>
                )}
              </Label>
              {config.description !== undefined && config.description !== '' && (
                <span className="text-xs text-text-muted hidden sm:block">{config.description}</span>
              )}
            </div>

            {/* Input Row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={config.id}
                  type={config.isSecret && !isVisible ? 'password' : 'text'}
                  value={currentValue}
                  onChange={(e) => onValueChange(config.id, e.target.value)}
                  placeholder={`Enter ${formatKeyName(config.key)}`}
                  className={`input-glow pr-10 ${
                    isChanged ? 'border-cyan-glow/50 shadow-glow-cyan-sm' : ''
                  }`}
                />
                {config.isSecret && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-text-muted hover:text-text-primary"
                    onClick={() => onToggleVisibility(config.id)}
                  >
                    {isVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              {isChanged && (
                <Button
                  size="sm"
                  onClick={() => onSave(config.id, editedValue ?? '')}
                  disabled={isSaving}
                  className="btn-primary shadow-glow-cyan-sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatKeyName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}
