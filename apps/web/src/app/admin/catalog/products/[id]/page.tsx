'use client';

/**
 * Admin Edit Product Page
 * 
 * Features:
 * - Load existing product data
 * - Source type display (read-only after creation)
 * - Kinguin Offer ID field for Kinguin products
 * - Full product form with validation
 * - Real-time price preview
 * - Error handling and loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Label } from '@/design-system/primitives/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/design-system/primitives/select';
import { Switch } from '@/design-system/primitives/switch';
import { Badge } from '@/design-system/primitives/badge';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/design-system/primitives/alert';
import {
    ArrowLeft,
    AlertTriangle,
    Loader2,
    Save,
    Store,
    Crown,
    DollarSign,
    Tag,
    Globe,
    Shield,
    Package,
    RefreshCw,
} from 'lucide-react';
import type { UpdateProductDto, AdminProductResponseDto } from '@bitloot/sdk';
import { AdminCatalogProductsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion } from 'framer-motion';

// Platform options
const PLATFORMS = [
    { value: 'STEAM', label: 'Steam' },
    { value: 'EPIC', label: 'Epic Games' },
    { value: 'UPLAY', label: 'Ubisoft Connect' },
    { value: 'ORIGIN', label: 'EA Origin' },
    { value: 'GOG', label: 'GOG' },
    { value: 'XBOX', label: 'Xbox' },
    { value: 'PLAYSTATION', label: 'PlayStation' },
    { value: 'NINTENDO', label: 'Nintendo' },
    { value: 'BATTLENET', label: 'Battle.net' },
    { value: 'OTHER', label: 'Other' },
] as const;

// Region options
const REGIONS = [
    { value: 'GLOBAL', label: 'Global' },
    { value: 'NA', label: 'North America' },
    { value: 'EU', label: 'Europe' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'ASIA', label: 'Asia' },
    { value: 'LATAM', label: 'Latin America' },
    { value: 'OCEANIA', label: 'Oceania' },
    { value: 'OTHER', label: 'Other' },
] as const;

// Category options
const CATEGORIES = [
    { value: 'games', label: 'Games' },
    { value: 'software', label: 'Software' },
    { value: 'subscriptions', label: 'Subscriptions' },
    { value: 'dlc', label: 'DLC' },
    { value: 'gift-cards', label: 'Gift Cards' },
    { value: 'other', label: 'Other' },
] as const;

// Currency options
const CURRENCIES = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
] as const;

interface FormData {
    kinguinOfferId: string;
    title: string;
    subtitle: string;
    description: string;
    platform: string;
    region: string;
    drm: string;
    ageRating: string;
    category: string;
    cost: string;
    price: string;
    currency: string;
    isPublished: boolean;
}

const initialFormData: FormData = {
    kinguinOfferId: '',
    title: '',
    subtitle: '',
    description: '',
    platform: 'STEAM',
    region: 'GLOBAL',
    drm: '',
    ageRating: '',
    category: 'games',
    cost: '',
    price: '',
    currency: 'USD',
    isPublished: false,
};

export default function AdminEditProductPage(): React.JSX.Element {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const productId = params.id as string;

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [lastError, setLastError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // API Configuration - used in mutations via new instances
    const _productsApi = new AdminCatalogProductsApi(apiConfig);

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

    // Fetch product data
    const productQuery = useQuery({
        queryKey: ['admin-product', productId],
        queryFn: async (): Promise<AdminProductResponseDto> => {
            if (!isOnline) {
                throw new Error('No internet connection');
            }
            const api = new AdminCatalogProductsApi(apiConfig);
            return await api.adminProductsControllerGetById({ id: productId });
        },
        enabled: productId != null && productId.length > 0,
        staleTime: 60_000,
        retry: 3,
    });

    // Populate form data when product loads
    const populateFormData = useCallback((product: AdminProductResponseDto): void => {
        setFormData({
            kinguinOfferId: product.kinguinOfferId ?? '',
            title: product.title ?? '',
            subtitle: product.subtitle ?? '',
            description: product.description ?? '',
            platform: product.platform ?? 'STEAM',
            region: product.region ?? 'GLOBAL',
            drm: product.drm ?? '',
            ageRating: product.ageRating ?? '',
            category: product.category ?? 'games',
            cost: product.cost?.toString() ?? '',
            price: product.price?.toString() ?? '',
            currency: product.currency ?? 'USD',
            isPublished: product.isPublished ?? false,
        });
        setHasChanges(false);
    }, []);

    useEffect(() => {
        if (productQuery.data != null) {
            populateFormData(productQuery.data);
        }
    }, [productQuery.data, populateFormData]);

    // Update product mutation
    const updateMutation = useMutation({
        mutationFn: async (data: UpdateProductDto) => {
            if (!isOnline) {
                throw new Error('No internet connection');
            }
            const api = new AdminCatalogProductsApi(apiConfig);
            return await api.adminProductsControllerUpdate({
                id: productId,
                updateProductDto: data,
            });
        },
        onSuccess: (): void => {
            clearError();
            setHasChanges(false);
            void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            void queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
            router.push('/admin/catalog/products');
        },
        onError: (error: unknown): void => {
            handleError(error instanceof Error ? error : new Error(String(error)), 'update-product');
        },
    });

    // Publish mutation
    const publishMutation = useMutation({
        mutationFn: async () => {
            if (!isOnline) {
                throw new Error('No internet connection');
            }
            const api = new AdminCatalogProductsApi(apiConfig);
            return await api.adminProductsControllerPublish({ id: productId });
        },
        onSuccess: (): void => {
            clearError();
            void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            void queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
        },
        onError: (error: unknown): void => {
            handleError(error instanceof Error ? error : new Error(String(error)), 'publish-product');
        },
    });

    // Unpublish mutation
    const unpublishMutation = useMutation({
        mutationFn: async () => {
            if (!isOnline) {
                throw new Error('No internet connection');
            }
            const api = new AdminCatalogProductsApi(apiConfig);
            return await api.adminProductsControllerUnpublish({ id: productId });
        },
        onSuccess: (): void => {
            clearError();
            void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            void queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
        },
        onError: (error: unknown): void => {
            handleError(error instanceof Error ? error : new Error(String(error)), 'unpublish-product');
        },
    });

    // Handle publish toggle
    const handlePublishToggle = (checked: boolean): void => {
        if (checked) {
            publishMutation.mutate();
        } else {
            unpublishMutation.mutate();
        }
    };

    // Form validation
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (formData.title.trim().length === 0) {
            errors.title = 'Title is required';
        }

        if (formData.cost.trim().length === 0) {
            errors.cost = 'Cost is required';
        } else if (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0) {
            errors.cost = 'Cost must be a valid positive number';
        }

        if (formData.price.trim().length === 0) {
            errors.price = 'Price is required';
        } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
            errors.price = 'Price must be a valid positive number';
        }

        // Kinguin Offer ID is required for Kinguin products
        const product = productQuery.data;
        if (product?.sourceType === 'kinguin' && formData.kinguinOfferId.trim().length === 0) {
            errors.kinguinOfferId = 'Kinguin Offer ID is required for Kinguin products';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const productData: UpdateProductDto = {
            kinguinOfferId: formData.kinguinOfferId.length > 0 ? formData.kinguinOfferId : undefined,
            title: formData.title,
            subtitle: formData.subtitle.length > 0 ? formData.subtitle : undefined,
            description: formData.description.length > 0 ? formData.description : undefined,
            platform: formData.platform.length > 0 ? formData.platform : undefined,
            region: formData.region.length > 0 ? formData.region : undefined,
            drm: formData.drm.length > 0 ? formData.drm : undefined,
            ageRating: formData.ageRating.length > 0 ? formData.ageRating : undefined,
            category: formData.category.length > 0 ? formData.category : undefined,
            cost: formData.cost,
            price: formData.price,
            currency: formData.currency,
            // Note: isPublished is handled separately via publish/unpublish endpoints
        };

        updateMutation.mutate(productData);
    };

    // Update form field
    const updateField = <K extends keyof FormData>(field: K, value: FormData[K]): void => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
        // Clear validation error when user changes the field
        if (validationErrors[field] !== undefined) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const product = productQuery.data;
    const isKinguin = product?.sourceType === 'kinguin';

    // Loading state
    if (productQuery.isLoading) {
        return (
            <div className="space-y-6 p-6 animate-fade-in">
                {/* Header skeleton */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-32 animate-shimmer" />
                </div>
                <div className="relative">
                    <div className="absolute -inset-x-6 top-0 h-32 bg-gradient-to-r from-cyan-glow/5 via-purple-neon/5 to-transparent rounded-xl" />
                    <div className="relative space-y-2">
                        <Skeleton className="h-12 w-96 animate-shimmer" />
                        <Skeleton className="h-6 w-64 animate-shimmer" />
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-64 w-full rounded-lg border border-border-subtle animate-shimmer" />
                        <Skeleton className="h-80 w-full rounded-lg border border-border-subtle animate-shimmer" />
                        <Skeleton className="h-64 w-full rounded-lg border border-border-subtle animate-shimmer" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full rounded-lg border border-border-subtle animate-shimmer" />
                        <Skeleton className="h-32 w-full rounded-lg border border-border-subtle animate-shimmer" />
                        <Skeleton className="h-24 w-full rounded-lg border border-border-subtle animate-shimmer" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (productQuery.isError) {
        return (
            <div className="space-y-6 p-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <Link href="/admin/catalog/products">
                        <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 transition-all duration-250">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </Link>
                </div>
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-destructive/10">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                            <AlertTitle className="text-destructive">Error Loading Product</AlertTitle>
                            <AlertDescription className="text-destructive/80">
                                {productQuery.error instanceof Error ? productQuery.error.message : 'Failed to load product'}
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
                <Button
                    variant="outline"
                    onClick={() => productQuery.refetch()}
                    className="border-cyan-glow/30 hover:border-cyan-glow/50 hover:bg-cyan-glow/5 hover:shadow-glow-cyan-sm transition-all duration-250"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            </div>
        );
    }

    // Product not found
    if (product == null) {
        return (
            <div className="space-y-6 p-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <Link href="/admin/catalog/products">
                        <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 transition-all duration-250">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </Link>
                </div>
                <Alert variant="destructive" className="border-orange-warning/50 bg-orange-warning/5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-orange-warning/10">
                            <Package className="h-4 w-4 text-orange-warning" />
                        </div>
                        <div>
                            <AlertTitle className="text-orange-warning">Product Not Found</AlertTitle>
                            <AlertDescription className="text-orange-warning/80">
                                The product with ID &quot;{productId}&quot; could not be found.
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
                <Link href="/admin/catalog/products">
                    <Button
                        variant="outline"
                        className="border-cyan-glow/30 hover:border-cyan-glow/50 hover:bg-cyan-glow/5 hover:shadow-glow-cyan-sm transition-all duration-250"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Products
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header with gradient accent */}
            <div className="relative">
                <div className="absolute -inset-x-6 top-0 h-32 bg-gradient-to-r from-cyan-glow/5 via-purple-neon/5 to-transparent rounded-xl" />
                <div className="relative">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/catalog/products">
                            <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 transition-all duration-250">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Products
                            </Button>
                        </Link>
                        {hasChanges && (
                            <Badge variant="outline" className="border-orange-warning/50 bg-orange-warning/10 text-orange-warning animate-pulse">
                                Unsaved Changes
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-start justify-between mt-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-cyan-glow/10 border border-cyan-glow/20 shadow-glow-cyan-sm">
                                <Package className="h-6 w-6 text-cyan-glow" />
                            </div>
                            <div>
                                <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary drop-shadow-[0_0_10px_rgba(0,217,255,0.15)]">
                                    Edit Product
                                </h1>
                                <p className="text-text-secondary mt-1 line-clamp-1">
                                    Update details for &quot;{product.title}&quot;
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={isKinguin
                                ? 'border-orange-warning/50 bg-orange-warning/10 text-orange-warning shadow-glow-error'
                                : 'border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow shadow-glow-cyan-sm'
                            }
                        >
                            {isKinguin ? (
                                <>
                                    <Crown className="mr-1.5 h-3.5 w-3.5" />
                                    Kinguin
                                </>
                            ) : (
                                <>
                                    <Store className="mr-1.5 h-3.5 w-3.5" />
                                    Custom
                                </>
                            )}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Network Status Alert */}
            {!isOnline && (
                <Alert variant="destructive" className="border-orange-warning/50 bg-orange-warning/5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-orange-warning/10 animate-pulse">
                            <AlertTriangle className="h-4 w-4 text-orange-warning" />
                        </div>
                        <div>
                            <AlertTitle className="text-orange-warning">No Internet Connection</AlertTitle>
                            <AlertDescription className="text-orange-warning/80">
                                Please check your network connection and try again.
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}

            {/* Error Alert */}
            {lastError != null && lastError.length > 0 && isOnline && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-destructive/10">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                            <AlertTitle className="text-destructive">Error Updating Product</AlertTitle>
                            <AlertDescription className="text-destructive/80">{lastError}</AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Fulfillment Source Card (Read-Only) */}
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-all duration-250">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-neon/10 border border-purple-neon/20">
                                        <Package className="h-5 w-5 text-purple-neon" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary">Fulfillment Source</CardTitle>
                                        <CardDescription className="text-text-secondary">
                                            Source type cannot be changed after creation
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={`p-4 rounded-lg border-2 transition-all duration-250 ${isKinguin
                                        ? 'border-orange-warning/50 bg-orange-warning/5 shadow-glow-error'
                                        : 'border-cyan-glow/50 bg-cyan-glow/5 shadow-glow-cyan-sm'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-full ${isKinguin ? 'bg-orange-warning/20' : 'bg-cyan-glow/20'}`}>
                                            {isKinguin ? (
                                                <Crown className="h-5 w-5 text-orange-warning" />
                                            ) : (
                                                <Store className="h-5 w-5 text-cyan-glow" />
                                            )}
                                        </div>
                                        <div>
                                            <p className={`font-semibold ${isKinguin ? 'text-orange-warning' : 'text-cyan-glow'}`}>
                                                {isKinguin ? 'Kinguin' : 'Custom'}
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                {isKinguin ? 'Fulfilled via Kinguin API' : 'Fulfilled from your own inventory'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Kinguin Offer ID (for Kinguin products) */}
                                {isKinguin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4"
                                    >
                                        <div className="p-4 rounded-lg bg-orange-warning/5 border border-orange-warning/20 space-y-2">
                                            <Label htmlFor="kinguinOfferId" className="text-text-secondary">
                                                Kinguin Offer ID <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="kinguinOfferId"
                                                value={formData.kinguinOfferId}
                                                onChange={(e) => updateField('kinguinOfferId', e.target.value)}
                                                placeholder="e.g., 5c9b5b5a-e9f6-4e3b-8e5a-1b2c3d4e5f6g"
                                                className={`border-orange-warning/30 bg-bg-tertiary/50 focus:border-orange-warning/50 focus:ring-orange-warning/20 transition-all duration-250 ${validationErrors.kinguinOfferId !== undefined ? 'border-destructive' : ''
                                                    }`}
                                            />
                                            {validationErrors.kinguinOfferId !== undefined && (
                                                <p className="text-xs text-destructive">{validationErrors.kinguinOfferId}</p>
                                            )}
                                            <p className="text-xs text-text-muted">
                                                The unique offer ID from Kinguin that will be used for fulfillment
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Basic Info Card */}
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-all duration-250">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                                        <Tag className="h-5 w-5 text-cyan-glow" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary">Basic Information</CardTitle>
                                        <CardDescription className="text-text-secondary">
                                            Product title, description, and category
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-text-secondary">
                                        Title <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                        placeholder="e.g., Elden Ring - Steam Key"
                                        className={`border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250 ${validationErrors.title !== undefined ? 'border-destructive' : ''
                                            }`}
                                    />
                                    {validationErrors.title !== undefined && (
                                        <p className="text-xs text-destructive">{validationErrors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subtitle" className="text-text-secondary">
                                        Subtitle
                                    </Label>
                                    <Input
                                        id="subtitle"
                                        value={formData.subtitle}
                                        onChange={(e) => updateField('subtitle', e.target.value)}
                                        placeholder="e.g., Digital Deluxe Edition"
                                        className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-text-secondary">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => updateField('description', e.target.value)}
                                        placeholder="Product description..."
                                        rows={4}
                                        className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-text-secondary">
                                        Category
                                    </Label>
                                    <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                                        <SelectTrigger className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent className="border-border-subtle bg-bg-secondary/95 backdrop-blur-xl">
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Platform & Region Card */}
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-all duration-250">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-success/10 border border-green-success/20">
                                        <Globe className="h-5 w-5 text-green-success" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary">Platform & Region</CardTitle>
                                        <CardDescription className="text-text-secondary">
                                            Where and how the product can be activated
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="platform" className="text-text-secondary">
                                            Platform
                                        </Label>
                                        <Select value={formData.platform} onValueChange={(v) => updateField('platform', v)}>
                                            <SelectTrigger className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250">
                                                <SelectValue placeholder="Select platform" />
                                            </SelectTrigger>
                                            <SelectContent className="border-border-subtle bg-bg-secondary/95 backdrop-blur-xl max-h-60">
                                                {PLATFORMS.map((p) => (
                                                    <SelectItem key={p.value} value={p.value}>
                                                        {p.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="region" className="text-text-secondary">
                                            Region
                                        </Label>
                                        <Select value={formData.region} onValueChange={(v) => updateField('region', v)}>
                                            <SelectTrigger className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250">
                                                <SelectValue placeholder="Select region" />
                                            </SelectTrigger>
                                            <SelectContent className="border-border-subtle bg-bg-secondary/95 backdrop-blur-xl">
                                                {REGIONS.map((r) => (
                                                    <SelectItem key={r.value} value={r.value}>
                                                        {r.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="drm" className="text-text-secondary">
                                            DRM
                                        </Label>
                                        <Input
                                            id="drm"
                                            value={formData.drm}
                                            onChange={(e) => updateField('drm', e.target.value)}
                                            placeholder="e.g., Steam, DRM-Free"
                                            className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ageRating" className="text-text-secondary">
                                            Age Rating
                                        </Label>
                                        <Input
                                            id="ageRating"
                                            value={formData.ageRating}
                                            onChange={(e) => updateField('ageRating', e.target.value)}
                                            placeholder="e.g., PEGI-18, ESRB-M"
                                            className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Pricing Card */}
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-all duration-250">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-pink-featured/10 border border-pink-featured/20">
                                        <DollarSign className="h-5 w-5 text-pink-featured" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary">Pricing</CardTitle>
                                        <CardDescription className="text-text-secondary">
                                            Set cost and retail price
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency" className="text-text-secondary">
                                        Currency
                                    </Label>
                                    <Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}>
                                        <SelectTrigger className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250">
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent className="border-border-subtle bg-bg-secondary/95 backdrop-blur-xl">
                                            {CURRENCIES.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cost" className="text-text-secondary">
                                        Cost <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono">
                                            €
                                        </span>
                                        <Input
                                            id="cost"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.cost}
                                            onChange={(e) => updateField('cost', e.target.value)}
                                            placeholder="0.00"
                                            className={`pl-7 font-mono border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250 ${validationErrors.cost !== undefined ? 'border-destructive' : ''
                                                }`}
                                        />
                                    </div>
                                    {validationErrors.cost !== undefined && (
                                        <p className="text-xs text-destructive">{validationErrors.cost}</p>
                                    )}
                                    <p className="text-xs text-text-muted">Your wholesale cost</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-text-secondary">
                                        Retail Price <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono">
                                            €
                                        </span>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => updateField('price', e.target.value)}
                                            placeholder="0.00"
                                            className={`pl-7 font-mono border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250 ${validationErrors.price !== undefined ? 'border-destructive' : ''
                                                }`}
                                        />
                                    </div>
                                    {validationErrors.price !== undefined && (
                                        <p className="text-xs text-destructive">{validationErrors.price}</p>
                                    )}
                                    <p className="text-xs text-text-muted">Customer-facing price</p>
                                </div>

                                {/* Profit Preview */}
                                {formData.cost.length > 0 && formData.price.length > 0 && (
                                    <div className="p-3 rounded-lg bg-bg-tertiary/30 border border-border-subtle">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-text-secondary">Profit Margin</span>
                                            <span className={`font-mono font-semibold ${parseFloat(formData.price) - parseFloat(formData.cost) > 0
                                                    ? 'text-green-success'
                                                    : 'text-destructive'
                                                }`}>
                                                €{(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Publish Settings Card */}
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-all duration-250">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-warning/10 border border-orange-warning/20">
                                        <Shield className="h-5 w-5 text-orange-warning" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary">Visibility</CardTitle>
                                        <CardDescription className="text-text-secondary">
                                            Control product visibility on storefront
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="p-3 rounded-lg bg-bg-tertiary/30 border border-border-subtle hover:border-cyan-glow/30 transition-all duration-250">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="isPublished" className="text-text-primary">
                                                Published
                                            </Label>
                                            <p className="text-xs text-text-muted">
                                                {publishMutation.isPending || unpublishMutation.isPending
                                                    ? 'Updating visibility...'
                                                    : 'Show this product on the storefront'}
                                            </p>
                                        </div>
                                        <Switch
                                            id="isPublished"
                                            checked={product?.isPublished ?? false}
                                            onCheckedChange={handlePublishToggle}
                                            disabled={publishMutation.isPending || unpublishMutation.isPending || !isOnline}
                                            className="data-[state=checked]:bg-cyan-glow"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4 border-t border-border-subtle">
                            <GlowButton
                                type="submit"
                                disabled={updateMutation.isPending || !isOnline || !hasChanges}
                                className="w-full"
                                glowColor="cyan"
                            >
                                {updateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin-glow" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </GlowButton>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-border-subtle text-text-secondary hover:text-text-primary hover:border-cyan-glow/50 hover:bg-cyan-glow/5 transition-all duration-250"
                                onClick={() => router.push('/admin/catalog/products')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
