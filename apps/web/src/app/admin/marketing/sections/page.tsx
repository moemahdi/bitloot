'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
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
import { Input } from '@/design-system/primitives/input';
import { Textarea } from '@/design-system/primitives/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import {
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  GripVertical,
  Settings,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  Star,
  Grid3X3,
  Gift,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Save,
  X,
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

// Section type with config
interface PageSection {
  id: string;
  sectionKey: string;
  displayName: string;
  displayOrder: number;
  isEnabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Icon mapping for section types
const SECTION_ICONS: Record<string, React.ReactNode> = {
  'flash-deals': <Zap className="h-5 w-5 text-yellow-400" />,
  'trending': <TrendingUp className="h-5 w-5 text-cyan-400" />,
  'featured': <Star className="h-5 w-5 text-purple-400" />,
  'categories': <Grid3X3 className="h-5 w-5 text-blue-400" />,
  'bundles': <Gift className="h-5 w-5 text-pink-400" />,
  'gift-cards': <CreditCard className="h-5 w-5 text-green-400" />,
};

// Section descriptions
const SECTION_DESCRIPTIONS: Record<string, string> = {
  'flash-deals': 'Time-limited discounts with countdown timer. Creates urgency and drives conversions.',
  'trending': 'Most popular products based on sales and views. Auto-updated or manually curated.',
  'featured': 'Hand-picked products to showcase. Use for new releases or high-margin items.',
  'categories': 'Browse by category grid. Helps customers navigate the catalog.',
  'bundles': 'Pre-packaged product bundles with savings. Great for cross-selling.',
  'gift-cards': 'Digital gift cards for all occasions. Popular during holidays.',
};

/**
 * Fetch all sections from the API
 */
async function fetchSections(): Promise<PageSection[]> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/sections`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch sections');
  }
  return response.json();
}

/**
 * Update a section
 */
async function updateSection(id: string, data: Partial<PageSection>): Promise<PageSection> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/sections/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update section');
  }
  return response.json();
}

/**
 * Reorder sections
 */
async function reorderSections(sectionIds: string[]): Promise<PageSection[]> {
  const token = getCookie('accessToken') ?? '';
  const response = await fetch(`${apiConfig.basePath}/admin/marketing/sections/reorder`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sectionIds }),
  });
  if (!response.ok) {
    throw new Error('Failed to reorder sections');
  }
  return response.json();
}

/**
 * AdminSectionsPage - Manage homepage sections
 * 
 * Features:
 * - View all homepage sections
 * - Enable/disable sections
 * - Reorder sections (drag or arrows)
 * - Configure section-specific settings
 */
export default function AdminSectionsPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [editConfig, setEditConfig] = useState<string>('');

  // Fetch all sections
  const { data: sections = [], isLoading, error, refetch } = useQuery<PageSection[]>({
    queryKey: ['admin', 'marketing', 'sections'],
    queryFn: fetchSections,
    staleTime: 30_000,
  });

  // Toggle section enabled/disabled
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      return updateSection(id, { isEnabled });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'sections'] });
      const section = sections.find(s => s.id === variables.id);
      setSuccessMessage(`${section?.displayName ?? 'Section'} ${variables.isEnabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Reorder sections
  const reorderMutation = useMutation({
    mutationFn: reorderSections,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'sections'] });
      setSuccessMessage('Sections reordered successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Update section config
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Record<string, unknown> }) => {
      return updateSection(id, { config });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'sections'] });
      setSuccessMessage('Section configuration updated');
      setEditingSection(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Move section up/down
  const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newOrder = [...sections];
    const item = newOrder[index];
    if (!item) return;
    newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, item);

    const sectionIds = newOrder.map(s => s.id);
    reorderMutation.mutate(sectionIds);
  }, [sections, reorderMutation]);

  // Open config editor
  const openConfigEditor = (section: PageSection) => {
    setEditingSection(section);
    setEditConfig(JSON.stringify(section.config, null, 2));
  };

  // Save config
  const saveConfig = () => {
    if (!editingSection) return;
    try {
      const config = JSON.parse(editConfig);
      updateConfigMutation.mutate({ id: editingSection.id, config });
    } catch {
      setErrorMessage('Invalid JSON configuration');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Sort sections by display order
  const sortedSections = [...sections].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Page Sections</h1>
          <p className="text-text-muted mt-1">
            Manage homepage layout and section visibility
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="border-green-500/30 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertTitle className="text-green-400">Success</AlertTitle>
          <AlertDescription className="text-green-300">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Error</AlertTitle>
          <AlertDescription className="text-red-300">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="ml-3 text-text-muted">Loading sections...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Alert className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Failed to load sections</AlertTitle>
          <AlertDescription className="text-red-300">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Sections List */}
      {!isLoading && !error && (
        <Card className="glass border-border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-cyan-400" />
              Homepage Sections
            </CardTitle>
            <CardDescription>
              Drag to reorder or use arrow buttons. Toggle visibility for each section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedSections.map((section, index) => (
              <div
                key={section.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  section.isEnabled
                    ? 'bg-bg-secondary border-border-accent'
                    : 'bg-bg-tertiary/50 border-border-subtle opacity-60'
                }`}
              >
                {/* Drag Handle */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0 || reorderMutation.isPending}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <GripVertical className="h-5 w-5 text-text-muted cursor-grab" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === sortedSections.length - 1 || reorderMutation.isPending}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Section Icon */}
                <div className="flex-shrink-0">
                  {SECTION_ICONS[section.sectionKey] ?? <Grid3X3 className="h-5 w-5 text-gray-400" />}
                </div>

                {/* Section Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">
                      {section.displayName}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {section.sectionKey}
                    </Badge>
                    {!section.isEnabled && (
                      <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-muted mt-1 truncate">
                    {SECTION_DESCRIPTIONS[section.sectionKey] ?? 'Configure this section settings'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {/* Config Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openConfigEditor(section)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Configure
                  </Button>

                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`toggle-${section.id}`}
                      checked={section.isEnabled}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: section.id, isEnabled: checked })}
                      disabled={toggleMutation.isPending}
                    />
                    <Label htmlFor={`toggle-${section.id}`} className="sr-only">
                      {section.isEnabled ? 'Disable' : 'Enable'} {section.displayName}
                    </Label>
                    {section.isEnabled ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-text-muted" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {sortedSections.length === 0 && (
              <div className="text-center py-8 text-text-muted">
                No sections found. Run the database migration to create default sections.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Config Editor Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="glass border-border-accent max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-400" />
              Configure {editingSection?.displayName}
            </DialogTitle>
            <DialogDescription>
              Edit the JSON configuration for this section. Changes affect how content is displayed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={editingSection?.displayName ?? ''}
                readOnly
                className="bg-bg-tertiary"
              />
            </div>

            {/* JSON Config */}
            <div className="space-y-2">
              <Label>Configuration (JSON)</Label>
              <Textarea
                value={editConfig}
                onChange={(e) => setEditConfig(e.target.value)}
                className="font-mono text-sm min-h-[200px] bg-bg-tertiary"
                placeholder="{}"
              />
              <p className="text-xs text-text-muted">
                Each section type has different config options. See documentation for details.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSection(null)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={saveConfig}
              disabled={updateConfigMutation.isPending}
              className="gap-2"
            >
              {updateConfigMutation.isPending ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Card */}
      <Card className="glass border-border-subtle">
        <CardHeader>
          <CardTitle className="text-sm">Section Configuration Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-text-muted space-y-2">
          <p><strong>flash-deals:</strong> {"{ \"maxProducts\": 8, \"showCountdown\": true }"}</p>
          <p><strong>trending:</strong> {"{ \"maxProducts\": 12, \"autoUpdate\": true, \"period\": \"7d\" }"}</p>
          <p><strong>featured:</strong> {"{ \"maxProducts\": 8, \"showBadge\": true }"}</p>
          <p><strong>categories:</strong> {"{ \"columns\": 6, \"showProductCount\": true }"}</p>
          <p><strong>bundles:</strong> {"{ \"maxBundles\": 4, \"showSavings\": true }"}</p>
          <p><strong>gift-cards:</strong> {"{ \"denominations\": [25, 50, 100], \"showPopular\": true }"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
