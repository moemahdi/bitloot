'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, Loader2, Tag, X, AlertCircle } from 'lucide-react';
import { Input } from '@/design-system/primitives/input';
import { Button } from '@/design-system/primitives/button';
import { PromosApi } from '@bitloot/sdk';
import type { ValidatePromoResponseDto } from '@bitloot/sdk';
import { getApiConfig } from '@/lib/api-config';

interface PromoCodeInputProps {
    /** Order subtotal in EUR */
    orderTotal: string;
    /** Product IDs in the cart */
    productIds?: string[];
    /** Category slugs of products */
    categoryIds?: string[];
    /** User ID if authenticated */
    userId?: string;
    /** User email */
    email?: string;
    /** Already applied promo code IDs (for stacking check) */
    appliedPromoCodeIds?: string[];
    /** Callback when a valid promo is applied */
    onPromoApplied: (promo: {
        code: string;
        promoCodeId: string;
        discountAmount: string;
        discountType: 'percent' | 'fixed';
        discountValue: string;
        stackable: boolean;
    }) => void;
    /** Callback when promo is removed */
    onPromoRemoved: () => void;
    /** Whether the input is disabled */
    disabled?: boolean;
}

/**
 * Promo code input component for checkout
 * 
 * Features:
 * - Real-time validation against server via SDK
 * - Visual feedback for valid/invalid codes
 * - Shows discount amount when valid
 * - Remove button to clear applied promo
 * - Stacking support for multiple promos
 */
export function PromoCodeInput({
    orderTotal,
    productIds = [],
    categoryIds = [],
    userId,
    email,
    appliedPromoCodeIds = [],
    onPromoApplied,
    onPromoRemoved,
    disabled = false,
}: PromoCodeInputProps): React.ReactElement {
    const [code, setCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<{
        code: string;
        promoCodeId: string;
        discountAmount: string;
        discountType: 'percent' | 'fixed';
        discountValue: string;
        stackable: boolean;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const validateMutation = useMutation({
        mutationFn: async (promoCode: string): Promise<ValidatePromoResponseDto> => {
            const api = new PromosApi(getApiConfig());
            return api.promosControllerValidate({
                validatePromoDto: {
                    code: promoCode,
                    orderTotal,
                    productIds: productIds.length > 0 ? productIds : undefined,
                    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
                    userId,
                    email,
                    appliedPromoCodeIds: appliedPromoCodeIds.length > 0 ? appliedPromoCodeIds : undefined,
                },
            });
        },
        onSuccess: (data) => {
            if (data.valid && data.promoCodeId !== undefined && data.discountAmount !== undefined) {
                const promo = {
                    code: code.toUpperCase(),
                    promoCodeId: data.promoCodeId,
                    discountAmount: data.discountAmount,
                    discountType: data.discountType ?? 'percent',
                    discountValue: data.discountValue ?? '0',
                    stackable: data.stackable ?? false,
                };
                setAppliedPromo(promo);
                setError(null);
                onPromoApplied(promo);
            } else {
                setError(data.message);
                setAppliedPromo(null);
            }
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : 'Failed to validate code');
            setAppliedPromo(null);
        },
    });

    const handleApply = (): void => {
        const trimmed = code.trim();
        if (trimmed.length === 0) {
            setError('Please enter a promo code');
            return;
        }
        setError(null);
        validateMutation.mutate(trimmed);
    };

    const handleRemove = (): void => {
        setAppliedPromo(null);
        setCode('');
        setError(null);
        onPromoRemoved();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    };

    const isLoading = validateMutation.isPending;

    // If promo is applied, show success state
    if (appliedPromo !== null) {
        return (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-medium text-emerald-800 dark:text-emerald-200">
                                {appliedPromo.code}
                            </p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                {appliedPromo.discountType === 'percent'
                                    ? `${appliedPromo.discountValue}% off`
                                    : `€${parseFloat(appliedPromo.discountValue).toFixed(2)} off`}
                                {' - '}
                                <span className="font-semibold">
                                    -€{parseFloat(appliedPromo.discountAmount).toFixed(2)}
                                </span>
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemove}
                        disabled={disabled}
                        className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900"
                        aria-label="Remove promo code"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Enter promo code"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase());
                            setError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || isLoading}
                        className="pl-10 uppercase"
                        aria-label="Promo code"
                        aria-invalid={error !== null}
                        aria-describedby={error !== null ? 'promo-error' : undefined}
                    />
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleApply}
                    disabled={disabled || isLoading || code.trim().length === 0}
                    className="min-w-[80px]"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Apply'
                    )}
                </Button>
            </div>

            {error !== null && (
                <div className="flex items-center gap-2 text-sm text-destructive" id="promo-error">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
