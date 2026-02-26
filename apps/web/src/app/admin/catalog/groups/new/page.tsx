'use client';

/**
 * Admin Create Game Spotlight Page
 *
 * Features:
 * - Create new spotlight with React Hook Form + Zod validation
 * - Spotlight-first design with hero image, accent color, badge
 * - Automatic slug generation
 * - Real-time preview
 * - Neon cyberpunk gaming aesthetic
 *
 * Spotlights are featured game landing pages shown on:
 * - Homepage "Game Spotlights" section
 * - Individual /games/[slug] pages
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
  Eye,
  Link as LinkIcon,
  CheckCircle2,
  ImageIcon,
  Sparkles,
  WifiOff,
  XCircle,
  Palette,
  Star,
  Calendar,
  Video,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AdminProductGroupsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// FORM SCHEMA
// ============================================================================

const createSpotlightSchema = z.object({
  // Basic Info
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be 100 characters or less'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Only lowercase letters, numbers, and hyphens')
    .max(100, 'Slug must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  tagline: z
    .string()
    .max(200, 'Tagline must be 200 characters or less')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional()
    .or(z.literal('')),
  longDescription: z
    .string()
    .max(5000, 'Long description must be 5000 characters or less')
    .optional()
    .or(z.literal('')),

  // Visual Settings
  heroImageUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  coverImageUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  heroVideoUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color (e.g., #00d4ff)')
    .optional()
    .or(z.literal('')),

  // Game Details
  badgeText: z.string().max(20, 'Badge text must be 20 characters or less').optional().or(z.literal('')),
  metacriticScore: z
    .number()
    .int()
    .min(0, 'Score must be 0-100')
    .max(100, 'Score must be 0-100')
    .optional()
    .or(z.literal(0)),
  releaseDate: z.string().optional().or(z.literal('')),
  developerName: z.string().max(100).optional().or(z.literal('')),
  publisherName: z.string().max(100).optional().or(z.literal('')),
  genres: z.string().max(200).optional().or(z.literal('')),

  // Settings
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0),
});

type CreateSpotlightFormData = z.infer<typeof createSpotlightSchema>;

interface SpotlightFeatureItem {
  title: string;
  description: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

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
        isError ? 'text-destructive' : isWarning ? 'text-orange-warning' : 'text-text-muted'
      } ${className}`}
    >
      {current}/{max}
    </span>
  );
}

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
      <div className="p-2 rounded-lg bg-linear-to-br from-brand-primary/20 to-purple-neon/20 border border-brand-primary/30">
        <Icon className="h-4 w-4 text-brand-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          {badge !== undefined && (
            <Badge variant="outline" className="text-xs">{badge}</Badge>
          )}
        </div>
        <p className="text-sm text-text-secondary mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function ColorPreview({ color }: { color: string }): React.JSX.Element {
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(color);
  return (
    <div
      className="w-8 h-8 rounded-lg border-2 border-bg-tertiary transition-all"
      style={{ backgroundColor: isValid ? color : '#1a1a2e' }}
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminCreateSpotlightPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
  const [features, setFeatures] = useState<SpotlightFeatureItem[]>([]);
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');

  const { handleError, clearError } = useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error: Error): void => setLastError(error.message),
    onRecovery: (): void => setLastError(null),
  });

  const form = useForm<CreateSpotlightFormData>({
    resolver: zodResolver(createSpotlightSchema),
    defaultValues: {
      title: '',
      slug: '',
      tagline: '',
      description: '',
      longDescription: '',
      heroImageUrl: '',
      coverImageUrl: '',
      heroVideoUrl: '',
      accentColor: '#00d4ff',
      badgeText: '',
      metacriticScore: 0,
      releaseDate: '',
      developerName: '',
      publisherName: '',
      genres: '',
      isActive: true,
      displayOrder: 0,
    },
    mode: 'onChange',
  });

  const { watch, setValue, formState: { isValid } } = form;
  const watchedValues = watch();
  const previewSlug = watchedValues.slug !== undefined && watchedValues.slug !== ''
    ? watchedValues.slug
    : 'your-game-slug';

  // Generate slug from title
  const generateSlug = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  // Auto-generate slug
  useEffect(() => {
    if (!slugManuallyEdited && watchedValues.title !== '') {
      setValue('slug', generateSlug(watchedValues.title), { shouldValidate: true });
    }
  }, [watchedValues.title, slugManuallyEdited, generateSlug, setValue]);

  // Reset hero image error on URL change
  useEffect(() => {
    setHeroImageError(false);
  }, [watchedValues.heroImageUrl]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateSpotlightFormData) => {
      if (!isOnline) throw new Error('No internet connection');

      const api = new AdminProductGroupsApi(apiConfig);
      const createProductGroupDto = {
        title: data.title,
        slug: data.slug !== '' ? data.slug : undefined,
        tagline: data.tagline !== '' ? data.tagline : undefined,
        description: data.description !== '' ? data.description : undefined,
        longDescription: data.longDescription !== '' ? data.longDescription : data.description !== '' ? data.description : undefined,
        coverImageUrl: data.coverImageUrl !== '' ? data.coverImageUrl : undefined,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
        isSpotlight: true,
        spotlightOrder: data.displayOrder,
        heroImageUrl: data.heroImageUrl !== '' ? data.heroImageUrl : undefined,
        heroVideoUrl: data.heroVideoUrl !== '' ? data.heroVideoUrl : undefined,
        accentColor: data.accentColor !== '' ? data.accentColor : '#00d4ff',
        badgeText: data.badgeText !== '' ? data.badgeText : undefined,
        metacriticScore: data.metacriticScore !== 0 ? data.metacriticScore : undefined,
        releaseDate: data.releaseDate !== '' ? data.releaseDate : undefined,
        developerName: data.developerName !== '' ? data.developerName : undefined,
        publisherName: data.publisherName !== '' ? data.publisherName : undefined,
        genres:
          data.genres !== undefined && data.genres !== ''
            ? data.genres.split(',').map((g) => g.trim()).filter(Boolean)
            : undefined,
        features: features.length > 0 ? features : undefined,
      } as Parameters<typeof api.adminGroupsControllerCreate>[0]['createProductGroupDto'];

      return await api.adminGroupsControllerCreate({
        createProductGroupDto,
      });
    },
    onSuccess: (result): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'spotlights'] });
      setShowSuccessToast(true);
      setTimeout(() => {
        router.push(`/admin/catalog/groups/${result.id}`);
      }, 1000);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'create-spotlight');
    },
  });

  const onSubmit = (data: CreateSpotlightFormData): void => {
    createMutation.mutate(data);
  };

  const handleClearError = (): void => {
    setLastError(null);
    clearError();
  };

  const accentColor = watchedValues.accentColor ?? '#00d4ff';

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 p-1"
          >
            {/* Success Toast */}
            <AnimatePresence>
              {showSuccessToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-green-success/20 border border-green-success/30 shadow-glow-success"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-success" />
                  <div>
                    <p className="text-sm font-medium text-green-success">Spotlight Created!</p>
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
                    <Button variant="ghost" size="icon" asChild className="shrink-0 hover:text-brand-primary">
                      <Link href="/admin/catalog/groups">
                        <ArrowLeft className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to spotlights</TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-brand-primary/20 to-purple-neon/20 border border-brand-primary/30 shadow-glow">
                    <Sparkles className="h-6 w-6 text-brand-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                      Create Spotlight
                    </h1>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Feature a game on the homepage and its dedicated page
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
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
                      Create Spotlight
                    </>
                  )}
                </GlowButton>
              </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {!isOnline && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Alert className="border-orange-warning/30 bg-orange-warning/10">
                    <WifiOff className="h-4 w-4 text-orange-warning" />
                    <AlertTitle className="text-orange-warning">You&apos;re offline</AlertTitle>
                    <AlertDescription className="text-text-secondary">
                      Check your connection to create a spotlight.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {lastError !== null && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Alert variant="destructive" className="relative">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Failed to create spotlight</AlertTitle>
                    <AlertDescription className="pr-8">{lastError}</AlertDescription>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={handleClearError}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Basic Info */}
              <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border-subtle/50 pb-4">
                  <SectionHeader
                    icon={Pencil}
                    title="Basic Info"
                    description="Game title and description"
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
                            Game Title <span className="text-destructive">*</span>
                          </FormLabel>
                          <CharacterCount current={field.value.length} max={100} />
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Grand Theft Auto V"
                            className="input-glow"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
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
                          {slugManuallyEdited && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => {
                                setSlugManuallyEdited(false);
                                setValue('slug', generateSlug(watchedValues.title), { shouldValidate: true });
                              }}
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">/games/</span>
                            <Input
                              {...field}
                              placeholder="grand-theft-auto-v"
                              className="input-glow font-mono text-sm pl-16"
                              disabled={createMutation.isPending}
                              onChange={(e) => {
                                field.onChange(e);
                                setSlugManuallyEdited(true);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Auto-generated from title. This becomes /games/{previewSlug}
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
                          <FormLabel>Short Tagline</FormLabel>
                          <CharacterCount current={field.value?.length ?? 0} max={200} />
                        </div>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="A promotional tagline shown on cards..."
                            rows={2}
                            className="input-glow resize-none"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
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
                          <FormLabel>Full Description</FormLabel>
                          <CharacterCount current={field.value?.length ?? 0} max={2000} />
                        </div>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Full game description for SEO and the spotlight page..."
                            rows={4}
                            className="input-glow resize-none"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Long Description */}
                  <FormField
                    control={form.control}
                    name="longDescription"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Marketing Description</FormLabel>
                          <CharacterCount current={field.value?.length ?? 0} max={5000} />
                        </div>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Detailed long-form content shown on the /games/[slug] marketing page..."
                            rows={6}
                            className="input-glow resize-y"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          This powers the full readable description block on the marketing spotlight page.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Visual Settings */}
              <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border-subtle/50 pb-4">
                  <SectionHeader
                    icon={ImageIcon}
                    title="Visual Settings"
                    description="Hero images and accent colors"
                  />
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {/* Hero Image Preview */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-bg-tertiary border border-border-subtle">
                    {watchedValues.heroImageUrl !== '' && !heroImageError ? (
                      <Image
                        src={watchedValues.heroImageUrl ?? ''}
                        alt="Hero preview"
                        fill
                        className="object-cover"
                        onError={() => setHeroImageError(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
                        <ImageIcon className="h-12 w-12 mb-2 opacity-30" />
                        <span className="text-sm">Hero image preview</span>
                      </div>
                    )}
                    {/* Accent color overlay preview */}
                    <div 
                      className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"
                      style={{ 
                        background: `linear-gradient(to top, ${accentColor}30, transparent 50%)`
                      }}
                    />
                    {watchedValues.badgeText !== '' && (
                      <Badge 
                        className="absolute top-3 right-3"
                        style={{ backgroundColor: `${accentColor}40`, borderColor: accentColor, color: accentColor }}
                      >
                        {watchedValues.badgeText}
                      </Badge>
                    )}
                  </div>

                  {/* Hero Image URL */}
                  <FormField
                    control={form.control}
                    name="heroImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <ImageIcon className="h-3.5 w-3.5 text-text-muted" />
                          Hero Image URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/hero.jpg"
                            className="input-glow"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Large banner image for the spotlight page (16:9 recommended)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Accent Color */}
                  <FormField
                    control={form.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Palette className="h-3.5 w-3.5 text-text-muted" />
                          Accent Color
                        </FormLabel>
                        <div className="flex gap-3">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="#00d4ff"
                              className="input-glow font-mono flex-1"
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <ColorPreview color={field.value ?? ''} />
                        </div>
                        <FormDescription>
                          Theme color for badges, gradients, and highlights
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Badge Text */}
                  <FormField
                    control={form.control}
                    name="badgeText"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Badge Text</FormLabel>
                          <CharacterCount current={field.value?.length ?? 0} max={20} />
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., NEW, BEST SELLER, -50%"
                            className="input-glow"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Promotional badge shown on cards and hero
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Video URL */}
                  <FormField
                    control={form.control}
                    name="heroVideoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Video className="h-3.5 w-3.5 text-text-muted" />
                          Trailer URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://youtube.com/watch?v=..."
                            className="input-glow"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          YouTube or video URL for the spotlight page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Game Details */}
              <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border-subtle/50 pb-4">
                  <SectionHeader
                    icon={Star}
                    title="Game Details"
                    description="Metacritic, release date, and more"
                  />
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Metacritic Score */}
                    <FormField
                      control={form.control}
                      name="metacriticScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Star className="h-3.5 w-3.5 text-yellow-500" />
                            Metacritic
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              {...field}
                              onChange={(e) => {
                                const parsed = parseInt(e.target.value, 10);
                                field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                              }}
                              className="input-glow"
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Release Date */}
                    <FormField
                      control={form.control}
                      name="releaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-text-muted" />
                            Release Date
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="input-glow"
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Developer / Publisher */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="developerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Developer</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Rockstar Games"
                              className="input-glow"
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="publisherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publisher</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Rockstar Games"
                              className="input-glow"
                              disabled={createMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Genres */}
                  <FormField
                    control={form.control}
                    name="genres"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genres</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Action, Adventure, Open World"
                            className="input-glow"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>Comma-separated list</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border-subtle/50 pb-4">
                  <SectionHeader
                    icon={Eye}
                    title="Visibility"
                    description="Control when and where it appears"
                  />
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {/* Is Active */}
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border-subtle p-4 hover:border-brand-primary/30 transition-colors">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-green-success" />
                            Live
                          </FormLabel>
                          <FormDescription>
                            Show on homepage and /games route
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Display Order */}
                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value, 10);
                              field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                            }}
                            className="input-glow w-24"
                            disabled={createMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Lower numbers appear first on the homepage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview Link Hint */}
                  <div className="rounded-lg border border-border-subtle/50 bg-bg-tertiary/30 p-4">
                    <p className="text-sm text-text-muted flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      After creating, you can preview at:
                    </p>
                    <code className="text-xs text-brand-primary font-mono mt-1 block">
                      /games/{previewSlug}
                    </code>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm lg:col-span-2">
                <CardHeader className="border-b border-border-subtle/50 pb-4">
                  <SectionHeader
                    icon={Sparkles}
                    title="Feature Highlights"
                    description="Add titled feature cards for the marketing page"
                  />
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {features.length > 0 && (
                    <div className="space-y-3">
                      {features.map((feature, index) => (
                        <div key={`${index}-${feature.title}`} className="rounded-lg border border-border-subtle bg-bg-tertiary/40 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-text-primary">{feature.title}</p>
                              {feature.description !== '' && (
                                <p className="text-sm text-text-secondary">{feature.description}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 hover:bg-destructive/20"
                              onClick={() => setFeatures((prev) => prev.filter((_, i) => i !== index))}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={newFeatureTitle}
                      onChange={(e) => setNewFeatureTitle(e.target.value)}
                      placeholder="Feature title (e.g., Dynamic Weather System)"
                      className="input-glow"
                      disabled={createMutation.isPending}
                    />
                    <Input
                      value={newFeatureDescription}
                      onChange={(e) => setNewFeatureDescription(e.target.value)}
                      placeholder="Feature description"
                      className="input-glow"
                      disabled={createMutation.isPending}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={newFeatureTitle.trim() === '' || createMutation.isPending}
                      onClick={() => {
                        const title = newFeatureTitle.trim();
                        const description = newFeatureDescription.trim();
                        if (title === '') {
                          return;
                        }

                        setFeatures((prev) => [...prev, { title, description }]);
                        setNewFeatureTitle('');
                        setNewFeatureDescription('');
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      Add Feature
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <Button variant="ghost" type="button" asChild>
                <Link href="/admin/catalog/groups">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Link>
              </Button>
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
                    <Sparkles className="h-4 w-4" />
                    Create Spotlight
                    <ArrowRight className="h-4 w-4" />
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
