'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { Textarea } from '@/design-system/primitives/textarea';
import { Switch } from '@/design-system/primitives/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/design-system/primitives/select';
import { apiConfig } from '@/lib/api-config';
import { AdminPromosApi } from '@bitloot/sdk';
import type { CreatePromoCodeDto, UpdatePromoCodeDto } from '@bitloot/sdk';

const adminPromosClient = new AdminPromosApi(apiConfig);

const promoCodeSchema = z.object({
    code: z.string().min(1, 'Code is required').max(50).regex(/^[A-Z0-9_-]+$/i, 'Only letters, numbers, - and _'),
    description: z.string().max(255).optional(),
    discountType: z.enum(['percent', 'fixed']),
    discountValue: z.string().min(1, 'Discount value is required'),
    minOrderValue: z.string().optional(),
    maxUsesTotal: z.coerce.number().min(1).optional().or(z.literal('')),
    maxUsesPerUser: z.coerce.number().min(1).optional().or(z.literal('')),
    scopeType: z.enum(['global', 'category', 'product']),
    scopeValue: z.string().max(500).optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    stackable: z.boolean(),
    isActive: z.boolean(),
});

type PromoCodeFormData = z.infer<typeof promoCodeSchema>;

interface PromoCodeFormProps {
    initialData?: {
        id: string;
        code: string;
        description?: string;
        discountType: 'percent' | 'fixed';
        discountValue: string;
        minOrderValue?: string;
        maxUsesTotal?: number;
        maxUsesPerUser?: number;
        scopeType: 'global' | 'category' | 'product';
        scopeValue?: string;
        startsAt?: string;
        expiresAt?: string;
        stackable: boolean;
        isActive: boolean;
    };
    onSuccess: () => void;
    onCancel: () => void;
}

export function PromoCodeForm({ initialData, onSuccess, onCancel }: PromoCodeFormProps): React.ReactElement {
    const queryClient = useQueryClient();
    const isEditing = initialData !== undefined;

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<PromoCodeFormData>({
        resolver: zodResolver(promoCodeSchema),
        defaultValues: {
            code: initialData?.code ?? '',
            description: initialData?.description ?? '',
            discountType: initialData?.discountType ?? 'percent',
            discountValue: initialData?.discountValue ?? '',
            minOrderValue: initialData?.minOrderValue ?? '',
            maxUsesTotal: initialData?.maxUsesTotal ?? '',
            maxUsesPerUser: initialData?.maxUsesPerUser ?? '',
            scopeType: initialData?.scopeType ?? 'global',
            scopeValue: initialData?.scopeValue ?? '',
            startsAt: initialData?.startsAt?.slice(0, 16) ?? '',
            expiresAt: initialData?.expiresAt?.slice(0, 16) ?? '',
            stackable: initialData?.stackable ?? false,
            isActive: initialData?.isActive ?? true,
        },
    });

    const discountType = watch('discountType');
    const scopeType = watch('scopeType');

    const mutation = useMutation({
        mutationFn: async (data: PromoCodeFormData) => {
            const dto: CreatePromoCodeDto = {
                code: data.code,
                description: data.description,
                discountType: data.discountType,
                discountValue: data.discountValue,
                minOrderValue: data.minOrderValue || undefined,
                maxUsesTotal: data.maxUsesTotal === '' ? undefined : Number(data.maxUsesTotal),
                maxUsesPerUser: data.maxUsesPerUser === '' ? undefined : Number(data.maxUsesPerUser),
                scopeType: data.scopeType,
                scopeValue: data.scopeValue || undefined,
                startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
                expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
                stackable: data.stackable,
                isActive: data.isActive,
            };

            if (isEditing && initialData) {
                return adminPromosClient.adminPromosControllerUpdate({
                    id: initialData.id,
                    updatePromoCodeDto: dto as UpdatePromoCodeDto,
                });
            } else {
                return adminPromosClient.adminPromosControllerCreate({
                    createPromoCodeDto: dto,
                });
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
            onSuccess();
        },
    });

    const onSubmit = (data: PromoCodeFormData): void => {
        mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                        id="code"
                        placeholder="SUMMER2024"
                        {...register('code')}
                        className="uppercase"
                        disabled={isEditing}
                    />
                    {errors.code !== undefined && (
                        <p className="text-sm text-destructive">{errors.code.message}</p>
                    )}
                </div>

                {/* Discount Type */}
                <div className="space-y-2">
                    <Label>Discount Type *</Label>
                    <Select
                        value={discountType}
                        onValueChange={(v) => setValue('discountType', v as 'percent' | 'fixed')}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percent">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount (€)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Discount Value */}
                <div className="space-y-2">
                    <Label htmlFor="discountValue">
                        Discount Value * {discountType === 'percent' ? '(%)' : '(€)'}
                    </Label>
                    <Input
                        id="discountValue"
                        type="number"
                        step={discountType === 'percent' ? '1' : '0.01'}
                        min="0"
                        max={discountType === 'percent' ? '100' : undefined}
                        placeholder={discountType === 'percent' ? '10' : '5.00'}
                        {...register('discountValue')}
                    />
                    {errors.discountValue !== undefined && (
                        <p className="text-sm text-destructive">{errors.discountValue.message}</p>
                    )}
                </div>

                {/* Min Order Value */}
                <div className="space-y-2">
                    <Label htmlFor="minOrderValue">Minimum Order (€)</Label>
                    <Input
                        id="minOrderValue"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="25.00"
                        {...register('minOrderValue')}
                    />
                </div>

                {/* Max Uses Total */}
                <div className="space-y-2">
                    <Label htmlFor="maxUsesTotal">Max Total Uses</Label>
                    <Input
                        id="maxUsesTotal"
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        {...register('maxUsesTotal')}
                    />
                </div>

                {/* Max Uses Per User */}
                <div className="space-y-2">
                    <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
                    <Input
                        id="maxUsesPerUser"
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        {...register('maxUsesPerUser')}
                    />
                </div>

                {/* Scope Type */}
                <div className="space-y-2">
                    <Label>Scope</Label>
                    <Select
                        value={scopeType}
                        onValueChange={(v) => setValue('scopeType', v as 'global' | 'category' | 'product')}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="global">Global (All Products)</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="product">Specific Products</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Scope Value */}
                {scopeType !== 'global' && (
                    <div className="space-y-2">
                        <Label htmlFor="scopeValue">
                            {scopeType === 'category' ? 'Category Slug' : 'Product IDs (comma-separated)'}
                        </Label>
                        <Input
                            id="scopeValue"
                            placeholder={scopeType === 'category' ? 'games' : 'id1, id2, id3'}
                            {...register('scopeValue')}
                        />
                    </div>
                )}

                {/* Starts At */}
                <div className="space-y-2">
                    <Label htmlFor="startsAt">Starts At</Label>
                    <Input
                        id="startsAt"
                        type="datetime-local"
                        {...register('startsAt')}
                    />
                </div>

                {/* Expires At */}
                <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expires At</Label>
                    <Input
                        id="expiresAt"
                        type="datetime-local"
                        {...register('expiresAt')}
                    />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description (Admin Only)</Label>
                <Textarea
                    id="description"
                    placeholder="Internal notes about this promo..."
                    {...register('description')}
                />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <Switch
                        id="stackable"
                        checked={watch('stackable')}
                        onCheckedChange={(v) => setValue('stackable', v)}
                    />
                    <Label htmlFor="stackable">Allow Stacking</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Switch
                        id="isActive"
                        checked={watch('isActive')}
                        onCheckedChange={(v) => setValue('isActive', v)}
                    />
                    <Label htmlFor="isActive">Active</Label>
                </div>
            </div>

            {/* Error */}
            {mutation.isError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    {mutation.error instanceof Error ? mutation.error.message : 'Failed to save'}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Update' : 'Create'} Promo Code
                </Button>
            </div>
        </form>
    );
}
