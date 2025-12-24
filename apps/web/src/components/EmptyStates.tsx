'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, PackageOpen, Search, ShoppingCart, FileQuestion } from 'lucide-react';
import { GlowButton } from '@/design-system/primitives/glow-button';
import { cn } from '@/design-system/utils/utils';

export interface EmptyStateProps {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps): React.ReactElement {
    const DefaultIcon = Icon ?? PackageOpen;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center mb-6"
            >
                <DefaultIcon className="w-10 h-10 text-text-muted" />
            </motion.div>

            <h3 className="text-xl font-display font-semibold text-text-primary mb-2">{title}</h3>
            <p className="text-text-secondary mb-6 max-w-sm">{description}</p>

            {action !== undefined && action !== null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <GlowButton onClick={action.onClick} size="lg">
                        {action.label}
                    </GlowButton>
                </motion.div>
            )}
        </motion.div>
    );
}

// Pre-configured empty states for common scenarios
export function EmptyOrders({ onBrowse }: { onBrowse: () => void }): React.ReactElement {
    return (
        <EmptyState
            icon={PackageOpen}
            title="No orders yet"
            description="Start shopping to see your orders here"
            action={{
                label: 'Browse Catalog',
                onClick: onBrowse,
            }}
        />
    );
}

export function EmptyCart({ onContinue }: { onContinue: () => void }): React.ReactElement {
    return (
        <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Add items to get started with your purchase"
            action={{
                label: 'Continue Shopping',
                onClick: onContinue,
            }}
        />
    );
}

export function NoSearchResults({ query, onClear }: { query: string; onClear: () => void }): React.ReactElement {
    return (
        <EmptyState
            icon={Search}
            title="No results found"
            description={`No products match "${query}". Try different keywords.`}
            action={{
                label: 'Clear Search',
                onClick: onClear,
            }}
        />
    );
}

export function NoFiltersMatch({ onClearFilters }: { onClearFilters: () => void }): React.ReactElement {
    return (
        <EmptyState
            icon={FileQuestion}
            title="No games match your filters"
            description="Try adjusting your filters to see more results"
            action={{
                label: 'Clear Filters',
                onClick: onClearFilters,
            }}
        />
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }): React.ReactElement {
    return (
        <EmptyState
            icon={AlertCircle}
            title="Something went wrong"
            description={message}
            action={
                onRetry !== undefined
                    ? {
                        label: 'Try Again',
                        onClick: onRetry,
                    }
                    : undefined
            }
        />
    );
}
