'use client';

/**
 * Admin Create Product Group Page
 *
 * Features:
 * - Create new product group
 * - Set title, tagline, cover image
 * - Choose visibility status
 * - Automatic slug generation
 *
 * Follows Level 5 admin page patterns
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { Input } from '@/design-system/primitives/input';
import { Textarea } from '@/design-system/primitives/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import { Switch } from '@/design-system/primitives/switch';
import { Label } from '@/design-system/primitives/label';
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
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AdminProductGroupsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion } from 'framer-motion';

export default function AdminCreateProductGroupPage(): React.JSX.Element {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  // Error handling
  const [lastError, setLastError] = useState<string | null>(null);
  const { handleError, clearError: _clearError } = useErrorHandler({
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
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Update title and auto-generate slug
  const handleTitleChange = (value: string): void => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  };

  // Mark slug as manually edited
  const handleSlugChange = (value: string): void => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        throw new Error('No internet connection');
      }
      const api = new AdminProductGroupsApi(apiConfig);
      return await api.adminGroupsControllerCreate({
        createProductGroupDto: {
          title,
          slug: slug !== '' ? slug : undefined,
          tagline: tagline !== '' ? tagline : undefined,
          description: description !== '' ? description : undefined,
          coverImageUrl: coverImageUrl !== '' ? coverImageUrl : undefined,
          isActive,
          displayOrder,
        },
      });
    },
    onSuccess: (result): void => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'groups'] });
      // Redirect to the new group's edit page
      router.push(`/admin/catalog/groups/${result.id}`);
    },
    onError: (error: unknown): void => {
      handleError(error instanceof Error ? error : new Error(String(error)), 'create-group');
    },
  });

  // Validate form
  const isValid = title.trim() !== '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/catalog/groups">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Layers className="h-6 w-6 text-cyan-glow" />
              Create Group
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Create a new product group to bundle variants
            </p>
          </div>
        </div>
        <GlowButton
          onClick={() => createMutation.mutate()}
          disabled={!isValid || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Create Group
        </GlowButton>
      </div>

      {/* Offline Alert */}
      {!isOnline && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>You&apos;re offline</AlertTitle>
          <AlertDescription>
            Please check your internet connection to create a group.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {lastError !== null && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{lastError}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {createMutation.isSuccess && (
        <Alert className="border-accent-success/50 bg-accent-success/10">
          <CheckCircle className="h-4 w-4 text-accent-success" />
          <AlertTitle className="text-accent-success">Group Created</AlertTitle>
          <AlertDescription>Redirecting to edit page...</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Details Card */}
        <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pencil className="h-4 w-4 text-cyan-glow" />
              Basic Details
            </CardTitle>
            <CardDescription>Required information for the group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-accent-error">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Battlefield 6"
              />
              <p className="text-xs text-text-muted">
                The name displayed in the catalog
              </p>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                <span className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  URL Slug
                </span>
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="battlefield-6"
              />
              <p className="text-xs text-text-muted">
                Auto-generated from title. Customize if needed.
              </p>
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Textarea
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A short catchy description..."
                rows={2}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full description of the product group..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="border-border-subtle bg-bg-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-glow" />
              Settings
            </CardTitle>
            <CardDescription>Visibility and display options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {coverImageUrl !== '' && (
                <div className="mt-2 relative w-32 h-32 rounded-lg overflow-hidden border border-border-subtle">
                  <Image
                    src={coverImageUrl}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    onError={() => setCoverImageUrl('')}
                  />
                </div>
              )}
              <p className="text-xs text-text-muted">
                If not provided, will use the first product&apos;s image
              </p>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => { const val = parseInt(e.target.value, 10); setDisplayOrder(Number.isNaN(val) ? 0 : val); }}
                min={0}
              />
              <p className="text-xs text-text-muted">
                Lower numbers appear first in listings
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3 pt-4">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                {isActive ? (
                  <span className="flex items-center gap-2 text-accent-success">
                    <Eye className="h-4 w-4" />
                    Active (Visible in catalog immediately)
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-text-muted">
                    <EyeOff className="h-4 w-4" />
                    Inactive (Hidden until activated)
                  </span>
                )}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-cyan-glow/30 bg-cyan-glow/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-cyan-glow shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <p className="font-medium text-text-primary mb-1">What happens next?</p>
              <p>
                After creating the group, you&apos;ll be redirected to the edit page where you can
                add products. Products with different platforms, editions, or regions can be
                grouped together to show as a single card in the catalog.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
