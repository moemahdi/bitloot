'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    value: string;
    label: string;
    accentColor?: 'cyan' | 'purple' | 'green' | 'pink';
    isLoading?: boolean;
}

export function StatCard({ 
    icon: Icon, 
    value, 
    label, 
    accentColor = 'cyan',
    isLoading = false 
}: StatCardProps): React.ReactElement {
    const accentStyles = {
        cyan: {
            icon: 'text-cyan-glow',
            iconBg: 'bg-cyan-glow/10',
            border: 'group-hover:border-cyan-glow/50',
            glow: 'group-hover:shadow-glow-cyan-sm',
        },
        purple: {
            icon: 'text-purple-neon',
            iconBg: 'bg-purple-neon/10',
            border: 'group-hover:border-purple-neon/50',
            glow: 'group-hover:shadow-glow-purple-sm',
        },
        green: {
            icon: 'text-green-success',
            iconBg: 'bg-green-success/10',
            border: 'group-hover:border-green-success/50',
            glow: 'group-hover:shadow-glow-success',
        },
        pink: {
            icon: 'text-pink-featured',
            iconBg: 'bg-pink-featured/10',
            border: 'group-hover:border-pink-featured/50',
            glow: 'group-hover:shadow-glow-pink',
        },
    };

    const accent = accentStyles[accentColor];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center gap-3 px-6 py-5 bg-bg-secondary/50 backdrop-blur-sm rounded-lg border border-border-subtle">
                <div className="w-10 h-10 rounded-lg skeleton animate-shimmer" />
                <div className="w-16 h-7 rounded skeleton animate-shimmer" />
                <div className="w-20 h-4 rounded skeleton animate-shimmer" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`group flex flex-col items-center gap-3 px-6 py-5 bg-bg-secondary/50 backdrop-blur-sm rounded-lg border border-border-subtle ${accent.border} ${accent.glow} transition-all duration-200`}
        >
            {/* Icon Container */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${accent.iconBg} transition-colors duration-200`}>
                <Icon className={`w-5 h-5 ${accent.icon}`} />
            </div>
            
            {/* Value */}
            <span className="text-2xl font-bold text-text-primary tracking-tight">
                {value}
            </span>
            
            {/* Label */}
            <span className="text-sm text-text-muted">
                {label}
            </span>
        </motion.div>
    );
}

// Skeleton variant for loading states
export function StatCardSkeleton(): React.ReactElement {
    return (
        <div className="flex flex-col items-center gap-3 px-6 py-5 bg-bg-secondary/50 backdrop-blur-sm rounded-lg border border-border-subtle">
            <div className="w-10 h-10 rounded-lg skeleton animate-shimmer" />
            <div className="w-16 h-7 rounded skeleton animate-shimmer" />
            <div className="w-20 h-4 rounded skeleton animate-shimmer" />
        </div>
    );
}
