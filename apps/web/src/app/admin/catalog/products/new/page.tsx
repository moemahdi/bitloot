'use client';

/**
 * Admin Create New Product Page
 * 
 * Features:
 * - Source type selector (Custom/Kinguin)
 * - Conditional Kinguin Offer ID field
 * - Full product form with validation
 * - Real-time price preview
 * - Error handling and loading states
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
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
} from 'lucide-react';
import type { CreateProductDto, CreateProductDtoSourceTypeEnum, CreateProductDtoDeliveryTypeEnum } from '@bitloot/sdk';
import { AdminCatalogProductsApi, CreateProductDtoDeliveryTypeEnum as DeliveryTypeEnum } from '@bitloot/sdk';
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
    { value: 'other', label: 'Other' },
] as const;

// Currency options
const CURRENCIES = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
] as const;

// Delivery type options
const DELIVERY_TYPES = [
    { value: DeliveryTypeEnum.Key, label: 'Product Key', description: 'Simple activation key' },
    { value: DeliveryTypeEnum.Account, label: 'Account', description: 'Username/password credentials' },
    { value: DeliveryTypeEnum.Code, label: 'Code', description: 'Redemption code with optional PIN' },
    { value: DeliveryTypeEnum.License, label: 'License', description: 'License key with instructions' },
    { value: DeliveryTypeEnum.Bundle, label: 'Bundle', description: 'Multiple keys/items' },
    { value: DeliveryTypeEnum.Custom, label: 'Custom', description: 'Custom format' },
] as const;

interface FormData {
    sourceType: CreateProductDtoSourceTypeEnum;
    deliveryType: CreateProductDtoDeliveryTypeEnum;
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
    isFeatured: boolean;
}

const initialFormData: FormData = {
    sourceType: 'custom',
    deliveryType: DeliveryTypeEnum.Key,
    kinguinOfferId: '',
    title: '',
    subtitle: '',
    description: '',
    platform: 'STEAM',
    region: 'GLOBAL',
    drm: '',
    ageRating: '',
    category: 'games',
    businessCategory: 'games',
    cost: '',
    price: '',
    currency: 'USD',
    isPublished: false,
    isFeatured: false,
};

export default function AdminCreateProductPage(): React.JSX.Element {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [lastError, setLastError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    // Create product mutation
    const createMutation = useMutation({
        mutationFn: async (data: CreateProductDto) => {
            if (!isOnline) {
                throw new Error('No internet connection');
            }
            const api = new AdminCatalogProductsApi(apiConfig);
            return await api.adminProductsControllerCreate({
                createProductDto: data,
            });
        },
        onSuccess: (): void => {
            clearError();
            router.push('/admin/catalog/products');
        },
        onError: (error: unknown): void => {
            handleError(error instanceof Error ? error : new Error(String(error)), 'create-product');
        },
    });

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

        if (formData.sourceType === 'kinguin' && formData.kinguinOfferId.trim().length === 0) {
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

        const productData: CreateProductDto = {
            sourceType: formData.sourceType,
            deliveryType: formData.deliveryType,
            kinguinOfferId: formData.sourceType === 'kinguin' ? formData.kinguinOfferId : undefined,
            title: formData.title,
            subtitle: formData.subtitle.length > 0 ? formData.subtitle : undefined,
            description: formData.description.length > 0 ? formData.description : undefined,
            platform: formData.platform.length > 0 ? formData.platform : undefined,
            region: formData.region.length > 0 ? formData.region : undefined,
            drm: formData.drm.length > 0 ? formData.drm : undefined,
            ageRating: formData.ageRating.length > 0 ? formData.ageRating : undefined,
            category: formData.category.length > 0 ? formData.category : undefined,
            businessCategory: formData.businessCategory,
            cost: formData.cost,
            price: formData.price,
            currency: formData.currency,
            isPublished: formData.isPublished,
            isFeatured: formData.isFeatured,
        };

        createMutation.mutate(productData);
    };

    // Update form field
    const updateField = <K extends keyof FormData>(field: K, value: FormData[K]): void => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear validation error when user changes the field
        if (validationErrors[field] !== undefined) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const isKinguin = formData.sourceType === 'kinguin';

    return (
        <div className="space-y-6 p-6">
            {/* Header with gradient accent */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-glow/5 via-purple-neon/5 to-transparent rounded-2xl blur-xl" />
                <div className="relative space-y-4">
                    <Link href="/admin/catalog/products">
                        <Button variant="ghost" size="sm" className="text-text-secondary hover:text-cyan-glow hover:bg-cyan-glow/5 transition-all duration-250">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </Link>

                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-cyan-glow/10 border border-cyan-glow/20 shadow-glow-cyan-sm">
                            <Package className="h-7 w-7 text-cyan-glow" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                                Create New Product
                            </h1>
                            <p className="text-text-secondary mt-1">
                                Add a new product to your catalog - choose between Custom or Kinguin fulfillment
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Network Status Alert */}
            {!isOnline && (
                <Alert variant="destructive" className="border-orange-warning/50 bg-orange-warning/5 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-orange-warning/10">
                            <AlertTriangle className="h-5 w-5 text-orange-warning" />
                        </div>
                        <div>
                            <AlertTitle className="text-orange-warning font-semibold">No Internet Connection</AlertTitle>
                            <AlertDescription className="text-text-secondary mt-1">
                                Please check your network connection and try again.
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}

            {/* Error Alert */}
            {lastError != null && lastError.length > 0 && isOnline && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <AlertTitle className="text-destructive font-semibold">Error Creating Product</AlertTitle>
                            <AlertDescription className="text-text-secondary mt-1">{lastError}</AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Source Type Card */}
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-colors duration-250">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-neon/10">
                                        <Package className="h-4 w-4 text-purple-neon" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary text-lg">Fulfillment Source</CardTitle>
                                        <CardDescription className="text-text-muted text-sm">
                                            Choose how this product will be fulfilled
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => updateField('sourceType', 'custom')}
                                            className={`w-full p-4 rounded-lg border-2 transition-all duration-250 text-left ${!isKinguin
                                                    ? 'border-cyan-glow bg-cyan-glow/10 shadow-glow-cyan-sm'
                                                    : 'border-border-subtle bg-bg-tertiary/50 hover:border-cyan-glow/40 hover:bg-bg-tertiary'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-lg transition-colors duration-250 ${!isKinguin ? 'bg-cyan-glow/20' : 'bg-bg-primary'}`}>
                                                    <Store className={`h-5 w-5 transition-colors duration-250 ${!isKinguin ? 'text-cyan-glow' : 'text-text-muted'}`} />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold transition-colors duration-250 ${!isKinguin ? 'text-cyan-glow' : 'text-text-primary'}`}>
                                                        Custom
                                                    </p>
                                                    <p className="text-xs text-text-secondary">
                                                        Fulfill from your own inventory
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => updateField('sourceType', 'kinguin')}
                                            className={`w-full p-4 rounded-lg border-2 transition-all duration-250 text-left ${isKinguin
                                                    ? 'border-orange-warning bg-orange-warning/10 shadow-[0_0_15px_rgba(255,107,0,0.2)]'
                                                    : 'border-border-subtle bg-bg-tertiary/50 hover:border-orange-warning/40 hover:bg-bg-tertiary'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-lg transition-colors duration-250 ${isKinguin ? 'bg-orange-warning/20' : 'bg-bg-primary'}`}>
                                                    <Crown className={`h-5 w-5 transition-colors duration-250 ${isKinguin ? 'text-orange-warning' : 'text-text-muted'}`} />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold transition-colors duration-250 ${isKinguin ? 'text-orange-warning' : 'text-text-primary'}`}>
                                                        Kinguin
                                                    </p>
                                                    <p className="text-xs text-text-secondary">
                                                        Fulfill via Kinguin API
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </motion.div>
                                </div>

                                {/* Kinguin Offer ID (conditional) */}
                                {isKinguin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 p-4 rounded-lg bg-orange-warning/5 border border-orange-warning/20"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="kinguinOfferId" className="text-text-primary flex items-center gap-2">
                                                <Crown className="h-4 w-4 text-orange-warning" />
                                                Kinguin Offer ID <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="kinguinOfferId"
                                                value={formData.kinguinOfferId}
                                                onChange={(e) => updateField('kinguinOfferId', e.target.value)}
                                                placeholder="e.g., 5c9b5b5a-e9f6-4e3b-8e5a-1b2c3d4e5f6g"
                                                className={`border-orange-warning/30 bg-bg-tertiary/50 focus:border-orange-warning/50 focus:ring-orange-warning/20 ${validationErrors.kinguinOfferId !== undefined ? 'border-destructive' : ''
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

                        {/* Delivery Type Card - Only show for custom products */}
                        {!isKinguin && (
                            <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-colors duration-250">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-green-success/10">
                                            <Package className="h-4 w-4 text-green-success" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-text-primary text-lg">Delivery Type</CardTitle>
                                            <CardDescription className="text-text-muted text-sm">
                                                How will the product content be delivered to customers
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {DELIVERY_TYPES.map((type) => (
                                            <motion.div
                                                key={type.value}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => updateField('deliveryType', type.value)}
                                                    className={`w-full p-3 rounded-lg border-2 transition-all duration-250 text-left ${formData.deliveryType === type.value
                                                            ? 'border-green-success bg-green-success/10 shadow-[0_0_10px_rgba(57,255,20,0.15)]'
                                                            : 'border-border-subtle bg-bg-tertiary/50 hover:border-green-success/40 hover:bg-bg-tertiary'
                                                        }`}
                                                >
                                                    <p className={`font-medium text-sm transition-colors duration-250 ${formData.deliveryType === type.value ? 'text-green-success' : 'text-text-primary'
                                                        }`}>
                                                        {type.label}
                                                    </p>
                                                    <p className="text-xs text-text-muted mt-0.5">
                                                        {type.description}
                                                    </p>
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Basic Info Card */}
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-colors duration-250">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-glow/10">
                                        <Tag className="h-4 w-4 text-cyan-glow" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary text-lg">Basic Information</CardTitle>
                                        <CardDescription className="text-text-muted text-sm">
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
                                        className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250 resize-none"
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

                                <div className="space-y-2">
                                    <Label htmlFor="businessCategory" className="text-text-secondary">
                                        Business Category <span className="text-destructive">*</span>
                                    </Label>
                                    <Select 
                                        value={formData.businessCategory} 
                                        onValueChange={(v) => updateField('businessCategory', v as FormData['businessCategory'])}
                                    >
                                        <SelectTrigger className="border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 transition-all duration-250">
                                            <SelectValue placeholder="Select business category" />
                                        </SelectTrigger>
                                        <SelectContent className="border-border-subtle bg-bg-secondary/95 backdrop-blur-xl">
                                            <SelectItem value="games">Games</SelectItem>
                                            <SelectItem value="software">Software</SelectItem>
                                            <SelectItem value="subscriptions">Subscriptions</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-text-muted">
                                        Used for catalog organization and customer-facing filters
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Platform & Region Card */}
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-colors duration-250">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-success/10">
                                        <Globe className="h-4 w-4 text-green-success" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary text-lg">Platform & Region</CardTitle>
                                        <CardDescription className="text-text-muted text-sm">
                                            Platform, region, and DRM settings
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
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-colors duration-250">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-pink-featured/10">
                                        <DollarSign className="h-4 w-4 text-pink-featured" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary text-lg">Pricing</CardTitle>
                                        <CardDescription className="text-text-muted text-sm">
                                            Cost and retail price settings
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
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
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
                                            className={`pl-7 border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 font-mono transition-all duration-250 ${validationErrors.cost !== undefined ? 'border-destructive' : ''}`}
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
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
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
                                            className={`pl-7 border-border-subtle bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 font-mono transition-all duration-250 ${validationErrors.price !== undefined ? 'border-destructive' : ''}`}
                                        />
                                    </div>
                                    {validationErrors.price !== undefined && (
                                        <p className="text-xs text-destructive">{validationErrors.price}</p>
                                    )}
                                    <p className="text-xs text-text-muted">Customer-facing price</p>
                                </div>

                                {/* Profit Preview */}
                                {formData.cost.length > 0 && formData.price.length > 0 && (
                                    <div className="pt-4 border-t border-border-subtle">
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-bg-tertiary/30">
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
                        <Card className="border-border-subtle bg-bg-secondary/80 backdrop-blur-sm hover:border-border-accent transition-colors duration-250">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-warning/10">
                                        <Shield className="h-4 w-4 text-orange-warning" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-text-primary text-lg">Visibility</CardTitle>
                                        <CardDescription className="text-text-muted text-sm">
                                            Control product visibility on storefront
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/30 border border-border-subtle hover:border-cyan-glow/30 transition-colors duration-250">
                                    <div className="space-y-1">
                                        <Label htmlFor="isPublished" className="text-text-primary font-medium">
                                            Published
                                        </Label>
                                        <p className="text-xs text-text-muted">
                                            Show this product on the storefront
                                        </p>
                                    </div>
                                    <Switch
                                        id="isPublished"
                                        checked={formData.isPublished}
                                        onCheckedChange={(checked) => updateField('isPublished', checked)}
                                        className="data-[state=checked]:bg-cyan-glow"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/30 border border-border-subtle hover:border-pink-featured/30 transition-colors duration-250">
                                    <div className="space-y-1">
                                        <Label htmlFor="isFeatured" className="text-text-primary font-medium">
                                            Featured
                                        </Label>
                                        <p className="text-xs text-text-muted">
                                            Highlight this product on homepage
                                        </p>
                                    </div>
                                    <Switch
                                        id="isFeatured"
                                        checked={formData.isFeatured}
                                        onCheckedChange={(checked) => updateField('isFeatured', checked)}
                                        className="data-[state=checked]:bg-pink-featured"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4 border-t border-border-subtle">
                            <GlowButton
                                type="submit"
                                disabled={createMutation.isPending || !isOnline}
                                className="w-full"
                                glowColor="cyan"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin-glow" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Product
                                    </>
                                )}
                            </GlowButton>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-border-subtle hover:border-cyan-glow/50 hover:bg-cyan-glow/5 text-text-secondary hover:text-text-primary transition-all duration-250"
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
