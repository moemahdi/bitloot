'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  Check,
  AlertCircle,
  Loader2,
  Crown,
  Gamepad2,
  Monitor,
  Gift,
  Clock,
  CheckCircle2,
  X,
  Star,
  Sparkles,
  ArrowRight,
  Info,
  Download,
  Filter,
  ImageOff,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Input } from '@/design-system/primitives/input';
import { Button } from '@/design-system/primitives/button';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Badge } from '@/design-system/primitives/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/design-system/primitives/table';
import { Alert, AlertDescription } from '@/design-system/primitives/alert';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system/primitives/select';
import { Checkbox } from '@/design-system/primitives/checkbox';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';

import {
  AdminCatalogKinguinApi,
  type KinguinProductResultDto,
} from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Loading skeleton for the search results table */
function TableSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg bg-bg-tertiary/30 border border-border-subtle"
        >
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Section header with gradient icon container */
function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
  gradient = 'purple',
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  gradient?: 'cyan' | 'purple' | 'pink' | 'green';
}): React.JSX.Element {
  const gradientClasses = {
    cyan: 'from-cyan-glow/20 to-cyan-glow/5 border-cyan-glow/30 shadow-glow-cyan-sm',
    purple: 'from-purple-neon/20 to-purple-neon/5 border-purple-neon/30 shadow-glow-purple-sm',
    pink: 'from-pink-featured/20 to-pink-featured/5 border-pink-featured/30 shadow-glow-pink',
    green: 'from-green-success/20 to-green-success/5 border-green-success/30 shadow-glow-success',
  };

  const iconColors = {
    cyan: 'text-cyan-glow',
    purple: 'text-purple-neon',
    pink: 'text-pink-featured',
    green: 'text-green-success',
  };

  return (
    <div className="flex items-start gap-4">
      <div
        className={`p-3 rounded-xl bg-linear-to-br ${gradientClasses[gradient]} border transition-all duration-300`}
      >
        <Icon className={`h-6 w-6 ${iconColors[gradient]}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {title}
          </h1>
          {badge}
        </div>
        {description != null && description !== '' && (
          <p className="text-text-secondary mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

/** Stats card for displaying metrics */
function StatsCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'info';
}): React.JSX.Element {
  const variantClasses = {
    default: {
      bg: 'bg-bg-tertiary/50',
      border: 'border-border-subtle',
      icon: 'text-text-muted',
      value: 'text-text-primary',
    },
    success: {
      bg: 'bg-green-success/5',
      border: 'border-green-success/20',
      icon: 'text-green-success',
      value: 'text-green-success',
    },
    warning: {
      bg: 'bg-orange-warning/5',
      border: 'border-orange-warning/20',
      icon: 'text-orange-warning',
      value: 'text-orange-warning',
    },
    info: {
      bg: 'bg-cyan-glow/5',
      border: 'border-cyan-glow/20',
      icon: 'text-cyan-glow',
      value: 'text-cyan-glow',
    },
  };

  const classes = variantClasses[variant];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${classes.bg} border ${classes.border}`}
    >
      <Icon className={`h-5 w-5 ${classes.icon} shrink-0`} />
      <div className="min-w-0">
        <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
        <p className={`text-lg font-semibold ${classes.value}`}>{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  games: { label: 'Games', icon: Gamepad2, color: 'text-cyan-glow', description: 'Video games and gaming content' },
  software: { label: 'Software', icon: Monitor, color: 'text-purple-neon', description: 'Applications and tools' },
  'gift-cards': { label: 'Gift Cards', icon: Gift, color: 'text-pink-featured', description: 'Prepaid gift cards' },
  subscriptions: { label: 'Subscriptions', icon: Clock, color: 'text-green-success', description: 'Recurring services' },
} as const;

type BusinessCategory = keyof typeof CATEGORY_CONFIG;

const kinguinApi = new AdminCatalogKinguinApi(apiConfig);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminImportPage(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('games');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const queryClient = useQueryClient();

  // Show success toast helper
  const showSuccess = (message: string): void => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Handle image load error
  const handleImageError = (productId: string): void => {
    setImageErrors((prev) => new Set(prev).add(productId));
  };

  // Debounce search input with useEffect
  useEffect(() => {
    if (searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDebouncedQuery('');
    }
  }, [searchQuery]);

  // Handle search input change
  const handleSearchChange = (value: string): void => {
    setSearchQuery(value);
  };

  // Toggle product selection
  const toggleProductSelection = (productId: string): void => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Select all unimported products
  const selectAllUnimported = (): void => {
    if (searchResults?.results != null) {
      const unimportedIds = searchResults.results
        .filter((p) => !p.alreadyImported)
        .map((p) => p.productId);
      setSelectedProducts(new Set(unimportedIds));
    }
  };

  // Clear selection
  const clearSelection = (): void => {
    setSelectedProducts(new Set());
  };

  // Search Kinguin products
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
    isFetching,
  } = useQuery({
    queryKey: ['kinguin-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery === '' || debouncedQuery.length < 3) {
        return null;
      }
      const response = await kinguinApi.adminKinguinControllerSearchProducts({
        query: debouncedQuery,
        limit: '20',
      });
      return response;
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 30_000, // 30 seconds
  });

  // Import product mutation
  const importMutation = useMutation({
    mutationFn: async ({ productId, category }: { productId: string; category: BusinessCategory }) => {
      const response = await kinguinApi.adminKinguinControllerImportProduct({
        productId,
        businessCategory: category,
      });
      return response;
    },
    onSuccess: (data) => {
      showSuccess(`"${data.title}" has been ${data.isNew ? 'imported' : 'updated'} successfully!`);
      toast.success(data.isNew ? 'Product Imported!' : 'Product Updated!', {
        description: `"${data.title}" added to ${CATEGORY_CONFIG[selectedCategory].label}.`,
      });
      void queryClient.invalidateQueries({ queryKey: ['kinguin-search'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error) => {
      toast.error('Import Failed', {
        description: error instanceof Error ? error.message : 'Failed to import product',
      });
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async ({ productIds, category }: { productIds: string[]; category: BusinessCategory }) => {
      const results = [];
      for (const productId of productIds) {
        try {
          const response = await kinguinApi.adminKinguinControllerImportProduct({
            productId,
            businessCategory: category,
          });
          results.push({ productId, success: true, data: response });
        } catch (error) {
          results.push({ productId, success: false, error });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;
      
      if (successCount > 0) {
        showSuccess(`Successfully imported ${successCount} product${successCount > 1 ? 's' : ''}!`);
        toast.success(`Imported ${successCount} product${successCount > 1 ? 's' : ''}!`, {
          description: failCount > 0 ? `${failCount} failed to import.` : undefined,
        });
      }
      if (failCount > 0 && successCount === 0) {
        toast.error('Import Failed', {
          description: `All ${failCount} imports failed.`,
        });
      }
      
      void queryClient.invalidateQueries({ queryKey: ['kinguin-search'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setSelectedProducts(new Set());
    },
  });

  const handleImport = (productId: string): void => {
    importMutation.mutate({ productId, category: selectedCategory });
  };

  const handleBulkImport = (): void => {
    if (selectedProducts.size === 0) return;
    bulkImportMutation.mutate({ 
      productIds: Array.from(selectedProducts), 
      category: selectedCategory 
    });
  };

  // Filter results by platform
  const filteredResults = searchResults?.results.filter((product) => {
    if (platformFilter === 'all') return true;
    return product.platform?.toLowerCase() === platformFilter.toLowerCase();
  }) ?? [];

  // Get unique platforms from results
  const availablePlatforms = searchResults?.results != null
    ? [...new Set(searchResults.results.map((p) => p.platform).filter(Boolean))]
    : [];

  // Count stats
  const importedCount = filteredResults.filter((p) => p.alreadyImported).length;
  const availableCount = filteredResults.filter((p) => !p.alreadyImported).length;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6 animate-fade-in">
        {/* Floating Success Toast */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-green-success/10 border border-green-success/30 shadow-glow-success backdrop-blur-sm"
            >
              <CheckCircle2 className="h-5 w-5 text-green-success shrink-0" />
              <span className="text-sm font-medium text-green-success">{successMessage}</span>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="p-1 rounded hover:bg-green-success/20 transition-colors"
              >
                <X className="h-4 w-4 text-green-success" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="relative">
          <div className="absolute -inset-x-6 top-0 h-32 bg-linear-to-br from-purple-neon/8 via-cyan-glow/5 to-transparent rounded-xl pointer-events-none" />
          <div className="relative">
            <SectionHeader
              icon={Crown}
              title="Import from Kinguin"
              description="Search for products on Kinguin and import them to your catalog."
              gradient="purple"
              badge={
                searchResults?.totalCount != null && searchResults.totalCount > 0 ? (
                  <Badge className="badge-info">{searchResults.totalCount} found</Badge>
                ) : undefined
              }
            />
          </div>
        </div>

        {/* Search Card */}
        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-linear-to-br from-cyan-glow/20 to-cyan-glow/5 border border-cyan-glow/30 shadow-glow-cyan-sm">
                <Search className="h-5 w-5 text-cyan-glow" />
              </div>
              <div>
                <CardTitle className="text-text-primary">Search Kinguin Products</CardTitle>
                <CardDescription className="text-text-secondary">
                  Enter at least 3 characters to search. Select a category before importing.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
              <Input
                placeholder="Search for games, software, keys..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-12 input-glow bg-bg-tertiary/50 transition-all duration-300"
                maxLength={100}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isFetching && (
                  <Loader2 className="h-4 w-4 animate-spin-glow text-cyan-glow" />
                )}
                <span className="text-xs text-text-muted tabular-nums">
                  {searchQuery.length}/100
                </span>
              </div>
            </div>

            {/* Category Selection & Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-bg-tertiary/30 border border-border-subtle">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-text-secondary cursor-help flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" />
                      Import as:
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select category for imported products</p>
                  </TooltipContent>
                </Tooltip>
                <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as BusinessCategory)}>
                  <SelectTrigger className="w-[180px] input-glow bg-bg-tertiary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border-subtle bg-bg-secondary/98 backdrop-blur-xl">
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span>{config.label}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {availablePlatforms.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-text-secondary cursor-help flex items-center gap-1">
                        <Filter className="h-3.5 w-3.5" />
                        Platform:
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter results by platform</p>
                    </TooltipContent>
                  </Tooltip>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-40 input-glow bg-bg-tertiary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border-subtle bg-bg-secondary/98 backdrop-blur-xl">
                      <SelectItem value="all">All Platforms</SelectItem>
                      {availablePlatforms.map((platform) => (
                        <SelectItem key={platform} value={platform ?? ''}>
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Category Info Badge */}
              <div className="ml-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={`${CATEGORY_CONFIG[selectedCategory].color} border-current/30 bg-current/5`}>
                      <Info className="h-3 w-3 mr-1" />
                      {CATEGORY_CONFIG[selectedCategory].description}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Products will be imported as {CATEGORY_CONFIG[selectedCategory].label}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Search hint */}
            <AnimatePresence mode="wait">
              {searchQuery.length > 0 && searchQuery.length < 3 && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-text-muted flex items-center gap-2"
                >
                  <Info className="h-4 w-4" />
                  Type {3 - searchQuery.length} more character{3 - searchQuery.length > 1 ? 's' : ''} to search...
                </motion.p>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Error Alert */}
        <AnimatePresence mode="wait">
          {searchError != null && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
            >
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <AlertDescription className="text-destructive/90 pt-1.5 flex-1">
                    {searchError instanceof Error ? searchError.message : 'Failed to search Kinguin products'}
                  </AlertDescription>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isSearching && debouncedQuery.length >= 3 && (
          <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin-glow text-cyan-glow" />
                <CardTitle className="text-text-primary">Searching Kinguin...</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <TableSkeleton />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {searchResults != null && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-linear-to-br from-purple-neon/20 to-purple-neon/5 border border-purple-neon/30">
                      <Package className="h-5 w-5 text-purple-neon" />
                    </div>
                    <div>
                      <CardTitle className="text-text-primary">Search Results</CardTitle>
                      {filteredResults.filter((p) => !p.alreadyImported).length > 0 && selectedProducts.size === 0 && (
                        <CardDescription>
                          <button
                            type="button"
                            className="text-cyan-glow hover:text-cyan-glow/80 hover:underline transition-colors"
                            onClick={selectAllUnimported}
                          >
                            Select all unimported ({availableCount})
                          </button>
                        </CardDescription>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedProducts.size > 0 && (
                      <>
                        <Badge className="badge-info">
                          <Check className="h-3 w-3 mr-1" />
                          {selectedProducts.size} selected
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={clearSelection}
                              className="border-border-subtle hover:border-border-accent"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Clear
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Clear selection</TooltipContent>
                        </Tooltip>
                        <GlowButton
                          size="sm"
                          onClick={handleBulkImport}
                          disabled={bulkImportMutation.isPending}
                          glowColor="cyan"
                        >
                          {bulkImportMutation.isPending ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin-glow" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                              Import {selectedProducts.size}
                            </>
                          )}
                        </GlowButton>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <StatsCard
                    icon={Package}
                    label="Total Results"
                    value={searchResults.totalCount}
                    variant="default"
                  />
                  <StatsCard
                    icon={Search}
                    label="Showing"
                    value={filteredResults.length}
                    variant="info"
                  />
                  <StatsCard
                    icon={Check}
                    label="Already Imported"
                    value={importedCount}
                    variant="success"
                  />
                  <StatsCard
                    icon={Download}
                    label="Available"
                    value={availableCount}
                    variant="default"
                  />
                </div>
              </CardHeader>
              <CardContent>
            {filteredResults.length === 0 ? (
              <div className="empty-state py-16">
                <div className="p-4 rounded-full bg-bg-tertiary/50 border border-border-subtle mb-4">
                  <Package className="h-12 w-12 text-text-muted" />
                </div>
                <h3 className="empty-state-title">No products found</h3>
                <p className="empty-state-description">
                  {platformFilter !== 'all' 
                    ? 'Try changing the platform filter or search term.'
                    : 'Try a different search term or check your spelling.'}
                </p>
                {platformFilter !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlatformFilter('all')}
                    className="mt-4"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Clear platform filter
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="rounded-lg border border-border-subtle">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-tertiary/40 border-border-subtle hover:bg-bg-tertiary/60">
                      <TableHead className="w-12 text-text-secondary">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">Select</span>
                          </TooltipTrigger>
                          <TooltipContent>Select products for bulk import</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-16 text-text-secondary">Image</TableHead>
                      <TableHead className="text-text-secondary">Product</TableHead>
                      <TableHead className="text-text-secondary">Platform</TableHead>
                      <TableHead className="text-text-secondary">Region</TableHead>
                      <TableHead className="text-right text-text-secondary">Price</TableHead>
                      <TableHead className="text-right text-text-secondary">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((product: KinguinProductResultDto, index) => (
                      <motion.tr
                        key={product.productId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className={`border-border-subtle transition-all duration-200 ${
                          selectedProducts.has(product.productId) 
                            ? 'bg-cyan-glow/5 hover:bg-cyan-glow/10' 
                            : 'hover:bg-bg-tertiary/40'
                        }`}
                      >
                        <TableCell className="w-12">
                          {!product.alreadyImported && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Checkbox
                                    checked={selectedProducts.has(product.productId)}
                                    onCheckedChange={() => toggleProductSelection(product.productId)}
                                    className="border-border-accent data-[state=checked]:bg-cyan-glow data-[state=checked]:border-cyan-glow"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {selectedProducts.has(product.productId) ? 'Deselect' : 'Select for bulk import'}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="w-16">
                          {product.coverImageUrl != null && product.coverImageUrl !== '' && !imageErrors.has(product.productId) ? (
                            <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-border-subtle bg-bg-tertiary/50 group">
                              <Image
                                src={product.coverImageUrl}
                                alt={product.name}
                                fill
                                sizes="56px"
                                className="object-contain transition-transform duration-300 group-hover:scale-110"
                                onError={() => handleImageError(product.productId)}
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-14 w-14 rounded-lg bg-bg-tertiary/50 flex items-center justify-center border border-border-subtle">
                              <ImageOff className="h-6 w-6 text-text-muted" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 max-w-[280px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-medium text-text-primary line-clamp-1 cursor-help">
                                  {product.name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-medium">{product.name}</p>
                                {product.originalName != null && product.originalName !== '' && product.originalName !== product.name && (
                                  <p className="text-text-muted text-xs mt-1">Original: {product.originalName}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                            {product.originalName != null && product.originalName !== '' && product.originalName !== product.name && (
                              <span className="text-xs text-text-muted line-clamp-1">
                                {product.originalName}
                              </span>
                            )}
                            {product.metacriticScore != null && product.metacriticScore > 0 && (
                              <span className="flex items-center gap-1 text-xs text-text-muted">
                                <Star className="h-3 w-3 text-orange-warning" />
                                Metacritic: {product.metacriticScore}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.platform != null && product.platform !== '' ? (
                            <Badge variant="outline" className="border-border-subtle text-text-secondary">
                              {product.platform}
                            </Badge>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.region != null && product.region !== '' ? (
                            <Badge className="bg-bg-tertiary/50 text-text-secondary border border-border-subtle">
                              {product.region}
                            </Badge>
                          ) : (
                            <span className="text-text-muted">Global</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="crypto-amount text-cyan-glow font-medium">
                            ${product.price.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.alreadyImported ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="badge-success cursor-help">
                                  <Check className="h-3 w-3 mr-1" />
                                  Imported
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>This product is already in your catalog</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <GlowButton
                                    size="sm"
                                    onClick={() => handleImport(product.productId)}
                                    disabled={importMutation.isPending || bulkImportMutation.isPending}
                                    glowColor="cyan"
                                  >
                                    {importMutation.isPending && importMutation.variables?.productId === product.productId ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin-glow" />
                                        Importing...
                                      </>
                                    ) : (
                                      <>
                                        <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                                        Import
                                      </>
                                    )}
                                  </GlowButton>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Import as {CATEGORY_CONFIG[selectedCategory].label}</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )}

        {/* Empty State - No Search Yet */}
        {searchResults == null && !isSearching && debouncedQuery.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm">
              <CardContent className="pt-8">
                <div className="empty-state py-12">
                  <div className="relative mb-6">
                    <div className="p-5 rounded-2xl bg-linear-to-br from-purple-neon/15 to-cyan-glow/10 border border-purple-neon/20 shadow-glow-purple-sm">
                      <Search className="h-12 w-12 text-purple-neon" />
                    </div>
                    <div className="absolute -top-2 -right-2 p-2 rounded-full bg-cyan-glow/20 border border-cyan-glow/30 animate-glow-pulse">
                      <Crown className="h-4 w-4 text-cyan-glow" />
                    </div>
                  </div>
                  <h3 className="empty-state-title text-xl">Start searching Kinguin</h3>
                  <p className="empty-state-description max-w-md">
                    Enter a product name above to search the Kinguin catalog.
                    You can import products one by one or select multiple for bulk import.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    <Badge className="badge-info">
                      <Gamepad2 className="h-3 w-3 mr-1" />
                      Games
                    </Badge>
                    <Badge className="bg-purple-neon/10 text-purple-neon border border-purple-neon/30">
                      <Monitor className="h-3 w-3 mr-1" />
                      Software
                    </Badge>
                    <Badge className="badge-featured">
                      <Gift className="h-3 w-3 mr-1" />
                      Gift Cards
                    </Badge>
                    <Badge className="bg-green-success/10 text-green-success border border-green-success/30">
                      <Clock className="h-3 w-3 mr-1" />
                      Subscriptions
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}
