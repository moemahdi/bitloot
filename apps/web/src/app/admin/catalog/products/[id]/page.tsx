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

// Platform options - matching Kinguin API values
const PLATFORMS = [
    { value: 'Steam', label: 'Steam' },
    { value: 'PC Steam', label: 'PC Steam' },
    { value: 'PC Epic Games', label: 'Epic Games' },
    { value: 'PC Ubisoft Connect', label: 'Ubisoft Connect' },
    { value: 'EA App', label: 'EA App' },
    { value: 'PC GOG', label: 'GOG' },
    { value: 'PC Battle.net', label: 'Battle.net' },
    { value: 'PC Rockstar Games', label: 'Rockstar Games' },
    { value: 'Xbox One', label: 'Xbox One' },
    { value: 'Xbox Series X|S', label: 'Xbox Series X|S' },
    { value: 'Xbox Live', label: 'Xbox Live' },
    { value: 'PlayStation 4', label: 'PlayStation 4' },
    { value: 'PlayStation 5', label: 'PlayStation 5' },
    { value: 'PlayStation Network', label: 'PlayStation Network' },
    { value: 'Nintendo Switch', label: 'Nintendo Switch' },
    { value: 'Nintendo eShop', label: 'Nintendo eShop' },
    { value: 'PC Digital Download', label: 'PC Digital Download' },
    { value: 'PC', label: 'PC (Other)' },
    { value: 'Other', label: 'Other' },
] as const;

// Region options - matching Kinguin API values
const REGIONS = [
    { value: 'REGION FREE', label: 'Region Free (Global)' },
    { value: 'Region free', label: 'Region Free' },
    { value: 'Europe', label: 'Europe' },
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'North America', label: 'North America' },
    { value: 'Asia', label: 'Asia' },
    { value: 'Latin America', label: 'Latin America' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'Other', label: 'Other' },
] as const;

// Field character limits (matching backend DTO validation)
const FIELD_LIMITS = {
    title: 255,
    subtitle: 255,
    kinguinOfferId: 255,
    platform: 50,
    region: 100,
    drm: 100,
    ageRating: 50,
    category: 50,
    currency: 3,
} as const;

/**
 * Format a number string to proper decimal format (00.00)
 */
function formatPrice(value: string | number | undefined | null): string {
    if (value === undefined || value === null || value === '') {
        return '';
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
        return '';
    }
    return num.toFixed(2);
}

/**
 * Parse price input to ensure valid decimal format
 */
function parsePrice(value: string): string {
    // Remove non-numeric chars except . and -
    const cleaned = value.replace(/[^0-9.-]/g, '');
    
    // Limit to 2 decimal places
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] !== undefined && parts[1] !== '' && parts[1].length > 2) {
        return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
}

/**
 * Get character count display with color coding
 */
function CharacterCount({ current, max }: { current: number; max: number }): React.JSX.Element {
    const percentage = (current / max) * 100;
    let colorClass = 'text-text-muted';
    if (percentage >= 90) {
        colorClass = 'text-destructive';
    } else if (percentage >= 75) {
        colorClass = 'text-orange-warning';
    }
    
    return (
        <span className={`text-xs ${colorClass}`}>
            {current}/{max}
        </span>
    );
}

// Business category options (BitLoot store organization)
const CATEGORIES = [
    { value: 'games', label: 'Games' },
    { value: 'software', label: 'Software' },
    { value: 'subscriptions', label: 'Subscriptions' },
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
    businessCategory: 'games' | 'software' | 'subscriptions';
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
    platform: 'Steam',
    region: 'REGION FREE',
    drm: '',
    ageRating: '',
    category: '',
    businessCategory: 'games',
    cost: '',
    price: '',
    currency: 'EUR',
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
            platform: product.platform ?? 'Steam',
            region: product.region ?? product.regionalLimitations ?? 'REGION FREE',
            drm: product.drm ?? '',
            ageRating: product.ageRating ?? '',
            category: product.category ?? '',
            businessCategory: (product.businessCategory as 'games' | 'software' | 'subscriptions') ?? 'games',
            cost: formatPrice(product.cost),
            price: formatPrice(product.price),
            currency: product.currency ?? 'EUR',
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
            // Extract detailed error message if available
            let errorMessage = 'Failed to update product';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            // Try to parse API error response
            if (typeof error === 'object' && error !== null && 'body' in error) {
                const body = (error as { body?: { message?: string | string[] } }).body;
                if (body?.message !== undefined) {
                    errorMessage = Array.isArray(body.message) ? body.message.join(', ') : body.message;
                }
            }
            setLastError(errorMessage);
            handleError(error instanceof Error ? error : new Error(errorMessage), 'update-product');
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

        // Title validation
        if (formData.title.trim().length === 0) {
            errors.title = 'Title is required';
        } else if (formData.title.length < 3) {
            errors.title = 'Title must be at least 3 characters';
        } else if (formData.title.length > FIELD_LIMITS.title) {
            errors.title = `Title must be less than ${FIELD_LIMITS.title} characters`;
        }

        // Cost validation
        if (formData.cost.trim().length === 0) {
            errors.cost = 'Cost is required';
        } else {
            const costNum = parseFloat(formData.cost);
            if (isNaN(costNum)) {
                errors.cost = 'Cost must be a valid number (e.g., 45.99)';
            } else if (costNum < 0) {
                errors.cost = 'Cost cannot be negative';
            }
        }

        // Price validation
        if (formData.price.trim().length === 0) {
            errors.price = 'Price is required';
        } else {
            const priceNum = parseFloat(formData.price);
            if (isNaN(priceNum)) {
                errors.price = 'Price must be a valid number (e.g., 59.99)';
            } else if (priceNum < 0) {
                errors.price = 'Price cannot be negative';
            }
        }

        // Kinguin Offer ID is required for Kinguin products
        const product = productQuery.data;
        if (product?.sourceType === 'kinguin' && formData.kinguinOfferId.trim().length === 0) {
            errors.kinguinOfferId = 'Kinguin Offer ID is required for Kinguin products';
        }

        // Field length validations
        if (formData.drm.length > FIELD_LIMITS.drm) {
            errors.drm = `DRM must be less than ${FIELD_LIMITS.drm} characters`;
        }
        if (formData.ageRating.length > FIELD_LIMITS.ageRating) {
            errors.ageRating = `Age rating must be less than ${FIELD_LIMITS.ageRating} characters`;
        }
        if (formData.platform.length > FIELD_LIMITS.platform) {
            errors.platform = `Platform must be less than ${FIELD_LIMITS.platform} characters`;
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        setLastError(null);

        if (!validateForm()) {
            return;
        }

        // Format prices to ensure proper decimal format
        const formattedCost = formatPrice(formData.cost) !== '' ? formatPrice(formData.cost) : '0.00';
        const formattedPrice = formatPrice(formData.price) !== '' ? formatPrice(formData.price) : '0.00';

        const productData: UpdateProductDto = {
            kinguinOfferId: formData.kinguinOfferId.length > 0 ? formData.kinguinOfferId : undefined,
            title: formData.title.trim(),
            subtitle: formData.subtitle.trim().length > 0 ? formData.subtitle.trim() : undefined,
            description: formData.description.trim().length > 0 ? formData.description.trim() : undefined,
            platform: formData.platform.length > 0 ? formData.platform : undefined,
            region: formData.region.length > 0 ? formData.region : undefined,
            drm: formData.drm.trim().length > 0 ? formData.drm.trim() : undefined,
            ageRating: formData.ageRating.trim().length > 0 ? formData.ageRating.trim() : undefined,
            category: formData.category.length > 0 ? formData.category : undefined,
            businessCategory: formData.businessCategory,
            cost: formattedCost,
            price: formattedPrice,
            currency: formData.currency,
            // Note: isPublished is handled separately via publish/unpublish endpoints
        };

        updateMutation.mutate(productData);
    };

    // Handle price input with proper parsing
    const handlePriceChange = (field: 'cost' | 'price', value: string): void => {
        const parsed = parsePrice(value);
        updateField(field, parsed);
    };

    // Handle price blur to format to 2 decimal places
    const handlePriceBlur = (field: 'cost' | 'price'): void => {
        const formatted = formatPrice(formData[field]);
        if (formatted !== formData[field]) {
            setFormData((prev) => ({ ...prev, [field]: formatted }));
        }
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

    // Build dynamic platform options - include current value if not in list
    const platformOptions = [...PLATFORMS];
    if (formData.platform !== '' && !platformOptions.some(p => p.value === formData.platform)) {
        platformOptions.push({ value: formData.platform, label: formData.platform } as typeof PLATFORMS[number]);
    }

    // Build dynamic region options - include current value if not in list
    const regionOptions = [...REGIONS];
    if (formData.region !== '' && !regionOptions.some(r => r.value === formData.region)) {
        regionOptions.push({ value: formData.region, label: formData.region } as typeof REGIONS[number]);
    }

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
                                    <Label htmlFor="businessCategory" className="text-text-secondary">
                                        Business Category
                                    </Label>
                                    <Select value={formData.businessCategory} onValueChange={(v) => updateField('businessCategory', v as 'games' | 'software' | 'subscriptions')}>
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
                                                {platformOptions.map((p) => (
                                                    <SelectItem key={p.value} value={p.value}>
                                                        {p.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {validationErrors.platform !== undefined && (
                                            <p className="text-xs text-destructive">{validationErrors.platform}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="region" className="text-text-secondary">
                                            Region
                                        </Label>
                                        <Select value={formData.region} onValueChange={(v) => updateField('region', v)}>
                                            <SelectTrigger className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250">
                                                <SelectValue placeholder="Select region" />
                                            </SelectTrigger>
                                            <SelectContent className="border-border-subtle bg-bg-secondary/95 backdrop-blur-xl max-h-60">
                                                {regionOptions.map((r) => (
                                                    <SelectItem key={r.value} value={r.value}>
                                                        {r.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="drm" className="text-text-secondary">
                                                DRM
                                            </Label>
                                            <CharacterCount current={formData.drm.length} max={FIELD_LIMITS.drm} />
                                        </div>
                                        <Input
                                            id="drm"
                                            value={formData.drm}
                                            onChange={(e) => updateField('drm', e.target.value)}
                                            placeholder="e.g., Steam, DRM-Free, Ubisoft Connect"
                                            maxLength={FIELD_LIMITS.drm}
                                            className={`border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250 ${validationErrors.drm !== undefined ? 'border-destructive' : ''}`}
                                        />
                                        {validationErrors.drm !== undefined && (
                                            <p className="text-xs text-destructive">{validationErrors.drm}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="ageRating" className="text-text-secondary">
                                                Age Rating
                                            </Label>
                                            <CharacterCount current={formData.ageRating.length} max={FIELD_LIMITS.ageRating} />
                                        </div>
                                        <Input
                                            id="ageRating"
                                            value={formData.ageRating}
                                            onChange={(e) => updateField('ageRating', e.target.value)}
                                            placeholder="e.g., PEGI 18, ESRB M, USK 16"
                                            maxLength={FIELD_LIMITS.ageRating}
                                            className={`border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250 ${validationErrors.ageRating !== undefined ? 'border-destructive' : ''}`}
                                        />
                                        {validationErrors.ageRating !== undefined && (
                                            <p className="text-xs text-destructive">{validationErrors.ageRating}</p>
                                        )}
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
                                        Cost (EUR) <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono">
                                            €
                                        </span>
                                        <Input
                                            id="cost"
                                            type="text"
                                            inputMode="decimal"
                                            value={formData.cost}
                                            onChange={(e) => handlePriceChange('cost', e.target.value)}
                                            onBlur={() => handlePriceBlur('cost')}
                                            placeholder="0.00"
                                            className={`pl-7 font-mono border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250 ${validationErrors.cost !== undefined ? 'border-destructive' : ''
                                                }`}
                                        />
                                    </div>
                                    {validationErrors.cost !== undefined && (
                                        <p className="text-xs text-destructive">{validationErrors.cost}</p>
                                    )}
                                    <p className="text-xs text-text-muted">Your wholesale cost from Kinguin or supplier</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-text-secondary">
                                        Retail Price (EUR) <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono">
                                            €
                                        </span>
                                        <Input
                                            id="price"
                                            type="text"
                                            inputMode="decimal"
                                            value={formData.price}
                                            onChange={(e) => handlePriceChange('price', e.target.value)}
                                            onBlur={() => handlePriceBlur('price')}
                                            placeholder="0.00"
                                            className={`pl-7 font-mono border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250 ${validationErrors.price !== undefined ? 'border-destructive' : ''
                                                }`}
                                        />
                                    </div>
                                    {validationErrors.price !== undefined && (
                                        <p className="text-xs text-destructive">{validationErrors.price}</p>
                                    )}
                                    <p className="text-xs text-text-muted">Customer-facing price on storefront</p>
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
