'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    value: string;
    label: string;
}

export function StatCard({ icon: Icon, value, label }: StatCardProps): React.ReactElement {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-2 px-6 py-4 bg-bg-secondary/50 backdrop-blur-sm rounded-lg border border-border-subtle hover:border-cyan-glow/50 transition-all"
        >
            <Icon className="w-6 h-6 text-cyan-glow" />
            <span className="text-2xl font-display font-bold text-white">{value}</span>
            <span className="text-sm text-text-muted">{label}</span>
        </motion.div>
    );
}
