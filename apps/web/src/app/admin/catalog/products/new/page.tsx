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
import type { CreateProductDto, CreateProductDtoSourceTypeEnum } from '@bitloot/sdk';
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
    sourceType: CreateProductDtoSourceTypeEnum;
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
    sourceType: 'custom',
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
            kinguinOfferId: formData.sourceType === 'kinguin' ? formData.kinguinOfferId : undefined,
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
            isPublished: formData.isPublished,
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
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/catalog/products">
                    <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Products
                    </Button>
                </Link>
            </div>

            <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary drop-shadow-[0_0_10px_rgba(0,217,255,0.1)]">
                    Create New Product
                </h1>
                <p className="text-text-secondary mt-2">
                    Add a new product to your catalog - choose between Custom or Kinguin fulfillment
                </p>
            </div>

            {/* Network Status Alert */}
            {!isOnline && (
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Internet Connection</AlertTitle>
                    <AlertDescription>
                        Please check your network connection and try again.
                    </AlertDescription>
                </Alert>
            )}

            {/* Error Alert */}
            {lastError != null && lastError.length > 0 && isOnline && (
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Creating Product</AlertTitle>
                    <AlertDescription>{lastError}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Source Type Card */}
                        <Card className="border-cyan-glow/20 bg-bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.05)]">
                            <CardHeader>
                                <CardTitle className="text-text-primary flex items-center gap-2">
                                    <Package className="h-5 w-5 text-cyan-glow" />
                                    Fulfillment Source
                                </CardTitle>
                                <CardDescription className="text-text-secondary">
                                    Choose how this product will be fulfilled
                                </CardDescription>
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
                                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${!isKinguin
                                                    ? 'border-cyan-glow bg-cyan-glow/10 shadow-[0_0_15px_rgba(0,217,255,0.2)]'
                                                    : 'border-cyan-glow/20 bg-bg-tertiary/50 hover:border-cyan-glow/40'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${!isKinguin ? 'bg-cyan-glow/20' : 'bg-bg-tertiary'}`}>
                                                    <Store className={`h-5 w-5 ${!isKinguin ? 'text-cyan-glow' : 'text-text-muted'}`} />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${!isKinguin ? 'text-cyan-glow' : 'text-text-primary'}`}>
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
                                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isKinguin
                                                    ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                                                    : 'border-cyan-glow/20 bg-bg-tertiary/50 hover:border-cyan-glow/40'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${isKinguin ? 'bg-orange-500/20' : 'bg-bg-tertiary'}`}>
                                                    <Crown className={`h-5 w-5 ${isKinguin ? 'text-orange-400' : 'text-text-muted'}`} />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${isKinguin ? 'text-orange-400' : 'text-text-primary'}`}>
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
                                        className="mt-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="kinguinOfferId" className="text-text-secondary">
                                                Kinguin Offer ID <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="kinguinOfferId"
                                                value={formData.kinguinOfferId}
                                                onChange={(e) => updateField('kinguinOfferId', e.target.value)}
                                                placeholder="e.g., 5c9b5b5a-e9f6-4e3b-8e5a-1b2c3d4e5f6g"
                                                className={`border-orange-500/30 bg-bg-tertiary/50 focus:border-orange-500/50 focus:ring-orange-500/20 ${validationErrors.kinguinOfferId !== undefined ? 'border-red-500' : ''
                                                    }`}
                                            />
                                            {validationErrors.kinguinOfferId !== undefined && (
                                                <p className="text-xs text-red-500">{validationErrors.kinguinOfferId}</p>
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
                        <Card className="border-cyan-glow/20 bg-bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.05)]">
                            <CardHeader>
                                <CardTitle className="text-text-primary flex items-center gap-2">
                                    <Tag className="h-5 w-5 text-cyan-glow" />
                                    Basic Information
                                </CardTitle>
                                <CardDescription className="text-text-secondary">
                                    Product title, description, and category
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-text-secondary">
                                        Title <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                        placeholder="e.g., Elden Ring - Steam Key"
                                        className={`border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 ${validationErrors.title !== undefined ? 'border-red-500' : ''
                                            }`}
                                    />
                                    {validationErrors.title !== undefined && (
                                        <p className="text-xs text-red-500">{validationErrors.title}</p>
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
                                        className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
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
                                        className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-text-secondary">
                                        Category
                                    </Label>
                                    <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                                        <SelectTrigger className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent className="border-cyan-glow/20 bg-bg-secondary/95 backdrop-blur-xl">
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
                        <Card className="border-cyan-glow/20 bg-bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.05)]">
                            <CardHeader>
                                <CardTitle className="text-text-primary flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-cyan-glow" />
                                    Platform & Region
                                </CardTitle>
                                <CardDescription className="text-text-secondary">
                                    Where and how the product can be activated
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="platform" className="text-text-secondary">
                                            Platform
                                        </Label>
                                        <Select value={formData.platform} onValueChange={(v) => updateField('platform', v)}>
                                            <SelectTrigger className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20">
                                                <SelectValue placeholder="Select platform" />
                                            </SelectTrigger>
                                            <SelectContent className="border-cyan-glow/20 bg-bg-secondary/95 backdrop-blur-xl">
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
                                            <SelectTrigger className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20">
                                                <SelectValue placeholder="Select region" />
                                            </SelectTrigger>
                                            <SelectContent className="border-cyan-glow/20 bg-bg-secondary/95 backdrop-blur-xl">
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
                                            className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
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
                                            className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Pricing Card */}
                        <Card className="border-cyan-glow/20 bg-bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.05)]">
                            <CardHeader>
                                <CardTitle className="text-text-primary flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-cyan-glow" />
                                    Pricing
                                </CardTitle>
                                <CardDescription className="text-text-secondary">
                                    Set cost and retail price
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency" className="text-text-secondary">
                                        Currency
                                    </Label>
                                    <Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}>
                                        <SelectTrigger className="border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20">
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent className="border-cyan-glow/20 bg-bg-secondary/95 backdrop-blur-xl">
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
                                        Cost <span className="text-red-500">*</span>
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
                                            className={`pl-7 border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 ${validationErrors.cost !== undefined ? 'border-red-500' : ''
                                                }`}
                                        />
                                    </div>
                                    {validationErrors.cost !== undefined && (
                                        <p className="text-xs text-red-500">{validationErrors.cost}</p>
                                    )}
                                    <p className="text-xs text-text-muted">Your wholesale cost</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-text-secondary">
                                        Retail Price <span className="text-red-500">*</span>
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
                                            className={`pl-7 border-cyan-glow/20 bg-bg-tertiary/50 focus:border-cyan-glow/50 focus:ring-cyan-glow/20 ${validationErrors.price !== undefined ? 'border-red-500' : ''
                                                }`}
                                        />
                                    </div>
                                    {validationErrors.price !== undefined && (
                                        <p className="text-xs text-red-500">{validationErrors.price}</p>
                                    )}
                                    <p className="text-xs text-text-muted">Customer-facing price</p>
                                </div>

                                {/* Profit Preview */}
                                {formData.cost.length > 0 && formData.price.length > 0 && (
                                    <div className="pt-4 border-t border-cyan-glow/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-text-secondary">Profit Margin</span>
                                            <span className={`font-mono font-semibold ${parseFloat(formData.price) - parseFloat(formData.cost) > 0
                                                    ? 'text-green-success'
                                                    : 'text-red-500'
                                                }`}>
                                                €{(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Publish Settings Card */}
                        <Card className="border-cyan-glow/20 bg-bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.05)]">
                            <CardHeader>
                                <CardTitle className="text-text-primary flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-cyan-glow" />
                                    Visibility
                                </CardTitle>
                                <CardDescription className="text-text-secondary">
                                    Control product visibility on storefront
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="isPublished" className="text-text-primary">
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
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <GlowButton
                                type="submit"
                                disabled={createMutation.isPending || !isOnline}
                                className="w-full"
                                glowColor="cyan"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                                className="w-full border-cyan-glow/30 text-text-secondary hover:text-text-primary"
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
