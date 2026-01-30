'use client';

/**
 * Admin Create Product Group Page
 *
 * Features:
 * - Create new product group with React Hook Form + Zod validation
 * - Set title, tagline, cover image
 * - Choose visibility status
 * - Automatic slug generation
 * - Real-time form validation
 * - Neon cyberpunk gaming aesthetic
 * - Full 9-state implementation
 *
 * Follows BitLoot design system
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
import { Textarea } from '@/design-system/primitives/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { Switch } from '@/design-system/primitives/switch';

import { Badge } from '@/design-system/primitives/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/design-system/primitives/tooltip';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/design-system/primitives/form';
import {
  AlertTriangle,
  Save,
  Loader2,
  ArrowLeft,
  Pencil,
  Layers,
  Eye,
  EyeOff,
  Link as LinkIcon,
  CheckCircle2,
  ImageIcon,
  Hash,
  FileText,
  Settings,
  Sparkles,
  WifiOff,
  XCircle,
  Info,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AdminProductGroupsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

// Form validation schema
const createGroupSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be less than 100 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .max(100, 'Slug must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  tagline: z.string().max(200, 'Tagline must be less than 200 characters').optional().or(z.literal('')),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional().or(z.literal('')),
  coverImageUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0, 'Must be 0 or greater'),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

// Character counter component
function CharacterCount({
  current,
  max,
  className = '',
}: {
  current: number;
  max: number;
  className?: string;
}): React.JSX.Element {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= 80;
  const isError = percentage >= 100;

  return (
    <span
      className={`text-xs tabular-nums ${
        isError
          ? 'text-destructive'
          : isWarning
            ? 'text-orange-warning'
            : 'text-text-muted'
      } ${className}`}
    >
      {current}/{max}
    </span>
  );
}

// Form section header component
function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30">
        <Icon className="h-4 w-4 text-cyan-glow" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          {badge !== undefined && (
            <Badge variant="outline" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-text-secondary mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export default function AdminCreateProductGroupPage(): React.JSX.Element {
  const router = useRouter();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Form setup with React Hook Form + Zod
  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      title: '',
      slug: '',
      tagline: '',
      description: '',
      coverImageUrl: '',
      isActive: true,
      displayOrder: 0,
    },
    mode: 'onChange',
  });

  const { watch, setValue, formState: { isValid } } = form;
  const watchedValues = watch();

  // Error handling
  const { handleError, clearError } = useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error: Error): void => {
      setLastError(error.message);
    },
    onRecovery: (): void => {
      setLastError(null);
    },
  });

  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();

  // Generate slug from title
  const generateSlug = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  // Auto-generate slug when title changes (if not manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && watchedValues.title !== '') {
      setValue('slug', generateSlug(watchedValues.title), { shouldValidate: true });
    }
  }, [watchedValues.title, slugManuallyEdited, generateSlug, setValue]);

  // Reset image error when URL changes
  useEffect(() => {
    setImageError(false);
  }, [watchedValues.coverImageUrl]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateGroupFormData) => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerCreate({
        createProductGroupDto: {
          title: data.title,
          slug: data.slug !== '' ? data.slug : undefined,
          tagline: data.tagline !== '' ? data.tagline : undefined,
          description: data.description !== '' ? data.description : undefined,
          coverImageUrl: data.coverImageUrl !== '' ? data.coverImageUrl : undefined,
          isActive: data.isActive,
          displayOrder: data.displayOrder,
        },
      });
    },
    onSuccess: (result): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups'] });
      setShowSuccessToast(true);
      // Redirect after a brief delay to show success state
      setTimeout(() => {
        router.push(`/admin/catalog/groups/${result.id}`);
      }, 1000);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'create-group');
    },
  });

  // Form submit handler
  const onSubmit = (data: CreateGroupFormData): void => {
    createMutation.mutate(data);
  };

  // Clear error handler
  const handleClearError = (): void => {
    setLastError(null);
    clearError();
  };

  // Calculate form completion
  const completedFields = [
    watchedValues.title !== '',
    watchedValues.slug !== '',
  ].filter(Boolean).length;
  const totalRequiredFields = 1; // Only title is required
  const optionalCompleted = [
    watchedValues.tagline !== '',
    watchedValues.description !== '',
    watchedValues.coverImageUrl !== '',
  ].filter(Boolean).length;

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6 p-1"
          >
            {/* Success Toast */}
            <AnimatePresence>
              {showSuccessToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-green-success/20 border border-green-success/30 shadow-glow-success"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-success" />
                  <div>
                    <p className="text-sm font-medium text-green-success">Group Created!</p>
                    <p className="text-xs text-green-success/80">Redirecting to edit page...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="shrink-0 hover:bg-bg-tertiary hover:text-cyan-glow transition-colors"
                    >
                      <Link href="/admin/catalog/groups">
                        <ArrowLeft className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to groups</TooltipContent>
                </Tooltip>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30 shadow-glow-cyan-sm">
                      <Layers className="h-6 w-6 text-cyan-glow" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                        Create Group
                      </h1>
                      <p className="text-sm text-text-secondary mt-0.5">
                        Create a new product group to bundle variants together
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Form Progress */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary/50 border border-border-subtle">
                  <div className="flex gap-1">
                    {Array.from({ length: totalRequiredFields }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i < completedFields
                            ? 'bg-green-success shadow-glow-success'
                            : 'bg-bg-tertiary'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-muted">
                    {completedFields}/{totalRequiredFields} required
                    {optionalCompleted > 0 && ` + ${optionalCompleted} optional`}
                  </span>
                </div>
                <GlowButton
                  type="submit"
                  disabled={!isValid || createMutation.isPending || !isOnline}
                  className="gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Group
                    </>
                  )}
                </GlowButton>
              </div>
            </div>

            {/* Offline Alert */}
            <AnimatePresence>
              {!isOnline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert className="border-orange-warning/30 bg-orange-warning/10">
                    <WifiOff className="h-4 w-4 text-orange-warning" />
                    <AlertTitle className="text-orange-warning">You&apos;re offline</AlertTitle>
                    <AlertDescription className="text-text-secondary">
                      Please check your internet connection to create a group.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Alert */}
            <AnimatePresence>
              {lastError !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert variant="destructive" className="relative">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Failed to create group</AlertTitle>
                    <AlertDescription className="pr-8">{lastError}</AlertDescription>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 hover:bg-destructive/20"
                      onClick={handleClearError}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Basic Details Card */}
              <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-border-subtle/50 pb-4">
                  <SectionHeader
                    icon={Pencil}
                    title="Basic Details"
                    description="Required information for the group"
                    badge="Required"
                  />
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-text-muted" />
                            Title
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <CharacterCount current={field.value.length} max={100} />
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Battlefield 6"
                            className="input-glow"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          The name displayed in the catalog and search results
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Slug */}
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-2">
                            <LinkIcon className="h-3.5 w-3.5 text-text-muted" />
                            URL Slug
                          </FormLabel>
                          <div className="flex items-center gap-2">
                            {slugManuallyEdited && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-text-muted hover:text-cyan-glow"
                                onClick={() => {
                                  setSlugManuallyEdited(false);
                                  setValue('slug', generateSlug(watchedValues.title), { shouldValidate: true });
                                }}
                              >
                                Reset to auto
                              </Button>
                            )}
                            <CharacterCount current={field.value?.length ?? 0} max={100} />
                          </div>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="battlefield-6"
                              className="input-glow font-mono text-sm"
                              disabled={createMutation.isPending}
                              onChange={(e) => {
                                field.onChange(e);
                                setSlugManuallyEdited(true);
                              }}
                            />
                            {!slugManuallyEdited && watchedValues.title !== '' && (
                              <Badge
                                variant="outline"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-bg-tertiary"
                              >
                                Auto
                              </Badge>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          URL-friendly identifier. Auto-generated from title if left empty.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tagline */}
                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-text-muted" />
                            Tagline
                          </FormLabel>
                          <CharacterCount current={field.value?.length ?? 0} max={200} />
                        </div>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="A short catchy description..."
                            rows={2}
                            className="input-glow resize-none"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Short promotional text shown on cards
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-text-muted" />
                            Description
                          </FormLabel>
                          <CharacterCount current={field.value?.length ?? 0} max={2000} />
                        </div>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Full description of the product group..."
                            rows={4}
                            className="input-glow resize-none"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed description shown on the group page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Settings Card */}
              <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-border-subtle/50 pb-4">
                  <SectionHeader
                    icon={Settings}
                    title="Settings"
                    description="Visibility and display options"
                    badge="Optional"
                  />
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {/* Cover Image */}
                  <FormField
                    control={form.control}
                    name="coverImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <ImageIcon className="h-3.5 w-3.5 text-text-muted" />
                          Cover Image URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            className="input-glow"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        {/* Image Preview */}
                        <AnimatePresence mode="wait">
                          {field.value !== null && field.value !== undefined && field.value !== '' && !imageError && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3"
                            >
                              <div className="relative w-full aspect-video max-w-xs rounded-lg overflow-hidden border border-border-subtle bg-bg-tertiary group">
                                <Image
                                  src={field.value ?? ''}
                                  alt="Cover preview"
                                  fill
                                  sizes="320px"
                                  className="object-contain transition-transform group-hover:scale-105"
                                  onError={() => setImageError(true)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Badge
                                  className="absolute bottom-2 left-2 badge-success opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Valid Image
                                </Badge>
                              </div>
                            </motion.div>
                          )}
                          {field.value !== '' && imageError && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3"
                            >
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                <p className="text-sm text-destructive">
                                  Failed to load image. Please check the URL.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <FormDescription>
                          If not provided, will use the first product&apos;s image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Display Order */}
                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-text-muted" />
                          Display Order
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              field.onChange(Number.isNaN(val) ? 0 : val);
                            }}
                            min={0}
                            className="input-glow w-32"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Lower numbers appear first in listings (0 = highest priority)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Active Status */}
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-bg-tertiary/50 border border-border-subtle hover:border-border-accent transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg transition-colors ${
                                field.value
                                  ? 'bg-green-success/20 text-green-success'
                                  : 'bg-bg-tertiary text-text-muted'
                              }`}
                            >
                              {field.value ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <FormLabel className="text-base cursor-pointer">
                                {field.value ? 'Active' : 'Inactive'}
                              </FormLabel>
                              <FormDescription className="mt-0.5">
                                {field.value
                                  ? 'Visible in catalog immediately'
                                  : 'Hidden until activated'}
                              </FormDescription>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card className="border-cyan-glow/30 bg-cyan-glow/5 overflow-hidden">
              <CardContent className="py-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-cyan-glow/20 shrink-0">
                    <Info className="h-5 w-5 text-cyan-glow" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary mb-1">What happens next?</h4>
                    <p className="text-sm text-text-secondary mb-3">
                      After creating the group, you&apos;ll be redirected to the edit page where you can
                      add products. Products with different platforms, editions, or regions can be
                      grouped together to show as a single card in the catalog.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-glow/20 text-cyan-glow flex items-center justify-center text-xs font-bold">1</span>
                        Create group
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-text-muted self-center" />
                      <Badge variant="outline" className="gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-neon/20 text-purple-neon flex items-center justify-center text-xs font-bold">2</span>
                        Add products
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-text-muted self-center" />
                      <Badge variant="outline" className="gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-green-success/20 text-green-success flex items-center justify-center text-xs font-bold">3</span>
                        Publish to catalog
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Submit Button */}
            <div className="lg:hidden">
              <GlowButton
                type="submit"
                disabled={!isValid || createMutation.isPending || !isOnline}
                className="w-full gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Group
                  </>
                )}
              </GlowButton>
            </div>
          </motion.div>
        </form>
      </Form>
    </TooltipProvider>
  );
}
