'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DashboardStatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        direction: 'up' | 'down';
    };
    color?: 'cyan' | 'purple' | 'green' | 'orange';
    delay?: number;
}

const colorMap = {
    cyan: {
        bg: 'bg-cyan-glow/10',
        text: 'text-cyan-glow',
        border: 'border-cyan-glow/20',
        iconBg: 'bg-cyan-glow/20',
    },
    purple: {
        bg: 'bg-purple-neon/10',
        text: 'text-purple-neon',
        border: 'border-purple-neon/20',
        iconBg: 'bg-purple-neon/20',
    },
    green: {
        bg: 'bg-green-success/10',
        text: 'text-green-success',
        border: 'border-green-success/20',
        iconBg: 'bg-green-success/20',
    },
    orange: {
        bg: 'bg-orange-warning/10',
        text: 'text-orange-warning',
        border: 'border-orange-warning/20',
        iconBg: 'bg-orange-warning/20',
    },
};

export function DashboardStatCard({
    title,
    value,
    icon: Icon,
    trend,
    color = 'cyan',
    delay = 0,
}: DashboardStatCardProps): React.ReactElement {
    const styles = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={`relative overflow-hidden rounded-xl border ${styles.border} ${styles.bg} p-6 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-${color}-glow/10`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-text-secondary">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold font-display tracking-tight text-text-primary">
                        {value}
                    </h3>
                </div>
                <div className={`rounded-full p-3 ${styles.iconBg}`}>
                    <Icon className={`h-5 w-5 ${styles.text}`} />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <div
                        className={`flex items-center text-xs font-medium ${trend.direction === 'up' ? 'text-green-success' : 'text-orange-warning'
                            }`}
                    >
                        {trend.direction === 'up' ? (
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                        ) : (
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                        )}
                        {Math.abs(trend.value)}%
                    </div>
                    <p className="text-xs text-text-muted">{trend.label}</p>
                </div>
            )}

            {/* Decorative glow */}
            <div
                className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${styles.bg} blur-2xl opacity-50`}
            />
        </motion.div>
    );
}
