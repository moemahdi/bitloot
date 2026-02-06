'use client';

/**
 * Product Inventory Management Page
 *
 * Admin page for managing digital inventory (keys, accounts, codes, etc.)
 * for custom products.
 *
 * Features:
 * - Inventory statistics cards
 * - Item list with pagination and filtering
 * - Add single item form
 * - Bulk import dialog
 * - Item status management
 * - Delete functionality
 */

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
import { Textarea } from '@/design-system/primitives/textarea';
import { Label } from '@/design-system/primitives/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/design-system/primitives/dropdown-menu';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/design-system/primitives/alert';
import { Skeleton } from '@/design-system/primitives/skeleton';
import {
  ArrowLeft,
  Plus,
  Upload,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShoppingCart,
  XCircle,
  Package,
  Key,
  User,
  CreditCard,
  Shield,
  Layers,
  Settings,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import type {
  AdminProductResponseDto,
  InventoryItemResponseDtoDeliveryTypeEnum,
  InventoryItemResponseDtoStatusEnum,
} from '@bitloot/sdk';
import { AdminCatalogProductsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { formatDate } from '@/utils/format-date';
import {
  useInventoryItems,
  useInventoryStats,
  useAddInventoryItem,
  useBulkImportInventory,
  useDeleteInventoryItem,
  useUpdateInventoryItemStatus,
  type InventoryFilters,
} from '@/hooks/useInventory';
import { motion, AnimatePresence } from 'framer-motion';

// Delivery type configurations for display and form fields
const DELIVERY_TYPE_CONFIG = {
  key: {
    icon: Key,
    label: 'Product Key',
    description: 'Single activation key (Steam, Origin, etc.)',
    fields: [
      { name: 'key', label: 'Product Key', type: 'text', placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX', required: true },
    ],
  },
  account: {
    icon: User,
    label: 'Account',
    description: 'Username + Password credentials',
    fields: [
      { name: 'username', label: 'Username / Email', type: 'text', placeholder: 'account@example.com', required: true },
      { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', required: true },
      { name: 'email', label: 'Recovery Email', type: 'email', placeholder: 'recovery@example.com', required: false },
      { name: 'notes', label: 'Customer Notes', type: 'textarea', placeholder: "Important: Don't change password", required: false },
    ],
  },
  code: {
    icon: CreditCard,
    label: 'Code / Gift Card',
    description: 'Redeemable code with optional PIN',
    fields: [
      { name: 'code', label: 'Code', type: 'text', placeholder: 'XXXX-XXXX-XXXX', required: true },
      { name: 'pin', label: 'PIN (optional)', type: 'text', placeholder: '1234', required: false },
      { name: 'value', label: 'Face Value', type: 'number', placeholder: '50.00', required: false },
    ],
  },
  license: {
    icon: Shield,
    label: 'Software License',
    description: 'License key with optional seats/expiry',
    fields: [
      { name: 'licenseKey', label: 'License Key', type: 'text', placeholder: 'XXXXX-XXXXX-XXXXX', required: true },
      { name: 'seats', label: 'Number of Seats', type: 'number', placeholder: '1', required: false },
      { name: 'downloadUrl', label: 'Download URL', type: 'url', placeholder: 'https://...', required: false },
    ],
  },
  bundle: {
    icon: Layers,
    label: 'Bundle',
    description: 'Multiple items in one',
    fields: [
      { name: 'items', label: 'Bundle Items (JSON)', type: 'textarea', placeholder: '[{"type": "key", "label": "Game", "value": "KEY-123"}, ...]', required: true },
    ],
  },
  custom: {
    icon: Settings,
    label: 'Custom Fields',
    description: 'Flexible JSON structure',
    fields: [
      { name: 'fields', label: 'Custom Data (JSON)', type: 'textarea', placeholder: '[{"label": "Field Name", "value": "...", "sensitive": false}]', required: true },
    ],
  },
} as const;

// Status badge configurations
const STATUS_CONFIG: Record<
  InventoryItemResponseDtoStatusEnum,
  { label: string; className: string }
> = {
  available: { label: 'Available', className: 'bg-green-success/20 text-green-success border-green-success/30' },
  reserved: { label: 'Reserved', className: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' },
  sold: { label: 'Sold', className: 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30' },
  expired: { label: 'Expired', className: 'bg-orange-warning/20 text-orange-warning border-orange-warning/30' },
  invalid: { label: 'Invalid', className: 'bg-text-muted/20 text-text-muted border-text-muted/30' },
};

// Stats card component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  subValue,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: 'green' | 'yellow' | 'cyan' | 'orange' | 'red' | 'purple';
  subValue?: string;
}): React.JSX.Element {
  const colorClasses = {
    green: 'text-green-success',
    yellow: 'text-yellow-400',
    cyan: 'text-cyan-glow',
    orange: 'text-orange-warning',
    red: 'text-destructive',
    purple: 'text-purple-neon',
  };

  return (
    <Card className="border-border-subtle bg-bg-secondary/80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
            {subValue !== undefined && (
              <p className="text-xs text-text-muted">{subValue}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${colorClasses[color]} opacity-50`} />
        </div>
      </CardContent>
    </Card>
  );
}

// Status badge component
function StatusBadge({ status }: { status: InventoryItemResponseDtoStatusEnum }): React.JSX.Element {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

// Add Item Dialog
function AddItemDialog({
  open,
  onClose,
  deliveryType,
  productId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  deliveryType: InventoryItemResponseDtoDeliveryTypeEnum;
  productId: string;
  onSuccess: () => void;
}): React.JSX.Element {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [metaData, setMetaData] = useState({ supplier: '', cost: '', expiresAt: '', notes: '' });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const addItemMutation = useAddInventoryItem(productId);

  const config = DELIVERY_TYPE_CONFIG[deliveryType] ?? DELIVERY_TYPE_CONFIG.key;

  const handleSubmit = async (): Promise<void> => {
    // Build itemData based on delivery type
    const itemData: Record<string, unknown> = { type: deliveryType };

    switch (deliveryType) {
      case 'key':
        itemData.key = formData.key ?? '';
        break;
      case 'account':
        itemData.username = formData.username ?? '';
        itemData.password = formData.password ?? '';
        if (formData.email !== undefined && formData.email.length > 0) itemData.email = formData.email;
        if (formData.notes !== undefined && formData.notes.length > 0) itemData.notes = formData.notes;
        break;
      case 'code':
        itemData.code = formData.code ?? '';
        if (formData.pin !== undefined && formData.pin.length > 0) itemData.pin = formData.pin;
        if (formData.value !== undefined && formData.value.length > 0) itemData.value = parseFloat(formData.value);
        break;
      case 'license':
        itemData.licenseKey = formData.licenseKey ?? '';
        if (formData.seats !== undefined && formData.seats.length > 0) itemData.seats = parseInt(formData.seats, 10);
        if (formData.downloadUrl !== undefined && formData.downloadUrl.length > 0) itemData.downloadUrl = formData.downloadUrl;
        break;
      case 'bundle':
        try {
          const parsed = JSON.parse(formData.items ?? '[]') as Record<string, unknown>;
          // Handle both formats: full object { type, items } or just the array
          if (Array.isArray(parsed)) {
            itemData.items = parsed;
          } else if (Array.isArray(parsed.items)) {
            itemData.items = parsed.items as unknown[];
          } else {
            itemData.items = [];
          }
        } catch {
          itemData.items = [];
        }
        break;
      case 'custom':
        try {
          const parsed = JSON.parse(formData.fields ?? '[]') as Record<string, unknown>;
          // Handle both formats: full object { type, fields } or just the array
          if (Array.isArray(parsed)) {
            itemData.fields = parsed as Array<{ label: string; value: unknown }>;
          } else if (Array.isArray(parsed.fields)) {
            itemData.fields = parsed.fields as Array<{ label: string; value: unknown }>;
          } else {
            // Treat as single object with key-value pairs
            itemData.fields = Object.entries(parsed).map(([label, value]) => ({ label, value }));
          }
        } catch {
          itemData.fields = [];
        }
        break;
    }

    await addItemMutation.mutateAsync({
      itemData,
      supplier: metaData.supplier.length > 0 ? metaData.supplier : undefined,
      cost: metaData.cost.length > 0 ? parseFloat(metaData.cost) : undefined,
      expiresAt: metaData.expiresAt.length > 0 ? new Date(metaData.expiresAt).toISOString() : undefined,
      notes: metaData.notes.length > 0 ? metaData.notes : undefined,
    });

    // Reset and close
    setFormData({});
    setMetaData({ supplier: '', cost: '', expiresAt: '', notes: '' });
    onSuccess();
    onClose();
  };

  const togglePasswordVisibility = (fieldName: string): void => {
    setShowPasswords((prev) => ({ ...prev, [fieldName]: prev[fieldName] !== true }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <config.icon className="h-5 w-5 text-cyan-glow" />
            Add {config.label}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dynamic fields based on delivery type */}
          {config.fields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  rows={3}
                />
              ) : field.type === 'password' ? (
                <div className="relative">
                  <Input
                    id={field.name}
                    type={showPasswords[field.name] === true ? 'text' : 'password'}
                    placeholder={field.placeholder}
                    value={formData[field.name] ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => togglePasswordVisibility(field.name)}
                  >
                    {showPasswords[field.name] === true ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                />
              )}
            </div>
          ))}

          {/* Common metadata fields */}
          <div className="border-t border-border-subtle pt-4 mt-4 space-y-4">
            <p className="text-sm font-medium text-text-secondary">Optional Metadata</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  placeholder="e.g., Kinguin, G2A"
                  value={metaData.supplier}
                  onChange={(e) => setMetaData((prev) => ({ ...prev, supplier: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost (€)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={metaData.cost}
                  onChange={(e) => setMetaData((prev) => ({ ...prev, cost: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires At</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={metaData.expiresAt}
                onChange={(e) => setMetaData((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="metaNotes">Admin Notes</Label>
              <Textarea
                id="metaNotes"
                placeholder="Internal notes (not shown to customer)"
                value={metaData.notes}
                onChange={(e) => setMetaData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <GlowButton
            onClick={handleSubmit}
            disabled={addItemMutation.isPending}
          >
            {addItemMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </>
            )}
          </GlowButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Import Dialog
function BulkImportDialog({
  open,
  onClose,
  deliveryType,
  productId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  deliveryType: InventoryItemResponseDtoDeliveryTypeEnum;
  productId: string;
  onSuccess: () => void;
}): React.JSX.Element {
  const [bulkText, setBulkText] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const bulkImportMutation = useBulkImportInventory(productId);

  const handleImport = async (): Promise<void> => {
    setParseError(null);
    
    // Parse bulk text based on delivery type
    const lines = bulkText.trim().split('\n').filter((line) => line.trim().length > 0);
    
    if (lines.length === 0) {
      setParseError('No items to import');
      return;
    }

    if (lines.length > 1000) {
      setParseError('Maximum 1000 items per import');
      return;
    }

    const items = lines.map((line) => {
      const trimmed = line.trim();
      let itemData: Record<string, unknown>;

      switch (deliveryType) {
        case 'key':
          itemData = { type: 'key', key: trimmed };
          break;
        case 'account': {
          // Support multiple formats:
          // 1. username,password,email(optional)
          // 2. email:password:token (colon-separated)
          // Auto-detect separator
          const separator = trimmed.includes(':') ? ':' : ',';
          const parts = trimmed.split(separator).map((p) => p.trim());
          if (parts.length < 2) {
            throw new Error(`Invalid account format: ${trimmed}. Expected: username,password or email:password:token`);
          }
          itemData = {
            type: 'account',
            username: parts[0],
            password: parts[1],
            // Third part could be email or token - store as notes if it looks like a token
            email: parts[2] !== undefined && parts[2].length > 0 && parts[2].includes('@') ? parts[2] : undefined,
            notes: parts[2] !== undefined && parts[2].length > 0 && !parts[2].includes('@') ? parts[2] : undefined,
          };
          break;
        }
        case 'code': {
          // Expected format: code,pin(optional),value(optional)
          const parts = trimmed.split(',').map((p) => p.trim());
          itemData = {
            type: 'code',
            code: parts[0] ?? '',
            pin: parts[1] !== undefined && parts[1].length > 0 ? parts[1] : undefined,
            value: parts[2] !== undefined && parts[2].length > 0 ? parseFloat(parts[2]) : undefined,
          };
          break;
        }
        case 'license': {
          // Expected format: licenseKey,seats(optional)
          const parts = trimmed.split(',').map((p) => p.trim());
          itemData = {
            type: 'license',
            licenseKey: parts[0] ?? '',
            seats: parts[1] !== undefined && parts[1].length > 0 ? parseInt(parts[1], 10) : undefined,
          };
          break;
        }
        default:
          // For bundle/custom, expect JSON per line
          try {
            itemData = JSON.parse(trimmed) as Record<string, unknown>;
          } catch {
            throw new Error(`Invalid JSON: ${trimmed}`);
          }
      }

      return { itemData };
    });

    try {
      await bulkImportMutation.mutateAsync({
        items,
        skipDuplicates,
      });
      setBulkText('');
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setParseError(error.message);
      }
    }
  };

  const getPlaceholder = (): string => {
    switch (deliveryType) {
      case 'key':
        return 'XXXXX-XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY-YYYYY\n...';
      case 'account':
        return 'email@example.com,password123,recovery@email.com\nemail:password:token (colon format)\nuser2@email.com,password2\n...';
      case 'code':
        return 'CODE1234,1234,50.00\nCODE5678,5678\n...';
      case 'license':
        return 'LICENSE-KEY-123,5\nLICENSE-KEY-456,1\n...';
      default:
        return '{"type": "...", ...}\n{"type": "...", ...}';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-cyan-glow" />
            Bulk Import
          </DialogTitle>
          <DialogDescription>
            Paste multiple items, one per line. Maximum 1000 items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="bulkText">Items (one per line)</Label>
            <Textarea
              id="bulkText"
              placeholder={getPlaceholder()}
              value={bulkText}
              onChange={(e) => { setBulkText(e.target.value); setParseError(null); }}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">
              {bulkText.split('\n').filter((l) => l.trim().length > 0).length} items detected
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skipDuplicates"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="rounded border-border-subtle"
            />
            <Label htmlFor="skipDuplicates" className="text-sm">
              Skip duplicates (don&apos;t fail on existing items)
            </Label>
          </div>

          {parseError !== null && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {bulkImportMutation.isSuccess && bulkImportMutation.data !== undefined && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Import Complete</AlertTitle>
              <AlertDescription>
                Added: {bulkImportMutation.data.imported}, Skipped: {bulkImportMutation.data.skippedDuplicates}, Failed: {bulkImportMutation.data.failed}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <GlowButton
            onClick={handleImport}
            disabled={bulkImportMutation.isPending || bulkText.trim().length === 0}
          >
            {bulkImportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Items
              </>
            )}
          </GlowButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
export default function ProductInventoryPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // UI State
  const [showAddItem, setShowAddItem] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 25,
    status: undefined,
    supplier: undefined,
  });

  // Fetch product data
  const productQuery = useQuery<AdminProductResponseDto>({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      const api = new AdminCatalogProductsApi(apiConfig);
      return await api.adminProductsControllerGetById({ id: productId });
    },
    enabled: Boolean(productId),
    staleTime: 60_000,
  });

  // Fetch inventory data
  const inventoryQuery = useInventoryItems(productId, filters);
  const statsQuery = useInventoryStats(productId);

  // Mutations
  const deleteItemMutation = useDeleteInventoryItem(productId);
  const updateStatusMutation = useUpdateInventoryItemStatus(productId);

  const handleRefresh = useCallback((): void => {
    void inventoryQuery.refetch();
    void statsQuery.refetch();
  }, [inventoryQuery, statsQuery]);

  const handleDeleteItem = async (): Promise<void> => {
    if (deleteItemId === null) return;
    await deleteItemMutation.mutateAsync(deleteItemId);
    setDeleteItemId(null);
  };

  const handleMarkInvalid = async (itemId: string): Promise<void> => {
    await updateStatusMutation.mutateAsync({
      itemId,
      dto: { status: 'invalid', reason: 'Marked invalid by admin' },
    });
  };

  // Determine delivery type from PRODUCT, not from inventory items
  // This ensures the correct form fields are shown even when inventory is empty
  const deliveryType: InventoryItemResponseDtoDeliveryTypeEnum =
    (productQuery.data?.deliveryType as InventoryItemResponseDtoDeliveryTypeEnum) ?? 'key';

  const isCustomProduct = productQuery.data?.sourceType === 'custom';

  // Loading state
  if (productQuery.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Error or not found
  if (productQuery.error !== null || productQuery.data === undefined) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {productQuery.error instanceof Error
              ? productQuery.error.message
              : 'Product not found'}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const product = productQuery.data;
  const stats = statsQuery.data;
  const items = inventoryQuery.data?.data ?? [];
  const totalPages = inventoryQuery.data?.totalPages ?? 1;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/admin/catalog/products/${productId}`}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">Inventory Management</h1>
          </div>
          <p className="text-text-secondary">
            {product.title} ({product.sourceType.toUpperCase()})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={inventoryQuery.isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${inventoryQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isCustomProduct && (
            <>
              <Button variant="outline" onClick={() => setShowBulkImport(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
              <GlowButton onClick={() => setShowAddItem(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </GlowButton>
            </>
          )}
        </div>
      </div>

      {/* Warning for Kinguin products */}
      {!isCustomProduct && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>Kinguin Product</AlertTitle>
          <AlertDescription>
            Inventory for Kinguin products is managed automatically via the Kinguin API.
            Manual inventory management is only available for custom products.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats !== undefined && (
        <div className="grid gap-4 md:grid-cols-5 lg:grid-cols-6">
          <StatsCard
            title="Available"
            value={stats.available}
            icon={CheckCircle}
            color="green"
          />
          <StatsCard
            title="Reserved"
            value={stats.reserved}
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            title="Sold"
            value={stats.sold}
            icon={ShoppingCart}
            color="cyan"
          />
          <StatsCard
            title="Expired"
            value={stats.expired}
            icon={AlertTriangle}
            color="orange"
          />
          <StatsCard
            title="Invalid"
            value={stats.invalid}
            icon={XCircle}
            color="red"
          />
          <StatsCard
            title="Profit"
            value={`€${(stats.totalProfit ?? 0).toFixed(2)}`}
            icon={TrendingUp}
            color="purple"
            subValue={`Revenue: €${(stats.totalRevenue ?? 0).toFixed(2)}`}
          />
        </div>
      )}

      {/* Low Stock Warning */}
      {stats !== undefined && stats.available < 5 && isCustomProduct && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low Stock Warning</AlertTitle>
          <AlertDescription>
            Only {stats.available} items remaining. Consider adding more inventory.
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Table */}
      <Card className="border-border-subtle bg-bg-secondary/80">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                {inventoryQuery.data?.total ?? 0} total items
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.status ?? 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value === 'all' ? undefined : (value as InventoryFilters['status']),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inventoryQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-text-muted" />
              <h3 className="mt-4 text-lg font-medium text-text-primary">No inventory items</h3>
              <p className="mt-2 text-text-secondary">
                {isCustomProduct
                  ? 'Add items to start selling this product.'
                  : 'Inventory is managed by Kinguin.'}
              </p>
              {isCustomProduct && (
                <GlowButton className="mt-4" onClick={() => setShowAddItem(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Item
                </GlowButton>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="border-b border-border-subtle"
                      >
                        <TableCell className="font-mono text-sm text-text-secondary">
                          {item.maskedPreview ?? '••••••••'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.deliveryType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {item.supplier ?? '-'}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {item.cost !== undefined ? `€${item.cost.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {formatDate(item.uploadedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status !== 'sold' && isCustomProduct && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {item.status === 'available' && (
                                  <DropdownMenuItem onClick={() => handleMarkInvalid(item.id)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Mark Invalid
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteItemId(item.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-text-muted">
                    Page {filters.page ?? 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
                      disabled={(filters.page ?? 1) <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
                      disabled={(filters.page ?? 1) >= totalPages}
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

      {/* Add Item Dialog */}
      <AddItemDialog
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        deliveryType={deliveryType}
        productId={productId}
        onSuccess={handleRefresh}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        deliveryType={deliveryType}
        productId={productId}
        onSuccess={handleRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteItemId !== null} onOpenChange={(isOpen) => { if (!isOpen) setDeleteItemId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inventory Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteItem}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
