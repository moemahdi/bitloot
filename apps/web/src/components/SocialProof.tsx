'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Avatar, AvatarFallback } from '@/design-system/primitives/avatar';
import { Activity, Shield, Zap, CheckCircle, Clock, Sparkles } from 'lucide-react';

interface Purchase {
    id: string;
    initial: string;
    product: string;
    timeAgo: string;
    isNew?: boolean;
}

const MOCK_PURCHASES: Purchase[] = [
    { id: '1', initial: 'J', product: 'Cyberpunk 2077', timeAgo: '2 minutes ago' },
    { id: '2', initial: 'M', product: 'Elden Ring', timeAgo: '5 minutes ago' },
    { id: '3', initial: 'A', product: 'Red Dead Redemption 2', timeAgo: '8 minutes ago' },
    { id: '4', initial: 'S', product: 'GTA V', timeAgo: '12 minutes ago' },
];

const GAME_NAMES = ['Hogwarts Legacy', 'Starfield', 'Baldurs Gate 3', 'Spider-Man', 'God of War', 'Horizon Zero Dawn'];

export function LivePurchaseFeed(): React.ReactElement {
    const [purchases, setPurchases] = useState<Purchase[]>(MOCK_PURCHASES);

    // Crypto-safe random integer
    const getRandomInt = (max: number): number => {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0]! % max;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setPurchases((prev) => {
                const newPurchases = [...prev];
                newPurchases.unshift({
                    id: Date.now().toString(),
                    initial: String.fromCharCode(65 + getRandomInt(26)),
                    product: GAME_NAMES[getRandomInt(GAME_NAMES.length)] ?? 'Game Key',
                    timeAgo: 'Just now',
                    isNew: true,
                });
                return newPurchases.slice(0, 4);
            });
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="bg-bg-secondary border-border-subtle overflow-hidden">
            {/* Card Header with Live Indicator */}
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-text-primary text-base font-semibold">
                    <div className="relative">
                        <Activity className="w-4 h-4 text-green-success" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-success rounded-full animate-pulse" />
                    </div>
                    <span>Live Purchases</span>
                    <span className="ml-auto text-xs font-normal text-text-muted">Real-time</span>
                </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-1">
                <AnimatePresence mode="popLayout">
                    {purchases.map((purchase, index) => (
                        <motion.div
                            key={purchase.id}
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ 
                                duration: 0.25, 
                                ease: [0.25, 0.46, 0.45, 0.94],
                                delay: index * 0.05
                            }}
                            layout
                            className={`group flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 ${
                                purchase.isNew === true 
                                    ? 'bg-cyan-glow/5 border border-cyan-glow/20' 
                                    : 'hover:bg-bg-tertiary/50 border border-transparent'
                            }`}
                        >
                            {/* Avatar */}
                            <Avatar className={`w-8 h-8 border transition-all duration-200 ${
                                purchase.isNew === true 
                                    ? 'border-cyan-glow/50 shadow-glow-cyan-sm' 
                                    : 'border-border-subtle group-hover:border-cyan-glow/30'
                            }`}>
                                <AvatarFallback className="bg-bg-tertiary text-cyan-glow text-xs font-semibold">
                                    {purchase.initial}
                                </AvatarFallback>
                            </Avatar>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">
                                    <span className="font-medium text-text-secondary">Someone</span>
                                    {' purchased '}
                                    <span className="font-semibold text-cyan-glow">{purchase.product}</span>
                                </p>
                                <p className="flex items-center gap-1 text-xs text-text-muted">
                                    <Clock className="w-3 h-3" />
                                    {purchase.timeAgo}
                                </p>
                            </div>

                            {/* New Badge */}
                            {purchase.isNew === true && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-success/10 border border-green-success/30"
                                >
                                    <Sparkles className="w-3 h-3 text-green-success" />
                                    <span className="text-[10px] font-medium text-green-success">NEW</span>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

// Skeleton for loading state
export function LivePurchaseFeedSkeleton(): React.ReactElement {
    return (
        <Card className="bg-bg-secondary border-border-subtle">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded skeleton animate-shimmer" />
                    <div className="w-28 h-5 rounded skeleton animate-shimmer" />
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 px-3">
                        <div className="w-8 h-8 rounded-full skeleton animate-shimmer" />
                        <div className="flex-1 space-y-1.5">
                            <div className="w-3/4 h-4 rounded skeleton animate-shimmer" />
                            <div className="w-1/3 h-3 rounded skeleton animate-shimmer" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

interface TrustBadgeProps {
    icon: typeof Shield;
    title: string;
    description: string;
    accentColor?: 'cyan' | 'purple' | 'green';
}

export function TrustBadge({ 
    icon: Icon, 
    title, 
    description,
    accentColor = 'cyan'
}: TrustBadgeProps): React.ReactElement {
    const accents = {
        cyan: {
            iconBg: 'bg-cyan-glow/10',
            iconColor: 'text-cyan-glow',
            hoverBorder: 'group-hover:border-cyan-glow/30',
            hoverGlow: 'group-hover:shadow-glow-cyan-sm',
        },
        purple: {
            iconBg: 'bg-purple-neon/10',
            iconColor: 'text-purple-neon',
            hoverBorder: 'group-hover:border-purple-neon/30',
            hoverGlow: 'group-hover:shadow-glow-purple-sm',
        },
        green: {
            iconBg: 'bg-green-success/10',
            iconColor: 'text-green-success',
            hoverBorder: 'group-hover:border-green-success/30',
            hoverGlow: 'group-hover:shadow-glow-success',
        },
    };

    const accent = accents[accentColor];

    return (
        <motion.div
            whileHover={{ x: 4 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`group flex items-start gap-3 p-3 rounded-lg border border-transparent ${accent.hoverBorder} hover:bg-bg-tertiary/30 transition-all duration-200`}
        >
            {/* Icon */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${accent.iconBg} shrink-0 transition-all duration-200 ${accent.hoverGlow}`}>
                <Icon className={`w-5 h-5 ${accent.iconColor}`} />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-primary text-sm mb-0.5">
                    {title}
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}

export function TrustSection(): React.ReactElement {
    return (
        <Card className="bg-bg-secondary border-border-subtle">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-text-primary text-base font-semibold">
                    <Shield className="w-4 h-4 text-purple-neon" />
                    Why BitLoot?
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
                <TrustBadge
                    icon={Shield}
                    title="256-bit Encryption"
                    description="Bank-grade security for all transactions"
                    accentColor="purple"
                />
                <TrustBadge
                    icon={Zap}
                    title="Instant Delivery"
                    description="Keys delivered in under 30 seconds"
                    accentColor="cyan"
                />
                <TrustBadge
                    icon={CheckCircle}
                    title="Verified Keys"
                    description="100% authentic from official sources"
                    accentColor="green"
                />
            </CardContent>
        </Card>
    );
}
